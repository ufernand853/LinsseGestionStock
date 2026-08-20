const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { requireAuth } = require('../middlewares/auth');
const { HttpError } = require('../utils/errors');
const Item = require('../models/Item');
const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const config = require('../config');
const { serializePlan } = require('../services/licenseSerializer');

const router = express.Router();

function requirePlanManager(req, res, next) {
  requireAuth(req, res, () => {
    const userEmail = String(req.user?.email || '').trim().toLowerCase();
    if (userEmail !== config.adminEmail.toLowerCase()) {
      throw new HttpError(403, 'Solo el administrador principal puede gestionar la plataforma');
    }
    next();
  });
}

router.get(
  '/registrations',
  requirePlanManager,
  asyncHandler(async (req, res) => {
    const tenants = await Tenant.find({}).populate('plan').sort({ createdAt: -1 }).lean();
    const tenantIds = tenants.map(tenant => tenant._id);
    const users = await User.find({ tenant: { $in: tenantIds } }).select('tenant username email status lastLoginAt createdAt').lean();
    const usersByTenant = new Map();
    for (const user of users) {
      const key = String(user.tenant);
      const current = usersByTenant.get(key) || [];
      current.push(user);
      usersByTenant.set(key, current);
    }
    res.json(tenants.map(tenant => {
      const tenantUsers = usersByTenant.get(String(tenant._id)) || [];
      const owner = tenantUsers.find(user => user.email === tenant.billingEmail) || tenantUsers[0] || null;
      return {
        id: String(tenant._id),
        companyName: tenant.name,
        billingEmail: tenant.billingEmail,
        username: owner?.username || null,
        plan: tenant.plan ? { code: tenant.plan.code, name: tenant.plan.name } : null,
        subscriptionStatus: tenant.subscriptionStatus,
        registeredAt: tenant.createdAt,
        trialEndsAt: tenant.trialEndsAt,
        lastLoginAt: owner?.lastLoginAt || null,
        userCount: tenantUsers.length
      };
    }));
  })
);

function normalizeNullableNumber(value, fieldName, { integer = false, min = 0 } = {}) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === '') {
    return null;
  }
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < min || (integer && !Number.isInteger(numberValue))) {
    throw new HttpError(400, `${fieldName} debe ser un numero valido`);
  }
  return numberValue;
}

router.get(
  '/plans',
  requirePlanManager,
  asyncHandler(async (req, res) => {
    const plans = await SubscriptionPlan.find({}).sort({ priceAmount: 1, productLimit: 1, code: 1 });
    res.json(plans.map(serializePlan));
  })
);

router.put(
  '/plans/:code',
  requirePlanManager,
  asyncHandler(async (req, res) => {
    const normalizedCode = String(req.params.code || '').trim().toUpperCase();
    const plan = await SubscriptionPlan.findOne({ code: normalizedCode });
    if (!plan) {
      throw new HttpError(404, 'Plan no encontrado');
    }

    const { name, currency, billingPeriod, description, ctaLabel, isActive } = req.body || {};
    const priceAmount = normalizeNullableNumber(req.body?.priceAmount, 'priceAmount');
    const priceUsdMonthly = normalizeNullableNumber(req.body?.priceUsdMonthly, 'priceUsdMonthly');
    const productLimit = normalizeNullableNumber(req.body?.productLimit, 'productLimit', { integer: true, min: 1 });

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        throw new HttpError(400, 'El nombre del plan es obligatorio');
      }
      plan.name = trimmedName;
    }
    if (currency !== undefined) {
      const normalizedCurrency = String(currency).trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
        throw new HttpError(400, 'La moneda debe tener 3 letras');
      }
      plan.currency = normalizedCurrency;
    }
    if (billingPeriod !== undefined) {
      plan.billingPeriod = billingPeriod;
    }
    if (description !== undefined) {
      plan.description = String(description).trim();
    }
    if (ctaLabel !== undefined) {
      const trimmedCtaLabel = String(ctaLabel).trim();
      if (!trimmedCtaLabel) {
        throw new HttpError(400, 'El texto del boton es obligatorio');
      }
      plan.ctaLabel = trimmedCtaLabel;
    }
    if (priceAmount !== undefined) {
      plan.priceAmount = priceAmount;
    }
    if (priceUsdMonthly !== undefined) {
      plan.priceUsdMonthly = priceUsdMonthly;
    }
    if (productLimit !== undefined) {
      plan.productLimit = productLimit;
    }
    if (isActive !== undefined) {
      plan.isActive = Boolean(isActive);
    }

    await plan.save();
    res.json(serializePlan(plan));
  })
);

router.get(
  '/license',
  requireAuth,
  asyncHandler(async (req, res) => {
    const tenantId = req.user.tenantId;
    const usedProducts = tenantId ? await Item.countDocuments({ tenant: tenantId, deletedAt: null }) : 0;
    const subscription = tenantId
      ? await Subscription.findOne({ tenant: tenantId }).sort({ createdAt: -1 }).populate('plan')
      : null;
    res.json({
      license: req.user.license,
      usedProducts,
      subscription: subscription
        ? {
            id: subscription.id,
            provider: subscription.provider,
            status: subscription.status,
            amount: subscription.amount,
            currency: subscription.currency,
            currentPeriodEndsAt: subscription.currentPeriodEndsAt,
            initPoint: subscription.initPoint
          }
        : null
    });
  })
);

module.exports = router;
