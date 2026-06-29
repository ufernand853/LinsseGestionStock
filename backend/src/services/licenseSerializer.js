function serializePlan(plan) {
  if (!plan) {
    return null;
  }
  return {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    priceAmount: plan.priceAmount,
    currency: plan.currency,
    priceUsdMonthly: plan.priceUsdMonthly,
    productLimit: plan.productLimit,
    description: plan.description,
    ctaLabel: plan.ctaLabel,
    billingPeriod: plan.billingPeriod,
    isActive: plan.isActive
  };
}

function serializeLicense(tenant) {
  if (!tenant) {
    return null;
  }
  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    status: tenant.subscriptionStatus,
    trialEndsAt: tenant.trialEndsAt,
    currentPeriodEndsAt: tenant.currentPeriodEndsAt,
    mercadoPagoSubscriptionId: tenant.mercadoPagoSubscriptionId || null,
    plan: serializePlan(tenant.plan)
  };
}

module.exports = { serializePlan, serializeLicense };
