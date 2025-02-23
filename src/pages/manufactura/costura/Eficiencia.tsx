import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ArrowUp, ArrowDown, Users, Clock, Target, Loader2 } from 'lucide-react';

// Sample data
const efficiencyData = [
  { name: 'Lun', efficiency: 85, goal: 90 },
  { name: 'Mar', efficiency: 88, goal: 90 },
  { name: 'Mie', efficiency: 92, goal: 90 },
  { name: 'Jue', efficiency: 87, goal: 90 },
  { name: 'Vie', efficiency: 91, goal: 90 }
];

const operatorData = [
  { name: 'Team A', value: 95 },
  { name: 'Team B', value: 88 },
  { name: 'Team C', value: 82 },
  { name: 'Team D', value: 78 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = () => {
  return (
    <div className="w-full h-full p-6 bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard de Eficiencia</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Monitoreo de eficiencia en tiempo real del área de costura
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card hover-effect">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted">Eficiencia Global</p>
                <h3 className="text-2xl font-bold text-primary mt-1">88.5%</h3>
                <div className="flex items-center mt-2 text-green-600">
                  <ArrowUp size={16} />
                  <span className="text-sm ml-1">2.1% vs ayer</span>
                </div>
              </div>
              <Target className="text-primary w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="card hover-effect">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted">Operadores Activos</p>
                <h3 className="text-2xl font-bold text-primary mt-1">245</h3>
                <div className="flex items-center mt-2 text-red-600">
                  <ArrowDown size={16} />
                  <span className="text-sm ml-1">3 vs ayer</span>
                </div>
              </div>
              <Users className="text-secondary w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="card hover-effect">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted">Tiempo Medio</p>
                <h3 className="text-2xl font-bold text-primary mt-1">5.2 min</h3>
                <div className="flex items-center mt-2 text-green-600">
                  <ArrowUp size={16} />
                  <span className="text-sm ml-1">0.3 min mejor</span>
                </div>
              </div>
              <Clock className="text-accent w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="card hover-effect">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted">WIP</p>
                <h3 className="text-2xl font-bold text-primary mt-1">1,234</h3>
                <div className="flex items-center mt-2 text-muted">
                  <Loader2 size={16} />
                  <span className="text-sm ml-1">En proceso</span>
                </div>
              </div>
              <Target className="text-primary w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Efficiency Trend Chart */}
        <div className="card hover-effect">
          <div className="card-header">
            <h3 className="card-title">Tendencia de Eficiencia</h3>
          </div>
          <div className="p-4">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={efficiencyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="efficiency" 
                    stroke="#0055A3" 
                    name="Eficiencia"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="goal" 
                    stroke="#E50040" 
                    strokeDasharray="5 5" 
                    name="Meta"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Team Performance Chart */}
        <div className="card hover-effect">
          <div className="card-header">
            <h3 className="card-title">Rendimiento por Equipo</h3>
          </div>
          <div className="p-4">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={operatorData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={140}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {operatorData.map((entry, index) => (
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

      {/* Progress Section */}
      <div className="card hover-effect mt-4">
        <div className="card-header">
          <h3 className="card-title">Progreso de Metas por Equipo</h3>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {operatorData.map((team, index) => (
              <div key={team.name} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-secondary">
                    {team.name}
                  </span>
                  <span className="text-sm font-medium text-secondary">
                    {team.value}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-secondary h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${team.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;