const Role = require('../models/Role');
const Group = require('../models/Group');

const defaultRoles = [
  {
    name: 'Administrador',
    permissions: [
      'items.read',
      'items.write',
      'stock.request',
      'stock.approve',
      'stock.logs.read',
      'users.read',
      'users.write',
      'reports.read'
    ]
  },
  {
    name: 'Operador',
    permissions: ['items.read', 'items.write', 'stock.request', 'reports.read']
  },
  {
    name: 'Supervisor',
    permissions: ['items.read', 'stock.request', 'reports.read']
  },
  {
    name: 'Consulta',
    permissions: ['items.read', 'reports.read']
  }
];

const defaultGroups = [
  'MEDIAS',
  'ROPA INTERIOR',
  'MANIQUI',
  'BLANCOS',
  'ACCESORIOS',
  'JEAN HOMBRE',
  'JEAN DAMA',
  'JEAN NINO/A',
  'ROPA HOMBRE',
  'ROPA DAMA',
  'ROPA NINO/A',
  'CALZADO',
  'ELECTRONICOS Y BAZAR',
  'JUGUETES',
  'ESCOLARES',
  'SOBRESTOCK GENERAL',
  'SOBRESTOCK THIBE',
  'SOBRESTOCK ARENAL IMPORT',
  'CLIENTES'
];

async function ensureTenantRoles(tenantId) {
  for (const role of defaultRoles) {
    await Role.updateOne(
      { tenant: tenantId, name: role.name },
      { $set: { permissions: role.permissions } },
      { upsert: true }
    );
  }
}

async function ensureTenantGroups(tenantId) {
  for (const groupName of defaultGroups) {
    await Group.updateOne(
      { tenant: tenantId, name: groupName },
      { $setOnInsert: { parent: null } },
      { upsert: true }
    );
  }
}

async function ensureTenantSeedData(tenantId) {
  await ensureTenantRoles(tenantId);
  await ensureTenantGroups(tenantId);
}

module.exports = {
  defaultRoles,
  defaultGroups,
  ensureTenantRoles,
  ensureTenantGroups,
  ensureTenantSeedData
};
