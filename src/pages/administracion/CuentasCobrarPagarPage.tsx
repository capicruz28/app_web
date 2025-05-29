// src/pages/administracion/CuentasCobrarPagarPage.tsx
import React from 'react';
import { CuentasCobrarPagarProvider, useCuentasCobrarPagar } from '../../context/CuentasCobrarPagarContext';
import { FiltrosGlobalesCuentasCobrarPagar } from '../../components/administracion/FiltrosGlobalesCuentasCobrarPagar';
import { MotivoVentaTablaCuentasCobrarPagar } from '../../components/administracion/MotivoVentaTablaCuentasCobrarPagar';
import { ClientesProveedoresTablaCuentasCobrarPagar } from '../../components/administracion/ClientesProveedoresTablaCuentasCobrarPagar';
import { DetalleCuentasCobrarPagar } from '../../components/administracion/DetalleCuentasCobrarPagar';
// No necesitamos importar CuentaCobrarPagar aquí ya que el contexto la maneja
// import type { CuentaCobrarPagar } from '../../types/administracion.types';

// --- KPI Card ---
const KPI: React.FC<{ title: string; value: number; bg: string }> = ({ title, value, bg }) => (
  <div className={`rounded-lg shadow flex flex-col items-center justify-center h-[78px] ${bg}`}>
    <span className="text-xs font-semibold tracking-wide">{title}</span>
    <span className="text-lg font-bold mt-1">
      {value.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
    </span>
  </div>
);

const CuentasCobrarPagarDashboard: React.FC = () => {
  // Consumir del contexto
  const {
    isLoading,
    dataFiltrada, // Usamos la data filtrada del contexto
    // Eliminamos los setters de filtro global ya que FiltrosGlobalesCuentasCobrarPagar los usa directamente
    // setFiltro,
    // clearFiltros,
    
    // Eliminamos clearSeleccion ya que no se usa en este componente
    // clearSeleccion,
    // Eliminamos motivoVentaSeleccion y setMotivoVentaSeleccion ya que MotivoVentaTabla los usa directamente
    // motivoVentaSeleccion,
    // setMotivoVentaSeleccion,
  } = useCuentasCobrarPagar();

  // Eliminamos estados locales de filtrado y selección
  // const [dataFiltrada, setDataFiltrada] = React.useState<CuentaCobrarPagar[]>([]);
  // const [selectedSerie, setSelectedSerie] = React.useState<string | null>(null);
  // const [selectedCliente, setSelectedCliente] = React.useState<string | null>(null);
  // const [selectedNumero, setSelectedNumero] = React.useState<string | null>(null);

  // Eliminamos handlers locales de filtrado y selección
  // const handleFilterChange = React.useCallback((data: CuentaCobrarPagar[]) => {
  //   setDataFiltrada(data);
  //   setSelectedSerie(null);
  //   setSelectedCliente(null);
  //   setSelectedNumero(null);
  // }, []);

  // Eliminamos handlers para las selecciones locales
  // const handleSerieSelect = React.useCallback((serie: string | null) => {
  //   setSelectedSerie(prev => prev === serie ? null : serie);
  //   setSelectedCliente(null);
  //   setSelectedNumero(null);
  // }, []);

  // const handleClienteSelect = React.useCallback((cliente: string | null) => {
  //   setSelectedCliente(prev => prev === cliente ? null : cliente);
  //   setSelectedSerie(null);
  //   setSelectedNumero(null);
  // }, []);

  // const handleNumeroSelect = React.useCallback((numero: string | null) => {
  //   setSelectedNumero(prev => prev === numero ? null : numero);
  //   setSelectedSerie(null);
  //   setSelectedCliente(null);
  // }, []);

  // La data para las tablas ahora es simplemente dataFiltrada del contexto
  // Eliminamos los useMemo locales para dataMotivoVenta, dataClientesProveedores, dataDetalle
  // const dataMotivoVenta = React.useMemo(() => { ... }, [dataFiltrada, selectedNumero, selectedCliente]);
  // const dataClientesProveedores = React.useMemo(() => { ... }, [dataFiltrada, selectedNumero, selectedSerie]);
  // const dataDetalle = React.useMemo(() => { ... }, [dataFiltrada, selectedSerie, selectedCliente]);

  // --- KPIs ---
  // Los KPIs ahora se calculan directamente sobre la dataFiltrada del contexto
  const kpiTotal = React.useMemo(
    () => dataFiltrada.reduce((acc, item) => acc + Number(item.importe_moneda_funcional ?? 0), 0),
    [dataFiltrada]
  );
  const kpiVencido = React.useMemo(
    () =>
      dataFiltrada
        .filter(
          item =>
            item.semana_ajustada &&
            !item.semana_ajustada.startsWith('S/') &&
            item.semana_ajustada.slice(-2) === '00'
        )
        .reduce((acc, item) => acc + Number(item.importe_moneda_funcional ?? 0), 0),
    [dataFiltrada]
  );
  const kpiEnFecha = React.useMemo(
    () =>
      dataFiltrada
        .filter(
          item =>
            item.semana_ajustada &&
            !item.semana_ajustada.startsWith('S/') &&
            item.semana_ajustada.slice(-2) !== '00'
        )
        .reduce((acc, item) => acc + Number(item.importe_moneda_funcional ?? 0), 0),
    [dataFiltrada]
  );
  const kpiSinFecha = React.useMemo(
    () =>
      dataFiltrada
        .filter(item => item.semana_ajustada && item.semana_ajustada.startsWith('S/'))
        .reduce((acc, item) => acc + Number(item.importe_moneda_funcional ?? 0), 0),
    [dataFiltrada]
  );

  // --- Layout ---
  return (
    <div className="bg-gray-100 dark:bg-gray-950 min-h-screen">
      <h1 className="text-xl font-bold mb-1 text-gray-800 dark:text-gray-200">
        Dashboard Cuentas por Cobrar/Pagar
      </h1>
      <div className="mb-2">
        {/* FiltrosGlobalesCuentasCobrarPagar ahora usa el contexto directamente */}
        {/* Eliminamos la prop onFilterChange */}
        <FiltrosGlobalesCuentasCobrarPagar />
      </div>
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded shadow p-2">Cargando datos...</div>
      ) : (
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex flex-row gap-3 items-stretch">
            <div className="flex-1 min-w-0">
              <div className="bg-white dark:bg-gray-800 rounded shadow p-1 h-full">
                {/* Pasamos la dataFiltrada del contexto */}
                {/* Eliminamos las props selectedSerie y onSelectSerie */}
                <MotivoVentaTablaCuentasCobrarPagar/>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-white dark:bg-gray-800 rounded shadow p-1 h-full">
                {/* Pasamos la dataFiltrada del contexto */}
                {/* Necesitaremos ajustar ClientesProveedoresTablaCuentasCobrarPagar para usar el contexto */}
                <ClientesProveedoresTablaCuentasCobrarPagar/>
              </div>
            </div>
            {/* KPIs alineados verticalmente, ancho fijo y alto alineado */}
            <div className="flex flex-col justify-between w-[120px] min-w-[120px] max-w-[180px] h-full gap-2">
              <KPI
                title="Monto Total"
                value={kpiTotal}
                bg="bg-green-500 text-white"
              />
              <KPI
                title="Monto Vencido"
                value={kpiVencido}
                bg="bg-rose-500 text-white"
              />
              <KPI
                title="Monto en Fecha"
                value={kpiEnFecha}
                bg="bg-blue-500 text-white"
              />
              <KPI
                title="Monto sin Fecha"
                value={kpiSinFecha}
                bg="bg-neutral-500 text-white"
              />
            </div>
          </div>
          <div>
            <div className="bg-white dark:bg-gray-800 rounded shadow p-1">
              {/* Pasamos la dataFiltrada del contexto */}
              {/* Necesitaremos ajustar DetalleCuentasCobrarPagar para usar el contexto */}
              <DetalleCuentasCobrarPagar/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CuentasCobrarPagarPage: React.FC = React.memo(() => (
  <CuentasCobrarPagarProvider>
    <CuentasCobrarPagarDashboard />
  </CuentasCobrarPagarProvider>
));

CuentasCobrarPagarPage.displayName = 'CuentasCobrarPagarPage';

export default CuentasCobrarPagarPage;