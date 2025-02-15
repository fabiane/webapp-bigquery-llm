# BigQuery NL Interface

Uma interface moderna que permite fazer consultas no BigQuery usando linguagem natural, convertendo-as automaticamente para SQL através da API da OpenAI.

## 🚀 Stack Tecnológica

### Frontend
- **React 18** - Biblioteca para construção de interfaces
- **TypeScript** - Superset JavaScript com tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utility-first
- **Lucide React** - Biblioteca de ícones
- **React Syntax Highlighter** - Highlight de código SQL
- **date-fns** - Manipulação de datas

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **@google-cloud/bigquery** - Cliente oficial do BigQuery
- **OpenAI API** - Conversão de linguagem natural para SQL

### Integrações
- **BigQuery** - Data warehouse do Google Cloud
- **OpenAI GPT-4** - Modelo de linguagem para conversão de texto para SQL

## 🔄 Fluxo de Requisições

1. **Seleção de Dataset e Tabela**
   - `/api/datasets` - Retorna lista de datasets disponíveis
   - `/api/tables/:datasetId` - Retorna tabelas do dataset selecionado
   - `/api/tables/:datasetId/:tableId/schema` - Retorna schema da tabela

2. **Processo de Consulta**
   1. Usuário digita uma consulta em linguagem natural
   2. Frontend envia o texto para a OpenAI API
   3. GPT-4 converte o texto em uma query SQL válida
   4. Query SQL é enviada para o BigQuery
   5. Resultados são formatados e exibidos na interface

3. **Preview em Tempo Real**
   - Geração de preview da query SQL enquanto o usuário digita
   - Feedback visual imediato da conversão

## 🛠️ Configuração do Projeto

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
   - Renomeie `.env.example` para `.env`
   - Adicione sua chave da API da OpenAI
   - Configure as credenciais do BigQuery, aqui usei uma service account e gerei um json como credencial

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 🔒 Segurança

- Validação de queries antes da execução
- Limite de processamento configurável no BigQuery
- Tratamento de erros específicos para cada tipo de falha
- Sanitização de inputs do usuário

## 🌟 Features

- Interface responsiva e moderna
- Preview em tempo real das queries SQL
- Histórico de consultas
- Formatação inteligente dos resultados
- Suporte a diferentes tipos de dados
- Tratamento de erros amigável
- Feedback visual do status das operações

## 📊 Limitações do BigQuery

- Máximo de bytes processados por consulta: 9TB
- Resultados paginados para grandes conjuntos de dados
- Timeout padrão de 10 minutos por consulta

## 🤝 Contribuição

Contribuições são bem-vindas!

## Licença

Este projeto está licenciado sob a [Creative Commons Attribution-NonCommercial 4.0](http://creativecommons.org/licenses/by-nc/4.0/).  
Você pode compartilhar e modificar o código, desde que mencione o autor original e não utilize para fins comerciais.

## Linkedin

https://www.linkedin.com/in/fabianesouzaalmeida