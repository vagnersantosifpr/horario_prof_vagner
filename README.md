# Gerador de Horário Interativo - IFPR

## Visão Geral

Este projeto é uma ferramenta web front-end projetada para visualizar e gerenciar interativamente os horários de aulas e atividades do IFPR (adaptável para cursos ou professores). Ele utiliza uma interface de arrastar e soltar (drag-and-drop) para facilitar a reorganização e alocação de disciplinas ou atividades nos slots de tempo disponíveis. O objetivo principal é fornecer uma maneira visual e flexível de montar e ajustar horários, substituindo processos manuais ou planilhas estáticas.

A principal característica técnica é a separação clara entre a estrutura da interface (HTML), a apresentação (CSS) e os dados/lógica (JavaScript e JSON), tornando a manutenção e atualização dos horários mais simples.

**(Opcional: Adicione um Screenshot ou GIF aqui mostrando a interface e o drag-and-drop em ação!)**
<!-- ![Screenshot do Horário](link/para/screenshot.png) -->
<!-- ![GIF Demo](link/para/demo.gif) -->

**(Opcional: Adicione um link para uma demonstração ao vivo se estiver hospedado, por exemplo, no GitHub Pages)**
<!-- ## Demo ao Vivo -->
<!-- [Acesse a demonstração aqui](link/para/github/pages) -->

## Funcionalidades

*   **Visualização Clara:** Exibe horários em formato de tabela, agrupados por turma ou por professor.
*   **Interface Interativa:** Permite arrastar e soltar cards (representando aulas/atividades) entre diferentes slots de horário.
*   **Funcionalidade de Troca (Swap):** Ao soltar um card sobre outro card existente, as posições são trocadas automaticamente.
*   **Carregamento Dinâmico de Dados:** Os detalhes das disciplinas/atividades e a alocação inicial são carregados a partir de arquivos JSON externos.
*   **Estrutura Flexível:** Facilmente adaptável para diferentes cursos, professores ou estruturas de horário editando os arquivos JSON.
*   **Estilização Customizável:** A aparência (cores, fontes) pode ser modificada através do arquivo `style.css`.

## Tecnologias Utilizadas

*   **HTML5:** Estrutura semântica da página.
*   **CSS3:** Estilização visual, layout (Flexbox/Grid, se aplicável) e cores dos cards.
*   **JavaScript (Vanilla):**
    *   Manipulação do DOM (criação dinâmica das tabelas e cards).
    *   Requisições `fetch` para carregar os arquivos JSON.
    *   Implementação da lógica de drag-and-drop (API nativa HTML Drag and Drop).
    *   Lógica de troca (swap) de elementos.
*   **JSON:** Armazenamento e definição dos dados variáveis (disciplinas/atividades e alocação inicial).

## Estrutura do Projeto
A imagem será colocado posteriormente.



## Estrutura dos Dados (JSON)

A modularidade do projeto depende fortemente da estrutura dos arquivos JSON:

### 1. `disciplines*.json`

Este arquivo funciona como um catálogo de todas as "peças" que podem ser alocadas no horário. Cada objeto no array representa um bloco de aula ou atividade:

*   `id` (String): **Identificador único** para este bloco específico (essencial para o mapeamento na alocação e para o D&D). Ex: `"port1_1ano_a"`, `"inovacaoEmpr"`.
*   `name` (String): Nome completo da disciplina/atividade para referência.
*   `shortName` (String): Nome curto exibido no card (para economizar espaço).
*   `professorKey` ou `type` (String): Chave identificando o professor, a área ou o tipo de atividade (usado internamente ou para estilização). Ex: `"linguas"`, `"info1"`, `"vagner_adm"`.
*   `cssClass` (String): Uma ou mais classes CSS separadas por espaço para aplicar estilos específicos ao card (cor, borda, etc.). Ex: `"lang"`, `"info info1"`, `"activity adm"`.
*   `blockHours` (Number, opcional): Duração do bloco em horas (informativo, pode ser usado no texto do card).

### 2. `allocation*.json`

Este arquivo define o "estado inicial" do horário, mapeando cada slot de tempo para o `id` da disciplina/atividade que o ocupa.

*   **Chave:** Uma string representando o slot no formato `identificador_dia_hora` (onde `identificador` pode ser a turma, como `"1ano"`, ou omitido no caso de horário de professor). Ex: `"1ano_seg_h1"`, `"ter_m2"`.
*   **Valor:** O `id` da disciplina/atividade (conforme definido em `disciplines*.json`) que ocupa aquele slot, ou `null` se o slot estiver explicitamente vazio. Slots não mencionados neste arquivo também são tratados como vazios pelo `script.js`.

## Como Funciona (Detalhes Técnicos)

