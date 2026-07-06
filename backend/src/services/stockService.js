const mongoose = require('mongoose');
const Item = require('../models/Item');
const Location = require('../models/Location');
const MovementLog = require('../models/MovementLog');
const { HttpError } = require('../utils/errors');

const ZERO_QUANTITY = Object.freeze({ boxes: 0, units: 0 });

function parseQuantityComponent(value, label) {
  if (value === undefined || value === null || value === '') {
    return 0;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0 || !Number.isInteger(numeric)) {
    throw new HttpError(400, `${label} debe ser un numero entero mayor o igual a 0`);
  }
  return numeric;
}

function normalizeQuantityInput(value, { allowZero = false, fieldName = 'Cantidad' } = {}) {
  if (value === undefined || value === null || value === '') {
    if (allowZero) {
      return { ...ZERO_QUANTITY };
    }
    throw new HttpError(400, `${fieldName} es obligatoria`);
  }

  if (typeof value === 'number' || typeof value === 'string') {
    const units = parseQuantityComponent(value, `${fieldName} (unidades)`);
    if (!allowZero && units === 0) {
      throw new HttpError(400, 'La cantidad debe ser mayor a 0');
    }
    return { boxes: 0, units };
  }

  if (typeof value !== 'object') {
    throw new HttpError(400, `${fieldName} invalida`);
  }

  const boxes = parseQuantityComponent(value.boxes, `${fieldName}: cajas`);
  const units = parseQuantityComponent(value.units, `${fieldName}: unidades`);

  if (!allowZero && boxes === 0 && units === 0) {
    throw new HttpError(400, 'La cantidad debe ser mayor a 0');
  }

  return { boxes, units };
}

function normalizeStoredQuantity(value) {
  if (value === undefined || value === null) {
    return { ...ZERO_QUANTITY };
  }
  try {
    return normalizeQuantityInput(value, { allowZero: true });
  } catch (error) {
    return { ...ZERO_QUANTITY };
  }
}

function negateQuantity(quantity) {
  return { boxes: -quantity.boxes, units: -quantity.units };
}

function combineQuantities(base, delta, errorMessage = 'Stock insuficiente') {
  const boxes = base.boxes + delta.boxes;
  const units = base.units + delta.units;
  if (boxes < 0 || units < 0) {
    throw new HttpError(400, errorMessage);
  }
  return { boxes, units };
}

function isZeroQuantity(quantity) {
  return quantity.boxes === 0 && quantity.units === 0;
}

function buildTenantMatch(tenantId) {
  return tenantId ? { tenant: tenantId } : { tenant: null };
}

async function findItemOrThrow(itemId, tenantId) {
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    throw new HttpError(404, 'Articulo no encontrado');
  }
  const item = await Item.findOne({ _id: itemId, deletedAt: null, ...buildTenantMatch(tenantId) });
  if (!item) {
    throw new HttpError(404, 'Articulo no encontrado');
  }
  return item;
}

async function ensureLocationExists(
  locationId,
  {
    tenantId,
    allowedTypes = null,
    invalidTypeMessage = 'La ubicacion seleccionada no es valida para esta operacion'
  } = {}
) {
  if (!mongoose.Types.ObjectId.isValid(locationId)) {
    throw new HttpError(404, 'Ubicacion no encontrada');
  }
  const location = await Location.findOne({ _id: locationId, ...buildTenantMatch(tenantId) });
  if (!location) {
    throw new HttpError(404, 'Ubicacion no encontrada');
  }
  if (location.status === 'inactive') {
    throw new HttpError(400, 'La ubicacion esta inactiva');
  }
  if (Array.isArray(allowedTypes) && allowedTypes.length > 0 && !allowedTypes.includes(location.type)) {
    throw new HttpError(400, invalidTypeMessage);
  }
  return location;
}

function adjustItemStock(item, locationId, delta) {
  if (!item.stock) {
    item.stock = {};
  }
  let stockMap;
  if (item.stock instanceof Map) {
    stockMap = item.stock;
  } else {
    stockMap = new Map(Object.entries(item.stock || {}));
    item.stock = stockMap;
  }
  const current = normalizeStoredQuantity(stockMap.get(locationId));
  const updated = combineQuantities(current, delta, 'Stock insuficiente en la ubicacion seleccionada');
  if (isZeroQuantity(updated)) {
    stockMap.delete(locationId);
  } else {
    stockMap.set(locationId, updated);
  }
  item.markModified('stock');
}

