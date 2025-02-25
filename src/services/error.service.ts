// src/services/error.service.ts
import { ApiError } from '../types/auth.types';

export const getErrorMessage = (error: any): ApiError => {
  if (error.response) {
    // Error de respuesta del servidor
    const status = error.response.status;
    switch (status) {
      case 400:
        return {
          message: 'Datos de inicio de sesión inválidos',
          status: 400
        };
      case 401:
        return {
          message: 'Usuario o contraseña incorrectos',
          status: 401
        };
      case 403:
        return {
          message: 'Acceso denegado',
          status: 403
        };
      case 404:
        return {
          message: 'Recurso no encontrado',
          status: 404
        };
      case 500:
        return {
          message: 'Error interno del servidor',
          status: 500
        };
      default:
        return {
          message: 'Error desconocido',
          status: status
        };
    }
  } else if (error.request) {
    // Error de conexión
    return {
      message: 'Error de conexión. Por favor, verifica tu conexión a internet',
      status: 0
    };
  } else {
    // Error de configuración
    return {
      message: 'Error en la aplicación',
      status: 0
    };
  }
};