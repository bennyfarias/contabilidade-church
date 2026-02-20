import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { format, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Wallet, AlertCircle, CheckCircle, Target } from 'lucide-react';

// Internal Architecture Imports
import { useFirebaseData } from '../context/FirebaseDataContext';
import { useCalculations } from '../hooks/useCalculations';
import { TransactionService } from '../services/transactionService';
import { ObligationService } from '../services/obligationService';
import { BudgetService, BudgetData } from '../services/budgetService'; // Importe o serviço de orçamento
import { Transaction } from '../types';

// Utilitário para formatar moeda
const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Utilitário para pegar a chave do mês (jan, fev...) igual ao salvo no banco
const getMonthKey = (date: Date) => {
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return months[date.getMonth()];
};

// Utilitário para gerar a chave única do orçamento (Igual ao hook useBudgetCalculations)
const generateItemKey = (category: string, specification: string) => {
  return `${category}:${specification || ''}`;
};

interface OutletContextType {
  selectedMonth: Date;
}

export default function Home() {
  const { selectedMonth } = useOutletContext<OutletContextType>();
  const { allTransactions, allChartOfAccounts, isLoadingFirebaseData } = useFirebaseData();
  
  // 1. Hook de Cálculos Gerais (Cards de Topo)
  const { monthly, cumulativeBalance, cashBalance, obligations } = useCalculations(
    allTransactions, 
    allChartOfAccounts, 
    selectedMonth
  );

  // 2. Estados Locais
  const [paymentStatus, setPaymentStatus] = useState({ isPreRPaid: false, isSinodoPaid: false });
  const [isLoadingObligations, setIsLoadingObligations] = useState(false);
  
  // Novo Estado para o Orçamento
  const [budgetData, setBudgetData] = useState<BudgetData>({});

  const currentMonthYear = format(selectedMonth, 'yyyy-MM');
  const selectedYear = selectedMonth.getFullYear();

  // 3. Efeitos (Carregar Status de Pagamento e Orçamento do Ano)
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoadingObligations(true);
      try {
        // Busca Status Obrigações
        const status = await ObligationService.getPaymentStatus(currentMonthYear);
        
        // Busca Orçamento do Ano Selecionado
        const budget = await BudgetService.getBudgetByYear(selectedYear);
        
        if (isMounted) {
          setPaymentStatus(status);
          setBudgetData(budget);
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        if (isMounted) setIsLoadingObligations(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [currentMonthYear, selectedYear]);

  // 4. Cálculo do Detalhamento (Realizado vs Orçado)
  const breakdownData = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const monthKey = getMonthKey(selectedMonth);

    // Mapeia todas as categorias para um objeto consolidado
    // Formato: { 'ID_DA_CATEGORIA': { name: 'Nome', realized: 0, budgeted: 0, type: '...' } }
    const categoryMap = new Map<string, { name: string; realized: number; budgeted: number; type: string }>();

    // A. Inicializa o Mapa com as Categorias e Soma os Orçamentos
    allChartOfAccounts.forEach(acc => {
      let budgetedTotal = 0;
      
      // Soma o orçamento de todas as especificações (subcategorias) desta categoria para o mês atual
      const specs = acc.specifications.length > 0 ? acc.specifications : [''];
      specs.forEach(spec => {
        const key = generateItemKey(acc.name, spec);
        const val = budgetData[key]?.[monthKey] || 0;
        budgetedTotal += val;
      });

      categoryMap.set(acc.id, {
        name: acc.name,
        type: acc.type,
        realized: 0,
        budgeted: budgetedTotal
      });
    });

    // B. Soma os Valores Realizados (Transações)
    allTransactions.forEach(t => {
      const tDate = new Date(t.data);
      if (isWithinInterval(tDate, { start, end })) {
        const categoryStats = categoryMap.get(t.chartOfAccountId);
        if (categoryStats) {
          // Se for despesa, mantemos positivo para comparação visual, ou negativo se preferir lógica contábil
          // Aqui vamos tratar tudo como absoluto para exibição na tabela
          categoryStats.realized += t.valor; 
        }
      }
    });

    // C. Converte para Array, Filtra (remove zerados em ambos) e Ordena
    return Array.from(categoryMap.values())
      .filter(item => item.realized > 0 || item.budgeted > 0) // Mostra se tiver movimento OU orçamento
      .sort((a, b) => b.realized - a.realized); // Ordena pelos maiores valores realizados

  }, [allTransactions, selectedMonth, allChartOfAccounts, budgetData]);

  // Handler de Pagamento de Obrigações (Manteve igual)
  const handlePayObligation = async (type: 'PRE_R' | 'SINODO', amount: number) => {
    if (amount <= 0) return alert("Valor deve ser maior que zero.");
    if (!window.confirm(`Confirma o pagamento de ${formatCurrency(amount)} para ${type}?`)) return;

    try {
      setIsLoadingObligations(true);
      const expenseAccount = allChartOfAccounts.find(acc => acc.name === 'Despesas Operacionais' && acc.type === 'expense');
      
      if (!expenseAccount) throw new Error("Categoria 'Despesas Operacionais' não encontrada.");

      const newTransaction: Transaction = {
        uid: '',
        descricao: `Pagamento Obrigação: ${type}`,
        valor: amount,
        tipo: 'expense',
        fundo: 'caixaGeral',
        memberId: null,
        chartOfAccountId: expenseAccount.id,
        paymentMethod: 'transferencia',
        data: new Date(),
        dueDate: null,
        status: 'pago'
      };

      await TransactionService.create(newTransaction);
      await ObligationService.markAsPaid(type, amount, currentMonthYear);

      setPaymentStatus(prev => ({
        ...prev,
        [type === 'PRE_R' ? 'isPreRPaid' : 'isSinodoPaid']: true
      }));

    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setIsLoadingObligations(false);
    }
  };

  if (isLoadingFirebaseData) return <div className="p-8 text-center text-slate-500">Carregando dados...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      
      {/* Header da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Visão Geral</h1>
          <p className="text-slate-500">Resumo financeiro de {format(selectedMonth, 'MMMM', { locale: ptBR })}</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Saldo em Espécie</p>
          <p className="text-lg font-mono font-bold text-slate-700">{formatCurrency(cashBalance)}</p>
        </div>
      </div>

      {/* Grid de Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Entradas */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp size={24} />
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">RECEITAS</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Total Entradas</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(monthly.revenue)}</h3>
        </div>

        {/* Card Saídas */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
              <TrendingDown size={24} />
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded-full">DESPESAS</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Total Saídas</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(monthly.expense)}</h3>
        </div>

        {/* Card Saldo */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-xl shadow-lg text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet size={64} />
          </div>
          <div className="relative z-10">
            <p className="text-slate-300 text-sm font-medium mb-1">Saldo Acumulado</p>
            <h3 className="text-3xl font-bold">{formatCurrency(cumulativeBalance)}</h3>
            <div className="mt-4 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${cumulativeBalance >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
              <span className="text-xs text-slate-300">Situação Financeira</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Obrigações */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="font-bold text-slate-800 text-lg">Obrigações Eclesiásticas</h3>
          
          {/* Presbitério */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold text-slate-700">Presbitério</p>
                <p className="text-xs text-slate-500">Taxa de 4%</p>
              </div>
              {paymentStatus.isPreRPaid && <CheckCircle className="text-emerald-500" size={20} />}
            </div>
            <p className="text-2xl font-bold text-slate-800 mb-4">{formatCurrency(obligations.presbytery)}</p>
            <button
              onClick={() => handlePayObligation('PRE_R', obligations.presbytery)}
              disabled={paymentStatus.isPreRPaid || obligations.presbytery <= 0 || isLoadingObligations}
              className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                paymentStatus.isPreRPaid 
                  ? 'bg-slate-100 text-slate-400 cursor-default'
                  : 'bg-sky-600 text-white hover:bg-sky-700 shadow-sm shadow-sky-200'
              }`}
            >
              {paymentStatus.isPreRPaid ? 'PAGO' : 'Registrar Pagamento'}
            </button>
          </div>

          {/* Sínodo */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold text-slate-700">Supremo Concílio</p>
                <p className="text-xs text-slate-500">Taxa de 10%</p>
              </div>
              {paymentStatus.isSinodoPaid && <CheckCircle className="text-emerald-500" size={20} />}
            </div>
            <p className="text-2xl font-bold text-slate-800 mb-4">{formatCurrency(obligations.synod)}</p>
            <button
              onClick={() => handlePayObligation('SINODO', obligations.synod)}
              disabled={paymentStatus.isSinodoPaid || obligations.synod <= 0 || isLoadingObligations}
              className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                paymentStatus.isSinodoPaid 
                  ? 'bg-slate-100 text-slate-400 cursor-default'
                  : 'bg-sky-600 text-white hover:bg-sky-700 shadow-sm shadow-sky-200'
              }`}
            >
              {paymentStatus.isSinodoPaid ? 'PAGO' : 'Registrar Pagamento'}
            </button>
          </div>
        </div>

        {/* Coluna Direita: Tabela de Detalhes (Realizado vs Orçado) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
             <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Target className="text-sky-600" size={20}/>
                Execução Orçamentária
             </h3>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">Categoria</th>
                    <th className="px-6 py-3 font-medium text-right text-slate-500">Orçado (Mês)</th>
                    <th className="px-6 py-3 font-medium text-right text-slate-800">Realizado</th>
                    <th className="px-6 py-3 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {breakdownData.length > 0 ? (
                    breakdownData.map((item, idx) => {
                      // Lógica de Status Simples
                      const isExpense = item.type === 'expense';
                      const diff = item.budgeted - item.realized;
                      let statusColor = 'bg-slate-100 text-slate-600'; // Neutro
                      let statusText = '-';

                      if (item.budgeted > 0) {
                        if (isExpense) {
                           // Despesa: Realizado > Orçado = Ruim (Vermelho)
                           if (item.realized > item.budgeted) {
                              statusColor = 'bg-rose-100 text-rose-700';
                              statusText = 'Estourou';
                           } else {
                              statusColor = 'bg-emerald-100 text-emerald-700';
                              statusText = 'No Prazo';
                           }
                        } else {
                           // Receita: Realizado > Orçado = Bom (Verde)
                           if (item.realized >= item.budgeted) {
                              statusColor = 'bg-emerald-100 text-emerald-700';
                              statusText = 'Atingiu';
                           } else {
                              statusColor = 'bg-yellow-100 text-yellow-700';
                              statusText = 'Abaixo';
                           }
                        }
                      }

                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3.5 text-slate-700 font-medium">{item.name}</td>
                          
                          {/* Coluna Orçado */}
                          <td className="px-6 py-3.5 text-right font-medium text-slate-500">
                            {item.budgeted > 0 ? formatCurrency(item.budgeted) : '-'}
                          </td>

                          {/* Coluna Realizado */}
                          <td className={`px-6 py-3.5 text-right font-bold ${isExpense ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {formatCurrency(item.realized)}
                          </td>

                          {/* Coluna Status */}
                          <td className="px-6 py-3.5 text-center">
                            {item.budgeted > 0 ? (
                               <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${statusColor}`}>
                                 {statusText}
                               </span>
                            ) : (
                               <span className="text-xs text-slate-300">N/A</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 flex flex-col items-center">
                        <AlertCircle size={32} className="mb-2 opacity-50" />
                        <span className="text-sm">Nenhuma movimentação ou orçamento para este mês.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}