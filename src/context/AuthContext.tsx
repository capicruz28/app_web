// src/context/AuthContext.tsx
import { createContext, useContext, useState } from 'react';
import Cookies from 'js-cookie';
import { AuthState } from '../types/auth.types';

interface AuthContextType {
  auth: AuthState;
  setAuth: (auth: AuthState) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    token: Cookies.get('token') || null,
  });

  const logout = () => {
    Cookies.remove('token');
    setAuth({ user: null, token: null });
  };

  return (
    <AuthContext.Provider value={{ auth, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);