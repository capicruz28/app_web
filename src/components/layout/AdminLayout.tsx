// src/components/layout/AdminLayout.tsx (NUEVO ARCHIVO)

import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../admin/AdminSidebar'; // Ajusta la ruta si es necesario

const AdminLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar de Administración */}
      <AdminSidebar />

      {/* Área de Contenido Principal */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Podrías añadir un Header específico para Admin aquí si lo necesitas */}
        {/* <AdminHeader /> */}

        {/* Contenido de la página específica (inyectado por Outlet) */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <Outlet /> {/* Aquí se renderizarán UserManagementPage, RoleManagementPage, etc. */}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;