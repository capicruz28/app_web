// src/components/admin/AdminSidebar.tsx (ACTUALIZADO CON ESTILOS DE Sidebar.tsx)

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Sun, // Para ThemeSwitch
  Moon, // Para ThemeSwitch
  FolderKanban,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext'; // <-- IMPORTAR useTheme

// Tipos y arrays de items (sin cambios)
interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  end?: boolean;
}

const generalNavItems: NavItem[] = [
  { to: '/home', icon: LayoutDashboard, label: 'Comite Gerencial', end: true },
];

const administrationNavItems: NavItem[] = [
  { to: '/admin/usuarios', icon: Users, label: 'Gestión de Usuarios', end: true },
  { to: '/admin/roles', icon: ShieldCheck, label: 'Gestión de Roles', end: true },
  { to: '/admin/areas', icon: FolderKanban, label: 'Gestión de Áreas', end: true }, // <-- NUEVO ITEM
];

// --- Componente AdminSidebar ---
const AdminSidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme(); // <-- OBTENER ESTADO Y FUNCIÓN DEL TEMA

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Función auxiliar para renderizar una sección del menú
  const renderNavSection = (title: string, items: NavItem[]) => (
    // Usar px-2 para el contenedor de la sección para alinear con los items
    <div className="px-2 mt-4">
      {!isCollapsed && (
        // Título de sección con estilo similar (ajustado padding)
        <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wider">
          {title}
        </h3>
      )}
      {isCollapsed && <div className="h-2"></div>}

      <div className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            // --- ESTILOS DE ENLACE COPIADOS DE Sidebar.tsx ---
            className={({ isActive }) =>
              `group flex items-center w-full rounded px-2 py-2 text-left transition-colors text-sm ${ // Padding y tamaño de texto
                isActive
                  ? 'bg-blue-600 text-white' // Estado activo (azul)
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200' // Estado normal y hover
              } ${isCollapsed ? 'justify-center' : ''}`
            }
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon
              className={`h-5 w-5 flex-shrink-0 ${!isCollapsed ? 'mr-2' : ''} ${ // Margen ajustado
                // Color de icono (puede requerir ajuste fino si quieres que cambie con el estado activo)
                'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
              }`}
              aria-hidden="true"
            />
            {!isCollapsed && <span className="ml-2 flex-1">{item.label}</span>} {/* Margen ajustado */}
          </NavLink>
        ))}
      </div>
    </div>
  );

  return (
    <aside
      // --- ESTILOS DE CONTENEDOR COPIADOS DE Sidebar.tsx ---
      className={`
        flex flex-col h-screen
        bg-white dark:bg-gray-800
        text-gray-700 dark:text-gray-200
        border-r border-gray-200 dark:border-gray-700
        transition-all duration-300
        ${isCollapsed ? 'w-16' : 'w-64'} {/* Ancho ajustado */}
      `}
    >
      {/* --- Cabecera del Sidebar (Estilo copiado) --- */}
      <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        {!isCollapsed && (
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100"> {/* Título con estilo */}
            PeruFashions
          </span>
        )}
        {/* Botón Colapsar/Expandir (Estilo copiado) */}
        <button
          onClick={toggleCollapse}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-700 dark:text-gray-200"
          aria-label={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* --- Cuerpo del Sidebar (Scrollable, estilo copiado) --- */}
      <nav className="flex-grow overflow-y-auto overflow-x-hidden py-2">
        {renderNavSection('General', generalNavItems)}
        {renderNavSection('Administración', administrationNavItems)}
      </nav>

      {/* --- Pie del Sidebar (Estilo copiado) --- */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 space-y-2"> {/* Añadido space-y-2 si quieres espacio entre botones */}

         {/* Theme Switch (Botón con estilo copiado) */}
         <button
            onClick={toggleDarkMode}
            className={`
              flex items-center justify-center p-2 rounded-lg w-full
              transition-colors duration-200
              hover:bg-gray-100 dark:hover:bg-gray-700
              text-gray-700 dark:text-gray-200
            `}
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} // Añadir title
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
            {!isCollapsed && (
              <span className="ml-2 text-sm">
                {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
              </span>
            )}
          </button>

         {/* Botón de Logout (Estilo adaptado) */}
         <button
            onClick={logout}
            className={`
              flex items-center justify-center p-2 rounded-lg w-full
              transition-colors duration-200
              hover:bg-red-100 dark:hover:bg-red-900/20
              text-gray-700 dark:text-gray-200
              group
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? 'Cerrar Sesión' : undefined}
          >
            <LogOut className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-red-500 dark:group-hover:text-red-400" aria-hidden="true" />
            {!isCollapsed && <span className="ml-2 text-sm group-hover:text-red-700 dark:group-hover:text-red-400">Cerrar Sesión</span>}
          </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;