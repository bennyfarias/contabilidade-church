// src/utils/standardAccounts.js

export const PLANO_PADRAO = [
  // ============================================================
  // RECEITAS (Atualizadas conforme a lista da Sexta Igreja)
  // ============================================================
  {
    name: "Acampamento (Receita)",
    type: "revenue",
    specifications: ["Inscrição"],
    orcamento: 0
  },
  {
    name: "Depósito",
    type: "revenue",
    specifications: ["Depósito"],
    orcamento: 0
  },
  {
    name: "Dinheiro (Especie)",
    type: "revenue",
    specifications: ["Dinheiro Especie"], // Fundamental para gestão de caixa
    orcamento: 0
  },
  {
    name: "Dízimos",
    type: "revenue",
    specifications: ["Dízimo Regular", "Dízimo Esporádico"],
    orcamento: 0
  },
  {
    name: "Evento",
    type: "revenue",
    specifications: ["Casais"],
    orcamento: 0
  },
  {
    name: "Extras",
    type: "revenue",
    specifications: ["Rendimentos do Fundo", "Resgate do Fundo"],
    orcamento: 0
  },
  {
    name: "Ofertas",
    type: "revenue",
    specifications: ["Oferta", "Oferta Missionária", "Oferta Específica"],
    orcamento: 0
  },
  {
    name: "SAF",
    type: "revenue",
    specifications: ["Mensalidade", "SAF"],
    orcamento: 0
  },
  {
    name: "Saldo",
    type: "revenue",
    specifications: ["Saldo 2024"],
    orcamento: 0
  },

  // ============================================================
  // DESPESAS (Com a correção para Rev. Hermes)
  // ============================================================
  {
    name: "Eventos/Atividades Extras", 
    type: "expense",
    specifications: ["Alimentação", "Diversas(Acampamento)", "Aluguel de Espaço"],
    orcamento: 0
  },
  {
    name: "Administrativas",
    type: "expense",
    specifications: ["Internet", "Material de Expediente", "Cartório"],
    orcamento: 0
  },
  {
    name: "Aquisição de Bens",
    type: "expense",
    specifications: ["Terreno", "Imóvel(casa ou prédio)", "Carro ou moto", "parcela de casa/terreno/carro"],
    orcamento: 0
  },
  {
    name: "Bancárias",
    type: "expense",
    specifications: ["IOF", "IR do Fundo", "Manutenção da Conta", "Taxas de trans/pix"],
    orcamento: 0
  },
  {
    name: "Conselho",
    type: "expense",
    specifications: ["Alimentação", "Reunião do Conselho"],
    orcamento: 0
  },
  {
    name: "Depósito",
    type: "expense",
    specifications: ["Déposito Bancário"],
    orcamento: 0
  },
  {
    name: "Diaconia",
    type: "expense",
    specifications: ["Atos de Misericórdia", "Santa Ceia"],
    orcamento: 0
  },
  {
    name: "Educação Cristã",
    type: "expense",
    specifications: ["Material EBD", "Livros e Revistas EBD", "Alimentação EBD", "Material EBF", "Livros e Revistas EBF", "Alimentação EBF", "Treinamento"],
    orcamento: 0
  },
  {
    name: "Empréstimo IPB",
    type: "expense",
    specifications: ["Parcela IPB/JPEF"],
    orcamento: 0
  },
  {
    name: "Empréstimo Presbitério",
    type: "expense",
    specifications: ["Parcela do Empréstimo"],
    orcamento: 0
  },
  {
    name: "Estrutura",
    type: "expense",
    specifications: ["Energia", "Seguro do Prédio", "Água", "Gás"],
    orcamento: 0
  },
  {
    name: "Funcionários",
    type: "expense",
    specifications: ["Salário/Zelador"],
    orcamento: 0
  },
  {
    name: "Investimentos",
    type: "expense",
    specifications: ["Aplicação no Fundo"],
    orcamento: 0
  },
  {
    name: "Manutenção (Geral)",
    type: "expense",
    specifications: ["Elétrica", "Descartáveis", "Hidráulica", "Materiais de Limpeza", "Material higiênico", "Utensílios", "Equipamentos (Igreja)", "Estrutura (Igreja)"],
    orcamento: 0
  },
  {
    name: "Ministérios",
    type: "expense",
    specifications: ["Louvor", "Casais"],
    orcamento: 0
  },
  {
    name: "Missões",
    type: "expense",
    specifications: ["Oferta Missionaria", "Evento"],
    orcamento: 0
  },
  {
    name: "Outros",
    type: "expense",
    specifications: ["Eventuais"],
    orcamento: 0
  },
  {
    name: "Pastoral",
    type: "expense",
    specifications: [
        "Prebenda (Rev. Hermes)", 
        "13º Salário (Rev. Hermes)", 
        "Férias (Rev. Hermes)", 
        "Combustível (Rev. Hermes)", 
        "Plano de saúde (Rev. Hermes)", 
        "Água (Rev. Hermes)", 
        "Luz (Rev. Hermes)", 
        "GPS (Rev. Hermes)", 
        "Aluguel (Rev. Hermes)", 
        "Seguro de Vida (Rev. Hermes)", 
        "Previdência Privada (Rev. Hermes)"
    ],
    orcamento: 0
  },
  {
    name: "Presbitério",
    type: "expense",
    specifications: ["Verba Presbiterial", "outros valores"],
    orcamento: 0
  },
  {
    name: "Serviços Prestados",
    type: "expense",
    specifications: ["Empresa de Limpeza", "Serralheria", "Contador"],
    orcamento: 0
  },
  {
    name: "Sociedades",
    type: "expense",
    specifications: ["UCP", "UPA", "UMP", "SAF", "UPH"],
    orcamento: 0
  },
  {
    name: "Supremo Concílio",
    type: "expense",
    specifications: ["Dízimos ao Supremo", "outro valor"],
    orcamento: 0
  }
];