#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);

function optionValue(flag) {
  const index = args.findIndex(arg => arg === flag || arg.startsWith(`${flag}=`));
  if (index === -1) {
    return null;
  }

  const current = args[index];
  if (current.includes('=')) {
    return current.split('=').slice(1).join('=');
  }

  const next = args[index + 1];
  if (!next || next.startsWith('--')) {
    return null;
  }

  return next;
}

function hasFlag(flag) {
  return args.some(arg => arg === flag);
}

function printHelp() {
  console.log(`Genera un dataset demo basado en backend/docs/sample-dataset.json

Uso:
  node scripts/generate-demo-dataset.js [opciones]

Opciones:
  --username <valor>    Usuario demo. Por defecto demo
  --email <valor>       Email demo. Por defecto demo@example.com
  --password <valor>    Password demo. Por defecto Admin#2024
  --role <valor>        Rol demo: Administrador, Operador, Supervisor o Consulta. Por defecto Operador
  --output <ruta>       Archivo destino. Por defecto backend/docs/demo-dataset.json
  --help                Muestra este mensaje

Ejemplo:
  npm run seed:demo -- --username demo-linsse --email demo@linsse.com --password Admin#2024
`);
}

if (hasFlag('--help')) {
  printHelp();
  process.exit(0);
}

const sampleDatasetPath = path.join(__dirname, '..', 'docs', 'sample-dataset.json');
const outputPathOption = optionValue('--output');
const outputPath = outputPathOption
  ? path.isAbsolute(outputPathOption)
    ? outputPathOption
    : path.resolve(process.cwd(), outputPathOption)
  : path.join(__dirname, '..', 'docs', 'demo-dataset.json');

const username = optionValue('--username') || 'demo';
const email = optionValue('--email') || 'demo@example.com';
const DEFAULT_DEMO_PASSWORD = 'Admin#2024';
const DEFAULT_DEMO_HASH = '$2b$12$1Mjw.hMXV24WfsaAjS/8MuXUwYURVinj/.Tagp.YzDOqYWlB561lO';

const password = optionValue('--password') || DEFAULT_DEMO_PASSWORD;
const roleName = optionValue('--role') || 'Operador';

const validRoles = new Set(['Administrador', 'Operador', 'Supervisor', 'Consulta']);
if (!validRoles.has(roleName)) {
  console.error(`Rol inválido: ${roleName}`);
  console.error(`Roles permitidos: ${Array.from(validRoles).join(', ')}`);
  process.exit(1);
}

const TEST_IMAGE_RED =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAukB9VEWilQAAAAASUVORK5CYII=';
const TEST_IMAGE_BLUE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAwMBASqSeEIAAAAASUVORK5CYII=';

function loadDataset() {
  if (!fs.existsSync(sampleDatasetPath)) {
    throw new Error(`No se encontró el dataset base: ${sampleDatasetPath}`);
  }
  return JSON.parse(fs.readFileSync(sampleDatasetPath, 'utf8'));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function oidValue(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }
  if (typeof value.$oid === 'string') {
    return value.$oid;
  }
  return null;
}

function buildDeterministicOid(seed) {
  const normalized = Buffer.from(String(seed)).toString('hex').slice(0, 24).padEnd(24, '0');
  return { $oid: normalized };
}

async function run() {
  const dataset = clone(loadDataset());
  const now = new Date().toISOString();
  const role = Array.isArray(dataset.roles) ? dataset.roles.find(entry => entry.name === roleName) : null;

  if (!role) {
    throw new Error(`No se encontró el rol "${roleName}" en el dataset base.`);
  }

  const demoUserId = buildDeterministicOid(`demo-user-${username}-${email}`);
  const operatorUser = Array.isArray(dataset.users)
    ? dataset.users.find(entry => entry.username === 'operaciones' || entry.email === 'operador@example.com')
    : null;
  const operatorUserId = oidValue(operatorUser?._id);
  let passwordHash = DEFAULT_DEMO_HASH;
  if (password !== DEFAULT_DEMO_PASSWORD) {
    let bcrypt = null;
    try {
      // Se carga de forma lazy para permitir generar el dataset demo por defecto
      // incluso cuando no se ejecutó npm install en el backend.
      bcrypt = require('bcryptjs');
    } catch (error) {
      throw new Error(
        'Para usar un password personalizado primero debes instalar dependencias en backend (npm install).'
      );
    }
    passwordHash = await bcrypt.hash(password, 12);
  }

  const demoUser = {
    _id: demoUserId,
    username,
    email,
    passwordHash,
    role: clone(role._id),
    status: 'active',
    createdAt: now,
    lastLoginAt: now
  };

  dataset.generatedAt = now;
  dataset.metadata = {
    ...(dataset.metadata || {}),
    description: 'Dataset demo generado automáticamente para presentaciones comerciales.',
    notes: `Usuario demo: ${email} / ${password}. Rol: ${roleName}.`
  };

  dataset.users = Array.isArray(dataset.users) ? dataset.users.filter(entry => entry.email !== email) : [];
  dataset.users.push(demoUser);

  const items = Array.isArray(dataset.items) ? dataset.items : [];
  if (items[0]) {
    items[0].images = [TEST_IMAGE_RED, TEST_IMAGE_BLUE];
    items[0].updatedAt = now;
  }
  if (items[1]) {
    items[1].images = [TEST_IMAGE_BLUE, TEST_IMAGE_RED];
    items[1].updatedAt = now;
  }
  if (items[2]) {
    items[2].images = [TEST_IMAGE_RED];
    items[2].updatedAt = now;
  }

  if (operatorUserId) {
    if (Array.isArray(dataset.movementRequests)) {
      dataset.movementRequests = dataset.movementRequests.map(request => ({
        ...request,
        requestedBy:
          oidValue(request.requestedBy) === operatorUserId ? clone(demoUserId) : request.requestedBy,
        approvedBy: request.approvedBy || null
      }));
    }

    if (Array.isArray(dataset.movementLogs)) {
      dataset.movementLogs = dataset.movementLogs.map(log => ({
        ...log,
        actor: oidValue(log.actor) === operatorUserId ? clone(demoUserId) : log.actor
      }));
    }
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');

  console.log(`Dataset demo generado en: ${outputPath}`);
  console.log(`Usuario demo: ${email}`);
  console.log(`Password demo: ${password}`);
  console.log(`Rol demo: ${roleName}`);
}

run().catch(error => {
  console.error(`No se pudo generar el dataset demo: ${error.message}`);
  process.exit(1);
});
