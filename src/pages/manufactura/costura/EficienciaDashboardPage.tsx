// src/pages/Manufactura/Costura/EficienciaDashboardPage.tsx
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { subDays, subMonths, format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';

import { costuraService } from '../../../services/costura.service';
import type {
  ReporteEficienciaCosturaResponse,
  EficienciaCosturaItem,
} from '../../../types/costura.types';
import { getIcon } from '../../../lib/icon-utils';
import * as LucideIcons from 'lucide-react';

// --- Tipos para los datos procesados para gráficos ---
interface EficienciaPorLinea {
  linea: string;
  eficiencia_promedio: number;
  minutos_producidos: number;
  minutos_disponibles: number;
  prendas_producidas: number;
}

interface EficienciaPorTrabajador {
  codigo_trabajador: string;
  nombre_trabajador: string;
  eficiencia_promedio: number;
  minutos_producidos: number;
  minutos_disponibles: number;
  prendas_producidas: number;
  linea?: string | null;
}

interface TendenciaData {
  fechaOriginal: string;
  fechaFormateada: string;
  eficiencia: number;
  min_prod: number;
  min_disp: number;
}

interface ProduccionOperacionData {
    operacion: string;
    minutos_producidos: number;
    minutos_estandar_esperados: number;
    cantidad_total_prendas: number;
}

interface KpiData {
    eficiencia_promedio_general_periodo: number;
    total_prendas_producidas_periodo: number;
    total_minutos_producidos_periodo: number;
    total_minutos_disponibles_periodo: number;
}

// --- Constantes ---
const TOP_N_TRABAJADORES = 5;
const COLORES_BARRAS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const INPUT_CLASS = "block w-full px-3 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100";

// --- Helper function para clave única de trabajador y fecha ---
const getTrabajadorFechaKey = (codigo_trabajador: string, fecha_proceso_iso: string): string => {
  try {
    return `${codigo_trabajador}_${format(parseISO(fecha_proceso_iso), 'yyyy-MM-dd')}`;
  } catch (error) {
    return `${codigo_trabajador}_${fecha_proceso_iso}`;
  }
};


const EficienciaDashboardPage: React.FC = () => {
  const today = new Date();

  const [fechaInicioStr, setFechaInicioStr] = useState<string>(format(subDays(today, 7), 'yyyy-MM-dd'));
  const [fechaFinStr, setFechaFinStr] = useState<string>(format(today, 'yyyy-MM-dd'));
  const [filtroRapido, setFiltroRapido] = useState<string>('ultimaSemana');
  const [reporteDataOriginal, setReporteDataOriginal] = useState<ReporteEficienciaCosturaResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedLinea, setSelectedLinea] = useState<string | null>(null);

  useEffect(() => {
    let inicio = today;
    let fin = today;
    if (filtroRapido === 'ultimaSemana') {
      inicio = startOfWeek(today, { locale: es, weekStartsOn: 1 });
      fin = endOfWeek(today, { locale: es, weekStartsOn: 1 });
    } else if (filtroRapido === 'ultimoMes') {
      const mesReferencia = startOfMonth(today);
      inicio = subMonths(mesReferencia, 1);
      fin = endOfMonth(subMonths(mesReferencia, 1));
    } else if (filtroRapido === 'mesActual') {
        inicio = startOfMonth(today);
        fin = endOfMonth(today);
    } else if (filtroRapido === 'personalizado') return;
    setFechaInicioStr(format(inicio, 'yyyy-MM-dd'));
    setFechaFinStr(format(fin, 'yyyy-MM-dd'));
  }, [filtroRapido, today]);

  const handleGenerarReporte = useCallback(async (isBackgroundRefresh = false) => {
    if (!fechaInicioStr || !fechaFinStr) {
      toast.error("Por favor, seleccione ambas fechas.");
      return;
    }
    const parsedFechaInicio = parseISO(fechaInicioStr);
    const parsedFechaFin = parseISO(fechaFinStr);
    if (!isValid(parsedFechaInicio) || !isValid(parsedFechaFin)) {
        toast.error("Las fechas seleccionadas no son válidas.");
        return;
    }
    if (parsedFechaInicio > parsedFechaFin) {
      toast.error("La fecha de inicio no puede ser posterior a la fecha de fin.");
      return;
    }
    if (!isBackgroundRefresh) setIsLoading(true);
    try {
      const params = { fecha_inicio: fechaInicioStr, fecha_fin: fechaFinStr };
      const data = await costuraService.getReporteEficiencia(params);
      setReporteDataOriginal(data);
      if (!isBackgroundRefresh) {
        toast.success(data.datos_reporte.length === 0 ? "Reporte generado. No se encontraron datos." : "Reporte de eficiencia generado!");
      }
    } catch (err: any) {
      console.error("Error al generar reporte:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Error al generar el reporte.";
      if (!isBackgroundRefresh) toast.error(`Error: ${errorMsg}`);
      setReporteDataOriginal(null);
    } finally {
      if (!isBackgroundRefresh) setIsLoading(false);
    }
  }, [fechaInicioStr, fechaFinStr]);

  useEffect(() => {
    if (filtroRapido === 'personalizado' && (!fechaInicioStr || !fechaFinStr)) return;
    handleGenerarReporte();
  }, [fechaInicioStr, fechaFinStr, handleGenerarReporte]);

  const datosReporteFiltrados = useMemo((): EficienciaCosturaItem[] => {
    if (!reporteDataOriginal?.datos_reporte) return [];
    if (selectedLinea) {
      return reporteDataOriginal.datos_reporte.filter(item => (item.linea || 'Sin Línea') === selectedLinea);
    }
    return reporteDataOriginal.datos_reporte;
  }, [reporteDataOriginal, selectedLinea]);

  const datosEficienciaPorLinea = useMemo((): EficienciaPorLinea[] => {
    if (!reporteDataOriginal?.datos_reporte) return [];
    const agrupado: Record<string, { prod: number; disp: number; prendas: number; _trabajadorFechaProcesadosDisp: Set<string> }> = {};

    reporteDataOriginal.datos_reporte.forEach(item => {
      const linea = item.linea || 'Sin Línea';
      if (!agrupado[linea]) {
        agrupado[linea] = { prod: 0, disp: 0, prendas: 0, _trabajadorFechaProcesadosDisp: new Set<string>() };
      }
      agrupado[linea].prod += item.minutos_producidos_total;
      agrupado[linea].prendas += item.cantidad_prendas_producidas;

      const trabajadorFechaKey = getTrabajadorFechaKey(item.codigo_trabajador, item.fecha_proceso);
      if (!agrupado[linea]._trabajadorFechaProcesadosDisp.has(trabajadorFechaKey)) {
        agrupado[linea].disp += item.minutos_disponibles_jornada;
        agrupado[linea]._trabajadorFechaProcesadosDisp.add(trabajadorFechaKey);
      }
    });

    return Object.entries(agrupado).map(([linea, data]) => ({
      linea,
      eficiencia_promedio: data.disp > 0 ? (data.prod / data.disp) * 100 : 0,
      minutos_producidos: data.prod,
      minutos_disponibles: data.disp,
      prendas_producidas: data.prendas,
    })).sort((a, b) => b.eficiencia_promedio - a.eficiencia_promedio);
  }, [reporteDataOriginal]);

  const kpisCalculados = useMemo((): KpiData => {
    if (datosReporteFiltrados.length === 0) {
        return { eficiencia_promedio_general_periodo: 0, total_prendas_producidas_periodo: 0, total_minutos_producidos_periodo: 0, total_minutos_disponibles_periodo: 0 };
    }
    let totalMinProd = 0;
    let totalMinDisp = 0;
    let totalPrendas = 0;
    const trabajadorFechaProcesadosKpiDisp = new Set<string>();

    datosReporteFiltrados.forEach(item => {
        totalMinProd += item.minutos_producidos_total;
        totalPrendas += item.cantidad_prendas_producidas;
        const trabajadorFechaKey = getTrabajadorFechaKey(item.codigo_trabajador, item.fecha_proceso);
        if (!trabajadorFechaProcesadosKpiDisp.has(trabajadorFechaKey)) {
            totalMinDisp += item.minutos_disponibles_jornada;
            trabajadorFechaProcesadosKpiDisp.add(trabajadorFechaKey);
        }
    });
    
    return {
        eficiencia_promedio_general_periodo: totalMinDisp > 0 ? (totalMinProd / totalMinDisp) * 100 : 0,
        total_prendas_producidas_periodo: totalPrendas,
        total_minutos_producidos_periodo: totalMinProd,
        total_minutos_disponibles_periodo: totalMinDisp,
    };
  }, [datosReporteFiltrados]);

  const datosEficienciaPorTrabajador = useMemo((): EficienciaPorTrabajador[] => {
    if (datosReporteFiltrados.length === 0) return []; 
    const agrupado: Record<string, { prod: number; disp: number; nombre: string; prendas: number; linea?: string | null; _fechasProcesadasDisp: Set<string> }> = {};
    
    datosReporteFiltrados.forEach(item => {
      const trabajadorId = item.codigo_trabajador;
      if (!agrupado[trabajadorId]) {
        agrupado[trabajadorId] = { prod: 0, disp: 0, nombre: item.nombre_trabajador || trabajadorId, prendas: 0, linea: item.linea, _fechasProcesadasDisp: new Set<string>() };
      }
      agrupado[trabajadorId].prod += item.minutos_producidos_total;
      agrupado[trabajadorId].prendas += item.cantidad_prendas_producidas;
      agrupado[trabajadorId].linea = item.linea; 

      const fechaKey = format(parseISO(item.fecha_proceso), 'yyyy-MM-dd');
      if (!agrupado[trabajadorId]._fechasProcesadasDisp.has(fechaKey)) {
        agrupado[trabajadorId].disp += item.minutos_disponibles_jornada;
        agrupado[trabajadorId]._fechasProcesadasDisp.add(fechaKey);
      }
    });

    return Object.entries(agrupado).map(([codigo_trabajador, data]) => ({
      codigo_trabajador,
      nombre_trabajador: data.nombre,
      eficiencia_promedio: data.disp > 0 ? (data.prod / data.disp) * 100 : 0,
      minutos_producidos: data.prod,
      minutos_disponibles: data.disp,
      prendas_producidas: data.prendas,
      linea: data.linea
    }))
    .sort((a, b) => b.eficiencia_promedio - a.eficiencia_promedio)
    .slice(0, TOP_N_TRABAJADORES);
  }, [datosReporteFiltrados]);

  const datosTendencia = useMemo(() => {
    if (datosReporteFiltrados.length === 0) return [];
    return procesarTendenciaEficiencia(datosReporteFiltrados); // No se pasa getTrabajadorFechaKey
  }, [datosReporteFiltrados]);

  const datosProduccionOperacion = useMemo(() => {
    if (datosReporteFiltrados.length === 0) return [];
    return procesarProduccionPorOperacion(datosReporteFiltrados).slice(0,5);
  }, [datosReporteFiltrados]);

  const handleLineaClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const lineaClickeada = data.activePayload[0].payload.linea;
      setSelectedLinea(prev => prev === lineaClickeada ? null : lineaClickeada);
    } else {
        setSelectedLinea(null);
    }
  };
  
  const handleFiltroRapidoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltroRapido(e.target.value);
    setSelectedLinea(null);
  };

  const handleFechaChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setSelectedLinea(null);
    if (filtroRapido !== 'personalizado') {
        setFiltroRapido('personalizado');
    }
  };

  const KpiCard: React.FC<{ title: string; value: string | number; iconName: keyof typeof LucideIcons; unit?: string, isLoading?: boolean }> = 
  ({ title, value, iconName, unit, isLoading }) => {
    const Icon = getIcon(iconName) || <LucideIcons.HelpCircle />;
    return (
      <div className="bg-white dark:bg-gray-800 p-4 shadow rounded-lg flex items-center">
        <div className={`p-3 rounded-full mr-4 ${isLoading ? 'bg-gray-200 dark:bg-gray-700' : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300'}`}>
          {isLoading ? <div className="w-6 h-6 animate-pulse bg-gray-300 dark:bg-gray-600 rounded-full"></div> : React.cloneElement(Icon as React.ReactElement, { size: 24 })}
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          {isLoading ? <div className="h-6 w-24 mt-1 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div> :
            <p className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              {typeof value === 'number' ? value.toFixed(2) : value}
              {unit && <span className="text-sm ml-1">{unit}</span>}
            </p>
          }
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
          Dashboard de Eficiencia de Costura {selectedLinea ? `(Línea: ${selectedLinea})` : ''}
        </h1>
      </header>

      <div className="mb-6 p-4 bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="filtroRapido" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Periodo</label>
            <select id="filtroRapido" value={filtroRapido} onChange={handleFiltroRapidoChange} className={INPUT_CLASS}>
              <option value="ultimaSemana">Última Semana</option>
              <option value="mesActual">Este Mes</option>
              <option value="ultimoMes">Último Mes Completo</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </div>
          <>
            <div>
              <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Inicio</label>
              <input type="date" id="fechaInicio" value={fechaInicioStr} onChange={handleFechaChange(setFechaInicioStr)} className={INPUT_CLASS} disabled={filtroRapido !== 'personalizado'}/>
            </div>
            <div>
              <label htmlFor="fechaFin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Fin</label>
              <input type="date" id="fechaFin" value={fechaFinStr} onChange={handleFechaChange(setFechaFinStr)} className={INPUT_CLASS} disabled={filtroRapido !== 'personalizado'}/>
            </div>
          </>
          <button onClick={() => handleGenerarReporte()} disabled={isLoading} className={`w-full md:mt-0 ${filtroRapido !== 'personalizado' ? 'md:col-start-4' : ''} px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed`}>
            {isLoading ? 'Actualizando...' : 'Actualizar Reporte'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Eficiencia General" value={kpisCalculados.eficiencia_promedio_general_periodo} unit="%" iconName="TrendingUp" isLoading={isLoading && !reporteDataOriginal} />
        <KpiCard title="Prendas Producidas" value={kpisCalculados.total_prendas_producidas_periodo} iconName="Package" isLoading={isLoading && !reporteDataOriginal} />
        <KpiCard title="Minutos Producidos" value={kpisCalculados.total_minutos_producidos_periodo} iconName="Clock" isLoading={isLoading && !reporteDataOriginal} />
        <KpiCard title="Minutos Disponibles" value={kpisCalculados.total_minutos_disponibles_periodo} iconName="CalendarDays" isLoading={isLoading && !reporteDataOriginal} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 shadow rounded-lg">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Eficiencia Promedio por Línea</h2>
          {isLoading && datosEficienciaPorLinea.length === 0 ? <p className="text-gray-500 dark:text-gray-400">Cargando...</p> : datosEficienciaPorLinea.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosEficienciaPorLinea} onClick={handleLineaClick} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="linea" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} domain={[0, 'dataMax + 10']} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => [`${value.toFixed(2)}%`, "Eficiencia"]} />
                <Legend />
                <Bar dataKey="eficiencia_promedio" name="Eficiencia (%)" radius={[4, 4, 0, 0]}>
                  {datosEficienciaPorLinea.map((entry, index) => (
                    <Cell key={`cell-${index}`} cursor="pointer" fill={entry.linea === selectedLinea ? '#ff7300' : '#8884d8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500 dark:text-gray-400">No hay datos de líneas.</p>}
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 shadow rounded-lg">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Top {TOP_N_TRABAJADORES} Trabajadores {selectedLinea ? `(Línea: ${selectedLinea})` : ''}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {selectedLinea ? `Trabajadores de la línea seleccionada.` : `Todos los trabajadores.`}
            {selectedLinea && <button onClick={() => setSelectedLinea(null)} className="ml-2 text-indigo-500 hover:underline text-xs">(Mostrar todos)</button>}
          </p>
          {isLoading && datosEficienciaPorTrabajador.length === 0 ? <p className="text-gray-500 dark:text-gray-400">Cargando...</p> : datosEficienciaPorTrabajador.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosEficienciaPorTrabajador} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis type="number" tickFormatter={(value) => `${value.toFixed(0)}%`} domain={[0, 'dataMax + 10']} tick={{ fontSize: 12 }} />
                <YAxis dataKey="nombre_trabajador" type="category" width={100} tick={{ fontSize: 10 }} interval={0} />
                <Tooltip formatter={(value: number) => [`${value.toFixed(2)}%`, "Eficiencia"]} />
                <Legend />
                <Bar dataKey="eficiencia_promedio" name="Eficiencia (%)" radius={[0, 4, 4, 0]}>
                    {datosEficienciaPorTrabajador.map((_entry, index) => (
                        <Cell key={`cell-trab-${index}`} fill={COLORES_BARRAS[index % COLORES_BARRAS.length]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500 dark:text-gray-400">No hay datos de trabajadores.</p>}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Análisis Adicional {selectedLinea ? `(Línea: ${selectedLinea})` : ''}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-4 shadow rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Tendencia Eficiencia {selectedLinea ? `(Línea: ${selectedLinea})` : 'General'}
            </h3>
            {isLoading && datosTendencia.length === 0 ? <p className="text-gray-500 dark:text-gray-400">Cargando...</p> : datosTendencia.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={datosTendencia} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                        <XAxis dataKey="fechaFormateada" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} domain={[0, 'dataMax + 10']} tick={{ fontSize: 12 }}/>
                        <Tooltip formatter={(value: number) => [`${value.toFixed(2)}%`, "Eficiencia"]}/>
                        <Legend />
                        <Line type="monotone" dataKey="eficiencia" name="Eficiencia Diaria" stroke="#ff7300" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            ) : <p className="text-gray-500 dark:text-gray-400">Datos insuficientes para tendencia.</p>}
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 shadow rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Producción vs. Estándar (Top 5 Op.) {selectedLinea ? `(Línea: ${selectedLinea})` : ''}
            </h3>
            {isLoading && datosProduccionOperacion.length === 0 ? <p className="text-gray-500 dark:text-gray-400">Cargando...</p> : datosProduccionOperacion.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={datosProduccionOperacion} margin={{ top: 5, right: 20, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                        <XAxis dataKey="operacion" angle={-45} textAnchor="end" interval={0} height={80} tick={{ fontSize: 10 }}/>
                        <YAxis tick={{ fontSize: 12 }}/>
                        <Tooltip />
                        <Legend wrapperStyle={{paddingTop: 20}}/>
                        <Bar dataKey="minutos_producidos" name="Min. Producidos" stackId="a" fill="#8884d8" />
                        <Bar dataKey="minutos_estandar_esperados" name="Min. Estándar (SAM)" stackId="a" fill="#82ca9d" />
                    </BarChart>
                </ResponsiveContainer>
            ) : <p className="text-gray-500 dark:text-gray-400">Datos insuficientes para operaciones.</p>}
          </div>
        </div>
      </div>

      {reporteDataOriginal?.debug_note && (
        <div className="mt-6 p-3 bg-yellow-100 dark:bg-yellow-700 border border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-200 rounded-md text-sm">
          <strong>Nota de Desarrollo:</strong> {reporteDataOriginal.debug_note}
        </div>
      )}
    </div>
  );
};

// --- Funciones Auxiliares para Procesar Datos para Gráficos Adicionales ---
const procesarTendenciaEficiencia = (datos: EficienciaCosturaItem[]): TendenciaData[] => {
  const agrupadoPorFecha: Record<string, { prod: number; disp: number; _trabajadoresProcesadosDisp: Set<string> }> = {};
  
  datos.forEach(item => {
    const fechaOriginalStr = format(parseISO(item.fecha_proceso), 'yyyy-MM-dd');
    if (!agrupadoPorFecha[fechaOriginalStr]) {
      agrupadoPorFecha[fechaOriginalStr] = { prod: 0, disp: 0, _trabajadoresProcesadosDisp: new Set<string>() };
    }
    agrupadoPorFecha[fechaOriginalStr].prod += item.minutos_producidos_total;

    const trabajadorKeyParaEstaFecha = item.codigo_trabajador; 

    if (!agrupadoPorFecha[fechaOriginalStr]._trabajadoresProcesadosDisp.has(trabajadorKeyParaEstaFecha)) {
      agrupadoPorFecha[fechaOriginalStr].disp += item.minutos_disponibles_jornada;
      agrupadoPorFecha[fechaOriginalStr]._trabajadoresProcesadosDisp.add(trabajadorKeyParaEstaFecha);
    }
  });

  return Object.entries(agrupadoPorFecha)
    .map(([fechaOriginal, data]) => ({
      fechaOriginal,
      fechaFormateada: format(parseISO(fechaOriginal), 'dd/MM'),
      eficiencia: data.disp > 0 ? (data.prod / data.disp) * 100 : 0,
      min_prod: data.prod,
      min_disp: data.disp,
    }))
    .sort((a, b) => {
      const dateA = parseISO(a.fechaOriginal);
      const dateB = parseISO(b.fechaOriginal);
      if (isValid(dateA) && isValid(dateB)) {
        return dateA.getTime() - dateB.getTime();
      }
      return 0;
    });
};

const procesarProduccionPorOperacion = (datos: EficienciaCosturaItem[]): ProduccionOperacionData[] => {
    const agrupado: Record<string, { prod: number; sam_total: number; prendas: number }> = {};
    datos.forEach(item => {
        const opKey = item.nombre_operacion || item.codigo_operacion || 'Desconocida';
        if (!agrupado[opKey]) {
            agrupado[opKey] = { prod: 0, sam_total: 0, prendas: 0 };
        }
        agrupado[opKey].prod += item.minutos_producidos_total;
        const tiempoEstandar = typeof item.tiempo_estandar_minutos_prenda === 'number' ? item.tiempo_estandar_minutos_prenda : 0;
        agrupado[opKey].sam_total += tiempoEstandar * item.cantidad_prendas_producidas;
        agrupado[opKey].prendas += item.cantidad_prendas_producidas;
    });

    return Object.entries(agrupado)
        .map(([operacion, data]) => ({
            operacion,
            minutos_producidos: data.prod,
            minutos_estandar_esperados: data.sam_total,
            cantidad_total_prendas: data.prendas,
        }))
        .sort((a,b) => b.minutos_producidos - a.minutos_producidos);
};

export default EficienciaDashboardPage;