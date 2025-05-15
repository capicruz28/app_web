// src/components/layouts/MainLayout.tsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; // Ajusta la ruta si es necesario
import Header from './Header';   // Ajusta la ruta si es necesario

const MainLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Sidebar se posiciona de forma fija y maneja su propia animación de transformación */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
      />
      
      {/* Contenedor del contenido principal */}
      {/* El padding-left cambia instantáneamente; el sidebar se anima suavemente */}
      <div 
        className={`flex-1 flex flex-col ${
          // Tailwind JIT: pl-16 (4rem = 64px), pl-64 (16rem = 256px)
          isSidebarCollapsed ? 'pl-16' : 'pl-64' 
        }`}
        // Se elimina transition-all de este div para que el padding cambie instantáneamente
      >
        <Header />
        <main className="flex-1 p-2 md:pt-0 bg-gray-100 dark:bg-gray-900 min-h-screen">
          {/* El padding general de la página (p-2) se mantiene aquí.
              Si necesitas más padding alrededor del Outlet, ajústalo aquí o en el componente de página.
              Por ejemplo, podrías tener p-4 o p-6 aquí.
          */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;