1.  **Carregamento Inicial:** Ao carregar `index.html`, o `script.js` é executado.
2.  **Busca de Dados:** A função `loadData` (assíncrona) usa a API `fetch` para ler os conteúdos dos arquivos `disciplines*.json` e `allocation*.json`.
3.  **Processamento de Dados:** Os dados JSON são parseados. Um mapa (`disciplineMap`) é criado a partir do array de disciplinas para facilitar a busca por `id`.
4.  **Geração Dinâmica do HTML:** A função `generateTimetableHTML` itera sobre os dias e horários definidos. Para cada slot:
    *   Cria o elemento `<td>` correspondente.
    *   Define atributos `data-*` (`data-day`, `data-time`, `data-turma`/`data-prof`) para identificar o slot.
    *   Consulta o `allocation` JSON para ver qual `id` de disciplina está alocado naquele slot.
    *   Se uma disciplina estiver alocada, busca seus detalhes no `disciplineMap`.
    *   Cria um elemento `<div>` (o card), atribui um `id` único (`card_identificador_dia_hora`), adiciona as classes CSS (`discipline-card` + classes específicas), define o texto (`shortName`), e o torna `draggable`.
    *   Adiciona o card ao `<td>`.
    *   Adiciona classes CSS apropriadas ao `<td>` (ex: `timetable-slot`, `afternoon-slot`, `empty-slot`, `unavailable`).
5.  **Injeção no DOM:** A(s) tabela(s) gerada(s) são adicionadas aos `div`s de contêiner no `index.html`.
6.  **Inicialização do Drag and Drop:** **Após** o HTML ser totalmente gerado e inserido na página, a função `initializeDragDrop` é chamada:
    *   Adiciona listeners de eventos (`dragstart`, `dragend`) a todos os elementos com a classe `.discipline-card`.
    *   Adiciona listeners de eventos (`dragover`, `dragleave`, `drop`) a todos os elementos com a classe `.timetable-slot`.
    *   No `dragstart`, o `id` do card sendo arrastado (`draggedCard`) e seu slot pai original (`originalSlot`) são armazenados.
    *   No `dragover`, o comportamento padrão é prevenido (`e.preventDefault()`) para permitir o `drop`, e uma classe visual (`drag-over`) é adicionada ao slot alvo.
    *   No `drop`:
        *   O comportamento padrão é prevenido.
        *   Identifica o slot alvo (`targetSlot`) e o card que já existe nele (`targetCard`), se houver.
        *   **Lógica de Swap/Move:**
            *   Se `targetSlot` estiver vazio, `draggedCard` é movido para `targetSlot`.
            *   Se `targetSlot` contiver `targetCard` (diferente de `draggedCard`), `targetCard` é movido para `originalSlot`, e `draggedCard` é movido para `targetSlot`, efetuando a troca.
        *   No `dragend`, as variáveis (`draggedCard`, `originalSlot`) e os estilos visuais são limpos.

## Configuração e Execução Local

1.  **Clone o Repositório:**
    ```bash
    git clone https://github.com/seu-usuario/seu-repositorio.git
    cd seu-repositorio
    ```
2.  **Execute um Servidor Local:** Como o projeto usa `fetch` para carregar arquivos JSON locais, abri-lo diretamente do sistema de arquivos (`file://...`) pode causar erros de CORS nos navegadores. Use um servidor web local simples.
    *   **Se tiver Python 3:**
        ```bash
        python -m http.server
        ```
    *   **Se tiver Node.js e npm/npx:**
        ```bash
        npx serve .
        ```
    *   **Usando a extensão Live Server no VS Code:** Clique com o botão direito no `index.html` e selecione "Open with Live Server".
3.  **Acesse no Navegador:** Abra o endereço fornecido pelo servidor (geralmente `http://localhost:8000`, `http://localhost:3000` ou `http://127.0.0.1:5500`).

## Como Usar e Customizar

*   **Reorganizar:** Simplesmente arraste os cards de disciplina/atividade para os slots desejados. Solte em um slot vazio para mover, ou sobre outro card para trocar.
*   **Modificar Horário:**
    *   Para alterar **quais** disciplinas/atividades existem, edite o arquivo `disciplines*.json`.
    *   Para alterar a **alocação inicial** no horário, edite o arquivo `allocation*.json`, ajustando os valores (`id` da disciplina) para as chaves de slot (`identificador_dia_hora`).
*   **Alterar Aparência:** Modifique as cores, fontes, espaçamentos, etc., no arquivo `style.css`. Adicione novas classes de cores se criar novos tipos de atividades no JSON.

## Possíveis Melhorias Futuras

*   **Validação de Conflitos:** Implementar lógica no `drop` para verificar se a troca/movimento gera conflitos (ex: mesmo professor em duas turmas no mesmo horário).
*   **Persistência:** Salvar o estado atual do horário (após modificações) usando `localStorage` do navegador ou enviando para um backend.
*   **Múltiplas Visualizações:** Adicionar botões ou opções para alternar entre visualização por turma, por professor, ou por dia.
*   **Filtros:** Permitir filtrar o horário para mostrar apenas aulas de um professor específico, uma turma, ou uma sala.
*   **Exportação:** Adicionar funcionalidade para exportar o horário atual (ex: para PDF ou CSV).
*   **Interface de Edição:** Criar uma UI mais robusta para adicionar/editar disciplinas diretamente na página, em vez de editar JSON manualmente.
*   **Gerenciamento de Salas/Recursos:** Incluir informação de sala no JSON e validar conflitos de sala.

## Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo `LICENSE` para mais detalhes.






