import React, { useEffect, useState } from 'react';
// CORREÇÃO: Adicionado 'onSnapshot' à lista de importações
import { doc, updateDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFirebaseData } from '../context/FirebaseDataContext';

// Função para formatar moeda
const formatCurrency = (value) => {
  if (typeof value !== 'number') return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Função para gerar chave única para o relatório de especificações
const generateItemKey = (categoryName, specName) => {
  return `${categoryName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${specName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
};


export default function Dashboard({ selectedMonth }) {
  const { allTransactions, allChartOfAccounts, isLoadingFirebaseData, errorFirebaseData } = useFirebaseData(); 
  
  // Estados para os cards principais
  const [cumulativeEntradas, setCumulativeEntradas] = useState(0);
  const [cumulativeSaidas, setCumulativeSaidas] = useState(0);
  const [cumulativeSaldo, setCumulativeSaldo] = useState(0);
  
  // Estados para os detalhes do mês
  const [contasAPagar, setContasAPagar] = useState([]);
  const [monthlyTransactions, setMonthlyTransactions] = useState([]);
  const [currentMonthBudgetRaw, setCurrentMonthBudgetRaw] = useState({});

  const selectedYear = selectedMonth.getFullYear();
  const selectedMonthLowercase = format(selectedMonth, 'MMM', { locale: ptBR }).toLowerCase();

  const firstDayOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59);
  
  useEffect(() => {
    if (!auth.currentUser || isLoadingFirebaseData) return;
    const budgetDocRef = doc(db, 'monthly_budgets', String(selectedYear));
    const unsub = onSnapshot(budgetDocRef, (docSnap) => {
      setCurrentMonthBudgetRaw(docSnap.exists() ? docSnap.data() : {});
    });
    return () => unsub();
  }, [selectedYear, auth.currentUser, isLoadingFirebaseData]);

  useEffect(() => {
    if (!auth.currentUser || isLoadingFirebaseData || errorFirebaseData) return;

    let totalEntradasAcumulado = 0;
    let totalSaidasAcumulado = 0;
    const contasAPagarMes = [];
    const transactionsInSelectedMonth = [];

    const chartOfAccountsMap = {};
    allChartOfAccounts.forEach(acc => chartOfAccountsMap[acc.id] = acc.type);

    allTransactions.forEach(t => {
      const transactionDate = t.data?.toDate();
      if (!transactionDate) return;
      const transactionType = chartOfAccountsMap[t.chartOfAccountId];

      if (transactionDate <= lastDayOfMonth) {
        if (transactionType === 'revenue') { totalEntradasAcumulado += t.valor; } 
        else if (transactionType === 'expense') { totalSaidasAcumulado += t.valor; }
      }
      
      const dueDate = t.dueDate?.toDate();
      if (
        transactionType === 'expense' &&
        t.status !== 'pago' &&
        dueDate &&
        dueDate >= firstDayOfMonth &&
        dueDate <= lastDayOfMonth
      ) {
        contasAPagarMes.push(t);
      }
      
       if (transactionDate >= firstDayOfMonth && transactionDate <= lastDayOfMonth) {
        transactionsInSelectedMonth.push(t);
      }
    });

    setCumulativeEntradas(totalEntradasAcumulado);
    setCumulativeSaidas(totalSaidasAcumulado);
    setCumulativeSaldo(totalEntradasAcumulado - totalSaidasAcumulado);
    setMonthlyTransactions(transactionsInSelectedMonth);
    setContasAPagar(contasAPagarMes.sort((a, b) => a.dueDate.seconds - b.dueDate.seconds));

  }, [auth.currentUser, selectedMonth, allChartOfAccounts, allTransactions, isLoadingFirebaseData, errorFirebaseData]);

  const handleMarkAsPaid = async (transactionId) => {
    if (!transactionId) return;
    try {
      const transactionRef = doc(db, 'transacoes', transactionId);
      await updateDoc(transactionRef, { status: 'pago' });
    } catch (error) {
      console.error("Erro ao marcar como pago:", error);
      alert("Não foi possível atualizar o status da conta.");
    }
  };

  const getSpecificationReport = () => {
    const report = {};
    monthlyTransactions.forEach(transaction => {
        const { descricao, valor, chartOfAccountId } = transaction;
        const accountData = allChartOfAccounts.find(acc => acc.id === chartOfAccountId);
        const categoryName = accountData?.name || '';
        const itemKey = generateItemKey(categoryName, descricao);
        if (!report[descricao]) {
            report[descricao] = { spent: 0, budgeted: 0, categoryId: chartOfAccountId, itemKey: itemKey };
        }
        report[descricao].spent += valor;
    });
    Object.keys(report).forEach(specDisplay => {
        const item = report[specDisplay];
        const budgetedValue = currentMonthBudgetRaw[item.itemKey]?.[selectedMonthLowercase] || 0;
        item.budgeted = budgetedValue;
    });
    return report;
  };

  const specificationReportData = getSpecificationReport();

  if (isLoadingFirebaseData) {
    return <p className="text-center">Carregando dados financeiros...</p>;
  }
  if (errorFirebaseData) {
    return <p className="error-message text-center">Erro ao carregar dados: {errorFirebaseData}</p>;
  }

  return (
    <div className="dashboard">
      <h2>Resumo Financeiro - {format(selectedMonth, 'MMMM \'de\' yyyy', { locale: ptBR })}</h2>

      <div className="dashboard-summary-grid">
        <div className="summary-card entradas"><div className="icon"><i className="fas fa-arrow-up"></i></div><h4>Total Entradas (Acumulado)</h4><div className="value">{formatCurrency(cumulativeEntradas)}</div></div>
        <div className="summary-card saidas"><div className="icon"><i className="fas fa-arrow-down"></i></div><h4>Total Saídas (Acumulado)</h4><div className="value">{formatCurrency(cumulativeSaidas)}</div></div>
        <div className="summary-card saldo"><div className="icon"><i className="fas fa-wallet"></i></div><h4>Saldo Atual (Acumulado)</h4><div className="value">{formatCurrency(cumulativeSaldo)}</div></div>
      </div>

      <div className="contas-a-pagar-receber">
        <h3>Contas a Pagar do Mês (Pendentes)</h3>
        <div className="contas-list">
          <div>
            <ul>
              {contasAPagar.length > 0 ? (
                contasAPagar.map(conta => (
                  <li key={conta.id} className="conta-item">
                    <div className="conta-info">
                      <strong>{conta.descricao}</strong>
                      <span>{formatCurrency(conta.valor)} (Vence em: {format(conta.dueDate.toDate(), 'dd/MM/yyyy')})</span>
                    </div>
                    <button onClick={() => handleMarkAsPaid(conta.id)} className="pay-button" title="Marcar como Pago">
                      ✔ Pagar
                    </button>
                  </li>
                ))
              ) : (
                <li>Nenhuma conta pendente para este mês.</li>
              )}
            </ul>
            <div className="total">Total a Pagar no Mês: {formatCurrency(contasAPagar.reduce((sum, t) => sum + t.valor, 0))}</div>
          </div>
        </div>
      </div>
      
      <div className="report-section mt-5">
        <h3>Detalhamento de Entradas e Saídas por Especificação (do Mês)</h3>
        {Object.keys(specificationReportData).length === 0 ? (
          <p className="text-center">Nenhuma transação detalhada registrada para este mês.</p>
        ) : (
          <table className="report-table mt-3">
             {/* O conteúdo da sua tabela de detalhamento */}
             <thead>
                <tr>
                    <th>Especificação</th>
                    <th>Valor Gasto/Recebido</th>
                </tr>
             </thead>
             <tbody>
                {Object.entries(specificationReportData).map(([spec, data]) => (
                    <tr key={spec}>
                        <td>{spec}</td>
                        <td>{formatCurrency(data.spent)}</td>
                    </tr>
                ))}
             </tbody>
          </table>
        )}
      </div>
    </div>
  );
}