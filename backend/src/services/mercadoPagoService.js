const config = require('../config');
const { HttpError } = require('../utils/errors');

const MERCADOPAGO_API_BASE_URL = 'https://api.mercadopago.com';

function assertConfigured() {
  if (!config.mercadoPago.accessToken) {
    throw new HttpError(503, 'Mercado Pago no está configurado. Falta MERCADOPAGO_ACCESS_TOKEN.');
  }
}

function buildBackUrl(path) {
  const publicUrl = config.publicAppUrl || config.mercadoPago.successUrl;
  if (!publicUrl) {
    return undefined;
  }
  return new URL(path, publicUrl).toString();
}

async function mercadoPagoRequest(path, { method = 'GET', body } = {}) {
  assertConfigured();
  const response = await fetch(`${MERCADOPAGO_API_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.mercadoPago.accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.message || data?.error || 'Mercado Pago rechazó la solicitud';
    throw new HttpError(response.status, message);
  }
  return data;
}

async function createSubscription({ tenant, plan, payerEmail }) {
  const amount = plan.priceAmount ?? plan.priceUsdMonthly;
  if (!amount || amount <= 0) {
    throw new HttpError(400, 'El plan seleccionado no tiene precio mensual automático.');
  }

  const body = {
    reason: `${plan.name} - ${tenant.name}`,
    external_reference: String(tenant.id),
    payer_email: payerEmail,
    auto_recurring: {
      frequency: 1,
      frequency_type: plan.billingPeriod || 'months',
      transaction_amount: amount,
      currency_id: plan.currency || config.mercadoPago.currency
    },
    back_url: config.mercadoPago.successUrl || buildBackUrl('/pago/exitoso'),
    status: 'pending'
  };

  const notificationUrl = config.mercadoPago.notificationUrl || buildBackUrl('/api/webhooks/mercadopago');
  if (notificationUrl) {
    body.notification_url = notificationUrl;
  }

  return mercadoPagoRequest('/preapproval', { method: 'POST', body });
}

async function getSubscription(preapprovalId) {
  return mercadoPagoRequest(`/preapproval/${encodeURIComponent(preapprovalId)}`);
}

module.exports = { createSubscription, getSubscription };
