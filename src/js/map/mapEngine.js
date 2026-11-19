/**
 * mapEngine.js — InMaps FACAPE
 * Motor de zoom e pan do mapa 2D.
 * Responsável por: zoom via botões/scroll/pinça, arrastar, limites e reset.
 */

// styles imported in main.js

const ZOOM_MIN   = 1
const ZOOM_MAX   = 5
const PASSO_ZOOM = 1.25
const MAX_PONTEIROS = 2
const EPSILON    = 0.0001

function limitarValor(valor, minimo, maximo) {
  return Math.min(maximo, Math.max(minimo, valor))
}

export function inicializarMapa() {
  const container  = document.querySelector('#mapa-container')
  const viewport   = document.querySelector('#mapa-viewport')
  const camada     = document.querySelector('#mapa-camada')
  const imagem     = document.querySelector('#mapa-imagem')
  const controles  = document.querySelector('#mapa-controles')
  const botaoZoomIn  = document.querySelector('#zoom-in')
  const botaoZoomOut = document.querySelector('#zoom-out')
  const botaoReset   = document.querySelector('#zoom-reset')
  const botao3D      = document.querySelector('#btn-3d')

  if (!viewport || !imagem || !camada) {
    console.error('InMaps: elementos obrigatórios ausentes:', [
      !viewport && '#mapa-viewport',
      !imagem   && '#mapa-imagem',
      !camada   && '#mapa-camada',
    ].filter(Boolean).join(', '))
    return null
  }

  if (viewport.dataset.mapaIniciado === 'true') {
    console.warn('InMaps: mapa já inicializado.')
    return null
  }
  viewport.dataset.mapaIniciado = 'true'

  // ── Estado ───────────────────────────────────────────────────
  const estado = { z: 1, x: 0, y: 0, pitch: 0, bearing: 0 }
  let larguraBase = 0
  let alturaBase  = 0
  let enquadramento = 1
  let aguardandoDimensoes = false
  const ponteiros = new Map()
  const eventosProcessados = new WeakSet()

  const escalaAtual = () => enquadramento * estado.z

  imagem.draggable = false
  imagem.addEventListener('dragstart', (e) => e.preventDefault())

  // Previne menu de contexto ao usar botão direito para girar a maquete
  viewport.addEventListener('contextmenu', (e) => e.preventDefault())

  // ── Cálculos ─────────────────────────────────────────────────
  function recalcularEnquadramento() {
    const lv = viewport.clientWidth
    const av = viewport.clientHeight
    if (!lv || !av || !larguraBase || !alturaBase) return false
    enquadramento = Math.min(lv / larguraBase, av / alturaBase)
    return true
  }

  function limitarPosicao() {
    const lv = viewport.clientWidth
    const av = viewport.clientHeight
    const escala = escalaAtual()
    const li = larguraBase * escala
    const ai = alturaBase  * escala

    estado.x = li <= lv ? (lv - li) / 2 : limitarValor(estado.x, lv - li, 0)
    estado.y = ai <= av ? (av - ai) / 2 : limitarValor(estado.y, av - ai, 0)
  }

  function atualizarBotoes() {
    if (botaoZoomIn)  botaoZoomIn.disabled  = estado.z >= ZOOM_MAX - EPSILON
    if (botaoZoomOut) botaoZoomOut.disabled = estado.z <= ZOOM_MIN + EPSILON
  }

  function aplicar() {
    limitarPosicao()
    const cx = larguraBase / 2
    const cy = alturaBase / 2
    const rot3D = (estado.pitch || estado.bearing)
      ? `translate(${cx}px, ${cy}px) rotateX(${estado.pitch}deg) rotateZ(${estado.bearing}deg) translate(${-cx}px, ${-cy}px)`
      : ''
    camada.style.transform = `translate(${estado.x}px,${estado.y}px) scale(${escalaAtual()}) ${rot3D}`
    atualizarBotoes()
  }

  function alternar3D() {
    camada.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)'
    if (estado.pitch === 0) {
      estado.pitch = 32
      estado.bearing = -5
      viewport.classList.add('modo-3d')
      if (botao3D) botao3D.classList.add('ativo')
    } else {
      estado.pitch = 0
      estado.bearing = 0
      viewport.classList.remove('modo-3d')
      if (botao3D) botao3D.classList.remove('ativo')
    }
    aplicar()
    setTimeout(() => {
      camada.style.transition = 'none'
    }, 480)
  }

  function zoomPara(novoZ, px, py) {
    const zl = limitarValor(novoZ, ZOOM_MIN, ZOOM_MAX)
    const escalaAnt = escalaAtual()
    estado.z = zl
    const razao = escalaAtual() / escalaAnt
    estado.x = px - (px - estado.x) * razao
    estado.y = py - (py - estado.y) * razao
    aplicar()
  }

  function zoomPeloCentro(fator) {
    zoomPara(estado.z * fator, viewport.clientWidth / 2, viewport.clientHeight / 2)
  }

  function resetar() {
    estado.z = 1
    estado.x = 0
    estado.y = 0
    estado.pitch = 0
    estado.bearing = 0
    viewport.classList.remove('modo-3d')
    if (botao3D) botao3D.classList.remove('ativo')
    aplicar()
  }

  /**
   * Foca o mapa em coordenadas do mapa (pixels da imagem).
   * @param {number} x
   * @param {number} y
   * @param {number} [zoomAlvo=2.5]
   */
  function focarEm(x, y, zoomAlvo = 2.5) {
    estado.z = limitarValor(zoomAlvo, ZOOM_MIN, ZOOM_MAX)
    const escala = escalaAtual()
    estado.x = viewport.clientWidth  / 2 - Number(x) * escala
    estado.y = viewport.clientHeight / 2 - Number(y) * escala
    aplicar()
  }

  // ── Botões ───────────────────────────────────────────────────
  if (botaoZoomIn)  botaoZoomIn.addEventListener('click',  () => zoomPeloCentro(PASSO_ZOOM))
  if (botaoZoomOut) botaoZoomOut.addEventListener('click', () => zoomPeloCentro(1 / PASSO_ZOOM))
  if (botaoReset)   botaoReset.addEventListener('click',   resetar)
  if (botao3D)      botao3D.addEventListener('click',      alternar3D)

  // Scroll/wheel zoom
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault()
    const rect = viewport.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const fator = e.deltaY < 0 ? PASSO_ZOOM : 1 / PASSO_ZOOM
    zoomPara(estado.z * fator, px, py)
  }, { passive: false })

  // ── Arraste e pinça ──────────────────────────────────────────
  function posicaoRelativa(ev) {
    const r = viewport.getBoundingClientRect()
    return { x: ev.clientX - r.left, y: ev.clientY - r.top }
  }

  function distancia(a, b) { return Math.hypot(a.x - b.x, a.y - b.y) }
  function centro(a, b)    { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }

  function atualizarEstadoArraste() {
    viewport.classList.toggle('arrastando', ponteiros.size > 0)
  }

  function finalizarPonteiro(ev) {
    if (!ponteiros.delete(ev.pointerId)) return
    try { if (viewport.hasPointerCapture(ev.pointerId)) viewport.releasePointerCapture(ev.pointerId) } catch (_) {}
    atualizarEstadoArraste()
  }

  function limparPonteiros() {
    if (ponteiros.size === 0) return
    ponteiros.forEach((_, id) => {
      try { if (viewport.hasPointerCapture(id)) viewport.releasePointerCapture(id) } catch (_) {}
    })
    ponteiros.clear()
    atualizarEstadoArraste()
  }

  let inicioPonteiro = null
  let arrastoIniciado = false

  function moverPonteiro(ev) {
    if (eventosProcessados.has(ev)) return
    if (!ponteiros.has(ev.pointerId)) return
    eventosProcessados.add(ev)

    if (ev.pointerType === 'mouse' && ev.buttons === 0) {
      finalizarPonteiro(ev)
      return
    }

    const antigas = new Map(ponteiros)
    const nova    = posicaoRelativa(ev)
    ponteiros.set(ev.pointerId, nova)

    if (ponteiros.size === 1) {
      const ant = antigas.get(ev.pointerId)

      // Se estiver usando botão direito do mouse ou Shift, inclina e gira a maquete em 3D
      if (ev.pointerType === 'mouse' && (ev.buttons === 2 || ev.shiftKey)) {
        arrastoIniciado = true
        estado.pitch = limitarValor(estado.pitch - (nova.y - ant.y) * 0.35, 0, 52)
        estado.bearing = limitarValor(estado.bearing + (nova.x - ant.x) * 0.3, -30, 30)
        viewport.classList.toggle('modo-3d', estado.pitch > 2)
        if (botao3D) botao3D.classList.toggle('ativo', estado.pitch > 2)
        aplicar()
        return
      }

      if (!arrastoIniciado && inicioPonteiro) {
        const d = Math.hypot(nova.x - inicioPonteiro.x, nova.y - inicioPonteiro.y)
        if (d > 5) {
          arrastoIniciado = true
          try {
            if (!viewport.hasPointerCapture(ev.pointerId)) {
              viewport.setPointerCapture(ev.pointerId)
            }
          } catch (_) {}
        } else {
          return // Movimento mínimo: preserva clique no elemento
        }
      }

      estado.x += nova.x - ant.x
      estado.y += nova.y - ant.y
      aplicar()
    } else if (ponteiros.size === 2) {
      arrastoIniciado = true
      const [idA, idB] = Array.from(ponteiros.keys())
      const ca  = centro(antigas.get(idA), antigas.get(idB))
      const da  = distancia(antigas.get(idA), antigas.get(idB))
      const cn  = centro(ponteiros.get(idA), ponteiros.get(idB))
      const dn  = distancia(ponteiros.get(idA), ponteiros.get(idB))

      estado.x += cn.x - ca.x
      estado.y += cn.y - ca.y
      if (da > 0) zoomPara(estado.z * (dn / da), cn.x, cn.y)
      else aplicar()
    }
  }

  viewport.addEventListener('pointerdown', (ev) => {
    if (ev.pointerType === 'mouse' && ev.button !== 0 && ev.button !== 2) return
    if (controles && controles.contains(ev.target)) return
    if (!ponteiros.has(ev.pointerId) && ponteiros.size >= MAX_PONTEIROS) return

    const pos = posicaoRelativa(ev)
    ponteiros.set(ev.pointerId, pos)
    inicioPonteiro = pos
    arrastoIniciado = false

    // Se clicou direto no mapa (fora de um ponto/bloco interativo), pode capturar ponteiro
    const eInterativo = ev.target.closest(
      '.ponto-elemento, .bloco-elemento, .rampa-elemento, .no-interativo'
    )
    if (!eInterativo) {
      try { viewport.setPointerCapture(ev.pointerId) } catch (_) {}
    }

    atualizarEstadoArraste()
  })

  viewport.addEventListener('pointermove', moverPonteiro)
  window.addEventListener('pointermove',   moverPonteiro)
  viewport.addEventListener('pointerup',   finalizarPonteiro)
  viewport.addEventListener('pointercancel', finalizarPonteiro)
  viewport.addEventListener('lostpointercapture', finalizarPonteiro)
  window.addEventListener('pointerup',     finalizarPonteiro)
  window.addEventListener('pointercancel', finalizarPonteiro)
  window.addEventListener('blur', limparPonteiros)
  document.addEventListener('visibilitychange', () => { if (document.hidden) limparPonteiros() })

  // ── Carregamento da imagem ───────────────────────────────────
  function iniciarEnquadramento() {
    if (!recalcularEnquadramento()) return false
    aguardandoDimensoes = false
    resetar()
    viewport.classList.add('mapa-pronto')
    return true
  }

  function prepararImagem() {
    larguraBase = imagem.naturalWidth
    alturaBase  = imagem.naturalHeight
    if (!larguraBase || !alturaBase) {
      console.error('InMaps: imagem sem dimensões válidas.')
      return
    }
    imagem.style.width  = `${larguraBase}px`
    imagem.style.height = `${alturaBase}px`
    camada.style.width  = `${larguraBase}px`
    camada.style.height = `${alturaBase}px`

    if (!iniciarEnquadramento()) {
      aguardandoDimensoes = true
    }
  }

  function aoRedimensionar() {
    if (!larguraBase) return
    if (aguardandoDimensoes) { iniciarEnquadramento(); return }
    if (recalcularEnquadramento()) aplicar()
  }

  if (imagem.complete && imagem.naturalWidth > 0) {
    prepararImagem()
  } else if (imagem.complete) {
    console.error('InMaps: falha ao carregar a imagem.')
  } else {
    imagem.addEventListener('load',  prepararImagem,  { once: true })
    imagem.addEventListener('error', () => console.error('InMaps: erro ao carregar imagem.'), { once: true })
  }

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(aoRedimensionar).observe(viewport)
  } else {
    window.addEventListener('resize', aoRedimensionar)
  }

  atualizarBotoes()

  return { zoomIn: () => zoomPeloCentro(PASSO_ZOOM), zoomOut: () => zoomPeloCentro(1 / PASSO_ZOOM), resetar, focarEm }
}
