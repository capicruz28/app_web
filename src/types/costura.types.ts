// src/types/costura.types.ts

// Para un item individual dentro del array 'datos_reporte'
export interface EficienciaCosturaItem {
    orden_produccion: string;
    codigo_seccion?: string | null;
    codigo_trabajador: string;
    nombre_trabajador?: string | null;
    codigo_operacion: string;
    nombre_operacion?: string | null;
    cantidad_prendas_producidas: number;
    bloque?: string | null;
    linea?: string | null;
    tiempo_estandar_minutos_prenda: number;
    importe_destajo_total?: number | null;
    minutos_disponibles_jornada: number; // En el backend es float, aquí number
    minutos_producidos_total: number;    // En el backend es float, aquí number
    nombre_maquina?: string | null;
    codigo_categoria_operacion?: string | null;
    fecha_proceso: string; // Se recibe como string YYYY-MM-DD
    codigo_proceso_ticket?: string | null;
    nombre_proceso_ticket?: string | null;
    precio_venta_orden?: number | null;
    eficiencia_porcentaje?: number | null;
  }
  
  // Para los parámetros de la solicitud GET
  export interface ReporteEficienciaCosturaParams {
    fecha_inicio: string; // Formato YYYY-MM-DD
    fecha_fin: string;    // Formato YYYY-MM-DD
    // No incluimos debug_limit aquí ya que es Opción C (no expuesto en UI)
  }
  
  // Para la respuesta completa del endpoint
  export interface ReporteEficienciaCosturaResponse {
    fecha_inicio_reporte: string; // Se recibe como string YYYY-MM-DD
    fecha_fin_reporte: string;    // Se recibe como string YYYY-MM-DD
    datos_reporte: EficienciaCosturaItem[];
    total_prendas_producidas_periodo?: number | null;
    total_minutos_producidos_periodo?: number | null;
    total_minutos_disponibles_periodo?: number | null;
    eficiencia_promedio_general_periodo?: number | null;
    debug_note?: string | null; // Importante para la Opción C
  }