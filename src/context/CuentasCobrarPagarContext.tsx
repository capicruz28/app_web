// src/context/CuentasCobrarPagarContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getCuentasCobrarPagar } from '../services/administracion.service';
import type { CuentaCobrarPagar } from '../types/administracion.types';

// Ahora los filtros globales son arrays de strings
type FiltroGlobal = {
  empresa: string[];
  responsable: string[];
  tipo_cuenta: string[];
  cliente_proveedor: string[];
  descripcion_comprobante: string[];
  serie_comprobante: string[];
  moneda: string[];
};

// Definir las claves de filtro para usar en el tipo y funciones
const filtroGlobalKeys = [
  'empresa',
  'responsable',
  'tipo_cuenta',
  'cliente_proveedor',
  'descripcion_comprobante',
  'serie_comprobante',
  'moneda',
] as const;

type FiltroGlobalKey = typeof filtroGlobalKeys[number];

// Tipo para la selección de la tabla DetalleCuentasCobrarPagar (con lógica acumulativa)
type DetalleSeleccion = {
  fecha_vencimiento?: string;
  fecha_comprobante?: string;
  codigo_cliente_proveedor?: string;
  cliente_proveedor?: string;
  serie_comprobante?: string;
  numero_comprobante?: string;
  tipo_comprobante?: string;
  descripcion_comprobante?: string;
  tipo_cambio?: string;
  clickedColumn?: 'fecha_vencimiento' | 'fecha_comprobante' | 'codigo_cliente_proveedor' | 'cliente_proveedor' | 'serie_comprobante' | 'numero_comprobante' | 'tipo_comprobante' | 'descripcion_comprobante' | 'tipo_cambio' | 'sumario' | null;
};


// Tipo para la selección de la tabla ClientesProveedoresTablaCuentasCobrarPagar
type ClienteProveedorSeleccion = {
    cliente_proveedor?: string;
    moneda?: string;
    clickedColumn?: 'cliente_proveedor' | 'moneda' | 'sumario' | null;
};


// Tipo para la selección de la tabla MotivoVenta
type MotivoVentaSeleccion = {
  serie_comprobante?: string;
  responsable?: string;
  servicio?: string;
  moneda?: string;
  clickedColumn?: 'serie_comprobante' | 'responsable' | 'servicio' | 'moneda' | 'sumario' | null;
};

interface CuentasCobrarPagarContextType {
  isLoading: boolean;
  data: CuentaCobrarPagar[];
  filtros: FiltroGlobal;
  setFiltro: (key: FiltroGlobalKey, value: string[]) => void;
  clearFiltros: () => void;
  // Proveer estado y setters de Detalle
  detalleSeleccion: DetalleSeleccion;
  setDetalleSeleccion: (sel: DetalleSeleccion) => void;
  clearDetalleSeleccion: () => void;
  // Proveer estado y setter de ClienteProveedor
  clienteProveedorSeleccion: ClienteProveedorSeleccion;
  setClienteProveedorSeleccion: (sel: ClienteProveedorSeleccion) => void;
  // Proveer el estado y setter de MotivoVenta
  motivoVentaSeleccion: MotivoVentaSeleccion;
  setMotivoVentaSeleccion: (sel: MotivoVentaSeleccion) => void;
  dataFiltrada: CuentaCobrarPagar[]; // Data para KPIs y exportaciones globales
  // Proveer data para cada tabla sin su propio filtro de selección
  dataSinFiltroMotivoVenta: CuentaCobrarPagar[];
  dataSinFiltroClienteProveedor: CuentaCobrarPagar[]; // [NUEVO]
  dataSinFiltroDetalle: CuentaCobrarPagar[]; // [NUEVO]
  refreshData: () => Promise<void>;
}

const CuentasCobrarPagarContext = createContext<CuentasCobrarPagarContextType | null>(null);

// Estado inicial para filtros globales (todos vacíos)
const filtrosIniciales = {
  empresa: [],
  responsable: [],
  tipo_cuenta: ['C'], // "Cobrar" por defecto
  cliente_proveedor: [],
  descripcion_comprobante: [],
  serie_comprobante: [],
  moneda: [],
};


