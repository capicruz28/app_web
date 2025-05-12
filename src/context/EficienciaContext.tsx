// src/contexts/EficienciaContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { subMonths, startOfMonth, endOfMonth, format, subDays } from 'date-fns'; 
import { costuraService } from '../services/costura.service';
import type { ReporteEficienciaCosturaResponse } from '../types/costura.types';

// --- 1. DEFINE EL TIPO PARA LOS PRESETS (NUEVO) ---
export type PresetKey = 'ultima_semana' | 'ultimo_mes' | 'personalizado';

// --- 2. ACTUALIZA EficienciaContextType ---
interface EficienciaContextType {
  isLoading: boolean;
  data: ReporteEficienciaCosturaResponse | null;
  selectedLinea: string | null; // Se mantiene si lo usas
  fechaInicio: string;
  fechaFin: string;
  setSelectedLinea: (linea: string | null) => void;
  setFechaInicio: (fecha: string) => void; // Este se modificará para interactuar con activePreset
  setFechaFin: (fecha: string) => void;   // Este se modificará para interactuar con activePreset
  refreshData: () => Promise<void>;
  // --- AÑADE ESTAS PROPIEDADES (NUEVO) ---
  setFechaPreset: (preset: PresetKey) => void;
  activePreset: PresetKey;
  // --- FIN DE PROPIEDADES AÑADIDAS ---
}

const EficienciaContext = createContext<EficienciaContextType | null>(null);

export const EficienciaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ReporteEficienciaCosturaResponse | null>(null);
  const [selectedLinea, setSelectedLinea] = useState<string | null>(null); // Se mantiene
  
  // --- 3. AÑADE ESTADO PARA activePreset (NUEVO) ---
  const [activePreset, setActivePreset] = useState<PresetKey>('ultima_semana'); // Default preset

  // Función para obtener fechas iniciales basada en el preset por defecto
  const getInitialDatesForPreset = (preset: PresetKey, todayRef: Date): { inicio: string; fin: string } => {
    let startDate = todayRef;
    let endDate = todayRef;

    if (preset === 'ultima_semana') {
      startDate = subDays(todayRef, 6); // Últimos 7 días incluyendo hoy
      endDate = todayRef;
    } else if (preset === 'ultimo_mes') {
      startDate = subDays(todayRef, 29); // Últimos 30 días incluyendo hoy
      endDate = todayRef;
    } else { 
        // Tu lógica de default anterior si el preset es 'personalizado' inicialmente (o un fallback)
        startDate = startOfMonth(subMonths(todayRef, 2));
        endDate = endOfMonth(todayRef);
    }
    return {
      inicio: format(startDate, 'yyyy-MM-dd'),
      fin: format(endDate, 'yyyy-MM-dd'),
    };
  };
  
  const today = new Date(); // Referencia única de 'hoy' para la inicialización
  const initialDates = getInitialDatesForPreset(activePreset, today); // Usa el activePreset inicial
  
  // Estados internos para las fechas
  const [internalFechaInicio, setInternalFechaInicio] = useState<string>(initialDates.inicio);
  const [internalFechaFin, setInternalFechaFin] = useState<string>(initialDates.fin);

  // refreshData se mantiene como lo tenías, pero ahora usará internalFechaInicio/Fin
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      // console.log(`Refreshing data from ${internalFechaInicio} to ${internalFechaFin}`);
      const result = await costuraService.getReporteEficiencia({
        fecha_inicio: internalFechaInicio, // Usa el estado interno
        fecha_fin: internalFechaFin,       // Usa el estado interno
      });
      setData(result);
    } catch (error) {
      console.error('Error fetching eficiencia data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [internalFechaInicio, internalFechaFin]); // Depende de los estados internos

  // Cargar datos cuando cambian las fechas internas
  useEffect(() => {
    if (internalFechaInicio && internalFechaFin) {
        refreshData();
    }
  }, [internalFechaInicio, internalFechaFin, refreshData]); // refreshData es estable si internalFechas no cambian


  // --- 4. IMPLEMENTA setFechaPreset (NUEVO) ---
  const handleSetFechaPreset = (preset: PresetKey) => {
    setActivePreset(preset); // Actualiza el preset activo inmediatamente
    const currentToday = new Date(); // Siempre usa la fecha actual para calcular presets
    let newStart = currentToday;
    let newEnd = currentToday;

    if (preset === 'ultima_semana') {
      newStart = subDays(currentToday, 6);
      newEnd = currentToday;
    } else if (preset === 'ultimo_mes') {
      newStart = subDays(currentToday, 29);
      newEnd = currentToday;
    }
    // Si es 'personalizado', no cambiamos las fechas aquí.
    // El usuario las cambiará con los inputs, y los setters de fecha (handleSetInternalFecha...)
    // se encargarán de cambiar el activePreset a 'personalizado'.

    if (preset !== 'personalizado') {
      setInternalFechaInicio(format(newStart, 'yyyy-MM-dd'));
      setInternalFechaFin(format(newEnd, 'yyyy-MM-dd'));
      // El useEffect [internalFechaInicio, internalFechaFin] se encargará de llamar a refreshData
    }
  };

  // Modifica los setters de fecha para que actualicen el preset a 'personalizado'
  // y usen los estados internos.
  const handleSetInternalFechaInicio = (date: string) => {
    setInternalFechaInicio(date);
    setActivePreset('personalizado');
  };

  const handleSetInternalFechaFin = (date: string) => {
    setInternalFechaFin(date);
    setActivePreset('personalizado');
  };
  
  // --- 5. ASEGÚRATE DE PROVEER LOS NUEVOS VALORES ---
  const contextValue: EficienciaContextType = {
    isLoading,
    data,
    selectedLinea, // Se mantiene
    fechaInicio: internalFechaInicio, // Expone el estado interno
    fechaFin: internalFechaFin,       // Expone el estado interno
    setSelectedLinea, // Se mantiene
    setFechaInicio: handleSetInternalFechaInicio, // Usa el manejador interno
    setFechaFin: handleSetInternalFechaFin,       // Usa el manejador interno
    refreshData, // Se mantiene tu refreshData original (ahora usa fechas internas)
    setFechaPreset: handleSetFechaPreset, // Provee la nueva función
    activePreset,                         // Provee el nuevo estado
  };

  return (
    <EficienciaContext.Provider value={contextValue}>
      {children}
    </EficienciaContext.Provider>
  );
};

export const useEficiencia = () => {
  const context = useContext(EficienciaContext);
  if (!context) {
    throw new Error('useEficiencia must be used within an EficienciaProvider');
  }
  return context;
};