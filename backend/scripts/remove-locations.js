#!/usr/bin/env node

const mongoose = require('mongoose');
const { connectDatabase } = require('../src/db');
const Item = require('../src/models/Item');
const Location = require('../src/models/Location');
const MovementLog = require('../src/models/MovementLog');
const MovementRequest = require('../src/models/MovementRequest');

const args = process.argv.slice(2);

function optionValues(flag) {
  return args.flatMap((arg, index) => {
    if (arg === flag && args[index + 1] && !args[index + 1].startsWith('--')) {
      return [args[index + 1]];
    }
    if (arg.startsWith(`${flag}=`)) {
      return [arg.slice(flag.length + 1)];
    }
    return [];
  });
}

function optionValue(flag) {
  return optionValues(flag)[0] || null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function printHelp() {
  console.log(`Elimina ubicaciones y todas sus referencias de inventario y movimientos.

Uso:
  npm run locations:remove -- --location <nombre> [--location <nombre>] [--tenant <id>] [--apply]

Opciones:
  --location <nombre>  Nombre exacto de una ubicación. Puede repetirse.
  --tenant <id>        Limita la operación a un cliente.
  --apply              Confirma la eliminación. Sin esta opción solo simula.
  --help               Muestra esta ayuda.
`);
}

async function main() {
  try {
    if (args.includes('--help')) {
      printHelp();
      return;
    }

    const locationNames = [...new Set(optionValues('--location').map(name => name.trim()).filter(Boolean))];
    if (!locationNames.length) {
      printHelp();
      throw new Error('Debés indicar al menos una ubicación mediante --location.');
    }

    const tenantId = optionValue('--tenant');
    if (tenantId && !mongoose.Types.ObjectId.isValid(tenantId)) {
      throw new Error('El valor de --tenant no es un ObjectId válido.');
    }

    await connectDatabase();

    const locationFilter = {
      name: { $in: locationNames.map(name => new RegExp(`^${escapeRegExp(name)}$`, 'i')) }
    };
    if (tenantId) locationFilter.tenant = tenantId;

    const locations = await Location.find(locationFilter).select('_id name tenant').lean();
    const locationIds = locations.map(location => location._id);
    const requestFilter = {
      $or: [{ fromLocation: { $in: locationIds } }, { toLocation: { $in: locationIds } }]
    };
    if (tenantId) requestFilter.tenant = tenantId;

    const requests = locationIds.length
      ? await MovementRequest.find(requestFilter).select('_id').lean()
      : [];
    const requestIds = requests.map(request => request._id);
    const stockFilter = locationIds.length
      ? { $or: locationIds.map(id => ({ [`stock.${id}`]: { $exists: true } })) }
      : { _id: { $in: [] } };
    if (tenantId) stockFilter.tenant = tenantId;

    const affectedItems = await Item.countDocuments(stockFilter);
    console.log(`Ubicaciones encontradas: ${locations.length}`);
    locations.forEach(location => console.log(`- ${location.name} (${location._id})`));
    console.log(`Artículos a actualizar: ${affectedItems}`);
    console.log(`Movimientos a eliminar: ${requestIds.length}`);

    if (!args.includes('--apply')) {
      console.log('Simulación terminada. Agregá --apply para confirmar.');
      return;
    }
    if (!locationIds.length) {
      console.log('No se encontraron ubicaciones para eliminar.');
      return;
    }

    const unsetStock = Object.fromEntries(locationIds.map(id => [`stock.${id}`, '']));
    const [itemsResult, logsResult, requestsResult, locationsResult] = await Promise.all([
      Item.updateMany(stockFilter, { $unset: unsetStock }),
      MovementLog.deleteMany({ movementRequest: { $in: requestIds } }),
      MovementRequest.deleteMany({ _id: { $in: requestIds } }),
      Location.deleteMany({ _id: { $in: locationIds } })
    ]);

    console.log(`Artículos actualizados: ${itemsResult.modifiedCount}`);
    console.log(`Logs eliminados: ${logsResult.deletedCount}`);
    console.log(`Movimientos eliminados: ${requestsResult.deletedCount}`);
    console.log(`Ubicaciones eliminadas: ${locationsResult.deletedCount}`);
  } catch (error) {
    console.error('No se pudieron eliminar las ubicaciones.', error.message || error);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
}

main();
