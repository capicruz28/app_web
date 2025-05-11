// src/components/costura/TendenciaEficiencia.tsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

interface TendenciaEficienciaProps {
  data: Array<{ fecha: string; eficiencia: number }>;
  className?: string;
}

export const TendenciaEficiencia: React.FC<TendenciaEficienciaProps> = ({ data, className }) => {
  const chartData = {
    labels: data.map(d => d.fecha),
    datasets: [
      {
        label: 'Eficiencia (%)',
        data: data.map(d => d.eficiencia),
        fill: false,
        borderColor: '#6366f1',
        backgroundColor: '#6366f1',
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  return (
    <div className={className ? className : "w-full h-full"}>
      <Line
        data={chartData}
        options={{
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { min: 0, max: 120, ticks: { stepSize: 20 } }
          }
        }}
      />
    </div>
  );
};