const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { requireAuth } = require('../middlewares/auth');
const { HttpError } = require('../utils/errors');
const Item = require('../models/Item');
const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const { serializePlan } = require('../services/licenseSerializer');

const router = express.Router();

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'Administrador') {
      throw new HttpError(403, 'Solo un administrador puede gestionar planes');
    }
    next();
  });
}

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
  requireAdmin,
  asyncHandler(async (req, res) => {
    const plans = await SubscriptionPlan.find({}).sort({ priceAmount: 1, productLimit: 1, code: 1 });
    res.json(plans.map(serializePlan));
  })
);

router.put(
  '/plans/:code',
  requireAdmin,
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
