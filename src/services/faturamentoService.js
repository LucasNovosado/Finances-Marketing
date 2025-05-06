// src/services/faturamentoService.js

import Parse from 'parse/dist/parse.min.js';

/**
 * Serviço para gerenciar operações relacionadas ao faturamento
 */
const faturamentoService = {
  /**
   * Busca os dados de faturamento para um mês/ano específico
   * @param {Number} mes - Mês do faturamento (1-12)
   * @param {Number} ano - Ano do faturamento
   * @returns {Promise<Object>} - Promise resolvida com objeto de faturamento
   */
  getFaturamentoByMonthYear: async (mes, ano) => {
    try {
      const Faturamento = Parse.Object.extend('FaturamentoMensal');
      
      // Query para buscar o registro COM sucata
      const queryComSucata = new Parse.Query(Faturamento);
      queryComSucata.equalTo('mes', mes);
      queryComSucata.equalTo('ano', ano);
      queryComSucata.equalTo('ComSucata', true);
      
      // Query para buscar o registro SEM sucata
      const querySemSucata = new Parse.Query(Faturamento);
      querySemSucata.equalTo('mes', mes);
      querySemSucata.equalTo('ano', ano);
      querySemSucata.equalTo('ComSucata', false);
      
      // Executa as duas queries em paralelo
      const [resultComSucata, resultSemSucata] = await Promise.all([
        queryComSucata.first(),
        querySemSucata.first()
      ]);
      
      // Prepara o objeto de retorno
      const returnObject = {
        mes,
        ano,
        faturamentoComSucata: {
          Wellington: '',
          Alan: '',
          Reacao: '',
          Alexandre: '',
          Heitor: '',
          Carlos: '',
          Cassia: ''
        },
        faturamentoSemSucata: {
          Wellington: '',
          Alan: '',
          Reacao: '',
          Alexandre: '',
          Heitor: '',
          Carlos: '',
          Cassia: ''
        },
        totalComSucata: 0,
        totalSemSucata: 0
      };
      
      // Se existir um registro COM sucata, preenche os dados correspondentes
      if (resultComSucata) {
        returnObject.id = resultComSucata.id;
        returnObject.faturamentoComSucata = {
          Wellington: resultComSucata.get('fatWellington') || '',
          Alan: resultComSucata.get('fatAlan') || '',
          Reacao: resultComSucata.get('fatReacao') || '',
          Alexandre: resultComSucata.get('fatAlexandre') || '',
          Heitor: resultComSucata.get('fatHeitor') || '',
          Carlos: resultComSucata.get('fatCarlos') || '',
          Cassia: resultComSucata.get('fatCassia') || ''
        };
        returnObject.totalComSucata = calculateTotal(resultComSucata);
      }
      
      // Se existir um registro SEM sucata, preenche os dados correspondentes
      if (resultSemSucata) {
        // Se não tiver ID ainda, usa o do registro SEM sucata
        if (!returnObject.id) {
          returnObject.id = resultSemSucata.id;
        }
        
        returnObject.faturamentoSemSucata = {
          Wellington: resultSemSucata.get('fatWellington') || '',
          Alan: resultSemSucata.get('fatAlan') || '',
          Reacao: resultSemSucata.get('fatReacao') || '',
          Alexandre: resultSemSucata.get('fatAlexandre') || '',
          Heitor: resultSemSucata.get('fatHeitor') || '',
          Carlos: resultSemSucata.get('fatCarlos') || '',
          Cassia: resultSemSucata.get('fatCassia') || ''
        };
        returnObject.totalSemSucata = calculateTotal(resultSemSucata);
      }
      
      return returnObject;
    } catch (error) {
      console.error('Erro ao buscar faturamento:', error);
      throw error;
    }
  },

  /**
   * Salva os dados de faturamento para um mês/ano específico
   * @param {Object} faturamentoData - Dados de faturamento a serem salvos
   * @returns {Promise<Object>} - Promise resolvida com o objeto salvo
   */
  saveFaturamento: async (faturamentoData) => {
    try {
      const Faturamento = Parse.Object.extend('FaturamentoMensal');
      
      // Busca registros existentes para o mês/ano
      const queryComSucata = new Parse.Query(Faturamento);
      queryComSucata.equalTo('mes', faturamentoData.mes);
      queryComSucata.equalTo('ano', faturamentoData.ano);
      queryComSucata.equalTo('ComSucata', true);
      
      const querySemSucata = new Parse.Query(Faturamento);
      querySemSucata.equalTo('mes', faturamentoData.mes);
      querySemSucata.equalTo('ano', faturamentoData.ano);
      querySemSucata.equalTo('ComSucata', false);
      
      // Executa as queries em paralelo
      const [existingComSucata, existingSemSucata] = await Promise.all([
        queryComSucata.first(),
        querySemSucata.first()
      ]);
      
      // Prepara o objeto para salvar com sucata
      let faturamentoComSucata = existingComSucata || new Faturamento();
      
      faturamentoComSucata.set('mes', faturamentoData.mes);
      faturamentoComSucata.set('ano', faturamentoData.ano);
      faturamentoComSucata.set('ComSucata', true);
      faturamentoComSucata.set('fatWellington', faturamentoData.faturamentoComSucata.Wellington || '');
      faturamentoComSucata.set('fatAlan', faturamentoData.faturamentoComSucata.Alan || '');
      faturamentoComSucata.set('fatReacao', faturamentoData.faturamentoComSucata.Reacao || '');
      faturamentoComSucata.set('fatAlexandre', faturamentoData.faturamentoComSucata.Alexandre || '');
      faturamentoComSucata.set('fatHeitor', faturamentoData.faturamentoComSucata.Heitor || '');
      faturamentoComSucata.set('fatCarlos', faturamentoData.faturamentoComSucata.Carlos || '');
      faturamentoComSucata.set('fatCassia', faturamentoData.faturamentoComSucata.Cassia || '');
      
      // Prepara o objeto para salvar sem sucata
      let faturamentoSemSucata = existingSemSucata || new Faturamento();
      
      faturamentoSemSucata.set('mes', faturamentoData.mes);
      faturamentoSemSucata.set('ano', faturamentoData.ano);
      faturamentoSemSucata.set('ComSucata', false);
      faturamentoSemSucata.set('fatWellington', faturamentoData.faturamentoSemSucata.Wellington || '');
      faturamentoSemSucata.set('fatAlan', faturamentoData.faturamentoSemSucata.Alan || '');
      faturamentoSemSucata.set('fatReacao', faturamentoData.faturamentoSemSucata.Reacao || '');
      faturamentoSemSucata.set('fatAlexandre', faturamentoData.faturamentoSemSucata.Alexandre || '');
      faturamentoSemSucata.set('fatHeitor', faturamentoData.faturamentoSemSucata.Heitor || '');
      faturamentoSemSucata.set('fatCarlos', faturamentoData.faturamentoSemSucata.Carlos || '');
      faturamentoSemSucata.set('fatCassia', faturamentoData.faturamentoSemSucata.Cassia || '');
      
      // Salva os dois objetos em paralelo
      await Promise.all([
        faturamentoComSucata.save(),
        faturamentoSemSucata.save()
      ]);
      
      // Retorna os dados combinados
      return {
        id: faturamentoComSucata.id,
        mes: faturamentoData.mes,
        ano: faturamentoData.ano,
        faturamentoComSucata: faturamentoData.faturamentoComSucata,
        faturamentoSemSucata: faturamentoData.faturamentoSemSucata,
        totalComSucata: calculateTotalFromValues(faturamentoData.faturamentoComSucata),
        totalSemSucata: calculateTotalFromValues(faturamentoData.faturamentoSemSucata)
      };
    } catch (error) {
      console.error('Erro ao salvar faturamento:', error);
      throw error;
    }
  }
};

