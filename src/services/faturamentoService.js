// src/services/faturamentoService.js

import Parse from 'parse/dist/parse.min.js';

/**
 * Serviço que gerencia as operações relacionadas ao faturamento mensal
 */
const faturamentoService = {
  /**
   * Versão SIMPLIFICADA — usada na dashboard financeira
   * Retorna total com e sem sucata
   */
  getFaturamentoMensal: async (mes, ano) => {
    try {
      const query = new Parse.Query('FaturamentoMensal');
      query.equalTo('mes', mes);
      query.equalTo('ano', ano);
      const resultado = await query.first();

      if (resultado) {
        return {
          fatCheio: resultado.get('fatCheio') || 0,
          fatSucata: resultado.get('fatSucata') || 0
        };
      } else {
        console.warn(`Nenhum dado de faturamento encontrado para ${mes}/${ano}`);
        return { fatCheio: 0, fatSucata: 0 };
      }
    } catch (error) {
      console.error('Erro ao buscar faturamento mensal:', error);
      throw error;
    }
  },

  /**
   * Versão DETALHADA — usada no gerenciamento por supervisor
   */
  getFaturamentoByMonthYear: async (mes, ano) => {
    try {
      const Faturamento = Parse.Object.extend('FaturamentoMensal');

      const queryComSucata = new Parse.Query(Faturamento);
      queryComSucata.equalTo('mes', mes);
      queryComSucata.equalTo('ano', ano);
      queryComSucata.equalTo('ComSucata', true);

      const querySemSucata = new Parse.Query(Faturamento);
      querySemSucata.equalTo('mes', mes);
      querySemSucata.equalTo('ano', ano);
      querySemSucata.equalTo('ComSucata', false);

      const [resultComSucata, resultSemSucata] = await Promise.all([
        queryComSucata.first(),
        querySemSucata.first()
      ]);

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

      if (resultSemSucata) {
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
      console.error('Erro ao buscar faturamento detalhado:', error);
      throw error;
    }
  },

  saveFaturamento: async (faturamentoData) => {
    try {
      const Faturamento = Parse.Object.extend('FaturamentoMensal');

      const queryComSucata = new Parse.Query(Faturamento);
      queryComSucata.equalTo('mes', faturamentoData.mes);
      queryComSucata.equalTo('ano', faturamentoData.ano);
      queryComSucata.equalTo('ComSucata', true);

      const querySemSucata = new Parse.Query(Faturamento);
      querySemSucata.equalTo('mes', faturamentoData.mes);
      querySemSucata.equalTo('ano', faturamentoData.ano);
      querySemSucata.equalTo('ComSucata', false);

      const [existingComSucata, existingSemSucata] = await Promise.all([
        queryComSucata.first(),
        querySemSucata.first()
      ]);

      let faturamentoComSucata = existingComSucata || new Faturamento();
      faturamentoComSucata.set('mes', faturamentoData.mes);
      faturamentoComSucata.set('ano', faturamentoData.ano);
      faturamentoComSucata.set('ComSucata', true);
      Object.entries(faturamentoData.faturamentoComSucata).forEach(([key, value]) =>
        faturamentoComSucata.set(`fat${key}`, value || '')
      );

      let faturamentoSemSucata = existingSemSucata || new Faturamento();
      faturamentoSemSucata.set('mes', faturamentoData.mes);
      faturamentoSemSucata.set('ano', faturamentoData.ano);
      faturamentoSemSucata.set('ComSucata', false);
      Object.entries(faturamentoData.faturamentoSemSucata).forEach(([key, value]) =>
        faturamentoSemSucata.set(`fat${key}`, value || '')
      );

      await Promise.all([
        faturamentoComSucata.save(),
        faturamentoSemSucata.save()
      ]);

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
  },

  getHistoricoFaturamento: async (ano) => {
    try {
      const query = new Parse.Query('FaturamentoMensal');
      query.equalTo('ano', ano);
      query.ascending('mes');
      const resultados = await query.find();

      return resultados.map(item => ({
        mes: item.get('mes'),
        ano: item.get('ano'),
        fatCheio: item.get('fatCheio'),
        fatSucata: item.get('fatSucata'),
        id: item.id
      }));
    } catch (error) {
      console.error('Erro ao buscar histórico de faturamento:', error);
      throw error;
    }
  },

  getLimitesDespesa: async (mes, ano) => {
    try {
      const query = new Parse.Query('LimiteDespesa');
      query.equalTo('mes', mes);
      query.equalTo('ano', ano);
      const resultado = await query.first();

      return resultado
        ? {
            percentualFatCheio: resultado.get('percentualFatCheio'),
            percentualFatSucata: resultado.get('percentualFatSucata')
          }
        : { percentualFatCheio: 0.75, percentualFatSucata: 0.75 };
    } catch (error) {
      console.error('Erro ao buscar limites de despesa:', error);
      throw error;
    }
  },

  saveLimitesDespesa: async (dados) => {
    try {
      const query = new Parse.Query('LimiteDespesa');
      query.equalTo('mes', dados.mes);
      query.equalTo('ano', dados.ano);
      const existente = await query.first();

      let limite = existente || new Parse.Object('LimiteDespesa');
      limite.set('mes', dados.mes);
      limite.set('ano', dados.ano);
      limite.set('percentualFatCheio', dados.percentualFatCheio);
      limite.set('percentualFatSucata', dados.percentualFatSucata);
      await limite.save();
      return limite;
    } catch (error) {
      console.error('Erro ao salvar limites de despesa:', error);
      throw error;
    }
  },

  calcularDadosFinanceiros: (params) => {
    const { totalDespesas, faturamento, limites } = params;
    const percentualGasto = faturamento.fatCheio > 0
      ? (totalDespesas / faturamento.fatCheio * 100)
      : 0;

    const valorLimite = faturamento.fatCheio * limites.percentualFatCheio / 100;
    const percentualUtilizado = valorLimite > 0
      ? (totalDespesas / valorLimite * 100)
      : 0;

    let status = 'safe';
    if (percentualUtilizado >= 100) status = 'danger';
    else if (percentualUtilizado >= 90) status = 'alert';
    else if (percentualUtilizado >= 75) status = 'warning';

    return {
      totalDespesas,
      faturamentoCheio: faturamento.fatCheio,
      faturamentoSemSucata: faturamento.fatSucata,
      limitePercentual: limites.percentualFatCheio,
      percentualGasto,
      valorLimite,
      percentualUtilizado,
      status
    };
  },

  getResumoFinanceiro: async (mes, ano, totalDespesas) => {
    try {
      const [faturamento, limites] = await Promise.all([
        faturamentoService.getFaturamentoMensal(mes, ano),
        faturamentoService.getLimitesDespesa(mes, ano)
      ]);

      return faturamentoService.calcularDadosFinanceiros({
        totalDespesas,
        faturamento,
        limites
      });
    } catch (error) {
      console.error('Erro ao calcular resumo financeiro:', error);
      throw error;
    }
  },

  importarFaturamentoCsv: async (arquivo) => {
    try {
      console.log('Importando arquivo:', arquivo.name);
      return {
        importados: 0,
        erros: 0,
        mensagem: 'Funcionalidade ainda não implementada.'
      };
    } catch (error) {
      console.error('Erro ao importar faturamento:', error);
      throw error;
    }
  }
};

// FUNÇÕES AUXILIARES
function calculateTotal(faturamento) {
  if (!faturamento) return 0;
  const supervisores = [
    'fatWellington', 'fatAlan', 'fatReacao',
    'fatAlexandre', 'fatHeitor', 'fatCarlos', 'fatCassia'
  ];

  return supervisores.reduce((total, key) => {
    const value = faturamento.get(key);
    const num = parseFloat((value || '').toString().replace(/[^\d,.-]/g, '').replace(',', '.'));
    return total + (isNaN(num) ? 0 : num);
  }, 0);
}

function calculateTotalFromValues(obj) {
  return Object.values(obj || {}).reduce((total, value) => {
    const num = parseFloat((value || '').toString().replace(/[^\d,.-]/g, '').replace(',', '.'));
    return total + (isNaN(num) ? 0 : num);
  }, 0);
}

export default faturamentoService;
