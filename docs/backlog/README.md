# Backlog — ABP DSM

**Grupo:** MultiCore

Este backlog reúne as principais funcionalidades planejadas para a plataforma de estudos e certificação em metodologias ágeis. Os itens estão separados por área para facilitar a organização do projeto e ajudar o time a visualizar o que precisa ser desenvolvido em cada parte do sistema.

Cada requisito possui uma prioridade, que indica o quanto ele é importante para o funcionamento da primeira versão da plataforma. Durante o planejamento das sprints, o time usa esta lista para escolher as próximas atividades, dividir responsabilidades e acompanhar a evolução do projeto pelo [Kanban ABP](https://github.com/users/MultiCoreDSM/projects/1).

O backlog pode ser atualizado ao longo do desenvolvimento conforme novas necessidades forem identificadas ou algum requisito precisar de ajustes.

| ID | Área | Funcionalidade | Requisitos / critérios de aceitação | Prioridade |
| --- | --- | --- | --- | --- |
| BL-01 | Acesso | Cadastro | Permitir cadastro com CPF, nome completo e senha. |Alto |
| BL-02 | Acesso | Login | Permitir autenticação com CPF e senha. |Alto |
| BL-03 | Tela inicial | Apresentação da certificação | Descrever a certificação, seus objetivos e as instruções para realizá-la. |Alto |
| BL-04 | Tela inicial | Escolha de início | Oferecer a opção de iniciar a certificação agora ou realizá-la posteriormente. |Alto |
| BL-05 | Estudos | Material de consulta | Disponibilizar uma área de estudos organizada pelos mesmos 12 temas da certificação, com conteúdo didático, imagens e outros materiais de apoio. |Alto |
| BL-06 | Certificação | Banco de questões | Disponibilizar 12 temas, cada um com 4 questões. |Alto |
| BL-07 | Certificação | Sorteio de questões | Sortear aleatoriamente apenas 1 questão de cada tema para o candidato. |Alto |
| BL-08 | Certificação | Resposta única por tema | Garantir que cada tema possa ser respondido apenas uma vez. |Alto |
| BL-09 | Certificação | Contagem regressiva | Exibir uma contagem regressiva de 150 segundos para cada questão. |Alto |
| BL-10 | Certificação | Confirmação para avançar | Solicitar confirmação para prosseguir para a próxima questão. |Alto |
| BL-11 | Certificação | Correção após resposta | Exibir a alternativa correta após cada questão respondida. | Médio |
| BL-12 | Certificação | Pausa e retomada | Permitir pausar a certificação e retomá-la posteriormente, respeitando as regras de encerramento da questão. |Média  |
| BL-13 | Certificação | Perda de conexão ou fechamento do navegador | Encerrar a questão em andamento e registrar a alternativa marcada, caso exista; se nenhuma alternativa estiver marcada, considerar a questão incorreta. |Média |
| BL-14 | Certificação | Encerramento por tempo esgotado | Ao acabar os 150 segundos, encerrar automaticamente a questão, registrar a alternativa marcada, caso exista, considerar a questão incorreta, exibir a alternativa correta e permitir prosseguir ou interromper a certificação. |Alto |
| BL-15 | Progresso | Acompanhamento da certificação | Exibir os temas concluídos e os temas pendentes. | Alto |
| BL-16 | Resultado | Percentual de acertos | Calcular a porcentagem de acertos da prova. |Alto|
| BL-17 | Resultado | Nota final | Calcular a nota final da certificação após a conclusão dos 12 temas. |Alto |
| BL-18 | Certificado | Critério de emissão | Emitir o certificado somente para candidatos com aproveitamento igual ou superior a 65%. |Alto |
| BL-19 | Certificado | Modelo e informações | Projetar o certificado com nome completo, CPF, e-mail, data e hora da emissão, nota final obtida, percentual de acertos e QR Code (RF18 do documento oficial). |Alto |
| BL-20 | Certificado | QR Code de autenticação | Incluir no certificado um QR Code para acessar sua validação pública. |Alto |
| BL-21 | Certificado | Validação pública | Disponibilizar um sistema público de validação do certificado acessível pelo QR Code, exibindo somente os dados aprovados em DP-01 (RN-09). | Alto |
| BL-22 | Histórico | Histórico de certificação | Registrar os temas respondidos, as questões sorteadas, as respostas escolhidas, as respostas corretas e a data e o horário de cada resposta. |Médio |
| BL-23 | Interface | Responsividade | Adaptar a interface a diferentes tamanhos de tela. | Baixa |

## Requisitos não funcionais

| ID | Categoria | Requisito | Critério de verificação | Prioridade |
| --- | --- | --- | --- | --- |
| RNF-01 | Tecnologia | Front-end em HTML, CSS e JavaScript; back-end em Node.js com Express; banco PostgreSQL 16 | Versões declaradas no README e no `package.json` | Alto |
| RNF-02 | Segurança | Senhas armazenadas apenas como hash (bcrypt) | Nenhuma coluna guarda a senha em texto; login compara via `bcrypt.compare` | Alto |
| RNF-03 | Segurança | Rotas da prova exigem autenticação por token | Requisição sem token em `/api/questoes/*` retorna 401 | Alto |
| RNF-04 | Reprodutibilidade | O projeto roda a partir de um clone limpo seguindo só o README | `docker compose up` + `npm install` + `npm start` sem passos extras | Alto |
| RNF-05 | Integridade | O horário de início e resposta é registrado pelo servidor, não pelo navegador | Colunas de data/hora preenchidas pelo banco (`clock_timestamp()`) | Alto |
| RNF-06 | Usabilidade | Interface legível e utilizável em celular | Telas funcionam a partir de 360 px de largura | Média |
| RNF-07 | Privacidade | A validação pública não expõe CPF completo nem e-mail | Página de validação mostra no máximo CPF mascarado | Média |
| RNF-08 | Execução | Aplicação executável em contêiner | Serviços sobem com `docker compose up` | Média |

## Regras de negócio

| ID | Regra | Requisitos relacionados |
| --- | --- | --- |
| RN-01 | O CPF é único: não pode haver dois candidatos com o mesmo CPF | BL-01 |
| RN-02 | Cada tema tem exatamente 4 questões, e cada questão tem 4 alternativas com exatamente 1 correta | BL-06 |
| RN-03 | O candidato recebe 1 questão sorteada por tema e responde cada tema uma única vez | BL-07, BL-08 |
| RN-04 | Cada questão tem prazo de 150 segundos contados a partir da exibição | BL-09, BL-14 |
| RN-05 | Resposta após o prazo, ou sem alternativa marcada, conta como incorreta | BL-13, BL-14 |
| RN-06 | A nota final só é calculada após os 12 temas | BL-17 |
| RN-07 | O certificado só é emitido com aproveitamento ≥ 65% | BL-18 |
| RN-08 | Cada certificado tem um código único, usado no QR Code e na validação pública | BL-20, BL-21 |
| RN-09 | A validação pública busca só pelo código do certificado e exibe somente nome completo, CPF mascarado (`***.456.789-**`), data de emissão, situação e percentual de acertos. Nunca exibe e-mail nem CPF completo | BL-21 |

## Decisões do PO

| ID | Decisão | Definição | Origem | Situação |
| --- | --- | --- | --- | --- |
| DP-01 | Dados exibidos na validação pública (BL-21) | Nome completo, CPF mascarado (`***.456.789-**`), data de emissão, situação ("válido") e percentual de acertos. O e-mail e o CPF completo nunca aparecem. A busca é feita só pelo código do certificado, nunca por CPF ou nome (RN-09). | QA-08 / R1 (RNF03, RNF04) | ✅ Aprovada pelo PO em 11/11/2026 |
| DP-02 | E-mail no certificado (BL-19) | **Revista em 12/11/2026:** o RF18 do documento oficial exige nome completo, CPF e e-mail no certificado, então eles voltaram. O certificado só é exibido ao próprio candidato, com login. A validação pública continua com os dados da RN-09, sem e-mail e com o CPF mascarado. (Decisão original de 11/11: retirar o e-mail.) | QA-08 / R1 | ✅ Aprovada pelo PO em 11/11/2026 |
| DP-03 | Gabarito no repositório público | O `backend/database/seed.sql` traz a alternativa correta das 48 questões, e o repositório é público. Risco aceito: o projeto é acadêmico e o seed fica como está. Se o portal for usado numa certificação real, o banco de questões precisa ser trocado e mantido fora do repositório público. | QA-08 / R3 | ✅ Risco aceito pelo PO em 11/11/2026 |


[Voltar ao README principal](../../README.md)
