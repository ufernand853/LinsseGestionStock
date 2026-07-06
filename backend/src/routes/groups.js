const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { HttpError } = require('../utils/errors');
const { requirePermission } = require('../middlewares/auth');
const Group = require('../models/Group');
const Item = require('../models/Item');

const router = express.Router();

function buildTenantFilter(req) {
  return req.user?.tenantId ? { tenant: req.user.tenantId } : { tenant: null };
}

router.get(
  '/',
  requirePermission('items.read'),
  asyncHandler(async (req, res) => {
    const groups = await Group.find(buildTenantFilter(req)).sort({ name: 1 });
    res.json(groups);
  })
);

router.post(
  '/',
  requirePermission('items.write'),
  asyncHandler(async (req, res) => {
    const { name, parentId } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new HttpError(400, 'El nombre es obligatorio');
    }
    const normalizedName = name.trim();
    let parent = null;
    if (parentId) {
      parent = await Group.findOne({ _id: parentId, ...buildTenantFilter(req) });
      if (!parent) {
        throw new HttpError(400, 'Grupo padre invalido');
      }
    }
    try {
      const group = await Group.create({
        tenant: req.user?.tenantId || null,
        name: normalizedName,
        parent: parent ? parent.id : null
      });
      res.status(201).json(group);
    } catch (error) {
      if (error?.code === 11000) {
        throw new HttpError(409, 'Ya existe un grupo con ese nombre');
      }
      throw error;
    }
  })
);

router.put(
  '/:id',
  requirePermission('items.write'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const group = await Group.findOne({ _id: id, ...buildTenantFilter(req) });
    if (!group) {
      throw new HttpError(404, 'Grupo no encontrado');
    }

    const updates = {};
    if ('name' in (req.body || {})) {
      const { name } = req.body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        throw new HttpError(400, 'El nombre es obligatorio');
      }
      updates.name = name.trim();
    }

    if ('parentId' in (req.body || {})) {
      const { parentId } = req.body;
      if (!parentId) {
        updates.parent = null;
      } else {
        if (parentId === id) {
          throw new HttpError(400, 'Un grupo no puede ser padre de si mismo');
        }
        const parent = await Group.findOne({ _id: parentId, ...buildTenantFilter(req) });
        if (!parent) {
          throw new HttpError(400, 'Grupo padre invalido');
        }
        let current = parent;
        while (current) {
          if (current.id === id) {
            throw new HttpError(400, 'No se puede asignar un subgrupo como padre');
          }
          if (!current.parent) {
            break;
          }
          current = await Group.findOne({ _id: current.parent, ...buildTenantFilter(req) });
        }
        updates.parent = parent.id;
      }
    }

    Object.assign(group, updates);

    try {
      await group.save();
    } catch (error) {
      if (error?.code === 11000) {
        throw new HttpError(409, 'Ya existe un grupo con ese nombre');
      }
      throw error;
    }

    res.json(group);
  })
);

router.delete(
  '/:id',
  requirePermission('items.write'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const group = await Group.findOne({ _id: id, ...buildTenantFilter(req) });
    if (!group) {
      throw new HttpError(404, 'Grupo no encontrado');
    }

    const [childCount, itemCount] = await Promise.all([
      Group.countDocuments({ parent: group._id, ...buildTenantFilter(req) }),
      Item.countDocuments({ tenant: req.user?.tenantId || null, group: group._id })
    ]);

    if (childCount > 0) {
      throw new HttpError(400, 'No se puede eliminar un grupo con subgrupos asociados');
    }

    if (itemCount > 0) {
      throw new HttpError(400, 'No se puede eliminar un grupo con articulos asociados');
    }

    await group.deleteOne();

    res.status(204).send();
  })
);

module.exports = router;
