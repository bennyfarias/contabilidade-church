import { CategoryOption } from '../types';

/**
 * Global application constants
 */

export const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
] as const;

/**
 * Mapping of Categories to their Specifications/Subcategories.
 * This object is used for form validations and UI selection.
 */
export const SUBCATEGORY_OPTIONS: Record<string, CategoryOption> = {
  // === REVENUE (RECEITAS) ===
  'Dízimos': { type: 'revenue', specs: ['Dízimo Regular', 'Dízimo Esporádico'] },
  'Ofertas': { type: 'revenue', specs: ['Oferta', 'Oferta Missionária', 'Oferta Específica'] },
  'Aluguel': { type: 'revenue', specs: ['Prédio I', 'Prédio II'] },
  'Saldo': { type: 'revenue', specs: ['Saldo 2024', "Deposito"] },
  'Extras': { type: 'revenue', specs: ['Rendimentos do Fundo', 'Resgate do Fundo', 'Empréstimo', 'Poupança', 'Empréstimos IPB / JPEF', 'Parceira (PRER)'] },
  'Acampamento (Receita)': { type: 'revenue', specs: ['Inscrição'] },
  'SAF': { type: 'revenue', specs: ['Mensalidade'] },
  'Evento': { type: 'revenue', specs: ['SAF', 'PRER', 'Casais'] },

  // === EXPENSES (DESPESAS) ===
  'Concílios': { type: 'expense', specs: ['Repasse ao Presbitério', 'Repasse ao Supremo Concílio'] },
  'Pastoral': { type: 'expense', specs: [
    'Prebenda (Rev. Anderson)', '13º Salário (Rev. Anderson)', 'Férias (Rev. Anderson)', 
    'Combustível (Rev. Anderson)', 'Plano de saúde (Rev. Anderson)', 'Água (Rev. Anderson)', 
    'Luz (Rev. Anderson)', 'GPS (Rev. Anderson)', 'Aluguel (Rev. Anderson)', 
    'Seguro de Vida (Rev. Anderson)', 'Previdência Privada (Rev. Anderson)'
  ]},
  'Conselho': { type: 'expense', specs: ['Reunião do Conselho', 'Alimentação', 'Locomoção'] },
  'Diaconia': { type: 'expense', specs: ['Atos de Misericórdia', 'Santa Ceia'] },
  'Oferta (Despesa)': { type: 'expense', specs: ['Oferta missionária'] },
  'Sociedades': { type: 'expense', specs: ['UCP', 'UPA', 'UMPS', 'AF', 'UPH'] },
  'Ministérios': { type: 'expense', specs: ['Louvor', 'Casais', 'Visitante', 'Missões', 'Evangelismo'] },
  'Educação Cristã': { type: 'expense', specs: ['Material EBD', 'Alimentação EBD', 'Material EBF', 'Alimentação EBF', 'Livros, revistas EBD', 'Treinamento e Cursos'] },
  'Acampamento': { type: 'expense', specs: ['Aluguel', 'Alimentação', 'Diversas'] },
  'Bancárias': { type: 'expense', specs: ['Manutenção da Conta', 'IOF', 'IR do Fundo', 'Taxas de trans/pix'] },
  'Tributárias': { type: 'expense', specs: ['DAS - Simples Nacional', 'ISS', 'IPTU', 'Taxas Diversas'] },
  'Funcionários': { type: 'expense', specs: [
    'Salário/Zelador', '13º Salário/Zelador', 'Férias/Zelador', 'INSS/GPS - Zelador', 
    'Salário/Secretaria', '13º Salário/Secretaria', 'Férias/Secretaria'
  ]},
  'Serviços Prestados': { type: 'expense', specs: ['Serralheria','Contador', 'Empresa de Limpeza', 'Empresa de Segurança'] },
  'Estrutura': { type: 'expense', specs: ['Água', 'Energia', 'Telefone', 'Aluguel', 'Seguro do Prédio', 'Gás'] },
  'Administrativas': { type: 'expense', specs: ['Internet', 'Site Igreja', 'Cartório', 'Material de Expediente'] },
  'Manutenção (Geral)': { type: 'expense', specs: ['Elétrica ', 'Equipamentos (Igreja)', 'Hidráulica', 'Materiais de Limpeza', 'Utensílios'] },
  'Construção': { type: 'expense', specs: ['Construção *parcelas*', 'Reforma', 'Empréstimos IPB / JPEF'] },
  'Investimentos': { type: 'expense', specs: ['Aplicação no Fundo', 'Aplicação na Poupança'] },
  'Eventos': { type: 'expense', specs: ['Conferência Missionária', 'Aniversário da Igreja', 'Conferência'] },
} as const;

export const MASTER_CATEGORIES = Object.keys(SUBCATEGORY_OPTIONS);