import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  setDoc, 
  doc, 
  Timestamp 
} from "firebase/firestore";
import { db, auth } from "../firebase";

interface PaidObligation {
  type: 'PRE_R' | 'SINODO';
  amount: number;
  monthYear: string;
  paidAt: Date;
}

export const ObligationService = {
  /**
   * Checks if obligations are already paid for a specific month
   */
  async getPaymentStatus(monthYear: string): Promise<{ isPreRPaid: boolean; isSinodoPaid: boolean }> {
    if (!auth.currentUser) return { isPreRPaid: false, isSinodoPaid: false };

    const paidObligationsRef = collection(db, 'paidObligations', auth.currentUser.uid, 'months');
    const q = query(paidObligationsRef, where('monthYear', '==', monthYear));
    const snapshot = await getDocs(q);

    const status = { isPreRPaid: false, isSinodoPaid: false };
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.type === 'PRE_R') status.isPreRPaid = true;
      if (data.type === 'SINODO') status.isSinodoPaid = true;
    });

    return status;
  },

  /**
   * Marks an obligation as paid in Firestore
   */
  async markAsPaid(type: 'PRE_R' | 'SINODO', amount: number, monthYear: string): Promise<void> {
    if (!auth.currentUser) throw new Error("User not authenticated");

    const rootRef = doc(db, 'paidObligations', auth.currentUser.uid);
    // Ensure root document exists
    await setDoc(rootRef, { uid: auth.currentUser.uid }, { merge: true });

    await addDoc(collection(rootRef, 'months'), {
      type,
      amount,
      monthYear,
      paidAt: Timestamp.now()
    });
  }
};