export const CuentasCobrarPagarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<CuentaCobrarPagar[]>([]);
  // Inicializar filtros con el estado inicial
  const [filtros, setFiltros] = React.useState(filtrosIniciales);
  // Estado para la selección de Detalle
  const [detalleSeleccion, setDetalleSeleccion] = useState<DetalleSeleccion>({});
  // Estado para la selección de ClienteProveedor
  const [clienteProveedorSeleccion, setClienteProveedorSeleccion] = useState<ClienteProveedorSeleccion>({});
  // Estado para la selección de MotivoVenta
  const [motivoVentaSeleccion, setMotivoVentaSeleccion] = useState<MotivoVentaSeleccion>({});


  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getCuentasCobrarPagar();
      setData(res.data);
    } catch (e) {
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Filtros globales
  const setFiltro = useCallback((key: FiltroGlobalKey, value: string[]) => {
    setFiltros((prev) => ({ ...prev, [key]: value }));
  }, []); // Dependencia vacía ya que setFiltros es estable

  const clearFiltros = () => {
    setFiltros(filtrosIniciales);
  };

  // Setter para la selección de Detalle (con lógica de toggle)
  const handleSetDetalleSeleccion = useCallback((sel: DetalleSeleccion) => {
      // Lógica de toggle: si la nueva selección es igual a la actual, la limpiamos
      // Comparar todas las propiedades relevantes
      if (
          detalleSeleccion.fecha_vencimiento === sel.fecha_vencimiento &&
          detalleSeleccion.fecha_comprobante === sel.fecha_comprobante &&
          detalleSeleccion.codigo_cliente_proveedor === sel.codigo_cliente_proveedor &&
          detalleSeleccion.cliente_proveedor === sel.cliente_proveedor &&
          detalleSeleccion.serie_comprobante === sel.serie_comprobante &&
          detalleSeleccion.numero_comprobante === sel.numero_comprobante &&
          detalleSeleccion.tipo_comprobante === sel.tipo_comprobante &&
          detalleSeleccion.descripcion_comprobante === sel.descripcion_comprobante &&
          detalleSeleccion.tipo_cambio === sel.tipo_cambio &&
          detalleSeleccion.clickedColumn === sel.clickedColumn
      ) {
          setDetalleSeleccion({}); // Limpiar la selección de Detalle
      } else {
          // Si es una selección diferente, la establecemos
          setDetalleSeleccion(sel);
      }
  }, [detalleSeleccion]); // Dependencia: detalleSeleccion

  const clearDetalleSeleccion = useCallback(() => setDetalleSeleccion({}), []);


  // Setter para la selección de ClienteProveedor
  const handleSetClienteProveedorSeleccion = useCallback((sel: ClienteProveedorSeleccion) => {
      // Lógica de toggle: si la nueva selección es igual a la actual, la limpiamos
      if (
          clienteProveedorSeleccion.cliente_proveedor === sel.cliente_proveedor &&
          clienteProveedorSeleccion.moneda === sel.moneda &&
          clienteProveedorSeleccion.clickedColumn === sel.clickedColumn
      ) {
          setClienteProveedorSeleccion({});
      } else {
          setClienteProveedorSeleccion(sel);
      }
  }, [clienteProveedorSeleccion]); // Dependencia: clienteProveedorSeleccion


  // Setter para la selección de MotivoVenta
  const handleSetMotivoVentaSeleccion = useCallback((sel: MotivoVentaSeleccion) => {
      // Si la nueva selección es igual a la actual, la limpiamos (toggle)
      if (
          motivoVentaSeleccion.serie_comprobante === sel.serie_comprobante &&
          motivoVentaSeleccion.responsable === sel.responsable &&
          motivoVentaSeleccion.servicio === sel.servicio &&
          motivoVentaSeleccion.moneda === sel.moneda &&
          motivoVentaSeleccion.clickedColumn === sel.clickedColumn
      ) {
          setMotivoVentaSeleccion({});
      } else {
          setMotivoVentaSeleccion(sel);
      }
  }, [motivoVentaSeleccion]); // Dependencia: motivoVentaSeleccion


  // Función auxiliar para aplicar filtros globales
  const applyGlobalFilters = useCallback((dataToFilter: CuentaCobrarPagar[]) => {
      let filtered = [...dataToFilter];
      Object.entries(filtros).forEach(([key, values]) => {
          if (Array.isArray(values) && values.length > 0) {
              filtered = filtered.filter((item) => {
                  const itemValue = String((item as any)[key] ?? '').trim();
                  return values.map(v => v.trim()).includes(itemValue);
              });
          }
      });
      return filtered;
  }, [filtros]); // Dependencia: filtros globales

  // Función auxiliar para aplicar filtro de ClienteProveedor
  const applyClienteProveedorFilter = useCallback((dataToFilter: CuentaCobrarPagar[], selection: ClienteProveedorSeleccion) => {
      if (!selection.clickedColumn) return dataToFilter;

      return dataToFilter.filter(item => {
          let match = true;
          if (selection.clickedColumn === 'cliente_proveedor') {
              if (selection.cliente_proveedor !== undefined && item.cliente_proveedor !== selection.cliente_proveedor) {
                  match = false;
              }
          } else if (selection.clickedColumn === 'moneda' || selection.clickedColumn === 'sumario') {
               if (selection.cliente_proveedor !== undefined && item.cliente_proveedor !== selection.cliente_proveedor) {
                  match = false;
              }
               if (match && selection.moneda !== undefined && item.moneda !== selection.moneda) {
                  match = false;
              }
          }
          return match;
      });
  }, []); // Sin dependencias externas

  // Función auxiliar para aplicar filtro de MotivoVenta
  const applyMotivoVentaFilter = useCallback((dataToFilter: CuentaCobrarPagar[], selection: MotivoVentaSeleccion) => {
      if (!selection.clickedColumn) return dataToFilter;

      return dataToFilter.filter(item => {
          let match = true;
          if (selection.serie_comprobante !== undefined && item.serie_comprobante !== selection.serie_comprobante) {
              match = false;
          }
          if (match && (selection.clickedColumn === 'responsable' || selection.clickedColumn === 'servicio' || selection.clickedColumn === 'moneda' || selection.clickedColumn === 'sumario')) {
               if (selection.responsable !== undefined && item.responsable !== selection.responsable) {
                  match = false;
              }
          }
           if (match && (selection.clickedColumn === 'servicio' || selection.clickedColumn === 'moneda' || selection.clickedColumn === 'sumario')) {
               if (selection.servicio !== undefined && item.servicio !== selection.servicio) {
                  match = false;
              }
          }
           if (match && (selection.clickedColumn === 'moneda' || selection.clickedColumn === 'sumario')) {
               if (selection.moneda !== undefined && item.moneda !== selection.moneda) {
                  match = false;
              }
          }
          if (match && selection.clickedColumn === 'sumario') {
               if (selection.serie_comprobante !== undefined && item.serie_comprobante !== selection.serie_comprobante) {
                  match = false;
              }
               if (match && selection.responsable !== undefined && item.responsable !== selection.responsable) {
                  match = false;
               }
               if (match && selection.servicio !== undefined && item.servicio !== selection.servicio) {
                  match = false;
               }
               if (match && selection.moneda !== undefined && item.moneda !== selection.moneda) {
                  match = false;
               }
          }
          return match;
      });
  }, []); // Sin dependencias externas

  // Función auxiliar para aplicar filtro de Detalle
  const applyDetalleFilter = useCallback((dataToFilter: CuentaCobrarPagar[], selection: DetalleSeleccion) => {
      if (!selection.clickedColumn) return dataToFilter;

      return dataToFilter.filter(item => {
          let match = true;
          if (selection.fecha_vencimiento !== undefined && item.fecha_vencimiento !== selection.fecha_vencimiento) {
              match = false;
          }
          if (match && (selection.clickedColumn === 'fecha_comprobante' || selection.clickedColumn === 'codigo_cliente_proveedor' || selection.clickedColumn === 'cliente_proveedor' || selection.clickedColumn === 'serie_comprobante' || selection.clickedColumn === 'numero_comprobante' || selection.clickedColumn === 'tipo_comprobante' || selection.clickedColumn === 'descripcion_comprobante' || selection.clickedColumn === 'tipo_cambio' || selection.clickedColumn === 'sumario')) {
               if (selection.fecha_comprobante !== undefined && item.fecha_comprobante !== selection.fecha_comprobante) {
                  match = false;
               }
          }
           if (match && (selection.clickedColumn === 'codigo_cliente_proveedor' || selection.clickedColumn === 'cliente_proveedor' || selection.clickedColumn === 'serie_comprobante' || selection.clickedColumn === 'numero_comprobante' || selection.clickedColumn === 'tipo_comprobante' || selection.clickedColumn === 'descripcion_comprobante' || selection.clickedColumn === 'tipo_cambio' || selection.clickedColumn === 'sumario')) {
               if (selection.codigo_cliente_proveedor !== undefined && item.codigo_cliente_proveedor !== selection.codigo_cliente_proveedor) {
                  match = false;
               }
          }
           if (match && (selection.clickedColumn === 'cliente_proveedor' || selection.clickedColumn === 'serie_comprobante' || selection.clickedColumn === 'numero_comprobante' || selection.clickedColumn === 'tipo_comprobante' || selection.clickedColumn === 'descripcion_comprobante' || selection.clickedColumn === 'tipo_cambio' || selection.clickedColumn === 'sumario')) {
               if (selection.cliente_proveedor !== undefined && item.cliente_proveedor !== selection.cliente_proveedor) {
                  match = false;
               }
          }
           if (match && (selection.clickedColumn === 'serie_comprobante' || selection.clickedColumn === 'numero_comprobante' || selection.clickedColumn === 'tipo_comprobante' || selection.clickedColumn === 'descripcion_comprobante' || selection.clickedColumn === 'tipo_cambio' || selection.clickedColumn === 'sumario')) {
               if (selection.serie_comprobante !== undefined && item.serie_comprobante !== selection.serie_comprobante) {
                  match = false;
               }
          }
           if (match && (selection.clickedColumn === 'numero_comprobante' || selection.clickedColumn === 'tipo_comprobante' || selection.clickedColumn === 'descripcion_comprobante' || selection.clickedColumn === 'tipo_cambio' || selection.clickedColumn === 'sumario')) {
               if (selection.numero_comprobante !== undefined && item.numero_comprobante !== selection.numero_comprobante) {
                  match = false;
               }
          }
           if (match && (selection.clickedColumn === 'tipo_comprobante' || selection.clickedColumn === 'descripcion_comprobante' || selection.clickedColumn === 'tipo_cambio' || selection.clickedColumn === 'sumario')) {
               if (selection.tipo_comprobante !== undefined && item.tipo_comprobante !== selection.tipo_comprobante) {
                  match = false;
               }
          }
           if (match && (selection.clickedColumn === 'descripcion_comprobante' || selection.clickedColumn === 'tipo_cambio' || selection.clickedColumn === 'sumario')) {
               if (selection.descripcion_comprobante !== undefined && item.descripcion_comprobante !== selection.descripcion_comprobante) {
                  match = false;
               }
          }
           if (match && (selection.clickedColumn === 'tipo_cambio' || selection.clickedColumn === 'sumario')) {
               if (selection.tipo_cambio !== undefined && String(item.tipo_cambio ?? '') !== selection.tipo_cambio) { // Comparar como string
                  match = false;
               }
          }
          if (match && selection.clickedColumn === 'sumario') {
               if (selection.fecha_vencimiento !== undefined && item.fecha_vencimiento !== selection.fecha_vencimiento) {
                  match = false;
               }
               if (match && selection.fecha_comprobante !== undefined && item.fecha_comprobante !== selection.fecha_comprobante) {
                  match = false;
               }
               if (match && selection.codigo_cliente_proveedor !== undefined && item.codigo_cliente_proveedor !== selection.codigo_cliente_proveedor) {
                  match = false;
               }
               if (match && selection.cliente_proveedor !== undefined && item.cliente_proveedor !== selection.cliente_proveedor) {
                  match = false;
               }
               if (match && selection.serie_comprobante !== undefined && item.serie_comprobante !== selection.serie_comprobante) {
                  match = false;
               }
               if (match && selection.numero_comprobante !== undefined && item.numero_comprobante !== selection.numero_comprobante) {
                  match = false;
               }
               if (match && selection.tipo_comprobante !== undefined && item.tipo_comprobante !== selection.tipo_comprobante) {
                  match = false;
               }
               if (match && selection.descripcion_comprobante !== undefined && item.descripcion_comprobante !== selection.descripcion_comprobante) {
                  match = false;
               }
               if (match && selection.tipo_cambio !== undefined && String(item.tipo_cambio ?? '') !== selection.tipo_cambio) { // Comparar como string
                  match = false;
               }
          }
          return match;
      });
  }, []); // Sin dependencias externas


  // [MODIFICADO] Data filtrada SIN la selección de MotivoVenta (para MotivoVentaTabla)
  const dataSinFiltroMotivoVenta = React.useMemo(() => {
      let filtered = applyGlobalFilters(data);
      filtered = applyClienteProveedorFilter(filtered, clienteProveedorSeleccion);
      filtered = applyDetalleFilter(filtered, detalleSeleccion);
      // NOTA: Aquí NO aplicamos el filtro basado en motivoVentaSeleccion
      return filtered;
  }, [data, applyGlobalFilters, applyClienteProveedorFilter, applyDetalleFilter, clienteProveedorSeleccion, detalleSeleccion]); // Dependencias: data, filtros globales, selecciones de otras tablas

  // [NUEVO] Data filtrada SIN la selección de ClienteProveedor (para ClientesProveedoresTabla)
  const dataSinFiltroClienteProveedor = React.useMemo(() => {
      let filtered = applyGlobalFilters(data);
      filtered = applyMotivoVentaFilter(filtered, motivoVentaSeleccion);
      filtered = applyDetalleFilter(filtered, detalleSeleccion);
      // NOTA: Aquí NO aplicamos el filtro basado en clienteProveedorSeleccion
      return filtered;
  }, [data, applyGlobalFilters, applyMotivoVentaFilter, applyDetalleFilter, motivoVentaSeleccion, detalleSeleccion]); // Dependencias: data, filtros globales, selecciones de otras tablas

  // [NUEVO] Data filtrada SIN la selección de Detalle (para DetalleTabla)
  const dataSinFiltroDetalle = React.useMemo(() => {
      let filtered = applyGlobalFilters(data);
      filtered = applyClienteProveedorFilter(filtered, clienteProveedorSeleccion);
      filtered = applyMotivoVentaFilter(filtered, motivoVentaSeleccion);
      // NOTA: Aquí NO aplicamos el filtro basado en detalleSeleccion
      return filtered;
  }, [data, applyGlobalFilters, applyClienteProveedorFilter, applyMotivoVentaFilter, clienteProveedorSeleccion, motivoVentaSeleccion]); // Dependencias: data, filtros globales, selecciones de otras tablas


  // [MODIFICADO] Data filtrada por TODOS los filtros y selecciones (para KPIs y exportaciones globales)
  const dataFiltrada = React.useMemo(() => {
    let filtered = applyGlobalFilters(data);
    filtered = applyClienteProveedorFilter(filtered, clienteProveedorSeleccion);
    filtered = applyMotivoVentaFilter(filtered, motivoVentaSeleccion);
    filtered = applyDetalleFilter(filtered, detalleSeleccion);
    return filtered;
  }, [data, applyGlobalFilters, applyClienteProveedorFilter, applyMotivoVentaFilter, applyDetalleFilter, clienteProveedorSeleccion, motivoVentaSeleccion, detalleSeleccion]); // Dependencias: data, todos los filtros y selecciones


  return (
    <CuentasCobrarPagarContext.Provider
      value={{
        isLoading,
        data,
        filtros,
        setFiltro,
        clearFiltros,
        // Proveer estado y setters de Detalle
        detalleSeleccion,
        setDetalleSeleccion: handleSetDetalleSeleccion, // Usar el setter con lógica de toggle
        clearDetalleSeleccion,
        // Proveer estado y setter de ClienteProveedor
        clienteProveedorSeleccion,
        setClienteProveedorSeleccion: handleSetClienteProveedorSeleccion,
        // Proveer el estado y setter de MotivoVenta
        motivoVentaSeleccion,
        setMotivoVentaSeleccion: handleSetMotivoVentaSeleccion,
        dataFiltrada, // Data para KPIs y exportaciones globales
        dataSinFiltroMotivoVenta, // Data para MotivoVentaTabla
        dataSinFiltroClienteProveedor, // [NUEVO] Data para ClientesProveedoresTabla
        dataSinFiltroDetalle, // [NUEVO] Data para DetalleTabla
        refreshData,
      }}
    >
      {children}
    </CuentasCobrarPagarContext.Provider>
  );
};

export const useCuentasCobrarPagar = () => {
  const ctx = useContext(CuentasCobrarPagarContext);
  if (!ctx) throw new Error('useCuentasCobrarPagar debe usarse dentro de CuentasCobrarPagarProvider');
  return ctx;
};