
const SVG_NS = 'http://www.w3.org/2000/svg'

const CATEGORIAS = {
  blocos: {
    sigla: 'B',
    cor: '#2563eb',
    descricao: 'Bloco',
  },
  pontos: {
    sigla: 'P',
    cor: '#0d9488',
    descricao: 'Ponto de interesse',
  },
  rampas: {
    sigla: 'R',
    cor: '#16a34a',
    descricao: 'Rampa',
  },
  acessos: {
    sigla: 'A',
    cor: '#9333ea',
    descricao: 'Acesso',
  },
  lombadas: {
    sigla: 'L',
    cor: '#ea580c',
    descricao: 'Lombada',
  },
}

function criarElementoSVG(tipo, atributos = {}) {
  const elemento = document.createElementNS(SVG_NS, tipo)

  Object.entries(atributos).forEach(([nome, valor]) => {
    elemento.setAttribute(nome, valor)
  })

  return elemento
}

function adicionarCampoPainel(painel, rotulo, valor) {
  if (valor === undefined || valor === null || valor === '') {
    return
  }

  const campo = document.createElement('p')
  campo.style.margin = '8px 0'
  campo.style.fontSize = '14px'
  campo.style.color = '#475569'

  const titulo = document.createElement('strong')
  titulo.textContent = `${rotulo}: `

  const conteudo = document.createElement('span')
  conteudo.textContent = String(valor)

  campo.append(titulo, conteudo)
  painel.appendChild(campo)
}

function mostrarInformacoes(item, configuracao) {
  const container = document.querySelector('#mapa-container')

  if (!container) return

  let painel = document.querySelector('#painel-informacoes')

  if (!painel) {
    painel = document.createElement('aside')
    painel.id = 'painel-informacoes'

    Object.assign(painel.style, {
      position: 'absolute',
      left: '12px',
      bottom: '12px',
      zIndex: '20',
      width: 'min(300px, calc(100% - 24px))',
      maxHeight: '45%',
      overflowY: 'auto',
      padding: '16px',
      background: '#ffffff',
      color: '#1e293b',
      borderRadius: '12px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
    })

    container.appendChild(painel)
  }

  painel.replaceChildren()

  const cabecalho = document.createElement('div')
  Object.assign(cabecalho.style, {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  })

  const titulo = document.createElement('h2')
  titulo.textContent = item.nome || configuracao.descricao
  Object.assign(titulo.style, {
    margin: '0',
    fontSize: '18px',
    color: '#1e293b',
  })

  const fechar = document.createElement('button')
  fechar.type = 'button'
  fechar.textContent = '×'
  fechar.setAttribute('aria-label', 'Fechar informações')

  Object.assign(fechar.style, {
    border: 'none',
    background: 'transparent',
    fontSize: '25px',
    cursor: 'pointer',
    color: '#475569',
  })

  fechar.addEventListener('click', () => painel.remove())

  cabecalho.append(titulo, fechar)
  painel.appendChild(cabecalho)

  adicionarCampoPainel(painel, 'Categoria', configuracao.descricao)
  adicionarCampoPainel(painel, 'Descrição', item.descricao)
  adicionarCampoPainel(painel, 'Tipo', item.tipo)
  adicionarCampoPainel(
    painel,
    'Acessível',
    typeof item.acessivel === 'boolean'
      ? (item.acessivel ? 'Sim' : 'Não')
      : null
  )
  adicionarCampoPainel(painel, 'Observação', item.observacao)
}

export function abrirInformacoes(item, nomeCategoria) {
  const configuracao = CATEGORIAS[nomeCategoria]

  if (!configuracao) return

  mostrarInformacoes(item, configuracao)
}

