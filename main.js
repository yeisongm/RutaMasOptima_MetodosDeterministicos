/***********************
     *  VIS + DP (Top-K)   *
     ***********************/

// ---- datasets vis.js ----
const nodes = new vis.DataSet([]);
const edges = new vis.DataSet([]);
let network = null;
let nextNodeId = 1;
let inicioNodeId = null;
let terminoNodeId = null;

// Colores para resaltar rutas
// Color principal: #16a34a (verde)
const colores = ["#52b788", "#f59e0b", "#ef4444", "#db2777", "#7c3aed", "#0ea5e9", "#06b6d4", "#84cc16"];
const bordesColores = ["#2f855a", "#b45309", "#991b1b", "#831843", "#5b21b6", "#0369a1", "#164e63", "#4d7c0f"];

// Inicializar red
const container = document.getElementById('network');
const data = { nodes, edges };
const options = {
    physics: { stabilization: true },
    nodes: { shape: 'dot', size: 18, font: { size: 14, multi: true } },
    edges: { arrows: { to: { enabled: true, scaleFactor: 0.6 } }, smooth: { type: 'cubicBezier' } },
    interaction: { multiselect: false }
};
network = new vis.Network(container, data, options);

// ---- helpers UI ----
function log(msg) {
    const l = document.getElementById('logs');
    const now = new Date().toLocaleTimeString();
    l.textContent = `[${now}] ${msg}\n` + l.textContent;
}

function refrescarSelects() {
    const selDesde = document.getElementById('selDesde');
    const selHacia = document.getElementById('selHacia');
    selDesde.innerHTML = '';
    selHacia.innerHTML = '';
    nodes.forEach(n => {
        const opt1 = document.createElement('option');
        opt1.value = n.id;
        //opt1.text = `${n.label.split('\\n')[0]} (${n.value})`;
        opt1.text = `${n.label.split('\\n')[0]}`;

        const opt2 = document.createElement('option');
        opt2.value = n.id;
        //opt2.text = `${n.label.split('\\n')[0]} (${n.value})`;
        opt2.text = `${n.label.split('\\n')[0]}`;

        selDesde.appendChild(opt1); selHacia.appendChild(opt2);
    });
}

function normalizarSaltoLinea(texto) {
    if (typeof texto !== 'string') return String(texto || '');
    // Reemplaza secuencias literales "\n" por salto de línea real.
    return texto.replace(/\\n/g, '\n');
}

function actualizarLabels() {
    nodes.forEach(n => {
        // normalizamos el label original (por si contiene '\n' literal)
        const rawLabel = normalizarSaltoLinea(n.label || (`N${n.id}`));
        // tomar solo la primera línea como "base" (por si label ya contenía un paréntesis o valor)
        const base = String(rawLabel).split(/\n/)[0]; // ahora separa por salto real
        const valor = (n.value !== undefined) ? n.value : '';
        // usar salto de línea real en la nueva etiqueta
        nodes.update({ id: n.id, label: `${base}\n(${valor})` });
    });
}

// ---- FUNCIÓN crearNodo ----
function crearNodo(label, valor) {
    const id = nextNodeId++;
    // Guardamos label base en label y el valor en property 'value' (usado por DP)
    nodes.add({ id: id, label: label.toString(), value: Number(valor) });
    refrescarSelects();
    actualizarLabels();
    return id;
}

// Agregar arista (evita duplicados)
function agregarArista(desdeId, haciaId) {
    // comprobar duplicado
    const valorDesde = Number(desdeId.value);
    const valorHacia = Number(haciaId.value);
    const exist = edges.get({ filter: e => e.from == valorDesde && e.to == valorHacia });
    if (exist && exist.length > 0) { log('La estación ya existe'); return; }
    edges.add({ from: valorDesde, to: valorHacia });
    log(`Ruta creada: ${desdeId[valorDesde - 1]?.text} -> ${haciaId[valorHacia - 1]?.text}`);
}

// Marcar nodo como inicio
function marcarInicio(id) {
    if (inicioNodeId) {
        // quitar estilo anterior
        nodes.update({ id: inicioNodeId, color: undefined });
    }
    inicioNodeId = id;
    nodes.update({ id, color: { background: '#fef3c7', border: '#b45309' } });
    log(`Estación ${id} marcado como "Inicio"`);
}

