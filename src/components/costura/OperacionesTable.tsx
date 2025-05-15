// src/components/costura/OperacionesTable.tsx
import React from 'react';
import type { OperacionAnalisis } from '../../types/costura.types';

interface OperacionesTableProps {
  operaciones: OperacionAnalisis[];
  title: string;
}

export const OperacionesTable: React.FC<OperacionesTableProps> = ({ 
  operaciones, 
  title 
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">{title}</h3>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Operación</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Eficiencia</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Prendas</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">T. Promedio</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {operaciones.map((op) => (
            <tr key={op.codigo}>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{op.nombre}</td>
              <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-gray-100">
                {op.eficiencia.toFixed(1)}%
              </td>
              <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-gray-100">
                {op.cantidadPrendas.toLocaleString()}
              </td>
              <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-gray-100">
                {op.tiempoPromedioPrenda.toFixed(2)} min
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);