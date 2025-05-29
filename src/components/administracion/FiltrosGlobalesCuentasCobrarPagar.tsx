// src/components/administracion/FiltrosGlobalesCuentasCobrarPagar.tsx
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useCuentasCobrarPagar } from '../../context/CuentasCobrarPagarContext'; // Importar el hook del contexto
import { RefreshCw, FileText } from 'lucide-react';
import { EstadoCuentaModal } from './EstadoCuentaModal'; // Importamos el nuevo componente

// Utilidad para obtener opciones únicas de la data filtrada
function getUniqueOptions<T>(data: T[], key: keyof T): string[] {
  // Asegurarse de que el valor sea un string antes de filtrar y mapear
  return Array.from(new Set(data.map(item => String(item[key] ?? '')).filter(Boolean)));
}

// Diccionario de etiqueta para tipo_cuenta
const tipoCuentaLabels: Record<string, string> = {
  C: 'Cobrar',
  P: 'Pagar',
};
const tipoCuentaReverseLabels: Record<string, string> = {
  Cobrar: 'C',
  Pagar: 'P',
};

// Utilidad para medir el ancho de texto en px (fuente y tamaño igual al dropdown)
function getTextWidth(text: string, font = '11px Inter, Arial, sans-serif') {
  if (typeof window === 'undefined') return 0;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return 0;
  context.font = font;
  return context.measureText(text).width;
}

// MultiSelect compacto con portal para el dropdown, ancho dinámico y buscador opcional
const MultiSelect: React.FC<{
  label: string;
  options: string[];
  selected: string[]; // Aseguramos que espera string[]
  onChange: (selected: string[]) => void;
  id: string;
  searchable?: boolean;
}> = ({ label, options, selected, onChange, id, searchable }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({});
  const [search, setSearch] = React.useState('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const normalized = (v: string | null | undefined) => (v ?? '').trim();

  const handleCheck = (value: string) => {
    const normValue = normalized(value);
    // Normalizar también los elementos seleccionados antes de comparar
    const normSelected = selected.map(normalized);
    if (normSelected.includes(normValue)) {
      onChange(normSelected.filter(v => v !== normValue));
    } else {
      onChange([...normSelected, normValue]);
    }
  };

  const allSelected = selected.length === 0;

  // Para mostrar el resumen de selección en el botón
  const resumen = allSelected
    ? 'Todas'
    : selected.length === 1
      ? selected[0]
      : `${selected.length} seleccionados`;

  // Cerrar el dropdown si se hace click fuera
  React.useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Calcular posición y ancho del dropdown al abrir
  React.useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();

      // Calcular el ancho mínimo necesario para las opciones
      const font = '11px Inter, Arial, sans-serif';
      let maxOptionWidth = 0;
      // Considera también la opción "Todas" y el input de búsqueda si aplica
      const allOptions = ['Todas', ...(searchable ? options.filter(opt => opt.toLowerCase().includes(search.toLowerCase())) : options)];
      for (const opt of allOptions) {
        // Suma 32px aprox. para el checkbox y padding
        maxOptionWidth = Math.max(maxOptionWidth, getTextWidth(opt, font) + 32);
      }
      // Limita el ancho máximo a 320px para evitar dropdowns gigantes
      const minDropdownWidth = Math.max(rect.width, Math.min(maxOptionWidth, 320));

      setDropdownStyle({
        position: 'absolute',
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: minDropdownWidth,
        minWidth: minDropdownWidth,
        zIndex: 9999,
      });
    }
  }, [open, options, search, searchable]);

  // Opciones filtradas por búsqueda si aplica
  const filteredOptions = searchable && open
    ? options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()))
    : options;

  // Enfocar el input de búsqueda sin hacer scroll
  React.useEffect(() => {
    if (open && searchable && searchInputRef.current) {
      searchInputRef.current.focus({ preventScroll: true });
    }
  }, [open, searchable]);

  // El dropdown se renderiza en un portal fuera del contenedor con overflow
  const dropdown = open
    ? ReactDOM.createPortal(
        <div
          id={`dropdown-${id}`}
          style={dropdownStyle}
          className="border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 shadow max-h-60 overflow-y-auto text-[11px]"
        >
          {searchable && (
            <div className="px-2 py-1 sticky top-0 bg-white dark:bg-gray-700 z-10">
              <input
                type="text"
                ref={searchInputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          )}
          <label className="block px-2 py-1">
            <input
              type="checkbox"
              checked={allSelected}
              onMouseDown={e => {
                e.preventDefault();
                onChange([]);
              }}
              className="mr-1"
            />
            Todas
          </label>
          {filteredOptions.map(opt => (
            <label key={opt} className="block px-2 py-1">
              <input
                type="checkbox"
                // [MODIFICADO] Normalizar el valor de la opción antes de comparar
                checked={selected.map(normalized).includes(normalized(opt))}
                onMouseDown={e => {
                  e.preventDefault();
                  handleCheck(opt);
                }}
                className="mr-1"
              />
              {opt}
            </label>
          ))}
        </div>,
        document.body
      )
    : null;

  return (
    <div className="relative min-w-[110px] max-w-[150px]" ref={ref}>
      <span className="font-semibold text-[11px] mb-0.5 block">{label}</span>
      <button
        type="button"
        ref={buttonRef}
        className="w-full border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 text-left bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs"
        style={{ minHeight: 28 }}
        onClick={() => setOpen(o => !o)}
      >
        {resumen}
        <span className="float-right">{open ? '▲' : '▼'}</span>
      </button>
      {dropdown}
    </div>
  );
};

