// src/services/menu.service.ts (ACTUALIZADO)

import api from './api';
// Importar MenuItem y MenuResponse desde el archivo centralizado
import type { MenuItem, MenuResponse } from '../types/menu.types'; // Usar import type

// Definir un tipo para la respuesta del árbol completo, si es diferente
// Si es igual a MenuResponse, puedes reutilizarla. Asumamos que es igual por ahora.
type FullMenuResponse = MenuResponse; // O define una nueva si la estructura cambia

export const menuService = {
  /**
   * Obtiene el menú para el usuario autenticado (usado en Sidebar).
   */
  getMenu: async (): Promise<MenuResponse> => {
    const endpoint = '/menus/getmenu'; // Endpoint para menú de usuario
    try {
      const response = await api.get<MenuResponse>(endpoint);
      if (response.data && Array.isArray(response.data.menu)) {
         return response.data;
      } else {
         console.error(`La respuesta de la API desde ${endpoint} no tiene el formato esperado { menu: [...] }:", response.data`);
         return { menu: [] };
      }
    } catch (error) {
      console.error(`Error fetching menu from ${endpoint}:`, error);
      return { menu: [] };
    }
  },

  /**
   * Obtiene la estructura COMPLETA del árbol de menús desde la API.
   * Necesario para la gestión de permisos de roles.
   * Devuelve una Promise que resuelve a MenuItem[].
   */
  getFullMenuTree: async (): Promise<MenuItem[]> => {
    // Asegúrate que esta ruta sea la correcta para tu API backend que devuelve TODOS los menús
    const endpoint = '/menus/all-structured'; // Endpoint para árbol completo

    try {
      // Usaremos FullMenuResponse como tipo genérico (asumiendo { menu: [...] })
      const response = await api.get<FullMenuResponse>(endpoint);

      // Validar que la respuesta tiene la propiedad 'menu' y es un array
      if (response.data && Array.isArray(response.data.menu)) {
         // Devolver directamente el array de MenuItem
         return response.data.menu;
      } else {
         console.error(`La respuesta de la API desde ${endpoint} no tiene el formato esperado { menu: [...] }:", response.data`);
         // Devolver un array vacío en caso de formato inesperado
         return [];
      }

    } catch (error) {
      console.error(`Error fetching full menu tree from ${endpoint}:`, error);
      // Devolver un array vacío en caso de error
      return [];
    }
  }
};