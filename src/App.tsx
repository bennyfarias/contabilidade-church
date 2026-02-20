import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';

// Importação sem extensão (o padrão correto)
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/Sidebar';
import MainHeader from './components/MainHeader';
import { FirebaseDataProvider } from './context/FirebaseDataContext';

import Home from './pages/Home';
import TransactionsPage from './pages/TransactionsPage';
import MembersPage from './pages/MembersPage';
import MonthlyBudgetPage from './pages/MonthlyBudgetPage';
import ReportsPage from './pages/ReportsPage';
import CashBookPage from './pages/CashBookPage';

// Importação do CSS (Tailwind)
import './index.css'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        
        {/* Rotas Protegidas */}
        <Route
          path='/'
          element={
            <PrivateRoute>
              <FirebaseDataProvider>
                <AppLayout />
              </FirebaseDataProvider>
            </PrivateRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path='transactions' element={<TransactionsPage />} />
          <Route path='members' element={<MembersPage />} />
          <Route path='accounts' element={<MonthlyBudgetPage />} />
          <Route path='reports' element={<ReportsPage />} />
          <Route path='livro-caixa' element={<CashBookPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleMonthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.value) return;
    const [year, month] = event.target.value.split('-').map(Number);
    setSelectedMonth(new Date(year, month - 1, 1));
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar controla sua própria largura baseada na prop */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MainHeader 
          toggleSidebar={toggleSidebar} 
          isSidebarCollapsed={isSidebarCollapsed} 
          selectedMonth={selectedMonth}
          handleMonthChange={handleMonthChange}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet context={{ selectedMonth }} />
        </main>
      </div>
    </div>
  );
}

export default App;