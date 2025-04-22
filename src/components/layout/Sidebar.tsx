// src/components/layout/Sidebar.tsx (CORREGIDO - Basado en tu original)

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// CORRECCIÓN: Asegúrate que la ruta a ThemeContext sea correcta
import { useTheme } from '../../context/ThemeContext';
import { Popover } from 'react-tiny-popover';
import * as LucideIcons from 'lucide-react';
// CORRECCIÓN: Asegúrate que la ruta a menu.types sea correcta
import type { MenuItem, SidebarProps, MenuResponse } from '../../types/menu.types';
// CORRECCIÓN: Asegúrate que la ruta a menu.service sea correcta
import { menuService } from '../../services/menu.service';

// --- Interfaz PopoverContentProps (sin cambios) ---
interface PopoverContentProps {
  item: MenuItem;
  nestedPopover: string | null;
  setNestedPopover: (identifier: string | null) => void;
  handleNavigate: (path: string) => void;
  currentPath: string;
  getItemIdentifier: (item: MenuItem) => string;
}

// --- Función getIcon (sin cambios) ---
const getIcon = (iconName: string | null | undefined) => {
  if (!iconName) return <LucideIcons.Circle className="w-5 h-5 opacity-50" />;
  try {
      const IconComponent = (LucideIcons as any)[iconName];
      return IconComponent ? <IconComponent className="w-5 h-5" /> : <LucideIcons.HelpCircle className="w-5 h-5 text-red-500" />;
  } catch (error) {
      console.error(`Error loading icon: ${iconName}`, error);
      return <LucideIcons.AlertTriangle className="w-5 h-5 text-red-500" />;
  }
};

