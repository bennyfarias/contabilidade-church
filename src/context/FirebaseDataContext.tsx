import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Transaction, ChartOfAccount, Member } from '../types';

interface FirebaseDataContextType {
  allTransactions: Transaction[];
  allChartOfAccounts: ChartOfAccount[];
  allMembers: Member[];
  isLoadingFirebaseData: boolean;
}

const FirebaseDataContext = createContext<FirebaseDataContextType>({} as FirebaseDataContextType);

export const useFirebaseData = () => useContext(FirebaseDataContext);

export const FirebaseDataProvider = ({ children }: { children: ReactNode }) => {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allChartOfAccounts, setAllChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [isLoadingFirebaseData, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Escutar Transações (Real-time)
    const qTransactions = query(collection(db, 'transacoes'), orderBy('data', 'desc'));
    const unsubTransactions = onSnapshot(qTransactions, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          // Converte Timestamp para Date
          data: d.data?.toDate ? d.data.toDate() : new Date(),
          dueDate: d.dueDate?.toDate ? d.dueDate.toDate() : null
        } as Transaction;
      });
      setAllTransactions(data);
    });

// 2. Escutar Plano de Contas
    const unsubCategories = onSnapshot(collection(db, 'chartOfAccounts'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChartOfAccount));
      // Ordena alfabeticamente
      data.sort((a, b) => a.name.localeCompare(b.name));
      setAllChartOfAccounts(data);
    });

    // 3. Escutar Membros
    const unsubMembers = onSnapshot(collection(db, 'members'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
      data.sort((a, b) => a.name.localeCompare(b.name));
      setAllMembers(data);
    });
    setIsLoading(false);

    // Cleanup (Para de escutar quando fecha o app)
    return () => {
      unsubTransactions();
      unsubCategories();
      unsubMembers();
    };
  }, []);

  return (
    <FirebaseDataContext.Provider value={{ allTransactions, allChartOfAccounts, allMembers, isLoadingFirebaseData }}>
      {children}
    </FirebaseDataContext.Provider>
  );
};