function criarMarcador(item, categoria, configuracao) {
  const { posicao } = item

  if (
    !posicao ||
    !Number.isFinite(Number(posicao.x)) ||
    !Number.isFinite(Number(posicao.y))
  ) {
    console.warn(
      `InMaps: marcador "${item.nome || item.id || 'sem identificação'}" possui posição inválida.`
    )
    return null
  }

  const grupo = criarElementoSVG('g', {
    transform: `translate(${Number(posicao.x)}, ${Number(posicao.y)})`,
    class: 'marcador-mapa',
    role: 'button',
    tabindex: '0',
    'aria-label': `${configuracao.descricao}: ${item.nome || 'Sem nome'}`,
    'pointer-events': 'all',
  })

  grupo.style.cursor = 'pointer'

  // Impede que o clique no marcador movimente o mapa.
  grupo.addEventListener('pointerdown', (evento) => {
    evento.stopPropagation()
  })

  grupo.addEventListener('pointerup', (evento) => {
    evento.stopPropagation()
  })

  grupo.addEventListener('click', (evento) => {
    evento.stopPropagation()
    mostrarInformacoes(item, configuracao)
  })

  grupo.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault()
      mostrarInformacoes(item, configuracao)
    }
  })

  const titulo = criarElementoSVG('title')
  titulo.textContent = `${configuracao.descricao}: ${item.nome || 'Sem nome'}`
  grupo.appendChild(titulo)

  const circulo = criarElementoSVG('circle', {
    cx: 0,
    cy: 0,
    r: 13,
    fill: configuracao.cor,
    stroke: '#ffffff',
    'stroke-width': 2.5,
  })

  grupo.appendChild(circulo)

  const sigla = criarElementoSVG('text', {
    x: 0,
    y: 4.5,
    'text-anchor': 'middle',
    'font-size': 12,
    'font-weight': '700',
    fill: '#ffffff',
    'pointer-events': 'none',
  })

  sigla.textContent = configuracao.sigla
  grupo.appendChild(sigla)

  const nome = criarElementoSVG('text', {
    x: 0,
    y: 29,
    'text-anchor': 'middle',
    'font-size': 12,
    'font-weight': '600',
    fill: '#ffffff',
    stroke: '#1e293b',
    'stroke-width': 3,
    'paint-order': 'stroke',
    'pointer-events': 'none',
  })

  nome.textContent = item.nome || configuracao.descricao
  grupo.appendChild(nome)

  return grupo
}

export function renderizarMarcadores(dados) {
  const camada = document.querySelector('#mapa-camada')
  const imagem = document.querySelector('#mapa-imagem')

  if (!camada || !imagem) {
    console.error('InMaps: camada ou imagem do mapa não encontrada.')
    return
  }

  if (!imagem.naturalWidth || !imagem.naturalHeight) {
    console.warn('InMaps: aguardando o carregamento da imagem para desenhar marcadores.')

    imagem.addEventListener(
      'load',
      () => renderizarMarcadores(dados),
      { once: true }
    )

    return
  }

  const svgExistente = camada.querySelector('#mapa-marcadores')

  if (svgExistente) {
    svgExistente.remove()
  }

  const svg = criarElementoSVG('svg', {
    id: 'mapa-marcadores',
    xmlns: SVG_NS,
    width: imagem.naturalWidth,
    height: imagem.naturalHeight,
    viewBox: `0 0 ${imagem.naturalWidth} ${imagem.naturalHeight}`,
    'aria-label': 'Marcadores de acessibilidade e pontos de interesse',
  })

  svg.style.position = 'absolute'
  svg.style.top = '0'
  svg.style.left = '0'
  svg.style.overflow = 'visible'
  svg.style.pointerEvents = 'auto'

  let total = 0

  Object.entries(CATEGORIAS).forEach(([nomeCategoria, configuracao]) => {
    const itens = dados?.[nomeCategoria]

    if (!Array.isArray(itens)) {
      console.warn(`InMaps: dados da categoria "${nomeCategoria}" inválidos.`)
      return
    }

    itens.forEach((item) => {
      const marcador = criarMarcador(item, nomeCategoria, configuracao)

      if (marcador) {
        svg.appendChild(marcador)
        total++
      }
    })
  })

  camada.appendChild(svg)

  console.log(`InMaps: ${total} marcador(es) desenhado(s).`)
}
