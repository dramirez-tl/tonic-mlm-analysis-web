'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { CurrencyInfo, formatCurrencyWithCode } from '@/lib/utils';

interface CurrencyContextValue {
  currency: CurrencyInfo;
  formatCurrency: (value: number) => string;
}

const defaultCurrency: CurrencyInfo = {
  code: 'MXN',
  symbol: '$',
  name: 'Peso Mexicano',
};

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: defaultCurrency,
  formatCurrency: (value: number) => formatCurrencyWithCode(value, 'MXN'),
});

interface CurrencyProviderProps {
  children: ReactNode;
  currency?: CurrencyInfo;
}

export function CurrencyProvider({ children, currency = defaultCurrency }: CurrencyProviderProps) {
  const formatCurrency = (value: number) => formatCurrencyWithCode(value, currency.code);

  return (
    <CurrencyContext.Provider value={{ currency, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

export { CurrencyContext };
