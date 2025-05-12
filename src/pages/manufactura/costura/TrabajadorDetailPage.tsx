// src/pages/manufactura/costura/TrabajadorDetailPage.tsx
import React, { useMemo } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useEficiencia } from '../../../context/EficienciaContext'; 
import { TendenciaEficiencia } from '../../../components/costura/TendenciaEficiencia'; 
import { RefreshCw } from 'lucide-react'; // Para el botón de actualizar

// Clases de Tailwind (consistentes)
const INPUT_CLASS =
  "block w-full px-2 py-1 text-sm border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100";
const BUTTON_DATE_PRESET_BASE = "px-3 py-1 rounded text-xs font-medium border";
const BUTTON_DATE_PRESET_ACTIVE = "bg-indigo-600 text-white border-indigo-600";
const BUTTON_DATE_PRESET_INACTIVE = "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600";

interface TrabajadorDetalle {
  codigo: string;
  nombre: string;
  lineaPrincipal: string;
  eficienciaPromedio: number;
  minutosProducidosTotal: number;
  minutosDisponiblesTotal: number;
  prendasTotal: number;
  diasTrabajados: number;
  tendenciaDiaria: { fecha: string; eficiencia: number }[];
}

const KPIItem: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
  <div className="bg-white dark:bg-gray-700 p-4 shadow rounded-lg text-center">
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
    <p className="text-2xl font-semibold text-gray-800 dark:text-gray-100">{value}</p>
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
    activePreset,
    setFechaPreset,
    refreshData
  } = useEficiencia(); 

  const trabajadorDetalle = useMemo((): TrabajadorDetalle | null => {
    if (!eficienciaData?.datos_reporte || !codigoTrabajador) return null;
    const datosDelTrabajador = eficienciaData.datos_reporte.filter(
      item => item.codigo_trabajador === codigoTrabajador
    );
    if (datosDelTrabajador.length === 0) return null;
    const nombre = datosDelTrabajador[0].nombre_trabajador || codigoTrabajador;
    const lineas = new Set(datosDelTrabajador.map(item => item.linea || 'Sin Línea'));
    let minutosProducidosTotal = 0;
    let minutosDisponiblesTotal = 0;
    let prendasTotal = 0;
    const fechasProcesadas = new Set<string>();
    const eficienciaPorDiaMap: Record<string, { prod: number; disp: number; prendas: number }> = {};
    datosDelTrabajador.forEach(item => {
      minutosProducidosTotal += item.minutos_producidos_total;
      prendasTotal += item.cantidad_prendas_producidas;
      if (!fechasProcesadas.has(item.fecha_proceso)) {
        minutosDisponiblesTotal += item.minutos_disponibles_jornada;
        fechasProcesadas.add(item.fecha_proceso);
      }
      const fecha = item.fecha_proceso;
      if (!eficienciaPorDiaMap[fecha]) eficienciaPorDiaMap[fecha] = { prod: 0, disp: 0, prendas: 0 };
      eficienciaPorDiaMap[fecha].prod += item.minutos_producidos_total;
      eficienciaPorDiaMap[fecha].prendas += item.cantidad_prendas_producidas;
    });
    const minutosDisponiblesPorDia: Record<string, number> = {};
    datosDelTrabajador.forEach(item => {
        const fecha = item.fecha_proceso;
        if (!minutosDisponiblesPorDia[fecha]) {
            minutosDisponiblesPorDia[fecha] = item.minutos_disponibles_jornada;
        }
    });
    const tendenciaDiaria = Object.entries(eficienciaPorDiaMap)
      .map(([fecha, data]) => {
        const dispDia = minutosDisponiblesPorDia[fecha] || 0;
        return {
          fecha,
          eficiencia: dispDia > 0 ? (data.prod / dispDia) * 100 : 0,
        };
      })
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
    return {
      codigo: codigoTrabajador,
      nombre,
      lineaPrincipal: Array.from(lineas)[0] || 'N/A',
      eficienciaPromedio: minutosDisponiblesTotal > 0 ? (minutosProducidosTotal / minutosDisponiblesTotal) * 100 : 0,
      minutosProducidosTotal,
      minutosDisponiblesTotal,
      prendasTotal,
      diasTrabajados: fechasProcesadas.size,
      tendenciaDiaria,
    };
  }, [eficienciaData, codigoTrabajador, fechaInicio, fechaFin]);

  // Inputs de fecha solo habilitados si es personalizado
  const fechaInputsDisabled = activePreset !== 'personalizado';

  if (isLoading && !trabajadorDetalle) {
    return <p className="p-6 text-center">Cargando datos del trabajador...</p>;
  }

  if (!trabajadorDetalle) {
    return (
      <div className="p-6 text-center">
        <p className="text-xl text-red-600">Trabajador no encontrado o sin datos para el periodo seleccionado.</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Periodo analizado: {fechaInicio} al {fechaFin}
        </p>
        <RouterLink to="/manufactura/costura/trabajadores" className="mt-4 inline-block text-indigo-600 hover:underline">
          &larr; Volver al listado de trabajadores
        </RouterLink>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <header className="mb-6">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200">{trabajadorDetalle.nombre}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Código: {trabajadorDetalle.codigo} | Línea Principal: {trabajadorDetalle.lineaPrincipal}</p>
            </div>
            <RouterLink 
                to="/manufactura/costura/trabajadores" 
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap"
            >
                &larr; Volver al listado
            </RouterLink>
        </div>
      </header>

      {/* Card de filtros de fecha */}
      <div className="mb-6 p-3 bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="flex flex-row flex-wrap gap-x-4 gap-y-2 items-end">
          {/* Inputs de Fecha (siempre visibles) */}
          <div className="min-w-[140px]">
            <label htmlFor="fechaInicioDetail" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">Fecha Inicio</label>
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
            <label htmlFor="fechaFinDetail" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">Fecha Fin</label>
            <input
              type="date"
              id="fechaFinDetail"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className={INPUT_CLASS}
              disabled={fechaInputsDisabled || isLoading}
            />
          </div>

          {/* Botones de Preset de Fecha */}
          <div className="flex flex-row gap-2">
            <button
              className={`${BUTTON_DATE_PRESET_BASE} ${activePreset === 'ultima_semana' ? BUTTON_DATE_PRESET_ACTIVE : BUTTON_DATE_PRESET_INACTIVE}`}
              onClick={() => setFechaPreset('ultima_semana')}
            >
              Última semana
            </button>
            <button
              className={`${BUTTON_DATE_PRESET_BASE} ${activePreset === 'ultimo_mes' ? BUTTON_DATE_PRESET_ACTIVE : BUTTON_DATE_PRESET_INACTIVE}`}
              onClick={() => setFechaPreset('ultimo_mes')}
            >
              Último mes
            </button>
            <button
              className={`${BUTTON_DATE_PRESET_BASE} ${activePreset === 'personalizado' ? BUTTON_DATE_PRESET_ACTIVE : BUTTON_DATE_PRESET_INACTIVE}`}
              onClick={() => setFechaPreset('personalizado')}
            >
              Personalizado
            </button>
          </div>
          
          {/* Botón de Actualizar */}
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center min-w-[110px]"
            title="Actualizar datos del periodo"
          >
            <RefreshCw size={14} className={`mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
         <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
            Periodo de análisis actual: <span className="font-medium">{fechaInicio}</span> al <span className="font-medium">{fechaFin}</span>
        </p>
      </div>

      {/* KPIs del Trabajador */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <KPIItem title="Eficiencia Promedio" value={`${trabajadorDetalle.eficienciaPromedio.toFixed(1)}%`} />
        <KPIItem title="Minutos Producidos" value={trabajadorDetalle.minutosProducidosTotal.toLocaleString()} />
        <KPIItem title="Minutos Disponibles" value={trabajadorDetalle.minutosDisponiblesTotal.toLocaleString()} />
        <KPIItem title="Prendas Producidas" value={trabajadorDetalle.prendasTotal.toLocaleString()} />
        <KPIItem title="Días Trabajados" value={trabajadorDetalle.diasTrabajados.toString()} />
      </div>

      {/* Gráfico de Tendencia de Eficiencia */}
      <div className="bg-white dark:bg-gray-800 p-4 shadow rounded-lg mb-6 min-h-[300px]">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Tendencia de Eficiencia Diaria
        </h2>
        {trabajadorDetalle.tendenciaDiaria.length > 0 ? (
            <div className="h-[250px] md:h-[300px]">
                 <TendenciaEficiencia data={trabajadorDetalle.tendenciaDiaria} className="w-full h-full" />
            </div>
        ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-10">No hay suficientes datos para mostrar la tendencia en el periodo seleccionado.</p>
        )}
      </div>
    </div>
  );
};

export default TrabajadorDetailPage;