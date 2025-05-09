// src/services/costura.service.ts
import api from './api'; // Asumiendo tu instancia de Axios/API configurada
import type {
  ReporteEficienciaCosturaParams,
  ReporteEficienciaCosturaResponse
} from '../types/costura.types'; // Asegúrate que la ruta sea correcta

const API_BASE_URL = '/costura'; // Base URL para los endpoints de costura

export const costuraService = {
  /**
   * Obtiene el reporte de eficiencia del área de costura.
   * Llama a GET /costura/reporte/eficiencia
   * @param params - Objeto con fecha_inicio y fecha_fin.
   * @returns Promesa con la respuesta del reporte de eficiencia.
   */
  getReporteEficiencia: async (
    params: ReporteEficienciaCosturaParams
  ): Promise<ReporteEficienciaCosturaResponse> => {
    const endpoint = `${API_BASE_URL}/reporte/eficiencia`;
    try {
      const response = await api.get<ReporteEficienciaCosturaResponse>(endpoint, {
        params: { // Axios envía estos como query parameters
          fecha_inicio: params.fecha_inicio,
          fecha_fin: params.fecha_fin,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching efficiency report from ${endpoint}:`, error);
      // Lanza el error para que el componente lo maneje y pueda mostrar un toast
      throw error;
    }
  },

  // Aquí podrías añadir más funciones de servicio para el módulo de Costura en el futuro
  // Ejemplo:
  // getOtroReporteCostura: async (params: OtroReporteParams): Promise<OtroReporteResponse> => { ... }
};