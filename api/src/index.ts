import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRoutes from './routes/auth.routes';
import consultantsRoutes from './routes/consultants.routes';
import projectsRoutes from './routes/projects.routes';
import interventionsRoutes from './routes/interventions.routes';
import { jwtMiddleware } from './middlewares/jwt.middleware';
import type { HonoEnv } from './types/hono';

const app = new Hono<HonoEnv>();

// Middleware CORS
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Route de test
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'Staffing ESN API - CHANTIER_04 Interventions',
    version: '0.4.0',
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

// Auth routes (public)
app.route('/auth', authRoutes);

// Protected API routes (require JWT)
// Note: jwtMiddleware applied separately since route() doesn't accept middleware parameter
const consultantsApp = app.basePath('/consultants');
consultantsApp.use('*', jwtMiddleware);
consultantsApp.route('/', consultantsRoutes);

const projectsApp = app.basePath('/projects');
projectsApp.use('*', jwtMiddleware);
projectsApp.route('/', projectsRoutes);

const interventionsApp = app.basePath('/interventions');
interventionsApp.use('*', jwtMiddleware);
interventionsApp.route('/', interventionsRoutes);

// Protected route example
app.get('/protected', jwtMiddleware, (c) => {
  const payload = c.get('jwtPayload');
  return c.json({
    success: true,
    message: 'Route protégée accessible',
    user: payload,
  });
});

export default app;
