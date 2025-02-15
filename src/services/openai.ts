import OpenAI from 'openai';
import { getEnvConfig } from '../config/env';
import type { TableSchema } from '../types';

const { OPENAI_API_KEY } = getEnvConfig();

export const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const generateSQLQuery = async (
  naturalLanguageQuery: string,
  tableSchema?: TableSchema
): Promise<string> => {
  const messages = [
    {
      role: "system",
      content: "Você é um especialista em SQL que converte consultas em linguagem natural para consultas SQL válidas para o BigQuery. Retorne apenas a consulta SQL, sem explicações adicionais."
    }
  ];

  if (tableSchema) {
    const schemaDescription = `A tabela possui as seguintes colunas:\n${
      tableSchema.fields
        .map(field => `- ${field.name} (${field.type})${field.description ? `: ${field.description}` : ''}`)
        .join('\n')
    }`;

    messages.push({
      role: "system",
      content: schemaDescription
    });
  }

  messages.push({
    role: "user",
    content: naturalLanguageQuery
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages,
  });

  return completion.choices[0].message.content || '';
};