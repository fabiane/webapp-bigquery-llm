import axios from 'axios';
import type { Dataset, QueryResult, Table, TableSchema } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

export const getDatasets = async (): Promise<Dataset[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/datasets`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar datasets:', error);
    throw new Error('Não foi possível carregar os datasets');
  }
};

export const getTables = async (datasetId: string): Promise<Table[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/tables/${datasetId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar tabelas:', error);
    throw new Error('Não foi possível carregar as tabelas');
  }
};

export const getTableSchema = async (datasetId: string, tableId: string): Promise<TableSchema> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/tables/${datasetId}/${tableId}/schema`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar schema da tabela:', error);
    throw new Error('Não foi possível carregar o schema da tabela');
  }
};

export const executeSQLQuery = async (sqlQuery: string): Promise<QueryResult> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/query`, { 
      query: sqlQuery 
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorData = error.response.data;
      let errorMessage = 'Erro ao executar a consulta';

      if (errorData.error) {
        errorMessage = errorData.error;
      }

      if (errorData.details) {
        // Extrair informações relevantes do stack trace
        const details = errorData.details;
        if (details.includes('Syntax error')) {
          errorMessage = 'Erro de sintaxe na consulta SQL';
        } else if (details.includes('Table not found')) {
          errorMessage = 'Tabela não encontrada no dataset';
        } else if (details.includes('Permission denied')) {
          errorMessage = 'Permissão negada para acessar os dados';
        } else if (details.includes('exceeded')) {
          errorMessage = 'Limite de recursos excedido';
        }

        // Adicionar detalhes técnicos se disponíveis
        if (errorData.details) {
          errorMessage += `\n\nDetalhes técnicos: ${errorData.details}`;
        }
      }

      throw new Error(errorMessage);
    }
    throw new Error('Erro ao executar a consulta. Por favor, tente novamente.');
  }
};