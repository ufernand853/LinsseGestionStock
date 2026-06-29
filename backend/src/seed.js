const bcrypt = require('bcryptjs');
const Role = require('./models/Role');
const User = require('./models/User');
const Group = require('./models/Group');
const config = require('./config');
const Location = require('./models/Location');
const Item = require('./models/Item');
const SubscriptionPlan = require('./models/SubscriptionPlan');
const Tenant = require('./models/Tenant');

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

const defaultPlans = [
  { code: 'BASIC', name: 'Básico', priceUsdMonthly: 10, priceAmount: 390, currency: 'UYU', productLimit: 100, description: 'Para pequeños comercios', ctaLabel: 'Contratar' },
  { code: 'PRO', name: 'Pro', priceUsdMonthly: 50, priceAmount: 1990, currency: 'UYU', productLimit: 500, description: 'Hasta 500 productos', ctaLabel: 'Contratar' },
  { code: 'ENTERPRISE', name: 'Empresa', priceUsdMonthly: null, priceAmount: null, currency: 'UYU', productLimit: null, description: 'Sin límites, integraciones y varias sucursales', ctaLabel: 'Solicitar demo' }
];

const defaultGroups = [
  'MEDIAS',
  'ROPA INTERIOR',
  'MANIQUÍ',
  'BLANCOS',
  'ACCESORIOS',
  'JEAN HOMBRE',
  'JEAN DAMA',
  'JEAN NIÑO/A',
  'ROPA HOMBRE',
  'ROPA DAMA',
  'ROPA NIÑO/A',
  'CALZADO',
  'ELECTRÓNICOS Y BAZAR',
  'JUGUETES',
  'ESCOLARES',
  'SOBRESTOCK GENERAL',
  'SOBRESTOCK THIBE',
  'SOBRESTOCK ARENAL IMPORT',
  'CLIENTES'
];

async function seedPlans() {
  for (const plan of defaultPlans) {
    await SubscriptionPlan.updateOne({ code: plan.code }, { $set: plan }, { upsert: true });
  }
}

async function ensureDefaultTenant() {
  const enterprisePlan = await SubscriptionPlan.findOne({ code: 'ENTERPRISE' });
  let tenant = await Tenant.findOne({ billingEmail: config.adminEmail });
  if (!tenant) {
    tenant = await Tenant.create({
      name: 'Cuenta principal',
      billingEmail: config.adminEmail,
      plan: enterprisePlan.id,
      subscriptionStatus: 'active'
    });
  }
  return tenant;
}

async function seedRoles() {
  for (const role of defaultRoles) {
    const existing = await Role.findOne({ name: role.name });
    if (!existing) {
      await Role.create(role);
    }
  }
}

async function seedGroups() {
  const hasAnyGroup = await Group.exists({});
  if (hasAnyGroup) {
    return;
  }

  for (const name of defaultGroups) {
    await Group.create({ name });
  }
}

async function seedAdminUser(defaultTenant) {
  const adminEmail = config.adminEmail;
  let admin = await User.findOne({ email: adminEmail }).populate('role');
  if (!admin) {
    const adminRole = await Role.findOne({ name: 'Administrador' });
    const passwordHash = await bcrypt.hash(config.adminPassword, 12);
    admin = await User.create({
      username: 'admin',
      email: adminEmail,
      passwordHash,
      role: adminRole.id,
      tenant: defaultTenant.id,
      status: 'active'
    });
    console.log(`Usuario administrador creado con email ${adminEmail}`);
  } else if (!admin.tenant) {
    admin.tenant = defaultTenant.id;
    await admin.save();
  }
}

const defaultLocations = [];

async function attachLegacyItemsToDefaultTenant(defaultTenant) {
  await Item.updateMany(
    { $or: [{ tenant: { $exists: false } }, { tenant: null }] },
    { $set: { tenant: defaultTenant.id } }
  );
}

async function seedLocations() {
  const hasAnyLocation = await Location.exists({});
  if (hasAnyLocation) {
    return;
  }

  if (defaultLocations.length > 0) {
    await Location.insertMany(defaultLocations);
  }
}

async function seed() {
  await seedPlans();
  const defaultTenant = await ensureDefaultTenant();
  await seedRoles();
  await seedGroups();
  await seedLocations();
  await seedAdminUser(defaultTenant);
  await attachLegacyItemsToDefaultTenant(defaultTenant);
}

module.exports = seed;
