import express from 'express';
import cors from 'cors';
import { BigQuery } from '@google-cloud/bigquery';
import dotenv from 'dotenv';
import { createServer } from 'vite';
import { readFileSync } from 'fs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Carregar as credenciais diretamente do arquivo JSON 
const credentials = JSON.parse(readFileSync('../boatred.json', 'utf8'));

const bigquery = new BigQuery({
  credentials,
  projectId: credentials.project_id
});

app.get('/api/datasets', async (req, res) => {
  try {
    return res.json([{
      id: 'bigquery-public-data.google_trends',
      tables: []
    }]);
  } catch (error) {
    console.error('Erro ao buscar datasets:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar datasets',
      details: error.message
    });
  }
});

app.get('/api/tables/:datasetId', async (req, res) => {
  try {
    const [tables] = await bigquery
      .dataset('google_trends', { projectId: 'bigquery-public-data' })
      .getTables();

    const formattedTables = await Promise.all(tables.map(async (table) => {
      const [metadata] = await table.getMetadata();
      return {
        id: table.id,
        name: table.id,
        schema: metadata.schema
      };
    }));

    res.json(formattedTables);
  } catch (error) {
    console.error('Erro ao buscar tabelas:', error);
    
    let errorMessage = 'Erro ao buscar tabelas';
    let errorDetails = error.message;

    if (error.code === 403) {
      errorMessage = 'Sem permissão para acessar as tabelas';
    } else if (error.code === 404) {
      errorMessage = 'Dataset não encontrado';
    }

    res.status(500).json({ 
      error: errorMessage,
      details: errorDetails
    });
  }
});

app.get('/api/tables/:datasetId/:tableId/schema', async (req, res) => {
  try {
    const { datasetId, tableId } = req.params;
    const dataset = bigquery.dataset('google_trends', { projectId: 'bigquery-public-data' });
    const table = dataset.table(tableId);
    const [metadata] = await table.getMetadata();

    res.json(metadata.schema);
  } catch (error) {
    console.error('Erro ao buscar schema da tabela:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar schema da tabela',
      details: error.message
    });
  }
});

app.post('/api/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Query não pode estar vazia',
        details: 'É necessário fornecer uma consulta SQL válida'
      });
    }

    let finalQuery = query;
    if (!query.toLowerCase().includes('bigquery-public-data.google_trends')) {
      finalQuery = query.replace(
        /FROM\s+([^\s]+)/i,
        'FROM bigquery-public-data.google_trends.$1'
      );
    }

    console.log('Executing query:', finalQuery);

    const options = {
      query: finalQuery,
      location: 'US',
      maximumBytesBilled: '8000000000'
    };

    const [job] = await bigquery.createQueryJob(options);
    console.log(`Job ${job.id} started.`);

    try {
      const [rows] = await job.getQueryResults();
      
      if (rows.length === 0) {
        return res.json({
          columns: [],
          rows: []
        });
      }

      const columns = Object.keys(rows[0]);
      const formattedRows = rows.map(row => {
        const formattedRow = {};
        columns.forEach(col => {
          formattedRow[col] = row[col];
        });
        return formattedRow;
      });

      res.json({
        columns,
        rows: formattedRows
      });
    } catch (queryError) {
      let errorMessage = 'Erro ao executar a consulta';
      let errorDetails = queryError.message;

      // Tratamento específico para erros comuns do BigQuery
      if (queryError.message.includes('Syntax error')) {
        errorMessage = 'Erro de sintaxe na consulta SQL';
        errorDetails = queryError.message.split('Syntax error:')[1]?.trim() || queryError.message;
      } else if (queryError.message.includes('Table not found')) {
        errorMessage = 'Tabela não encontrada';
        errorDetails = 'Verifique se o nome da tabela está correto e se você tem acesso a ela';
      } else if (queryError.message.includes('Permission denied')) {
        errorMessage = 'Permissão negada';
        errorDetails = 'Você não tem permissão para acessar esta tabela ou dataset';
      } else if (queryError.message.includes('exceeded')) {
        errorMessage = 'Limite de recursos excedido';
        errorDetails = 'A consulta excedeu os limites de processamento ou dados';
      }

      res.status(400).json({
        error: errorMessage,
        details: errorDetails,
        query: finalQuery
      });
    }
  } catch (error) {
    console.error('Erro ao processar consulta:', error);
    
    res.status(500).json({ 
      error: 'Erro ao processar a consulta',
      details: error.message,
      query: req.body.query
    });
  }
});

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'spa'
});

app.use(vite.middlewares);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});