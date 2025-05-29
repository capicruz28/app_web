
// src/types/administracion.types.ts
export interface CuentaCobrarPagar {
  tipo_cuenta: string;
  codigo_cliente_proveedor: string;
  cliente_proveedor: string;
  cuenta_contable: string;
  tipo_comprobante: string;
  serie_comprobante: string;
  numero_comprobante: string;
  fecha_comprobante: string | null;
  tipo_cambio: number | null;
  moneda: string | null;
  importe_soles: number | null;
  importe_dolares: number | null;
  importe_moneda_funcional: number | null;
  fecha_vencimiento: string | null;
  fecha_ultimo_pago: string | null;
  tipo_venta: string | null;
  usuario: string | null;
  observacion: string | null;
  descripcion_comprobante: string | null;
  servicio: string | null;
  importe_original: number | null;
  codigo_responsable: string | null;
  responsable: string | null;
  empresa: string;
  ruta_comprobante_pdf: string | null;
  semana: string | null;
  semana_ajustada: string | null;
  pendiente_cobrar: number | null;
}

export interface AdministracionResponse {
  status: boolean;
  message: string;
  data: CuentaCobrarPagar[];
  debug_note?: string;
}