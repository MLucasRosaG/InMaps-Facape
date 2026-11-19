/**
 * graphRenderer.js — InMaps FACAPE
 * Renderiza as camadas do mapa em SVG:
 * - Ruas / Vias
 * - Blocos prediais (com labels e clique)
 * - Caminhos gerais (arestas)
 * - Piso tátil (com setinhas elegantes e SEM nós circulares poluindo)
 * - Rampas de acessibilidade
 * - Pontos de interesse (pins com ícones temáticos e labels)
 * - Nós (opcional para debug)
 * - Rota animada em azul
 */

const NS = 'http://www.w3.org/2000/svg'

/** Cria um elemento SVG com atributos */
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v)
  }
  return el
}

/** Configuração visual por tipo de ponto de interesse */
const CONFIG_PONTOS = {
  banheiro: {
    cor: '#0284c7',
    icone: '🚻',
    rotulo: 'Banheiro',
  },
  'banheiro-acessivel': {
    cor: '#2563eb',
    icone: '♿',
    rotulo: 'Banheiro Acessível',
  },
  laboratorio: {
    cor: '#7c3aed',
    icone: '💻',
    rotulo: 'Laboratório',
  },
  entrada: {
    cor: '#16a34a',
    icone: '🚪',
    rotulo: 'Entrada / Acesso',
  },
  auditorio: {
    cor: '#d97706',
    icone: '📢',
    rotulo: 'Auditório',
  },
  coordenacao: {
    cor: '#2563eb',
    icone: '🎓',
    rotulo: 'Coordenação',
  },
  administrativo: {
    cor: '#475569',
    icone: '🏛️',
    rotulo: 'Administrativo',
  },
  servico: {
    cor: '#059669',
    icone: '🏦',
    rotulo: 'Serviço',
  },
  apoio: {
    cor: '#64748b',
    icone: '📦',
    rotulo: 'Apoio',
  },
  sala: {
    cor: '#4f46e5',
    icone: '📝',
    rotulo: 'Sala',
  },
  default: {
    cor: '#3b82f6',
    icone: '📍',
    rotulo: 'Ponto de Interesse',
  },
}

function obterConfigPonto(item) {
  const nome = (item.nome || '').toLowerCase()
  if (nome.includes('acessivel') || nome.includes('acessível')) {
    return CONFIG_PONTOS['banheiro-acessivel']
  }
  return CONFIG_PONTOS[item.tipo] || CONFIG_PONTOS.default
}

/** Indexa todos os nós pelo id para lookup rápido */
function _indexarNos(...arrays) {
  const mapa = {}
  for (const arr of arrays) {
    for (const no of arr ?? []) {
      mapa[no.id] = no
    }
  }
  return mapa
}

/** Cria um <rect> com suporte a rotação e dimensões */
function _criarRetangulo(item, attrs) {
  if (!item.posicao || !item.largura || !item.altura) return null

  const cx = item.posicao.x
  const cy = item.posicao.y
  const w  = item.largura
  const h  = item.altura
  const rot = item.rotacao ?? 0

  const rect = svgEl('rect', {
    x: cx - w / 2,
    y: cy - h / 2,
    width: w,
    height: h,
    transform: rot !== 0 ? `rotate(${rot},${cx},${cy})` : '',
    ...attrs,
  })

  return rect
}

/**
 * Monta o SVG do grafo e o injeta no #mapa-camada.
 * Retorna o elemento SVG criado.
 *
 * @param {{ nos, arestas, nosTateis, arestasTateis, rampas, ruas, blocos, pontos }} dados
 * @param {HTMLElement} camadaEl — #mapa-camada
 * @param {number} largura — largura natural da imagem do mapa
 * @param {number} altura  — altura natural da imagem do mapa
 */
