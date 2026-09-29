# Backlog — ABP DSM

**Grupo:** MultiCore

Os requisitos estão organizados por área. A coluna **Prioridade** permanece vazia para definição pelo grupo; a ordem das linhas não representa uma priorização.

| ID | Área | Funcionalidade | Requisitos / critérios de aceitação | Prioridade |
| --- | --- | --- | --- | --- |
| BL-01 | Acesso | Cadastro | Permitir cadastro com CPF, nome completo e senha. | |
| BL-02 | Acesso | Login | Permitir autenticação com CPF e senha. | |
| BL-03 | Tela inicial | Apresentação da certificação | Descrever a certificação, seus objetivos e as instruções para realizá-la. | |
| BL-04 | Tela inicial | Escolha de início | Oferecer a opção de iniciar a certificação agora ou realizá-la posteriormente. | |
| BL-05 | Estudos | Material de consulta | Disponibilizar uma área de estudos organizada pelos mesmos 12 temas da certificação, com conteúdo didático, imagens e outros materiais de apoio. | |
| BL-06 | Certificação | Banco de questões | Disponibilizar 12 temas, cada um com 4 questões. | |
| BL-07 | Certificação | Sorteio de questões | Sortear aleatoriamente apenas 1 questão de cada tema para o candidato. | |
| BL-08 | Certificação | Resposta única por tema | Garantir que cada tema possa ser respondido apenas uma vez. | |
| BL-09 | Certificação | Contagem regressiva | Exibir uma contagem regressiva de 150 segundos para cada questão. | |
| BL-10 | Certificação | Confirmação para avançar | Solicitar confirmação para prosseguir para a próxima questão. | |
| BL-11 | Certificação | Correção após resposta | Exibir a alternativa correta após cada questão respondida. | |
| BL-12 | Certificação | Pausa e retomada | Permitir pausar a certificação e retomá-la posteriormente, respeitando as regras de encerramento da questão. | |
| BL-13 | Certificação | Perda de conexão ou fechamento do navegador | Encerrar a questão em andamento e registrar a alternativa marcada, caso exista; se nenhuma alternativa estiver marcada, considerar a questão incorreta. | |
| BL-14 | Certificação | Encerramento por tempo esgotado | Ao acabar os 150 segundos, encerrar automaticamente a questão, registrar a alternativa marcada, caso exista, considerar a questão incorreta, exibir a alternativa correta e permitir prosseguir ou interromper a certificação. | |
| BL-15 | Progresso | Acompanhamento da certificação | Exibir os temas concluídos e os temas pendentes. | |
| BL-16 | Resultado | Percentual de acertos | Calcular a porcentagem de acertos da prova. | |
| BL-17 | Resultado | Nota final | Calcular a nota final da certificação após a conclusão dos 12 temas. | |
| BL-18 | Certificado | Critério de emissão | Emitir o certificado somente para candidatos com aproveitamento igual ou superior a 65%. | |
| BL-19 | Certificado | Modelo e informações | Projetar o certificado com nome completo, CPF, e-mail, data e hora da emissão, nota final obtida e percentual de acertos. | |
| BL-20 | Certificado | QR Code de autenticação | Incluir no certificado um QR Code para acessar sua validação pública. | |
| BL-21 | Certificado | Validação pública | Disponibilizar um sistema público de validação do certificado acessível pelo QR Code. | |
| BL-22 | Histórico | Histórico de certificação | Registrar os temas respondidos, as questões sorteadas, as respostas escolhidas, as respostas corretas e a data e o horário de cada resposta. | |
| BL-23 | Interface | Responsividade | Adaptar a interface a diferentes tamanhos de tela. | |

## Pontos a definir

- **E-mail no certificado:** definir como será obtido, pois o cadastro informado prevê apenas CPF, nome completo e senha.
- **Tempo esgotado:** foi adotada a regra específica de considerar a questão incorreta ao fim dos 150 segundos, mesmo quando houver uma alternativa marcada, mantendo o registro dessa alternativa.

[Voltar ao README principal](../../README.md)
