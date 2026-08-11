#!/usr/bin/env node

const mongoose = require('mongoose');
const { connectDatabase } = require('../src/db');
const Item = require('../src/models/Item');
const Location = require('../src/models/Location');
const MovementLog = require('../src/models/MovementLog');
const MovementRequest = require('../src/models/MovementRequest');

const LOCATION_NAMES = ['Sobrestock Thibe', 'Sobrestock Arenal'];
const args = process.argv.slice(2);
const applyChanges = args.includes('--apply');

if (args.includes('--help')) {
  console.log(`Elimina los depósitos Sobrestock Thibe y Sobrestock Arenal y sus asignaciones.

Uso:
  npm run seed:remove-client-locations -- [--tenant <id>] [--apply]

Opciones:
  --tenant <id>  Limita la limpieza a un cliente. Sin esta opción revisa todos los clientes.
  --apply        Aplica la limpieza. Si se omite, solo muestra una simulación.
  --help         Muestra esta ayuda.
`);
  process.exit(0);
}

function optionValue(flag) {
  const index = args.findIndex(arg => arg === flag || arg.startsWith(`${flag}=`));
  if (index === -1) return null;
  if (args[index].includes('=')) return args[index].split('=').slice(1).join('=');
  return args[index + 1] && !args[index + 1].startsWith('--') ? args[index + 1] : null;
}

async function main() {
  try {
    await connectDatabase();

    const tenantId = optionValue('--tenant');
    if (tenantId && !mongoose.Types.ObjectId.isValid(tenantId)) {
      throw new Error('El valor de --tenant no es un ObjectId válido.');
    }

    const locationFilter = {
      name: { $in: LOCATION_NAMES.map(name => new RegExp(`^${name}$`, 'i')) }
    };
    if (tenantId) locationFilter.tenant = tenantId;

    const locations = await Location.find(locationFilter).select('_id name tenant').lean();
    const locationIds = locations.map(location => location._id);
    const requestFilter = {
      $or: [{ fromLocation: { $in: locationIds } }, { toLocation: { $in: locationIds } }]
    };
    if (tenantId) requestFilter.tenant = tenantId;

    const movementRequests = locationIds.length
      ? await MovementRequest.find(requestFilter).select('_id').lean()
      : [];
    const movementRequestIds = movementRequests.map(request => request._id);

    const stockFilter = locationIds.length
      ? { $or: locationIds.map(id => ({ [`stock.${id}`]: { $exists: true } })) }
      : { _id: { $in: [] } };
    if (tenantId) stockFilter.tenant = tenantId;
    const affectedItems = await Item.countDocuments(stockFilter);

    console.log(`Depósitos encontrados: ${locations.length}`);
    locations.forEach(location => console.log(`- ${location.name} (${location._id})`));
    console.log(`Artículos con asignaciones a eliminar: ${affectedItems}`);
    console.log(`Movimientos asociados a eliminar: ${movementRequestIds.length}`);

    if (!applyChanges) {
      console.log('Simulación finalizada. Ejecutá nuevamente con --apply para aplicar los cambios.');
      return;
    }

    if (locationIds.length === 0) {
      console.log('No hay depósitos para eliminar.');
      return;
    }

    const unsetStock = Object.fromEntries(locationIds.map(id => [`stock.${id}`, '']));
    const [itemsResult, logsResult, requestsResult, locationsResult] = await Promise.all([
      Item.updateMany(stockFilter, { $unset: unsetStock }),
      MovementLog.deleteMany({ movementRequest: { $in: movementRequestIds } }),
      MovementRequest.deleteMany({ _id: { $in: movementRequestIds } }),
      Location.deleteMany({ _id: { $in: locationIds } })
    ]);

    console.log(`Artículos actualizados: ${itemsResult.modifiedCount}`);
    console.log(`Logs eliminados: ${logsResult.deletedCount}`);
    console.log(`Movimientos eliminados: ${requestsResult.deletedCount}`);
    console.log(`Depósitos eliminados: ${locationsResult.deletedCount}`);
  } catch (error) {
    console.error('No se pudieron eliminar los depósitos Thibe y Arenal.', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

main();
