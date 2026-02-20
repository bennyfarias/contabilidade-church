import { useState, useEffect } from 'react';
import { addDoc, collection, onSnapshot, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { MASTER_CATEGORIES, SUBCATEGORY_OPTIONS } from '../utils/constants'; // NOVO: Importar do arquivo compartilhado


export default function ChartOfAccounts() {
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState('revenue');
  const [budget, setBudget] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [accountToEdit, setAccountToEdit] = useState(null);

  const [availableSpecsOptions, setAvailableSpecsOptions] = useState([]);
  const [selectedSpecs, setSelectedSpecs] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'chartOfAccounts'));
    const unsub = onSnapshot(q, (snapshot) => {
      setAccounts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // Quando o nome da conta muda, atualiza as opções de especificações com base em SUBCATEGORY_OPTIONS
    if (accountName && SUBCATEGORY_OPTIONS[accountName]) {
      setAvailableSpecsOptions(SUBCATEGORY_OPTIONS[accountName].specs); // Acessa a propriedade 'specs'
      if (!accountToEdit) {
        setSelectedSpecs([]); 
      }
    } else {
      setAvailableSpecsOptions([]);
      setSelectedSpecs([]);
    }
  }, [accountName, accountToEdit]);

  const handleSpecChange = (spec) => {
    setSelectedSpecs(prevSpecs => 
      prevSpecs.includes(spec)
        ? prevSpecs.filter(s => s !== spec)
        : [...prevSpecs, spec]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const parsedBudget = parseFloat(budget) || 0;

    // NOVO: Pega o tipo da categoria diretamente do SUBCATEGORY_OPTIONS
    const selectedCategoryType = SUBCATEGORY_OPTIONS[accountName]?.type;
    if (!selectedCategoryType) {
      alert('Por favor, selecione uma Classificação Principal válida.');
      return;
    }
    // Garante que accountType no formulário corresponde ao tipo definido nas constantes
    if (accountType !== selectedCategoryType) {
        alert(`O tipo selecionado no formulário (${accountType === 'revenue' ? 'Receita' : 'Despesa'}) não corresponde ao tipo padrão da categoria "${accountName}" nas constantes (${selectedCategoryType === 'revenue' ? 'Receita' : 'Despesa'}). Por favor, corrija o tipo ou selecione outra categoria.`);
        return;
    }


    if (accountToEdit) {
      await updateDoc(doc(db, 'chartOfAccounts', accountToEdit.id), {
        name: accountName,
        type: accountType, // accountType já vem do select
        specifications: selectedSpecs,
        orcamento: parsedBudget,
      });
      setAccountToEdit(null);
    } else {
      const existingAccountQuery = query(
        collection(db, 'chartOfAccounts'),
        where('name', '==', accountName),
        where('type', '==', accountType) // Verifica por nome e tipo
      );
      const existingAccountsSnapshot = await getDocs(existingAccountQuery);

      if (!existingAccountsSnapshot.empty) {
        alert(`Já existe uma conta "${accountName}" do tipo "${accountType === 'revenue' ? 'Receita' : 'Despesa'}". Para adicionar mais especificações ou definir o orçamento, por favor, clique no ícone de edição (✏️) ao lado da conta existente na lista abaixo.`);
        return;
      }

      await addDoc(collection(db, 'chartOfAccounts'), {
        name: accountName,
        type: accountType,
        specifications: selectedSpecs,
        orcamento: parsedBudget,
      });
    }
    setAccountName('');
    setAccountType('revenue');
    setBudget('');
    setSelectedSpecs([]);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja realmente excluir esta conta contábil? Isso pode afetar transações existentes!')) {
      await deleteDoc(doc(db, 'chartOfAccounts', id));
    }
  };

  const handleEdit = (account) => {
    setAccountToEdit(account);
    setAccountName(account.name);
    setAccountType(account.type);
    setBudget(account.orcamento || '');
    setSelectedSpecs(account.specifications || []); 
  };

  const handleCancelEdit = () => {
    setAccountToEdit(null);
    setAccountName('');
    setAccountType('revenue');
    setBudget('');
    setSelectedSpecs([]);
  };

  return (
    <div className="form">
      <h2>{accountToEdit ? 'Editar Conta Contábil' : 'Nova Conta Contábil'}</h2>
      <form onSubmit={handleSubmit}>
        <select value={accountName} onChange={(e) => setAccountName(e.target.value)} required>
          <option value="">-- Selecione a Classificação Principal --</option>
          {MASTER_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select value={accountType} onChange={(e) => setAccountType(e.target.value)}>
          <option value="revenue">Receita</option>
          <option value="expense">Despesa</option>
        </select>

        <div className="input-with-icon">
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Orçamento Mensal (R$)"
            min="0"
          />
          <i className="fas fa-money-bill-wave icon-inside-input"></i>
        </div>

        <label className="input-label-spacing">Especificações:</label>
        {accountName && availableSpecsOptions.length > 0 ? (
          <div className="specs-checkbox-group">
            {availableSpecsOptions.map((spec, index) => (
              <label key={index} className="spec-checkbox-item">
                <input
                  type="checkbox"
                  value={spec}
                  checked={selectedSpecs.includes(spec)}
                  onChange={() => handleSpecChange(spec)}
                />
                {spec}
              </label>
            ))}
          </div>
        ) : accountName ? (
            <p className="no-specs-message">Nenhuma especificação predefinida para esta categoria. Selecione outra categoria ou o campo ficará vazio.</p>
        ) : (
            <p className="no-specs-message">Selecione uma categoria principal para ver as especificações.</p>
        )}
        

        <button type="submit">{accountToEdit ? 'Salvar Edição' : 'Adicionar Conta'}</button>
        {accountToEdit && (
          <button type="button" onClick={handleCancelEdit} className="cancel-btn">Cancelar</button>
        )}
      </form>

      <ul className="lista mt-4">
        {accounts.map((account) => (
          <li key={account.id}>
            <div>
              <strong>{account.name}</strong> ({account.type === 'revenue' ? 'Receita' : 'Despesa'})
              {account.orcamento !== undefined && account.orcamento !== null && (
                  <span> - Orçamento: R$ {account.orcamento.toFixed(2)}</span>
              )}
              {account.specifications && account.specifications.length > 0 && (
                <br />
              )}
              {account.specifications && account.specifications.length > 0 && (
                <small>Especificações: {account.specifications.join(', ')}</small>
              )}
            </div>
            <div>
              <button onClick={() => handleEdit(account)}>✏️</button>
              <button onClick={() => handleDelete(account.id)}>🗑️</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}