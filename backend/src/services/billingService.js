const bcrypt = require('bcryptjs');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Role = require('../models/Role');
const Subscription = require('../models/Subscription');
const BillingEvent = require('../models/BillingEvent');
const { HttpError } = require('../utils/errors');
const mercadoPagoService = require('./mercadoPagoService');
const { serializePlan } = require('./licenseSerializer');

function mapMercadoPagoStatus(status) {
  switch (status) {
    case 'authorized':
      return { subscription: 'active', tenant: 'active' };
    case 'pending':
      return { subscription: 'pending', tenant: 'trialing' };
    case 'paused':
      return { subscription: 'paused', tenant: 'past_due' };
    case 'cancelled':
    case 'canceled':
      return { subscription: 'canceled', tenant: 'canceled' };
    case 'rejected':
      return { subscription: 'rejected', tenant: 'past_due' };
    default:
      return { subscription: 'pending', tenant: 'trialing' };
  }
}

async function listPublicPlans() {
  const plans = await SubscriptionPlan.find({ isActive: true }).sort({ priceAmount: 1, productLimit: 1 });
  return plans.map(serializePlan);
}

async function createMercadoPagoSubscription({ tenant, plan, payerEmail }) {
  const mpSubscription = await mercadoPagoService.createSubscription({ tenant, plan, payerEmail });
  const subscription = await Subscription.create({
    tenant: tenant.id,
    plan: plan.id,
    providerSubscriptionId: mpSubscription.id || null,
    initPoint: mercadoPagoService.getSubscriptionCheckoutUrl(mpSubscription),
    status: mapMercadoPagoStatus(mpSubscription.status).subscription,
    payerEmail,
    amount: plan.priceAmount,
    currency: plan.currency,
    rawProviderData: mpSubscription
  });
  tenant.mercadoPagoSubscriptionId = subscription.providerSubscriptionId;
  tenant.subscriptionStatus = mapMercadoPagoStatus(mpSubscription.status).tenant;
  await tenant.save();
  return subscription;
}

async function retryExistingRegistration({ existingUser, companyName, password, plan, payerEmail }) {
  const validPassword = await bcrypt.compare(password, existingUser.passwordHash);
  if (!validPassword) {
    throw new HttpError(400, 'Ya existe un usuario con ese email. Indicá la contraseña correcta para reintentar el pago.');
  }
  const tenant = await Tenant.findById(existingUser.tenant);
  if (!tenant) {
    throw new HttpError(400, 'El usuario ya existe pero no tiene una cuenta SaaS asociada.');
  }
  if (tenant.subscriptionStatus === 'active') {
    throw new HttpError(400, 'Ya existe una cuenta activa con ese email.');
  }

  tenant.name = companyName || tenant.name;
  tenant.billingEmail = payerEmail;
  tenant.plan = plan.id;

  let subscription = await Subscription.findOne({
    tenant: tenant.id,
    plan: plan.id,
    status: { $in: ['pending', 'rejected', 'past_due'] },
    initPoint: { $ne: null }
  }).sort({ createdAt: -1 });

  if (!subscription && plan.priceAmount) {
    subscription = await createMercadoPagoSubscription({ tenant, plan, payerEmail });
  } else {
    await tenant.save();
  }

  return {
    tenant,
    user: existingUser,
    plan,
    subscription,
    checkoutUrl: subscription?.initPoint || null
  };
}

async function registerTenant({ companyName, billingEmail, username, password, planCode }) {
  if (!companyName || !billingEmail || !username || !password || !planCode) {
    throw new HttpError(400, 'Empresa, email, usuario, contraseña y plan son obligatorios');
  }
  const normalizedEmail = billingEmail.toLowerCase().trim();
  const normalizedPlanCode = planCode.toUpperCase().trim();
  const plan = await SubscriptionPlan.findOne({ code: normalizedPlanCode, isActive: true });
  if (!plan) {
    throw new HttpError(400, 'Plan inválido o inactivo');
  }
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return retryExistingRegistration({ existingUser, companyName, password, plan, payerEmail: normalizedEmail });
  }
  const adminRole = await Role.findOne({ name: 'Administrador' });
  if (!adminRole) {
    throw new HttpError(500, 'No existe el rol Administrador. Ejecutá el seed inicial.');
  }
  const tenant = await Tenant.create({
    name: companyName,
    billingEmail: normalizedEmail,
    plan: plan.id,
    subscriptionStatus: plan.priceAmount ? 'trialing' : 'active'
  });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    username,
    email: normalizedEmail,
    passwordHash,
    role: adminRole.id,
    tenant: tenant.id,
    status: 'active'
  });

  let checkoutUrl = null;
  let subscription = null;
  if (plan.priceAmount) {
    subscription = await createMercadoPagoSubscription({ tenant, plan, payerEmail: normalizedEmail });
    checkoutUrl = subscription.initPoint;
  }

  return { tenant, user, plan, subscription, checkoutUrl };
}

async function refreshMercadoPagoSubscription(preapprovalId, payload = null) {
  const providerData = preapprovalId ? await mercadoPagoService.getSubscription(preapprovalId) : payload;
  if (!providerData?.id) {
    throw new HttpError(400, 'Notificación de Mercado Pago sin identificador de suscripción');
  }
  const mapped = mapMercadoPagoStatus(providerData.status);
  const subscription = await Subscription.findOneAndUpdate(
    { providerSubscriptionId: providerData.id },
    {
      $set: {
        status: mapped.subscription,
        rawProviderData: providerData,
        currentPeriodEndsAt: providerData.next_payment_date ? new Date(providerData.next_payment_date) : null,
        canceledAt: mapped.subscription === 'canceled' ? new Date() : null
      }
    },
    { new: true }
  ).populate('tenant plan');

  if (subscription?.tenant) {
    subscription.tenant.subscriptionStatus = mapped.tenant;
    subscription.tenant.currentPeriodEndsAt = subscription.currentPeriodEndsAt;
    await subscription.tenant.save();
  }
  return subscription;
}

async function recordWebhook({ eventType, externalId, payload }) {
  const event = await BillingEvent.create({ provider: 'mercadopago', eventType, externalId, payload });
  try {
    const preapprovalId = payload?.data?.id || payload?.id || externalId;
    if (eventType.includes('preapproval') || payload?.type?.includes('preapproval')) {
      const subscription = await refreshMercadoPagoSubscription(preapprovalId);
      event.subscription = subscription?.id || null;
      event.tenant = subscription?.tenant?.id || null;
      event.status = subscription ? 'processed' : 'ignored';
    } else {
      event.status = 'ignored';
    }
    event.processedAt = new Date();
  } catch (error) {
    event.status = 'failed';
    event.errorMessage = error.message;
  }
  await event.save();
  return event;
}

module.exports = { listPublicPlans, registerTenant, recordWebhook, refreshMercadoPagoSubscription };
