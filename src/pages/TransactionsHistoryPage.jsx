import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useFirebaseData } from '../context/FirebaseDataContext';
import { format } from 'date-fns';
import TransactionForm from '../components/TransactionForm'; // Importar o formulário de transação

export default function TransactionsHistoryPage() {
  const { allTransactions, allChartOfAccounts, allMembers, isLoadingFirebaseData, errorFirebaseData } = useFirebaseData();

  const [transactionsDisplay, setTransactionsDisplay] = useState([]);
  const [chartOfAccountsMap, setChartOfAccountsMap] = useState({});
  const [membersMap, setMembersMap] = useState({});

  // Estados para edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentTransactionToEdit, setCurrentTransactionToEdit] = useState(null);

  useEffect(() => {
    if (isLoadingFirebaseData || errorFirebaseData) return;

    // Criar mapas para fácil lookup de categorias e membros
    const accMap = {};
    allChartOfAccounts.forEach(acc => accMap[acc.id] = acc);
    setChartOfAccountsMap(accMap);

    const memMap = {};
    allMembers.forEach(member => memMap[member.id] = member.name);
    setMembersMap(memMap);

    // Ordenar transações por data de Lançamento (mais recente primeiro)
    // Se a data de lançamento não estiver presente, usa a data de criação do documento (se disponível no Firestore)
    const sortedTransactions = [...allTransactions].sort((a, b) => {
        const dateA = a.data?.toDate() || new Date(0); // Usa 'data' do documento ou um timestamp zero
        const dateB = b.data?.toDate() || new Date(0);
        return dateB.getTime() - dateA.getTime(); // Ordem decrescente (mais recente primeiro)
    });
    setTransactionsDisplay(sortedTransactions);

  }, [allTransactions, allChartOfAccounts, allMembers, isLoadingFirebaseData, errorFirebaseData]);

  const formatDate = (timestamp) => {
    if (!timestamp || timestamp.seconds === undefined) return 'N/A';
    return format(new Date(timestamp.seconds * 1000), 'dd/MM/yyyy');
  };

  // Funções para edição
  const handleEditClick = (transaction) => {
    setCurrentTransactionToEdit(transaction);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentTransactionToEdit(null);
  };

  const handleSaveEditedTransaction = async (updatedTransactionData) => {
    try {
      const transactionRef = doc(db, 'transacoes', currentTransactionToEdit.id);
      await updateDoc(transactionRef, updatedTransactionData);
      alert('Transação atualizada com sucesso!');
      handleCloseEditModal();
      // O useFirebaseData já deve re-fetchar os dados, atualizando a lista automaticamente
    } catch (error) {
      console.error("Erro ao atualizar transação:", error);
      alert(`Erro ao atualizar transação: ${error.message}`);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm("Tem certeza que deseja excluir esta transação? Esta ação é irreversível.")) {
      try {
        await deleteDoc(doc(db, 'transacoes', transactionId));
        alert('Transação excluída com sucesso!');
        // O useFirebaseData já deve re-fetchar os dados
      } catch (error) {
        console.error("Erro ao excluir transação:", error);
        alert(`Erro ao excluir transação: ${error.message}`);
      }
    }
  };


  if (isLoadingFirebaseData) {
    return <p className="text-center">Carregando histórico de transações...</p>;
  }
  if (errorFirebaseData) {
    return <p className="error-message text-center">Erro ao carregar dados: {errorFirebaseData}</p>;
  }

  return (
    <div className="dashboard-content"> {/* Mantendo a classe para reutilizar estilos */}
      <div className="recent-transactions-section"> {/* Mantendo a classe para reutilizar estilos */}
        <h2>Histórico de Transações</h2>
        {transactionsDisplay.length === 0 ? (
          <p className="text-center">Nenhuma transação encontrada.</p>
        ) : (
          <div className="table-responsive">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Fundo</th>
                  <th>Categoria</th>
                  <th>Membro</th>
                  <th>Método Pgto.</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {transactionsDisplay.map(transaction => {
                  const category = chartOfAccountsMap[transaction.chartOfAccountId];
                  const memberName = transaction.memberId ? membersMap[transaction.memberId] : 'N/A';
                  const valueClass = transaction.tipo === 'revenue' ? 'value-income' : 'value-expense';
                  return (
                    <tr key={transaction.id}>
                      <td>{formatDate(transaction.data)}</td>
                      <td>{transaction.tipo === 'revenue' ? 'Receita' : 'Despesa'}</td>
                      <td>{transaction.descricao}</td>
                      <td className={valueClass}>R$ {transaction.valor.toFixed(2)}</td>
                      <td>{transaction.fundo}</td>
                      <td>{category ? category.name : 'N/A'}</td>
                      <td>{memberName}</td>
                      <td>{transaction.paymentMethod}</td>
                      <td className="actions-cell">
                        <button onClick={() => handleEditClick(transaction)} className="edit-btn">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button onClick={() => handleDeleteTransaction(transaction.id)} className="delete-btn">
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Edição de Transação */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal-btn" onClick={handleCloseEditModal}>&times;</button>
            <h3>Editar Transação</h3>
            <TransactionForm 
              initialData={currentTransactionToEdit} 
              onSuccess={handleCloseEditModal} 
              onSave={handleSaveEditedTransaction}
            />
          </div>
        </div>
      )}
    </div>
  );
}