'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getPeriods } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, BarChart3, Users, TrendingUp, Layers, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CompensacionesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [distributorId, setDistributorId] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [error, setError] = useState('');

  const { data: periods, isLoading: loadingPeriods } = useQuery({
    queryKey: ['periods'],
    queryFn: getPeriods,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const id = parseInt(distributorId, 10);
    if (isNaN(id) || id <= 0) {
      setError('Por favor ingresa un ID de distribuidor válido');
      return;
    }

    if (!selectedPeriod) {
      setError('Por favor selecciona un período');
      return;
    }

    router.push(`/dashboard/compensaciones/distributor/${id}?period=${selectedPeriod}`);
  };

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
    <div className="min-h-screen flex flex-col">
      <Header showLogout />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary to-[#002a5c] text-white py-16">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center text-blue-100 hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Link>
              <BarChart3 className="h-16 w-16 mx-auto mb-6 opacity-90" />
              <h1 className="text-4xl font-bold mb-4">
                Análisis de Compensaciones MLM
              </h1>
              <p className="text-lg text-blue-100 mb-8">
                Visualiza y analiza las comisiones, generaciones y estructura de red de cualquier distribuidor de Tonic Life.
              </p>

              {/* Search Form */}
              <Card className="bg-white text-gray-900 max-w-xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Search className="h-5 w-5" />
                    Buscar Distribuidor
                  </CardTitle>
                  <CardDescription>
                    Ingresa el ID del distribuidor y selecciona el período a analizar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSearch} className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-1/2">
                        <Input
                          type="number"
                          placeholder="ID del distribuidor (ej: 31750)"
                          value={distributorId}
                          onChange={(e) => setDistributorId(e.target.value)}
                          className="text-lg h-12"
                        />
                      </div>
                      <div className="w-1/2">
                        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder={loadingPeriods ? "Cargando..." : "Selecciona período"} />
                          </SelectTrigger>
                          <SelectContent>
                            {periods?.map((period) => (
                              <SelectItem key={period.id_period} value={period.id_period.toString()}>
                                {period.name_period}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {error && (
                      <p className="text-red-500 text-sm">{error}</p>
                    )}
                    <Button type="submit" className="w-full h-12 text-lg bg-secondary hover:bg-secondary/90 text-white">
                      <Search className="mr-2 h-5 w-5" />
                      Analizar Distribuidor
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="container px-4">
            <h2 className="text-2xl font-bold text-center mb-12">
              ¿Qué puedes analizar?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <Card>
                <CardHeader>
                  <Layers className="h-10 w-10 text-secondary mb-2" />
                  <CardTitle className="text-lg">Generaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Analiza cómo se distribuyen las comisiones entre G0-G4 y sus porcentajes (4%, 5%, 5%, 2%, 2%).
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">Red Multinivel</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Visualiza la estructura de red y las comisiones por nivel (ML1, ML2, ML3).
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <TrendingUp className="h-10 w-10 text-accent mb-2" />
                  <CardTitle className="text-lg">Roll-Over</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Analiza el impacto del roll-over en la calificación y volumen de grupo.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <BarChart3 className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">Histórico</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Revisa la evolución de comisiones y tamaño de red a través del tiempo.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
