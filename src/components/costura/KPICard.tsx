// src/components/costura/KPICard.tsx
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  trend?: number;
  icon?: React.ReactNode;
  description?: string;
}

export const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  trend, 
  icon, 
  description 
}) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
    <div className="flex justify-between items-start mb-2">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
      {icon}
    </div>
    <div className="flex items-baseline">
      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
      {trend !== undefined && (
        <span className={`ml-2 text-sm ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    {description && (
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
    )}
  </div>
);