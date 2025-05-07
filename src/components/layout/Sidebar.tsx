// src/components/layout/Sidebar.tsx (CORREGIDO CON TIPOS Y PROPS)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Popover } from 'react-tiny-popover';
import * as LucideIcons from 'lucide-react';
// --- CORRECCIÓN DE TIPOS ---
// Usar los tipos específicos para el Sidebar como en menu.service.ts
import type { SidebarMenuItem, SidebarProps } from '../../types/menu.types';
// --------------------------
import { menuService } from '../../services/menu.service';

// --- Interfaz PopoverContentProps (Usar SidebarMenuItem) ---
interface PopoverContentProps {
  item: SidebarMenuItem; // <-- Usar SidebarMenuItem
  nestedPopover: string | null;
  setNestedPopover: (identifier: string | null) => void;
  handleNavigate: (path: string) => void;
  currentPath: string;
  getItemIdentifier: (item: SidebarMenuItem) => string; // <-- Usar SidebarMenuItem
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

// --- Componente PopoverContent (CORREGIDO: Desestructurar props y tipar subItem) ---
const PopoverContent: React.FC<PopoverContentProps> = ({
  item, // <-- Props ahora disponibles
  nestedPopover,
  setNestedPopover,
  handleNavigate,
  currentPath,
  getItemIdentifier
}) => {
  const isActive = useCallback((path: string | null | undefined) => !!path && currentPath.startsWith(path), [currentPath]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg min-w-[200px] py-1 ml-1 border border-gray-200 dark:border-gray-700">
      {/* --- CORRECCIÓN: Tipar subItem --- */}
      {item.children?.map((subItem: SidebarMenuItem) => { // <-- Tipar subItem
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
                  // Pasar props correctamente al Popover anidado
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
                    ${isSubItemActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
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
                  ${isSubItemActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
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


// --- Interfaz para Datos Agrupados (Usar SidebarMenuItem) ---
interface GroupedMenuItems {
  [areaName: string]: SidebarMenuItem[]; // <-- Usar SidebarMenuItem
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
  // --- CORRECCIÓN DE TIPOS ---
  const [menuItems, setMenuItems] = useState<SidebarMenuItem[]>([]); // <-- Usar SidebarMenuItem
  // --------------------------
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [popoverOpen, setPopoverOpen] = useState<string | null>(null);
  const [nestedPopover, setNestedPopover] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useTheme();

  // --- CORRECCIÓN DE TIPOS ---
  const getItemIdentifier = useCallback((menuItem: SidebarMenuItem): string => { // <-- Usar SidebarMenuItem
    return menuItem.ruta ?? `menu-${menuItem.menu_id}`;
  }, []);
  // --------------------------

  const isActive = useCallback((path: string | null | undefined) => !!path && location.pathname.startsWith(path), [location.pathname]);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    try {
      const responseItems = await menuService.getSidebarMenu();
      setMenuItems(responseItems || []);
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

  // --- Agrupación (Usar SidebarMenuItem) ---
  const groupedMenuItems = useMemo(() => {
    const groups: GroupedMenuItems = {};
    // --- CORRECCIÓN DE TIPOS ---
    menuItems.forEach((item: SidebarMenuItem) => { // <-- Usar SidebarMenuItem
    // --------------------------
      const areaName = item.area_nombre || 'General';
      if (!groups[areaName]) {
        groups[areaName] = [];
      }
      groups[areaName].push(item);
    });
    const sortedGroups: GroupedMenuItems = {};
    if (groups['General']) {
        sortedGroups['General'] = groups['General'];
        delete groups['General'];
    }
    Object.keys(groups).sort().forEach(areaName => {
        sortedGroups[areaName] = groups[areaName];
    });
    return sortedGroups;
  }, [menuItems]);

  // --- CORRECCIÓN DE TIPOS ---
  const handleMenuClick = (item: SidebarMenuItem) => { // <-- Usar SidebarMenuItem
  // --------------------------
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
     return (
      <aside className={`flex flex-col h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
         <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
           <LucideIcons.Loader className="w-6 h-6 animate-spin text-blue-600" />
         </div>
      </aside>
    );
  }

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200
        transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}
        h-screen fixed left-0 top-0 z-50 border-r border-gray-200 dark:border-gray-700
        flex flex-col
      `}
    >
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">PeruFashions</h1>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-700 dark:text-gray-200"
        >
          {isCollapsed ? <LucideIcons.ChevronRight size={20} /> : <LucideIcons.ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-grow overflow-y-auto overflow-x-hidden py-2">
        {Object.entries(groupedMenuItems).map(([areaName, itemsInArea]) => (
          <div key={areaName} className="mb-3">
            {!isCollapsed && (
              <h2 className="px-4 pt-2 pb-1 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                {areaName}
              </h2>
            )}

            {/* --- CORRECCIÓN DE TIPOS --- */}
            {itemsInArea.map((item: SidebarMenuItem) => { // <-- Usar SidebarMenuItem
            // --------------------------
              const itemIdentifier = getItemIdentifier(item);
              const isItemActive = isActive(item.ruta);
              const hasChildren = item.children && item.children.length > 0;
              const isDisabled = !item.es_activo && (!hasChildren || isCollapsed);

              return (
                <div key={item.menu_id} className="px-2">
                  <Popover
                    isOpen={isCollapsed && popoverOpen === itemIdentifier}
                    positions={['right']}
                    content={
                      // Pasar props correctamente
                      <PopoverContent
                        item={item}
                        nestedPopover={nestedPopover}
                        setNestedPopover={setNestedPopover}
                        handleNavigate={handleNavigate}
                        currentPath={location.pathname}
                        getItemIdentifier={getItemIdentifier}
                      />
                    }
                    onClickOutside={() => { setPopoverOpen(null); setNestedPopover(null); }}
                  >
                    <button
                      className={`
                        flex items-center w-full rounded px-2 py-2 text-left transition-colors text-sm
                        ${isItemActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'}
                        ${!item.es_activo ? 'opacity-50' : ''} ${isDisabled ? 'cursor-not-allowed' : ''}
                        ${isCollapsed ? 'justify-center' : ''}
                      `}
                      onClick={() => handleMenuClick(item)}
                      disabled={isDisabled}
                      title={isCollapsed ? item.nombre : ''}
                    >
                      {getIcon(item.icono)}
                      {!isCollapsed && (
                        <>
                          <span className="ml-2 flex-1">{item.nombre}</span>
                          {hasChildren && (
                            <span className="ml-auto">
                              {expandedItems.includes(itemIdentifier) ? <LucideIcons.ChevronDown className="w-4 h-4" /> : <LucideIcons.ChevronRight className="w-4 h-4" />}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  </Popover>

                  {/* Submenú Desplegado */}
                  {!isCollapsed && hasChildren && expandedItems.includes(itemIdentifier) && (
                    <div className="pl-4 border-l border-gray-200 dark:border-gray-700 ml-4 mt-1 space-y-1">
                      {/* --- CORRECCIÓN DE TIPOS --- */}
                      {item.children.map((subItem: SidebarMenuItem) => { // <-- Usar SidebarMenuItem
                      // --------------------------
                        const subItemIdentifier = getItemIdentifier(subItem);
                        const isSubItemActive = isActive(subItem.ruta);
                        const hasSubChildren = subItem.children && subItem.children.length > 0;
                        const isSubDisabled = !subItem.es_activo && !hasSubChildren;

                        return (
                          <div key={subItem.menu_id}>
                            <button
                              className={`
                                flex items-center w-full rounded px-2 py-1.5 text-left transition-colors text-xs
                                ${isSubItemActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}
                                ${!subItem.es_activo ? 'opacity-50' : ''} ${isSubDisabled ? 'cursor-not-allowed' : ''}
                              `}
                              onClick={() => handleMenuClick(subItem)}
                              disabled={isSubDisabled}
                            >
                              {getIcon(subItem.icono)}
                              <span className="ml-2 flex-1">{subItem.nombre}</span>
                              {hasSubChildren && (
                                <span className="ml-auto">
                                  {expandedItems.includes(subItemIdentifier) ? <LucideIcons.ChevronDown className="w-4 h-4" /> : <LucideIcons.ChevronRight className="w-4 h-4" />}
                                </span>
                              )}
                            </button>

                            {/* Submenú Anidado */}
                            {hasSubChildren && expandedItems.includes(subItemIdentifier) && (
                              <div className="pl-4 border-l border-gray-200 dark:border-gray-700 ml-4 mt-1 space-y-1">
                                {/* --- CORRECCIÓN DE TIPOS --- */}
                                {subItem.children.map((nestedItem: SidebarMenuItem) => { // <-- Usar SidebarMenuItem
                                // --------------------------
                                  const isNestedActive = isActive(nestedItem.ruta);
                                  const canNestedNavigate = nestedItem.ruta && nestedItem.es_activo;

                                  return (
                                    <button
                                      key={nestedItem.menu_id}
                                      className={`
                                        flex items-center w-full rounded px-2 py-1.5 text-left transition-colors text-xs
                                        ${isNestedActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}
                                        ${!nestedItem.es_activo ? 'opacity-50 cursor-not-allowed' : ''}
                                      `}
                                      onClick={() => { if (canNestedNavigate) handleNavigate(nestedItem.ruta as string) }}
                                      disabled={!canNestedNavigate}
                                    >
                                      {getIcon(nestedItem.icono)}
                                      <span className="ml-2">{nestedItem.nombre}</span>
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
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <button
          onClick={toggleDarkMode}
          className={`
            flex items-center justify-center p-2 rounded-lg w-full transition-colors duration-200
            hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          {isDarkMode ? <LucideIcons.Sun className="w-5 h-5 text-yellow-500" /> : <LucideIcons.Moon className="w-5 h-5" />}
           {!isCollapsed && (
            <span className="ml-2 text-sm">
              {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;