import React from 'react';
import { User } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm h-16 w-full transition-colors duration-200">
      <div className="h-full px-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
          Sistema de Gestión Textil
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 dark:text-gray-300">Usuario Demo</span>
          <User className="w-8 h-8 text-gray-500 dark:text-gray-400" />
        </div>
      </div>
    </header>
  );
};

export default Header;