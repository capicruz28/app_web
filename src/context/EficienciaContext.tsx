// src/contexts/EficienciaContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { costuraService } from '../services/costura.service';
import type { ReporteEficienciaCosturaResponse } from '../types/costura.types';

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
}

const EficienciaContext = createContext<EficienciaContextType | null>(null);

export const EficienciaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ReporteEficienciaCosturaResponse | null>(null);
  const [selectedLinea, setSelectedLinea] = useState<string | null>(null);
  
  // Inicializar con los últimos 3 meses hasta ayer
  const today = new Date();
  const [fechaInicio, setFechaInicio] = useState(
    format(startOfMonth(subMonths(today, 2)), 'yyyy-MM-dd')
  );
  const [fechaFin, setFechaFin] = useState(
    format(endOfMonth(today), 'yyyy-MM-dd')
  );

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await costuraService.getReporteEficiencia({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      });
      setData(result);
    } catch (error) {
      console.error('Error fetching eficiencia data:', error);
      // Aquí podrías usar tu sistema de notificaciones
    } finally {
      setIsLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  // Cargar datos iniciales
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
        setFechaInicio,
        setFechaFin,
        refreshData
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