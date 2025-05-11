import React from 'react';
import { EficienciaProvider, useEficiencia } from '../../../context/EficienciaContext';
import { useEficienciaKPIs } from '../../../hooks/useEficienciaKPIs';
import { useEficienciaProcesada } from '../../../hooks/useEficienciaProcesada';
import { KPIsPrincipales } from '../../../components/costura/KPIsPrincipales';
import { EficienciaPorLinea } from '../../../components/costura/EficienciaPorLinea';
import { TopCostureros } from '../../../components/costura/TopCostureros';
import { MapaCalor } from '../../../components/costura/MapaCalor';
import { TendenciaEficiencia } from '../../../components/costura/TendenciaEficiencia';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';

const INPUT_CLASS =
  "block w-full px-2 py-1 text-sm border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100";

type FiltroFecha = 'semana' | 'mes' | 'personalizado';

const EficienciaDashboardPage: React.FC = () => {
  const {
    isLoading,
    data,
    selectedLinea,
    fechaInicio,
    fechaFin,
    setSelectedLinea,
    setFechaInicio,
    setFechaFin,
    refreshData
  } = useEficiencia();

  // Estado para el filtro de fecha
  const [filtroFecha, setFiltroFecha] = React.useState<FiltroFecha>('mes');

  // Función para manejar el cambio de línea
  const handleLineaClick = (linea: string) => {
    setSelectedLinea(selectedLinea === linea ? null : linea);
  };

  // Función para manejar el cambio de fecha
  const handleFechaChange = (setter: (fecha: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
  };

  // Acciones rápidas de fecha
  const handleFiltroFecha = (tipo: FiltroFecha) => {
    setFiltroFecha(tipo);
    const today = new Date();
    if (tipo === 'semana') {
      setFechaInicio(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
      setFechaFin(format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    } else if (tipo === 'mes') {
      setFechaInicio(format(startOfMonth(today), 'yyyy-MM-dd'));
      setFechaFin(format(endOfMonth(today), 'yyyy-MM-dd'));
    }
    // Si es personalizado, no cambia las fechas, solo habilita los inputs
  };

  // Filtrar datos por línea seleccionada para KPIs y otros gráficos
  const datosFiltrados = React.useMemo(() => {
    if (!data?.datos_reporte) return [];
    if (!selectedLinea) return data.datos_reporte;
    return data.datos_reporte.filter(item => item.linea === selectedLinea);
  }, [data, selectedLinea]);

  // 1. Procesados para TODOS (para Eficiencia por Línea)
  const { eficienciaPorLinea } = useEficienciaProcesada(data?.datos_reporte ?? []);

  // 2. Procesados para la línea seleccionada (para TopCostureros, MapaCalor y Tendencia)
  const { datosMapaCalor, topCostureros, tendenciaEficiencia } = useEficienciaProcesada(datosFiltrados);

  // KPIs usan datosFiltrados
  const { kpis } = useEficienciaKPIs(datosFiltrados, selectedLinea);

  // Inputs de fecha solo habilitados si es personalizado
  const fechaInputsDisabled = filtroFecha !== 'personalizado';

  return (
    <div className="p-2 md:p-4 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <header className="mb-1">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Dashboard de Eficiencia de Costura {selectedLinea ? `(Línea: ${selectedLinea})` : ''}
        </h1>
      </header>

      {/* Card de filtros de fecha y accesos rápidos alineados horizontalmente */}
      <div className="mb-1 p-2 bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="flex flex-row flex-wrap gap-2 items-end">
          <div>
            <label htmlFor="fechaInicio" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">Fecha Inicio</label>
            <input
              type="date"
              id="fechaInicio"
              value={fechaInicio}
              onChange={handleFechaChange(setFechaInicio)}
              className={INPUT_CLASS}
              disabled={fechaInputsDisabled}
            />
          </div>
          <div>
            <label htmlFor="fechaFin" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">Fecha Fin</label>
            <input
              type="date"
              id="fechaFin"
              value={fechaFin}
              onChange={handleFechaChange(setFechaFin)}
              className={INPUT_CLASS}
              disabled={fechaInputsDisabled}
            />
          </div>
          <div className="flex flex-row gap-2">
            <button
              className={`px-3 py-1 rounded text-xs font-medium border ${filtroFecha === 'semana' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}
              onClick={() => handleFiltroFecha('semana')}
            >
              Última semana
            </button>
            <button
              className={`px-3 py-1 rounded text-xs font-medium border ${filtroFecha === 'mes' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}
              onClick={() => handleFiltroFecha('mes')}
            >
              Último mes
            </button>
            <button
              className={`px-3 py-1 rounded text-xs font-medium border ${filtroFecha === 'personalizado' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}
              onClick={() => handleFiltroFecha('personalizado')}
            >
              Personalizado
            </button>
          </div>
          <button
            onClick={refreshData}
            disabled={isLoading}
            style={{ marginLeft: 16, minWidth: 120 }}
            className={`px-2 py-1 bg-green-600 text-white text-xs font-medium rounded shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? 'Actualizando...' : 'Actualizar Reporte'}
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <p className="text-center text-sm">Cargando...</p>
      ) : data ? (
        <>
          <KPIsPrincipales kpis={kpis} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
            {/* Eficiencia por Línea */}
            <div className="bg-white dark:bg-gray-800 p-2 shadow rounded-lg flex flex-col min-h-[260px] h-[320px]">
              <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">Eficiencia Promedio por Línea</h2>
              <div className="flex-1 min-h-0 flex items-stretch">
                <EficienciaPorLinea
                  data={eficienciaPorLinea}
                  onLineaClick={handleLineaClick}
                  selectedLinea={selectedLinea}
                  className="w-full h-full"
                />
              </div>
            </div>
            {/* Top 10 Costureros */}
            <div className="bg-white dark:bg-gray-800 p-2 shadow rounded-lg flex flex-col min-h-[260px] h-[320px]">
              <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Top 10 Costureros
              </h2>
              <div className="flex-1 min-h-0 overflow-y-auto">
                <TopCostureros data={topCostureros} maxVisible={20} className="w-full h-full" />
              </div>
            </div>
            {/* Tendencia de Eficiencia */}
            <div className="bg-white dark:bg-gray-800 p-2 shadow rounded-lg flex flex-col min-h-[260px] h-[320px]">
              <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Tendencia de Eficiencia
              </h3>
              <div className="flex-1 min-h-0 flex items-stretch">
                <TendenciaEficiencia data={tendenciaEficiencia} className="w-full h-full" />
              </div>
            </div>
          </div>

          {/* Card Mapa de Calor con scroll horizontal solo dentro del card */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <div className="bg-white dark:bg-gray-800 p-4 shadow rounded-lg">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Mapa de Calor de Eficiencia
                </h3>
                <MapaCalor data={datosMapaCalor} />
              </div>
          </div>
        </>
      ) : (
        <p className="text-center text-sm">No hay datos disponibles.</p>
      )}
    </div>
  );
};

const DashboardPageWrapper: React.FC = () => (
  <EficienciaProvider>
    <EficienciaDashboardPage />
  </EficienciaProvider>
);

export default DashboardPageWrapper;