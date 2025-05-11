// src/components/costura/EficienciaPorLinea.tsx
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface EficienciaPorLineaProps {
  data: Array<{
    linea: string;
    eficiencia: number;
    minutosProducidos: number;
    minutosDisponibles: number;
    prendasProducidas: number;
  }>;
  onLineaClick: (linea: string) => void;
  selectedLinea: string | null;
  className?: string;
}

const getColorByEficiencia = (eficiencia: number) => {
  if (eficiencia >= 90) return '#22c55e'; // verde
  if (eficiencia >= 80) return '#eab308'; // amarillo
  return '#ef4444'; // rojo
};

export const EficienciaPorLinea: React.FC<EficienciaPorLineaProps> = ({
  data, className,
  onLineaClick,
  selectedLinea
}) => {
  // Ordenar por eficiencia descendente
  const sortedData = [...data].sort((a, b) => b.eficiencia - a.eficiencia);

  return (
    <div className={className ? className : "w-full h-full"}>
      <ResponsiveContainer>
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <YAxis
            dataKey="linea"
            type="category"
            width={20}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-white dark:bg-gray-800 p-3 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="font-semibold">{data.linea}</p>
                  <p>Eficiencia: {data.eficiencia.toFixed(1)}%</p>
                  <p>Prendas: {data.prendasProducidas.toLocaleString()}</p>
                  <p>Min. Prod.: {data.minutosProducidos.toLocaleString()}</p>
                </div>
              );
            }}
          />
          <Bar
            dataKey="eficiencia"
            name="Eficiencia"
            radius={[0, 4, 4, 0]}
            cursor="pointer"
            onClick={(data) => onLineaClick(data.linea)}
          >
            {sortedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getColorByEficiencia(entry.eficiencia)}
                opacity={entry.linea === selectedLinea ? 1 : 0.75}
                stroke={entry.linea === selectedLinea ? '#000' : 'none'}
                strokeWidth={1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};