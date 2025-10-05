// Environment bindings
export type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  GEMINI_API_KEY: string;
};

// User roles (RBAC)
export type Role = 'consultant' | 'project_owner' | 'administrator' | 'directeur';

// User type
export interface User {
  id: string;
  email: string;
  password_hash: string;
  nom: string;
  prenom: string;
  role: Role;
  created_at: string;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth response
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    role: Role;
  };
}
