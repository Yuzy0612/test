import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createAuditLog } from './middleware/audit.js';
import sequelize from './config/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for reports - BEFORE routes to handle existing files
app.use('/reports', express.static(path.join(__dirname, 'reports')));

// Audit log middleware
app.use(createAuditLog);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1', routes);

// Auth routes (for login/register)
app.post('/api/v1/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username && password) {
    res.json({
      code: 0,
      message: 'success',
      data: {
        token: 'mock-jwt-token-' + Date.now(),
        user: {
          userId: 'U001',
          username: username,
          role: 'production_engineer',
          permissions: ['well:read', 'well:write', 'calibration:read', 'calibration:write']
        }
      }
    });
  } else {
    res.status(401).json({ code: 401, message: 'Invalid credentials' });
  }
});

app.post('/api/v1/auth/register', (req, res) => {
  res.status(501).json({ code: 501, message: 'Not implemented' });
});

// Error handling - only for API routes, NOT for static files
// Custom 404 that only triggers for /api/* routes
app.use('/api', notFoundHandler);
app.use(errorHandler);

// Database connection and sync (skip in mock data mode)
const initDB = async () => {
  // In development with mock data, we skip database connection
  console.log('Running in MOCK DATA mode (no database)');
  // Uncomment below to enable real database:
  // try {
  //   await sequelize.authenticate();
  //   console.log('PostgreSQL connected:', process.env.DB_HOST || 'localhost');
  //   await sequelize.sync({ alter: true });
  //   console.log('Database synced');
  // } catch (error) {
  //   console.error('Database connection error:', error.message);
  // }
};

// Start server
const startServer = async () => {
  await initDB();

  app.listen(PORT, () => {
    console.log(`VFM Backend API running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API base: http://localhost:${PORT}/api/v1`);
  });
};

startServer();

export default app;
