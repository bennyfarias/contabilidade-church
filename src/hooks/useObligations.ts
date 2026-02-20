import { useMemo } from 'react';
import { Transaction } from '../types';

export const useObligations = (transactions: Transaction[]) => {
  return useMemo(() => {
    // Regra: 4% Presbitério, 10% Sínodo sobre Dízimos e Ofertas
    const baseCalculo = transactions
      .filter(t => t.tipo === 'revenue' && (t.descricao.includes('Dízimo') || t.descricao === 'Oferta'))
      .reduce((sum, t) => sum + t.valor, 0);

    return {
      presbiterio: baseCalculo * 0.04,
      sinodo: baseCalculo * 0.10,
      totalBase: baseCalculo
    };
  }, [transactions]);
};