// src/components/ProtectedRoute.tsx (ACTUALIZADO)

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
// Importar el hook useAuth en lugar del contexto directamente
import { useAuth } from '../context/AuthContext'; // Ajusta la ruta si es necesario

interface ProtectedRouteProps {
  requiredRole?: string; // Rol específico requerido (ej. 'admin')
  children?: React.ReactNode; // Para composición: <ProtectedRoute><Child /></ProtectedRoute>
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole, children }) => {
  // Usar el hook personalizado para obtener el estado de autenticación
  const { auth, isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation(); // Para redirigir de vuelta después del login

  // 1. Mostrar estado de carga mientras el AuthContext verifica el token inicial
  if (loading) {
    // Puedes usar el mismo loader global o uno específico aquí
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Verificando sesión... {/* O un componente Spinner */}
      </div>
    );
  }

  // 2. Si no está autenticado (después de cargar), redirigir a login
  if (!isAuthenticated) {
    console.log(`ProtectedRoute: Not authenticated (loading: ${loading}). Redirecting to login from ${location.pathname}`);
    // Guardar la ubicación a la que intentaba acceder para redirigir de vuelta
     const redirectState = location.pathname !== '/unauthorized' ? { from: location } : undefined;
     return <Navigate to="/login" state={redirectState} replace />;
    //return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Si está autenticado, verificar si se requiere un rol específico
  if (requiredRole) {
    let hasRequiredRole = false;

    // Usar el flag 'isAdmin' como atajo si se requiere el rol 'admin'
    if (requiredRole.toLowerCase() === 'admin') {
      hasRequiredRole = isAdmin;
    } else {
      // Para otros roles, verificar directamente en el array de roles del usuario
      // Asegurarse que auth.user y auth.user.roles existan
      hasRequiredRole = auth.user?.roles?.includes(requiredRole) ?? false;
    }

    // Si no tiene el rol requerido, redirigir a "No Autorizado"
    if (!hasRequiredRole) {
      console.warn(`ProtectedRoute: User ${auth.user?.nombre_usuario} does not have required role '${requiredRole}' for path '${location.pathname}'. User roles: ${auth.user?.roles}`);
      return <Navigate to="/unauthorized" replace />;
    }
    // Si tiene el rol, permitir el acceso (continúa al paso 4)
    console.log(`ProtectedRoute: User ${auth.user?.nombre_usuario} has required role '${requiredRole}' for path '${location.pathname}'. Access granted.`);
  }

  // 4. Si está autenticado y (no se requiere rol O tiene el rol requerido)
  // Renderizar el contenido protegido.
  // Usar 'children' si se pasa como prop directa, o 'Outlet' si se usa para rutas anidadas.
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;