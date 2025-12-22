import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Tipo para información de moneda
export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

// Configuración de monedas por código
const CURRENCY_CONFIG: Record<string, { locale: string; label: string }> = {
  MXN: { locale: 'es-MX', label: 'MXN' },
  USD: { locale: 'en-US', label: 'USD' },
  COP: { locale: 'es-CO', label: 'COP' },
  GTQ: { locale: 'es-GT', label: 'GTQ' },
};

// Función para formatear moneda con código específico
export function formatCurrencyWithCode(value: number, currencyCode: string = 'MXN'): string {
  const config = CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG['MXN'];
  const formatted = new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  // Para MXN y USD agregar el código para distinguir
  if (currencyCode === 'MXN') {
    return formatted.replace('$', '$') + ' MXN';
  }
  if (currencyCode === 'USD') {
    return formatted + ' USD';
  }
  return formatted;
}

// Función legacy que usa MXN por defecto (para compatibilidad)
export function formatCurrency(value: number): string {
  return formatCurrencyWithCode(value, 'MXN');
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-MX').format(value);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Generation colors for charts and badges
export const GENERATION_COLORS: Record<number, string> = {
  0: '#22c55e', // G0 - green
  1: '#3b82f6', // G1 - blue
  2: '#8b5cf6', // G2 - purple
  3: '#f59e0b', // G3 - amber
  4: '#ef4444', // G4 - red
};

export const GENERATION_PERCENTAGES: Record<number, number> = {
  0: 4,
  1: 5,
  2: 5,
  3: 2,
  4: 2,
};

export const GENERATION_NAMES: Record<number, string> = {
  0: 'G0 (4%)',
  1: 'G1 (5%)',
  2: 'G2 (5%)',
  3: 'G3 (2%)',
  4: 'G4 (2%)',
};
