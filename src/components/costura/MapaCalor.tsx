// src/components/costura/MapaCalor.tsx
import React from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface MapaCalorProps {
  data: Array<{
    fecha: string;
    linea: string;
    eficiencia: number;
  }>;
}

const getColorByEficiencia = (eficiencia: number) => {
  // Escala de colores más suave
  if (eficiencia >= 65) return 'bg-green-100 dark:bg-green-900';
  if (eficiencia >= 60) return 'bg-green-50 dark:bg-green-800';
  if (eficiencia >= 55) return 'bg-yellow-100 dark:bg-yellow-900';
  if (eficiencia >= 50) return 'bg-yellow-50 dark:bg-yellow-800';
  return 'bg-red-100 dark:bg-red-900';
};

export const MapaCalor: React.FC<MapaCalorProps> = ({ data }) => {
  // Obtener líneas y fechas únicas
  const lineas = Array.from(new Set(data.map(d => d.linea))).sort();
  const fechas = Array.from(new Set(data.map(d => d.fecha))).sort();

  // Crear matriz de datos
  const matrizDatos = lineas.map(linea => {
    return fechas.map(fecha => {
      const dato = data.find(d => d.linea === linea && d.fecha === fecha);
      return dato?.eficiencia || 0;
    });
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="px-4 py-2 bg-gray-50 dark:bg-gray-800">Línea</th>
            {fechas.map(fecha => (
              <th
                key={fecha}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-xs"
              >
                {format(parseISO(fecha), 'dd MMM', { locale: es })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lineas.map((linea, i) => (
            <tr key={linea}>
              <td className="px-4 py-2 font-medium">{linea}</td>
              {matrizDatos[i].map((eficiencia, j) => (
                <td
                  key={`${linea}-${fechas[j]}`}
                  className={`px-4 py-2 text-center ${getColorByEficiencia(eficiencia)}`}
                >
                  {eficiencia > 0 ? `${eficiencia.toFixed(1)}%` : '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};