// src/components/layout/Header.tsx
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { auth, logout } = useAuth();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm h-16 w-full">
      <div className="h-full px-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
          Sistema de Gestión Textil
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 dark:text-gray-300">
            {auth.user?.full_name}
          </span>
          <button
            onClick={logout}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;