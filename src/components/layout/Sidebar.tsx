import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import {
  Users,
  ClipboardList,
  Scissors,
  Factory,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Calendar,
  Sun,
  Moon
} from 'lucide-react';
import { Popover } from 'react-tiny-popover';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

interface MenuItem {
  name: string;
  icon: React.FC<any>;
  path: string;
  subItems?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    name: 'Recursos Humanos',
    icon: Users,
    path: '/recursos-humanos',
    subItems: [
      { name: 'Asistencia', icon: Clock, path: '/recursos-humanos/asistencia' },
      { name: 'Vacaciones', icon: Calendar, path: '/recursos-humanos/vacaciones' }
    ]
  },
  {
    name: 'Planeamiento',
    icon: ClipboardList,
    path: '/planeamiento',
    subItems: [
      { name: 'Ontime', icon: Clock, path: '/planeamiento/ontime' },
      { name: 'Despacho', icon: Clock, path: '/planeamiento/despacho' },
      { name: 'LeadTime', icon: Clock, path: '/planeamiento/leadtime' }
    ]
  },
  { name: 'Textil', icon: Scissors, path: '/textil' },
  {
    name: 'Manufactura',
    icon: Factory,
    path: '/manufactura',
    subItems: [
      { name: 'Corte', icon: Scissors, path: '/manufactura/corte' },
      {
        name: 'Costura',
        icon: Scissors,
        path: '/manufactura/costura',
        subItems: [
          { name: 'Eficiencia', icon: Clock, path: '/manufactura/costura/eficiencia' }
        ]
      },
      { name: 'Acabado', icon: Scissors, path: '/manufactura/acabado' }
    ]
  },
  { name: 'Administración', icon: Settings, path: '/administracion' },
];

