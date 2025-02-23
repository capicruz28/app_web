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
import { Users, Clock, UserCheck, UserX, CalendarCheck, ArrowUp, ArrowDown } from 'lucide-react';

// Datos de ejemplo para el dashboard
const asistenciaData = [
  { name: 'Lun', asistencia: 95, meta: 98 },
  { name: 'Mar', asistencia: 94, meta: 98 },
  { name: 'Mie', asistencia: 96, meta: 98 },
  { name: 'Jue', asistencia: 93, meta: 98 },
  { name: 'Vie', asistencia: 97, meta: 98 }
];

const departamentosData = [
  { name: 'Administración', value: 98 },
  { name: 'Producción', value: 92 },
  { name: 'Logística', value: 95 },
  { name: 'Ventas', value: 89 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = () => {
  return (
    <div className="w-full h-full p-6 bg-gray-50 dark:bg-gray-900">
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard de Asistencia</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Monitoreo de asistencia del personal en tiempo real
        </p>
      </div>

      {/* Tarjetas de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Asistencia Total */}
        <div className="card hover-effect">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted">Asistencia Total</p>
                <h3 className="text-2xl font-bold text-primary mt-1">95.8%</h3>
                <div className="flex items-center mt-2 text-green-600">
                  <ArrowUp size={16} />
                  <span className="text-sm ml-1">1.2% vs ayer</span>
                </div>
              </div>
              <Users className="text-primary w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Personal Presente */}
        <div className="card hover-effect">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted">Personal Presente</p>
                <h3 className="text-2xl font-bold text-primary mt-1">245</h3>
                <div className="flex items-center mt-2 text-green-600">
                  <UserCheck size={16} />
                  <span className="text-sm ml-1">5 más que ayer</span>
                </div>
              </div>
              <Clock className="text-secondary w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Tardanzas */}
        <div className="card hover-effect">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted">Tardanzas</p>
                <h3 className="text-2xl font-bold text-primary mt-1">12</h3>
                <div className="flex items-center mt-2 text-red-600">
                  <ArrowUp size={16} />
                  <span className="text-sm ml-1">3 más que ayer</span>
                </div>
              </div>
              <UserX className="text-accent w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Permisos */}
        <div className="card hover-effect">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted">Permisos</p>
                <h3 className="text-2xl font-bold text-primary mt-1">8</h3>
                <div className="flex items-center mt-2 text-yellow-600">
                  <CalendarCheck size={16} />
                  <span className="text-sm ml-1">Aprobados hoy</span>
                </div>
              </div>
              <CalendarCheck className="text-primary w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Gráfico de Tendencia de Asistencia */}
        <div className="card hover-effect">
          <div className="card-header">
            <h3 className="card-title">Tendencia de Asistencia Semanal</h3>
          </div>
          <div className="p-4">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={asistenciaData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[85, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="asistencia" 
                    stroke="#0055A3" 
                    name="Asistencia"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="meta" 
                    stroke="#E50040" 
                    strokeDasharray="5 5" 
                    name="Meta"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Gráfico de Asistencia por Departamento */}
        <div className="card hover-effect">
          <div className="card-header">
            <h3 className="card-title">Asistencia por Departamento</h3>
          </div>
          <div className="p-4">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departamentosData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={140}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {departamentosData.map((entry, index) => (
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

      {/* Tabla de Progreso por Departamento */}
      <div className="card hover-effect mt-4">
        <div className="card-header">
          <h3 className="card-title">Progreso de Asistencia por Departamento</h3>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {departamentosData.map((dept, index) => (
              <div key={dept.name} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-secondary">
                    {dept.name}
                  </span>
                  <span className="text-sm font-medium text-secondary">
                    {dept.value}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-secondary h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${dept.value}%` }}
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