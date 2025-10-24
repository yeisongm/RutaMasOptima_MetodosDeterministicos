// Nodo especial de inicio y terminación:
const INICIO = "Inicio";
const TERMINACION = "Terminacion";

// Valores de cada nodo (nivel de seguridad). START y END suelen ser 0.
const valores = {
    "Inicio": 0,
    "A": 5,
    "B": 3,
    "C": 4,
    "D": 2,
    "E": 3,
    "F": 1,
    "G": 4,
    "H": 6,
    "I": 2,
    "J": 5,
    "K": 4,
    "L": 7,
    "Terminacion": 0
};

// Aristas dirigidas (desde -> hacia).
const aristas = [
    ["Inicio", "A"],
    ["Inicio", "B"],
    ["A", "C"],
    ["A", "D"],
    ["B", "E"],
    ["C", "F"],
    ["C", "G"],
    ["D", "H"],
    ["D", "I"],
    ["E", "H"],
    ["E", "I"],
    ["F", "J"],
    ["G", "K"],
    ["H", "K"],
    ["I", "L"],
    ["J", "Terminacion"],
    ["K", "Terminacion"],
    ["L", "Terminacion"]
];

// ====== 2) Construir lista de adyacencia a partir de aristas ======
const construirListaAdyacencia = (aristas) => {
    const adj = {};
    for (const [u, v] of aristas) {
        if (!adj[u]) adj[u] = [];
        adj[u].push(v);
        // aviso si falta definición de valor para algún nodo
        if (!(u in valores)) console.warn(`Aviso: no hay 'valor' definido para nodo ${u}`);
        if (!(v in valores)) console.warn(`Aviso: no hay 'valor' definido para nodo ${v}`);
    }
    // Aseguramos que cualquier nodo sin sucesores exista como clave (lista vacía)
    for (const nodo of Object.keys(valores)) {
        if (!adj[nodo]) adj[nodo] = [];
    }
    return adj;
};

const adyacencia = construirListaAdyacencia(aristas);

// ====== 3) Comprobación opcional: detectar ciclos ======
// El método DP que usamos asume DAG (grafo acíclico por etapas). Si hay ciclos, debemos tener cuidado.
const tieneCiclo = () => {
    const BLANCO = 0, GRIS = 1, NEGRO = 2;
    const color = {};
    for (const n of Object.keys(adyacencia)) color[n] = BLANCO;

    const dfs = (u) => {
        color[u] = GRIS;
        for (const v of adyacencia[u]) {
            if (color[v] === GRIS) return true;          // back-edge → ciclo
            if (color[v] === BLANCO && dfs(v)) return true;
        }
        color[u] = NEGRO;
        return false;
    };

    for (const n of Object.keys(adyacencia)) {
        if (color[n] === BLANCO && dfs(n)) return true;
    }
    return false;
};

if (tieneCiclo()) {
    console.warn("ATENCIÓN: el grafo tiene ciclos. Este DP asume que no hay ciclos (DAG).");
}

/* --- 4) CACHÉS (memoización) --- */
/* Usamos claves que incluyen el modo para no mezclar resultados max/min */
const cacheTop1 = {}; // cacheTop1[`${nodo}|${modo}`] = { sumaOptima, siguienteOptimo }
const cacheTopK = {}; // cacheTopK[`${nodo}|${K}|${modo}`] = [ { suma, camino }, ... ]

/* --- 5) Utilidades internas para límites según modo --- */
function limiteInalcanzable(modo) {
  // valor que representa "no alcanzable" en ese modo
  return modo === "max" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
}
function comparar(mejor, candidato, modo) {
  // true si candidato es mejor que mejor (según modo)
  return modo === "max" ? (candidato > mejor) : (candidato < mejor);
}
function ordenarCandidatos(candidatos, modo) {
  // ordena candidatos: descendente por suma para max, ascendente para min
  if (modo === "max") candidatos.sort((a,b) => b.suma - a.suma);
  else candidatos.sort((a,b) => a.suma - b.suma);
}

const mejorDesde = (nodo, modo = "max") => {
  // modo: "max" = buscar suma máxima (más seguro)
  //       "min" = buscar suma mínima (más inseguro)
  const key = `${nodo}|${modo}`;
  if (cacheTop1[key]) return cacheTop1[key];

  if (nodo === TERMINACION) {
    cacheTop1[key] = { sumaOptima: 0, siguienteOptimo: null };
    return cacheTop1[key];
  }

  // si no tiene sucesores -> no hay camino válido
  if (!adyacencia[nodo] || adyacencia[nodo].length === 0) {
    const inac = limiteInalcanzable(modo);
    cacheTop1[key] = { sumaOptima: inac, siguienteOptimo: null };
    return cacheTop1[key];
  }

  let mejorSuma = limiteInalcanzable(modo);
  let mejorSiguiente = null;
  const inac = limiteInalcanzable(modo);

  for (const succ of adyacencia[nodo]) {
    const resSucc = mejorDesde(succ, modo);
    // si desde succ no llega a TERMINACION (resSucc.sumaOptima == inac) lo omitimos
    if (resSucc.sumaOptima === inac) continue;
    const candidato = (valores[succ] || 0) + resSucc.sumaOptima;
    if (comparar(mejorSuma, candidato, modo) === false) {
      // si candidato es mejor que mejorSuma (según modo) => actualizar
      mejorSuma = candidato;
      mejorSiguiente = succ;
    } else if (mejorSuma === limiteInalcanzable(modo)) {
      // para el primer candidato, si mejorSuma aún es limiteInalcanzable, asignar
      mejorSuma = candidato;
      mejorSiguiente = succ;
    }
  }

  // si no encontramos ningún sucesor válido, mejorSuma quedará como inac
  cacheTop1[key] = { sumaOptima: mejorSuma, siguienteOptimo: mejorSiguiente };
  return cacheTop1[key];
};

