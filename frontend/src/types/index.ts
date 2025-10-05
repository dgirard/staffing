export type Role = 'consultant' | 'project_owner' | 'administrator' | 'directeur';

export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  role: Role;
}

export interface DashboardStats {
  jours_mois?: number;
  nb_projets?: number;
  taux_util?: number;
  projets?: any[];
  semaine?: any[];
  nb_validations_pending?: number;
  budget_total?: number;
  nb_consultants?: number;
  nb_conflicts?: number;
  capacite_dispo?: number;
  marges?: any[];
}
