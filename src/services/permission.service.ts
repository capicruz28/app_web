// src/services/permission.service.ts (CORREGIDO - Respetando endpoints originales)

import api from './api';
import type {
  PermissionState,
  // Ya no usamos PermissionUpdatePayload directamente aquí si definimos el tipo del payload
} from '../types/permission.types';

// --- Tipos para la comunicación con el Backend ---

// Describe un item en el ARRAY que DEVUELVE el backend en GET /roles/{rol_Id}/permisos
interface BackendPermissionItemGetResponse {
  menu_id: number;
  puede_ver: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
  rol_menu_id: number; // Campo extra devuelto por el GET
  rol_id: number;      // Campo extra devuelto por el GET
}
type BackendGetResponse = BackendPermissionItemGetResponse[]; // El GET devuelve un array

// Describe un item en el ARRAY que ESPERA el backend en PUT /roles/{rol_Id}/permisos
interface BackendPermissionItemUpdateRequest {
  menu_id: number;
  puede_ver: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
  // NO incluye rol_menu_id ni rol_id
}
// Describe el objeto completo que ESPERA el backend en PUT /roles/{rol_Id}/permisos
interface BackendUpdateRequestPayload {
  permisos: BackendPermissionItemUpdateRequest[];
}


// --- Servicio ---

export const permissionService = {
  /**
   * Obtiene los permisos actuales para un rol específico DESDE EL BACKEND (formato array)
   * y los TRANSFORMA al formato PermissionState (objeto) que usa el frontend.
   * @param rol_Id - El ID del rol (usando el nombre de parámetro original).
   * @returns Promise<PermissionState> - El estado de los permisos transformado.
   */
  getRolePermissions: async (rol_Id: number): Promise<PermissionState> => {
    // Endpoint para OBTENER permisos (el que proporcionaste)
    const endpoint = `/roles/${rol_Id}/permisos`;
    try {
      // 1. Llamar al backend esperando el ARRAY
      const response = await api.get<BackendGetResponse>(endpoint);
      const backendPermissions = response.data;

      // Validar que la respuesta sea un array
      if (!Array.isArray(backendPermissions)) {
        console.error(`La respuesta de la API desde ${endpoint} no es un array:`, backendPermissions);
        return {}; // Devuelve objeto vacío en caso de formato inesperado
      }

      // 2. Transformar el ARRAY a OBJETO (PermissionState)
      const frontendPermissions: PermissionState = {};
      for (const item of backendPermissions) {
        frontendPermissions[item.menu_id] = {
          ver: item.puede_ver,
          // Mapeamos los otros campos también, inicializando si faltaran
          crear: false, // 'crear' no viene del backend, lo ponemos a false
          editar: item.puede_editar ?? false, // Usar valor del backend o false
          eliminar: item.puede_eliminar ?? false, // Usar valor del backend o false
        };
      }
      console.log("Permissions Service - Transformed GET Response for Frontend:", frontendPermissions);

      // 3. Devolver el OBJETO transformado
      return frontendPermissions;

    } catch (error) {
      console.error(`Error fetching permissions for rol ${rol_Id} from ${endpoint}:`, error);
      throw new Error('Error al obtener los permisos del rol.');
    }
  },

  /**
   * Actualiza los permisos para un rol específico.
   * Recibe el payload en formato { permisos: array } desde el componente y lo envía.
   * @param rol_Id - El ID del rol (usando el nombre de parámetro original).
   * @param payload - Objeto con la clave 'permisos' y el valor como array [{ menu_id, puede_ver, ... }]
   * @returns Promise<void>
   */
   updateRolePermissions: async (rol_Id: number, payload: BackendUpdateRequestPayload): Promise<void> => {
    // Endpoint para ACTUALIZAR permisos (el que proporcionaste)
    const endpoint = `/roles/${rol_Id}/permisos`;
    try {
      // 1. Enviar el payload que ya viene formateado desde el componente
      //    (handleSaveChanges ya crea el formato BackendUpdateRequestPayload)
      console.log("Permissions Service - Sending PUT Request Payload:", payload);
      await api.put<void>(endpoint, payload); // Usamos PUT como en tu código original
    } catch (error) {
      console.error(`Error updating permissions for rol ${rol_Id} at ${endpoint}:`, error);
      // Aquí podrías añadir el parseo del error 422 si vuelve a ocurrir
      throw new Error('Error al actualizar los permisos del rol.');
    }
  }
};