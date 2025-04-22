// src/services/usuario.service.ts (Corregido para Escenario A)

import api from './api'; // Importa tu instancia configurada de Axios
// --- Importar TODOS los tipos necesarios, incluyendo UserUpdateData ---
import {
    PaginatedUsersResponse,
    UserFormData,
    UserWithRoles,
    UserUpdateData // <-- Asegúrate que este tipo esté definido correctamente en usuario.types.ts
} from '../types/usuario.types'; // Ajusta la ruta si es necesario

const BASE_URL = '/usuarios'; // Asumiendo que tu API base es /api/v1 y el router está en /usuarios

/**
 * Obtiene una lista paginada de usuarios.
 * @param page Número de página
 * @param limit Límite de usuarios por página
 * @param search Término de búsqueda opcional
 */
export const getUsers = async (
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<PaginatedUsersResponse> => {
  try {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) {
      params.append('search', search);
    }
    const response = await api.get<PaginatedUsersResponse>(`${BASE_URL}/`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error; // Re-lanzar para manejo en el componente
  }
};

/**
 * Obtiene un usuario específico por su ID.
 * @param userId ID del usuario
 */
export const getUserById = async (userId: number): Promise<UserWithRoles> => {
    try {
        const response = await api.get<UserWithRoles>(`${BASE_URL}/${userId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        throw error;
    }
};

/**
 * Crea un nuevo usuario.
 * @param userData Datos del usuario a crear (tipo UserFormData)
 */
export const createUser = async (userData: UserFormData): Promise<UserWithRoles> => {
    try {
        const response = await api.post<UserWithRoles>(`${BASE_URL}/`, userData);
        return response.data;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

/**
 * Actualiza un usuario existente.
 * @param userId ID del usuario a actualizar
 * @param userData Datos a actualizar (tipo UserUpdateData)
 */
// --- CORRECCIÓN AQUÍ: Cambiado Partial<UserFormData> a UserUpdateData ---
export const updateUser = async (userId: number, userData: UserUpdateData): Promise<UserWithRoles> => {
    try {
        // Asume que el backend ahora espera un objeto con la estructura de UserUpdateData
        // y devuelve un UserWithRoles actualizado.
        const response = await api.put<UserWithRoles>(`${BASE_URL}/${userId}`, userData);
        return response.data;
    } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        throw error;
    }
};

/**
 * Elimina (lógicamente o desactiva) un usuario.
 * @param userId ID del usuario a eliminar/desactivar
 */
export const deleteUser = async (userId: number): Promise<{ message: string; usuario_id: number }> => {
    try {
        // Asume que el endpoint DELETE realiza una desactivación lógica si es lo implementado
        const response = await api.delete<{ message: string; usuario_id: number }>(`${BASE_URL}/${userId}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting/deactivating user ${userId}:`, error);
        throw error;
    }
};

// --- Funciones de Roles (sin cambios respecto a tu código original) ---

/**
 * Asigna un rol a un usuario.
 * @param userId ID del usuario
 * @param roleId ID del rol
 */
export const assignRoleToUser = async (userId: number, roleId: number): Promise<any> => { // Ajusta 'any' al tipo de respuesta real (ej: UsuarioRolRead o UserWithRoles)
    try {
        const response = await api.post(`${BASE_URL}/${userId}/roles/${roleId}`);
        return response.data; // Podría devolver el usuario actualizado con roles
    } catch (error) {
        console.error(`Error assigning role ${roleId} to user ${userId}:`, error);
        throw error;
    }
};

/**
 * Revoca un rol de un usuario.
 * @param userId ID del usuario
 * @param roleId ID del rol
 */
export const revokeRoleFromUser = async (userId: number, roleId: number): Promise<any> => { // Ajusta 'any' al tipo de respuesta real (ej: { message: string } o UserWithRoles)
    try {
        const response = await api.delete(`${BASE_URL}/${userId}/roles/${roleId}`);
        return response.data; // Podría devolver un mensaje o el usuario actualizado
    } catch (error) {
        console.error(`Error revoking role ${roleId} from user ${userId}:`, error);
        throw error;
    }
};

// --- Asegúrate que UserUpdateData esté definido en usuario.types.ts ---
/*
Ejemplo de definición en src/types/usuario.types.ts:

export interface UserUpdateData {
    correo: string; // Correo usualmente es requerido para actualizar
    nombre?: string | null; // Permite string, null o undefined (si no se envía)
    apellido?: string | null; // Permite string, null o undefined
    es_activo?: boolean; // Permite actualizar el estado activo
    // NO incluir contraseña aquí a menos que tengas un flujo específico para cambiarla
}

*/