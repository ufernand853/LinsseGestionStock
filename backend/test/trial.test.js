const test = require('node:test');
const assert = require('node:assert/strict');

const config = require('../src/config');
const { createTrialEndDate, normalizeRegistrationInput } = require('../src/services/billingService');
const { buildSubscriptionPayload } = require('../src/services/mercadoPagoService');

test('calcula el final de la prueba siete dias despues', () => {
  const startedAt = new Date('2026-08-19T12:00:00.000Z');
  assert.equal(createTrialEndDate(startedAt).toISOString(), '2026-08-26T12:00:00.000Z');
});

test('normaliza y valida los datos de un registro publico', () => {
  const result = normalizeRegistrationInput({ companyName: ' Comercio ', billingEmail: ' DUEÑO@Example.com ', username: ' admin ', password: 'secreto1', planCode: 'basic' });
  assert.deepEqual(result, { companyName: 'Comercio', billingEmail: 'dueño@example.com', username: 'admin', password: 'secreto1', planCode: 'BASIC' });
  assert.throws(() => normalizeRegistrationInput({ companyName: 'A', billingEmail: 'mal', username: 'u', password: 'corta', planCode: 'BASIC' }), /email no es valido/);
  assert.throws(() => normalizeRegistrationInput({ companyName: 'A', billingEmail: 'a@b.com', username: 'u', password: 'corta', planCode: 'BASIC' }), /al menos 8/);
});

test('envia el periodo gratuito a Mercado Pago', () => {
  const payload = buildSubscriptionPayload({
    tenant: { id: 'tenant-1', name: 'Comercio demo' },
    plan: { name: 'Basico', priceAmount: 390, currency: 'UYU', billingPeriod: 'months' },
    payerEmail: 'cliente@example.com'
  });

  assert.deepEqual(payload.auto_recurring.free_trial, {
    frequency: config.billingTrialDays,
    frequency_type: 'days'
  });
  assert.equal(payload.auto_recurring.transaction_amount, 390);
});
