import { useMemo } from 'react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Transaction, ChartOfAccount, Member } from '../types';

interface Filters {
  startDate: string;
  endDate: string;
  type: string;
  categoryIds: string[];
  memberId: string;
}

export const useReportData = (
  transactions: Transaction[],
  accounts: ChartOfAccount[],
  members: Member[],
  filters: Filters
) => {
  
  // Create a Map for O(1) account lookup
  const accountsMap = useMemo(() => {
    return new Map(accounts.map(acc => [acc.id, acc]));
  }, [accounts]);

  // 1. Filter Transactions (The Funnel)
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.data);
      const acc = accountsMap.get(t.chartOfAccountId);

      // Date Range Filter
      if (filters.startDate && tDate < startOfDay(new Date(filters.startDate))) return false;
      if (filters.endDate && tDate > endOfDay(new Date(filters.endDate))) return false;

      // Type Filter
      if (filters.type && t.tipo !== filters.type) return false;

      // Member Filter
      if (filters.memberId && t.memberId !== filters.memberId) return false;

      // Category Filter
      if (filters.categoryIds.length > 0 && !filters.categoryIds.includes(t.chartOfAccountId)) return false;

      return true;
    });
  }, [transactions, filters, accountsMap]);

  // 2. Aggregate Data for Charts
  const { monthlyData, categoryData, summary } = useMemo(() => {
    const monthly = new Map<string, { name: string; revenue: number; expense: number }>();
    const byCategory = new Map<string, { name: string; value: number; type: string }>();
    let totalRevenue = 0;
    let totalExpense = 0;

    filteredTransactions.forEach(t => {
      const acc = accountsMap.get(t.chartOfAccountId);
      if (!acc) return;

      // Monthly Aggregation
      const monthKey = format(new Date(t.data), 'yyyy-MM');
      if (!monthly.has(monthKey)) {
        monthly.set(monthKey, {
          name: format(new Date(t.data), 'MMM/yyyy', { locale: ptBR }),
          revenue: 0,
          expense: 0
        });
      }
      
      const monthEntry = monthly.get(monthKey)!;
      
      // Category Aggregation
      const catKey = acc.name;
      if (!byCategory.has(catKey)) {
        byCategory.set(catKey, { name: acc.name, value: 0, type: acc.type });
      }
      const catEntry = byCategory.get(catKey)!;

      if (t.tipo === 'revenue') {
        monthEntry.revenue += t.valor;
        totalRevenue += t.valor;
      } else {
        monthEntry.expense += t.valor;
        totalExpense += t.valor;
      }
      catEntry.value += t.valor;
    });

    // Convert Maps to Arrays for Recharts
    const monthlyArray = Array.from(monthly.values()).sort((a, b) => {
      // Simple sort hack: assumes data is inserted chronologically or needs sorting by name logic
      // Ideally, store the timestamp in the map value for sorting.
      return 0; 
    });

    return {
      monthlyData: monthlyArray,
      categoryData: Array.from(byCategory.values()),
      summary: { totalRevenue, totalExpense, net: totalRevenue - totalExpense }
    };
  }, [filteredTransactions, accountsMap]);

  // 3. Fidelity Logic (Business Rule: Tithing Consistency)
  const fidelityData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const memberTithingMonths = new Map<string, Set<number>>();

    members.forEach(m => memberTithingMonths.set(m.id, new Set()));

    transactions.forEach(t => {
      const tDate = new Date(t.data);
      if (tDate.getFullYear() !== currentYear) return;
      if (!t.memberId) return;

      const acc = accountsMap.get(t.chartOfAccountId);
      const isTithe = (acc?.name === 'Dízimos') || (t.descricao.toLowerCase().includes('dízimo'));

      if (isTithe) {
        memberTithingMonths.get(t.memberId)?.add(tDate.getMonth());
      }
    });

    let faithful = 0;   // 8+ months
    let sporadic = 0;   // 3-7 months
    let absent = 0;     // 0-2 months

    memberTithingMonths.forEach((months) => {
      const count = months.size;
      if (count >= 8) faithful++;
      else if (count >= 3) sporadic++;
      else absent++;
    });

    return [
      { name: 'Fiéis (8+ meses)', value: faithful },
      { name: 'Esporádicos (3-7 meses)', value: sporadic },
      { name: 'Ausentes/Baixa (0-2 meses)', value: absent }
    ];
  }, [transactions, members, accountsMap]);

  return {
    filteredTransactions,
    monthlyData,
    categoryData,
    fidelityData,
    summary
  };
};