// Motor inicial do mapa 2D do InMaps - FACAPE.
// Responsável por: zoom pelos botões, arrastar (mouse e toque),
// pinça com dois dedos, limites de zoom/posição e reset da visualização.
// O layout e os estilos do mapa ficam em src/css/mapa.css.
// Ainda NÃO trata marcadores, rotas nem leitura de dados JSON.

import '../../css/mapa.css'

const ZOOM_MIN = 1 // 1 = mapa inteiro visível (enquadrado)
const ZOOM_MAX = 5
const PASSO_ZOOM = 1.25 // fator aplicado a cada clique nos botões
const MAX_PONTEIROS = 2 // arrastar (1) ou pinça (2)
const EPSILON = 0.0001

function limitarValor(valor, minimo, maximo) {
  return Math.min(maximo, Math.max(minimo, valor))
}

export function inicializarMapa() {
  const container = document.querySelector('#mapa-container')
  const viewport = document.querySelector('#mapa-viewport')
  const imagem = document.querySelector('#mapa-imagem')
  const controles = document.querySelector('#mapa-controles')
  const botaoZoomIn = document.querySelector('#zoom-in')
  const botaoZoomOut = document.querySelector('#zoom-out')
  const botaoReset = document.querySelector('#zoom-reset')

  // Elementos obrigatórios
  if (!viewport || !imagem) {
    console.error(
      'InMaps: não foi possível iniciar o mapa. Elemento(s) ausente(s):',
      [!viewport && '#mapa-viewport', !imagem && '#mapa-imagem']
        .filter(Boolean)
        .join(', ')
    )
    return null
  }

  // Elementos opcionais: apenas avisa
  const opcionaisAusentes = [
    [container, '#mapa-container'],
    [controles, '#mapa-controles'],
    [botaoZoomIn, '#zoom-in'],
    [botaoZoomOut, '#zoom-out'],
    [botaoReset, '#zoom-reset'],
  ]
    .filter(([elemento]) => !elemento)
    .map(([, seletor]) => seletor)

  if (opcionaisAusentes.length > 0) {
    console.warn(
      'InMaps: elemento(s) opcional(is) não encontrado(s):',
      opcionaisAusentes.join(', ')
    )
  }

  // Evita registrar os eventos duas vezes
  if (viewport.dataset.mapaIniciado === 'true') {
    console.warn('InMaps: o mapa já foi inicializado.')
    return null
  }
  viewport.dataset.mapaIniciado = 'true'

  // ---------- Estado ----------
  // z: zoom relativo ao enquadramento (1 = mapa inteiro visível)
  // x, y: deslocamento da imagem em pixels, dentro da viewport
  const estado = { z: 1, x: 0, y: 0 }
  let larguraBase = 0 // tamanho natural da imagem
  let alturaBase = 0
  let enquadramento = 1 // escala que faz a imagem caber na viewport
  let aguardandoDimensoes = false // imagem carregada, mas viewport ainda sem tamanho
  const ponteiros = new Map() // pointerId -> { x, y } (relativo à viewport)
  const eventosProcessados = new WeakSet() // evita tratar o mesmo pointermove duas vezes

  const escalaAtual = () => enquadramento * estado.z

  // Impede o arraste nativo da imagem pelo navegador
  imagem.draggable = false
  imagem.addEventListener('dragstart', (evento) => evento.preventDefault())

  // ---------- Cálculo e aplicação ----------
  function recalcularEnquadramento() {
    const larguraViewport = viewport.clientWidth
    const alturaViewport = viewport.clientHeight
    if (!larguraViewport || !alturaViewport || !larguraBase || !alturaBase) {
      return false
    }
    enquadramento = Math.min(
      larguraViewport / larguraBase,
      alturaViewport / alturaBase
    )
    return true
  }

  function limitarPosicao() {
    const larguraViewport = viewport.clientWidth
    const alturaViewport = viewport.clientHeight
    const escala = escalaAtual()
    const larguraImagem = larguraBase * escala
    const alturaImagem = alturaBase * escala

    // Menor que a viewport: centraliza. Maior: impede mostrar vazio nas bordas,
    // portanto o mapa nunca sai da área visível.
    estado.x =
      larguraImagem <= larguraViewport
        ? (larguraViewport - larguraImagem) / 2
        : limitarValor(estado.x, larguraViewport - larguraImagem, 0)

    const AJUSTE_VERTICAL = 10

    estado.y =
      alturaImagem <= alturaViewport
        ? (alturaViewport - alturaImagem) / 2 - AJUSTE_VERTICAL
        : limitarValor(estado.y, alturaViewport - alturaImagem, 0)
  }

  function atualizarBotoes() {
    if (botaoZoomIn) botaoZoomIn.disabled = estado.z >= ZOOM_MAX - EPSILON
    if (botaoZoomOut) botaoZoomOut.disabled = estado.z <= ZOOM_MIN + EPSILON
  }

  function aplicar() {
    limitarPosicao()
    imagem.style.transform = `translate(${estado.x}px, ${estado.y}px) scale(${escalaAtual()})`
    atualizarBotoes()
  }

  // Altera o zoom mantendo fixo o ponto (px, py), em coordenadas da viewport
  function zoomPara(novoZ, px, py) {
    const zoomLimitado = limitarValor(novoZ, ZOOM_MIN, ZOOM_MAX)
    const escalaAnterior = escalaAtual()
    estado.z = zoomLimitado
    const razao = escalaAtual() / escalaAnterior
    estado.x = px - (px - estado.x) * razao
    estado.y = py - (py - estado.y) * razao
    aplicar()
  }

  function zoomPeloCentro(fator) {
    zoomPara(
      estado.z * fator,
      viewport.clientWidth / 2,
      viewport.clientHeight / 2
    )
  }

  function resetar() {
    estado.z = 1
    estado.x = 0
    estado.y = 0
    aplicar() // limitarPosicao() centraliza a imagem
  }

  // ---------- Botões ----------
  if (botaoZoomIn) {
    botaoZoomIn.addEventListener('click', () => zoomPeloCentro(PASSO_ZOOM))
  }
  if (botaoZoomOut) {
    botaoZoomOut.addEventListener('click', () => zoomPeloCentro(1 / PASSO_ZOOM))
  }
  if (botaoReset) {
    botaoReset.addEventListener('click', resetar)
  }

  // ---------- Arrastar e pinça (mouse, toque e caneta) ----------
  function posicaoRelativa(evento) {
    const retangulo = viewport.getBoundingClientRect()
    return { x: evento.clientX - retangulo.left, y: evento.clientY - retangulo.top }
  }

  function distancia(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  function centro(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  }

  function atualizarEstadoArraste() {
    viewport.classList.toggle('arrastando', ponteiros.size > 0)
  }

  // Remove um ponteiro do estado. É seguro chamar várias vezes para o mesmo
  // ponteiro (pointerup, lostpointercapture, pointercancel...): só a primeira
  // chamada tem efeito.
  function finalizarPonteiro(evento) {
    if (!ponteiros.delete(evento.pointerId)) return

    try {
      if (viewport.hasPointerCapture(evento.pointerId)) {
        viewport.releasePointerCapture(evento.pointerId)
      }
    } catch (erro) {
      // Ponteiro já liberado pelo navegador; nada a fazer
    }

    atualizarEstadoArraste()
  }

  // Limpa tudo (janela perdeu o foco, aba oculta etc.)
  function limparPonteiros() {
    if (ponteiros.size === 0) return
    ponteiros.forEach((_, id) => {
      try {
        if (viewport.hasPointerCapture(id)) viewport.releasePointerCapture(id)
      } catch (erro) {
        // ignora
      }
    })
    ponteiros.clear()
    atualizarEstadoArraste()
  }

  // Movimento do ponteiro: arrasta (1 ponteiro) ou faz pinça (2 ponteiros).
  // Registrada na viewport e na window; o WeakSet garante que o mesmo evento
  // não seja processado duas vezes ao se propagar da viewport para a window.
  function moverPonteiro(evento) {
    if (eventosProcessados.has(evento)) return
    if (!ponteiros.has(evento.pointerId)) return
    eventosProcessados.add(evento)

    // Mouse solto fora da janela sem captura: nenhum botão pressionado
    if (evento.pointerType === 'mouse' && evento.buttons === 0) {
      finalizarPonteiro(evento)
      return
    }

    const antigas = new Map(ponteiros) // cópia das posições anteriores
    const nova = posicaoRelativa(evento)
    ponteiros.set(evento.pointerId, nova)

    if (ponteiros.size === 1) {
      const anterior = antigas.get(evento.pointerId)
      estado.x += nova.x - anterior.x
      estado.y += nova.y - anterior.y
      aplicar()
    } else if (ponteiros.size === 2) {
      const [idA, idB] = Array.from(ponteiros.keys())
      const centroAntigo = centro(antigas.get(idA), antigas.get(idB))
      const distanciaAntiga = distancia(antigas.get(idA), antigas.get(idB))
      const centroNovo = centro(ponteiros.get(idA), ponteiros.get(idB))
      const distanciaNova = distancia(ponteiros.get(idA), ponteiros.get(idB))

      // Acompanha o movimento dos dedos e aplica o zoom em torno do centro deles
      estado.x += centroNovo.x - centroAntigo.x
      estado.y += centroNovo.y - centroAntigo.y
      if (distanciaAntiga > 0) {
        zoomPara(
          estado.z * (distanciaNova / distanciaAntiga),
          centroNovo.x,
          centroNovo.y
        )
      } else {
        aplicar()
      }
    }
  }

  viewport.addEventListener('pointerdown', (evento) => {
    // Só botão principal do mouse; ignora cliques nos controles
    if (evento.pointerType === 'mouse' && evento.button !== 0) return
    if (controles && controles.contains(evento.target)) return

    // No máximo dois ponteiros ativos (arrastar ou pinça)
    if (!ponteiros.has(evento.pointerId) && ponteiros.size >= MAX_PONTEIROS) return

    ponteiros.set(evento.pointerId, posicaoRelativa(evento))
    try {
      viewport.setPointerCapture(evento.pointerId)
    } catch (erro) {
      // Sem captura, o movimento e o fim do gesto são tratados pelos listeners na window
    }
    atualizarEstadoArraste()
  })

  // Na viewport (com captura) e na window (cobre o caso de a captura falhar)
  viewport.addEventListener('pointermove', moverPonteiro)
  window.addEventListener('pointermove', moverPonteiro)

  viewport.addEventListener('pointerup', finalizarPonteiro)
  viewport.addEventListener('pointercancel', finalizarPonteiro)
  viewport.addEventListener('lostpointercapture', finalizarPonteiro)
  window.addEventListener('pointerup', finalizarPonteiro)
  window.addEventListener('pointercancel', finalizarPonteiro)

  // Janela sem foco ou aba oculta: nenhum ponteiro deve ficar preso
  window.addEventListener('blur', limparPonteiros)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) limparPonteiros()
  })

  // ---------- Carregamento da imagem e redimensionamento ----------
  // Aplica o enquadramento inicial e só então revela a imagem.
  // Retorna false se a viewport ainda não tiver dimensões válidas.
  function iniciarEnquadramento() {
    if (!recalcularEnquadramento()) return false

    aguardandoDimensoes = false
    resetar()
    viewport.classList.add('mapa-pronto')
    return true
  }

  function prepararImagem() {
    larguraBase = imagem.naturalWidth
    alturaBase = imagem.naturalHeight

    if (!larguraBase || !alturaBase) {
      console.error('InMaps: a imagem do mapa não possui dimensões válidas.')
      return
    }

    // Tamanho natural da imagem; posição e demais estilos vêm do mapa.css
    imagem.style.width = `${larguraBase}px`
    imagem.style.height = `${alturaBase}px`

    if (!iniciarEnquadramento()) {
      // Viewport ainda sem tamanho: a imagem continua oculta e o
      // ResizeObserver conclui a inicialização quando ela tiver dimensões.
      aguardandoDimensoes = true
      console.warn(
        'InMaps: #mapa-viewport ainda está sem largura/altura; aguardando. ' +
          'Se o mapa não aparecer, verifique se src/css/mapa.css foi carregado.'
      )
    }
  }

  function aoFalharImagem() {
    console.error(
      'InMaps: falha ao carregar a imagem do mapa. ' +
        'Confira o caminho em #mapa-imagem (ex.: images/Mapa_Facape.jpg).'
    )
  }

  function aoRedimensionar() {
    if (!larguraBase) return // imagem ainda não carregada

    if (aguardandoDimensoes) {
      iniciarEnquadramento() // primeira vez que a viewport pode ter ganhado tamanho
      return
    }

    if (recalcularEnquadramento()) aplicar()
  }

  if (imagem.complete && imagem.naturalWidth > 0) {
    // Imagem já carregada
    prepararImagem()
  } else if (imagem.complete) {
    // Terminou de carregar, mas sem dimensões: o carregamento falhou antes do registro dos eventos
    aoFalharImagem()
  } else {
    imagem.addEventListener('load', prepararImagem, { once: true })
    imagem.addEventListener('error', aoFalharImagem, { once: true })
  }

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(aoRedimensionar).observe(viewport)
  } else {
    window.addEventListener('resize', aoRedimensionar)
  }

  atualizarBotoes()

  // Interface mínima para uso futuro por outras partes do projeto
  return {
    zoomIn: () => zoomPeloCentro(PASSO_ZOOM),
    zoomOut: () => zoomPeloCentro(1 / PASSO_ZOOM),
    resetar,
  }
}