'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CampamentoDetalleView } from '@/components/reports/campamento-detalle-view';
import { ArrowLeft, Trophy, User } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getCampamentoResumen } from '@/lib/api';

export default function CampamentoLiderDetallePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const liderId = Number(params.id);

  const { data: resumen, isLoading: loadingResumen } = useQuery({
    queryKey: ['campamentoResumen', liderId],
    queryFn: () => getCampamentoResumen(liderId),
    enabled: !!liderId && !authLoading && !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header showLogout />

      <main className="flex-1">
        {/* Header Section */}
        <section className="bg-gradient-to-b from-amber-600 to-amber-800 text-white py-8">
          <div className="container px-4">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-amber-100 text-sm mb-4">
              <Link href="/dashboard" className="hover:text-white transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <Link href="/dashboard/reporteria" className="hover:text-white transition-colors">
                Reporteria
              </Link>
              <span>/</span>
              <Link href="/dashboard/campamento" className="hover:text-white transition-colors">
                Campamento de Lideres
              </Link>
              <span>/</span>
              <span className="text-white font-medium">
                {loadingResumen ? 'Cargando...' : resumen?.full_name || `Lider #${liderId}`}
              </span>
            </nav>

            <Link
              href="/dashboard/campamento"
              className="inline-flex items-center gap-2 text-amber-100 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Ranking
            </Link>

            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-lg bg-white/10 flex items-center justify-center">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  {loadingResumen ? 'Cargando...' : resumen?.full_name || `Lider #${liderId}`}
                </h1>
                <p className="text-amber-100">
                  Detalle de puntos para el Campamento de Lideres 2026
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-8">
          <div className="container px-4">
            <CampamentoDetalleView liderId={liderId} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