/**
 * Função auxiliar para calcular o total do faturamento a partir de um objeto Parse
 * @param {Parse.Object} faturamento - Objeto de faturamento
 * @returns {Number} - Total calculado
 */
function calculateTotal(faturamento) {
  if (!faturamento) return 0;
  
  // Lista de supervisores
  const supervisores = [
    'fatWellington', 
    'fatAlan', 
    'fatReacao', 
    'fatAlexandre', 
    'fatHeitor', 
    'fatCarlos', 
    'fatCassia'
  ];
  
  // Calcula o total
  return supervisores.reduce((total, supervisor) => {
    const valor = faturamento.get(supervisor);
    if (!valor) return total;
    
    // Converte string para número
    const numValue = typeof valor === 'string' 
      ? parseFloat(valor.replace(/[^\d.,]/g, '').replace(',', '.'))
      : parseFloat(valor);
      
    return total + (isNaN(numValue) ? 0 : numValue);
  }, 0);
}

/**
 * Função auxiliar para calcular o total do faturamento a partir de um objeto de valores
 * @param {Object} valoresObj - Objeto com os valores de faturamento
 * @returns {Number} - Total calculado
 */
function calculateTotalFromValues(valoresObj) {
  if (!valoresObj) return 0;
  
  return Object.values(valoresObj).reduce((total, valor) => {
    if (!valor) return total;
    
    // Converte string para número
    const numValue = typeof valor === 'string' 
      ? parseFloat(valor.replace(/[^\d.,]/g, '').replace(',', '.'))
      : parseFloat(valor);
      
    return total + (isNaN(numValue) ? 0 : numValue);
  }, 0);
}

export default faturamentoService;