// src/pages/manufactura/costura/TrabajadorListPage.tsx
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useEficiencia } from '../../../context/EficienciaContext'; 
import { RefreshCw, UserCircle, TrendingUp, Package, Clock } from 'lucide-react';
import TendenciaTrabajadorChart from '../../../components/costura/TendenciaTrabajadorChart';

// Clases de Tailwind (consistentes)
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

const TrabajadorListPage: React.FC = () => {
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

  const [filtroLinea, setFiltroLinea] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const trabajadoresProcesados = useMemo((): TrabajadorResumen[] => {
    if (!eficienciaData?.datos_reporte) return [];

    const datosPorTrabajador: Record<string, typeof eficienciaData.datos_reporte[0][]> = {};
    eficienciaData.datos_reporte.forEach(item => {
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
      
      const eficienciaDiariaMap: Record<string, { prod: number; disp: number }> = {};
      datosDelTrabajador.forEach(item => {
        const fecha = item.fecha_proceso;
        if (!eficienciaDiariaMap[fecha]) {
          const entradaExistenteParaFecha = datosDelTrabajador.find(d => d.fecha_proceso === fecha);
          eficienciaDiariaMap[fecha] = { prod: 0, disp: entradaExistenteParaFecha?.minutos_disponibles_jornada || 0 };
        }
        eficienciaDiariaMap[fecha].prod += item.minutos_producidos_total;
      });

      const tendenciaData = Object.entries(eficienciaDiariaMap)
        .map(([fecha, data]) => ({
          fecha,
          eficiencia: data.disp > 0 ? (data.prod / data.disp) * 100 : 0,
        }))
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
        .slice(-10); 

      return {
        codigo: codigo_trabajador,
        nombre: nombre,
        lineaPrincipal: Array.from(lineas)[0] || 'N/A',
        eficienciaPromedio: minutosDisponiblesTotalGeneral > 0 ? (minutosProducidosTotalGeneral / minutosDisponiblesTotalGeneral) * 100 : 0,
        minutosProducidos: Math.round(minutosProducidosTotalGeneral),
        minutosDisponibles: Math.round(minutosDisponiblesTotalGeneral),
        prendasProcesadasTotal: prendasProcesadasTotalGeneral,
        tendenciaEficiencia: tendenciaData,
        // fotoUrl: `https://i.pravatar.cc/150?u=${codigo_trabajador}` // Placeholder
      };
    });
  }, [eficienciaData]);

  const trabajadoresFiltrados = useMemo(() => {
    return trabajadoresProcesados
      .filter(t => filtroLinea ? t.lineaPrincipal === filtroLinea : true)
      .filter(t => searchTerm ? t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || t.codigo.toLowerCase().includes(searchTerm.toLowerCase()) : true)
      .sort((a,b) => b.eficienciaPromedio - a.eficienciaPromedio); 
  }, [trabajadoresProcesados, filtroLinea, searchTerm]);

  const lineasUnicas = useMemo(() => {
    if (!eficienciaData?.datos_reporte) return [];
    const lineas = new Set(eficienciaData.datos_reporte.map(item => item.linea).filter(Boolean) as string[]);
    return Array.from(lineas).sort();
  }, [eficienciaData]);

  const fechaInputsDisabled = activePreset !== 'personalizado';

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

  return (
    <div className="p-4 md:p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <header className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Reporte de Eficiencia por Trabajador
        </h1>
        <Link 
            to="/manufactura/costura/dashboard_eficiencia" 
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
            &larr; Volver al Dashboard Principal
        </Link>
      </header>

      {/* Card de filtros */}
      <div className="mb-4 p-3 bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="flex flex-row flex-wrap gap-x-4 gap-y-2 items-end">
          <div className="min-w-[140px]">
            <label htmlFor="fechaInicioTrabList" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">Fecha Inicio</label>
            <input type="date" id="fechaInicioTrabList" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className={INPUT_CLASS} disabled={fechaInputsDisabled || isLoading} />
          </div>
          <div className="min-w-[140px]">
            <label htmlFor="fechaFinTrabList" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">Fecha Fin</label>
            <input type="date" id="fechaFinTrabList" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className={INPUT_CLASS} disabled={fechaInputsDisabled || isLoading} />
          </div>
          <div className="flex flex-row gap-2">
            <button className={`${BUTTON_DATE_PRESET_BASE} ${activePreset === 'ultima_semana' ? BUTTON_DATE_PRESET_ACTIVE : BUTTON_DATE_PRESET_INACTIVE}`} onClick={() => setFechaPreset('ultima_semana')}>Última semana</button>
            <button className={`${BUTTON_DATE_PRESET_BASE} ${activePreset === 'ultimo_mes' ? BUTTON_DATE_PRESET_ACTIVE : BUTTON_DATE_PRESET_INACTIVE}`} onClick={() => setFechaPreset('ultimo_mes')}>Último mes</button>
            <button className={`${BUTTON_DATE_PRESET_BASE} ${activePreset === 'personalizado' ? BUTTON_DATE_PRESET_ACTIVE : BUTTON_DATE_PRESET_INACTIVE}`} onClick={() => setFechaPreset('personalizado')}>Personalizado</button>
          </div>
          <div className="min-w-[150px]">
            <label htmlFor="filtroLinea" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">Línea</label>
            <select id="filtroLinea" value={filtroLinea || ''} onChange={(e) => setFiltroLinea(e.target.value || null)} className={INPUT_CLASS} disabled={isLoading}>
              <option value="">Todas</option>
              {lineasUnicas.map(linea => (<option key={linea} value={linea}>{linea}</option>))}
            </select>
          </div>
          <div className="flex-grow min-w-[200px]">
            <label htmlFor="searchTerm" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">Buscar Trabajador</label>
            <input type="text" id="searchTerm" placeholder="Nombre o código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={INPUT_CLASS} disabled={isLoading} />
          </div>
          <button onClick={refreshData} disabled={isLoading} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center min-w-[110px]" title="Actualizar datos">
            <RefreshCw size={14} className={`mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* Lista de Trabajadores Rediseñada */}
      {isLoading && <p className="text-center py-8 text-gray-600 dark:text-gray-300">Cargando datos de trabajadores...</p>}
      {!isLoading && trabajadoresFiltrados.length === 0 && (
        <p className="text-center text-gray-600 dark:text-gray-400 py-8">No se encontraron trabajadores con los filtros seleccionados.</p>
      )}
      {!isLoading && trabajadoresFiltrados.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {trabajadoresFiltrados.map((trabajador) => {
            const eficienciaEstilos = getEficienciaStyles(trabajador.eficienciaPromedio);
            
            return (
              <Link
                to={`/manufactura/costura/trabajadores/${trabajador.codigo}`}
                key={trabajador.codigo}
                className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 group flex flex-col"
              >
                {/* Sección Superior: Foto e Info del Trabajador (Full Width) */}
                <div className="flex items-center p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                    {trabajador.fotoUrl ? (
                      <img src={trabajador.fotoUrl} alt={trabajador.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle size={40} className="text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-indigo-700 dark:text-indigo-400 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                      {trabajador.nombre}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Código: {trabajador.codigo}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Línea: {trabajador.lineaPrincipal}
                    </p>
                  </div>
                </div>

                {/* Sección Inferior: KPIs y Gráfico (flex-grow para que ocupe espacio) */}
                <div className="flex flex-col md:flex-row flex-grow">
                  
                  {/* Columna Izquierda (KPIs y Datos Adicionales) */}
                  <div className="w-full md:w-1/3 p-3 sm:p-4 space-y-3 md:border-r border-gray-200 dark:border-gray-700 flex flex-col">
                    
                    {/* KPI Eficiencia */}
                    <div className={`p-3 rounded-lg ${eficienciaEstilos.bgColor} ${eficienciaEstilos.textColor}`}>
                      <div className="flex items-center text-xs font-medium opacity-80 mb-1">
                        <TrendingUp size={14} className="mr-1.5" />
                        Efic. Prom.
                      </div>
                      <div className="flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-2 ${eficienciaEstilos.dotColor}`}></span>
                        <p className="text-xl sm:text-2xl font-bold">
                          {Math.round(trabajador.eficienciaPromedio)}% {/* Eficiencia como entero */}
                        </p>
                      </div>
                    </div>

                    {/* KPI Prendas Procesadas */}
                    <div className="bg-blue-600 dark:bg-blue-700 p-3 rounded-lg text-white">
                      <div className="flex items-center text-xs font-medium text-blue-200 dark:text-blue-300 mb-1">
                        <Package size={14} className="mr-1.5" />
                        Prendas Proc.
                      </div>
                      <p className="text-xl sm:text-2xl font-bold">
                        {trabajador.prendasProcesadasTotal.toLocaleString()}
                      </p>
                    </div>
                    
                    {/* Minutos Producidos y Disponibles */}
                    <div className="pt-1 space-y-0.5 mt-auto">
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                            <Clock size={11} className="mr-1 text-gray-400 dark:text-gray-500" />
                            Min. Prod:
                            <span className="font-semibold ml-1">{trabajador.minutosProducidos.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                            <Clock size={11} className="mr-1 text-gray-400 dark:text-gray-500" />
                            Min. Disp:
                            <span className="font-semibold ml-1">{trabajador.minutosDisponibles.toLocaleString()}</span>
                        </div>
                    </div>
                  </div>

                  {/* Columna Derecha (Gráfico de Tendencia) */}
                  <div className="w-full md:w-2/3 p-2 sm:p-3 flex flex-col">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 px-1">
                      Tendencia Eficiencia (Últ. {trabajador.tendenciaEficiencia.length} días)
                    </h4>
                    <div className="flex-grow min-h-[200px] sm:min-h-[220px]">
                      <TendenciaTrabajadorChart 
                        data={trabajador.tendenciaEficiencia} 
                        lineColor={eficienciaEstilos.lineColor} 
                        height={220} // Puedes ajustar esta altura según sea necesario
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TrabajadorListPage;