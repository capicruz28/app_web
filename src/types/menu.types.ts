// src/types/menu.types.ts

export interface MenuItem {
    menu_id: number;
    nombre: string;
    icono: string;
    ruta: string;
    orden: number;
    level: number;
    es_activo: boolean;
    padre_menu_id: number | null;
    children: MenuItem[];
  }
  
  export interface MenuResponse {
    menu: MenuItem[];
  }
  
  // Tipos adicionales para el componente Sidebar
  export interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
  }
  
  export interface PopoverContentProps {
    item: MenuItem;
    nestedPopover: string | null;
    setNestedPopover: (path: string | null) => void;
    handleNavigate: (path: string) => void;
    currentPath: string;
  }