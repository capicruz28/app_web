// src/types/auth.types.ts
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface UserData {
  usuario_id: number;
  nombre_usuario: string;
  correo: string;
  nombre: string;
  apellido: string;
  es_activo: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_data: UserData;
}

export interface AuthState {
  user: UserData | null;
  token: string | null;
}

export interface ApiError {
  message: string;
  status: number;
  details?: string;
}