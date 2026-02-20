import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Users, 
  Wallet, 
  PieChart, 
  BookOpen, 
  LogOut,
  X
} from 'lucide-react';

// --- AQUI ESTAVA O ERRO: Adicionamos toggleSidebar na interface ---
interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ isCollapsed, toggleSidebar }: SidebarProps) {
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Erro ao sair", error);
    }
  };

  const navItems = [
    { path: '/', label: 'Visão Geral', icon: LayoutDashboard },
    { path: '/transactions', label: 'Transações', icon: ArrowRightLeft },
    { path: '/members', label: 'Membros', icon: Users },
    { path: '/accounts', label: 'Orçamento', icon: Wallet },
    { path: '/reports', label: 'Relatórios', icon: PieChart },
    { path: '/livro-caixa', label: 'Livro Caixa', icon: BookOpen },
  ];

  return (
    <>
      {/* Mobile Overlay (só aparece em telas pequenas quando aberto) */}
      <div 
        className={`
          fixed inset-0 z-20 bg-black/50 transition-opacity md:hidden
          ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
        onClick={toggleSidebar}
      />

      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-30
          bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out flex flex-col h-full
          ${isCollapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-64'}
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {isCollapsed ? (
            <span className="text-xl font-bold text-sky-500 mx-auto">GF</span>
          ) : (
            <span className="text-lg font-bold tracking-wide text-white">
              Gestão<span className="text-sky-500">Financeira</span>
            </span>
          )}
          {/* Botão de fechar apenas no mobile */}
          <button onClick={toggleSidebar} className="md:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  // Fecha sidebar no mobile ao clicar
                  if (window.innerWidth < 768) toggleSidebar();
                }}
                className={`
                  flex items-center px-3 py-3 rounded-lg transition-colors group
                  ${isActive 
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/20' 
                    : 'hover:bg-slate-800 hover:text-white'}
                `}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
                
                {!isCollapsed && (
                  <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
                )}
                
                {/* Tooltip on collapse (Desktop only) */}
                {isCollapsed && (
                  <div className="hidden md:block absolute left-16 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center rounded-lg px-3 py-2 text-red-400 hover:bg-red-500/10 transition-colors
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="ml-3 font-medium text-sm whitespace-nowrap">Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
}