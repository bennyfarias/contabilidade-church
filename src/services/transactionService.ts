import { 
  collection, addDoc, updateDoc, deleteDoc, doc, getDocs, 
  query, where, Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Transaction } from '../types';

const COLLECTION = 'transacoes';

export const TransactionService = {
  // CREATE
  create: async (transaction: Omit<Transaction, 'id'>) => {
    // Converter Date para Timestamp do Firestore
    const payload = {
      ...transaction,
      data: Timestamp.fromDate(transaction.data),
      dueDate: transaction.dueDate ? Timestamp.fromDate(transaction.dueDate) : null
    };
    
    const docRef = await addDoc(collection(db, COLLECTION), payload);
    return docRef.id;
  },

  // READ ALL
  getAll: async () => {
    const q = query(collection(db, COLLECTION));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Converter Timestamp de volta para Date
        data: data.data?.toDate ? data.data.toDate() : new Date(),
        dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : null
      } as Transaction;
    });
  },

  // UPDATE
  update: async (id: string, updates: Partial<Transaction>) => {
    const docRef = doc(db, COLLECTION, id);
    
    // CORREÇÃO: Usamos 'any' aqui para permitir que 'data' seja um Timestamp temporariamente
    const formattedUpdates: any = { ...updates };

    if (updates.data) {
        formattedUpdates.data = Timestamp.fromDate(new Date(updates.data));
    }
    
    if (updates.dueDate) {
        formattedUpdates.dueDate = Timestamp.fromDate(new Date(updates.dueDate));
    }

    await updateDoc(docRef, formattedUpdates);
  },

  // DELETE
  delete: async (id: string) => {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  }
};