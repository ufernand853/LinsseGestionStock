export function formatPlanLimit(plan) {
  if (!plan) {
    return 'Sin plan';
  }
  if (!plan.productLimit) {
    return 'Sin límite de productos';
  }
  return `Hasta ${plan.productLimit} productos`;
}

export function formatCurrency(amount, currency = 'UYU') {
  if (amount === null || amount === undefined) {
    return null;
  }
  try {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(amount);
  } catch (error) {
    return `${currency} ${amount}`;
  }
}

export function formatPlanPrice(plan) {
  if (!plan) {
    return null;
  }
  if (plan.priceAmount !== null && plan.priceAmount !== undefined) {
    return `${formatCurrency(plan.priceAmount, plan.currency || 'UYU')} / mes`;
  }
  if (plan.priceUsdMonthly !== null && plan.priceUsdMonthly !== undefined) {
    return `USD ${plan.priceUsdMonthly} / mes`;
  }
  return 'A medida';
}

export function formatLicensePlan(license) {
  const plan = license?.plan;
  if (!plan) {
    return 'Sin licencia';
  }
  const limitLabel = formatPlanLimit(plan);
  return `${plan.name} · ${limitLabel}`;
}

export function formatLicensePrice(license) {
  return formatPlanPrice(license?.plan);
}
