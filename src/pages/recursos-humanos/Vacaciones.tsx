import React from 'react';
import {
  BarChart,
  Bar,
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
import { Calendar, Clock, Users, CalendarCheck, ArrowUp, ArrowDown } from 'lucide-react';

const VacacionesDashboard = () => {
  // Datos de ejemplo
  const vacacionesData = [
    { mes: 'Ene', solicitadas: 15, aprobadas: 12 },
    { mes: 'Feb', solicitadas: 18, aprobadas: 15 },
    { mes: 'Mar', solicitadas: 12, aprobadas: 10 },
    { mes: 'Abr', solicitadas: 20, aprobadas: 18 },
    { mes: 'May', solicitadas: 25, aprobadas: 22 }
  ];

  const proximasVacaciones = [
    { id: 1, empleado: 'Carlos Mendoza', departamento: 'Ventas', inicio: '2024-02-01', dias: 7 },
    { id: 2, empleado: 'Ana López', departamento: 'Marketing', inicio: '2024-02-05', dias: 5 },
    { id: 3, empleado: 'Roberto García', departamento: 'IT', inicio: '2024-02-10', dias: 10 },
    { id: 4, empleado: 'María Torres', departamento: 'RRHH', inicio: '2024-02-15', dias: 3 }
  ];

  const distribucionDepartamentos = [
    { name: 'Ventas', value: 30 },
    { name: 'Marketing', value: 25 },
    { name: 'IT', value: 20 },
    { name: 'RRHH', value: 15 },
    { name: 'Operaciones', value: 10 }
  ];

  const COLORS = ['#792082', '#0055A3', '#E50040', '#00C49F', '#FFBB28'];

  return (
    <div className="w-full h-full p-6 bg-gray-50 dark:bg-gray-900">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de Vacaciones
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Panel de control y seguimiento de vacaciones
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="btn btn-primary">
            <Calendar className="w-4 h-4 mr-2" />
            Nueva Solicitud
          </button>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card hover-effect">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted">Días Disponibles</p>
                <h3 className="text-2xl font-bold text-primary mt-1">156</h3>
                <div className="flex items-center mt-2 text-green-600">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">Total del equipo</span>
                </div>
              </div>
              <Calendar className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>

        <div className="card hover-effect">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted">Solicitudes Pendientes</p>
                <h3 className="text-2xl font-bold text-secondary mt-1">8</h3>
                <div className="flex items-center mt-2 text-yellow-600">
                  <Clock className="w-4 h-4 mr-1" />
                  <span className="text-sm">Por aprobar</span>
                </div>
              </div>
              <Clock className="w-8 h-8 text-secondary" />
            </div>
          </div>
        </div>

        <div className="card hover-effect">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted">En Vacaciones</p>
                <h3 className="text-2xl font-bold text-accent mt-1">5</h3>
                <div className="flex items-center mt-2 text-blue-600">
                  <Users className="w-4 h-4 mr-1" />
                  <span className="text-sm">Actualmente</span>
                </div>
              </div>
              <Users className="w-8 h-8 text-accent" />
            </div>
          </div>
        </div>

        <div className="card hover-effect">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted">Días Promedio</p>
                <h3 className="text-2xl font-bold text-primary mt-1">12.5</h3>
                <div className="flex items-center mt-2 text-green-600">
                  <CalendarCheck className="w-4 h-4 mr-1" />
                  <span className="text-sm">Por empleado</span>
                </div>
              </div>
              <CalendarCheck className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Tendencias */}
        <div className="card hover-effect">
          <div className="card-header">
            <h3 className="card-title">Tendencia de Solicitudes</h3>
          </div>
          <div className="p-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vacacionesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="solicitadas" fill="#792082" name="Solicitadas" />
                  <Bar dataKey="aprobadas" fill="#0055A3" name="Aprobadas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Distribución por Departamento */}
        <div className="card hover-effect">
          <div className="card-header">
            <h3 className="card-title">Distribución por Departamento</h3>
          </div>
          <div className="p-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribucionDepartamentos}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {distribucionDepartamentos.map((entry, index) => (
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

      {/* Tabla de Próximas Vacaciones */}
      <div className="card hover-effect">
        <div className="card-header">
          <h3 className="card-title">Próximas Vacaciones</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Departamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fecha Inicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Días
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {proximasVacaciones.map((vacacion) => (
                <tr key={vacacion.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-primary">
                          {vacacion.empleado.charAt(0)}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {vacacion.empleado}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {vacacion.departamento}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {vacacion.inicio}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {vacacion.dias}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="badge badge-success">
                      Aprobado
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VacacionesDashboard;