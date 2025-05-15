// src/pages/manufactura/costura/EficienciaDashboardPage.tsx
import React from 'react';
import { EficienciaProvider, useEficiencia } from '../../../context/EficienciaContext';
import { useEficienciaKPIs } from '../../../hooks/useEficienciaKPIs';
import { useEficienciaProcesada } from '../../../hooks/useEficienciaProcesada';
import { KPIsPrincipales } from '../../../components/costura/KPIsPrincipales';
import { EficienciaPorLinea } from '../../../components/costura/EficienciaPorLinea';
import { TopCostureros } from '../../../components/costura/TopCostureros';
import { MapaCalor } from '../../../components/costura/MapaCalor';
import { TendenciaEficiencia } from '../../../components/costura/TendenciaEficiencia';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, format } from 'date-fns';
import { Link } from 'react-router-dom';

const INPUT_CLASS =
  "block w-full px-2 py-1 text-sm border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100";

type FiltroFecha = 'semana' | 'mes' | 'personalizado';

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

  const [filtroFecha, setFiltroFecha] = React.useState<FiltroFecha>('semana');

  React.useEffect(() => {
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
  }, [filtroFecha, setFechaInicio, setFechaFin]);

  const handleLineaClick = (linea: string) => {
    setSelectedLinea(selectedLinea === linea ? null : linea);
  };

  const handleFechaChange = (setter: (fecha: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
  };

  const handleFiltroFecha = (tipo: FiltroFecha) => {
    setFiltroFecha(tipo);
  };

  const datosFiltrados = React.useMemo(() => {
    if (!data?.datos_reporte) return [];
    if (!selectedLinea) return data.datos_reporte;
    return data.datos_reporte.filter(item => item.linea === selectedLinea);
  }, [data, selectedLinea]);

  const { eficienciaPorLinea } = useEficienciaProcesada(data?.datos_reporte ?? []);
  const { datosMapaCalor, topCostureros, tendenciaEficiencia } = useEficienciaProcesada(datosFiltrados);
  const { kpis } = useEficienciaKPIs(datosFiltrados, selectedLinea);

  const fechaInputsDisabled = filtroFecha !== 'personalizado';

  return (
    <div>
      <header className="mb-3">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Dashboard de Eficiencia de Costura {selectedLinea ? `(Línea: ${selectedLinea})` : ''}
        </h1>
      </header>

      {/* Card de filtros */}
      <div className="mb-2 bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-3 flex flex-row flex-wrap gap-3 items-end">
          <div>
            <label htmlFor="fechaInicio" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Inicio</label>
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
            <label htmlFor="fechaFin" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Fin</label>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-2">
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
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Top 10 Costureros
                </h2>
                <Link 
                  to="/manufactura/costura/trabajadores"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Ver todos los trabajadores
                </Link>
              </div>
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

          {/* Card Mapa de Calor */}
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-white dark:bg-gray-800 p-3 shadow rounded-lg">
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