function sanitizeMetadata(metadata = {}) {
  return Object.entries(metadata).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc;
    }
    acc[key] = String(value);
    return acc;
  }, {});
}

async function addMovementLog(movementRequestId, action, actorUserId, metadata = {}, tenantId) {
  await MovementLog.create({
    tenant: tenantId,
    movementRequest: movementRequestId,
    action,
    actor: actorUserId,
    timestamp: new Date(),
    metadata: sanitizeMetadata(metadata)
  });
}

function inferMovementType(fromLocation, toLocation) {
  if (fromLocation?.type === 'externalOrigin') {
    return 'ingress';
  }
  if (toLocation?.type === 'external') {
    return 'egress';
  }
  return 'transfer';
}

async function executeMovement(request, actorUserId, metadata = {}) {
  const item = await findItemOrThrow(request.item, request.tenant);
  const quantity = normalizeStoredQuantity(request.quantity);

  const fromLocationId = request.fromLocation?.toString();
  const toLocationId = request.toLocation?.toString();
  if (!fromLocationId || !toLocationId) {
    throw new HttpError(400, 'Los movimientos requieren ubicaciones de origen y destino validas');
  }

  const [fromLocation, toLocation] = await Promise.all([
    ensureLocationExists(fromLocationId, { tenantId: request.tenant }),
    ensureLocationExists(toLocationId, { tenantId: request.tenant })
  ]);

  const movementType = inferMovementType(fromLocation, toLocation);
  request.type = movementType;

  if (movementType !== 'ingress') {
    adjustItemStock(item, fromLocationId, negateQuantity(quantity));
  }

  if (movementType !== 'egress') {
    adjustItemStock(item, toLocationId, quantity);
  }
  await item.save();

  request.status = 'executed';
  if (!request.approvedBy) {
    request.approvedBy = actorUserId;
  }
  if (!request.approvedAt) {
    request.approvedAt = new Date();
  }
  request.executedAt = new Date();
  await request.save();
  await addMovementLog(request.id, 'executed', actorUserId, metadata, request.tenant);
}

async function validateMovementPayload(payload, tenantId) {
  if (!payload.itemId) {
    throw new HttpError(400, 'Debe indicarse itemId');
  }

  if (payload.type && payload.type !== 'transfer') {
    throw new HttpError(400, 'No es necesario indicar el tipo de movimiento');
  }

  const quantity = normalizeQuantityInput(payload.quantity, { fieldName: 'Cantidad' });

  const fromLocationId = payload.fromLocation || payload.fromDeposit;
  const toLocationId = payload.toLocation || payload.toDeposit;

  if (!fromLocationId) {
    throw new HttpError(400, 'Debe indicarse la ubicacion de origen');
  }
  if (!toLocationId) {
    throw new HttpError(400, 'Debe indicarse la ubicacion de destino');
  }
  if (fromLocationId === toLocationId) {
    throw new HttpError(400, 'La ubicacion de origen y destino no pueden ser la misma');
  }

  const [fromLocation, toLocation] = await Promise.all([
    ensureLocationExists(fromLocationId, {
      tenantId,
      allowedTypes: ['warehouse', 'externalOrigin'],
      invalidTypeMessage: 'La ubicacion de origen debe ser un deposito interno o un origen externo valido'
    }),
    ensureLocationExists(toLocationId, {
      tenantId,
      allowedTypes: ['warehouse', 'external'],
      invalidTypeMessage: 'La ubicacion de destino debe ser un deposito interno o un destino externo valido'
    })
  ]);

  return {
    quantity,
    fromLocation,
    toLocation
  };
}

module.exports = {
  validateMovementPayload,
  executeMovement,
  addMovementLog,
  findItemOrThrow,
  ensureLocationExists,
  normalizeQuantityInput,
  normalizeStoredQuantity
};
