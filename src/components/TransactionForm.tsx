import React, { useState, useEffect, FormEvent } from 'react';
import { useFirebaseData } from '../context/FirebaseDataContext';
import { TransactionService } from '../services/transactionService';
import { UploadService } from '../services/uploadService';
import { Transaction, TransactionType, PaymentMethod } from '../types';
import { Check, Calendar, DollarSign, FileText, Tag, User, CreditCard, Upload, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';

interface TransactionFormProps {
  selectedMonth: Date;
  initialData?: Transaction | null;
  onSuccess?: () => void;
}

export default function TransactionForm({ selectedMonth, initialData, onSuccess }: TransactionFormProps) {
  const { allChartOfAccounts, allMembers, isLoadingFirebaseData } = useFirebaseData();
  
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<TransactionType>('expense');
  const [categoriaId, setCategoriaId] = useState('');
  const [membroId, setMembroId] = useState('');
  const [dataTransacao, setDataTransacao] = useState(new Date().toISOString().split('T')[0]);
  const [metodo, setMetodo] = useState<PaymentMethod>('pix');
  const [comprovanteUrl, setComprovanteUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDescricao(initialData.descricao);
      setValor(initialData.valor.toString());
      setTipo(initialData.tipo);
      setCategoriaId(initialData.chartOfAccountId);
      setMembroId(initialData.memberId || '');
      // Pega apenas a parte YYYY-MM-DD
      setDataTransacao(new Date(initialData.data).toISOString().split('T')[0]);
      setMetodo(initialData.paymentMethod);
      setComprovanteUrl(initialData.receiptUrl || '');
    } else {
        const today = new Date();
        // Se o mês selecionado for diferente do atual, sugere o dia 1 do mês selecionado
        if (selectedMonth.getMonth() !== today.getMonth()) {
             const year = selectedMonth.getFullYear();
             const month = (selectedMonth.getMonth() + 1).toString().padStart(2, '0');
             setDataTransacao(`${year}-${month}-01`);
        } else {
             setDataTransacao(today.toISOString().split('T')[0]);
        }
    }
  }, [initialData, selectedMonth]);

  const filteredCategories = allChartOfAccounts.filter(c => c.type === tipo);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) return alert("Apenas imagens (JPG, PNG).");

      setIsUploading(true);
      try {
        const url = await UploadService.uploadFile(file);
        setComprovanteUrl(url);
      } catch (error: any) {
        alert("Erro no upload: " + error.message);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!descricao || !valor || !categoriaId) return alert('Preencha os campos obrigatórios');

    setIsSubmitting(true);
    try {
      // TRUQUE DO FUSO HORÁRIO: Adicionar T12:00:00 para garantir que fique no mesmo dia
      const dateFixed = new Date(`${dataTransacao}T12:00:00`);

      const transactionPayload: Omit<Transaction, 'id'> = {
        uid: '', 
        descricao,
        valor: parseFloat(valor.replace(',', '.')),
        tipo,
        fundo: 'caixaGeral',
        chartOfAccountId: categoriaId,
        memberId: membroId || null,
        paymentMethod: metodo,
        data: dateFixed, // Usando a data corrigida
        dueDate: null,
        status: 'pago',
        receiptUrl: comprovanteUrl || null
      };

      if (initialData?.id) {
        await TransactionService.update(initialData.id, transactionPayload);
      } else {
        await TransactionService.create(transactionPayload);
        // Limpar form
        setDescricao('');
        setValor('');
        setMembroId('');
        setComprovanteUrl('');
      }

      if (onSuccess) onSuccess();
      if (!initialData) alert("Salvo com sucesso!");

    } catch (error: any) {
      console.error(error);
      alert("Erro ao salvar: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingFirebaseData) return <div className="p-4 text-center">Carregando...</div>;

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
        {initialData ? <FileText className="text-sky-500"/> : <DollarSign className="text-emerald-500"/>}
        {initialData ? 'Editar Transação' : 'Nova Transação'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TIPO */}
        <div className="col-span-2 flex gap-4">
          <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${tipo === 'revenue' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold' : 'border-slate-200 text-slate-500'}`}>
            <input type="radio" name="tipo" className="hidden" checked={tipo === 'revenue'} onChange={() => setTipo('revenue')} />
            <span>Receita</span>
          </label>
          <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${tipo === 'expense' ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold' : 'border-slate-200 text-slate-500'}`}>
            <input type="radio" name="tipo" className="hidden" checked={tipo === 'expense'} onChange={() => setTipo('expense')} />
            <span>Despesa</span>
          </label>
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
          <input required type="text" value={descricao} onChange={e => setDescricao(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500" placeholder="Ex: Conta de Luz" />
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
          <input required type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500" placeholder="0.00" />
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
          <select required value={categoriaId} onChange={e => setCategoriaId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white">
            <option value="">Selecione...</option>
            {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
          <input type="date" value={dataTransacao} onChange={e => setDataTransacao(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500" />
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Membro (Opcional)</label>
          <select value={membroId} onChange={e => setMembroId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white">
            <option value="">-- Nenhum --</option>
            {allMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Pagamento</label>
          <select value={metodo} onChange={e => setMetodo(e.target.value as PaymentMethod)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white">
            <option value="pix">Pix</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="transferencia">Transferência</option>
            <option value="debito">Débito</option>
            <option value="credito">Crédito</option>
            <option value="boleto">Boleto</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">Comprovante</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 transition-all"/>
          {isUploading && <p className="text-xs text-sky-600 mt-1">Enviando imagem...</p>}
          {comprovanteUrl && <p className="text-xs text-emerald-600 mt-1">Imagem anexada!</p>}
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <button type="submit" disabled={isSubmitting || isUploading} className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2">
          {(isSubmitting || isUploading) ? 'Salvando...' : 'Salvar Transação'}
        </button>
        {onSuccess && <button type="button" onClick={onSuccess} className="px-6 border border-slate-300 rounded-lg font-bold text-slate-600">Cancelar</button>}
      </div>
    </form>
  );
}