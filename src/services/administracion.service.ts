// src/services/administracion.service.ts
import api from './api';
import { AdministracionResponse } from '../types/administracion.types';

export const getCuentasCobrarPagar = async (): Promise<AdministracionResponse> => {
  const { data } = await api.get<AdministracionResponse>('/administracion/cuentas-cobrar-pagar');
  return data;
};