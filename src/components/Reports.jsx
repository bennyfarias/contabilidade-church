import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';

export default function Reports() {
  const [reportType, setReportType] = useState('memberContributions'); // Estado para o tipo de relatório
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState([]); // Dados do relatório específico
  const [allTransactions, setAllTransactions] = useState([]); // Todas as transações para processamento
  const [members, setMembers] = useState({}); // Para resolver nomes de membros
  const [chartOfAccounts, setChartOfAccounts] = useState({}); // Para resolver nomes de contas e tipos

  useEffect(() => {
    // Busca metadados (membros e contas contábeis) uma vez
    const fetchMetadata = async () => {
      const membersSnapshot = await getDocs(collection(db, 'members'));
      const membersMap = {};
      membersSnapshot.forEach(doc => {
        membersMap[doc.id] = doc.data().name;
      });
      setMembers(membersMap);

      const accountsSnapshot = await getDocs(collection(db, 'chartOfAccounts'));
      const accountsMap = {};
      accountsSnapshot.forEach(doc => {
        accountsMap[doc.id] = { name: doc.data().name, type: doc.data().type }; // Armazenar nome e tipo
      });
      setChartOfAccounts(accountsMap);
    };
    fetchMetadata();

    // Listener para transações do usuário logado
    // Este onSnapshot vai atualizar 'allTransactions' sempre que houver mudança
    const q = query(collection(db, 'transacoes'), where('uid', '==', auth.currentUser.uid));
    const unsub = onSnapshot(q, snapshot => {
      setAllTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub(); // Limpa o listener ao desmontar
  }, []); // Executa apenas na montagem do componente

  // Efeito para gerar o relatório sempre que o tipo, datas ou transações mudarem
  useEffect(() => {
    generateReport();
  }, [reportType, startDate, endDate, allTransactions, members, chartOfAccounts]); // Dependências para re-gerar o relatório

  const generateReport = () => {
    let filteredTransactions = allTransactions;

    // Filtro por período de datas
    if (startDate) {
      const startTimestamp = new Date(startDate);
      filteredTransactions = filteredTransactions.filter(t => t.data.seconds * 1000 >= startTimestamp.getTime());
    }
    if (endDate) {
      const endTimestamp = new Date(endDate + 'T23:59:59'); // Fim do dia
      filteredTransactions = filteredTransactions.filter(t => t.data.seconds * 1000 <= endTimestamp.getTime());
    }

    // Processa os dados de acordo com o tipo de relatório
    let processedData = [];

    switch (reportType) {
      case 'memberContributions':
        const memberContributions = {};
        filteredTransactions.forEach(t => {
          // Apenas dízimos/ofertas são contribuições, verifique o tipo da conta contábil
          const accountType = chartOfAccounts[t.chartOfAccountId]?.type;
          if (t.memberId && accountType === 'revenue') { // Apenas transações de receita associadas a membros
            memberContributions[t.memberId] = memberContributions[t.memberId] || { totalContributions: 0, transactions: [] };
            memberContributions[t.memberId].totalContributions += t.valor;
            memberContributions[t.memberId].transactions.push(t);
          }
        });
        processedData = Object.entries(memberContributions).map(([memberId, data]) => ({
          memberId,
          memberName: members[memberId] || 'Membro Desconhecido',
          ...data
        }));
        break;

      case 'expenseSummary':
        processedData = filteredTransactions.filter(t => chartOfAccounts[t.chartOfAccountId]?.type === 'expense');
        // Opcional: Agrupar por categoria de despesa, etc.
        break;

      case 'incomeSummary':
        processedData = filteredTransactions.filter(t => chartOfAccounts[t.chartOfAccountId]?.type === 'revenue');
        // Opcional: Agrupar por categoria de receita, etc.
        break;

      case 'combinedSummary':
        processedData = [...filteredTransactions]; // Inclui todas as transações filtradas por data
        // Opcional: Agrupar por mês, ano, etc.
        break;

      default:
        processedData = [];
    }

    // Ordena as transações por data para relatórios de lista
    if (reportType === 'expenseSummary' || reportType === 'incomeSummary' || reportType === 'combinedSummary') {
      processedData.sort((a, b) => a.data.seconds - b.data.seconds);
    }

    setReportData(processedData);
  };


  // Função auxiliar para formatar a data
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    // Firebase Timestamp object has .seconds and .nanoseconds
    return new Date(timestamp.seconds * 1000).toLocaleDateString('pt-BR');
  };

  return (
    <div className="report-section">
      <h2>Relatórios Financeiros</h2>
      <div className="filters form">
        <label>Tipo de Relatório:</label>
        <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
          <option value="memberContributions">Dízimos e Ofertas por Membro</option>
          <option value="incomeSummary">Relatório de Entradas</option>
          <option value="expenseSummary">Relatório de Despesas</option>
          <option value="combinedSummary">Relatório Combinado (Entradas e Despesas)</option>
        </select>

        <label>Data Inicial:</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

        <label>Data Final:</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      <div className="report-output mt-4">
        {/* === Relatório de Dízimos e Ofertas por Membro === */}
        {reportType === 'memberContributions' && (
          <>
            <h3>Dízimos e Ofertas por Membro</h3>
            {reportData.length > 0 ? (
              <ul>
                {reportData.map(data => (
                  <li key={data.memberId}>
                    <strong>{data.memberName}</strong>: R$ {data.totalContributions.toFixed(2)}
                    <ul>
                      {data.transactions.map(t => (
                        <li key={t.id}>
                          {t.descricao} - R$ {t.valor} ({chartOfAccounts[t.chartOfAccountId]?.name || 'N/A'}, {formatDate(t.data)})
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhum dízimo ou oferta encontrado para o período/membros selecionados.</p>
            )}
          </>
        )}

        {/* === Relatório de Entradas === */}
        {reportType === 'incomeSummary' && (
          <>
            <h3>Relatório de Entradas</h3>
            {reportData.length > 0 ? (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Categoria</th>
                    <th>Membro</th>
                    <th>Método Pag.</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map(t => (
                    <tr key={t.id}>
                      <td>{formatDate(t.data)}</td>
                      <td>{t.descricao}</td>
                      <td className="value-income">R$ {t.valor.toFixed(2)}</td>
                      <td>{chartOfAccounts[t.chartOfAccountId]?.name || 'N/A'}</td>
                      <td>{t.memberId ? members[t.memberId] : 'Não Identificado'}</td>
                      <td>{t.paymentMethod}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan="2"><strong>Total Entradas:</strong></td>
                    <td className="value-income"><strong>R$ {reportData.reduce((sum, t) => sum + t.valor, 0).toFixed(2)}</strong></td>
                    <td colSpan="3"></td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p>Nenhuma entrada encontrada para o período selecionado.</p>
            )}
          </>
        )}

        {/* === Relatório de Despesas === */}
        {reportType === 'expenseSummary' && (
          <>
            <h3>Relatório de Despesas</h3>
            {reportData.length > 0 ? (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Categoria</th>
                    <th>Membro (se aplicável)</th>
                    <th>Método Pag.</th>
                    <th>Vencimento</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map(t => (
                    <tr key={t.id}>
                      <td>{formatDate(t.data)}</td>
                      <td>{t.descricao}</td>
                      <td className="value-expense">R$ {t.valor.toFixed(2)}</td>
                      <td>{chartOfAccounts[t.chartOfAccountId]?.name || 'N/A'}</td>
                      <td>{t.memberId ? members[t.memberId] : 'N/A'}</td>
                      <td>{t.paymentMethod}</td>
                      <td>{t.dueDate ? formatDate(t.dueDate) : 'N/A'}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan="2"><strong>Total Despesas:</strong></td>
                    <td className="value-expense"><strong>R$ {reportData.reduce((sum, t) => sum + t.valor, 0).toFixed(2)}</strong></td>
                    <td colSpan="4"></td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p>Nenhuma despesa encontrada para o período selecionado.</p>
            )}
          </>
        )}

        {/* === Relatório Combinado (Entradas e Despesas) === */}
        {reportType === 'combinedSummary' && (
          <>
            <h3>Relatório Combinado de Entradas e Despesas</h3>
            {reportData.length > 0 ? (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Categoria</th>
                    <th>Membro (se aplicável)</th>
                    <th>Método Pag.</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map(t => {
                    const type = chartOfAccounts[t.chartOfAccountId]?.type;
                    const valueClass = type === 'revenue' ? 'value-income' : 'value-expense';
                    return (
                      <tr key={t.id} className={type === 'revenue' ? 'row-income' : 'row-expense'}>
                        <td>{formatDate(t.data)}</td>
                        <td>{type === 'revenue' ? 'Entrada' : 'Saída'}</td>
                        <td>{t.descricao}</td>
                        <td className={valueClass}>R$ {t.valor.toFixed(2)}</td>
                        <td>{chartOfAccounts[t.chartOfAccountId]?.name || 'N/A'}</td>
                        <td>{t.memberId ? members[t.memberId] : 'N/A'}</td>
                        <td>{t.paymentMethod}</td>
                      </tr>
                    );
                  })}
                  <tr className="total-row">
                    <td colSpan="3"><strong>Total Entradas:</strong></td>
                    <td className="value-income"><strong>R$ {reportData.filter(t => chartOfAccounts[t.chartOfAccountId]?.type === 'revenue').reduce((sum, t) => sum + t.valor, 0).toFixed(2)}</strong></td>
                    <td colSpan="3"></td>
                  </tr>
                  <tr className="total-row">
                    <td colSpan="3"><strong>Total Saídas:</strong></td>
                    <td className="value-expense"><strong>R$ {reportData.filter(t => chartOfAccounts[t.chartOfAccountId]?.type === 'expense').reduce((sum, t) => sum + t.valor, 0).toFixed(2)}</strong></td>
                    <td colSpan="3"></td>
                  </tr>
                  <tr className="total-row total-balance">
                    <td colSpan="3"><strong>Saldo Total:</strong></td>
                    <td>
                      <strong>R$ {(
                        reportData.filter(t => chartOfAccounts[t.chartOfAccountId]?.type === 'revenue').reduce((sum, t) => sum + t.valor, 0) -
                        reportData.filter(t => chartOfAccounts[t.chartOfAccountId]?.type === 'expense').reduce((sum, t) => sum + t.valor, 0)
                      ).toFixed(2)}</strong>
                    </td>
                    <td colSpan="3"></td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p>Nenhuma transação encontrada para o período selecionado.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}