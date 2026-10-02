import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNavigation } from '@/components/layout/MobileNavigation';
import { Drawer } from '@/components/ui/Drawer';
import { NavigationItem } from '@/types';

export interface AppShellProps {
  navigationItems?: NavigationItem[];
  sidebarTitle?: string;
  sidebarFooter?: React.ReactNode;
  children: React.ReactNode;
  showMobileNav?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  navigationItems,
  sidebarTitle,
  sidebarFooter,
  children,
  showMobileNav = true,
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const hasSidebar = navigationItems && navigationItems.length > 0;

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      {/* Top Navbar */}
      <Navbar
        showSidebarToggle={hasSidebar}
        onToggleSidebar={() => setMobileDrawerOpen(true)}
      />

      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        {/* Desktop Sidebar */}
        {hasSidebar && (
          <div className="hidden md:block">
            <Sidebar
              title={sidebarTitle}
              items={navigationItems}
              footer={sidebarFooter}
            />
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {hasSidebar && (
          <Drawer
            isOpen={mobileDrawerOpen}
            onClose={() => setMobileDrawerOpen(false)}
            title={sidebarTitle || 'Menu'}
            position="left"
          >
            <Sidebar
              items={navigationItems}
              footer={sidebarFooter}
              className="w-full h-auto border-r-0 sticky-none"
            />
          </Drawer>
        )}

        {/* Main Content Area */}
        <main
          className={`flex-1 p-4 sm:p-6 lg:p-8 min-w-0 ${
            showMobileNav && hasSidebar ? 'pb-24 md:pb-8' : ''
          }`}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      {hasSidebar && showMobileNav && (
        <MobileNavigation items={navigationItems} />
      )}
    </div>
  );
};
