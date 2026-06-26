export function formatLicensePlan(license) {
  const plan = license?.plan;
  if (!plan) {
    return 'Sin licencia';
  }
  const limit = Number.isFinite(plan.productLimit) ? `Hasta ${plan.productLimit} productos` : 'Sin límite de productos';
  return `${plan.name} · ${limit}`;
}

export function formatLicensePrice(license) {
  const plan = license?.plan;
  if (!plan) {
    return '';
  }
  if (plan.priceUsdMonthly === null || plan.priceUsdMonthly === undefined) {
    return 'Plan a medida';
  }
  return `USD ${plan.priceUsdMonthly} / mes`;
}
