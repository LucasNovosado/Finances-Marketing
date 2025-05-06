// src/components/import/FileUploader.jsx

import React, { useState, useRef } from 'react';
import { readExcelFile } from '../../services/importService';
import './FileUploader.css';

const FileUploader = ({ onFileUploaded }) => {
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      setError('Formato de arquivo não suportado. Por favor, use arquivos XLSX, XLS ou CSV.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setFile(selectedFile);
      
      // Lê o arquivo Excel/CSV
      const data = await readExcelFile(selectedFile);
      
      setFileData(data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(`Erro ao ler o arquivo: ${err.message}`);
      console.error('Erro ao ler o arquivo:', err);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      // Simular a seleção de arquivo para acionar o handleFileChange
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(droppedFile);
      
      const fileInputElement = fileInputRef.current;
      fileInputElement.files = dataTransfer.files;
      
      // Disparar o evento change manualmente
      const event = new Event('change', { bubbles: true });
      fileInputElement.dispatchEvent(event);
    }
  };

  const handleProceed = () => {
    if (fileData && fileData.length > 0) {
      onFileUploaded(fileData);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="file-uploader-container">
      <div 
        className={`file-drop-zone ${isDragActive ? 'drag-active' : ''}`}
        onClick={openFileDialog}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="file-icon">📄</div>
        <p className="file-drop-text">Clique aqui ou arraste um arquivo para esta área</p>
        <p className="file-drop-subtext">
          Selecione uma planilha contendo os dados de despesas para importar
        </p>
        <div className="file-formats">Formatos aceitos: XLSX, XLS, CSV</div>
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef}
        className="file-input" 
        accept=".xlsx,.xls,.csv" 
        onChange={handleFileChange}
      />

      {loading && <div className="loading">Processando arquivo...</div>}
      
      {error && <div className="error-text">{error}</div>}
      
      {file && fileData && (
        <div className="file-info">
          <h3>Arquivo Carregado</h3>
          
          <div className="file-details">
            <div className="file-detail-label">Nome do arquivo:</div>
            <div className="file-detail-value">{file.name}</div>
            
            <div className="file-detail-label">Tamanho:</div>
            <div className="file-detail-value">{(file.size / 1024).toFixed(2)} KB</div>
            
            <div className="file-detail-label">Linhas detectadas:</div>
            <div className="file-detail-value">{fileData.length}</div>
            
            <div className="file-detail-label">Colunas detectadas:</div>
            <div className="file-detail-value">
              {fileData.length > 0 ? Object.keys(fileData[0]).length : 0}
            </div>
          </div>
          
          <div className="file-preview">
            <h3>Prévia dos dados</h3>
            {fileData.length > 0 && (
              <table>
                <thead>
                  <tr>
                    {Object.keys(fileData[0]).map((header, index) => (
                      <th key={index}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fileData.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.values(row).map((cell, cellIndex) => (
                        <td key={cellIndex}>{String(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <button 
            className="proceed-btn"
            onClick={handleProceed}
          >
            Prosseguir →
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;