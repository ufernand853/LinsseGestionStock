const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { HttpError } = require('../utils/errors');
const billingService = require('../services/billingService');
const EnterpriseLead = require('../models/EnterpriseLead');

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

router.post(
  '/enterprise-contact',
  asyncHandler(async (req, res) => {
    const { company, contact, email, phone, message } = req.body || {};
    if (!company || !contact || !email) {
      throw new HttpError(400, 'Empresa, contacto y email son obligatorios');
    }
    const lead = await EnterpriseLead.create({
      company,
      contact,
      email,
      phone,
      message,
      planCode: 'ENTERPRISE',
      source: 'pricing'
    });
    res.status(201).json({
      id: lead.id,
      message: 'Consulta recibida. Te contactaremos para coordinar la demo.'
    });
  })
);

module.exports = router;