// --- Componente PopoverContent (sin cambios funcionales, ajusta colores si es necesario) ---
const PopoverContent: React.FC<PopoverContentProps> = ({
  item,
  nestedPopover,
  setNestedPopover,
  handleNavigate,
  currentPath,
  getItemIdentifier
}) => {
  const isActive = useCallback((path: string | null | undefined) => !!path && currentPath.startsWith(path), [currentPath]);

  // Asegúrate que los colores aquí coincidan con tu tema
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg min-w-[200px] py-1 ml-1 border border-gray-200 dark:border-gray-700">
      {item.children?.map((subItem) => {
        const subItemIdentifier = getItemIdentifier(subItem);
        const isSubItemActive = isActive(subItem.ruta);
        const canNavigate = subItem.ruta && subItem.es_activo;
        const hasChildren = subItem.children && subItem.children.length > 0;

        return (
          <div key={subItem.menu_id}>
            {hasChildren ? (
              <Popover
                isOpen={nestedPopover === subItemIdentifier}
                positions={['right']}
                content={
                  <PopoverContent
                    item={subItem}
                    nestedPopover={nestedPopover}
                    setNestedPopover={setNestedPopover}
                    handleNavigate={handleNavigate}
                    currentPath={currentPath}
                    getItemIdentifier={getItemIdentifier}
                  />
                }
                onClickOutside={() => setNestedPopover(null)}
              >
                <button
                  className={`flex items-center w-full px-4 py-2 text-left transition-colors text-gray-700 dark:text-gray-200
                    ${isSubItemActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} // Ejemplo con colores explícitos
                    ${!subItem.es_activo ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (subItem.es_activo) {
                        setNestedPopover(nestedPopover === subItemIdentifier ? null : subItemIdentifier);
                    }
                  }}
                  disabled={!subItem.es_activo}
                >
                  {getIcon(subItem.icono)}
                  <span className="ml-3">{subItem.nombre}</span>
                  <LucideIcons.ChevronRight className="ml-auto w-4 h-4" />
                </button>
              </Popover>
            ) : (
              <button
                className={`flex items-center w-full px-4 py-2 text-left transition-colors text-gray-700 dark:text-gray-200
                  ${isSubItemActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} // Ejemplo con colores explícitos
                  ${!subItem.es_activo ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => { if (canNavigate) handleNavigate(subItem.ruta as string) }}
                disabled={!canNavigate}
              >
                {getIcon(subItem.icono)}
                <span className="ml-3">{subItem.nombre}</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};


const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [popoverOpen, setPopoverOpen] = useState<string | null>(null);
  const [nestedPopover, setNestedPopover] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const getItemIdentifier = useCallback((menuItem: MenuItem): string => {
    return menuItem.ruta ?? `menu-${menuItem.menu_id}`;
  }, []);

  const isActive = useCallback((path: string | null | undefined) => !!path && location.pathname.startsWith(path), [location.pathname]);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    try {
      const response: MenuResponse = await menuService.getMenu();
      setMenuItems(response.menu || []);
    } catch (error) {
      console.error('Error loading menu:', error);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const handleMenuClick = (item: MenuItem) => {
    const itemIdentifier = getItemIdentifier(item);
    const hasChildren = item.children && item.children.length > 0;
    const canNavigate = item.ruta && item.es_activo;

    if (!item.es_activo && !hasChildren) return;

    if (isCollapsed) {
      if (hasChildren) {
        setPopoverOpen(popoverOpen === itemIdentifier ? null : itemIdentifier);
        setNestedPopover(null);
      } else if (canNavigate) {
        navigate(item.ruta as string);
        setPopoverOpen(null);
        setNestedPopover(null);
      }
    } else {
      if (hasChildren) {
        setExpandedItems(prev =>
          prev.includes(itemIdentifier)
            ? prev.filter(id => id !== itemIdentifier)
            : [...prev, itemIdentifier]
        );
      } else if (canNavigate) {
        navigate(item.ruta as string);
      }
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setPopoverOpen(null);
    setNestedPopover(null);
  };

  if (loading) {
    // Puedes mantener tu loader o usar este simple
    return (
      <aside className={`flex flex-col h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
         <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
           <LucideIcons.Loader className="w-6 h-6 animate-spin text-blue-600" />
         </div>
      </aside>
    );
  }

  return (
    // --- Contenedor principal ---
    <div
      className={`
        bg-white dark:bg-gray-800
        text-gray-700 dark:text-gray-200
        transition-all duration-300
        ${isCollapsed ? 'w-16' : 'w-64'}
        h-screen 
        fixed left-0 top-0 z-50
        border-r border-gray-200 dark:border-gray-700
        flex flex-col
      `}
    >
      {/* --- Header --- */}
      <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        {!isCollapsed && (
          // *** CORRECCIÓN: Cambiar color del título ***
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">PeruFashions</h1>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-700 dark:text-gray-200"
        >
          {isCollapsed ? (
            <LucideIcons.ChevronRight size={20} />
          ) : (
            <LucideIcons.ChevronLeft size={20} />
          )}
        </button>
      </div>

      {/* --- Navegación con scroll --- */}
      {/* Asegúrate que flex-grow funcione correctamente */}
      <nav className="flex-grow overflow-y-auto overflow-x-hidden py-2">
        {menuItems.map((item) => {
          const itemIdentifier = getItemIdentifier(item);
          const isItemActive = isActive(item.ruta);
          const hasChildren = item.children && item.children.length > 0;
          const isDisabled = !item.es_activo && (!hasChildren || isCollapsed);

          return (
            <div key={item.menu_id} className="px-2"> {/* Añadir padding horizontal aquí */}
              <Popover
                isOpen={isCollapsed && popoverOpen === itemIdentifier}
                positions={['right']}
                content={
                  <PopoverContent
                    item={item}
                    nestedPopover={nestedPopover}
                    setNestedPopover={setNestedPopover}
                    handleNavigate={handleNavigate}
                    currentPath={location.pathname}
                    getItemIdentifier={getItemIdentifier}
                  />
                }
                onClickOutside={() => {
                  setPopoverOpen(null);
                  setNestedPopover(null);
                }}
              >
                <button
                  className={`
                    flex items-center w-full rounded px-2 py-2 text-left transition-colors text-sm /* Ajustar padding/tamaño */
                    ${isItemActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'} /* Colores explícitos */
                    ${!item.es_activo ? 'opacity-50' : ''}
                    ${isDisabled ? 'cursor-not-allowed' : ''}
                  `}
                  onClick={() => handleMenuClick(item)}
                  disabled={isDisabled}
                >
                  {getIcon(item.icono)}
                  {!isCollapsed && (
                    <>
                      <span className="ml-2 flex-1">{item.nombre}</span> {/* Ajustar margen */}
                      {hasChildren && (
                        <span className="ml-auto">
                          {expandedItems.includes(itemIdentifier) ? (
                            <LucideIcons.ChevronDown className="w-4 h-4" />
                          ) : (
                            <LucideIcons.ChevronRight className="w-4 h-4" />
                          )}
                        </span>
                      )}
                    </>
                  )}
                </button>
              </Popover>

              {/* --- Submenú Desplegado --- */}
              {!isCollapsed && hasChildren && expandedItems.includes(itemIdentifier) && (
                <div className="pl-4 border-l border-gray-200 dark:border-gray-700 ml-4 mt-1 space-y-1"> {/* Añadir espacio y borde */}
                  {item.children.map((subItem) => {
                    const subItemIdentifier = getItemIdentifier(subItem);
                    const isSubItemActive = isActive(subItem.ruta);
                    const hasSubChildren = subItem.children && subItem.children.length > 0;
                    const isSubDisabled = !subItem.es_activo && !hasSubChildren;

                    return (
                      <div key={subItem.menu_id}>
                        <button
                          className={`
                            flex items-center w-full rounded px-2 py-1.5 text-left transition-colors text-xs /* Ajustar padding/tamaño */
                            ${isSubItemActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'} /* Colores explícitos */
                            ${!subItem.es_activo ? 'opacity-50' : ''}
                            ${isSubDisabled ? 'cursor-not-allowed' : ''}
                          `}
                          onClick={() => handleMenuClick(subItem)}
                          disabled={isSubDisabled}
                        >
                          {getIcon(subItem.icono)}
                          <span className="ml-2 flex-1">{subItem.nombre}</span> {/* Ajustar margen */}
                          {hasSubChildren && (
                            <span className="ml-auto">
                              {expandedItems.includes(subItemIdentifier) ? (
                                <LucideIcons.ChevronDown className="w-4 h-4" />
                              ) : (
                                <LucideIcons.ChevronRight className="w-4 h-4" />
                              )}
                            </span>
                          )}
                        </button>

                        {/* --- Submenú Anidado --- */}
                        {hasSubChildren && expandedItems.includes(subItemIdentifier) && (
                          <div className="pl-4 border-l border-gray-200 dark:border-gray-700 ml-4 mt-1 space-y-1"> {/* Añadir espacio y borde */}
                            {subItem.children.map((nestedItem) => {
                              const isNestedActive = isActive(nestedItem.ruta);
                              const canNestedNavigate = nestedItem.ruta && nestedItem.es_activo;

                              return (
                                <button
                                  key={nestedItem.menu_id}
                                  className={`
                                    flex items-center w-full rounded px-2 py-1.5 text-left transition-colors text-xs /* Ajustar padding/tamaño */
                                    ${isNestedActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'} /* Colores explícitos */
                                    ${!nestedItem.es_activo ? 'opacity-50 cursor-not-allowed' : ''}
                                  `}
                                  onClick={() => { if (canNestedNavigate) handleNavigate(nestedItem.ruta as string) }}
                                  disabled={!canNestedNavigate}
                                >
                                  {getIcon(nestedItem.icono)}
                                  <span className="ml-2">{nestedItem.nombre}</span> {/* Ajustar margen */}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* --- Footer --- */}
      {/* *** CORRECCIÓN: Quitar absolute, quitar bg-*, asegurar que sea el último hijo de flex-col *** */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <button
          onClick={toggleDarkMode}
          className={`
            flex items-center justify-center p-2 rounded-lg w-full
            transition-colors duration-200
            hover:bg-gray-100 dark:hover:bg-gray-700
            text-gray-700 dark:text-gray-200
          `}
        >
          {isDarkMode ? (
            <LucideIcons.Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <LucideIcons.Moon className="w-5 h-5" />
          )}
           {!isCollapsed && (
            <span className="ml-2 text-sm"> {/* Tamaño texto */}
              {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;