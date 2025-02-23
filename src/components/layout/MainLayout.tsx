import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
      />
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <Header />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;