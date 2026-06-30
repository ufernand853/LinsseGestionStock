const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const billingService = require('../services/billingService');

const router = express.Router();

router.post(
  '/mercadopago',
  asyncHandler(async (req, res) => {
    const payload = req.body || {};
    const eventType = payload.type || payload.action || req.query.type || 'unknown';
    const externalId = payload?.data?.id || payload.id || req.query.id || null;
    const event = await billingService.recordWebhook({ eventType, externalId, payload });
    res.json({ received: true, status: event.status });
  })
);

module.exports = router;
