import React, { useState, useMemo } from 'react';
import Select, { MultiValue, SingleValue } from 'react-select';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { useFirebaseData } from '../context/FirebaseDataContext';
import { useReportData } from '../hooks/useReportData';
import { Filter, Calendar, Users, CheckCircle, XCircle, BarChart3, PieChart as PieIcon } from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#a855f7', '#ec4899'];
const MONTH_NAMES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ReportsPage() {
  const { allTransactions, allChartOfAccounts, allMembers, isLoadingFirebaseData } = useFirebaseData();
  
  // Filtros Globais
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('');
  const [cats, setCats] = useState<MultiValue<{value:string, label:string}>>([]);
  
  // Filtro Específico de Membro (Fidelidade)
  const [memberHistorySearch, setMemberHistorySearch] = useState<SingleValue<{value:string, label:string}>>(null);

  // Memos de Opções
  const catOptions = useMemo(() => allChartOfAccounts.map(c => ({value: c.id, label: c.name})), [allChartOfAccounts]);
  const memberOptions = useMemo(() => allMembers.map(m => ({value: m.id, label: m.name})), [allMembers]);

  // Hook de Dados
  const { monthlyData, categoryData, summary, fidelityData } = useReportData(allTransactions, allChartOfAccounts, allMembers, { 
    startDate, 
    endDate, 
    type, 
    categoryIds: cats.map(c=>c.value), 
    memberId: '' 
  });

  // Lógica de Histórico Individual (Restaurada)
  const memberHistoryStatus = useMemo(() => {
    if (!memberHistorySearch) return null;
    const currentYear = new Date().getFullYear();
    const status = Array(12).fill(false);
    
    allTransactions.forEach(t => {
      const tDate = new Date(t.data);
      if (t.memberId === memberHistorySearch.value && tDate.getFullYear() === currentYear) {
        // Verifica se é dízimo (lógica baseada em nome ou categoria)
        const acc = allChartOfAccounts.find(a => a.id === t.chartOfAccountId);
        if ((acc?.name.toLowerCase().includes('dízimo')) || (t.descricao.toLowerCase().includes('dízimo'))) {
          status[tDate.getMonth()] = true;
        }
      }
    });
    return status;
  }, [memberHistorySearch, allTransactions, allChartOfAccounts]);

  if (isLoadingFirebaseData) return <div className="p-8 text-center text-slate-500">Carregando dados...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Relatórios Financeiros</h1>
        <p className="text-slate-500">Análise detalhada e histórico de membros</p>
      </div>

      {/* --- ÁREA DE FILTROS --- */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4 text-slate-700 font-semibold border-b border-slate-100 pb-2">
          <Filter size={18} /> Filtros de Análise
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Início</label>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-sky-500" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Fim</label>
            <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-sky-500" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
            <select value={type} onChange={e=>setType(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-sky-500">
              <option value="">Todos (Receitas e Despesas)</option>
              <option value="revenue">Apenas Receitas</option>
              <option value="expense">Apenas Despesas</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Categorias</label>
            <Select 
              isMulti 
              options={catOptions} 
              value={cats} 
              onChange={setCats} 
              className="text-sm" 
              placeholder="Filtrar categorias..."
              styles={{ control: (base) => ({ ...base, borderColor: '#cbd5e1', borderRadius: '0.5rem' }) }}
            />
          </div>
        </div>
      </div>

      {/* --- SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border-l-4 border-emerald-500 shadow-sm">
          <p className="text-emerald-600 font-bold text-xs uppercase tracking-wider">Receitas no Período</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(summary.totalRevenue)}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border-l-4 border-rose-500 shadow-sm">
          <p className="text-rose-600 font-bold text-xs uppercase tracking-wider">Despesas no Período</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(summary.totalExpense)}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border-l-4 border-sky-500 shadow-sm">
          <p className="text-sky-600 font-bold text-xs uppercase tracking-wider">Resultado Líquido</p>
          <h3 className={`text-2xl font-bold mt-1 ${summary.net >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
            {formatCurrency(summary.net)}
          </h3>
        </div>
      </div>

      {/* --- GRÁFICOS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Barras */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-sky-50 rounded-lg"><BarChart3 className="text-sky-600" size={20} /></div>
            <h3 className="font-bold text-slate-800">Evolução Mensal</h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(v)=>`k${v/1000}`} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend />
                <Bar dataKey="revenue" name="Receita" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="expense" name="Despesa" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pizza */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-purple-50 rounded-lg"><PieIcon className="text-purple-600" size={20} /></div>
            <h3 className="font-bold text-slate-800">Distribuição por Categoria</h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {categoryData.map((e, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(val:number) => formatCurrency(val)} contentStyle={{borderRadius: '8px'}} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- SEÇÃO DE FIDELIDADE (MEMBER HISTORY) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico de Fidelidade Geral */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
             <div className="p-2 bg-yellow-50 rounded-lg"><Users className="text-yellow-600" size={20} /></div>
             <h3 className="font-bold text-slate-800">Fidelidade Geral ({new Date().getFullYear()})</h3>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={fidelityData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                   <Cell fill="#22c55e" /> {/* Fiéis */}
                   <Cell fill="#eab308" /> {/* Esporádicos */}
                   <Cell fill="#ef4444" /> {/* Ausentes */}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cartão de Membro Individual */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg"><Calendar className="text-blue-600" size={20} /></div>
              <h3 className="font-bold text-slate-800">Histórico Individual de Dízimos</h3>
            </div>
            <div className="w-full sm:w-64">
              <Select 
                options={memberOptions} 
                value={memberHistorySearch} 
                onChange={setMemberHistorySearch} 
                placeholder="Selecione um membro..." 
                styles={{ control: (base) => ({ ...base, borderColor: '#cbd5e1', borderRadius: '0.5rem' }) }}
              />
            </div>
          </div>

          {memberHistorySearch && memberHistoryStatus ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {MONTH_NAMES.map((month, index) => {
                const isActive = memberHistoryStatus[index];
                return (
                  <div key={month} className={`flex flex-col items-center p-3 rounded-lg border ${isActive ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                    <span className="text-xs font-bold text-slate-500 mb-2">{month}</span>
                    {isActive ? (
                      <CheckCircle className="text-emerald-500 w-8 h-8" />
                    ) : (
                      <XCircle className="text-slate-300 w-8 h-8" />
                    )}
                    <span className={`text-[10px] font-bold mt-2 uppercase ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {isActive ? 'Contribuiu' : '-'}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-400">
              Selecione um membro para visualizar o cartão de fidelidade do ano atual.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}