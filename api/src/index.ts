import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Env }>();

// Middleware CORS
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Route de test
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'Staffing ESN API - CHANTIER_00 Setup',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    environment: 'development'
  });
});

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? process.uptime() : 0
  });
});

// Test route pour vérifier les bindings
app.get('/test/bindings', (c) => {
  return c.json({
    hasDB: !!c.env.DB,
    hasJwtSecret: !!c.env.JWT_SECRET,
    hasGeminiKey: !!c.env.GEMINI_API_KEY,
    message: 'Bindings check'
  });
});

export default app;
