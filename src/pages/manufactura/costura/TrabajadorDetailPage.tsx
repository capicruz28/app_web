// src/pages/manufactura/costura/TrabajadorDetailPage.tsx
import React, { useMemo, useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useEficiencia } from '../../../context/EficienciaContext';
import { TendenciaEficiencia } from '../../../components/costura/TendenciaEficiencia';
import { 
  RefreshCw, Target, Package, Clock, AlertCircle, 
  TrendingUp, TrendingDown 
} from 'lucide-react';
import { 
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
  subWeeks, subMonths, format 
} from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import type { 
  TrabajadorDetalle, 
  OperacionAnalisis,
  EstadisticasTrabajador 
} from '../../../types/costura.types';

// Constantes
const INPUT_CLASS = "block w-full px-2 py-1 text-sm border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100";
const BUTTON_DATE_PRESET_BASE = "px-3 py-1 rounded text-xs font-medium border";
const BUTTON_DATE_PRESET_ACTIVE = "bg-indigo-600 text-white border-indigo-600";
const BUTTON_DATE_PRESET_INACTIVE = "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600";

type FiltroFecha = 'semana' | 'mes' | 'personalizado';
type Tendencia = 'ascendente' | 'descendente' | 'estable';

// Funciones auxiliares
const getUltimaSemanaCerrada = () => {
  const today = new Date();
  const lastWeek = subWeeks(today, 1);
  const inicio = startOfWeek(lastWeek, { weekStartsOn: 1 });
  const fin = endOfWeek(lastWeek, { weekStartsOn: 1 });
  return {
    inicio: format(inicio, 'yyyy-MM-dd'),
    fin: format(fin, 'yyyy-MM-dd'),
  };
};

const getUltimoMesCerrado = () => {
  const lastMonth = subMonths(new Date(), 1);
  const inicio = startOfMonth(lastMonth);
  const fin = endOfMonth(lastMonth);
  return {
    inicio: format(inicio, 'yyyy-MM-dd'),
    fin: format(fin, 'yyyy-MM-dd'),
  };
};

const getTendenciaEficiencia = (promedioInicial: number, promedioFinal: number): Tendencia => {
  if (Math.abs(promedioFinal - promedioInicial) < 5) return 'estable';
  return promedioFinal > promedioInicial ? 'ascendente' : 'descendente';
};

