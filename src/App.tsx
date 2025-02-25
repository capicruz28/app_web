import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './pages/auth/Login';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import RecursosHumanos from './pages/RecursosHumanos';
import Asistencia from './pages/recursos-humanos/Asistencia';
import Vacaciones from './pages/recursos-humanos/Vacaciones';
import Planeamiento from './pages/Planeamiento';
import Ontime from './pages/planeamiento/Ontime';
import Despacho from './pages/planeamiento/Despacho';
import LeadTime from './pages/planeamiento/LeadTime';
import Textil from './pages/Textil';
import Manufactura from './pages/Manufactura';
import Corte from './pages/manufactura/Corte';
import Costura from './pages/manufactura/Costura';
import Eficiencia from './pages/manufactura/costura/Eficiencia';
import Acabado from './pages/manufactura/Acabado';
import Administracion from './pages/Administracion';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Home />} />
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
                    <Route path="costura">
                      <Route index element={<Costura />} />
                      <Route path="eficiencia" element={<Eficiencia />} />
                    </Route>
                    <Route path="acabado" element={<Acabado />} />
                  </Route>
                  <Route path="administracion" element={<Administracion />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Route>
            </Routes>
            <Toaster position="top-right" />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;