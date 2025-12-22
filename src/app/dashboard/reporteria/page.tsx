'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { NewRanksReport } from '@/components/reports/new-ranks-report';
import { NewCustomersReport } from '@/components/reports/new-customers-report';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, TrendingUp, UserPlus, Trophy, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function ReporteriaPage() {
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
        <section className="bg-gradient-to-b from-primary to-[#002a5c] text-white py-8">
          <div className="container px-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Link>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Reporteria Especifica</h1>
                <p className="text-blue-100">Reportes y analisis avanzados</p>
              </div>
            </div>
          </div>
        </section>

        {/* Reports Section */}
        <section className="py-8">
          <div className="container px-4">
            {/* New Ranks Report */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                  Nuevos Rangos
                </CardTitle>
                <CardDescription>
                  Analisis de distribuidores que alcanzaron nuevos rangos por primera vez
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NewRanksReport />
              </CardContent>
            </Card>

            {/* New Customers Report */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-secondary" />
                  Clientes Nuevos
                </CardTitle>
                <CardDescription>
                  Registro de nuevos clientes por mes y tipo de kit de entrada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NewCustomersReport />
              </CardContent>
            </Card>

            {/* Campamento de Lideres Report - Link to dedicated page */}
            <Link href="/dashboard/campamento" className="block mb-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-amber-200 bg-gradient-to-br from-amber-50 to-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        Campamento de Lideres 2026
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Ranking y puntos viaje para el campamento de lideres. Periodo: Mar-Ago 2025
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-amber-600">
                      <span className="text-sm font-medium">Ver reporte completo</span>
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <p className="text-2xl font-bold text-amber-600">🇲🇽</p>
                      <p className="text-sm text-muted-foreground">Mexico - 50 cupos</p>
                      <p className="text-xs text-muted-foreground">Rango min: Oro</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <p className="text-2xl font-bold text-blue-600">🇺🇸</p>
                      <p className="text-sm text-muted-foreground">USA - 25 cupos</p>
                      <p className="text-xs text-muted-foreground">Rango min: Plata</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <p className="text-2xl font-bold text-green-600">📅</p>
                      <p className="text-sm text-muted-foreground">Periodo</p>
                      <p className="text-xs text-muted-foreground">Mar - Ago 2025</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
