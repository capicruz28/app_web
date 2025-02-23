import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

type TimeFilterType = 'today' | 'week' | 'month';

interface DespachoData {
  totalDespachos: number;
  pendientes: number;
  completados: number;
  eficiencia: number;
  despachosPorHora: Array<{
    hora: string;
    cantidad: number;
  }>;
  distribucionEstados: Array<{
    name: string;
    value: number;
  }>;
}

interface DashboardDataType {
  today: DespachoData;
  week: DespachoData;
  month: DespachoData;
}

const Despacho = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('today');
  const [loading, setLoading] = useState<boolean>(false);

  const dashboardData: DashboardDataType = {
    today: {
      totalDespachos: 145,
      pendientes: 23,
      completados: 122,
      eficiencia: 84,
      despachosPorHora: [
        { hora: '08:00', cantidad: 15 },
        { hora: '10:00', cantidad: 22 },
        { hora: '12:00', cantidad: 18 },
        { hora: '14:00', cantidad: 25 },
        { hora: '16:00', cantidad: 20 }
      ],
      distribucionEstados: [
        { name: 'En Tiempo', value: 75 },
        { name: 'Demorado', value: 15 },
        { name: 'Crítico', value: 10 }
      ]
    },
    week: {
      totalDespachos: 876,
      pendientes: 154,
      completados: 722,
      eficiencia: 82,
      despachosPorHora: [
        { hora: 'Lun', cantidad: 150 },
        { hora: 'Mar', cantidad: 180 },
        { hora: 'Mie', cantidad: 165 },
        { hora: 'Jue', cantidad: 190 },
        { hora: 'Vie', cantidad: 170 }
      ],
      distribucionEstados: [
        { name: 'En Tiempo', value: 70 },
        { name: 'Demorado', value: 20 },
        { name: 'Crítico', value: 10 }
      ]
    },
    month: {
      totalDespachos: 3450,
      pendientes: 580,
      completados: 2870,
      eficiencia: 83,
      despachosPorHora: [
        { hora: 'Sem 1', cantidad: 800 },
        { hora: 'Sem 2', cantidad: 850 },
        { hora: 'Sem 3', cantidad: 900 },
        { hora: 'Sem 4', cantidad: 820 }
      ],
      distribucionEstados: [
        { name: 'En Tiempo', value: 72 },
        { name: 'Demorado', value: 18 },
        { name: 'Crítico', value: 10 }
      ]
    }
  };

  const COLORS: string[] = ['#00C49F', '#FFBB28', '#FF8042'];

  const handleFilterChange = (filter: TimeFilterType): void => {
    setLoading(true);
    setTimeFilter(filter);
    setTimeout(() => setLoading(false), 500);
  };

  const currentData = dashboardData[timeFilter];

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header con filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard de Despacho
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Control y seguimiento de despachos
          </p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          {(['today', 'week', 'month'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterChange(filter)}
              className={`px-4 py-2 rounded-lg transition-colors duration-200
                ${timeFilter === filter
                  ? 'bg-primary text-white'
                  : 'border border-primary text-primary hover:bg-primary/10'
                }`}
            >
              {filter === 'today' ? 'Hoy' : filter === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card hover-effect">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted">Total Despachos</p>
                    <h3 className="text-2xl font-bold text-primary mt-1">
                      {currentData.totalDespachos}
                    </h3>
                    <div className="flex items-center mt-2 text-green-600">
                      <span className="text-sm">Procesados</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <i className="fas fa-box text-primary"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="card hover-effect">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted">Pendientes</p>
                    <h3 className="text-2xl font-bold text-secondary mt-1">
                      {currentData.pendientes}
                    </h3>
                    <div className="flex items-center mt-2 text-yellow-600">
                      <span className="text-sm">Por procesar</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <i className="fas fa-clock text-secondary"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="card hover-effect">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted">Completados</p>
                    <h3 className="text-2xl font-bold text-accent mt-1">
                      {currentData.completados}
                    </h3>
                    <div className="flex items-center mt-2 text-green-600">
                      <span className="text-sm">Finalizados</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <i className="fas fa-check text-accent"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="card hover-effect">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted">Eficiencia</p>
                    <h3 className="text-2xl font-bold text-primary mt-1">
                      {currentData.eficiencia}%
                    </h3>
                    <div className="flex items-center mt-2 text-blue-600">
                      <span className="text-sm">Promedio</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <i className="fas fa-chart-line text-primary"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Trend Chart */}
            <div className="card hover-effect">
              <div className="card-header">
                <h3 className="card-title">Tendencia de Despachos</h3>
              </div>
              <div className="p-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentData.despachosPorHora}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hora" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="cantidad" fill="#0055A3" name="Despachos" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Distribution Chart */}
            <div className="card hover-effect">
              <div className="card-header">
                <h3 className="card-title">Distribución por Estado</h3>
              </div>
              <div className="p-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={currentData.distribucionEstados}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label
                      >
                        {currentData.distribucionEstados.map((entry, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Despacho;