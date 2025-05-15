// src/components/costura/TendenciaTrabajadorChart.tsx
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface TendenciaData {
  fecha: string;
  eficiencia: number;
}

interface TendenciaTrabajadorChartProps {
  data: TendenciaData[];
  lineColor?: string;
  
}

const TendenciaTrabajadorChart: React.FC<TendenciaTrabajadorChartProps> = ({
  data,
  lineColor = "#4f46e5",
  
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-center text-gray-400 dark:text-gray-500">
        No hay suficientes datos para mostrar la tendencia.
      </div>
    );
  }

  // Formatear datos asegurando orden cronológico
  const formattedData = data
    .map(item => ({
      ...item,
      fechaObj: parseISO(item.fecha), // Convertir a objeto Date para ordenamiento
      label: format(parseISO(item.fecha), 'd MMM', { locale: es })
    }))
    .sort((a, b) => a.fechaObj.getTime() - b.fechaObj.getTime());

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={formattedData}
        margin={{
          top: 5,
          right: 20,
          left: 0,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#6b7280' }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={{ stroke: '#e5e7eb' }}
          interval={formattedData.length > 7 ? Math.floor(formattedData.length / (formattedData.length > 15 ? 6 : 4)) : 0}
          padding={{ left: 10, right: 10 }}
        />
        <YAxis
          tickFormatter={(value) => `${Math.round(value)}%`}
          domain={[0, (dataMax: number) => Math.max(100, Math.ceil(dataMax / 10) * 10 + 5)]}
          tick={{ fontSize: 10, fill: '#6b7280' }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={{ stroke: '#e5e7eb' }}
          width={35}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '0.375rem',
            fontSize: '11px',
            padding: '8px 12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
          formatter={(value: number) => [`${value.toFixed(1)}%`, "Eficiencia"]}
          labelFormatter={(_, payload) => {
            if (payload && payload.length > 0) {
              const fecha = parseISO(payload[0].payload.fecha);
              return `Fecha: ${format(fecha, 'd MMM yyyy', { locale: es })}`;
            }
            return "";
          }}
          cursor={{ stroke: '#cbd5e1', strokeWidth: 1.5 }}
        />
        <Line
          type="monotone"
          dataKey="eficiencia"
          stroke={lineColor}
          strokeWidth={2}
          dot={{ r: 3, strokeWidth: 1, fill: lineColor }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: lineColor }}
          name="Eficiencia"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TendenciaTrabajadorChart;