// Finalizar grafo: crear T (si no existe) y conectar hojas a T
function finalizarGrafo() {
    if (terminoNodeId == null) {
        terminoNodeId = nextNodeId++;
        nodes.add({ id: terminoNodeId, label: 'Fin', value: 0, color: { background: '#00c451ff', border: '#00461dff' } });
    }
    // calcular nodos que no tienen aristas salientes (excluyendo T)
    const all = new Set(nodes.getIds().map(String));
    edges.forEach(e => { if (all.has(String(e.from))) all.delete(String(e.from)); });
    // all ahora contiene ids como strings que no tienen salida
    all.forEach(idStr => {
        const id = Number(idStr);
        if (id === terminoNodeId) return;
        // crear arista id -> T si no existe
        const existe = edges.get({ filter: e => e.from == id && e.to == terminoNodeId });
        if (!existe || existe.length === 0) edges.add({ from: id, to: terminoNodeId });
    });
    actualizarLabels();
    log('Finalizado: Estación final creada y conectada a las demás');
}

// Construir estructuras para DP a partir de nodes/edges
function construirDatosParaDP() {
    const valoresMap = {};
    const aristasArray = [];
    nodes.forEach(n => valoresMap[String(n.id)] = Number(n.value || 0));
    edges.forEach(e => aristasArray.push([String(e.from), String(e.to)]));
    return { valoresMap, aristasArray };
}

/************************
 *  DP Top-K (max/min)
 ************************/
function calcularTopKDesde(inicioIdStr, valoresMap, aristasArray, K = 3, modo = 'max') {
    // construir adyacencia
    const adj = {};
    for (const [u, v] of aristasArray) {
        if (!adj[u]) adj[u] = [];
        adj[u].push(v);
        if (!(u in valoresMap)) valoresMap[u] = 0;
        if (!(v in valoresMap)) valoresMap[v] = 0;
    }
    for (const k of Object.keys(valoresMap)) if (!adj[k]) adj[k] = [];

    // detecta ciclos simple
    function tieneCiclo() {
        const color = {}; for (const n of Object.keys(adj)) color[n] = 0;
        function dfs(u) { color[u] = 1; for (const v of adj[u]) { if (color[v] === 1) return true; if (color[v] === 0 && dfs(v)) return true; } color[u] = 2; return false; }
        for (const n of Object.keys(adj)) if (color[n] === 0 && dfs(n)) return true; return false;
    }
    const hayCiclo = tieneCiclo();

    // caches
    const cacheTop1 = {};
    const cacheTopK = {};

    function limiteInac(m) { return m === 'max' ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY; }
    function comparar(mejor, cand, m) { return m === 'max' ? cand > mejor : cand < mejor; }
    function ordenarCands(cands, m) { if (m === 'max') cands.sort((a, b) => b.suma - a.suma); else cands.sort((a, b) => a.suma - b.suma); }

    function mejorDesde(nodo, m) {
        const key = nodo + '|' + m;
        if (cacheTop1[key]) return cacheTop1[key];
        if (nodo === String(terminoNodeId)) { cacheTop1[key] = { sumaOptima: 0, siguienteOptimo: null }; return cacheTop1[key]; }
        if (!adj[nodo] || adj[nodo].length === 0) { cacheTop1[key] = { sumaOptima: limiteInac(m), siguienteOptimo: null }; return cacheTop1[key]; }
        let mejor = limiteInac(m); let next = null; const inac = limiteInac(m);
        for (const s of adj[nodo]) {
            const res = mejorDesde(s, m);
            if (res.sumaOptima === inac) continue;
            const cand = (valoresMap[s] || 0) + res.sumaOptima;
            if (next === null || comparar(mejor, cand, m)) { mejor = cand; next = s; }
        }
        cacheTop1[key] = { sumaOptima: mejor, siguienteOptimo: next };
        return cacheTop1[key];
    }

    function topKDesdeNodo(nodo, Klocal, m) {
        const key = nodo + '|' + Klocal + '|' + m;
        if (cacheTopK[key]) return cacheTopK[key];
        if (nodo === String(terminoNodeId)) { cacheTopK[key] = [{ suma: 0, camino: [String(terminoNodeId)] }]; return cacheTopK[key]; }
        if (!adj[nodo] || adj[nodo].length === 0) { cacheTopK[key] = []; return []; }
        let candidatos = []; const inac = limiteInac(m);
        for (const s of adj[nodo]) {
            const listaS = topKDesdeNodo(s, Klocal, m);
            for (const it of listaS) {
                if (it.suma === inac) continue;
                candidatos.push({ suma: (valoresMap[s] || 0) + it.suma, camino: [nodo, ...it.camino] });
            }
        }
        ordenarCands(candidatos, m);
        const top = candidatos.slice(0, Klocal);
        cacheTopK[key] = top;
        return top;
    }

    const top1 = mejorDesde(inicioIdStr, modo);
    const topK = topKDesdeNodo(inicioIdStr, K, modo);
    return {
        top1, topK, hayCiclo, reconstruirTop1: () => {
            const key = inicioIdStr + '|' + modo;
            if (!cacheTop1[key] || cacheTop1[key].sumaOptima === limiteInac(modo)) return null;
            const path = []; let cur = inicioIdStr;
            while (cur !== null) {
                path.push(cur);
                if (cur === String(terminoNodeId)) break;
                const info = cacheTop1[cur + '|' + modo]; if (!info) return null; cur = info.siguienteOptimo;
            }
            return path;
        }
    };
}

