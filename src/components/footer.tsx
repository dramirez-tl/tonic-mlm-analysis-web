export function Footer() {
  return (
    <footer className="border-t bg-white py-6">
      <div className="container px-4 text-center text-sm text-gray-500">
        <p>Tonic MLM Analysis - Sistema de Análisis de Compensaciones</p>
        <p className="mt-1">© {new Date().getFullYear()} - Herramienta de análisis interno</p>
      </div>
    </footer>
  );
}
