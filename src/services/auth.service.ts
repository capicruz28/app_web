// src/services/auth.service.ts
import api from './api';
import { LoginCredentials, AuthResponse } from '../types/auth.types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    return data;
  }
};