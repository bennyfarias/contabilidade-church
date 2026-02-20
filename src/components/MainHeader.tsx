import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Menu, Calendar } from 'lucide-react';

interface MainHeaderProps {
  toggleSidebar: () => void;
  isSidebarCollapsed: boolean;
  selectedMonth: Date;
  handleMonthChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function MainHeader({ toggleSidebar, selectedMonth, handleMonthChange }: MainHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 shadow-sm z-10">
      
      {/* Lado Esquerdo: Botão Menu (Mobile) + Título */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar} 
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 md:hidden focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <Menu size={24} />
        </button>
        
        <div>
          <h2 className="text-xl font-bold text-slate-800 hidden sm:block">Tesouraria</h2>
          <p className="text-xs text-slate-500 sm:hidden">
            {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Lado Direito: Seletor de Data */}
      <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 px-3 py-1.5">
        <Calendar size={18} className="text-slate-400 mr-2" />
        <input
          type="month"
          value={format(selectedMonth, 'yyyy-MM')}
          onChange={handleMonthChange}
          className="bg-transparent border-none text-sm text-slate-700 font-medium focus:ring-0 cursor-pointer outline-none"
        />
      </div>
    </header>
  );
}