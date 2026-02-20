export type TransactionType = 'revenue' | 'expense';
export type PaymentMethod = 'pix' | 'dinheiro' | 'transferencia' | 'debito' | 'credito' | 'boleto';

export interface Transaction {
  id?: string;
  uid: string;
  descricao: string;
  valor: number;
  tipo: TransactionType;
  fundo: string;
  chartOfAccountId: string;
  memberId: string | null;
  paymentMethod: PaymentMethod;
  data: Date;
  dueDate: Date | null;
  status: 'pago' | 'pendente';
  installmentNumber?: number;
  installmentCount?: number;
  originalTransactionId?: string;
  receiptUrl?: string | null; 
}

export interface Member {
  id: string;
  name: string;
  contact?: string;
  isJointTithe: boolean;
  jointTithePartnerName?: string;
}

export interface ChartOfAccount {
  id: string;
  name: string;
  type: TransactionType;
  specifications: string[];
  orcamento?: number;
}

// CORREÇÃO AQUI:
// Ajustamos esta interface para bater com o formato usado em src/utils/constants.ts
export interface CategoryOption {
  type: TransactionType;
  specs: string[];
}