export function renderizarGrafo(dados, camadaEl, largura, altura) {
  const anterior = camadaEl.querySelector('#grafo-svg')
  if (anterior) anterior.remove()

  const svg = svgEl('svg', {
    id: 'grafo-svg',
    width: largura,
    height: altura,
    viewBox: `0 0 ${largura} ${altura}`,
    'aria-hidden': 'true',
  })

  // ── Defs para filtros e marcadores ──────────────────────────
  const defs = svgEl('defs')
  defs.innerHTML = `
    <filter id="sombra-pin" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.28)"/>
    </filter>
    <filter id="sombra-bloco" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" flood-color="rgba(0,0,0,0.18)"/>
    </filter>
    <filter id="brilho-selecionado" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="0" stdDeviation="4.5" flood-color="#3b82f6" flood-opacity="0.8"/>
    </filter>
  `
  svg.appendChild(defs)

  // ── Grupos por camada (ordem visual: fundo → topo) ───────────
  const gRuas          = svgEl('g', { id: 'layer-ruas',        class: 'layer' })
  const gBlocos        = svgEl('g', { id: 'layer-blocos',      class: 'layer', visibility: 'hidden' })
  const gArestas       = svgEl('g', { id: 'layer-arestas',     class: 'layer' })
  const gTateis        = svgEl('g', { id: 'layer-tateis',      class: 'layer' })
  const gRampas        = svgEl('g', { id: 'layer-rampas',      class: 'layer' })
  const gPontos        = svgEl('g', { id: 'layer-pontos',      class: 'layer' })
  const gRota          = svgEl('g', { id: 'layer-rota',        class: 'layer' })

  svg.append(gRuas, gBlocos, gArestas, gTateis, gRampas, gPontos, gRota)

  // ── 1. Ruas ──────────────────────────────────────────────────
  for (const rua of dados.ruas ?? []) {
    const rect = _criarRetangulo(rua, {
      fill: 'rgba(203,213,225,0.25)',
      stroke: 'rgba(148,163,184,0.4)',
      'stroke-width': '1',
      rx: '2',
      class: 'rua-elemento',
      'data-id': rua.id,
      'data-nome': rua.nome ?? '',
    })
    if (rect) gRuas.appendChild(rect)
  }

  // ── 2. Blocos Prediais ───────────────────────────────────────
  for (const bloco of dados.blocos ?? []) {
    const g = svgEl('g', {
      class: 'bloco-elemento',
      'data-id': bloco.id,
      'data-tipo': 'bloco',
      'data-nome': bloco.nome ?? '',
      role: 'button',
    })

    const rect = _criarRetangulo(bloco, {
      fill: 'rgba(66, 133, 244, 0.08)',
      stroke: 'rgba(66, 133, 244, 0.45)',
      'stroke-width': '1.5',
      rx: '6',
      class: 'bloco-retangulo',
    })

    if (!rect) continue
    g.appendChild(rect)

    // Badge com nome centralizado
    const cx = bloco.posicao.x
    const cy = bloco.posicao.y
    const nome = bloco.nome || bloco.id
    const charWidth = 6.2
    const padW = 14
    const pillW = Math.min(Math.max(nome.length * charWidth + padW, 55), bloco.largura * 0.95)

    const pill = svgEl('rect', {
      x: cx - pillW / 2,
      y: cy - 10,
      width: pillW,
      height: 20,
      rx: 4,
      fill: 'rgba(255, 255, 255, 0.92)',
      stroke: 'rgba(148, 163, 184, 0.45)',
      'stroke-width': '0.8',
      filter: 'url(#sombra-bloco)',
      class: 'bloco-pill',
    })

    const label = svgEl('text', {
      x: cx,
      y: cy,
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      'font-size': '10.5',
      'font-weight': '600',
      fill: '#1e293b',
      'pointer-events': 'none',
      class: 'bloco-label',
    })
    label.textContent = nome

    g.append(pill, label)
    gBlocos.appendChild(g)
  }

  // ── 3. Arestas Regulares ─────────────────────────────────────
  const mapaNosTodos = _indexarNos(dados.nos, dados.nosTateis)

  for (const aresta of dados.arestas ?? []) {
    const noA = mapaNosTodos[aresta.de]
    const noB = mapaNosTodos[aresta.para]
    if (!noA || !noB) continue

    const cor = aresta.acessivel === false ? 'rgba(203,213,225,0.6)' : 'rgba(148,163,184,0.7)'
    const linha = svgEl('line', {
      x1: noA.posicao.x, y1: noA.posicao.y,
      x2: noB.posicao.x, y2: noB.posicao.y,
      stroke: cor,
      'stroke-width': '2',
      'stroke-linecap': 'round',
      class: 'aresta-elemento',
      'data-id': aresta.id,
    })
    gArestas.appendChild(linha)
  }

  // ── 4. Arestas Táteis (Linha limpa com setinhas indicativas, SEM pontos) ─
  for (const aresta of dados.arestasTateis ?? []) {
    const noA = mapaNosTodos[aresta.de]
    const noB = mapaNosTodos[aresta.para]
    if (!noA || !noB) continue

    // Linha tátil amarela contínua com relevo
    const linhaBase = svgEl('line', {
      x1: noA.posicao.x, y1: noA.posicao.y,
      x2: noB.posicao.x, y2: noB.posicao.y,
      stroke: '#d97706',
      'stroke-width': '4.5',
      'stroke-linecap': 'round',
      opacity: '0.4',
    })

    const linhaTatil = svgEl('line', {
      x1: noA.posicao.x, y1: noA.posicao.y,
      x2: noB.posicao.x, y2: noB.posicao.y,
      stroke: '#f59e0b',
      'stroke-width': '3',
      'stroke-linecap': 'round',
      class: 'aresta-tatil-elemento',
      'data-id': aresta.id,
    })
    gTateis.append(linhaBase, linhaTatil)

    // Setinhas discretas e elegantes na direção do trajeto
    const dx = noB.posicao.x - noA.posicao.x
    const dy = noB.posicao.y - noA.posicao.y
    const len = Math.hypot(dx, dy)

    if (len > 22) {
      const ang = (Math.atan2(dy, dx) * 180) / Math.PI
      const mx = (noA.posicao.x + noB.posicao.x) / 2
      const my = (noA.posicao.y + noB.posicao.y) / 2

      const seta = svgEl('polygon', {
        points: '-4,-3.5 3.5,0 -4,3.5',
        fill: '#b45309',
        transform: `translate(${mx},${my}) rotate(${ang})`,
        class: 'seta-tatil',
        'pointer-events': 'none',
      })
      gTateis.appendChild(seta)
    }
  }

  // ── 5. Rampas ────────────────────────────────────────────────
  for (const rampa of dados.rampas ?? []) {
    const g = svgEl('g', {
      'data-id': rampa.id,
      'data-tipo': 'rampa',
      'data-nome': rampa.nome || 'Rampa',
      class: 'rampa-elemento',
      role: 'button',
    })

    const rect = _criarRetangulo(rampa, {
      fill: 'rgba(34,197,94,0.3)',
      stroke: '#22c55e',
      'stroke-width': '1.5',
      rx: '3',
    })
    if (!rect) continue

    const cx = rampa.posicao.x
    const cy = rampa.posicao.y
    const label = svgEl('text', {
      x: cx, y: cy,
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      'font-size': '10',
      'font-weight': 'bold',
      fill: '#15803d',
      'pointer-events': 'none',
    })
    label.textContent = 'R'

    g.append(rect, label)
    gRampas.appendChild(g)
  }

  // ── 6. Pontos de Interesse (Pins com Ícone Centralizado, sem nomes poluindo) ───────────
  for (const ponto of dados.pontos ?? []) {
    if (!ponto.posicao) continue

    const cfg = obterConfigPonto(ponto)
    const px = ponto.posicao.x
    const py = ponto.posicao.y

    const g = svgEl('g', {
      class: 'ponto-elemento',
      'data-id': ponto.id,
      'data-tipo': 'ponto',
      'data-categoria': ponto.tipo,
      'data-nome': ponto.nome ?? '',
      role: 'button',
    })

    // Tooltip nativo no hover do mouse
    const title = svgEl('title')
    title.textContent = `${ponto.nome} (${cfg.rotulo})`
    g.appendChild(title)

    // Halo animado de seleção (visível quando ativo/selecionado)
    const halo = svgEl('circle', {
      cx: px, cy: py,
      r: 12,
      fill: 'none',
      stroke: cfg.cor,
      'stroke-width': '2.5',
      class: 'pin-halo',
    })

    // Hit-area transparente ampla para facilitar o clique
    const hit = svgEl('circle', {
      cx: px, cy: py,
      r: 20,
      fill: '#ffffff',
      'fill-opacity': '0.001',
      'pointer-events': 'all',
      style: 'cursor: pointer;',
    })

    // Pin circular com sombra e borda branca de destaque
    const pin = svgEl('circle', {
      cx: px, cy: py,
      r: 11,
      fill: cfg.cor,
      stroke: '#ffffff',
      'stroke-width': '2.2',
      filter: 'url(#sombra-pin)',
      class: 'pin-circulo',
    })

    // Ícone SVG/emoji perfeitamente centralizado
    const icone = svgEl('text', {
      x: px,
      y: py + 0.5,
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      'alignment-baseline': 'central',
      'font-size': '10.5',
      fill: '#ffffff',
      'pointer-events': 'none',
      style: 'user-select: none;',
    })
    icone.textContent = cfg.icone

    // Não renderizamos labels de texto no mapa para manter o visual limpo e minimalista
    g.append(halo, hit, pin, icone)
    gPontos.appendChild(g)
  }

  camadaEl.appendChild(svg)
  return svg
}

