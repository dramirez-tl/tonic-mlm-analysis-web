'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CampamentoRankingView } from '@/components/reports/campamento-ranking-view';
import { ArrowLeft, Trophy } from 'lucide-react';
import Link from 'next/link';

export default function CampamentoPage() {
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
              <span className="text-white font-medium">Campamento de Lideres</span>
            </nav>

            <Link
              href="/dashboard/reporteria"
              className="inline-flex items-center gap-2 text-amber-100 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Reporteria
            </Link>

            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-lg bg-white/10 flex items-center justify-center">
                <Trophy className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Campamento de Lideres 2026</h1>
                <p className="text-amber-100">Ranking y puntos viaje | Periodo: Marzo - Agosto 2025</p>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-8">
          <div className="container px-4">
            <CampamentoRankingView />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