// Reconstruir camino Top-1 desde 'nodo'
const reconstruirCaminoTop1Desde = (nodo, modo = "max") => {
  const key = `${nodo}|${modo}`;
  if (!cacheTop1[key] || cacheTop1[key].sumaOptima === limiteInalcanzable(modo)) return null;
  const camino = [];
  let actual = nodo;
  while (actual !== null) {
    camino.push(actual);
    if (actual === TERMINACION) break;
    const info = cacheTop1[`${actual}|${modo}`];
    if (!info || info.siguienteOptimo === null) return null;
    actual = info.siguienteOptimo;
  }
  return camino;
};

// ====== 5) DP Top-K (guardar hasta K mejores caminos por nodo) ======
// Usamos clave compuesta 'nodo|K' para cachear resultados por (nodo,K)
const memoK = {}; // memoK['Nodo|K'] = [ { suma, camino }, ... ] ordenado descendente por suma

/**
 * Devuelve hasta K mejores caminos (Top-K) desde 'nodo' hasta TERMINACION.
 * Cada item: { suma: number, camino: [ nodo, ..., TERMINACION ] }
 */
const topKDesde = (nodo, K = 3, modo = "max") => {
  const key = `${nodo}|${K}|${modo}`;
  if (cacheTopK[key]) return cacheTopK[key];

  if (nodo === TERMINACION) {
    const res = [{ suma: 0, camino: [TERMINACION] }];
    cacheTopK[key] = res;
    return res;
  }

  // si no tiene sucesores, no hay caminos
  if (!adyacencia[nodo] || adyacencia[nodo].length === 0) {
    cacheTopK[key] = [];
    return [];
  }

  let candidatos = []; // {suma, camino}
  const inac = limiteInalcanzable(modo);

  for (const succ of adyacencia[nodo]) {
    const listaSucc = topKDesde(succ, K, modo);
    for (const item of listaSucc) {
      if (item.suma === inac) continue;
      candidatos.push({
        suma: (valores[succ] || 0) + item.suma,
        camino: [nodo, ...item.camino]
      });
    }
  }

  // ordenar según modo y tomar los K mejores/peores
  ordenarCandidatos(candidatos, modo);
  const top = candidatos.slice(0, K);
  cacheTopK[key] = top;
  return top;
};

/* --- 8) Funciones auxiliares de uso (limpiar caches, actualizar grafo, imprimir) --- */
const limpiarCaches = () => {
  for (const k of Object.keys(cacheTop1)) delete cacheTop1[k];
  for (const k of Object.keys(cacheTopK)) delete cacheTopK[k];
};

const actualizarGrafo = (nuevosValores, nuevasAristas) => {
  valores = { ...nuevosValores };
  aristas = [...nuevasAristas];
  adyacencia = construirAdyacencia(aristas);
  limpiarCaches();
  if (tieneCiclo()) console.warn("Aviso: el grafo actualizado contiene ciclos.");
};

// ====== 6) Funciones auxiliares para imprimir resultados ======
const imprimirTopKDesdeInicio = (K = 3, modo = "max") => {
  limpiarCaches(); // recalculamos limpio
  const top1 = mejorDesde(INICIO, modo);
  if (top1.sumaOptima === limiteInalcanzable(modo)) {
    console.log(`No existe camino válido desde ${INICIO} hasta ${TERMINACION} (modo=${modo}).`);
  } else {
    const ruta = reconstruirCaminoTop1Desde(INICIO, modo);
    console.log(`Top-1 (modo=${modo}): suma=${top1.sumaOptima}, ruta=${ruta.join(" -> ")}`);
  }

  const lista = topKDesde(INICIO, K, modo);
  if (!lista || lista.length === 0) {
    console.log(`No hay caminos válidos desde ${INICIO} a ${TERMINACION} (Top-${K}, modo=${modo}).`);
    return;
  }
  console.log(`Top-${lista.length} rutas desde ${INICIO} a ${TERMINACION} (modo=${modo}):`);
  lista.forEach((it, i) => {
    console.log(`${i+1}. suma=${it.suma}  —  ruta: ${it.camino.join(" -> ")}`);
  });
};

// ====== 7) EJECUCIÓN de ejemplo con los datos definidos arriba ======
console.log("Lista de adyacencia:", adyacencia);
console.log("Valores de nodos:", valores);

/* --- 9) EJEMPLO de ejecución (usa los datos por defecto arriba) --- */
console.log("\n=== EJEMPLO (modo=max) ===");
imprimirTopKDesdeInicio(3, "max"); // top-3 en modo máximo (más seguro)

console.log("\n=== EJEMPLO (modo=min) ===");
imprimirTopKDesdeInicio(3, "min"); // top-3 en modo mínimo (más inseguro)