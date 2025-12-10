let appData = null;

// Elementos del DOM
const modalComp = document.getElementById("modal");
const modalSede = document.getElementById("modal-sede");
const formComp = document.getElementById("computer-form");
const formSede = document.getElementById("sede-form");

document.addEventListener("DOMContentLoaded", fetchData);

async function fetchData() {
    try {
        const response = await fetch('/api/data');
        appData = await response.json();
        renderDashboard();
    } catch (error) { console.error("Error cargando datos", error); }
}

function renderDashboard() {
    const container = document.getElementById("dashboard");
    container.innerHTML = "";

    appData.areas.forEach((area, areaIdx) => {
        // Columna del Área
        const areaCol = document.createElement("div");
        areaCol.className = "area-column";

        const areaTitle = document.createElement("div");
        areaTitle.className = "area-title";
        areaTitle.innerText = area.name;
        areaCol.appendChild(areaTitle);

        // Renderizar Sedes existentes
        area.locations.forEach((loc, locIdx) => {
            const locCard = document.createElement("div");
            locCard.className = "location-card";

            // Encabezado de la Sede (Nombre + Editar + Agregar PC)
            const headerHTML = `
                <div class="location-header-top">
                    <span class="location-name">${loc.name}</span>
                    <div class="sede-actions">
                        <button class="btn-add-comp-small" onclick="openCompModal(${areaIdx}, ${locIdx}, null)">+ PC</button>
                        <i class="fas fa-cog" onclick="openSedeModal(${areaIdx}, ${locIdx})" title="Configurar Sede"></i>
                    </div>
                </div>
            `;
            locCard.innerHTML = headerHTML;

            const grid = document.createElement("div");
            grid.className = "computer-grid";

            // Renderizar Computadoras
            loc.computers.forEach((comp, compIdx) => {
                const item = document.createElement("div");
                item.className = "computer-item";
                item.onclick = () => openCompModal(areaIdx, locIdx, compIdx);

                const iconClass = comp.type === 'server' ? 'fa-server' : 'fa-desktop';
                const statusClass = comp.status ? 'status-true' : 'status-false';

                item.innerHTML = `
                    <div class="icon-wrapper"><i class="fas ${iconClass}"></i></div>
                    <div class="status-indicator ${statusClass}"><span class="dot"></span></div>
                    <div class="comp-info">
                        <span class="comp-name">${comp.name}</span>
                        <span class="comp-host">${comp.hostname}</span>
                    </div>
                `;
                grid.appendChild(item);
            });

            locCard.appendChild(grid);
            areaCol.appendChild(locCard);
        });

        // BOTÓN: AGREGAR NUEVA SEDE AL FINAL DE LA LISTA
        const btnAddSede = document.createElement("button");
        btnAddSede.className = "btn-add-location";
        btnAddSede.innerText = "+ Agregar Sede";
        btnAddSede.onclick = () => openSedeModal(areaIdx, null); // null = nueva
        areaCol.appendChild(btnAddSede);

        container.appendChild(areaCol);
    });
}

// ----------------------
// LOGICA MODAL EQUIPOS
// ----------------------
function openCompModal(areaIdx, locIdx, compIdx) {
    modalComp.style.display = "block";
    const deleteBtn = document.getElementById("btn-delete");
    const indicesInput = document.getElementById("edit-indices");

    if (compIdx !== null) {
        const comp = appData.areas[areaIdx].locations[locIdx].computers[compIdx];
        document.getElementById("modal-title").innerText = "Editar Equipo";
        document.getElementById("comp-name").value = comp.name;
        document.getElementById("comp-hostname").value = comp.hostname;
        document.getElementById("comp-type").value = comp.type;
        document.getElementById("comp-status").checked = comp.status;
        indicesInput.value = `${areaIdx},${locIdx},${compIdx}`;
        deleteBtn.style.display = "block";
        deleteBtn.onclick = () => deleteComputer(areaIdx, locIdx, compIdx);
    } else {
        document.getElementById("modal-title").innerText = "Nuevo Equipo";
        formComp.reset();
        document.getElementById("comp-type").value = "desktop";
        document.getElementById("comp-status").checked = true;
        indicesInput.value = `${areaIdx},${locIdx},new`;
        deleteBtn.style.display = "none";
    }
}

formComp.onsubmit = async (e) => {
    e.preventDefault();
    const [areaIdx, locIdx, compIdx] = document.getElementById("edit-indices").value.split(',');

    const newComp = {
        id: Date.now(),
        name: document.getElementById("comp-name").value,
        hostname: document.getElementById("comp-hostname").value,
        type: document.getElementById("comp-type").value,
        status: document.getElementById("comp-status").checked
    };

    if (compIdx === 'new') {
        appData.areas[areaIdx].locations[locIdx].computers.push(newComp);
    } else {
        newComp.id = appData.areas[areaIdx].locations[locIdx].computers[compIdx].id;
        appData.areas[areaIdx].locations[locIdx].computers[compIdx] = newComp;
    }
    await saveDataAndRender(modalComp);
};

async function deleteComputer(areaIdx, locIdx, compIdx) {
    if (confirm("¿Eliminar equipo?")) {
        appData.areas[areaIdx].locations[locIdx].computers.splice(compIdx, 1);
        await saveDataAndRender(modalComp);
    }
}

// ----------------------
// LOGICA MODAL SEDES
// ----------------------
function openSedeModal(areaIdx, locIdx) {
    modalSede.style.display = "block";
    const indicesInput = document.getElementById("sede-indices");
    const nameInput = document.getElementById("sede-name");
    const deleteBtn = document.getElementById("btn-delete-sede");
    const title = document.getElementById("modal-sede-title");

    if (locIdx !== null) {
        // Editar Sede existente
        const loc = appData.areas[areaIdx].locations[locIdx];
        title.innerText = "Editar Sede";
        nameInput.value = loc.name;
        indicesInput.value = `${areaIdx},${locIdx}`;
        deleteBtn.style.display = "block";
        deleteBtn.onclick = () => deleteSede(areaIdx, locIdx);
    } else {
        // Nueva Sede
        title.innerText = "Nueva Sede";
        nameInput.value = "";
        indicesInput.value = `${areaIdx},new`;
        deleteBtn.style.display = "none";
    }
}

formSede.onsubmit = async (e) => {
    e.preventDefault();
    const indices = document.getElementById("sede-indices").value.split(',');
    const areaIdx = indices[0];
    const locIdx = indices[1];
    const name = document.getElementById("sede-name").value;

    if (locIdx === 'new') {
        // Crear nueva sede con array de computadoras vacío
        appData.areas[areaIdx].locations.push({
            name: name,
            computers: []
        });
    } else {
        // Actualizar nombre
        appData.areas[areaIdx].locations[locIdx].name = name;
    }
    await saveDataAndRender(modalSede);
};

async function deleteSede(areaIdx, locIdx) {
    if (confirm("¿Estás seguro de ELIMINAR esta Sede y todos sus equipos?")) {
        appData.areas[areaIdx].locations.splice(locIdx, 1);
        await saveDataAndRender(modalSede);
    }
}

// ----------------------
// UTILIDADES
// ----------------------
async function saveDataAndRender(modalToClose) {
    await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData)
    });
    if (modalToClose) modalToClose.style.display = "none";
    renderDashboard();
}

function closeModal(id) {
    document.getElementById(id).style.display = "none";
}

window.onclick = (e) => {
    if (e.target == modalComp) modalComp.style.display = "none";
    if (e.target == modalSede) modalSede.style.display = "none";
}