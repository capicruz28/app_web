// src/services/area.service.ts

import api from './api';
import { PaginatedAreaResponse, AreaCreateData, AreaUpdateData, Area } from '../types/area.types';

const API_URL = '/areas'; // Ruta base para las áreas en la API v1

/**
 * Obtiene una lista paginada y filtrada de áreas.
 */
export const getAreas = async (
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<PaginatedAreaResponse> => {
  try {
    // Calcula el 'skip' basado en la página y el límite
    const skip = (page - 1) * limit;

    // Construye los parámetros de la query
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (search) {
      params.append('search', search);
    }

    // Realiza la llamada GET con los parámetros
    const response = await api.get<PaginatedAreaResponse>(`${API_URL}/?${params.toString()}`);

    // El backend ahora devuelve directamente la estructura PaginatedAreaResponse
    return response.data;

  } catch (error: any) {
    console.error("Error fetching areas:", error.response?.data || error.message);
    // Lanza un error más descriptivo si está disponible
    throw new Error(error.response?.data?.detail || 'Error al obtener las áreas desde el servicio');
  }
};

/**
 * Crea una nueva área.
 */
export const createArea = async (areaData: AreaCreateData): Promise<Area> => {
  try {
    const response = await api.post<Area>(API_URL + '/', areaData);
    return response.data;
  } catch (error: any) {
    console.error("Error creating area:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Error al crear el área');
  }
};

/**
 * Actualiza un área existente.
 */
export const updateArea = async (areaId: number, areaData: AreaUpdateData): Promise<Area> => {
  try {
    const response = await api.put<Area>(`${API_URL}/${areaId}`, areaData);
    return response.data;
  } catch (error: any) {
    console.error("Error updating area:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Error al actualizar el área');
  }
};

/**
 * Desactiva un área (borrado lógico).
 * El backend ahora devuelve el objeto Area completo.
 */
export const deactivateArea = async (areaId: number): Promise<Area> => { // <-- Cambiado tipo de retorno
  try {
    // La respuesta ahora es el objeto Area actualizado
    const response = await api.delete<Area>(`${API_URL}/${areaId}`); // <-- Cambiado tipo esperado
    return response.data;
  } catch (error: any) {
    console.error("Error deactivating area:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Error al desactivar el área');
  }
};

/**
 * Reactiva un área.
 * El backend ahora devuelve el objeto Area completo.
 */
export const reactivateArea = async (areaId: number): Promise<Area> => { // <-- Cambiado tipo de retorno
  try {
    // La respuesta ahora es el objeto Area actualizado
    const response = await api.put<Area>(`${API_URL}/${areaId}/reactivate`); // <-- Cambiado tipo esperado
    return response.data;
  } catch (error: any) {
    console.error("Error reactivating area:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Error al reactivar el área');
  }
};

/**
 * Obtiene un área por ID.
 */
export const getAreaById = async (areaId: number): Promise<Area> => {
    try {
        const response = await api.get<Area>(`${API_URL}/${areaId}`);
        return response.data;
    } catch (error: any) {
        console.error(`Error fetching area ${areaId}:`, error.response?.data || error.message);
        throw new Error(error.response?.data?.detail || `Error al obtener el área ${areaId}`);
    }
};