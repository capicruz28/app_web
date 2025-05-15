// src/components/costura/EstadisticasResumen.tsx
import React from 'react';
import type { EstadisticasTrabajador } from '../../types/costura.types';

interface EstadisticasResumenProps {
  estadisticas: EstadisticasTrabajador;
}

export const EstadisticasResumen: React.FC<EstadisticasResumenProps> = ({ 
  estadisticas 
}) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
      Resumen de Desempeño
    </h3>
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">Eficiencia Máxima</span>
        <span className="font-semibold text-green-500">{estadisticas.eficienciaMaxima.toFixed(1)}%</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">Eficiencia Mínima</span>
        <span className="font-semibold text-red-500">{estadisticas.eficienciaMinima.toFixed(1)}%</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">Días Sobre Promedio</span>
        <span className="font-semibold text-blue-500">{estadisticas.diasSobrePromedio} días</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">Tendencia</span>
        <span className={`font-semibold ${
          estadisticas.tendenciaEficiencia === 'ascendente' ? 'text-green-500' : 
          estadisticas.tendenciaEficiencia === 'descendente' ? 'text-red-500' : 
          'text-yellow-500'
        }`}>
          {estadisticas.tendenciaEficiencia.charAt(0).toUpperCase() + 
           estadisticas.tendenciaEficiencia.slice(1)}
        </span>
      </div>
    </div>
  </div>
);