// Resalta rutas (recibe array de items {suma, camino})
function destacarRutas(listadoRutas) {
    // limpiar estilos previos
    edges.forEach(e => edges.update({ id: e.id, color: { color: '#e5e7eb' }, width: 1 }));
    nodes.forEach(n => {
        const updateData = { id: n.id, color: undefined, size: 18 };

        if (n.id === inicioNodeId) {
            updateData.color = { background: '#fef3c7', border: '#b45309' };
        } else if (n.id === terminoNodeId) {
            updateData.color = { background: '#00c451ff', border: '#00461dff' };
        }

        nodes.update(updateData);
    });

    for (let i = listadoRutas.length; i > 0; i--) {
        const item = listadoRutas[i - 1];
        const camino = item.camino;
        const color = colores[i - 1 % colores.length];
        const colorBorde = bordesColores[i - 1 % bordesColores.length];
        // nodos
        camino.forEach(idStr => {
            const id = Number(idStr);
            //nodes.update({ id, color: { background: color }, size: 26 });

            if (id !== inicioNodeId && id !== terminoNodeId) {
                nodes.update({ id, color: { background: color, border: colorBorde }, size: 26 });
            }
        });
        // aristas
        for (let j = 0; j < camino.length - 1; j++) {
            const from = Number(camino[j]), to = Number(camino[j + 1]);
            const found = edges.get({ filter: e => e.from == from && e.to == to });
            if (found && found.length > 0) {
                edges.update({ id: found[0].id, color: { color }, width: 5 });
            }
        }
    }
}

/****************
 * HANDLERS UI
 ****************/
document.getElementById('btnAgregarNodo').addEventListener('click', () => {
    const nodoName = document.getElementById('inputNodoLabel');
    const label = nodoName.value || ('N' + nextNodeId);
    const nodoValue = document.getElementById('inputNodoValor');
    const val = Number(nodoValue.value) || 0;
    const id = crearNodo(label, val);

    log(`Estación creada: id=${id} label=${label} valor=${val}`);

    nodoName.value = '';
    nodoValue.value = 1;
});

document.getElementById('btnAgregarArista').addEventListener('click', () => {
    const desde = document.getElementById('selDesde');
    const valorDesde = document.getElementById('selDesde').value;
    const hacia = document.getElementById('selHacia');
    const valorHacia = document.getElementById('selHacia').value;
    if (!valorDesde || !valorHacia) return alert('Selecciona ambas estaciones');
    if (valorDesde === valorHacia) return alert('No se permiten bucles');
    agregarArista(desde, hacia);
});

document.getElementById('btnSetInicio').addEventListener('click', () => {
    const sel = document.getElementById('selDesde').value; if (!sel) return alert('Selecciona una estación');
    marcarInicio(Number(sel));
});

document.getElementById('btnFinalizar').addEventListener('click', () => {
    finalizarGrafo();
});

