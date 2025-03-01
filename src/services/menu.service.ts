// src/services/menu.service.ts
import api from './api';
import { MenuItem } from '../types/menu.types';

interface MenuResponse {
  data: MenuItem[];
}

export const menuService = {
  getMenu: async (): Promise<MenuItem[]> => {
    try {
      const { data } = await api.get<MenuResponse>('/menus/getmenu');
      return data.data;
    } catch (error) {
      console.error('Error fetching menu:', error);
      throw error;
    }
  }
};