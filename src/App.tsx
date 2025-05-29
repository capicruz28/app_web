// src/App.tsx (MODIFICADO PARA USAR AdminLayout)
import './index.css'

import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext'; // Ajusta ruta
import { AuthProvider } from './context/AuthContext';   // Ajusta ruta
import { EficienciaProvider } from './context/EficienciaContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { DndProvider } from 'react-dnd'; // <<< Importa DndProvider
import { HTML5Backend } from 'react-dnd-html5-backend'; // <<< Importa el Backend

// Layouts y Protección
import ProtectedRoute from './components/ProtectedRoute'; // Ajusta ruta
import MainLayout from './components/layout/MainLayout'; // Ajusta ruta
import AdminLayout from './components/layout/AdminLayout'; // <-- IMPORTAR NUEVO LAYOUT

// Páginas Públicas
import Login from './pages/auth/Login'; // Ajusta ruta
import UnauthorizedPage from './pages/UnauthorizedPage'; // Ajusta ruta

// Páginas Principales/Normales (Importaciones sin cambios)
import Home from './pages/Home'; // Ajusta ruta
import RecursosHumanos from './pages/RecursosHumanos'; // Ajusta ruta
import Asistencia from './pages/recursos-humanos/Asistencia'; // Ajusta ruta
import Vacaciones from './pages/recursos-humanos/Vacaciones'; // Ajusta ruta
import Planeamiento from './pages/Planeamiento'; // Ajusta ruta
import Ontime from './pages/planeamiento/Ontime'; // Ajusta ruta
import Despacho from './pages/planeamiento/Despacho'; // Ajusta ruta
import LeadTime from './pages/planeamiento/LeadTime'; // Ajusta ruta
import Textil from './pages/Textil'; // Ajusta ruta
import Manufactura from './pages/Manufactura'; // Ajusta ruta
import Corte from './pages/manufactura/Corte'; // Ajusta ruta
import Costura from './pages/manufactura/Costura'; // Ajusta ruta
import Eficiencia from './pages/manufactura/costura/Eficiencia'; // Ajusta ruta
import Acabado from './pages/manufactura/Acabado'; // Ajusta ruta
import Administracion from './pages/Administracion'; // Ajusta ruta

// Páginas de Administración
import UserManagementPage from './pages/admin/UserManagementPage'; // Ajusta ruta
import RoleManagementPage from './pages/admin/RoleManagementPage'; // Ajusta ruta
import AreaManagementPage from './pages/admin/AreaManagementPage';
import MenuManagementPage from './pages/admin/MenuManagementPage';
// ... (importa otras páginas de admin si las tienes) ...

import EficienciaDashboardPage from './pages/manufactura/costura/EficienciaDashboardPage';
import TrabajadorListPage from './pages/manufactura/costura/TrabajadorListPage';
import TrabajadorDetailPage from './pages/manufactura/costura/TrabajadorDetailPage';

import CuentasCobrarPagarPage from './pages/administracion/CuentasCobrarPagarPage';

