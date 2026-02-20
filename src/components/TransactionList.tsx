import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useFirebaseData } from '../context/FirebaseDataContext';
import TransactionForm from './TransactionForm';
import { TransactionService } from '../services/transactionService';
import { Transaction } from '../types';
import { Edit2, Trash2, Filter, X, Search } from 'lucide-react';

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

interface TransactionListProps {
  selectedMonth: Date;
}

export default function TransactionList({ selectedMonth }: TransactionListProps) { 
  const { allTransactions, allChartOfAccounts, allMembers, isLoadingFirebaseData } = useFirebaseData();
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [transactionsDisplay, setTransactionsDisplay] = useState<Transaction[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentTransactionToEdit, setCurrentTransactionToEdit] = useState<Transaction | null>(null);

  const accountsMap = new Map(allChartOfAccounts.map(a => [a.id, a]));
  const membersMap = new Map(allMembers.map(m => [m.id, m.name]));

  useEffect(() => {
    if (isLoadingFirebaseData) return;
    let filtered = [...allTransactions];
    if (filterStartDate) filtered = filtered.filter(t => new Date(t.data) >= new Date(filterStartDate + 'T00:00:00'));
    if (filterEndDate) filtered = filtered.filter(t => new Date(t.data) <= new Date(filterEndDate + 'T23:59:59'));
    filtered.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    setTransactionsDisplay(filtered);
  }, [allTransactions, filterStartDate, filterEndDate, isLoadingFirebaseData]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Excluir transação?")) await TransactionService.delete(id);
  };

  if (isLoadingFirebaseData) return <div className="p-8 text-center text-slate-500">Carregando transações...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
      {/* Header com Filtros */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-4 bg-slate-50/50">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Filter size={18} className="text-slate-500" /> Filtros
        </h2>
        <div className="flex items-center gap-2">
          <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm" />
          <span className="text-slate-400">até</span>
          <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm" />
          {(filterStartDate || filterEndDate) && (
            <button onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }} className="text-slate-500 hover:text-rose-600 p-1">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Tabela Moderna */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 w-32">Data</th>
              <th className="px-6 py-3 w-24">Tipo</th>
              <th className="px-6 py-3">Descrição / Membro</th>
              <th className="px-6 py-3">Categoria</th>
              <th className="px-6 py-3 text-right">Valor</th>
              <th className="px-6 py-3 text-center w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactionsDisplay.map(t => {
              const category = accountsMap.get(t.chartOfAccountId);
              const memberName = t.memberId ? membersMap.get(t.memberId) : null;
              const isRevenue = t.tipo === 'revenue';

              return (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-3 text-slate-600 whitespace-nowrap">
                    {format(new Date(t.data), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${isRevenue ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {isRevenue ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-700 font-medium">
                    {t.descricao}
                    {memberName && <span className="block text-xs text-slate-400 font-normal">{memberName}</span>}
                  </td>
                  <td className="px-6 py-3 text-slate-500">
                    {category?.name || '-'}
                  </td>
                  <td className={`px-6 py-3 text-right font-bold whitespace-nowrap ${isRevenue ? 'text-emerald-600' : 'text-rose-600'}`}>
                    R$ {formatCurrency(t.valor)}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setCurrentTransactionToEdit(t); setIsEditModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-md">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => t.id && handleDelete(t.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {transactionsDisplay.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">Nenhuma transação encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Edição */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Editar Transação</h3>
              <button onClick={() => setIsEditModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <div className="p-4">
              <TransactionForm selectedMonth={selectedMonth} initialData={currentTransactionToEdit} onSuccess={() => setIsEditModalOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}