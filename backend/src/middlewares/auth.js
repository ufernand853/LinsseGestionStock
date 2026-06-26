const jwt = require('jsonwebtoken');
const config = require('../config');
const asyncHandler = require('../utils/asyncHandler');
const { HttpError } = require('../utils/errors');
const User = require('../models/User');

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }
  const token = header.substring('Bearer '.length);
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload.sub).populate('role').populate({ path: 'tenant', populate: { path: 'plan' } });
    if (!user || user.status !== 'active') {
      return next();
    }
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role ? user.role.name : null,
      roleId: user.role ? user.role.id : null,
      permissions: user.role ? user.role.permissions : [],
      tenantId: user.tenant ? user.tenant.id : null,
      license: user.tenant
        ? {
            tenantId: user.tenant.id,
            tenantName: user.tenant.name,
            status: user.tenant.subscriptionStatus,
            plan: user.tenant.plan
              ? {
                  code: user.tenant.plan.code,
                  name: user.tenant.plan.name,
                  priceUsdMonthly: user.tenant.plan.priceUsdMonthly,
                  productLimit: user.tenant.plan.productLimit
                }
              : null
          }
        : null,
      lastLoginAt: user.lastLoginAt,
      preferences:
        user.preferences && typeof user.preferences.toObject === 'function'
          ? user.preferences.toObject()
          : user.preferences || {}
    };
  } catch (error) {
    // Ignore invalid tokens to allow public routes to respond 401 when required
  }
  next();
});

function requireAuth(req, res, next) {
  if (!req.user) {
    throw new HttpError(401, 'No autorizado');
  }
  next();
}

function requirePermission(permission) {
  return function permissionMiddleware(req, res, next) {
    requireAuth(req, res, () => {
      const permissions = req.user?.permissions || [];
      if (!permissions.includes(permission)) {
        throw new HttpError(403, 'Permiso denegado');
      }
      next();
    });
  };
}

module.exports = {
  authenticate,
  requireAuth,
  requirePermission
};
