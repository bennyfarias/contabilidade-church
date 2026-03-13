import React, { useState, useEffect, useMemo } from 'react';
import { useFirebaseData } from '../context/FirebaseDataContext';
import { BudgetService, BudgetData } from '../services/budgetService';
import { useBudgetCalculations } from '../hooks/useBudgetCalculations';
import { ChartOfAccount, TransactionType } from '../types';
import { MONTHS } from '../utils/constants';
import { Save, Plus, Trash2, ChevronDown, ChevronRight, Edit2, X, AlertCircle, FileDown } from 'lucide-react';

const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const INITIAL_FORM = { name: '', type: 'revenue' as TransactionType, specifications: '', orcamento: 0 };

export default function MonthlyBudgetPage() {
  const { allChartOfAccounts, isLoadingFirebaseData } = useFirebaseData();
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [budgetInput, setBudgetInput] = useState<BudgetData>({});
  const [filter, setFilter] = useState<TransactionType>('revenue');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [manageForm, setManageForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { calculateParentMonthlyTotal, calculateParentAnnualTotal, calculateItemAnnualTotal, calculateColumnTotal, calculateGrandTotal, generateItemKey } = useBudgetCalculations(budgetInput, allChartOfAccounts, filter);

  useEffect(() => {
    const load = async () => { 
      const data = await BudgetService.getBudgetByYear(selectedYear);
      setBudgetInput(data);
    };
    load();
  }, [selectedYear]);

  const handleSaveBudget = async () => {
    setIsSaving(true);
    await BudgetService.saveBudget(selectedYear, budgetInput);
    setIsSaving(false);
    alert('Orçamento salvo com sucesso!');
  };

  const handleImportStandardAccounts = async () => {
    if (window.confirm("Deseja importar o Plano de Contas padrão da IPB? As categorias que já existem não serão duplicadas.")) {
      setIsImporting(true);
      try {
        const addedCount = await BudgetService.importStandardAccounts();
        alert(`${addedCount} novas categorias foram importadas com sucesso!`);
      } catch (error) {
        alert("Erro ao importar o plano de contas padrão.");
      } finally {
        setIsImporting(false);
      }
    }
  };

  const handleInputChange = (cat: string, spec: string, month: string, val: string) => {
    const key = generateItemKey(cat, spec);
    setBudgetInput(prev => ({ ...prev, [key]: { ...prev[key], [month.toLowerCase()]: parseFloat(val) || 0 } }));
  };

  const openModal = (acc?: ChartOfAccount) => {
    if (acc) {
      setEditingId(acc.id);
      setManageForm({
        name: acc.name,
        type: acc.type,
        specifications: acc.specifications.join(', '),
        orcamento: acc.orcamento || 0
      });
    } else {
      setEditingId(null);
      setManageForm(INITIAL_FORM);
    }
    setIsModalOpen(true);
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const specsArray = manageForm.specifications.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const payload = { 
      name: manageForm.name,
      type: manageForm.type,
      specifications: specsArray,
      orcamento: Number(manageForm.orcamento)
    };
    try {
      if (editingId) await BudgetService.updateAccount(editingId, payload);
      else await BudgetService.createAccount(payload);
      setIsModalOpen(false);
    } catch (error) {
      alert("Erro ao salvar categoria.");
    }
  };

  const handleDelete = async (id: string) => {
    if(window.confirm("Tem certeza que deseja excluir esta categoria? Isso não apaga as transações já lançadas, mas remove a linha do orçamento.")) {
      await BudgetService.deleteAccount(id);
    }
  };

  const filteredAccounts = useMemo(() => 
    allChartOfAccounts.filter(acc => acc.type === filter).sort((a,b) => a.name.localeCompare(b.name)), 
  [allChartOfAccounts, filter]);

  if (isLoadingFirebaseData) return <div className="p-8 text-center text-slate-500">Carregando orçamento...</div>;

  return (
    <div className="max-w-full space-y-6">
      
      {/* HEADER MOBILE-FRIENDLY */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Planejamento {selectedYear}</h1>
          <p className="text-sm text-slate-500">Gerencie categorias e metas mensais</p>
        </div>
        
        {/* BOTÕES ADAPTÁVEIS */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <input 
            type="number" 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-20 md:w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none" 
          />
          <button 
            onClick={handleImportStandardAccounts} 
            disabled={isImporting}
            className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg flex justify-center items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-70"
            title="Importar Plano Padrão"
          >
            <FileDown size={18} /> <span className="hidden sm:inline">{isImporting ? 'Importando...' : 'Importar Padrão'}</span><span className="sm:hidden">Importar</span>
          </button>
          <button 
            onClick={() => openModal()} 
            className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-lg flex justify-center items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap"
          >
            <Plus size={18} /> <span className="hidden sm:inline">Nova Categoria</span><span className="sm:hidden">Nova</span>
          </button>
          <button 
            onClick={handleSaveBudget} 
            disabled={isSaving} 
            className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg flex justify-center items-center gap-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-70 whitespace-nowrap"
          >
            <Save size={18} /> <span className="hidden sm:inline">{isSaving ? 'Salvando...' : 'Salvar Orçamento'}</span><span className="sm:hidden">Salvar</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-220px)]">
        <div className="flex border-b border-slate-200 bg-slate-50 px-2">
          <button onClick={() => setFilter('revenue')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${filter === 'revenue' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Receitas</button>
          <button onClick={() => setFilter('expense')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${filter === 'expense' ? 'border-rose-500 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Despesas</button>
        </div>

        {/* TABELA RESPONSIVA */}
        <div className="flex-1 overflow-auto relative scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          <table className="min-w-max text-sm text-left border-collapse">
            <thead className="bg-slate-100 text-slate-600 sticky top-0 z-20 shadow-sm font-semibold">
              <tr>
                <th className="p-3 sticky left-0 bg-slate-100 border-r border-slate-200 min-w-[140px] md:min-w-[280px] z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Classificação</th>
                {MONTHS.map(m => <th key={m} className="p-3 w-28 text-center min-w-[100px]">{m}</th>)}
                <th className="p-3 w-32 text-right bg-slate-200 text-slate-800">Total Anual</th>
                <th className="p-3 w-24 text-center sticky right-0 bg-slate-100 border-l border-slate-200">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.map(acc => {
                const isExpanded = expandedCategories[acc.id];
                const hasChildren = acc.specifications.length > 0;
                
                return (
                  <React.Fragment key={acc.id}>
                    <tr className="bg-slate-50 hover:bg-slate-100 group transition-colors">
                      <td 
                        className="p-3 sticky left-0 bg-slate-50 group-hover:bg-slate-100 border-r border-slate-200 font-bold text-slate-800 cursor-pointer z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[140px] md:min-w-[280px] max-w-[140px] md:max-w-[280px]" 
                        onClick={() => setExpandedCategories(p => ({...p, [acc.id]: !p[acc.id]}))}
                      >
                        <div className="flex items-center gap-1 md:gap-2 overflow-hidden">
                          {hasChildren ? (
                            <div className="shrink-0">{isExpanded ? <ChevronDown size={16} className="text-slate-400"/> : <ChevronRight size={16} className="text-slate-400"/>}</div>
                          ) : (
                            <span className="w-4 shrink-0"></span>
                          )}
                          <span className="truncate" title={acc.name}>{acc.name}</span>
                        </div>
                      </td>
                      {MONTHS.map(m => (
                        <td key={m} className="p-3 text-center text-slate-500 font-medium">
                          {formatCurrency(calculateParentMonthlyTotal(acc, m))}
                        </td>
                      ))}
                      <td className="p-3 text-right font-bold text-slate-800 bg-slate-100 border-l border-slate-200">
                        {formatCurrency(calculateParentAnnualTotal(acc))}
                      </td>
                      <td className="p-3 text-center sticky right-0 bg-slate-50 group-hover:bg-slate-100 border-l border-slate-200 flex justify-center gap-1 z-10">
                         <button onClick={(e) => { e.stopPropagation(); openModal(acc); }} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"><Edit2 size={16}/></button>
                         <button onClick={(e) => { e.stopPropagation(); handleDelete(acc.id); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"><Trash2 size={16}/></button>
                      </td>
                    </tr>

                    {isExpanded && (hasChildren ? acc.specifications : ['']).map((spec, idx) => {
                       const itemKey = generateItemKey(acc.name, spec);
                       return (
                        <tr key={`${acc.id}-${idx}`} className="bg-white hover:bg-sky-50/30 transition-colors">
                          <td className="p-3 sticky left-0 bg-white border-r border-slate-200 pl-6 md:pl-10 text-slate-600 truncate min-w-[140px] md:min-w-[280px] max-w-[140px] md:max-w-[280px] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-[10px] md:text-xs uppercase font-semibold tracking-wide" title={spec || 'Geral'}>
                            {spec || 'Geral'}
                          </td>
                          {MONTHS.map(m => (
                            <td key={m} className="p-1 border border-slate-50 relative group/cell">
                              <input 
                                type="number" 
                                className="w-full h-full p-2 text-center text-slate-700 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:z-10 rounded outline-none transition-all text-xs"
                                placeholder="-"
                                value={budgetInput[itemKey]?.[m.toLowerCase()] || ''}
                                onChange={(e) => handleInputChange(acc.name, spec, m, e.target.value)}
                              />
                            </td>
                          ))}
                          <td className="p-3 text-right text-slate-600 bg-slate-50/50 border-l border-slate-200 text-xs font-bold">
                            {formatCurrency(calculateItemAnnualTotal(acc.name, spec))}
                          </td>
                          <td className="sticky right-0 bg-white border-l border-slate-200"></td>
                        </tr>
                       )
                    })}
                  </React.Fragment>
                );
              })}
              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={15} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={32} className="opacity-50"/>
                      <p>Nenhuma categoria encontrada.</p>
                      <button onClick={handleImportStandardAccounts} className="text-indigo-600 font-medium hover:underline mt-2">
                        Importar Plano de Contas Padrão da IPB
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-800 text-white sticky bottom-0 z-30 shadow-lg">
              <tr>
                <td className="p-3 sticky left-0 bg-slate-800 border-r border-slate-700 font-bold uppercase text-[10px] md:text-xs tracking-wider z-30 min-w-[140px] md:min-w-[280px]">TOTAL GERAL</td>
                {MONTHS.map(m => <td key={m} className="p-3 text-center font-bold text-xs font-mono">{formatCurrency(calculateColumnTotal(m))}</td>)}
                <td className="p-3 text-right font-bold text-sky-400 bg-slate-900 font-mono text-sm">{formatCurrency(calculateGrandTotal())}</td>
                <td className="sticky right-0 bg-slate-800"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg">{editingId ? 'Editar Categoria' : 'Nova Categoria'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-200"><X size={20}/></button>
            </div>
            <form onSubmit={saveCategory} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nome da Categoria</label>
                <input required value={manageForm.name} onChange={e=>setManageForm({...manageForm, name: e.target.value})} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" placeholder="Ex: Manutenção" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Tipo de Movimentação</label>
                <select value={manageForm.type} onChange={e=>setManageForm({...manageForm, type: e.target.value as any})} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white">
                  <option value="revenue">Receita (Entrada)</option>
                  <option value="expense">Despesa (Saída)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Subcategorias (Opcional)<span className="block text-xs font-normal text-slate-500 mt-0.5">Separe por vírgula</span></label>
                <textarea placeholder="Ex: Pintura, Elétrica" value={manageForm.specifications} onChange={e=>setManageForm({...manageForm, specifications: e.target.value})} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none h-28 resize-none text-sm" />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2"><Save size={18} />{editingId ? 'Salvar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}