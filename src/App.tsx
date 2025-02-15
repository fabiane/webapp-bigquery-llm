import React, { useState, useCallback, useEffect } from 'react';
import { Database, MessageSquare, Table as TableIcon, History, Loader2, ChevronDown, Code } from 'lucide-react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { format } from 'date-fns';
import type { QueryLog, QueryState, Dataset, Table } from './types';
import { generateSQLQuery } from './services/openai';
import { executeSQLQuery, getDatasets, getTables } from './services/bigquery';

SyntaxHighlighter.registerLanguage('sql', sql);

const formatValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '-';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não';
  }
  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR');
  }
  return String(value);
};

function App() {
  const [query, setQuery] = useState('');
  const [previewQuery, setPreviewQuery] = useState('');
  const [isGeneratingQuery, setIsGeneratingQuery] = useState(false);
  const [queryState, setQueryState] = useState<QueryState>({
    isLoading: false,
    error: null,
    result: null,
    sqlQuery: null,
  });
  const [queryLogs, setQueryLogs] = useState<QueryLog[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tables, setTables] = useState<Table[]>([]);

  useEffect(() => {
    const loadDatasets = async () => {
      try {
        const data = await getDatasets();
        setDatasets(data);
      } catch (error) {
        console.error('Error loading datasets:', error);
      }
    };
    loadDatasets();
  }, []);

  useEffect(() => {
    const loadTables = async () => {
      if (selectedDataset) {
        try {
          const data = await getTables(selectedDataset);
          console.log('Tabelas carregadas:', data);
          setTables(data);
        } catch (error) {
          console.error('Error loading tables:', error);
        }
      } else {
        setTables([]);
      }
      setSelectedTable('');
    };
    loadTables();
  }, [selectedDataset]);

  useEffect(() => {
    if (selectedTable) {
      const selectedTableData = tables.find(t => t.id === selectedTable);
      console.log('Schema da tabela selecionada:', selectedTableData?.schema);
    }
  }, [selectedTable, tables]);

  useEffect(() => {
    const generatePreview = async () => {
      if (query.trim() && selectedDataset && selectedTable) {
        setIsGeneratingQuery(true);
        try {
          const selectedTableData = tables.find(t => t.id === selectedTable);
          console.log('Gerando query com schema:', selectedTableData?.schema);
          
          const sqlQuery = await generateSQLQuery(
            `${query} (usando o dataset ${selectedDataset} e a tabela ${selectedTable})`,
            selectedTableData?.schema
          );
          setPreviewQuery(sqlQuery);
        } catch (error) {
          console.error('Erro ao gerar preview da query:', error);
        }
        setIsGeneratingQuery(false);
      } else {
        setPreviewQuery('');
      }
    };

    const timeoutId = setTimeout(generatePreview, 500);
    return () => clearTimeout(timeoutId);
  }, [query, selectedDataset, selectedTable, tables]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim() || !selectedDataset || !selectedTable) {
      setQueryState(prev => ({
        ...prev,
        error: 'Por favor, selecione um dataset e uma tabela antes de executar a consulta.'
      }));
      return;
    }

    let sqlQuery = previewQuery;
    
    if (!sqlQuery) {
      setQueryState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const selectedTableData = tables.find(t => t.id === selectedTable);
        sqlQuery = await generateSQLQuery(
          `${query} (usando o dataset ${selectedDataset} e a tabela ${selectedTable})`,
          selectedTableData?.schema
        );
      } catch (error) {
        setQueryState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Erro ao gerar a consulta SQL'
        }));
        return;
      }
    }

    setQueryState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await executeSQLQuery(sqlQuery);

      setQueryState({
        isLoading: false,
        error: null,
        result,
        sqlQuery,
      });

      setQueryLogs(prev => [{
        timestamp: new Date(),
        naturalQuery: query,
        sqlQuery,
        status: 'success',
      }, ...prev]);
    } catch (error) {
      setQueryState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Ocorreu um erro',
      }));

      setQueryLogs(prev => [{
        timestamp: new Date(),
        naturalQuery: query,
        sqlQuery,
        status: 'error',
        error: error instanceof Error ? error.message : 'Ocorreu um erro',
      }, ...prev]);
    }
  }, [query, selectedDataset, selectedTable, previewQuery, tables]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-6">
            <Database className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Datasets</h2>
          </div>

          <div className="space-y-4">
            {datasets.map((dataset) => (
              <div key={dataset.id} className="space-y-2">
                <button
                  onClick={() => setSelectedDataset(dataset.id)}
                  className={`w-full flex items-center justify-between p-2 text-sm rounded-md transition-colors ${
                    selectedDataset === dataset.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium">{dataset.id}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {selectedDataset === dataset.id && (
                  <div className="ml-4 space-y-1">
                    {tables.map((table) => (
                      <button
                        key={table.id}
                        onClick={() => setSelectedTable(table.id)}
                        className={`w-full flex items-center space-x-2 p-2 text-sm rounded-md transition-colors ${
                          selectedTable === table.id
                            ? 'bg-blue-100 text-blue-800'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <TableIcon className="h-4 w-4" />
                        <span>{table.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center space-x-3">
            <Database className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">BigQuery NL Interface - by Fabi Almeida - https://www.linkedin.com/in/fabianesouzaalmeida</h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Query Input Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>Dataset selecionado:</span>
                        <span className="font-medium text-gray-900">
                          {selectedDataset || 'Nenhum'}
                        </span>
                        <span className="text-gray-400">|</span>
                        <span>Tabela selecionada:</span>
                        <span className="font-medium text-gray-900">
                          {tables.find(t => t.id === selectedTable)?.name || 'Nenhuma'}
                        </span>
                      </div>
                    </div>

                    <label htmlFor="query" className="block text-sm font-medium text-gray-700">
                      Digite sua consulta em linguagem natural
                    </label>
                    <div className="mt-2">
                      <textarea
                        id="query"
                        rows={4}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Exemplo: Mostre o total de vendas por estado no último mês"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                    <div className="mt-4">
                      <button
                        type="submit"
                        disabled={queryState.isLoading || !selectedDataset || !selectedTable}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {queryState.isLoading ? (
                          <>
                            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="-ml-1 mr-2 h-4 w-4" />
                            Executar Consulta
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Preview da Query */}
                  {(previewQuery || isGeneratingQuery) && (
                    <div className="mt-6 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Code className="h-4 w-4 text-gray-500" />
                        <h3 className="text-sm font-medium text-gray-700">
                          Preview da Query SQL
                        </h3>
                        {isGeneratingQuery && (
                          <Loader2 className="animate-spin h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <SyntaxHighlighter
                        language="sql"
                        style={vs2015}
                        className="rounded-md text-sm"
                      >
                        {previewQuery || 'Gerando query...'}
                      </SyntaxHighlighter>
                    </div>
                  )}

                  {queryState.error && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Erro</h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>{queryState.error}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {queryState.result && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Resultados da Consulta:</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {queryState.result.columns.map((column) => (
                                <th
                                  key={column}
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {queryState.result.rows.map((row, idx) => (
                              <tr key={idx}>
                                {queryState.result.columns.map((column) => (
                                  <td
                                    key={column}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                  >
                                    {formatValue(row[column])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Query History Section */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <div className="flex items-center space-x-2">
                    <History className="h-5 w-5 text-gray-400" />
                    <h2 className="text-lg font-medium text-gray-900">Histórico de Consultas</h2>
                  </div>
                  <div className="mt-4 space-y-4">
                    {queryLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className="border rounded-md p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-sm text-gray-600">
                            {format(log.timestamp, "dd/MM/yyyy HH:mm:ss")}
                          </p>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              log.status === 'success'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {log.status === 'success' ? 'Sucesso' : 'Erro'}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-900">{log.naturalQuery}</p>
                        {log.error && (
                          <p className="mt-2 text-sm text-red-600">{log.error}</p>
                        )}
                      </div>
                    ))}
                    {queryLogs.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Nenhuma consulta realizada. Digite uma consulta em linguagem natural acima.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;