/**
 * Destaca a rota calculada no SVG.
 *
 * @param {string[]} caminho — array de ids de nós
 * @param {Object} grafo — resultado de construirGrafo()
 * @param {SVGElement} svg — elemento SVG do grafo
 */
export function destacarRota(caminho, grafo, svg) {
  if (!svg || !caminho || caminho.length < 2) return

  limparRota(svg)

  const gRota = svg.querySelector('#layer-rota')
  if (!gRota) return

  for (let i = 0; i < caminho.length - 1; i++) {
    const noA = grafo[caminho[i]]?.no
    const noB = grafo[caminho[i + 1]]?.no
    if (!noA || !noB) continue

    // Linha de contorno branca
    const fundo = document.createElementNS(NS, 'line')
    fundo.setAttribute('x1', noA.posicao.x)
    fundo.setAttribute('y1', noA.posicao.y)
    fundo.setAttribute('x2', noB.posicao.x)
    fundo.setAttribute('y2', noB.posicao.y)
    fundo.setAttribute('stroke', '#ffffff')
    fundo.setAttribute('stroke-width', '7')
    fundo.setAttribute('stroke-linecap', 'round')

    // Linha azul da rota animada
    const linha = document.createElementNS(NS, 'line')
    linha.setAttribute('x1', noA.posicao.x)
    linha.setAttribute('y1', noA.posicao.y)
    linha.setAttribute('x2', noB.posicao.x)
    linha.setAttribute('y2', noB.posicao.y)
    linha.setAttribute('stroke', '#4285F4')
    linha.setAttribute('stroke-width', '4')
    linha.setAttribute('stroke-linecap', 'round')
    linha.setAttribute('stroke-dasharray', '10 5')
    linha.setAttribute('class', 'rota-aresta')

    gRota.append(fundo, linha)
  }

  // Marcadores de início (A) e fim (B)
  const noOrigem = grafo[caminho[0]]?.no
  const noDestino = grafo[caminho[caminho.length - 1]]?.no

  if (noOrigem) {
    gRota.appendChild(_marcadorRota(noOrigem.posicao.x, noOrigem.posicao.y, '#22c55e', 'A'))
  }
  if (noDestino) {
    gRota.appendChild(_marcadorRota(noDestino.posicao.x, noDestino.posicao.y, '#ef4444', 'B'))
  }
}

