// src/components/layout/Sidebar.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Popover } from 'react-tiny-popover';
import * as LucideIcons from 'lucide-react';
import { MenuItem, SidebarProps } from '../../types/menu.types';
import { menuService } from '../../services/menu.service';

interface PopoverContentProps {
  item: MenuItem;
  nestedPopover: string | null;
  setNestedPopover: (path: string | null) => void;
  handleNavigate: (path: string) => void;
  currentPath: string;
}

const PopoverContent: React.FC<PopoverContentProps> = ({
  item,
  nestedPopover,
  setNestedPopover,
  handleNavigate,
  currentPath
}) => {
  const isActive = (path: string) => currentPath.startsWith(path);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg min-w-[200px] py-1 ml-1">
      {item.children?.map((subItem) => (
        <div key={subItem.MenuId}>
          {subItem.children && subItem.children.length > 0 ? (
            <Popover
              isOpen={nestedPopover === subItem.Path}
              positions={['right']}
              content={
                <PopoverContent
                  item={subItem}
                  nestedPopover={nestedPopover}
                  setNestedPopover={setNestedPopover}
                  handleNavigate={handleNavigate}
                  currentPath={currentPath}
                />
              }
              onClickOutside={() => setNestedPopover(null)}
            >
              <button
                className={`flex items-center w-full px-4 py-2 text-left transition-colors
                  ${isActive(subItem.Path)
                    ? 'bg-secondary text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setNestedPopover(nestedPopover === subItem.Path ? null : subItem.Path);
                }}
              >
                {getIcon(subItem.Icon)}
                <span className="ml-3">{subItem.Name}</span>
                <LucideIcons.ChevronRight className="ml-auto w-4 h-4" />
              </button>
            </Popover>
          ) : (
            <button
              className={`flex items-center w-full px-4 py-2 text-left transition-colors
                ${isActive(subItem.Path)
                  ? 'bg-secondary text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              onClick={() => handleNavigate(subItem.Path)}
            >
              {getIcon(subItem.Icon)}
              <span className="ml-3">{subItem.Name}</span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

const getIcon = (iconName: string) => {
  const Icon = (LucideIcons as any)[iconName];
  return Icon ? <Icon className="w-5 h-5" /> : <LucideIcons.Circle className="w-5 h-5" />;
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

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const data = await menuService.getMenu();
      setMenuItems(data);
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleMenuClick = (item: MenuItem) => {
    if (isCollapsed) {
      if (item.children?.length > 0) {
        setPopoverOpen(popoverOpen === item.Path ? null : item.Path);
        setNestedPopover(null);
      } else {
        navigate(item.Path);
        setPopoverOpen(null);
        setNestedPopover(null);
      }
    } else {
      if (item.children?.length > 0) {
        setExpandedItems(prev =>
          prev.includes(item.Path)
            ? prev.filter(path => path !== item.Path)
            : [...prev, item.Path]
        );
      } else {
        navigate(item.Path);
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
      <div className="flex items-center justify-center h-screen">
        <LucideIcons.Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 
        text-gray-700 dark:text-white 
        transition-all duration-300
        ${isCollapsed ? 'w-16' : 'w-64'}
        min-h-screen fixed left-0 top-0 z-50 
        border-r border-gray-200 dark:border-gray-700
      `}
    >
      <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-primary">PeruFashions</h1>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          {isCollapsed ? (
            <LucideIcons.ChevronRight size={20} />
          ) : (
            <LucideIcons.ChevronLeft size={20} />
          )}
        </button>
      </div>

      <nav className="mt-2">
        {menuItems.map((item) => (
          <div key={item.MenuId}>
            <Popover
              isOpen={isCollapsed && popoverOpen === item.Path}
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
                className={`
                  flex items-center w-full px-4 py-2 text-left transition-colors
                  ${isActive(item.Path)
                    ? 'bg-secondary text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
                onClick={() => handleMenuClick(item)}
              >
                {getIcon(item.Icon)}
                {!isCollapsed && (
                  <>
                    <span className="ml-3 flex-1">{item.Name}</span>
                    {item.children?.length > 0 && (
                      <span className="ml-auto">
                        {expandedItems.includes(item.Path) ? (
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

            {!isCollapsed && item.children && expandedItems.includes(item.Path) && (
              <div className="pl-4 bg-gray-50 dark:bg-gray-800">
                {item.children.map((subItem) => (
                  <div key={subItem.MenuId}>
                    <button
                      className={`
                        flex items-center w-full px-4 py-2 text-left transition-colors
                        ${isActive(subItem.Path)
                          ? 'bg-secondary text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                      `}
                      onClick={() => handleMenuClick(subItem)}
                    >
                      {getIcon(subItem.Icon)}
                      <span className="ml-3 flex-1">{subItem.Name}</span>
                      {subItem.children?.length > 0 && (
                        <span className="ml-auto">
                          {expandedItems.includes(subItem.Path) ? (
                            <LucideIcons.ChevronDown className="w-4 h-4" />
                          ) : (
                            <LucideIcons.ChevronRight className="w-4 h-4" />
                          )}
                        </span>
                      )}
                    </button>

                    {subItem.children?.length > 0 && expandedItems.includes(subItem.Path) && (
                      <div className="pl-4">
                        {subItem.children.map((nestedItem) => (
                          <button
                            key={nestedItem.MenuId}
                            className={`
                              flex items-center w-full px-4 py-2 text-left transition-colors
                              ${isActive(nestedItem.Path)
                                ? 'bg-secondary text-white'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              }
                            `}
                            onClick={() => handleNavigate(nestedItem.Path)}
                          >
                            {getIcon(nestedItem.Icon)}
                            <span className="ml-3">{nestedItem.Name}</span>
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
          className={`
            flex items-center justify-center p-2 rounded-lg
            transition-colors duration-200
            ${isCollapsed ? 'w-10 h-10' : 'w-full'}
            hover:bg-gray-100 dark:hover:bg-gray-700
          `}
        >
          {!isCollapsed && (
            <span className="mr-2">
              {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
            </span>
          )}
          {isDarkMode ? (
            <LucideIcons.Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <LucideIcons.Moon className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;