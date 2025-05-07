// src/components/expenses/ExpenseChartPanel.jsx

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Download, BarChart2, PieChart as PieChartIcon, LineChart as LineChartIcon } from 'lucide-react';
import './ExpenseChartPanel.css';

const ExpenseChartPanel = ({ expenses, categories, budgets }) => {
  const [activeChart, setActiveChart] = useState('bar'); // 'bar', 'pie', 'line'
  const [chartData, setChartData] = useState([]);
  const [groupBy, setGroupBy] = useState('categoria'); // 'categoria', 'orcamento', 'mes'
  const [chartOptions, setChartOptions] = useState({
    showTopOnly: true,
    topCount: 10,
    sortBy: 'value', // 'value', 'name'
    sortDirection: 'desc' // 'asc', 'desc'
  });

  // Cores para os gráficos
  const COLORS = [
    '#4A90E2', '#50C878', '#F5A623', '#D0021B', '#9013FE', 
    '#BD10E0', '#4A4A4A', '#7ED321', '#B8E986', '#50E3C2',
    '#8B572A', '#417505', '#9B9B9B', '#0078D7', '#FF6900'
  ];

  // Preparar dados para gráficos
  useEffect(() => {
    if (expenses.length === 0) return;
    
    // Agrupar despesas de acordo com a seleção (categoria, orçamento ou mês)
    const groupExpenses = () => {
      const groups = {};
      
      expenses.forEach(expense => {
        let key;
        
        if (groupBy === 'categoria') {
          key = expense.categoria || 'Sem Categoria';
        } else if (groupBy === 'orcamento') {
          key = expense.orcamento || 'Sem Orçamento';
        } else if (groupBy === 'mes') {
          // Agrupar por mês
          const date = new Date(expense.dataDespesa || expense.createdAt);
          key = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        }
        
        if (!groups[key]) {
          groups[key] = {
            name: key,
            value: 0,
            count: 0
          };
        }
        
        groups[key].value += Number(expense.valorPago) || 0;
        groups[key].count += 1;
      });
      
      // Converter para array
      let result = Object.values(groups);
      
      // Ordenar
      if (chartOptions.sortBy === 'value') {
        result.sort((a, b) => chartOptions.sortDirection === 'asc' ? a.value - b.value : b.value - a.value);
      } else {
        result.sort((a, b) => {
          if (chartOptions.sortDirection === 'asc') {
            return a.name.localeCompare(b.name);
          } else {
            return b.name.localeCompare(a.name);
          }
        });
      }
      
      // Limitar aos N itens principais (se aplicável)
      if (chartOptions.showTopOnly) {
        result = result.slice(0, chartOptions.topCount);
      }
      
      // Adicionar formatação de valores
      result = result.map(item => ({
        ...item,
        formattedValue: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(item.value)
      }));
      
      setChartData(result);
    };
    
    groupExpenses();
  }, [expenses, groupBy, chartOptions]);

  // Formatar valor para o tooltip
  const formatTooltipValue = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Renderizar gráfico de barras
  const renderBarChart = () => {
    return (
      <ResponsiveContainer width="100%" height={500}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            height={70} 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={(value) => new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              notation: 'compact',
              compactDisplay: 'short'
            }).format(value)}
          />
          <Tooltip 
            formatter={(value) => formatTooltipValue(value)}
            labelFormatter={(label) => `${label}`}
          />
          <Legend />
          <Bar 
            dataKey="value" 
            name="Valor Total" 
            fill="#4A90E2"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Renderizar gráfico de pizza
  const renderPieChart = () => {
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);
      
      return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      );
    };
    
    return (
      <ResponsiveContainer width="100%" height={500}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={200}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => formatTooltipValue(value)}
          />
          <Legend layout="vertical" verticalAlign="middle" align="right" />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Renderizar gráfico de linha
  const renderLineChart = () => {
    // Para gráfico de linha, primeiro ordenar por tempo se for agrupado por mês
    let lineData = [...chartData];
    
    if (groupBy === 'mes') {
      // Extrai mês e ano do nome da chave
      const parseDate = (str) => {
        const months = {
          'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3, 'maio': 4, 'junho': 5,
          'julho': 6, 'agosto': 7, 'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
        };
        
        const parts = str.split(' ');
        const month = months[parts[0].toLowerCase()];
        const year = parseInt(parts[1]);
        
        return new Date(year, month, 1);
      };
      
      lineData.sort((a, b) => parseDate(a.name) - parseDate(b.name));
    }
    
    return (
      <ResponsiveContainer width="100%" height={500}>
        <LineChart
          data={lineData}
          margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            height={70} 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={(value) => new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              notation: 'compact',
              compactDisplay: 'short'
            }).format(value)}
          />
          <Tooltip 
            formatter={(value) => formatTooltipValue(value)}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            name="Valor Total" 
            stroke="#4A90E2" 
            activeDot={{ r: 8 }} 
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Atualizar opções do gráfico
  const handleChartOptionChange = (e) => {
    const { name, value, type, checked } = e.target;
    setChartOptions(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Obter valor total formatado
  const getTotalValue = () => {
    const total = expenses.reduce((sum, expense) => sum + (Number(expense.valorPago) || 0), 0);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(total);
  };

  return (
    <div className="expense-chart-panel">
      <div className="chart-header">
        <div className="chart-info">
          <h2>Análise Gráfica</h2>
          <span className="chart-total">Total: {getTotalValue()} • {expenses.length} registros</span>
        </div>
        <div className="chart-actions">
          <button 
            className={`chart-type-button ${activeChart === 'bar' ? 'active' : ''}`}
            onClick={() => setActiveChart('bar')}
            title="Gráfico de Barras"
          >
            <BarChart2 size={18} />
          </button>
          <button 
            className={`chart-type-button ${activeChart === 'pie' ? 'active' : ''}`}
            onClick={() => setActiveChart('pie')}
            title="Gráfico de Pizza"
          >
            <PieChartIcon size={18} />
          </button>
          <button 
            className={`chart-type-button ${activeChart === 'line' ? 'active' : ''}`}
            onClick={() => setActiveChart('line')}
            title="Gráfico de Linha"
          >
            <LineChartIcon size={18} />
          </button>
          <button 
            className="export-chart-button"
            onClick={() => {/* Implementar exportação do gráfico */}}
            title="Exportar como Imagem"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      <div className="chart-options">
        <div className="chart-option-group">
          <label htmlFor="groupBy">Agrupar por:</label>
          <select 
            id="groupBy" 
            value={groupBy} 
            onChange={(e) => setGroupBy(e.target.value)}
          >
            <option value="categoria">Categoria</option>
            <option value="orcamento">Orçamento</option>
            <option value="mes">Mês</option>
          </select>
        </div>
        
        <div className="chart-option-group">
          <label htmlFor="sortBy">Ordenar por:</label>
          <select 
            id="sortBy" 
            name="sortBy"
            value={chartOptions.sortBy} 
            onChange={handleChartOptionChange}
          >
            <option value="value">Valor</option>
            <option value="name">Nome</option>
          </select>
        </div>
        
        <div className="chart-option-group">
          <label htmlFor="sortDirection">Direção:</label>
          <select 
            id="sortDirection" 
            name="sortDirection"
            value={chartOptions.sortDirection} 
            onChange={handleChartOptionChange}
          >
            <option value="desc">Decrescente</option>
            <option value="asc">Crescente</option>
          </select>
        </div>
        
        <div className="chart-option-group chart-option-checkbox">
          <input 
            type="checkbox" 
            id="showTopOnly" 
            name="showTopOnly"
            checked={chartOptions.showTopOnly} 
            onChange={handleChartOptionChange}
          />
          <label htmlFor="showTopOnly">Mostrar apenas os principais</label>
        </div>
        
        {chartOptions.showTopOnly && (
          <div className="chart-option-group">
            <label htmlFor="topCount">Quantidade:</label>
            <select 
              id="topCount" 
              name="topCount"
              value={chartOptions.topCount} 
              onChange={handleChartOptionChange}
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={15}>Top 15</option>
              <option value={20}>Top 20</option>
            </select>
          </div>
        )}
      </div>

      <div className="chart-container">
        {chartData.length === 0 ? (
          <div className="no-data-message">
            <p>Nenhum dado disponível para visualização.</p>
            <p>Tente modificar os filtros ou configurações.</p>
          </div>
        ) : (
          <>
            {activeChart === 'bar' && renderBarChart()}
            {activeChart === 'pie' && renderPieChart()}
            {activeChart === 'line' && renderLineChart()}
          </>
        )}
      </div>

      {chartData.length > 0 && (
        <div className="chart-legend-table">
          <h3>Detalhamento dos Dados</h3>
          <div className="legend-table-wrapper">
            <table className="legend-table">
              <thead>
                <tr>
                  <th className="color-column"></th>
                  <th className="name-column">Nome</th>
                  <th className="count-column">Quantidade</th>
                  <th className="value-column">Valor Total</th>
                  <th className="percent-column">Percentual</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((item, index) => {
                  const totalValue = expenses.reduce((sum, expense) => sum + (Number(expense.valorPago) || 0), 0);
                  const percentage = totalValue > 0 ? (item.value / totalValue * 100) : 0;
                  
                  return (
                    <tr key={index}>
                      <td className="color-cell">
                        <div className="color-box" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      </td>
                      <td className="name-cell">{item.name}</td>
                      <td className="count-cell">{item.count}</td>
                      <td className="value-cell">{item.formattedValue}</td>
                      <td className="percent-cell">{percentage.toFixed(2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseChartPanel;