// src/pages/ImportExpensePage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { saveExpensesToParse } from '../services/importService';
import FileUploader from '../components/import/FileUploader';
import ImportPreview from '../components/import/ImportPreview';
import ImportMapping from '../components/import/ImportMapping';
import ImportConfirmation from '../components/import/ImportConfirmation';
import './ImportExpensePage.css';

const ImportExpensePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [fileData, setFileData] = useState(null);
  const [mappedData, setMappedData] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [importStats, setImportStats] = useState({
    totalItems: 0,
    totalSaved: 0,
    errors: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se o usuário está logado usando authService
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      // Se não estiver logado, redireciona para o login
      navigate('/');
      return;
    }
    
    setUser(currentUser);
  }, [navigate]);

  const handleNavigateBack = () => {
    navigate('/dashboard');
  };

  const handleFileUploaded = (data) => {
    setFileData(data);
    setCurrentStep(2);
  };

 // Modificação para o arquivo src/pages/ImportExpensePage.jsx
// Localizar a função handleMappingComplete e modificá-la assim:

const handleMappingComplete = (mappedData) => {
    // Preservar exatamente os valores originais
    const dadosPreservados = mappedData.map(item => {
      // Certifique-se de que os valores não são modificados
      return {
        ...item,
        // Preservar o valor original sem transformações
        valorPago: item.valorPago 
      };
    });
    
    setMappedData(dadosPreservados);
    setPreviewData(dadosPreservados); // Usar todos os dados sem limitação
    setCurrentStep(3);
  };

  const handleConfirmImport = async (finalData) => {
    try {
      setLoading(true);
      setError('');
      
      // Utilizamos o serviço de importação para salvar os dados no Parse
      const result = await saveExpensesToParse(finalData || mappedData);
      
      setImportStats({
        totalItems: finalData?.length || mappedData?.length || 0,
        totalSaved: result.totalSaved || 0,
        errors: (finalData?.length || mappedData?.length || 0) - (result.totalSaved || 0)
      });
      
      setSuccess(`Importação realizada com sucesso! ${result.totalSaved} registros foram importados.`);
      setCurrentStep(4);
    } catch (err) {
      setError(`Erro ao importar os dados: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetImport = () => {
    setFileData(null);
    setMappedData(null);
    setPreviewData(null);
    setSuccess('');
    setError('');
    setCurrentStep(1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <FileUploader onFileUploaded={handleFileUploaded} />;
      case 2:
        return <ImportMapping 
                fileData={fileData} 
                onMappingComplete={handleMappingComplete} 
                onBack={() => setCurrentStep(1)} 
              />;
      case 3:
        return <ImportPreview 
                 previewData={previewData} 
                 totalRecords={mappedData?.length || 0}
                 onConfirm={handleConfirmImport}
                 onBack={() => setCurrentStep(2)} 
                 loading={loading}
               />;
      case 4:
        return <ImportConfirmation 
                 success={success} 
                 importStats={importStats}
                 onStartNew={resetImport} 
                 onBackToDashboard={handleNavigateBack} 
               />;
      default:
        return <FileUploader onFileUploaded={handleFileUploaded} />;
    }
  };

  if (!user) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="import-page-container">
      <header className="import-page-header">
        <h1>Importação de Despesas</h1>
        <div className="header-actions">
          <button 
            className="back-button" 
            onClick={handleNavigateBack}
          >
            ← Voltar ao Dashboard
          </button>
        </div>
      </header>
      
      <div className="import-page-content">
        <div className="import-page-card">
          <h2>Importar Planilha de Despesas</h2>
          <p>
            Use esta ferramenta para importar suas despesas de marketing a partir de uma planilha Excel (XLSX) ou CSV.
          </p>
          
          <div className="import-steps">
            <div className={`import-step ${currentStep === 1 ? 'step-active' : ''} ${currentStep > 1 ? 'step-completed' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Upload da Planilha</div>
            </div>
            <div className={`import-step ${currentStep === 2 ? 'step-active' : ''} ${currentStep > 2 ? 'step-completed' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Mapeamento de Campos</div>
            </div>
            <div className={`import-step ${currentStep === 3 ? 'step-active' : ''} ${currentStep > 3 ? 'step-completed' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Revisão dos Dados</div>
            </div>
            <div className={`import-step ${currentStep === 4 ? 'step-active' : ''}`}>
              <div className="step-number">4</div>
              <div className="step-label">Importação Concluída</div>
            </div>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="import-content-container">
            {renderStepContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportExpensePage;