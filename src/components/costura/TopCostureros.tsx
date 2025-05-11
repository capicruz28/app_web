// src/components/costura/TopCostureros.tsx
import React from 'react';
import { Trophy } from 'lucide-react';

interface TopCosturerosProps {
  data: Array<{
    codigo: string;
    nombre: string;
    eficiencia: number;
    prendas: number;
    linea: string;
  }>;
  maxVisible?: number;
  className?: string;
}

const getMedalColor = (position: number) => {
  switch (position) {
    case 0: return 'text-yellow-400';
    case 1: return 'text-gray-400';
    case 2: return 'text-amber-600';
    default: return 'text-gray-300';
  }
};

export const TopCostureros: React.FC<TopCosturerosProps> = ({ data, className, maxVisible = 10 }) => {
  return (
    <div className={className ? className : "w-full h-full"}>
      {data.slice(0, maxVisible).map((costurero, index) => (
        <div
          key={costurero.codigo}
          className="bg-white dark:bg-gray-800 rounded p-2 shadow flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <div className={`${getMedalColor(index)} w-6`}>
              {index < 3 ? (
                <Trophy size={18} />
              ) : (
                <span className="text-xs font-bold">{index + 1}</span>
              )}
            </div>
            <div>
              <p className="font-semibold text-xs">{costurero.nombre}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Línea: {costurero.linea}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-base font-bold">
              {costurero.eficiencia.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {costurero.prendas.toLocaleString()} prendas
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};