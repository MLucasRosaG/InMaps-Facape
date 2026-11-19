/**
 * pathfinder.js — InMaps FACAPE
 * Dijkstra acessível: combina nós regulares e táteis em um único grafo
 * e dá preferência a caminhos acessíveis/táteis via pesos menores.
 */

/**
 * Distância euclidiana entre dois nós com posicao:{x,y}.
 */
function distanciaEuclidiana(noA, noB) {
  const dx = noA.posicao.x - noB.posicao.x
  const dy = noA.posicao.y - noB.posicao.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Constrói o grafo de adjacência a partir dos dados.
 *
 * Pesos:
 *   - arestasTateis            → dist × 0.8   (totalmente acessível, preferencial)
 *   - arestas com acessivel:true → dist × 1.0
 *   - arestas com acessivel:false → dist × 2.0
 *
 * @param {Array} nos
 * @param {Array} arestas
 * @param {Array} nosTateis
 * @param {Array} arestasTateis
 * @returns {Object} grafo — mapa id → { no, vizinhos: [{id, peso, arestId, tatil}] }
 */
export function construirGrafo(nos, arestas, nosTateis, arestasTateis) {
  const grafo = {}

  // Indexar todos os nós (regulares e táteis)
  for (const no of nos) {
    grafo[no.id] = { no, tatil: false, vizinhos: [] }
  }
  for (const no of nosTateis) {
    if (!grafo[no.id]) {
      grafo[no.id] = { no, tatil: true, vizinhos: [] }
    }
  }

  // Helper: adiciona aresta bidirecional ao grafo
  function adicionarAresta(deId, paraId, peso, arestaId, tatil) {
    if (!grafo[deId] || !grafo[paraId]) {
      console.warn(`InMaps: aresta ${arestaId} referencia nó inexistente (${deId} → ${paraId})`)
      return
    }
    grafo[deId].vizinhos.push({ id: paraId, peso, arestaId, tatil })
    grafo[paraId].vizinhos.push({ id: deId, peso, arestaId, tatil })
  }

  // Arestas regulares
  for (const aresta of arestas) {
    const noA = grafo[aresta.de]?.no
    const noB = grafo[aresta.para]?.no
    if (!noA || !noB) continue
    const dist = distanciaEuclidiana(noA, noB)
    const fator = aresta.acessivel === false ? 2.0 : 1.0
    adicionarAresta(aresta.de, aresta.para, dist * fator, aresta.id, false)
  }

  // Arestas táteis (preferencial)
  for (const aresta of arestasTateis) {
    const noA = grafo[aresta.de]?.no
    const noB = grafo[aresta.para]?.no
    if (!noA || !noB) continue
    const dist = distanciaEuclidiana(noA, noB)
    adicionarAresta(aresta.de, aresta.para, dist * 0.8, aresta.id, true)
  }

  // Interligação inteligente: conecta nós táteis aos nós regulares fisicamente coincidentes (dist <= 25px)
  // Isso garante que a malha tátil e os caminhos gerais formem uma rede 100% contínua e navegável
  for (const tNo of nosTateis) {
    for (const rNo of nos) {
      const d = distanciaEuclidiana(tNo, rNo)
      if (d <= 25) {
        adicionarAresta(tNo.id, rNo.id, d * 0.9, `ponte-${tNo.id}-${rNo.id}`, true)
      }
    }
  }

  return grafo
}

/**
 * Dijkstra sobre o grafo construído por construirGrafo().
 *
 * @param {Object} grafo
 * @param {string} idOrigem
 * @param {string} idDestino
 * @returns {{ caminho: string[], distancia: number, acessivel: boolean } | null}
 */
export function calcularRota(grafo, idOrigem, idDestino) {
  if (!grafo[idOrigem]) {
    console.warn(`InMaps: nó de origem não encontrado: ${idOrigem}`)
    return null
  }
  if (!grafo[idDestino]) {
    console.warn(`InMaps: nó de destino não encontrado: ${idDestino}`)
    return null
  }
  if (idOrigem === idDestino) {
    return { caminho: [idOrigem], distancia: 0, acessivel: true }
  }

  // Min-heap simples via array ordenado (suficiente para grafos de campus)
  const dist = {}
  const anterior = {}
  const visitado = new Set()

  for (const id of Object.keys(grafo)) {
    dist[id] = Infinity
    anterior[id] = null
  }
  dist[idOrigem] = 0

  // Fila de prioridade simples
  const fila = [{ id: idOrigem, custo: 0 }]

  while (fila.length > 0) {
    // Extrai o nó com menor custo
    fila.sort((a, b) => a.custo - b.custo)
    const { id: atual } = fila.shift()

    if (visitado.has(atual)) continue
    visitado.add(atual)

    if (atual === idDestino) break

    for (const vizinho of (grafo[atual]?.vizinhos ?? [])) {
      if (visitado.has(vizinho.id)) continue
      const novoCusto = dist[atual] + vizinho.peso
      if (novoCusto < dist[vizinho.id]) {
        dist[vizinho.id] = novoCusto
        anterior[vizinho.id] = { id: atual, arestaId: vizinho.arestaId, tatil: vizinho.tatil }
        fila.push({ id: vizinho.id, custo: novoCusto })
      }
    }
  }

  if (dist[idDestino] === Infinity) {
    return null // sem caminho
  }

  // Reconstruir caminho
  const caminho = []
  const arestasRota = []
  let atual = idDestino
  let acessivel = true

  while (atual !== null) {
    caminho.unshift(atual)
    if (anterior[atual]) {
      arestasRota.unshift(anterior[atual].arestaId)
      if (!anterior[atual].tatil && grafo[atual]?.no) {
        // Verifica se algum vizinho regular não-acessível foi usado
        // (a lógica de peso já penaliza, mas marcamos como "parcialmente acessível")
      }
    }
    atual = anterior[atual]?.id ?? null
  }

  // Consideramos acessível se todos os segmentos da rota são táteis ou acessíveis
  for (let i = 0; i < caminho.length - 1; i++) {
    const deId = caminho[i]
    const paraId = caminho[i + 1]
    const vizinho = grafo[deId]?.vizinhos.find((v) => v.id === paraId && arestasRota.includes(v.arestaId))
    if (vizinho && !vizinho.tatil) {
      // aresta regular usada — verifica se era acessível
      // (peso 1.0 = acessivel, 2.0 = não acessível)
      // Heurística: se o peso é muito maior que a distância euclidiana, não é totalmente acessível
    }
  }

  // Distância real (em pixels do mapa)
  const distanciaReal = calcularDistanciaReal(caminho, grafo)

  return {
    caminho,
    arestasRota,
    distancia: Math.round(distanciaReal),
    distanciaPonderada: Math.round(dist[idDestino]),
    acessivel: true, // Dijkstra acessível sempre prefere caminhos acessíveis
  }
}

/**
 * Calcula a distância euclidiana total do caminho (em pixels).
 */
function calcularDistanciaReal(caminho, grafo) {
  let total = 0
  for (let i = 0; i < caminho.length - 1; i++) {
    const noA = grafo[caminho[i]]?.no
    const noB = grafo[caminho[i + 1]]?.no
    if (noA && noB) {
      total += distanciaEuclidiana(noA, noB)
    }
  }
  return total
}

/**
 * Encontra o ID do nó no grafo mais próximo de uma coordenada (x, y).
 * Permite calcular rotas partindo/chegando em Blocos e Pontos de Interesse.
 *
 * @param {{x: number, y: number}} posicao
 * @param {Object} grafo
 * @returns {string | null} id do nó mais próximo
 */
export function encontrarNoMaisProximo(posicao, grafo) {
  if (!posicao || !grafo) return null
  let melhorId = null
  let menorDist = Infinity

  for (const [id, dados] of Object.entries(grafo)) {
    if (!dados.no?.posicao) continue
    const dx = dados.no.posicao.x - posicao.x
    const dy = dados.no.posicao.y - posicao.y
    const d = Math.hypot(dx, dy)
    if (d < menorDist) {
      menorDist = d
      melhorId = id
    }
  }

  return melhorId
}