function _marcadorRota(x, y, cor, letra) {
  const g = document.createElementNS(NS, 'g')

  const circulo = document.createElementNS(NS, 'circle')
  circulo.setAttribute('cx', x)
  circulo.setAttribute('cy', y)
  circulo.setAttribute('r', 11)
  circulo.setAttribute('fill', cor)
  circulo.setAttribute('stroke', 'white')
  circulo.setAttribute('stroke-width', '2')
  circulo.setAttribute('filter', 'url(#sombra-pin)')

  const texto = document.createElementNS(NS, 'text')
  texto.setAttribute('x', x)
  texto.setAttribute('y', y)
  texto.setAttribute('text-anchor', 'middle')
  texto.setAttribute('dominant-baseline', 'central')
  texto.setAttribute('font-size', '10.5')
  texto.setAttribute('font-weight', 'bold')
  texto.setAttribute('fill', 'white')
  texto.setAttribute('pointer-events', 'none')
  texto.textContent = letra

  g.append(circulo, texto)
  return g
}

/** Remove a rota destacada do SVG */
export function limparRota(svg) {
  if (!svg) return
  const gRota = svg.querySelector('#layer-rota')
  if (gRota) gRota.replaceChildren()
}

/**
 * Atualiza a visibilidade das camadas conforme os filtros.
 *
 * @param {SVGElement} svg
 * @param {{ blocos, pontos, ruas, arestas, tateis, rampas, nos }} opcoes
 */
export function atualizarFiltros(svg, opcoes) {
  if (!svg) return

  const toggle = (id, visivel) => {
    const el = svg.querySelector(`#${id}`)
    if (el) el.setAttribute('visibility', visivel ? 'visible' : 'hidden')
  }

  toggle('layer-blocos',  opcoes.blocos  ?? false)
  toggle('layer-pontos',  opcoes.pontos  ?? true)
  toggle('layer-ruas',    opcoes.ruas    ?? true)
  toggle('layer-arestas', opcoes.arestas ?? true)
  toggle('layer-tateis',  opcoes.tateis  ?? true)
  toggle('layer-rampas',  opcoes.rampas  ?? true)
}

/** Realça visualmente um item (adiciona halo de pulso e destaque elegante) */
export function realcarNo(svg, id, ativo) {
  if (!svg) return

  if (ativo) {
    svg.querySelectorAll('.item-selecionado').forEach((el) => {
      el.classList.remove('item-selecionado')
    })
  }

  if (!id) return
  const el = svg.querySelector(`[data-id="${id}"]`)
  if (!el) return

  el.classList.toggle('item-selecionado', !!ativo)

  if (el.classList.contains('bloco-elemento')) {
    const rect = el.querySelector('.bloco-retangulo')
    if (rect) {
      rect.setAttribute('fill', ativo ? 'rgba(66, 133, 244, 0.28)' : 'rgba(66, 133, 244, 0.08)')
      rect.setAttribute('stroke', ativo ? '#1a73e8' : 'rgba(66, 133, 244, 0.45)')
      rect.setAttribute('stroke-width', ativo ? '2.5' : '1.5')
    }
  }
}
