import fs from 'node:fs';
import path from 'node:path';

class MarkdownReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunComplete(testContexts, results) {
    const relatoriosDir = path.resolve(process.cwd(), 'tests', 'relatorios');
    if (!fs.existsSync(relatoriosDir)) {
      fs.mkdirSync(relatoriosDir, { recursive: true });
    }

    const arquivosExistentes = fs.readdirSync(relatoriosDir);
    const regex = /^relatorio-(\d+)\.md$/;
    let proximoNumero = 1;

    for (const arquivo of arquivosExistentes) {
      const match = arquivo.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= proximoNumero) {
          proximoNumero = num + 1;
        }
      }
    }

    const numeroFormatado = String(proximoNumero).padStart(3, '0');
    const nomeArquivo = `relatorio-${numeroFormatado}.md`;
    const caminhoCompleto = path.join(relatoriosDir, nomeArquivo);

    const dataHora = new Date().toLocaleString('pt-BR');
    const totalSuites = results.numTotalTestSuites;
    const suitesPassadas = results.numPassedTestSuites;
    const suitesFalhadas = results.numFailedTestSuites;
    const totalTestes = results.numTotalTests;
    const testesPassados = results.numPassedTests;
    const testesFalhados = results.numFailedTests;
    const duracaoSegundos = ((Date.now() - results.startTime) / 1000).toFixed(2);

    let linhasTabela = '';

    for (const testResult of results.testResults) {
      for (const assertion of testResult.testResults) {
        const status = assertion.status === 'passed' ? 'APROVADO' : 'REPROVADO';
        const duracao = assertion.duration !== null ? `${assertion.duration} ms` : '-';
        const nome = assertion.fullName.replace(/\|/g, '-');
        linhasTabela += `| ${nome} | ${status} | ${duracao} |\n`;
      }
    }

    const statusGeral = results.success ? 'APROVADO' : 'REPROVADO (COM FALHAS)';

    const conteudo = `# Relatório Técnico de Execução de Testes Automatizados

**Identificador da Execução:** #${numeroFormatado}  
**Data e Horário:** ${dataHora}  
**Status Geral da Suíte:** ${statusGeral}  
**Tempo Total de Execução:** ${duracaoSegundos}s  
**Ambiente de Execução:** Node.js com Jest / Supertest / PostgreSQL  

---

## 1. Objetivo do Documento

Este relatório documenta os resultados obtidos na execução dos testes automatizados de integração da API do projeto MultiCore (ABP-1). 
O objetivo principal é atestar a conformidade e a estabilidade das regras de negócio implementadas para os fluxos essenciais de:
- Cadastro de candidatos e integridade das validações cadastrais (e.g., CPF duplicado e campos obrigatórios).
- Autenticação, controle de acesso e emissão de tokens JWT.
- Armazenamento seguro de credenciais sensíveis (validação de hash criptográfico no banco de dados).
- Proteção de rotas restritas contra requisições não autenticadas ou com sessões expiradas/inválidas.
- Garantia de que informações sigilosas (como senhas em texto puro) nunca sejam expostas em retornos de requisições ou logs da aplicação.

---

## 2. Resumo Quantitativo da Execução

| Métrica Avaliada | Quantidade |
|:---|:---:|
| Total de Suítes de Teste | ${totalSuites} |
| Suítes Aprovadas | ${suitesPassadas} |
| Suítes Reprovadas | ${suitesFalhadas} |
| Total de Testes Unitários/Integração | ${totalTestes} |
| Testes com Sucesso (Passed) | ${testesPassados} |
| Testes com Falha (Failed) | ${testesFalhados} |

---

## 3. Detalhamento dos Cenários de Teste

A tabela a seguir apresenta os resultados individuais obtidos para cada cenário avaliado durante o ciclo de execução:

| Cenário de Teste / Asserção | Status | Duração |
|:---|:---:|:---:|
${linhasTabela || '| Nenhum cenário executado | - | - |\n'}
---

## 4. Instruções para Reprodução dos Testes

Para reproduzir este conjunto de testes em ambiente local ou de integração contínua (CI), siga as etapas abaixo:

### 4.1. Pré-requisitos
1. **Node.js** na versão 20 ou superior.
2. **PostgreSQL** ativo e acessível (via Docker ou instalação local), com as tabelas criadas a partir do script \`backend/database/schemas.sql\`.
3. Arquivo \`.env\` configurado na raiz do projeto contendo as credenciais de banco e a chave \`JWT_SECRET\`.

### 4.2. Instalação de Dependências
Caso ainda não tenha instalado as dependências do backend:

\`\`\`bash
cd backend
npm install
\`\`\`

### 4.3. Execução da Suíte de Testes
Para rodar a suíte completa e disparar a geração automática deste relatório enumerado:

\`\`\`bash
cd backend
npm test
\`\`\`

O Jest executará as asserções de integração e, ao término, acionará o \`MarkdownReporter\` configurado, registrando o novo arquivo sequencial no diretório \`backend/tests/relatorios/\`.

---

*Documento gerado automaticamente pela infraestrutura de testes automatizados.*
`;

    fs.writeFileSync(caminhoCompleto, conteudo, 'utf8');
    console.log(`\n[Relatorio QA] Gerado com sucesso: tests/relatorios/${nomeArquivo}`);
  }
}

export default MarkdownReporter;
