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
      const query = new Parse.Query(Faturamento);
      
      query.equalTo('mes', mes);
      query.equalTo('ano', ano);
      
      const result = await query.first();
      
      if (result) {
        // Retorna o objeto existente com base nos campos do banco de dados
        return {
          id: result.id,
          mes: result.get('mes'),
          ano: result.get('ano'),
          faturamentoComSucata: {
            Wellington: result.get('fatWellington'),
            Alan: result.get('fatAlan'),
            Reacao: result.get('fatReacao'),
            Alexandre: result.get('fatAlexandre'),
            Heitor: result.get('fatHeitor'),
            Carlos: result.get('fatCarlos'),
            Cassia: result.get('fatCassia')
          },
          faturamentoSemSucata: {
            Wellington: result.get('fatWellington') && !result.get('ComSucata') ? result.get('fatWellington') : '',
            Alan: result.get('fatAlan') && !result.get('ComSucata') ? result.get('fatAlan') : '',
            Reacao: result.get('fatReacao') && !result.get('ComSucata') ? result.get('fatReacao') : '',
            Alexandre: result.get('fatAlexandre') && !result.get('ComSucata') ? result.get('fatAlexandre') : '',
            Heitor: result.get('fatHeitor') && !result.get('ComSucata') ? result.get('fatHeitor') : '',
            Carlos: result.get('fatCarlos') && !result.get('ComSucata') ? result.get('fatCarlos') : '',
            Cassia: result.get('fatCassia') && !result.get('ComSucata') ? result.get('fatCassia') : ''
          },
          totalComSucata: calculateTotal(result, true),
          totalSemSucata: calculateTotal(result, false),
          createdAt: result.get('createdAt'),
          updatedAt: result.get('updatedAt')
        };
      } else {
        // Retorna um objeto vazio se não existir
        return {
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
      }
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
      let faturamento;
      
      if (faturamentoData.id) {
        // Atualiza um registro existente
        const query = new Parse.Query(Faturamento);
        faturamento = await query.get(faturamentoData.id);
      } else {
        // Cria um novo registro
        faturamento = new Faturamento();
      }
      
      // Define os campos para o registro COM sucata
      faturamento.set('mes', faturamentoData.mes);
      faturamento.set('ano', faturamentoData.ano);
      faturamento.set('ComSucata', true);
      faturamento.set('fatWellington', faturamentoData.faturamentoComSucata.Wellington || '');
      faturamento.set('fatAlan', faturamentoData.faturamentoComSucata.Alan || '');
      faturamento.set('fatReacao', faturamentoData.faturamentoComSucata.Reacao || '');
      faturamento.set('fatAlexandre', faturamentoData.faturamentoComSucata.Alexandre || '');
      faturamento.set('fatHeitor', faturamentoData.faturamentoComSucata.Heitor || '');
      faturamento.set('fatCarlos', faturamentoData.faturamentoComSucata.Carlos || '');
      faturamento.set('fatCassia', faturamentoData.faturamentoComSucata.Cassia || '');
      faturamento.set('createdBy', Parse.User.current());
      
      // Salva o registro COM sucata
      await faturamento.save();
      
      // Cria ou atualiza o registro SEM sucata
      let faturamentoSemSucata;
      
      // Verifica se já existe um registro SEM sucata para o mesmo mês/ano
      const querySemSucata = new Parse.Query(Faturamento);
      querySemSucata.equalTo('mes', faturamentoData.mes);
      querySemSucata.equalTo('ano', faturamentoData.ano);
      querySemSucata.equalTo('ComSucata', false);
      
      const existingSemSucata = await querySemSucata.first();
      
      if (existingSemSucata) {
        faturamentoSemSucata = existingSemSucata;
      } else {
        faturamentoSemSucata = new Faturamento();
      }
      
      // Define os campos para o registro SEM sucata
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
      faturamentoSemSucata.set('createdBy', Parse.User.current());
      
      // Salva o registro SEM sucata
      await faturamentoSemSucata.save();
      
      // Retorna o objeto atualizado
      return {
        id: faturamento.id,
        mes: faturamento.get('mes'),
        ano: faturamento.get('ano'),
        faturamentoComSucata: {
          Wellington: faturamento.get('fatWellington') || '',
          Alan: faturamento.get('fatAlan') || '',
          Reacao: faturamento.get('fatReacao') || '',
          Alexandre: faturamento.get('fatAlexandre') || '',
          Heitor: faturamento.get('fatHeitor') || '',
          Carlos: faturamento.get('fatCarlos') || '',
          Cassia: faturamento.get('fatCassia') || ''
        },
        faturamentoSemSucata: {
          Wellington: faturamentoSemSucata.get('fatWellington') || '',
          Alan: faturamentoSemSucata.get('fatAlan') || '',
          Reacao: faturamentoSemSucata.get('fatReacao') || '',
          Alexandre: faturamentoSemSucata.get('fatAlexandre') || '',
          Heitor: faturamentoSemSucata.get('fatHeitor') || '',
          Carlos: faturamentoSemSucata.get('fatCarlos') || '',
          Cassia: faturamentoSemSucata.get('fatCassia') || ''
        },
        totalComSucata: calculateTotal(faturamento, true),
        totalSemSucata: calculateTotal(faturamentoSemSucata, false)
      };
    } catch (error) {
      console.error('Erro ao salvar faturamento:', error);
      throw error;
    }
  }
};

/**
 * Função auxiliar para calcular o total do faturamento
 * @param {Parse.Object} faturamento - Objeto de faturamento
 * @param {Boolean} comSucata - Indica se é COM sucata ou SEM sucata
 * @returns {Number} - Total calculado
 */
function calculateTotal(faturamento, comSucata) {
  if (!faturamento) return 0;
  
  // Verifica se o objeto corresponde ao tipo desejado (COM/SEM sucata)
  if (faturamento.get('ComSucata') !== comSucata) return 0;
  
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

export default faturamentoService;