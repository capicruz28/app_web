// src/types/auth.types.ts
export interface LoginCredentials {
    username: string;
    password: string;
  }
  
  export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: {
      id: number;
      username: string;
      email: string;
      full_name: string;
    }
  }
  
  export interface AuthState {
    user: AuthResponse['user'] | null;
    token: string | null;
  }

  export interface ApiError {
    message: string;
    status: number;
    details?: string;
  }