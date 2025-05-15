// src/context/EficienciaContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  format,
} from 'date-fns';
import { costuraService } from '../services/costura.service';
import type { ReporteEficienciaCosturaResponse } from '../types/costura.types';

export type PresetKey = 'ultima_semana' | 'ultimo_mes' | 'personalizado';

interface EficienciaContextType {
  isLoading: boolean;
  data: ReporteEficienciaCosturaResponse | null;
  selectedLinea: string | null;
  fechaInicio: string;
  fechaFin: string;
  setSelectedLinea: (linea: string | null) => void;
  setFechaInicio: (fecha: string) => void;
  setFechaFin: (fecha: string) => void;
  refreshData: () => Promise<void>;
  setFechaPreset: (preset: PresetKey) => void;
  activePreset: PresetKey;
}

const EficienciaContext = createContext<EficienciaContextType | null>(null);

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
  const today = new Date();
  // Retroceder al primer día del mes actual
  const firstDayCurrentMonth = startOfMonth(today);
  // Retroceder un día para llegar al mes anterior
  const lastDayPreviousMonth = new Date(firstDayCurrentMonth);
  lastDayPreviousMonth.setDate(lastDayPreviousMonth.getDate() - 1);
  // Obtener inicio y fin del mes anterior
  const inicio = startOfMonth(lastDayPreviousMonth);
  const fin = endOfMonth(lastDayPreviousMonth);
  
  return {
    inicio: format(inicio, 'yyyy-MM-dd'),
    fin: format(fin, 'yyyy-MM-dd'),
  };
};

const initialDates = getUltimaSemanaCerrada();

export const EficienciaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ReporteEficienciaCosturaResponse | null>(null);
  const [selectedLinea, setSelectedLinea] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<PresetKey>('ultima_semana');
  const [fechaInicio, setFechaInicio] = useState(initialDates.inicio);
  const [fechaFin, setFechaFin] = useState(initialDates.fin);

  const handleSetFechaPreset = useCallback((preset: PresetKey) => {
    if (preset === 'ultima_semana') {
      const { inicio, fin } = getUltimaSemanaCerrada();
      setFechaInicio(inicio);
      setFechaFin(fin);
    } else if (preset === 'ultimo_mes') {
      const { inicio, fin } = getUltimoMesCerrado();
      setFechaInicio(inicio);
      setFechaFin(fin);
    }
    setActivePreset(preset);
  }, []);

  const handleSetFechaInicio = useCallback((fecha: string) => {
    setFechaInicio(fecha);
    setActivePreset('personalizado');
  }, []);

  const handleSetFechaFin = useCallback((fecha: string) => {
    setFechaFin(fecha);
    setActivePreset('personalizado');
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await costuraService.getReporteEficiencia({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });
      setData(result);
    } catch (error) {
      console.error('Error fetching eficiencia data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return (
    <EficienciaContext.Provider
      value={{
        isLoading,
        data,
        selectedLinea,
        fechaInicio,
        fechaFin,
        setSelectedLinea,
        setFechaInicio: handleSetFechaInicio,
        setFechaFin: handleSetFechaFin,
        refreshData,
        setFechaPreset: handleSetFechaPreset,
        activePreset,
      }}
    >
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