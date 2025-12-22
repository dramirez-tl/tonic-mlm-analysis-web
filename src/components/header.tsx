'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { BarChart3, Home, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  showLogout?: boolean;
}

export function Header({ showLogout = false }: HeaderProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const homeLink = showLogout ? '/dashboard' : '/';

  // Obtener nombre del usuario desde el email
  const displayName = user?.email?.split('@')[0] || 'Usuario';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center px-4">
        <Link href={homeLink} className="flex items-center gap-2 font-bold text-lg">
          <BarChart3 className="h-6 w-6 text-primary" />
          <span className="text-primary">Tonic MLM Analysis</span>
        </Link>

        <nav className="ml-8 flex items-center gap-6">
          {showLogout ? (
            <Link
              href="/dashboard"
              className={cn(
                'flex items-center gap-2 text-sm font-medium transition-colors hover:text-secondary',
                pathname === '/dashboard' ? 'text-secondary' : 'text-gray-600'
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          ) : (
            <Link
              href="/"
              className={cn(
                'flex items-center gap-2 text-sm font-medium transition-colors hover:text-secondary',
                pathname === '/' ? 'text-secondary' : 'text-gray-600'
              )}
            >
              <Home className="h-4 w-4" />
              Inicio
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          {showLogout && user ? (
            <>
              <span className="text-sm text-gray-500">
                {displayName}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="gap-2 text-gray-600 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </Button>
            </>
          ) : (
            <span className="text-sm text-gray-500">
              Sistema de Análisis de Compensaciones
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
