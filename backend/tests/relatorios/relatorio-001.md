# Relatório Técnico de Execução de Testes Automatizados

**Identificador da Execução:** #001  
**Data e Horário:** 16/11/2026, 02:40:00  
**Status Geral da Suíte:** APROVADO  
**Tempo Total de Execução:** 3.12s  
**Ambiente de Execução:** Node.js com Jest / Supertest / PostgreSQL 16  

---

## 1. Objetivo do Documento

Este relatório documenta a execução integrada da suíte de testes automatizados do projeto MultiCore (ABP-1) para o fechamento da **Sprint 2**, consolidando as validações das tasks:
- **QA-01 (Integração):** Cadastro de candidatos, autenticação com JWT, proteção de rotas, verificação de hash bcrypt no banco de dados e controle de sessão/expiração.
- **DB-05 (Modelagem do Banco de Dados):** Persistência de tentativas de certificação, ciclo de vida com transições válidas de estado, timestamps de auditoria, vínculo imutável com as 12 questões sorteadas e prevenção de concorrência com tentativas ativas simultâneas.

---

## 2. Resumo Quantitativo da Execução

| Métrica Avaliada | Quantidade |
|:---|:---:|
| Total de Suítes de Teste | 2 |
| Suítes Aprovadas | 2 |
| Suítes Reprovadas | 0 |
| Total de Testes Unitários/Integração | 16 |
| Testes com Sucesso (Passed) | 16 |
| Testes com Falha (Failed) | 0 |
| Taxa Global de Sucesso | 100% |

---

## 3. Detalhamento Consolidado das Asserções

A tabela a seguir apresenta os resultados individuais obtidos para cada cenário avaliado na suíte integrada de testes:

| Domínio / Task | Cenário de Teste / Asserção | Status | Duração |
|:---|:---|:---:|:---:|
| **QA-01** | Atividade 1: Cadastrar candidato com dados validos | APROVADO | 195 ms |
| **QA-01** | Atividade 1: Rejeitar tentativa de cadastro com CPF duplicado | APROVADO | 38 ms |
| **QA-01** | Atividade 2: Autenticar com credenciais corretas | APROVADO | 72 ms |
| **QA-01** | Atividade 2: Rejeitar login com credenciais incorretas (senha divergente) | APROVADO | 29 ms |
| **QA-01** | Atividade 3: Verificar que a senha foi armazenada unicamente como hash bcrypt no banco | APROVADO | 55 ms |
| **QA-01** | Atividade 3: Rota /api/candidatos/me nao deve expor senha nem hash | APROVADO | 22 ms |
| **QA-01** | Atividade 4: Rejeitar acesso a rota protegida quando nenhum token e enviado | APROVADO | 18 ms |
| **QA-01** | Atividade 4: Rejeitar acesso a rota protegida com formato Authorization invalido | APROVADO | 16 ms |
| **QA-01** | Atividade 4: Permitir acesso a rota protegida quando token valido for informado | APROVADO | 24 ms |
| **QA-01** | Atividade 5: Rejeitar token expirado com mensagem de expiracao | APROVADO | 21 ms |
| **QA-01** | Atividade 5: Simulacao de encerramento da sessao (logout no cliente descarta token) | APROVADO | 17 ms |
| **DB-05** | Atividade 1 e Criterio 1: Uma tentativa identifica exatamente um candidato | APROVADO | 45 ms |
| **DB-05** | Atividade 2 e Criterio 3: Estados invalidos nao sao aceitos silenciosamente | APROVADO | 28 ms |
| **DB-05** | Atividade 3 e Criterio 4: Datas e transicoes permitem reconstruir o ciclo de vida da tentativa | APROVADO | 62 ms |
| **DB-05** | Atividade 4 e Criterio 2: Vinculo imutavel com as 12 questoes sorteadas na tentativa | APROVADO | 84 ms |
| **DB-05** | Atividade 5: Impede tentativas simultaneas ativas para o mesmo candidato | APROVADO | 39 ms |

---

## 4. Instruções para Reprodução dos Testes

Para reproduzir este conjunto completo de testes em ambiente local ou de integração contínua (CI), siga as etapas abaixo:

### 4.1. Pré-requisitos
1. **Node.js** na versão 20 ou superior.
2. **PostgreSQL** ativo e acessível (via Docker Compose ou instalação local), com o schema atualizado a partir de `backend/database/schemas.sql`.
3. Arquivo `.env` configurado na raiz do projeto contendo as credenciais de banco e a chave `JWT_SECRET`.

### 4.2. Instalação de Dependências
```bash
cd backend
npm install
```

### 4.3. Execução da Suíte Completa
```bash
cd backend
npm test
```

O comando executará todas as suítes (`api.test.js` e `db05-tentativas.test.js`) e invocará o `MarkdownReporter`, gerando o próximo arquivo sequencial consolidado em `backend/tests/relatorios/`.

---

*Documento gerado automaticamente pela infraestrutura de testes automatizados.*
