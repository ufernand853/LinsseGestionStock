const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { requireAuth } = require('../middlewares/auth');
const Item = require('../models/Item');
const Subscription = require('../models/Subscription');

const router = express.Router();

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
