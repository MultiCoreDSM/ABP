# Relatório Técnico de Execução de Testes Automatizados

**Identificador da Execução:** #001  
**Data e Horário:** 22/11/2026, 21:40:33  
**Status Geral da Suíte:** APROVADO  
**Tempo Total de Execução:** 5.30s  
**Ambiente de Execução:** Node.js com Jest / Supertest / PostgreSQL 16  

---

## 1. Objetivo do Documento

Este relatório documenta os resultados obtidos na execução real da suíte de testes automatizados do projeto MultiCore (ABP-1), cobrindo:
- **QA-01 (Integração):** cadastro válido e CPF duplicado, autenticação válida e credenciais incorretas, verificação de hash bcrypt no banco e ausência de senha em respostas/logs, acesso a rotas protegidas sem sessão, expiração e encerramento de sessão.
- **DB-05 (Modelagem do Banco de Dados):** identificação inequívoca de tentativa e candidato, validação de estados permitidos, reconstrução temporal do ciclo de vida (início, atualização, pausa e conclusão), vínculo com as 12 questões sorteadas e prevenção de tentativas ativas simultâneas.

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

---

## 3. Detalhamento dos Cenários de Teste

A tabela a seguir apresenta os resultados individuais obtidos para cada cenário avaliado durante o ciclo de execução:

| Cenário de Teste / Asserção | Status | Duração |
|:---|:---:|:---:|
| Sprint 2 — Modelagem de Banco de Dados (Tentativas de Certificacao) Atividade 1 e Criterio 1: Uma tentativa identifica exatamente um candidato | APROVADO | 75 ms |
| Sprint 2 — Modelagem de Banco de Dados (Tentativas de Certificacao) Atividade 2 e Criterio 3: Estados invalidos nao sao aceitos silenciosamente | APROVADO | 61 ms |
| Sprint 2 — Modelagem de Banco de Dados (Tentativas de Certificacao) Atividade 3 e Criterio 4: Datas e transicoes permitem reconstruir o ciclo de vida da tentativa | APROVADO | 135 ms |
| Sprint 2 — Modelagem de Banco de Dados (Tentativas de Certificacao) Atividade 4 e Criterio 2: Vinculo imutavel com as 12 questoes sorteadas na tentativa | APROVADO | 91 ms |
| Sprint 2 — Modelagem de Banco de Dados (Tentativas de Certificacao) Atividade 5: Impede tentativas simultaneas ativas para o mesmo candidato | APROVADO | 47 ms |
| Sprint 2 — Fluxo Integrado QA-01 (Cadastro, Login, Sessao e Seguranca) Atividade 1: Cadastrar candidato com dados validos | APROVADO | 350 ms |
| Sprint 2 — Fluxo Integrado QA-01 (Cadastro, Login, Sessao e Seguranca) Atividade 1: Rejeitar tentativa de cadastro com CPF duplicado | APROVADO | 278 ms |
| Sprint 2 — Fluxo Integrado QA-01 (Cadastro, Login, Sessao e Seguranca) Atividade 2: Autenticar com credenciais corretas | APROVADO | 297 ms |
| Sprint 2 — Fluxo Integrado QA-01 (Cadastro, Login, Sessao e Seguranca) Atividade 2: Rejeitar login com credenciais incorretas (senha divergente) | APROVADO | 310 ms |
| Sprint 2 — Fluxo Integrado QA-01 (Cadastro, Login, Sessao e Seguranca) Atividade 3: Verificar que a senha foi armazenada unicamente como hash bcrypt no banco | APROVADO | 283 ms |
| Sprint 2 — Fluxo Integrado QA-01 (Cadastro, Login, Sessao e Seguranca) Atividade 3: Rota /api/candidatos/me nao deve expor senha nem hash | APROVADO | 12 ms |
| Sprint 2 — Fluxo Integrado QA-01 (Cadastro, Login, Sessao e Seguranca) Atividade 4: Rejeitar acesso a rota protegida quando nenhum token e enviado | APROVADO | 8 ms |
| Sprint 2 — Fluxo Integrado QA-01 (Cadastro, Login, Sessao e Seguranca) Atividade 4: Rejeitar acesso a rota protegida com formato Authorization invalido | APROVADO | 6 ms |
| Sprint 2 — Fluxo Integrado QA-01 (Cadastro, Login, Sessao e Seguranca) Atividade 4: Permitir acesso a rota protegida quando token valido for informado | APROVADO | 11 ms |
| Sprint 2 — Fluxo Integrado QA-01 (Cadastro, Login, Sessao e Seguranca) Atividade 5: Rejeitar token expirado com mensagem de expiracao | APROVADO | 6 ms |
| Sprint 2 — Fluxo Integrado QA-01 (Cadastro, Login, Sessao e Seguranca) Atividade 5: Simulacao de encerramento da sessao (logout no cliente descarta token) | APROVADO | 5 ms |

---

## 4. Instruções para Reprodução dos Testes

Para reproduzir este conjunto de testes em ambiente local ou de integração contínua (CI), siga as etapas abaixo:

### 4.1. Pré-requisitos
1. **Node.js** na versão 20 ou superior.
2. **PostgreSQL** ativo e acessível (via Docker Compose ou instalação local), inicializado com `backend/database/schemas.sql` e `backend/database/seed.sql`.
3. Arquivo `.env` configurado na raiz do projeto contendo as credenciais de banco e a chave `JWT_SECRET`.

### 4.2. Instalação de Dependências
Caso ainda não tenha instalado as dependências do backend:

```bash
cd backend
npm install
```

### 4.3. Execução da Suíte de Testes
Para rodar a suíte completa (`api.test.js` e `db.test.js`) e disparar a geração automática deste relatório enumerado:

```bash
cd backend
npm test
```

O Jest executará as asserções de integração e banco de dados e, ao término, acionará o `MarkdownReporter` configurado, registrando o novo arquivo sequencial no diretório `backend/tests/relatorios/`.

---

*Documento gerado automaticamente pela infraestrutura de testes automatizados.*
