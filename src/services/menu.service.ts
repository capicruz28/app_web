// src/services/menu.service.ts (CORREGIDO - ¡Aplicar esta versión!)

import api from './api';
// 1. Importar BOTH MenuItem y MenuResponse desde el archivo centralizado
import type { MenuResponse } from '../types/menu.types'; // Usar import type

// 2. ELIMINAR la definición local de MenuResponse de aquí
// interface MenuResponse {
//   data: MenuItem[];
// }

export const menuService = {
  /**
   * Obtiene el menú desde la API.
   * Ahora devuelve una Promise que resuelve a MenuResponse ({ menu: [...] }).
   */
  // 3. Cambiar el tipo de retorno a Promise<MenuResponse>
  getMenu: async (): Promise<MenuResponse> => {
    // 4. Asegúrate que esta ruta sea la correcta para tu API backend
    const endpoint = '/menus/getmenu'; // O '/api/v1/menus', etc.

    try {
      // 5. Usar la MenuResponse importada como tipo genérico
      const response = await api.get<MenuResponse>(endpoint);

      // 6. Validar que la respuesta tiene la propiedad 'menu' (viene de MenuResponse importada)
      if (response.data && Array.isArray(response.data.menu)) {
         // 7. Devolver el objeto response.data completo, que es de tipo MenuResponse
         return response.data;
      } else {
         console.error(`La respuesta de la API desde ${endpoint} no tiene el formato esperado { menu: [...] }:", response.data`);
         // Devolver una estructura válida pero vacía
         return { menu: [] };
      }

    } catch (error) {
      console.error(`Error fetching menu from ${endpoint}:`, error);
      // Devolver una estructura válida pero vacía en caso de error
      return { menu: [] };
    }
  }
};