const filtroKeys = [
  { key: 'empresa', label: 'Empresa' },
  { key: 'responsable', label: 'Responsable' },
  { key: 'tipo_cuenta', label: 'Tipo Cuenta' },
  { key: 'cliente_proveedor', label: 'Cliente/Proveedor' },
  { key: 'descripcion_comprobante', label: 'Comprobante' },
  { key: 'serie_comprobante', label: 'Serie Comprobante' },
  { key: 'moneda', label: 'Moneda' },
] as const;

type FiltroKey = typeof filtroKeys[number]['key'];

export const FiltrosGlobalesCuentasCobrarPagar: React.FC = () => {
  // Consumir del contexto
  const { data, filtros, setFiltro, clearFiltros, refreshData, isLoading, dataFiltrada } = useCuentasCobrarPagar();
  
  // Estado para controlar la apertura del modal de estado de cuenta
  const [isEstadoCuentaModalOpen, setIsEstadoCuentaModalOpen] = useState(false);

  // Verificar si hay un cliente seleccionado en los filtros
  const hasClienteSeleccionado = filtros.cliente_proveedor && 
                               Array.isArray(filtros.cliente_proveedor) && 
                               filtros.cliente_proveedor.length === 1;
  
  const clienteSeleccionado = hasClienteSeleccionado && filtros.cliente_proveedor[0] ? 
                             filtros.cliente_proveedor[0] : "";

  // Función para abrir el modal de estado de cuenta
  const handleGenerarEstadoCuenta = () => {
    setIsEstadoCuentaModalOpen(true);
  };

  // Función para cerrar el modal
  const handleCloseEstadoCuentaModal = () => {
    setIsEstadoCuentaModalOpen(false);
  };

  // Opciones únicas para cada filtro, recalculadas en base a la data completa del contexto
  // y los filtros actuales del contexto (excluyendo el filtro actual)
  const opcionesPorFiltro: Record<FiltroKey, string[]> = React.useMemo(() => {
    const result: Record<FiltroKey, string[]> = {} as any;
    filtroKeys.forEach(({ key }) => {
      // Para cada filtro, excluimos su propio filtro de la selección para calcular las opciones posibles
      let filtered = [...data];
      filtroKeys.forEach(({ key: otherKey }) => {
        if (otherKey !== key) {
          const selected = filtros[otherKey]; // Usar filtros del contexto
          // Asegurarse de que 'selected' sea un array antes de usar .length y .includes
          if (Array.isArray(selected) && selected.length > 0) {
            filtered = filtered.filter(item => selected.includes(String(item[otherKey] ?? '').trim()));
          }
        }
      });
      result[key] = getUniqueOptions(filtered, key);
    });
    return result;
  }, [data, filtros]); // Dependencias: data completa y filtros del contexto

  // Cuando cambia la selección de un filtro, actualizamos el estado en el CONTEXTO
  const handleMultiFiltroChange = (key: FiltroKey, selected: string[]) => {
    setFiltro(key, selected); // Usar el setter del contexto
  };

  // Botón limpiar: resetea todos los filtros (ya usa clearFiltros del contexto)
  const handleClear = () => {
    clearFiltros(); // Esto ya limpia los filtros en el contexto
  };

  return (
    <div className="mb-2 p-1 flex flex-col bg-white dark:bg-gray-800 rounded shadow">
      <div className="flex flex-nowrap gap-2 items-end overflow-x-auto w-full">
        {filtroKeys.map(({ key, label }) => (
          <MultiSelect
            key={key}
            id={key}
            label={label}
            options={
              key === 'tipo_cuenta'
                ? opcionesPorFiltro[key].map(opt => tipoCuentaLabels[opt] ?? opt)
                : opcionesPorFiltro[key]
            }
            selected={
              key === 'tipo_cuenta'
                ? (Array.isArray(filtros[key]) ? filtros[key].map(opt => tipoCuentaLabels[opt] ?? opt) : [])
                : (Array.isArray(filtros[key]) ? filtros[key] : [])
            }
            onChange={selected => {
              if (key === 'tipo_cuenta') {
                handleMultiFiltroChange(
                  key,
                  selected.map(opt => tipoCuentaReverseLabels[opt] ?? opt)
                );
              } else {
                handleMultiFiltroChange(key, selected);
              }
            }}
            searchable={key === 'cliente_proveedor'}
          />
        ))}
        {/* Botones en un contenedor flex, con Actualizar a la derecha */}
        <div className="flex flex-row gap-2 items-end w-full">
          <button
            onClick={handleClear}
            className="h-9 min-w-[110px] px-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs font-medium rounded-md shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-gray-600"
          >
            Limpiar Filtros
          </button>
          
          {/* Nuevo botón para generar estado de cuenta */}
          <button
            onClick={handleGenerarEstadoCuenta}
            disabled={!hasClienteSeleccionado || isLoading}
            className="h-9 min-w-[170px] px-3 bg-blue-600 text-white text-xs font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
            title={!hasClienteSeleccionado ? "Selecciona un cliente para generar el estado de cuenta" : "Generar estado de cuenta"}
          >
            <FileText size={15} className="mr-1" />
            Generar estado de cuenta
          </button>
          
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="h-9 min-w-[110px] px-3 bg-indigo-600 text-white text-xs font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center ml-auto"
          >
            <RefreshCw size={15} className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>
      
      {/* Modal de Estado de Cuenta */}
      {isEstadoCuentaModalOpen && hasClienteSeleccionado && (
        <EstadoCuentaModal 
          isOpen={isEstadoCuentaModalOpen} 
          onClose={handleCloseEstadoCuentaModal}
          clienteSeleccionado={clienteSeleccionado}
          dataFiltrada={dataFiltrada}
        />
      )}
    </div>
  );
};