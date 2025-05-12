// src/components/costura/MiniTendenciaChart.tsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface MiniTendenciaData {
  fecha: string; // o un label corto como 'D1', 'D2'
  eficiencia: number;
}

interface MiniTendenciaChartProps {
  data: MiniTendenciaData[];
  lineColor?: string;
  height?: number;
}

const MiniTendenciaChart: React.FC<MiniTendenciaChartProps> = ({ data, lineColor = "#4f46e5", height = 60 }) => { // indigo-600 por defecto
  if (!data || data.length === 0) {
    return <div className="text-xs text-center text-gray-400 dark:text-gray-500 py-2">No hay datos de tendencia.</div>;
  }

  const formattedData = data.map(item => ({
    ...item,
    // Formatear la fecha para que sea más corta en el eje X si es una fecha completa
    // label: new Date(item.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) 
    label: item.fecha.substring(5) // Asume formato YYYY-MM-DD -> MM-DD
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formattedData} margin={{ top: 5, right: 5, left: -35, bottom: 0 }}> {/* Ajustar left para que YAxis no se corte si se muestra */}
        <XAxis 
            dataKey="label" 
            tickLine={false} 
            axisLine={false} 
            tick={{ fontSize: 9, fill: '#6b7280' }} // text-gray-500
            interval={data.length > 5 ? 'preserveStartEnd' : 0} // Mostrar más ticks si hay pocos datos
            padding={{ left: 5, right: 5 }}
        />
        <YAxis 
            hide // Ocultamos el eje Y para un look de minigráfico
            domain={[0, 'dataMax + 15']} // Un poco de espacio arriba
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #e5e7eb', // border-gray-200
            borderRadius: '0.25rem', // rounded
            fontSize: '10px',
            padding: '4px 8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
          formatter={(value: number) => [`${value.toFixed(0)}%`, "Eficiencia"]}
          labelFormatter={(label: string, payload) => {
            // Intentar obtener la fecha original completa si es posible desde el payload
            const originalFecha = payload && payload.length > 0 && payload[0].payload.fecha;
            return `Fecha: ${originalFecha || label}`;
          }}
          cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }} // bg-slate-300
        />
        <Line 
            type="monotone" 
            dataKey="eficiencia" 
            stroke={lineColor}
            strokeWidth={2} 
            dot={data.length <= 7 ? { r: 2.5, fill: lineColor, strokeWidth: 1, stroke: '#fff' } : false}
            activeDot={{ r: 4, fill: lineColor, strokeWidth: 2, stroke: '#fff' }}
            isAnimationActive={false} // Desactivar animación para carga rápida
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MiniTendenciaChart;