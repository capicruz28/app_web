// src/types/menu.types.ts

export interface MenuItem {
    MenuId: number;
    Name: string;
    Icon: string;
    Path: string;
    OrderIndex: number;
    Level: number;
    ParentId: number | null;
    children: MenuItem[];
  }
  
  export interface MenuResponse {
    data: MenuItem[];
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