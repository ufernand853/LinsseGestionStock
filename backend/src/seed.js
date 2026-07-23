const bcrypt = require('bcryptjs');
const config = require('./config');
const Role = require('./models/Role');
const User = require('./models/User');
const Group = require('./models/Group');
const Location = require('./models/Location');
const Item = require('./models/Item');
const SubscriptionPlan = require('./models/SubscriptionPlan');
const Tenant = require('./models/Tenant');
const MovementRequest = require('./models/MovementRequest');
const MovementLog = require('./models/MovementLog');
const AuditLog = require('./models/AuditLog');
const DashboardConfig = require('./models/DashboardConfig');
const { ensureTenantSeedData } = require('./services/tenantProvisioningService');

const defaultPlans = [
  { code: 'BASIC', name: 'Basico', priceUsdMonthly: 10, priceAmount: 390, currency: 'UYU', productLimit: 100, description: 'Para Pequeñas Empresas', ctaLabel: 'Contratar' },
  { code: 'PRO', name: 'Pro', priceUsdMonthly: 50, priceAmount: 1990, currency: 'UYU', productLimit: 500, description: 'Hasta 500 productos', ctaLabel: 'Contratar' },
  { code: 'ENTERPRISE', name: 'Empresa', priceUsdMonthly: null, priceAmount: null, currency: 'UYU', productLimit: null, description: 'Sin limites, integraciones y varias sucursales', ctaLabel: 'Solicitar demo' }
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

async function seedAdminUser(defaultTenant) {
  const adminEmail = config.adminEmail;
  let admin = await User.findOne({ email: adminEmail }).populate('role');
  if (!admin) {
    const adminRole = await Role.findOne({ tenant: defaultTenant.id, name: 'Administrador' });
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
    if (!admin.role) {
      const adminRole = await Role.findOne({ tenant: defaultTenant.id, name: 'Administrador' });
      if (adminRole) {
        admin.role = adminRole.id;
      }
    }
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

async function attachLegacyLocationsToDefaultTenant(defaultTenant) {
  await Location.updateMany(
    { $or: [{ tenant: { $exists: false } }, { tenant: null }] },
    { $set: { tenant: defaultTenant.id } }
  );
}

async function attachLegacyGroupsToDefaultTenant(defaultTenant) {
  await Group.updateMany(
    { $or: [{ tenant: { $exists: false } }, { tenant: null }] },
    { $set: { tenant: defaultTenant.id } }
  );
}

async function attachLegacyRolesToDefaultTenant(defaultTenant) {
  await Role.updateMany(
    { $or: [{ tenant: { $exists: false } }, { tenant: null }] },
    { $set: { tenant: defaultTenant.id } }
  );
}

async function attachLegacyMovementRequestsToDefaultTenant(defaultTenant) {
  await MovementRequest.updateMany(
    { $or: [{ tenant: { $exists: false } }, { tenant: null }] },
    { $set: { tenant: defaultTenant.id } }
  );
}

async function attachLegacyMovementLogsToDefaultTenant(defaultTenant) {
  await MovementLog.updateMany(
    { $or: [{ tenant: { $exists: false } }, { tenant: null }] },
    { $set: { tenant: defaultTenant.id } }
  );
}

async function attachLegacyAuditLogsToDefaultTenant(defaultTenant) {
  await AuditLog.updateMany(
    { $or: [{ tenant: { $exists: false } }, { tenant: null }] },
    { $set: { tenant: defaultTenant.id } }
  );
}

async function attachLegacyDashboardConfigToDefaultTenant(defaultTenant) {
  await DashboardConfig.updateMany(
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

async function syncTenantIndexes() {
  await Promise.all([
    Group.syncIndexes(),
    Role.syncIndexes(),
    MovementRequest.syncIndexes(),
    MovementLog.syncIndexes(),
    AuditLog.syncIndexes(),
    DashboardConfig.syncIndexes()
  ]);
}

async function seed() {
  await seedPlans();
  const defaultTenant = await ensureDefaultTenant();
  await attachLegacyRolesToDefaultTenant(defaultTenant);
  await attachLegacyGroupsToDefaultTenant(defaultTenant);
  await ensureTenantSeedData(defaultTenant.id);
  await seedLocations();
  await seedAdminUser(defaultTenant);
  await attachLegacyItemsToDefaultTenant(defaultTenant);
  await attachLegacyLocationsToDefaultTenant(defaultTenant);
  await attachLegacyMovementRequestsToDefaultTenant(defaultTenant);
  await attachLegacyMovementLogsToDefaultTenant(defaultTenant);
  await attachLegacyAuditLogsToDefaultTenant(defaultTenant);
  await attachLegacyDashboardConfigToDefaultTenant(defaultTenant);
  await syncTenantIndexes();
}

module.exports = seed;
