// src/pages/manufactura/costura/TrabajadorListPage.tsx
import React, { useState, useMemo, useLayoutEffect  } from 'react'; // Cambiado useLayoutEffect a useEffect
import { Link } from 'react-router-dom';
import { parseISO } from 'date-fns';
import { useEficiencia } from '../../../context/EficienciaContext'; // Ajusta la ruta si es necesario
import { RefreshCw, UserCircle, TrendingUp, Package, Clock } from 'lucide-react';
import TendenciaTrabajadorChartOriginal from '../../../components/costura/TendenciaTrabajadorChart'; // Ajusta la ruta

const INPUT_CLASS =
  "block w-full px-2 py-1 text-sm border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100";
const BUTTON_DATE_PRESET_BASE = "px-3 py-1 rounded text-xs font-medium border";
const BUTTON_DATE_PRESET_ACTIVE = "bg-indigo-600 text-white border-indigo-600";
const BUTTON_DATE_PRESET_INACTIVE = "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600";

interface TrabajadorResumen {
  codigo: string;
  nombre: string;
  lineaPrincipal: string;
  eficienciaPromedio: number;
  minutosProducidos: number;
  minutosDisponibles: number;
  prendasProcesadasTotal: number;
  fotoUrl?: string;
  tendenciaEficiencia: { fecha: string; eficiencia: number }[];
}

const getEficienciaStyles = (eficiencia: number) => {
  if (eficiencia >= 85) return {
    textColor: 'text-green-100',
    bgColor: 'bg-green-600 dark:bg-green-700',
    dotColor: 'bg-green-400',
    lineColor: '#10B981'
  };
  if (eficiencia >= 70) return {
    textColor: 'text-yellow-100',
    bgColor: 'bg-yellow-500 dark:bg-yellow-600',
    dotColor: 'bg-yellow-300',
    lineColor: '#F59E0B'
  };
  if (eficiencia > 0) return {
    textColor: 'text-red-100',
    bgColor: 'bg-red-600 dark:bg-red-700',
    dotColor: 'bg-red-400',
    lineColor: '#EF4444'
  };
  return {
    textColor: 'text-gray-100',
    bgColor: 'bg-gray-500 dark:bg-gray-600',
    dotColor: 'bg-gray-300',
    lineColor: '#9CA3AF'
  };
};

const TendenciaTrabajadorChart = React.memo(TendenciaTrabajadorChartOriginal);

