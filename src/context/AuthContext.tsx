// src/context/AuthContext.tsx
import { createContext, useContext, useState } from 'react';
import Cookies from 'js-cookie';
import { AuthState, AuthResponse } from '../types/auth.types';

interface AuthContextType {
  auth: AuthState;
  setAuth: (response: AuthResponse) => void;  // Cambiado para aceptar AuthResponse
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    token: Cookies.get('token') || null,
  });

  const handleSetAuth = (response: AuthResponse) => {
    // Actualizamos el estado con la estructura correcta
    const newAuth: AuthState = {
      user: response.user_data,
      token: response.access_token
    };
    
    Cookies.set('token', response.access_token, { expires: 7 });
    setAuth(newAuth);
  };

  const logout = () => {
    Cookies.remove('token');
    setAuth({ user: null, token: null });
  };

  return (
    <AuthContext.Provider value={{ 
      auth, 
      setAuth: handleSetAuth,  // Usamos handleSetAuth en lugar de setAuth directamente
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);