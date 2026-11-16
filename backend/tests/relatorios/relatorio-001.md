# Relatório Técnico de Execução de Testes Automatizados

**Identificador da Execução:** #001  
**Data e Horário:** 16/11/2026, 02:00:00  
**Status Geral da Suíte:** APROVADO  
**Tempo Total de Execução:** 2.15s  
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
| Total de Suítes de Teste | 1 |
| Suítes Aprovadas | 1 |
| Suítes Reprovadas | 0 |
| Total de Testes Unitários/Integração | 7 |
| Testes com Sucesso (Passed) | 7 |
| Testes com Falha (Failed) | 0 |

---

## 3. Detalhamento dos Cenários de Teste

A tabela a seguir apresenta os resultados individuais obtidos para cada cenário avaliado durante o ciclo de execução:

| Cenário de Teste / Asserção | Status | Duração |
|:---|:---:|:---:|
| Sprint 2 end-to-end flow cadastrar candidato válido | APROVADO | 198 ms |
| Sprint 2 end-to-end flow cadastrar candidato duplicado devolve erro 400 | APROVADO | 42 ms |
| Sprint 2 end-to-end flow login com credenciais corretas | APROVADO | 75 ms |
| Sprint 2 end-to-end flow login com senha incorreta devolve 401 | APROVADO | 31 ms |
| Sprint 2 end-to-end flow senha armazenada como hash no BD | APROVADO | 58 ms |
| Sprint 2 end-to-end flow rota protegida rejeita acesso sem token | APROVADO | 20 ms |
| Sprint 2 end-to-end flow rota protegida aceita token válido | APROVADO | 25 ms |

---

## 4. Instruções para Reprodução dos Testes

Para reproduzir este conjunto de testes em ambiente local ou de integração contínua (CI), siga as etapas abaixo:

### 4.1. Pré-requisitos
1. **Node.js** na versão 20 ou superior.
2. **PostgreSQL** ativo e acessível (via Docker ou instalação local), com as tabelas criadas a partir do script `backend/database/schemas.sql`.
3. Arquivo `.env` configurado na raiz do projeto contendo as credenciais de banco e a chave `JWT_SECRET`.

### 4.2. Instalação de Dependências
Caso ainda não tenha instalado as dependências do backend:

```bash
cd backend
npm install
```

### 4.3. Execução da Suíte de Testes
Para rodar a suíte completa e disparar a geração automática deste relatório enumerado:

```bash
cd backend
npm test
```

O Jest executará as asserções de integração e, ao término, acionará o `MarkdownReporter` configurado, registrando o novo arquivo sequencial no diretório `backend/tests/relatorios/`.

---

*Documento gerado automaticamente pela infraestrutura de testes automatizados.*
