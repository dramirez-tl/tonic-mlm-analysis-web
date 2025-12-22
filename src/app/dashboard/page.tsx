'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, FileText, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  available: boolean;
}

const modules: Module[] = [
  {
    id: 'compensaciones',
    title: 'Análisis de Compensaciones MLM',
    description: 'Visualiza y analiza las comisiones, generaciones y estructura de red de cualquier distribuidor.',
    icon: <BarChart3 className="h-12 w-12" />,
    href: '/dashboard/compensaciones',
    available: true,
  },
  {
    id: 'reporteria',
    title: 'Reportería Específica',
    description: 'Genera reportes personalizados y específicos para análisis detallado.',
    icon: <FileText className="h-12 w-12" />,
    href: '/dashboard/reporteria',
    available: true,
  },
];

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header showLogout />

      <main className="flex-1">
        {/* Welcome Section */}
        <section className="bg-gradient-to-b from-primary to-[#002a5c] text-white py-12">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl font-bold mb-2">
                Bienvenido, {user.email?.split('@')[0] || 'Usuario'}
              </h1>
              <p className="text-blue-100">
                Selecciona un módulo para comenzar
              </p>
            </div>
          </div>
        </section>

        {/* Modules Section */}
        <section className="py-12">
          <div className="container px-4">
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {modules.map((module) => (
                <Card
                  key={module.id}
                  className={`relative overflow-hidden transition-all duration-200 ${
                    module.available
                      ? 'hover:shadow-lg hover:border-secondary cursor-pointer'
                      : 'opacity-60'
                  }`}
                >
                  {module.available ? (
                    <Link href={module.href} className="block">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="text-secondary">
                            {module.icon}
                          </div>
                          <ChevronRight className="h-6 w-6 text-gray-400" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardTitle className="text-xl mb-2">{module.title}</CardTitle>
                        <CardDescription className="text-gray-600">
                          {module.description}
                        </CardDescription>
                      </CardContent>
                    </Link>
                  ) : (
                    <>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="text-gray-400">
                            {module.icon}
                          </div>
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                            Próximamente
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardTitle className="text-xl mb-2 text-gray-500">{module.title}</CardTitle>
                        <CardDescription className="text-gray-400">
                          {module.description}
                        </CardDescription>
                      </CardContent>
                    </>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