const PopoverContent = ({ 
  item, 
  nestedPopover, 
  setNestedPopover, 
  handleNavigate,
  currentPath 
}: { 
  item: MenuItem;
  nestedPopover: string | null;
  setNestedPopover: (path: string | null) => void;
  handleNavigate: (path: string) => void;
  currentPath: string;
}) => {
  const isActive = (path: string) => currentPath.startsWith(path);

  return (
    <div className="bg-white dark:bg-gray-800 text-gray-700 dark:text-white rounded-lg shadow-lg min-w-[200px] ml-1 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-medium">
        {item.name}
      </div>
      <div className="py-1">
        {item.subItems?.map((subItem) => (
          <div key={subItem.path}>
            {subItem.subItems ? (
              <Popover
                isOpen={nestedPopover === subItem.path}
                positions={['right']}
                content={
                  <div className="bg-white dark:bg-gray-800 text-gray-700 dark:text-white rounded-lg shadow-lg min-w-[200px]">
                    {subItem.subItems.map((nestedItem) => (
                      <button
                        key={nestedItem.path}
                        className={`flex items-center w-full px-4 py-2 text-left transition-colors
                          ${isActive(nestedItem.path)
                            ? 'bg-secondary text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        onClick={() => handleNavigate(nestedItem.path)}
                      >
                        <nestedItem.icon className="w-4 h-4 min-w-[16px]" />
                        <span className="ml-4">{nestedItem.name}</span>
                      </button>
                    ))}
                  </div>
                }
                onClickOutside={() => setNestedPopover(null)}
              >
                <button
                  className={`flex items-center w-full px-4 py-2 text-left transition-colors
                    ${isActive(subItem.path)
                      ? 'bg-secondary text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setNestedPopover(nestedPopover === subItem.path ? null : subItem.path);
                  }}
                >
                  <subItem.icon className="w-4 h-4 min-w-[16px]" />
                  <span className="ml-4 flex-1">{subItem.name}</span>
                  <ChevronRight size={16} className="ml-2" />
                </button>
              </Popover>
            ) : (
              <button
                className={`flex items-center w-full px-4 py-2 text-left transition-colors
                  ${isActive(subItem.path)
                    ? 'bg-secondary text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                onClick={() => handleNavigate(subItem.path)}
              >
                <subItem.icon className="w-4 h-4 min-w-[16px]" />
                <span className="ml-4">{subItem.name}</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [popoverOpen, setPopoverOpen] = useState<string | null>(null);
  const [nestedPopover, setNestedPopover] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleMenuClick = (item: MenuItem) => {
    if (isCollapsed) {
      if (item.subItems) {
        setPopoverOpen(popoverOpen === item.name ? null : item.name);
        setNestedPopover(null);
      } else {
        navigate(item.path);
        setPopoverOpen(null);
        setNestedPopover(null);
      }
    } else {
      if (item.subItems) {
        setExpandedItems(prev =>
          prev.includes(item.name) ? prev.filter(name => name !== item.name) : [...prev, item.name]
        );
      } else {
        navigate(item.path);
      }
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setPopoverOpen(null);
    setNestedPopover(null);
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 text-gray-700 dark:text-white transition-all duration-300
        ${isCollapsed ? 'w-16' : 'w-64'}
        min-h-screen fixed left-0 top-0 z-50 border-r border-gray-200 dark:border-gray-700`}
    >
      <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-secondary">PeruFashions</h1>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="mt-2">
        {menuItems.map((item) => (
          <div key={item.path}>
            <Popover
              isOpen={popoverOpen === item.name}
              positions={['right']}
              content={
                <PopoverContent 
                  item={item}
                  nestedPopover={nestedPopover}
                  setNestedPopover={setNestedPopover}
                  handleNavigate={handleNavigate}
                  currentPath={location.pathname}
                />
              }
              onClickOutside={() => {
                setPopoverOpen(null);
                setNestedPopover(null);
              }}
            >
              <button
                className={`flex items-center px-4 py-3 w-full text-left transition-colors
                  ${isActive(item.path)
                    ? 'bg-secondary text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                onClick={() => handleMenuClick(item)}
              >
                <item.icon className={`w-5 h-5 min-w-[20px] ${
                  isActive(item.path) ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                }`} />
                {!isCollapsed && (
                  <>
                    <span className="ml-4 flex-1">{item.name}</span>
                    {item.subItems && (
                      <span className="ml-auto">
                        {expandedItems.includes(item.name) ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </span>
                    )}
                  </>
                )}
              </button>
            </Popover>

            {!isCollapsed && item.subItems && expandedItems.includes(item.name) && (
              <div className="pl-4">
                {item.subItems.map((subItem) => (
                  <div key={subItem.path}>
                    <button
                      className={`flex items-center w-full px-4 py-2 text-left transition-colors
                        ${isActive(subItem.path)
                          ? 'bg-secondary text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      onClick={() => {
                        if (subItem.subItems) {
                          setExpandedItems(prev =>
                            prev.includes(subItem.name)
                              ? prev.filter(name => name !== subItem.name)
                              : [...prev, subItem.name]
                          );
                        } else {
                          navigate(subItem.path);
                        }
                      }}
                    >
                      <subItem.icon className={`w-4 h-4 min-w-[16px] ${
                        isActive(subItem.path) ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                      }`} />
                      <span className="ml-4 flex-1">{subItem.name}</span>
                      {subItem.subItems && (
                        <span className="ml-auto">
                          {expandedItems.includes(subItem.name) ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </span>
                      )}
                    </button>

                    {subItem.subItems && expandedItems.includes(subItem.name) && (
                      <div className="pl-4">
                        {subItem.subItems.map((nestedItem) => (
                          <button
                            key={nestedItem.path}
                            className={`flex items-center w-full px-4 py-2 text-left transition-colors
                              ${isActive(nestedItem.path)
                                ? 'bg-secondary text-white'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            onClick={() => navigate(nestedItem.path)}
                          >
                            <nestedItem.icon className={`w-4 h-4 min-w-[16px] ${
                              isActive(nestedItem.path) ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                            }`} />
                            <span className="ml-4">{nestedItem.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center px-4">
        <button
          onClick={toggleDarkMode}
          className={`flex items-center justify-center p-2 rounded-lg transition-colors
            ${isCollapsed ? 'w-10 h-10' : 'w-full'}
            hover:bg-gray-100 dark:hover:bg-gray-700`}
          aria-label="Toggle theme"
        >
          {!isCollapsed && (
            <span className="mr-2 text-sm">
              {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
            </span>
          )}
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
