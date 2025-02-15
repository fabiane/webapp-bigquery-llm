export interface QueryLog {
  timestamp: Date;
  naturalQuery: string;
  sqlQuery: string;
  status: 'success' | 'error';
  error?: string;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
}

export interface QueryState {
  isLoading: boolean;
  error: string | null;
  result: QueryResult | null;
  sqlQuery: string | null;
}

export interface Dataset {
  id: string;
  tables: Table[];
}

export interface Table {
  id: string;
  name: string;
  schema?: TableSchema;
}

export interface TableSchema {
  fields: TableField[];
}

export interface TableField {
  name: string;
  type: string;
  mode?: string;
  description?: string;
}