const mostrarRutasOptimas = (rutas) => {
    const contenedor = document.getElementById("espacioRutasOptimas");
    contenedor.innerHTML = ""; // limpiar rutas anteriores

    rutas.forEach((ruta, i) => {
        // Crear contenedor individual de la ruta
        const rutaDiv = document.createElement("div");
        rutaDiv.className = "p-3 rounded-xl shadow bg-white bt-2 bb-2";

        // Título de la ruta
        const titulo = document.createElement("h3");
        titulo.className = "font-semibold mb-2";
        titulo.textContent = `${i + 1}️⃣  Mejor ruta (suma = ${ruta.suma}):`;
        rutaDiv.appendChild(titulo);

        // Contenedor de los nodos
        const nodosDiv = document.createElement("div");
        nodosDiv.className = "flex items-center flex-wrap gap-2";

        ruta.camino.forEach((nodo, idx) => {
            // Crear nodo visual
            const nodoDiv = document.createElement("div");
            nodoDiv.textContent = nodes.get(Number(nodo))?.label.split('\n')[0] || nodo; // mostrar solo la primera línea del label
            nodoDiv.className =
                "w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold text-white";

            // Colorear según posición
            if (idx === 0) nodoDiv.classList.add("bg-yellow-500"); // inicio
            else if (idx === ruta.camino.length - 1)
                nodoDiv.classList.add("bg-green-600"); // fin
            else nodoDiv.classList.add("bg-blue-300"); // intermedio

            nodosDiv.appendChild(nodoDiv);

            // Agregar flecha excepto al último nodo
            if (idx < ruta.camino.length - 1) {
                const flecha = document.createElement("span");
                flecha.textContent = "→";
                flecha.className = "text-lg font-bold text-gray-600";
                nodosDiv.appendChild(flecha);
            }
        });

        rutaDiv.appendChild(nodosDiv);
        contenedor.appendChild(rutaDiv);
    });
};

document.getElementById('btnCalcular').addEventListener('click', () => {
    if (inicioNodeId == null) return alert('Marca primero la estación Inicial');
    if (terminoNodeId == null) return alert('Pulsa Finalizar ruta antes de calcular');
    const modo = document.getElementById('selModo').value;
    const K = Math.max(1, Number(document.getElementById('inputK').value) || 3);
    const { valoresMap, aristasArray } = construirDatosParaDP();
    const res = calcularTopKDesde(String(inicioNodeId), valoresMap, aristasArray, K, modo);
    if (res.hayCiclo) log('ADVERTENCIA: Grafo contiene ciclos — resultados asumen caminos no repetidos');
    log(`Resultado Top1.suma=${res.top1.sumaOptima}`);
    res.topK.forEach((it, idx) => log(`${idx + 1}. suma=${it.suma} ruta=${it.camino.join(' -> ')}`));
    destacarRutas(res.topK);

    mostrarRutasOptimas(res.topK);
});

document.getElementById('btnLimpiar').addEventListener('click', () => {
    if (!confirm('¿Limpiar todo el grafo?')) return;
    nodes.clear(); edges.clear(); nextNodeId = 1; inicioNodeId = null; terminoNodeId = null;
    document.getElementById('logs').textContent = '';
    document.getElementById('espacioRutasOptimas').innerHTML = '';
    refrescarSelects();
});

document.getElementById('btnExport').addEventListener('click', () => {
    const data = { nodes: nodes.get(), edges: edges.get(), inicio: inicioNodeId, termino: terminoNodeId };
    document.getElementById('txtImportExport').value = JSON.stringify(data);
    log('Exportado JSON (campo inferior)');
});

document.getElementById('btnImport').addEventListener('click', () => {
    try {
        const txt = document.getElementById('txtImportExport').value.trim(); if (!txt) return alert('Pega JSON para importar');
        const obj = JSON.parse(txt);
        nodes.clear(); edges.clear(); nextNodeId = 1; inicioNodeId = null; terminoNodeId = null;
        for (const n of obj.nodes) { nodes.add({ id: n.id, label: String(n.label).split('\\n')[0], value: n.value }); nextNodeId = Math.max(nextNodeId, Number(n.id) + 1); }
        for (const e of obj.edges) edges.add({ id: e.id, from: e.from, to: e.to });
        if (obj.inicio) { inicioNodeId = obj.inicio; nodes.update({ id: inicioNodeId, color: { background: '#fef3c7', border: '#b45309' } }); }
        if (obj.termino) terminoNodeId = obj.termino;
        refrescarSelects(); actualizarLabels(); log('Importación completada');
    } catch (err) { alert('JSON inválido: ' + err.message); }
});

// Crear nodo Inicio por defecto
const idInicio = crearNodo('Inicio', 0); marcarInicio(idInicio);

// refrescar selects cada vez que cambia el dataset (observador simple)
nodes.on('*', () => { refrescarSelects(); });
edges.on('*', () => { /* nada extra */ });