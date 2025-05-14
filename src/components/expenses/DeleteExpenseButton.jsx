// src/components/expenses/DeleteExpenseButton.jsx

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import expenseService from '../../services/expenseService';

/**
 * Componente para excluir um lançamento de despesa
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.expense - Dados da despesa a ser excluída
 * @param {Function} props.onDeleteSuccess - Função a ser chamada após exclusão bem-sucedida
 * @param {Function} props.onError - Função opcional para lidar com erros
 */
const DeleteExpenseButton = ({ expense, onDeleteSuccess, onError }) => {
  const [loading, setLoading] = useState(false);

  // Confirma e executa a exclusão do lançamento
  const handleDelete = async () => {
    if (!expense?.id) return;

    // Pede confirmação ao usuário
    const confirmDelete = window.confirm(
      'Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.'
    );

    if (!confirmDelete) return;

    try {
      setLoading(true);
      
      // Chama o serviço para excluir a despesa
      const result = await expenseService.deleteExpense(expense.id);
      
      // Se a exclusão foi bem-sucedida, notifica o componente pai
      if (result && onDeleteSuccess) {
        onDeleteSuccess(expense.id);
      }
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      
      // Notifica o componente pai sobre o erro, se a função de callback for fornecida
      if (onError) {
        onError('Não foi possível excluir o lançamento. Tente novamente mais tarde.');
      } else {
        // Caso não tenha callback de erro, exibe um alerta genérico
        alert('Erro ao excluir lançamento: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="delete-row-button"
      onClick={handleDelete}
      title="Excluir lançamento"
      disabled={loading}
    >
      <Trash2 size={16} />
    </button>
  );
};

export default DeleteExpenseButton;