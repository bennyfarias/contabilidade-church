import React from 'react';
import { useOutletContext } from 'react-router-dom';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';

interface OutletContextType {
  selectedMonth: Date;
}

export default function TransactionsPage() {
  // Obtém o mês selecionado do Layout (via Outlet)
  const { selectedMonth } = useOutletContext<OutletContextType>();

  return (
    <div className="dashboard-content">
      {/* Formulário para adicionar nova transação */}
      <TransactionForm selectedMonth={selectedMonth} />
      
      {/* Lista para visualizar e editar o histórico */}
      <TransactionList selectedMonth={selectedMonth} />
    </div>
  );
}