// Componente intermedio para agrupar rutas de eficiencia de costura
const CosturaEficienciaLayout = () => (
  <EficienciaProvider>
    <Outlet /> {/* Las rutas anidadas se renderizarán aquí */}
  </EficienciaProvider>
);

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider> {/* Envuelve todo en AuthProvider */}
          <BrowserRouter>
            <Routes>
              {/* --- Rutas Públicas --- */}
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* --- Rutas Protegidas (Usuario Normal - Usan MainLayout) --- */}
              {/* Protección base: Requiere estar autenticado */}
              <Route element={<ProtectedRoute />}>
                {/* Layout principal para usuarios autenticados */}
                <Route path="/" element={<MainLayout />}>
                  {/* Redirección del índice a la página principal */}
                  <Route index element={<Navigate to="/home" replace />} />

                  {/* Rutas accesibles para cualquier usuario autenticado */}
                  <Route path="home" element={<Home />} />
                  <Route path="recursos-humanos">
                    <Route index element={<RecursosHumanos />} />
                    <Route path="asistencia" element={<Asistencia />} />
                    <Route path="vacaciones" element={<Vacaciones />} />
                  </Route>
                  <Route path="planeamiento">
                    <Route index element={<Planeamiento />} />
                    <Route path="ontime" element={<Ontime />} />
                    <Route path="despacho" element={<Despacho />} />
                    <Route path="leadtime" element={<LeadTime />} />
                  </Route>
                  <Route path="textil" element={<Textil />} />
                  <Route path="manufactura">
                    <Route index element={<Manufactura />} />
                    <Route path="corte" element={<Corte />} />

                    <Route path="costura" element={<CosturaEficienciaLayout />}>
                      <Route index element={<Costura />} />
                      <Route path="eficiencia" element={<Eficiencia />} />
                      <Route path="dashboard_eficiencia" element={<EficienciaDashboardPage />} />
                        {/* --- NUEVAS RUTAS PARA REPORTE DE TRABAJADORES --- */}
                        {/* Estas rutas estarán bajo /manufactura/costura/ */}
                        <Route path="trabajadores" element={<TrabajadorListPage />} />
                        <Route path="trabajadores/:codigoTrabajador" element={<TrabajadorDetailPage />} />
                        {/* --- FIN DE NUEVAS RUTAS --- */}
                    </Route>
                    <Route path="acabado" element={<Acabado />} />
                  </Route>
                  {/* Si /administracion es una página normal, va aquí */}
                  <Route path="administracion">
                    <Route index element={<Administracion />} />
                    <Route path="cuentas-cobrar-pagar" element={<CuentasCobrarPagarPage />} />
                    {/* Aquí puedes agregar más subrutas de administración en el futuro */}
                  </Route>

                  {/* Catch-all DENTRO de MainLayout: redirige a /home si la ruta no existe */}
                  <Route path="*" element={<Navigate to="/home" replace />} />
                </Route> {/* Fin MainLayout */}
              </Route> {/* Fin ProtectedRoute base */}


              {/* --- Rutas de Administración (Usan AdminLayout) --- */}
              {/* Ruta padre para toda la sección /admin */}
              <Route
                path="/admin"
                element={
                  // Protección específica: Requiere rol 'admin' para acceder a CUALQUIER ruta /admin/*
                  <ProtectedRoute requiredRole="admin">
                    <DndProvider backend={HTML5Backend}>
                    <AdminLayout /> {/* Usar el layout específico de admin */}
                    </DndProvider>
                  </ProtectedRoute>
                }
              >
                {/* Las rutas anidadas se renderizarán dentro del <Outlet /> de AdminLayout */}

                {/* Redirigir la ruta base /admin a la página de usuarios por defecto */}
                <Route index element={<Navigate to="usuarios" replace />} />

                {/* Páginas específicas de administración (ya no necesitan ProtectedRoute individual) */}
                
                <Route path="usuarios" element={<UserManagementPage />} />
                <Route path="roles" element={<RoleManagementPage />} />
                <Route path="areas" element={<AreaManagementPage />} />                
                <Route path="menus" element={<MenuManagementPage />} />
                
                {/* Añade aquí más rutas específicas de admin si las tienes */}
                {/* Ejemplo: <Route path="permisos" element={<PermissionPage />} /> */}

                 {/* Catch-all DENTRO de AdminLayout: redirige a /admin/usuarios si la ruta admin no existe */}
                 <Route path="*" element={<Navigate to="/admin/usuarios" replace />} />

              </Route> {/* Fin de rutas /admin */}


              {/* --- Catch-all Global (Opcional) --- */}
              {/* Si ninguna ruta coincide (ni pública, ni normal, ni admin), */}
              {/* puedes redirigir a login o mostrar una página 404 general. */}
              {/* Ejemplo: <Route path="*" element={<Navigate to="/login" replace />} /> */}

            </Routes>
            <Toaster position="top-right" /> {/* Configuración global de Toaster */}
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;