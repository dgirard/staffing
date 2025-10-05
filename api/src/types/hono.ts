import type { JWTPayload, Env } from './index';

// Extend Hono context with custom variables
export type HonoEnv = {
  Bindings: Env;
  Variables: {
    jwtPayload: JWTPayload;
  };
};
