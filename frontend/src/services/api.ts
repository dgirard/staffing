import type { LoginCredentials, RegisterData, ApiResponse, AuthResponse, DashboardStats } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: 'Network error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Auth
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async me(): Promise<ApiResponse<any>> {
    return this.request('/auth/me');
  }

  // Dashboards
  async getDashboardMe(): Promise<ApiResponse<DashboardStats>> {
    return this.request<DashboardStats>('/dashboards/me');
  }

  async getDashboardConsultant(userId: string): Promise<ApiResponse<DashboardStats>> {
    return this.request<DashboardStats>(`/dashboards/consultant/${userId}`);
  }

  async getDashboardOwner(userId: string): Promise<ApiResponse<DashboardStats>> {
    return this.request<DashboardStats>(`/dashboards/owner/${userId}`);
  }

  async getDashboardAdmin(): Promise<ApiResponse<DashboardStats>> {
    return this.request<DashboardStats>('/dashboards/admin');
  }

  async getDashboardDirecteur(): Promise<ApiResponse<DashboardStats>> {
    return this.request<DashboardStats>('/dashboards/directeur');
  }

  // Projects
  async getProjects(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/projects');
  }

  // Consultants
  async getConsultants(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/consultants');
  }

  // Timesheets
  async getTimesheets(params?: { period?: string }): Promise<ApiResponse<any[]>> {
    const query = params ? `?period=${params.period}` : '';
    return this.request<any[]>(`/timesheets${query}`);
  }

  // MCP Tools
  async getMcpTools(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/mcp/tools');
  }
}

export const api = new ApiService();
