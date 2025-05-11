// src/components/costura/KPIsPrincipales.tsx
import React from 'react';
import { TrendingUp, Package, ArrowRightLeft, AlertTriangle } from 'lucide-react';

interface KPIsPrincipalesProps {
  kpis: {
    eficienciaGeneral: number;
    estadoEficiencia: 'success' | 'warning' | 'danger';
    totalPrendas: number;
    totalMinutosProducidos: number;
    totalMinutosDisponibles: number;
    totalOrdenes: number;
  };
}

const getColorByEstado = (estado: 'success' | 'warning' | 'danger') => {
  switch (estado) {
    case 'success': return 'bg-green-100 text-green-800';
    case 'warning': return 'bg-yellow-100 text-yellow-800';
    case 'danger': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const KPIsPrincipales: React.FC<KPIsPrincipalesProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
      {/* Eficiencia General */}
      <div className={`p-2 rounded-lg shadow flex flex-col items-center justify-center ${getColorByEstado(kpis.estadoEficiencia)}`}>
        <TrendingUp className="w-6 h-6 mb-1" />
        <p className="text-xs font-medium">Eficiencia General</p>
        <p className="text-lg font-bold mt-0.5">{kpis.eficienciaGeneral.toFixed(1)}%</p>
      </div>
      {/* Prendas Producidas */}
      <KPICard
        title="Prendas Producidas"
        value={kpis.totalPrendas.toLocaleString()}
        Icon={Package}
      />
      {/* Minutos Producidos vs Disponibles */}
      <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow flex flex-col items-center justify-center">
        <ArrowRightLeft className="w-6 h-6 mb-1 text-indigo-600 dark:text-indigo-300" />
        <p className="text-xs text-gray-500 dark:text-gray-400">Min. Producidos / Disponibles</p>
        <div className="flex items-end gap-1 mt-0.5">
          <span className="text-base font-semibold text-gray-900 dark:text-gray-100">{kpis.totalMinutosProducidos.toLocaleString()}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">/</span>
          <span className="text-base font-semibold text-gray-900 dark:text-gray-100">{kpis.totalMinutosDisponibles.toLocaleString()}</span>
        </div>
        {/* Barra comparativa */}
        <div className="w-full mt-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
          <div
            className="h-1 bg-indigo-500 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, (kpis.totalMinutosProducidos / (kpis.totalMinutosDisponibles || 1)) * 100)}%`
            }}
          />
        </div>
      </div>
      {/* Órdenes en Proceso */}
      <KPICard
        title="Órdenes en Proceso"
        value={kpis.totalOrdenes.toLocaleString()}
        Icon={AlertTriangle}
      />
    </div>
  );
};

interface KPICardProps {
  title: string;
  value: string;
  Icon: React.FC<{ className?: string }>;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, Icon }) => (
  <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow flex flex-col items-center justify-center">
    <Icon className="w-6 h-6 mb-1 text-indigo-600 dark:text-indigo-300" />
    <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</p>
  </div>
);