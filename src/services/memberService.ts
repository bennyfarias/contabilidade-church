import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc,
  getDocs,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "../firebase";
import { Member } from "../types";

const COLLECTION = "members";

export const MemberService = {
  /**
   * Fetch all members ordered by name
   */
  async getAll(): Promise<Member[]> {
    const q = query(collection(db, COLLECTION), orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
  },

  /**
   * Create a new member
   */
  async create(data: Omit<Member, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), data);
    return docRef.id;
  },

  /**
   * Update an existing member
   */
  async update(id: string, data: Partial<Member>): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, data);
  },

  /**
   * Delete a member
   */
  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  }
};