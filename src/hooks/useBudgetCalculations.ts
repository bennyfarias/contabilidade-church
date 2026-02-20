import { useCallback } from 'react';
import { ChartOfAccount } from '../types';
import { MONTHS } from '../utils/constants';
import { BudgetData } from '../services/budgetService';

export const useBudgetCalculations = (
  budgetInput: BudgetData,
  allAccounts: ChartOfAccount[],
  filterType: 'revenue' | 'expense'
) => {

  // Helper to generate the composite key
  const generateItemKey = (categoryName: string, specName: string) => {
    const cleanCategory = categoryName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const cleanSpec = specName ? specName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : '';
    return cleanSpec ? `${cleanCategory}_${cleanSpec}` : cleanCategory;
  };

  // 1. Calculate total for a specific parent category in a specific month
  const calculateParentMonthlyTotal = useCallback((account: ChartOfAccount, month: string) => {
    const specs = account.specifications.length > 0 ? account.specifications : [''];
    
    return specs.reduce((sum, spec) => {
      const key = generateItemKey(account.name, spec);
      const val = budgetInput[key]?.[month.toLowerCase()] || 0;
      return sum + val;
    }, 0);
  }, [budgetInput]);

  // 2. Calculate annual total for a parent category
  const calculateParentAnnualTotal = useCallback((account: ChartOfAccount) => {
    return MONTHS.reduce((total, month) => {
      return total + calculateParentMonthlyTotal(account, month);
    }, 0);
  }, [calculateParentMonthlyTotal]);

  // 3. Calculate annual total for a specific item (row)
  const calculateItemAnnualTotal = useCallback((categoryName: string, specName: string) => {
    const key = generateItemKey(categoryName, specName);
    return MONTHS.reduce((sum, month) => {
      const val = budgetInput[key]?.[month.toLowerCase()] || 0;
      return sum + val;
    }, 0);
  }, [budgetInput]);

  // 4. Calculate total for a specific month column (filtered by type)
  const calculateColumnTotal = useCallback((month: string) => {
    return allAccounts
      .filter(acc => acc.type === filterType)
      .reduce((sum, acc) => sum + calculateParentMonthlyTotal(acc, month), 0);
  }, [allAccounts, filterType, calculateParentMonthlyTotal]);

  // 5. Grand Total (Bottom Right corner)
  const calculateGrandTotal = useCallback(() => {
    return allAccounts
      .filter(acc => acc.type === filterType)
      .reduce((sum, acc) => sum + calculateParentAnnualTotal(acc), 0);
  }, [allAccounts, filterType, calculateParentAnnualTotal]);

  return {
    generateItemKey,
    calculateParentMonthlyTotal,
    calculateParentAnnualTotal,
    calculateItemAnnualTotal,
    calculateColumnTotal,
    calculateGrandTotal
  };
};