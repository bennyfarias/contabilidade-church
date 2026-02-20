import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  writeBatch 
} from "firebase/firestore";
import { db } from "../firebase";
import { ChartOfAccount } from "../types";
import { PLANO_PADRAO } from "../utils/standardAccounts";

const BUDGET_COLLECTION = "monthly_budgets";
const ACCOUNTS_COLLECTION = "chartOfAccounts";

export type BudgetData = Record<string, Record<string, number>>;

export const BudgetService = {
  /**
   * Fetch budget data for a specific year
   */
  async getBudgetByYear(year: number): Promise<BudgetData> {
    const docRef = doc(db, BUDGET_COLLECTION, String(year));
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as BudgetData) : {};
  },

  /**
   * Save (Merge) budget data
   */
  async saveBudget(year: number, data: BudgetData): Promise<void> {
    const docRef = doc(db, BUDGET_COLLECTION, String(year));
    await setDoc(docRef, data, { merge: true });
  },

  /**
   * CRUD for Categories (Chart of Accounts)
   */
  async createAccount(data: Omit<ChartOfAccount, 'id'>): Promise<void> {
    await addDoc(collection(db, ACCOUNTS_COLLECTION), data);
  },

  async updateAccount(id: string, data: Partial<ChartOfAccount>): Promise<void> {
    const docRef = doc(db, ACCOUNTS_COLLECTION, id);
    await updateDoc(docRef, data);
  },

  async deleteAccount(id: string): Promise<void> {
    const docRef = doc(db, ACCOUNTS_COLLECTION, id);
    await deleteDoc(docRef);
  },

  /**
   * Batch Import Standard Accounts (Avoiding Duplicates)
   */
  async importStandardAccounts(): Promise<number> {
    const batch = writeBatch(db);
    let addedCount = 0;

    // Get existing accounts to avoid duplicates
    const existingSnapshot = await getDocs(collection(db, ACCOUNTS_COLLECTION));
    const existingNames = new Set(existingSnapshot.docs.map(d => d.data().name));

    for (const account of PLANO_PADRAO) {
      if (!existingNames.has(account.name)) {
        const newDocRef = doc(collection(db, ACCOUNTS_COLLECTION));
        batch.set(newDocRef, account);
        addedCount++;
      }
    }

    if (addedCount > 0) {
      await batch.commit();
    }
    return addedCount;
  }
};