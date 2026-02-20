import { useMemo } from 'react';
import { Transaction, ChartOfAccount } from '../types';
import { startOfMonth, endOfMonth, startOfYear, isWithinInterval } from 'date-fns';

interface CashBookSummary {
  entradasMes: number;
  saidasMes: number;
  saldoMes: number;
  saldoAnoAnterior: number; 
  saldoMesAnterior: number; 
  saldoATransportar: number; 
  transactionsInMonth: Transaction[];
}

export const useCashBook = (
  transactions: Transaction[],
  accounts: ChartOfAccount[],
  selectedDate: Date
): CashBookSummary => {
  
  // Create Map for O(1) access
  const accountsMap = useMemo(() => {
    return new Map(accounts.map(acc => [acc.id, acc]));
  }, [accounts]);

  return useMemo(() => {
    // 1. Define Time Boundaries
    const firstDayOfYear = startOfYear(selectedDate);
    const firstDayOfMonth = startOfMonth(selectedDate);
    const lastDayOfMonth = endOfMonth(selectedDate);

    // 2. Initialize Counters
    let saldoAnoAnterior = 0;
    let saldoMesAnterior = 0; // Cumulative up to start of this month
    let entradasMes = 0;
    let saidasMes = 0;
    const transactionsInMonth: Transaction[] = [];

    // 3. Single Pass Loop (O(N)) - Performance Critical
    transactions.forEach(t => {
      // Ensure date is a Date object
      const tDate = t.data instanceof Date ? t.data : new Date(t.data);
      
      // Ignore future transactions relative to the report
      if (tDate > lastDayOfMonth) return;

      const acc = accountsMap.get(t.chartOfAccountId);
      if (!acc) return;

      const isRevenue = acc.type === 'revenue';
      const value = Number(t.valor); // Ensure number

      // Bucket 1: Previous Year Balance (Everything before Jan 1st of current selected year)
      if (tDate < firstDayOfYear) {
        if (isRevenue) saldoAnoAnterior += value;
        else saldoAnoAnterior -= value;
      }

      // Bucket 2: Previous Month Balance (Everything before current month start)
      if (tDate < firstDayOfMonth) {
        if (isRevenue) saldoMesAnterior += value;
        else saldoMesAnterior -= value;
      }

      // Bucket 3: Current Month Activity
      if (isWithinInterval(tDate, { start: firstDayOfMonth, end: lastDayOfMonth })) {
        if (isRevenue) entradasMes += value;
        else saidasMes += value;
        
        transactionsInMonth.push({
            ...t,
            data: tDate // Ensure the returned transaction has a Date object
        });
      }
    });

    // 4. Sort transactions by date for the report table
    transactionsInMonth.sort((a, b) => a.data.getTime() - b.data.getTime());

    return {
      entradasMes,
      saidasMes,
      saldoMes: entradasMes - saidasMes,
      saldoAnoAnterior,
      saldoMesAnterior,
      saldoATransportar: saldoMesAnterior + (entradasMes - saidasMes),
      transactionsInMonth
    };

  }, [transactions, accountsMap, selectedDate]);
};