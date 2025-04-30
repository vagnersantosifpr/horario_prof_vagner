document.addEventListener('DOMContentLoaded', () => {
    // --- Configurações ---
    const professorId = 'vagner'; // Identificador do professor
    const dias = ['seg', 'ter', 'qua', 'qui', 'sex'];
    const horariosManha = ['m1', 'm2', 'm3', 'm4', 'm5'];
    const horariosTarde = ['t1', 't2', 't3', 't4', 't5'];
    const horariosNoite = ['n1', 'n2', 'n3', 'n4'];
    const allHorarios = [...horariosManha, ...horariosTarde, ...horariosNoite];

    const horarioLabels = {
        m1: "M1 (07:30)", m2: "M2 (08:20)", m3: "M3 (09:25)", m4: "M4 (10:15)", m5: "M5 (11:05)",
        t1: "T1 (13:10)", t2: "T2 (14:00)", t3: "T3 (15:05)", t4: "T4 (15:55)", t5: "T5 (16:45)",
        n1: "N1 (19:00)", n2: "N2 (19:50)", n3: "N3 (21:00)", n4: "N4 (21:50)"
    };

    const disciplinasFile = `disciplines_${professorId}.json`;
    const allocationFile = `allocation_${professorId}.json`;

    // --- Carregamento de Dados ---
    async function loadData() {
        try {
            const [disciplinesRes, allocationRes] = await Promise.all([
                fetch(disciplinasFile),
                fetch(allocationFile)
            ]);

            if (!disciplinesRes.ok) throw new Error(`Erro ao carregar ${disciplinasFile}: ${disciplinesRes.statusText}`);
            if (!allocationRes.ok) throw new Error(`Erro ao carregar ${allocationFile}: ${allocationRes.statusText}`);

            const disciplines = await disciplinesRes.json();
            const allocation = await allocationRes.json();

            const disciplineMap = disciplines.reduce((map, disc) => {
                map[disc.id] = disc;
                return map;
            }, {});

            return { disciplineMap, allocation };
        } catch (error) {
            console.error("Falha ao carregar dados JSON:", error);
            document.querySelector('.timetable-container').innerHTML = `<p style="color:red; text-align:center;">Erro ao carregar dados do horário. Verifique os arquivos JSON e o console.</p>`;
            return null;
        }
    }

    // --- Geração do HTML da Tabela do Professor ---
    function generateTimetableHTML(profId, disciplineMap, allocation) {
        const section = document.createElement('section');
        section.className = 'turma-schedule'; // Reutilizando a classe
        section.id = `schedule-${profId}`;

        const title = document.createElement('h2');
        title.className = 'turma-title'; // Reutilizando a classe
        // Obter nome do H1 da página original ou definir manualmente
        const profName = document.querySelector('h1')?.textContent.replace('Horário Interativo - ', '') || profId;
        title.textContent = `Horário - ${profName}`;
        section.appendChild(title);

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Cabeçalho (Dias)
        const headerRow = document.createElement('tr');
        const thHora = document.createElement('th');
        thHora.className = 'time-header-col';
        thHora.textContent = 'Horário';
        headerRow.appendChild(thHora);
        dias.forEach(dia => {
            const thDia = document.createElement('th');
            // Capitaliza: Seg -> Segunda-Feira
            let diaCompleto = dia.charAt(0).toUpperCase() + dia.slice(1);
            if (dia === 'seg') diaCompleto = 'Segunda';
            if (dia === 'ter') diaCompleto = 'Terça';
            if (dia === 'qua') diaCompleto = 'Quarta';
            if (dia === 'qui') diaCompleto = 'Quinta';
            if (dia === 'sex') diaCompleto = 'Sexta';
            diaCompleto += '-Feira';
            thDia.textContent = diaCompleto;
            headerRow.appendChild(thDia);
        });
        thead.appendChild(headerRow);

        // Corpo da Tabela
        allHorarios.forEach((hora, index) => {
            // Adiciona separadores de período
            if (hora === 't1' && index > 0) { // Intervalo Almoço
                 const separatorRow = document.createElement('tr');
                 separatorRow.className = 'interval-separator'; // Classe para intervalo
                 const separatorCell = document.createElement('td');
                 separatorCell.colSpan = dias.length + 1;
                 separatorCell.textContent = 'Intervalo Almoço';
                 separatorRow.appendChild(separatorCell);
                 tbody.appendChild(separatorRow);
            } else if (hora === 'n1' && index > 0) { // Intervalo Tarde/Noite
                 const separatorRow = document.createElement('tr');
                 separatorRow.className = 'interval-separator';
                 const separatorCell = document.createElement('td');
                 separatorCell.colSpan = dias.length + 1;
                 separatorCell.textContent = 'Intervalo entre Turnos';
                 separatorRow.appendChild(separatorCell);
                 tbody.appendChild(separatorRow);
            }

            const tr = document.createElement('tr');
             // Adiciona classe específica para linhas da tarde/noite se necessário
             if (horariosTarde.includes(hora)) tr.classList.add('afternoon-row');
             if (horariosNoite.includes(hora)) tr.classList.add('night-row'); // Nova classe se precisar estilo diferente

            // Célula do Horário
            const tdHora = document.createElement('td');
            tdHora.className = 'time-label';
            tdHora.textContent = horarioLabels[hora] || hora;
             if (horariosTarde.includes(hora) || horariosNoite.includes(hora)) {
                tdHora.classList.add('afternoon-label'); // Reusa estilo
            }
            tr.appendChild(tdHora);

            // Células dos Slots (Dias)
            dias.forEach(dia => {
                const tdSlot = document.createElement('td');
                const slotId = `${dia}_${hora}`; // Chave para allocation JSON (sem profId aqui)
                tdSlot.className = 'timetable-slot';
                tdSlot.dataset.day = dia;
                tdSlot.dataset.time = hora;
                tdSlot.dataset.turma = profId; // Usa ID do professor como 'turma' para o D&D

                 // Adiciona classes de período se necessário
                 if (horariosTarde.includes(hora)) tdSlot.classList.add('afternoon-slot');
                 if (horariosNoite.includes(hora)) tdSlot.classList.add('night-slot'); // Nova classe

                // Verifica alocação
                const disciplineId = allocation[slotId]; // Busca direto dia_hora
                if (disciplineId && disciplineMap[disciplineId]) {
                    const disc = disciplineMap[disciplineId];
                    const card = document.createElement('div');
                    // ID do card pode ser mais descritivo se necessário, mas precisa ser único
                    card.id = `card_${profId}_${dia}_${hora}`;
                    // Adiciona a classe base e as específicas da disciplina/atividade
                    card.className = `discipline-card ${disc.cssClass || ''}`;
                    card.draggable = true;
                    card.textContent = disc.shortName; // Usar shortName para economizar espaço
                    // Opcional: Adicionar mais detalhes via tooltip ou dentro do card
                    // card.title = `${disc.name}\nProfessor: ${disc.professorKey}`; // Tooltip
                    tdSlot.appendChild(card);
                } else {
                    // Slot vazio, pode adicionar classe 'empty-slot' se quiser estilo
                    tdSlot.classList.add('empty-slot');
                     if (horariosTarde.includes(hora)) tdSlot.classList.add('empty-afternoon'); // Estilo vazio tarde
                     if (horariosNoite.includes(hora)) tdSlot.classList.add('empty-night'); // Estilo vazio noite
                }
                tr.appendChild(tdSlot);
            });
            tbody.appendChild(tr);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        section.appendChild(table);

        return section;
    }

     // --- Inicialização do Drag and Drop (Mesma lógica anterior) ---
    function initializeDragDrop() {
        const cards = document.querySelectorAll('.discipline-card:not(.moved-placeholder)');
        const slots = document.querySelectorAll('.timetable-slot');

        let draggedCard = null;
        let originalSlot = null;

        function clearDropStyles() {
            slots.forEach(slot => slot.classList.remove('drag-over'));
        }

        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                 if (!e.target.classList.contains('discipline-card') || e.target.classList.contains('moved-placeholder')) {
                    e.preventDefault(); return;
                 }
                draggedCard = e.target;
                originalSlot = draggedCard.parentNode;
                setTimeout(() => draggedCard.classList.add('dragging'), 0);
            });

            card.addEventListener('dragend', () => {
                if (draggedCard) draggedCard.classList.remove('dragging');
                clearDropStyles();
                draggedCard = null; originalSlot = null;
            });
        });

        slots.forEach(slot => {
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                // Permite drag over em qualquer slot que não seja indisponível (não temos classe 'unavailable' neste caso)
                // Apenas não destaca o slot original
                if (slot !== originalSlot) {
                     slot.classList.add('drag-over');
                }
            });

            slot.addEventListener('dragleave', (e) => {
                 // Remove se sair do próprio slot, não de um filho (card)
                  if (e.target === slot || !slot.contains(e.relatedTarget)) {
                    slot.classList.remove('drag-over');
                 }
            });


            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                clearDropStyles();
                const targetSlot = e.target.closest('.timetable-slot');

                // Não precisa verificar 'unavailable' aqui, mas valida se temos card e slot
                if (!targetSlot || !draggedCard || !originalSlot) {
                     console.warn("Drop inválido - sem targetSlot, draggedCard ou originalSlot.");
                     return;
                }


                const targetCard = targetSlot.querySelector('.discipline-card:not(.moved-placeholder)');

                if (!targetCard && targetSlot !== originalSlot) { // Move para vazio
                     console.log(`Movendo ${draggedCard.id} para ${targetSlot.dataset.turma}_${targetSlot.dataset.day}_${targetSlot.dataset.time}`);
                     targetSlot.appendChild(draggedCard);
                     // Aqui você poderia atualizar um estado ou allocation JSON se quisesse persistência
                } else if (targetCard && targetCard !== draggedCard && targetSlot !== originalSlot) { // Troca (Swap)
                    console.log(`Trocando ${draggedCard.id} com ${targetCard.id}`);
                    originalSlot.appendChild(targetCard);
                    targetSlot.appendChild(draggedCard);
                     // Aqui você poderia atualizar um estado ou allocation JSON se quisesse persistência
                }
                 // dragend limpará draggedCard/originalSlot
            });
        });
        console.log("Drag and Drop inicializado.");
    }


    // --- Função Principal de Inicialização ---
    async function init() {
        const data = await loadData();
        if (!data) return;

        const { disciplineMap, allocation } = data;
        const container = document.querySelector('.timetable-container');
        // Encontra o container específico para o professor
        const professorContainer = container.querySelector(`#schedule-${professorId}`);
        if (!professorContainer) {
            console.error(`Container #schedule-${professorId} não encontrado no HTML.`);
            return;
        }
        professorContainer.innerHTML = ''; // Limpa o container antes de adicionar

        // Gera a tabela para o professor
        const scheduleHTML = generateTimetableHTML(professorId, disciplineMap, allocation);
        professorContainer.appendChild(scheduleHTML);

        // Inicializa o Drag and Drop DEPOIS que o HTML foi gerado
        initializeDragDrop();

        // <<< NOVO CÓDIGO AQUI >>>
        // --- Adiciona Listener ao Botão Salvar ---
        const saveButton = document.getElementById('saveButton');
        if (saveButton) {
            saveButton.addEventListener('click', function(event) {
                event.preventDefault(); // Previne qualquer comportamento padrão do botão

                // Exibe a mensagem de alerta personalizada
                alert("Você achou que seria tão fácil alterar o horário do Prof. Vagner?? Na na ni na não.. Você precisa se logar como Administrador para efetivar a alteração");

                console.log("Tentativa de salvar bloqueada. Mensagem exibida."); // Log para o console do desenvolvedor
            });
            console.log("Listener do botão 'Salvar Alterações' configurado.");
        } else {
            console.error("Elemento do botão 'Salvar Alterações' (ID: saveButton) não encontrado no DOM.");
        }
         // <<< FIM DO NOVO CÓDIGO >>>

    }

    // --- Executa a Inicialização ---
    init();

});