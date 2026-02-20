import React, { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { useFirebaseData } from '../context/FirebaseDataContext';
import { useCashBook } from '../hooks/useCashBook';
import { Printer, Calendar, Download } from 'lucide-react';

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CashBookPage() {
  const { selectedMonth: globalSelectedMonth } = useOutletContext<{selectedMonth: Date}>();
  const { allTransactions, allChartOfAccounts, allMembers, isLoadingFirebaseData } = useFirebaseData();
  const [localSelectedMonth, setLocalSelectedMonth] = useState<Date>(globalSelectedMonth);
  
  const { entradasMes, saidasMes, saldoMes, saldoAnoAnterior, saldoMesAnterior, saldoATransportar, transactionsInMonth } = useCashBook(allTransactions, allChartOfAccounts, localSelectedMonth);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = () => {
    const opt = {
      margin: [5, 5, 5, 5],
      filename: `Livro_Caixa_${format(localSelectedMonth, 'MM-yyyy')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    html2pdf().from(reportRef.current).set(opt).save();
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(!e.target.value) return;
    const [y, m] = e.target.value.split('-').map(Number);
    setLocalSelectedMonth(new Date(y, m-1, 1));
  };

  // Filtrar transações com anexo
  const transactionsWithReceipts = transactionsInMonth.filter(t => t.receiptUrl);

  if (isLoadingFirebaseData) return <div className="p-8 text-center text-slate-500">Gerando livro...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Barra de Controles */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
        <div>
           <h1 className="font-bold text-slate-800">Livro Caixa Mensal</h1>
           <p className="text-sm text-slate-500">Visualize e imprima o relatório oficial</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <Calendar className="text-slate-400" size={18}/>
            <input 
              type="month" 
              value={format(localSelectedMonth, 'yyyy-MM')} 
              onChange={handleMonthChange} 
              className="bg-transparent border-none text-sm text-slate-700 font-medium outline-none cursor-pointer" 
            />
          </div>
          <button onClick={handleDownloadPdf} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm font-medium text-sm">
            <Download size={18} /> Baixar PDF
          </button>
        </div>
      </div>

      {/* Área de Impressão */}
      <div className="flex justify-center">
        <div 
          ref={reportRef}
          className="bg-white shadow-2xl border border-slate-200 p-10 w-[210mm] min-h-[297mm] text-slate-900 print:shadow-none print:border-none print:w-full print:p-0 print:m-0"
        >
          
          {/* Cabeçalho */}
          <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
            <h1 className="text-3xl font-bold uppercase tracking-wide">Livro Caixa</h1>
            <h2 className="text-lg font-medium mt-1 text-slate-700">{process.env.REACT_APP_CHURCH_NAME || "IGREJA DEMONSTRAÇÃO"}</h2>
            <p className="text-sm text-slate-500 mt-2 font-mono">
              REFERÊNCIA: <span className="font-bold text-slate-900">{format(localSelectedMonth, 'MMMM / yyyy', { locale: ptBR }).toUpperCase()}</span>
            </p>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-0 border border-slate-300 rounded-lg overflow-hidden mb-6 text-sm">
            <div className="p-3 text-center border-r border-slate-300 bg-emerald-50/50">
              <span className="block text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Total Entradas</span>
              <span className="block text-lg font-bold text-emerald-700">{formatCurrency(entradasMes)}</span>
            </div>
            <div className="p-3 text-center border-r border-slate-300 bg-rose-50/50">
              <span className="block text-[10px] uppercase font-bold text-rose-800 tracking-wider">Total Saídas</span>
              <span className="block text-lg font-bold text-rose-700">{formatCurrency(saidasMes)}</span>
            </div>
            <div className="p-3 text-center bg-slate-50/50">
              <span className="block text-[10px] uppercase font-bold text-slate-600 tracking-wider">Resultado Mês</span>
              <span className={`block text-lg font-bold ${saldoMes >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>{formatCurrency(saldoMes)}</span>
            </div>
          </div>

          {/* Saldos */}
          <div className="flex justify-between items-center bg-slate-100 p-3 rounded border border-slate-200 mb-6 text-xs font-medium uppercase tracking-wide">
             <div>Saldo Anterior: <span className="font-bold text-slate-800 ml-1">{formatCurrency(saldoMesAnterior)}</span></div>
             <div>+ Resultado: <span className="font-bold text-slate-800 ml-1">{formatCurrency(saldoMes)}</span></div>
             <div className="bg-slate-800 text-white px-2 py-0.5 rounded">A Transportar: <span className="font-bold ml-1">{formatCurrency(saldoATransportar)}</span></div>
          </div>

          {/* Tabela */}
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-800">
                <th className="py-2 text-left w-12 font-bold uppercase">Dia</th>
                <th className="py-2 text-left font-bold uppercase">Histórico / Descrição</th>
                <th className="py-2 text-center w-10 font-bold uppercase">Doc.</th>
                <th className="py-2 text-right w-24 font-bold uppercase text-rose-800">Débito</th>
                <th className="py-2 text-right w-24 font-bold uppercase text-emerald-800">Crédito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {transactionsInMonth.map((t, idx) => {
                const acc = allChartOfAccounts.find(a => a.id === t.chartOfAccountId);
                const isRev = acc?.type === 'revenue';
                const member = allMembers.find(m => m.id === t.memberId)?.name;
                
                let desc = t.descricao;
                if (member) desc += ` - ${member}`;
                if (t.installmentCount && t.installmentCount > 1) desc += ` (${t.installmentNumber}/${t.installmentCount})`;
                if (acc) desc += ` [${acc.name}]`;

                return (
                  <tr key={t.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                    <td className="py-2 text-slate-500 font-mono">{format(new Date(t.data), 'dd')}</td>
                    <td className="py-2 text-slate-800">{desc}</td>
                    <td className="py-2 text-center text-[10px]">
                      {t.receiptUrl ? <span className="text-slate-900 font-bold">SIM</span> : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="py-2 text-right font-medium text-rose-700">
                      {!isRev ? formatCurrency(t.valor) : ''}
                    </td>
                    <td className="py-2 text-right font-medium text-emerald-700">
                      {isRev ? formatCurrency(t.valor) : ''}
                    </td>
                  </tr>
                );
              })}
              {transactionsInMonth.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400 italic">Nenhuma movimentação registrada.</td></tr>
              )}
            </tbody>
            <tfoot className="border-t-2 border-slate-800 bg-slate-50">
              <tr>
                <td colSpan={3} className="py-3 text-right font-bold uppercase text-xs pr-4">Totais do Período</td>
                <td className="py-3 text-right font-bold text-rose-700 border-t border-slate-300">{formatCurrency(saidasMes)}</td>
                <td className="py-3 text-right font-bold text-emerald-700 border-t border-slate-300">{formatCurrency(entradasMes)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Footer Assinaturas */}
          <div className="mt-16 mb-8 pt-8 border-t border-slate-200 grid grid-cols-2 gap-16 text-center break-inside-avoid">
             <div>
               <div className="border-t border-slate-400 w-full mb-2"></div>
               <p className="text-xs font-bold uppercase text-slate-600">Tesoureiro Responsável</p>
             </div>
             <div>
               <div className="border-t border-slate-400 w-full mb-2"></div>
               <p className="text-xs font-bold uppercase text-slate-600">Pastor / Presidente</p>
             </div>
          </div>

          {/* SEÇÃO DE ANEXOS */}
          {transactionsWithReceipts.length > 0 && (
            <div className="page-break-before mt-8 pt-8 border-t-2 border-dashed border-slate-800">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold uppercase text-slate-900">Anexos e Comprovantes</h1>
                <p className="text-sm text-slate-500">Documentação comprobatória das movimentações</p>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {transactionsWithReceipts.map((t, idx) => (
                  <div key={t.id} className="border border-slate-300 rounded-lg p-4 bg-slate-50 break-inside-avoid shadow-sm">
                    <div className="flex justify-between items-start border-b border-slate-300 pb-2 mb-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-200 px-2 py-0.5 rounded">Comprovante #{idx + 1}</span>
                        <p className="font-bold text-slate-900 text-lg mt-1">{t.descricao}</p>
                        <p className="text-xs text-slate-500">{format(new Date(t.data), 'dd/MM/yyyy')} • {t.paymentMethod.toUpperCase()}</p>
                      </div>
                      <div className="text-right">
                         <p className={`text-xl font-bold ${t.tipo === 'revenue' ? 'text-emerald-700' : 'text-rose-700'}`}>
                           R$ {formatCurrency(t.valor)}
                         </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-center bg-white border border-slate-200 p-2 rounded">
                      {/* CORREÇÃO DO ERRO DE TIPO AQUI: receiptUrl || undefined */}
                      <img 
                        src={t.receiptUrl || undefined} 
                        alt={`Comprovante ${t.descricao}`} 
                        className="max-h-[600px] max-w-full object-contain"
                        crossOrigin="anonymous" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-center text-slate-300 mt-8 font-mono break-inside-avoid">
            Gerado automaticamente pelo Sistema Gestão Financeira em {format(new Date(), 'dd/MM/yyyy HH:mm')}
          </p>

        </div>
      </div>
    </div>
  );
}