// Componentes auxiliares
const KPICard: React.FC<{
  title: string;
  value: string;
  trend?: number;
  icon?: React.ReactNode;
  description?: string;
}> = ({ title, value, trend, icon, description }) => (
  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
    <div className="flex justify-between items-start mb-2">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
      {icon}
    </div>
    <div className="flex items-baseline">
      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
      {trend !== undefined && (
        <span className={`ml-2 text-sm ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    {description && (
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
    )}
  </div>
);

const OperacionesTable: React.FC<{
  operaciones: OperacionAnalisis[];
  title: string;
}> = ({ operaciones, title }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
    <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">{title}</h3>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Operación</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Eficiencia</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Prendas</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">T. Promedio</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {operaciones.map((op) => (
            <tr key={op.codigo}>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{op.nombre}</td>
              <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-gray-100">
                {op.eficiencia.toFixed(1)}%
              </td>
              <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-gray-100">
                {op.cantidadPrendas.toLocaleString()}
              </td>
              <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-gray-100">
                {op.tiempoPromedioPrenda.toFixed(2)} min
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const TrabajadorDetailPage: React.FC = () => {
  const { codigoTrabajador } = useParams<{ codigoTrabajador: string }>();
  const { 
    isLoading,
    data: eficienciaData,
    fechaInicio,
    fechaFin,
    setFechaInicio,
    setFechaFin,
    refreshData
  } = useEficiencia();

  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('semana');

  useEffect(() => {
    if (filtroFecha === 'semana') {
      const { inicio, fin } = getUltimaSemanaCerrada();
      setFechaInicio(inicio);
      setFechaFin(fin);
    } else if (filtroFecha === 'mes') {
      const { inicio, fin } = getUltimoMesCerrado();
      setFechaInicio(inicio);
      setFechaFin(fin);
    }
    // eslint-disable-next-line
  }, [filtroFecha]);

  const fechaInputsDisabled = filtroFecha !== 'personalizado';

  const trabajadorDetalle = useMemo((): TrabajadorDetalle | null => {
    if (!eficienciaData?.datos_reporte || !codigoTrabajador) return null;
    
    const datosDelTrabajador = eficienciaData.datos_reporte.filter(
      item => item.codigo_trabajador === codigoTrabajador
    );
    
    if (datosDelTrabajador.length === 0) return null;

    const nombre = datosDelTrabajador[0].nombre_trabajador || codigoTrabajador;
    const lineas = new Set(datosDelTrabajador.map(item => item.linea || 'Sin Línea'));
    
    // Acumuladores
    let minutosProducidosTotal = 0;
    let minutosDisponiblesTotal = 0;
    let prendasTotal = 0;
    const fechasProcesadas = new Set<string>();
    
    // Maps para análisis
    const operacionesMap = new Map<string, OperacionAnalisis>();
    const analisisDiarioMap = new Map<string, {
      prod: number;
      disp: number;
      prendas: number;
      operaciones: Set<string>;
    }>();

    // Procesar cada registro
    datosDelTrabajador.forEach(item => {
      minutosProducidosTotal += item.minutos_producidos_total;
      prendasTotal += item.cantidad_prendas_producidas;
      
      if (!fechasProcesadas.has(item.fecha_proceso)) {
        minutosDisponiblesTotal += item.minutos_disponibles_jornada;
        fechasProcesadas.add(item.fecha_proceso);
      }

      // Procesar operaciones
      const opKey = item.codigo_operacion;
      if (!operacionesMap.has(opKey)) {
        operacionesMap.set(opKey, {
          codigo: item.codigo_operacion,
          nombre: item.nombre_operacion || item.codigo_operacion,
          cantidadPrendas: 0,
          minutosProducidos: 0,
          eficiencia: 0,
          tiempoPromedioPrenda: 0
        });
      }
      const op = operacionesMap.get(opKey)!;
      op.cantidadPrendas += item.cantidad_prendas_producidas;
      op.minutosProducidos += item.minutos_producidos_total;

      // Procesar análisis diario
      if (!analisisDiarioMap.has(item.fecha_proceso)) {
        analisisDiarioMap.set(item.fecha_proceso, {
          prod: 0,
          disp: item.minutos_disponibles_jornada,
          prendas: 0,
          operaciones: new Set()
        });
      }
      const analisisDia = analisisDiarioMap.get(item.fecha_proceso)!;
      analisisDia.prod += item.minutos_producidos_total;
      analisisDia.prendas += item.cantidad_prendas_producidas;
      analisisDia.operaciones.add(item.codigo_operacion);
    });

    // Calcular eficiencias y promedios
    const operaciones = Array.from(operacionesMap.values()).map(op => {
      op.eficiencia = (op.minutosProducidos / minutosDisponiblesTotal) * 100;
      op.tiempoPromedioPrenda = op.minutosProducidos / op.cantidadPrendas;
      return op;
    });

    const analisisDiario = Array.from(analisisDiarioMap.entries())
      .map(([fecha, data]) => ({
        fecha,
        eficiencia: (data.prod / data.disp) * 100,
        prendas: data.prendas,
        minutosProducidos: data.prod,
        minutosDisponibles: data.disp,
        operacionesDia: data.operaciones.size
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    // Calcular estadísticas
    const eficiencias = analisisDiario.map(dia => dia.eficiencia);
    const eficienciaPromedio = eficiencias.reduce((a, b) => a + b, 0) / eficiencias.length;
    
    // Calcular tendencia
    const primeraMitad = eficiencias.slice(0, Math.floor(eficiencias.length / 2));
    const segundaMitad = eficiencias.slice(Math.floor(eficiencias.length / 2));
    const promedioInicial = primeraMitad.reduce((a, b) => a + b, 0) / primeraMitad.length;
    const promedioFinal = segundaMitad.reduce((a, b) => a + b, 0) / segundaMitad.length;
    
    const tendencia = getTendenciaEficiencia(promedioInicial, promedioFinal);

    const estadisticas: EstadisticasTrabajador = {
      eficienciaMaxima: Math.max(...eficiencias),
      eficienciaMinima: Math.min(...eficiencias),
      diasSobrePromedio: eficiencias.filter(e => e > eficienciaPromedio).length,
      operacionMasEficiente: operaciones.reduce((a, b) => a.eficiencia > b.eficiencia ? a : b),
      operacionMenosEficiente: operaciones.reduce((a, b) => a.eficiencia < b.eficiencia ? a : b),
      tendenciaEficiencia: tendencia
    };

    return {
      codigo: codigoTrabajador,
      nombre,
      lineaPrincipal: Array.from(lineas)[0] || 'N/A',
      eficienciaPromedio: minutosDisponiblesTotal > 0 ? 
        (minutosProducidosTotal / minutosDisponiblesTotal) * 100 : 0,
      minutosProducidosTotal,
      minutosDisponiblesTotal,
      prendasTotal,
      diasTrabajados: fechasProcesadas.size,
      tendenciaDiaria: analisisDiario.map(d => ({
        fecha: d.fecha,
        eficiencia: d.eficiencia
      })),
      operaciones,
      analisisDiario,
      estadisticas
    };
  }, [eficienciaData, codigoTrabajador]);

  if (isLoading && !trabajadorDetalle) {
    return <p className="text-center">Cargando datos del trabajador...</p>;
  }

  if (!trabajadorDetalle) {
    return (
      <div className="text-center">
        <p className="text-xl text-red-600">
          Trabajador no encontrado o sin datos para el periodo seleccionado.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Periodo analizado: {fechaInicio} al {fechaFin}
        </p>
        <RouterLink 
          to="/manufactura/costura/trabajadores" 
          className="mt-4 inline-block text-indigo-600 hover:underline"
        >
          &larr; Volver al listado de trabajadores
        </RouterLink>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200">
              {trabajadorDetalle.nombre}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Código: {trabajadorDetalle.codigo} | Línea Principal: {trabajadorDetalle.lineaPrincipal}
            </p>
          </div>
          <RouterLink 
            to="/manufactura/costura/trabajadores" 
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap"
          >
            &larr; Volver al listado
          </RouterLink>
        </div>
      </header>

      {/* Filtros de fecha */}
      <div className="mb-2 p-3 bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="flex flex-row flex-wrap gap-x-4 gap-y-2 items-end">
          <div className="min-w-[140px]">
            <label htmlFor="fechaInicioDetail" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
              Fecha Inicio
            </label>
            <input
              type="date"
              id="fechaInicioDetail"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className={INPUT_CLASS}
              disabled={fechaInputsDisabled || isLoading}
            />
          </div>
          <div className="min-w-[140px]">
            <label htmlFor="fechaFinDetail" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
              Fecha Fin
            </label>
            <input
              type="date"
              id="fechaFinDetail"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className={INPUT_CLASS}
              disabled={fechaInputsDisabled || isLoading}
            />
          </div>
          <div className="flex flex-row gap-2">
            <button
              className={`${BUTTON_DATE_PRESET_BASE} ${filtroFecha === 'semana' ? BUTTON_DATE_PRESET_ACTIVE : BUTTON_DATE_PRESET_INACTIVE}`}
              onClick={() => setFiltroFecha('semana')}
            >
              Última semana
            </button>
            <button
              className={`${BUTTON_DATE_PRESET_BASE} ${filtroFecha === 'mes' ? BUTTON_DATE_PRESET_ACTIVE : BUTTON_DATE_PRESET_INACTIVE}`}
              onClick={() => setFiltroFecha('mes')}
            >
              Último mes
            </button>
            <button
              className={`${BUTTON_DATE_PRESET_BASE} ${filtroFecha === 'personalizado' ? BUTTON_DATE_PRESET_ACTIVE : BUTTON_DATE_PRESET_INACTIVE}`}
              onClick={() => setFiltroFecha('personalizado')}
            >
              Personalizado
            </button>
          </div>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center min-w-[110px] ml-auto"
            title="Actualizar datos del periodo"
          >
            <RefreshCw size={14} className={`mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-2">
        <KPICard
          title="Eficiencia Promedio"
          value={`${trabajadorDetalle.eficienciaPromedio.toFixed(1)}%`}
          trend={trabajadorDetalle.estadisticas.tendenciaEficiencia === 'ascendente' ? 2.5 : -1.5}
          icon={<Target className="h-5 w-5 text-indigo-500" />}
          description={`Meta: 85%`}
        />
        <KPICard
          title="Prendas Producidas"
          value={trabajadorDetalle.prendasTotal.toLocaleString()}
          icon={<Package className="h-5 w-5 text-green-500" />}
          description={`Promedio: ${(trabajadorDetalle.prendasTotal / trabajadorDetalle.diasTrabajados).toFixed(0)}/día`}
        />
        <KPICard
          title="Tiempo Productivo"
          value={`${(trabajadorDetalle.minutosProducidosTotal / 60).toFixed(1)}h`}
          icon={<Clock className="h-5 w-5 text-blue-500" />}
          description={`${((trabajadorDetalle.minutosProducidosTotal / trabajadorDetalle.minutosDisponiblesTotal) * 100).toFixed(1)}% utilizado`}
        />
        <KPICard
          title="Días Trabajados"
          value={trabajadorDetalle.diasTrabajados.toString()}
          icon={<Clock className="h-5 w-5 text-purple-500" />}
          description="Total días en el periodo"
        />
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-2">
        {/* Tendencia de Eficiencia */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-3 shadow rounded-lg">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Tendencia de Eficiencia Diaria
          </h2>
          <div className="h-[300px]">
            <TendenciaEficiencia 
              data={trabajadorDetalle.tendenciaDiaria} 
              className="w-full h-full" 
            />
          </div>
        </div>

        {/* Análisis de Operaciones */}
        <div className="space-y-3">
          <OperacionesTable
            operaciones={trabajadorDetalle.operaciones
              .sort((a, b) => b.eficiencia - a.eficiencia)
              .slice(0, 5)}
            title="Top 5 Operaciones"
          />
        </div>
      </div>

      {/* Distribución de Tiempo */}
      <div className="bg-white dark:bg-gray-800 p-3 shadow rounded-lg mb-2">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Distribución de Tiempo Diario
        </h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trabajadorDetalle.analisisDiario}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="minutosProducidos" 
                name="Tiempo Productivo" 
                fill="#4F46E5" 
              />
              <Bar 
                dataKey="minutosDisponibles" 
                name="Tiempo Disponible" 
                fill="#E5E7EB" 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recomendaciones */}
      {trabajadorDetalle.estadisticas.tendenciaEficiencia === 'descendente' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 p-3 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
              Recomendaciones de Mejora
            </h3>
          </div>
          <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300">
            <li>La eficiencia muestra una tendencia descendente en el periodo analizado</li>
            <li>
              Las operaciones {trabajadorDetalle.estadisticas.operacionMenosEficiente.nombre} 
              muestran la menor eficiencia
            </li>
            <li>Considerar capacitación adicional en las operaciones con menor desempeño</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default TrabajadorDetailPage;