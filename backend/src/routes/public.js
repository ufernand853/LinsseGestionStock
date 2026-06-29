const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const billingService = require('../services/billingService');

const router = express.Router();

router.get(
  '/plans',
  asyncHandler(async (req, res) => {
    const plans = await billingService.listPublicPlans();
    res.json(plans);
  })
);

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const result = await billingService.registerTenant(req.body || {});
    res.status(201).json({
      tenantId: result.tenant.id,
      userId: result.user.id,
      plan: {
        code: result.plan.code,
        name: result.plan.name,
        priceAmount: result.plan.priceAmount,
        currency: result.plan.currency,
        productLimit: result.plan.productLimit
      },
      checkoutUrl: result.checkoutUrl,
      subscriptionId: result.subscription?.id || null,
      providerSubscriptionId: result.subscription?.providerSubscriptionId || null,
      message: result.checkoutUrl
        ? 'Cuenta creada. Redirigí al cliente a Mercado Pago para activar la suscripción.'
        : 'Cuenta creada. El plan requiere contacto comercial para activar la licencia.'
    });
  })
);

module.exports = router;
