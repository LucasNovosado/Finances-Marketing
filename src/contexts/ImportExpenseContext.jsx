// src/contexts/ImportExpenseContext.jsx

import React, { createContext, useState, useContext } from 'react';

// Criação do contexto
const ImportExpenseContext = createContext();

// Hook personalizado para usar o contexto
export const useImportExpense = () => useContext(ImportExpenseContext);

// Provedor do contexto
export const ImportExpenseProvider = ({ children }) => {
  // Estado para o processo de importação
  const [fileData, setFileData] = useState(null);
  const [mappedData, setMappedData] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importStats, setImportStats] = useState({
    totalItems: 0,
    totalSaved: 0,
    errors: 0
  });

  // Função para redefinir o estado de importação
  const resetImport = () => {
    setFileData(null);
    setMappedData(null);
    setPreviewData(null);
    setCurrentStep(1);
    setError('');
    setSuccess('');
    setImportStats({
      totalItems: 0,
      totalSaved: 0,
      errors: 0
    });
  };

  // Função para avançar para o próximo passo
  const goToNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  // Função para voltar para o passo anterior
  const goToPreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Função para ir para um passo específico
  const goToStep = (step) => {
    if (step >= 1 && step <= 4) {
      setCurrentStep(step);
    }
  };

  // Valores e funções que serão disponibilizados pelo contexto
  const value = {
    fileData,
    setFileData,
    mappedData,
    setMappedData,
    previewData,
    setPreviewData,
    currentStep,
    setCurrentStep,
    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,
    importStats,
    setImportStats,
    resetImport,
    goToNextStep,
    goToPreviousStep,
    goToStep
  };

  return (
    <ImportExpenseContext.Provider value={value}>
      {children}
    </ImportExpenseContext.Provider>
  );
};

export default ImportExpenseContext;