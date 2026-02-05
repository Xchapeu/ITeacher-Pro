import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Menu, X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const DashboardLayout = ({ children, navItems, onLogout }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-heading font-bold text-slate-900">ITeacher</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
            data-testid="mobile-menu-btn"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 lg:w-auto
          bg-white border-r border-slate-200 
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:col-span-2 p-4 lg:p-6 space-y-6 lg:space-y-8
          pt-16 lg:pt-6
          overflow-y-auto
        `}
      >
        {/* Logo - Hidden on mobile (shown in header) */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <BookOpen className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-heading font-bold text-slate-900">ITeacher</span>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 lg:space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              data-testid={item.testId}
              onClick={() => setSidebarOpen(false)}
            >
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 text-sm lg:text-base ${
                  location.pathname === item.path
                    ? 'bg-sky-50 text-primary'
                    : 'text-slate-600 hover:text-primary hover:bg-sky-50'
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Button>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="pt-6 lg:pt-8 border-t border-slate-200">
          <Button
            onClick={() => {
              setSidebarOpen(false);
              onLogout();
            }}
            variant="ghost"
            className="w-full justify-start gap-3 text-slate-600 hover:text-red-600 hover:bg-red-50"
            data-testid="logout-btn"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