const TrabajadorCard = React.memo(function TrabajadorCard({ trabajador }: { trabajador: TrabajadorResumen }) {
  const eficienciaEstilos = getEficienciaStyles(trabajador.eficienciaPromedio);

  return (
    <Link
      to={`/manufactura/costura/trabajadores/${trabajador.codigo}`} // Ajusta la ruta base si es necesario
      // key={trabajador.codigo} // Esta key es redundante aquí, el map exterior la maneja
      className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col h-full min-h-[240px] w-full"
    >
      <div className="p-4 flex items-center border-b border-gray-200 dark:border-gray-700">
        <div className="flex-shrink-0 w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
          {trabajador.fotoUrl ? (
            <img src={trabajador.fotoUrl} alt={trabajador.nombre} className="w-full h-full object-cover" />
          ) : (
            <UserCircle size={32} className="text-gray-400 dark:text-gray-500" />
          )}
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <h3 className="text-base font-semibold text-indigo-700 dark:text-indigo-400 truncate group-hover:text-indigo-600">
            {trabajador.nombre}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Código: {trabajador.codigo}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Línea: {trabajador.lineaPrincipal}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-grow">
        <div className="w-full md:w-1/5 p-4 space-y-2 md:border-r border-gray-200 dark:border-gray-700">
          <div className={`p-2 rounded-lg ${eficienciaEstilos.bgColor} ${eficienciaEstilos.textColor}`}>
            <div className="flex items-center text-xs font-medium opacity-80">
              <TrendingUp size={12} className="mr-1" />
              Eficiencia
            </div>
            <div className="flex items-center mt-1">
              <span className={`w-2 h-2 rounded-full mr-2 ${eficienciaEstilos.dotColor}`}></span>
              <p className="text-lg font-bold">
                {Math.round(trabajador.eficienciaPromedio)}%
              </p>
            </div>
          </div>

          <div className="bg-blue-600 dark:bg-blue-700 p-2 rounded-lg text-white">
            <div className="flex items-center text-xs font-medium text-blue-200">
              <Package size={12} className="mr-1" />
              Prendas
            </div>
            <p className="text-lg font-bold mt-1">
              {trabajador.prendasProcesadasTotal.toLocaleString()}
            </p>
          </div>

          <div className="space-y-0.5 text-xs">
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <Clock size={10} className="mr-1" />
              Prod: {trabajador.minutosProducidos.toLocaleString()}
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <Clock size={10} className="mr-1" />
              Disp: {trabajador.minutosDisponibles.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="w-full md:w-4/5 p-2 flex flex-col">
          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tendencia ({trabajador.tendenciaEficiencia.length} días)
          </h4>
          <div className="flex-1 min-h-0">
            <TendenciaTrabajadorChart
              data={trabajador.tendenciaEficiencia}
              lineColor={eficienciaEstilos.lineColor}              
            />
          </div>
        </div>
      </div>
    </Link>
  );
});

const TrabajadorListPage: React.FC = () => {
  const {
    isLoading,
    data: eficienciaData,
    fechaInicio,
    fechaFin,
    setFechaInicio,
    setFechaFin,
    setFechaPreset,
    activePreset,
    refreshData
  } = useEficiencia();

  const [filtroLinea, setFiltroLinea] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useLayoutEffect(() => {
    // Si no hay fechas al montar, establece un preset.
    // Esto solo se ejecuta una vez después del montaje inicial.
    //if (!fechaInicio || !fechaFin) {
        setFechaPreset('ultima_semana');
    //}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependencias vacías para ejecutar solo al montar

  const fechaInputsDisabled = activePreset !== 'personalizado';

  const datosEnRango = useMemo(() => {
    if (!eficienciaData?.datos_reporte || !fechaInicio || !fechaFin) return [];
    try {
        const dInicio = parseISO(fechaInicio);
        const dFin = parseISO(fechaFin);
        return eficienciaData.datos_reporte.filter(item => {
            const dItem = parseISO(item.fecha_proceso);
            return dItem >= dInicio && dItem <= dFin;
        }).sort((a, b) => a.fecha_proceso.localeCompare(b.fecha_proceso));
    } catch (error) {
        console.error("Error parsing dates for filtering:", error);
        return [];
    }
  }, [eficienciaData, fechaInicio, fechaFin]);

  const trabajadoresProcesados = useMemo((): TrabajadorResumen[] => {
    if (!datosEnRango.length) return [];
    const datosPorTrabajador: Record<string, typeof datosEnRango[0][]> = {};
    datosEnRango.forEach(item => {
      if (!datosPorTrabajador[item.codigo_trabajador]) {
        datosPorTrabajador[item.codigo_trabajador] = [];
      }
      datosPorTrabajador[item.codigo_trabajador].push(item);
    });

    return Object.entries(datosPorTrabajador).map(([codigo_trabajador, datosDelTrabajador]) => {
      const nombre = datosDelTrabajador[0]?.nombre_trabajador || codigo_trabajador;
      const lineas = new Set(datosDelTrabajador.map(item => item.linea || 'Sin Línea'));
      let minutosProducidosTotalGeneral = 0;
      let minutosDisponiblesTotalGeneral = 0;
      let prendasProcesadasTotalGeneral = 0;
      const fechasProcesadasGeneral = new Set<string>();
      datosDelTrabajador.forEach(item => {
        minutosProducidosTotalGeneral += item.minutos_producidos_total;
        prendasProcesadasTotalGeneral += item.cantidad_prendas_producidas;
        if (!fechasProcesadasGeneral.has(item.fecha_proceso)) {
          minutosDisponiblesTotalGeneral += item.minutos_disponibles_jornada;
          fechasProcesadasGeneral.add(item.fecha_proceso);
        }
      });
      const eficienciaDiaria = new Map<string, { prod: number; disp: number }>();
      datosDelTrabajador.forEach(item => {
        if (!eficienciaDiaria.has(item.fecha_proceso)) {
          eficienciaDiaria.set(item.fecha_proceso, {
            prod: 0,
            disp: item.minutos_disponibles_jornada
          });
        }
        const datos = eficienciaDiaria.get(item.fecha_proceso)!;
        datos.prod += item.minutos_producidos_total;
      });
      const tendenciaData = Array.from(eficienciaDiaria.entries())
        .map(([fecha, { prod, disp }]) => ({
          fecha,
          eficiencia: disp > 0 ? (prod / disp) * 100 : 0
        }))
        .sort((a, b) => parseISO(a.fecha).getTime() - parseISO(b.fecha).getTime());
      return {
        codigo: codigo_trabajador,
        nombre,
        lineaPrincipal: Array.from(lineas)[0] || 'N/A',
        eficienciaPromedio: minutosDisponiblesTotalGeneral > 0
          ? (minutosProducidosTotalGeneral / minutosDisponiblesTotalGeneral) * 100
          : 0,
        minutosProducidos: Math.round(minutosProducidosTotalGeneral),
        minutosDisponibles: Math.round(minutosDisponiblesTotalGeneral),
        prendasProcesadasTotal: prendasProcesadasTotalGeneral,
        tendenciaEficiencia: tendenciaData,
      };
    });
  }, [datosEnRango]);

  const trabajadoresFiltrados = useMemo(() => {
    return trabajadoresProcesados
      .filter(t => filtroLinea ? t.lineaPrincipal === filtroLinea : true)
      .filter(t => searchTerm
        ? t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.codigo.toLowerCase().includes(searchTerm.toLowerCase())
        : true)
      .sort((a, b) => b.eficienciaPromedio - a.eficienciaPromedio);
  }, [trabajadoresProcesados, filtroLinea, searchTerm]);

  const lineasUnicas = useMemo(() => {
    if (!eficienciaData?.datos_reporte) return [];
    const lineas = new Set(eficienciaData.datos_reporte
      .map(item => item.linea)
      .filter(Boolean) as string[]);
    return Array.from(lineas).sort();
  }, [eficienciaData]);

  return (
    <div>
      <header className="mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2 sm:mb-0">
            Reporte de Eficiencia por Trabajador
          </h1>
          <Link
            to="/manufactura/costura/dashboard_eficiencia"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            &larr; Volver al Dashboard
          </Link>
        </div>
      </header>

      <div className="mb-2 bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-end">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label htmlFor="fechaInicioTrabList" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                id="fechaInicioTrabList"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className={INPUT_CLASS}
                disabled={fechaInputsDisabled || isLoading}
              />
            </div>
            <div>
              <label htmlFor="fechaFinTrabList" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                id="fechaFinTrabList"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className={INPUT_CLASS}
                disabled={fechaInputsDisabled || isLoading}
              />
            </div>
          </div>
          <div className="flex flex-row gap-2 mt-2 sm:mt-0">
            <button
              className={`${BUTTON_DATE_PRESET_BASE} ${activePreset === 'ultima_semana' ? BUTTON_DATE_PRESET_ACTIVE : BUTTON_DATE_PRESET_INACTIVE}`}
              onClick={() => setFechaPreset('ultima_semana')}
              disabled={isLoading}
            >
              Última semana
            </button>
            <button
              className={`${BUTTON_DATE_PRESET_BASE} ${activePreset === 'ultimo_mes' ? BUTTON_DATE_PRESET_ACTIVE : BUTTON_DATE_PRESET_INACTIVE}`}
              onClick={() => setFechaPreset('ultimo_mes')}
              disabled={isLoading}
            >
              Último mes
            </button>
            <button
              className={`${BUTTON_DATE_PRESET_BASE} ${activePreset === 'personalizado' ? BUTTON_DATE_PRESET_ACTIVE : BUTTON_DATE_PRESET_INACTIVE}`}
              onClick={() => setFechaPreset('personalizado')}
              disabled={isLoading}
            >
              Personalizado
            </button>
          </div>
          <div className="w-full sm:w-auto">
            <label htmlFor="filtroLinea" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Línea
            </label>
            <select
              id="filtroLinea"
              value={filtroLinea || ''}
              onChange={(e) => setFiltroLinea(e.target.value || null)}
              className={INPUT_CLASS}
              disabled={isLoading}
            >
              <option value="">Todas</option>
              {lineasUnicas.map(linea => (
                <option key={linea} value={linea}>{linea}</option>
              ))}
            </select>
          </div>
          <div className="flex-grow w-full sm:w-auto">
            <label htmlFor="searchTerm" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Buscar Trabajador
            </label>
            <input
              type="text"
              id="searchTerm"
              placeholder="Nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={INPUT_CLASS}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="px-2 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center min-w-[110px] w-full sm:w-auto"
          >
            <RefreshCw size={14} className={`mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {isLoading && (
        <p className="text-center py-10 text-gray-600 dark:text-gray-300">
          Cargando datos de trabajadores...
        </p>
      )}

      {!isLoading && trabajadoresFiltrados.length === 0 && (
        <p className="text-center text-gray-600 dark:text-gray-400 py-10">
          No se encontraron trabajadores con los filtros seleccionados.
        </p>
      )}

      {!isLoading && trabajadoresFiltrados.length > 0 && (
        <div
          className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"
          style={{
            minHeight: 'calc(100vh - 300px)',
            alignItems: 'stretch',
            boxSizing: 'border-box'
          }}
        >
          {trabajadoresFiltrados.map(trabajador => (
            <TrabajadorCard key={trabajador.codigo} trabajador={trabajador} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TrabajadorListPage;