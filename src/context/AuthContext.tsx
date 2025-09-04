// src/context/AuthContext.tsx (Refinado)

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'; // Asegurar ReactNode importado
import Cookies from 'js-cookie';
// Asegúrate que las rutas y tipos sean correctos
import { AuthState, AuthResponse, UserData } from '../types/auth.types'; // UserData debe tener 'roles?: string[]'
import { authService } from '../services/auth.service'; // Asume que este servicio existe

interface AuthContextType {
  auth: AuthState;
  setAuth: (response: AuthResponse) => UserData | null; // Función que actualiza el estado y devuelve UserData
  logout: () => void;
  isAuthenticated: boolean; // ¿Está el usuario logueado?
  isAdmin: boolean; // ¿Tiene el usuario el rol 'admin'?
  loading: boolean; // ¿Se está verificando el token inicial?
}

// Estado inicial (sin usuario, sin token)
const initialAuthState: AuthState = { user: null, token: null };
// Valor inicial del contexto (funciones vacías, estados por defecto)
const initialContextValue: AuthContextType = {
  auth: initialAuthState,
  setAuth: () => null,
  logout: () => {},
  isAuthenticated: false,
  isAdmin: false,
  loading: true, // Empieza cargando para verificar token
};

const AuthContext = createContext<AuthContextType>(initialContextValue);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Estado principal de autenticación
  const [auth, setAuthState] = useState<AuthState>(initialAuthState);
  // Estado para saber si se está verificando el token al cargar la app
  const [loading, setLoading] = useState<boolean>(true);


  // Efecto para verificar el token almacenado en cookies al cargar la aplicación
  useEffect(() => {
    const verifyTokenOnLoad = async () => {
      const token = Cookies.get('token');
      console.log('AuthProvider Mount: Verifying token from cookie:', token);
      if (token) {
        try {
          // Intenta obtener el perfil del usuario usando el token almacenado
          // *** ¡CRÍTICO: authService.getCurrentUserProfile DEBE EXISTIR Y FUNCIONAR! ***
          // Este servicio debería usar el token para llamar a un endpoint tipo /users/me
          const currentUser: UserData | null = await authService.getCurrentUserProfile();

          if (currentUser) {
            console.log('AuthProvider Mount: User profile fetched successfully:', currentUser);
            // Si se obtiene el perfil, restaurar el estado de autenticación
            setAuthState({ user: currentUser, token: token });
          } else {
            // Si el token existe pero no devuelve un perfil válido (token expirado/inválido)
            console.warn('AuthProvider Mount: Token found but no valid user profile fetched. Logging out.');
            logout(); // Limpiar estado y cookie
          }
        } catch (error) {
          // Si hay un error al verificar el token (ej. red, error 500 en /users/me)
          console.error('AuthProvider Mount: Error verifying token/fetching profile:', error);
          logout(); // Limpiar estado y cookie
        }
      } else {
         // Si no hay token en las cookies
         console.log('AuthProvider Mount: No token found in cookies.');
         // Asegurarse que el estado esté limpio (aunque ya debería estarlo por initialAuthState)
         setAuthState(initialAuthState);
      }
      // Terminar el estado de carga
      setLoading(false);
    };

    verifyTokenOnLoad();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Se ejecuta solo una vez al montar el componente

  // Función para actualizar el estado después de un login exitoso
  const handleSetAuth = (response: AuthResponse): UserData | null => {
    // Validar que la respuesta de la API de login sea completa
    if (!response?.access_token || !response?.user_data || !response?.user_data?.usuario_id) {
        console.error("handleSetAuth received invalid or incomplete response:", response);
        logout(); // Limpiar cualquier estado parcial
        return null; // Indicar que falló
    }
    console.log('handleSetAuth: Updating auth state with response:', response);
    const newAuth: AuthState = {
      user: response.user_data, // Guardar todos los datos del usuario
      token: response.access_token
    };

    // Guardar el token en una cookie segura
    Cookies.set('token', response.access_token, {
        expires: 7, // Duración de la cookie (ej. 7 días)
        secure: window.location.protocol === 'https:', // Solo enviar por HTTPS si la página está en HTTPS
        sameSite: 'Lax' // Protección CSRF básica
    });
    // Actualizar el estado de React
    setAuthState(newAuth);
    // Devolver los datos del usuario para que Login.tsx pueda usarlos inmediatamente
    return response.user_data;
  };

  // Función para cerrar sesión
  const logout = () => {
    console.log('logout: Clearing auth state and cookie.');
    Cookies.remove('token'); // Eliminar la cookie
    setAuthState(initialAuthState); // Resetear el estado de React
    // Opcional: Redirigir a /login aquí si se prefiere
    // window.location.href = '/login'; // Redirección dura
    window.location.href = '/login';    
  };

  // Calcular si el usuario está autenticado (basado en si hay token y usuario, y no estamos cargando)
  const isAuthenticated = !loading && !!auth.token && !!auth.user;
  // Calcular si el usuario es admin (basado en los roles del usuario autenticado)
  const isAdmin = isAuthenticated && (auth.user?.roles?.includes('Administrador') ?? false);

  // Log para depuración cada vez que cambie el estado de autenticación
  useEffect(() => {
    console.log('AuthProvider State Update:', { auth, isAuthenticated, isAdmin, loading });
  }, [auth, isAuthenticated, isAdmin, loading]);


  return (
    <AuthContext.Provider value={{
      auth,
      setAuth: handleSetAuth,
      logout,
      isAuthenticated,
      isAdmin,
      loading
    }}>
      {/* Mostrar contenido solo cuando no se esté cargando la verificación inicial */}
      {!loading && children}
      {/* Mostrar un indicador de carga mientras se verifica el token */}
      {loading && (
         <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f0f0', color: '#333' }}>
             {/* Puedes usar un spinner SVG o un componente de UI library aquí */}
             <p style={{ fontSize: '1.2em' }}>Cargando sesión...</p>
         </div>
      )}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto fácilmente
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};