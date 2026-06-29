const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const { authenticate } = require('./middlewares/auth');
const errorHandler = require('./middlewares/errorHandler');
const { HttpError } = require('./utils/errors');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const groupsRoutes = require('./routes/groups');
const itemsRoutes = require('./routes/items');
const locationsRoutes = require('./routes/locations');
const stockRoutes = require('./routes/stock');
const logsRoutes = require('./routes/logs');
const reportsRoutes = require('./routes/reports');
const rolesRoutes = require('./routes/roles');
const preferencesRoutes = require('./routes/preferences');
const publicRoutes = require('./routes/public');
const billingRoutes = require('./routes/billing');
const webhooksRoutes = require('./routes/webhooks');

const config = require('./config');

const app = express();

if (config.trustProxy) {
  app.set('trust proxy', 1);
}

const corsOptions = config.corsOrigins.length > 0
  ? {
      origin(origin, callback) {
        if (!origin || config.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new HttpError(403, 'Origen no permitido por CORS'));
      }
    }
  : undefined;

app.use(cors(corsOptions));
app.use(express.json({ limit: '75mb' }));
app.use(morgan('dev'));
app.get('/health', (req, res) => {
  res.json({ status: 'ok', environment: config.nodeEnv });
});

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/api/public', publicRoutes);
app.use('/api/webhooks', webhooksRoutes);

app.use(authenticate);

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/billing', billingRoutes);

app.use((req, res, next) => {
  next(new HttpError(404, 'Ruta no encontrada'));
});

app.use(errorHandler);

module.exports = app;
