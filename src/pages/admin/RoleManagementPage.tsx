// src/pages/admin/RoleManagementPage.tsx

import React from 'react';

const RoleManagementPage: React.FC = () => {
  return (
    // El contenido se renderizará dentro del MainLayout
     <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
        Gestión de Roles
      </h1>
       <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <p className="text-gray-700 dark:text-gray-300">
             Aquí se implementará la tabla para listar, crear, editar y gestionar los permisos de los roles.
          </p>
          {/* TODO: Añadir Tabla de Roles */}
          {/* TODO: Añadir Botón "Crear Rol" */}
          {/* TODO: Añadir Modales para Crear/Editar Roles y Asignar Permisos (Menús) */}
       </div>
    </div>
  );
};

export default RoleManagementPage;