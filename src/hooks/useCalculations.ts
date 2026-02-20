import { useMemo } from 'react';
import { Transaction, ChartOfAccount } from '../types';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export const useCalculations = (
  transactions: Transaction[], 
  chartOfAccounts: ChartOfAccount[],
  selectedMonth: Date
) => {
  return useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    let totalRevenueMonth = 0;
    let totalExpenseMonth = 0;
    let cumulativeBalance = 0;
    let cashBalance = 0;
    let obligationBase = 0;

    const accountsMap = new Map(chartOfAccounts.map(acc => [acc.id, acc]));

    transactions.forEach(t => {
      const account = accountsMap.get(t.chartOfAccountId);
      if (!account) return;

      const isRevenue = account.type === 'revenue';
      
      // Tente converter data se vier como string ou timestamp
      const tData = t.data instanceof Date ? t.data : new Date(t.data); 
      
      const isWithinSelectedMonth = isWithinInterval(tData, { 
        start: monthStart, 
        end: monthEnd 
      });

      const val = Number(t.valor); // Garante que é número

      // Global
      if (isRevenue) cumulativeBalance += val;
      else cumulativeBalance -= val;

      // Cash
      if (account.name === 'Dinheiro (Especie)' && t.descricao === 'Dinheiro Especie') {
        isRevenue ? (cashBalance += val) : (cashBalance -= val);
      }

      // Monthly
      if (isWithinSelectedMonth) {
        if (isRevenue) {
          totalRevenueMonth += val;
          const includedSpecs = ['Dízimo Regular', 'Dízimo Esporádico', 'Oferta'];
          if (includedSpecs.includes(t.descricao)) {
            obligationBase += val;
          }
        } else {
          totalExpenseMonth += val;
        }
      }
    });

    const presbyteryFee = obligationBase * 0.04;
    const synodFee = obligationBase * 0.10;

    return {
      monthly: {
        revenue: totalRevenueMonth,
        expense: totalExpenseMonth,
        balance: totalRevenueMonth - totalExpenseMonth,
      },
      cumulativeBalance,
      cashBalance,
      obligations: {
        base: obligationBase,
        presbytery: presbyteryFee,
        synod: synodFee,
      }
    };
  }, [transactions, chartOfAccounts, selectedMonth]);
};