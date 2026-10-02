import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown } from '@/components/ui/Dropdown';
import { Menu, LogOut, Shield, Compass, Users } from 'lucide-react';

export interface NavbarProps {
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  showSidebarToggle = false,
}) => {
  const { user, isAuthenticated, logout, switchRole } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleLabels: Record<string, string> = {
    student: t('studentRole'),
    parent: t('parentRole'),
    admin: t('adminRole'),
  };

  const userDropdownItems = [
    {
      id: 'switch-student',
      label: 'Switch to Student View',
      icon: <Compass className="h-4 w-4" />,
      onClick: async () => {
        await switchRole('student');
        navigate('/student');
      },
    },
    {
      id: 'switch-parent',
      label: 'Switch to Parent View',
      icon: <Users className="h-4 w-4" />,
      onClick: async () => {
        await switchRole('parent');
        navigate('/parent');
      },
    },
    {
      id: 'switch-admin',
      label: 'Switch to Admin View',
      icon: <Shield className="h-4 w-4" />,
      onClick: async () => {
        await switchRole('admin');
        navigate('/admin');
      },
    },
    {
      id: 'logout',
      label: t('logout'),
      icon: <LogOut className="h-4 w-4" />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          {showSidebarToggle && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/[0.04] md:hidden transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center font-semibold text-xs tracking-wider group-hover:bg-accent-hover transition-colors">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm sm:text-base text-text-primary tracking-tight">
                  {t('appName')}
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/[0.05] text-text-secondary hidden sm:inline-block">
                  Govt. of India
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Family context badge for student/parent */}
          {user && (user.role === 'student' || user.role === 'parent') && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-border/40 text-xs text-text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>
                {user.role === 'student'
                  ? `Family: Sunita Sharma`
                  : `Child: Aarav Sharma`}
              </span>
            </div>
          )}

          {/* Language Selector */}
          <LanguageSelector />

          {/* User state */}
          {isAuthenticated && user ? (
            <Dropdown
              trigger={
                <div className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-white/[0.04] transition-colors">
                  <Avatar name={user.name} size="sm" />
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-medium text-text-primary leading-tight">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-text-muted capitalize">
                      {roleLabels[user.role] || user.role}
                    </div>
                  </div>
                </div>
              }
              items={userDropdownItems}
            />
          ) : (
            <Link to="/login">
              <Button size="sm" variant="primary">
                {t('login')}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
