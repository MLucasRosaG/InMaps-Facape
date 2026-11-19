/**
 * main.js — InMaps FACAPE
 * Layout estilo Google Maps (sidebar clean na esquerda, mapa amplo na direita).
 * Sistema de navegação e rotas acessíveis de um local existente para outro.
 * Pronto para homologação e deploy em produção.
 */

import './css/style.css'
import { carregarDados } from './js/data/dataLoader.js'
import { inicializarMapa } from './js/map/mapEngine.js'
import {
  renderizarGrafo,
  destacarRota,
  limparRota,
  atualizarFiltros,
  realcarNo,
} from './js/map/graphRenderer.js'
import { construirGrafo, calcularRota, encontrarNoMaisProximo } from './js/routing/pathfinder.js'
import { inicializarBusca } from './js/search/searchEngine.js'

// ── 1. Injetar Estrutura HTML da Aplicação ───────────────────────────
document.querySelector('#app').innerHTML = `
<div id="app-layout">

  <!-- SIDEBAR (PAINEL ESQUERDO) -->
  <aside id="sidebar">

    <div id="sidebar-header">
      <div id="logo">InMaps</div>
      <div id="logo-sub">FACAPE · Mapa de Acessibilidade do Campus</div>
    </div>

    <!-- BUSCA RÁPIDA -->
    <div id="search-section">
      <div id="search-box">
        <input id="campo-busca" type="search" autocomplete="off"
               placeholder="Buscar bloco, banheiro, laboratório..." />
        <div id="resultados-busca" hidden></div>
      </div>
    </div>

    <!-- PAINEL DE INFORMAÇÕES DO LOCAL SELECIONADO & DESTINO -->
    <div id="painel-info">
      <div id="painel-info-conteudo">
        <div class="painel-info-placeholder">
          <span class="placeholder-icone">🗺️</span>
          <h4>Selecione um ponto de partida</h4>
          <p>Clique em qualquer local no mapa ou use a busca acima para ver detalhes e traçar sua rota acessível.</p>
        </div>
      </div>
    </div>

    <!-- FILTROS DE CAMADAS -->
    <div id="painel-filtros">
      <h3>Camadas Visíveis</h3>
      <label><input type="checkbox" id="filtro-pontos"  checked> 📍 Pontos de Interesse</label>
      <label><input type="checkbox" id="filtro-tateis"  checked> ♿ Piso Tátil (com setas)</label>
      <label><input type="checkbox" id="filtro-rampas"  checked> 🟢 Rampas de Acesso</label>
      <label><input type="checkbox" id="filtro-ruas"    checked> 🛣️ Vias / Ruas</label>
      <label><input type="checkbox" id="filtro-arestas" checked> 🚶 Caminhos Gerais</label>
      <label><input type="checkbox" id="filtro-blocos"> 🏢 Blocos do Campus</label>
    </div>

    <!-- LEGENDA DO MAPA -->
    <div id="legenda">
      <h3>Legenda</h3>
      <div class="legenda-item">
        <span class="legenda-pin" style="background:#0284c7">🚻</span>
        Pontos de Interesse
      </div>
      <div class="legenda-item">
        <span class="legenda-cor" style="background:#f59e0b;height:4px"></span>
        Piso Tátil Acessível
      </div>
      <div class="legenda-item">
        <span class="legenda-cor" style="background:#22c55e"></span>
        Rampas de Acesso (R)
      </div>
      <div class="legenda-item">
        <span class="legenda-cor" style="background:#4285F4;height:4px"></span>
        Rota Acessível Calculada
      </div>
    </div>

  </aside>

  <!-- ÁREA DO MAPA (PAINEL DIREITO) -->
  <main id="mapa-area">
    <div id="mapa-container">

      <!-- CONTROLES DE ZOOM ESTILO MAPS -->
      <div id="mapa-controles">
        <button id="btn-3d" aria-label="Alternar visualização 3D Maquete" title="Modo 3D Maquete">3D</button>
        <button id="zoom-in"  aria-label="Aumentar zoom"></button>
        <button id="zoom-out" aria-label="Diminuir zoom"></button>
        <button id="zoom-reset" aria-label="Redefinir visualização"></button>
      </div>

      <!-- VIEWPORT E CAMADA DE RENDERIZAÇÃO -->
      <div id="mapa-viewport">
        <div id="mapa-camada">
          <img id="mapa-imagem"
               src="${import.meta.env.BASE_URL}images/Mapa_Facape.png"
               alt="Mapa do Campus da FACAPE" />
        </div>
      </div>

    </div>
  </main>

</div>
`

// ── 2. Inicialização da Aplicação ────────────────────────────────────
async function iniciarApp() {
  const painelInfoConteudo = document.querySelector('#painel-info-conteudo')

  // ── 3. Carregar todos os dados JSON ──────────────────────────────
  let dados
  try {
    dados = await carregarDados()
  } catch (err) {
    console.error('InMaps: erro ao carregar os dados JSON:', err)
    return
  }

  // ── 4. Inicializar motor de navegação do mapa ────────────────────
  const mapa = inicializarMapa()
  if (!mapa) return

  // ── 5. Renderizar Grafo e Camadas SVG ────────────────────────────
  const imagem = document.querySelector('#mapa-imagem')
  const camada = document.querySelector('#mapa-camada')

  let svgGrafo = null
  let grafo = null
  let localPartida = null

  function montarGrafo() {
    const larg = imagem.naturalWidth
    const alt  = imagem.naturalHeight
    if (!larg || !alt) return

    svgGrafo = renderizarGrafo(dados, camada, larg, alt)
    grafo = construirGrafo(dados.nos, dados.arestas, dados.nosTateis, dados.arestasTateis)

    // Clique direto no mapa: define o item clicado como ponto de partida
    svgGrafo.addEventListener('click', (ev) => {
      const pontoEl = ev.target.closest('.ponto-elemento')
      if (pontoEl) {
        ev.stopPropagation()
        const id = pontoEl.dataset.id
        const item = dados.pontos?.find((p) => p.id === id)
        if (item) definirPontoPartida(item, 'ponto')
        return
      }

      const blocoEl = ev.target.closest('.bloco-elemento')
      if (blocoEl) {
        ev.stopPropagation()
        const id = blocoEl.dataset.id
        const item = dados.blocos?.find((b) => b.id === id)
        if (item) definirPontoPartida(item, 'bloco')
        return
      }

      const rampaEl = ev.target.closest('.rampa-elemento')
      if (rampaEl) {
        ev.stopPropagation()
        const id = rampaEl.dataset.id
        const item = dados.rampas?.find((r) => r.id === id)
        if (item) definirPontoPartida(item, 'rampa')
        return
      }
    })
  }

  if (imagem.complete && imagem.naturalWidth > 0) {
    requestAnimationFrame(montarGrafo)
  } else {
    imagem.addEventListener('load', () => requestAnimationFrame(montarGrafo), { once: true })
  }

  // ── 6. Montar Lista Ordenada de Locais ────────────────────────────
  const pontosOrdenados = [...(dados.pontos ?? [])].sort((a, b) =>
    (a.nome || a.id).localeCompare(b.nome || b.id, 'pt-BR')
  )

  const blocosOrdenados = [...(dados.blocos ?? [])].sort((a, b) =>
    (a.nome || a.id).localeCompare(b.nome || b.id, 'pt-BR')
  )

  function gerarOpcoesDestino(origemId) {
    const pontosFiltrados = pontosOrdenados.filter((p) => p.id !== origemId)
    const blocosFiltrados = blocosOrdenados.filter((b) => b.id !== origemId)

    const grupoPontos = pontosFiltrados
      .map((p) => `<option value="${p.id}">${p.nome || p.id}</option>`)
      .join('')
    const grupoBlocos = blocosFiltrados
      .map((b) => `<option value="${b.id}">${b.nome || b.id}</option>`)
      .join('')

    return `
      <option value="">Selecione para onde deseja ir...</option>
      <optgroup label="📍 Pontos de Interesse & Serviços">
        ${grupoPontos}
      </optgroup>
      <optgroup label="🏢 Blocos Acadêmicos">
        ${grupoBlocos}
      </optgroup>
    `
  }

  function encontrarLocalPorId(id) {
    if (!id) return null
    return (
      dados.pontos?.find((p) => p.id === id) ||
      dados.blocos?.find((b) => b.id === id) ||
      dados.rampas?.find((r) => r.id === id)
    )
  }

  function resolverNoGrafo(item) {
    if (!item) return null
    if (grafo[item.id]) return item.id
    if (item.posicao && grafo) {
      return encontrarNoMaisProximo(item.posicao, grafo)
    }
    return null
  }

  // ── 7. Definir Ponto de Partida e Exibir Painel ───────────────────
  function definirPontoPartida(item, categoria) {
    if (!item) return
    localPartida = item

    if (svgGrafo) {
      realcarNo(svgGrafo, item.id, true)
      limparRota(svgGrafo)
    }

    const titulo = item.nome || item.id
    const descricao = item.descricao || item.observacao || ''
    let tag = ''
    let icone = '📍'

    if (categoria === 'bloco') {
      icone = '🏢'
      tag = '<span class="info-badge bloco">🏢 Bloco do Campus</span>'
      if (item.acessivel) tag += ' <span class="info-badge acessivel">♿ Acessível</span>'
    } else if (categoria === 'ponto') {
      const tipo = item.tipo || 'Ponto de Interesse'
      icone = (item.nome || '').toLowerCase().includes('acessivel') || (item.nome || '').toLowerCase().includes('acessível')
        ? '♿'
        : tipo === 'banheiro' ? '🚻'
        : tipo === 'laboratorio' ? '💻'
        : tipo === 'auditorio' ? '📢'
        : tipo === 'entrada' ? '🚪'
        : '📍'
      tag = `<span class="info-badge ponto">📍 ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</span>`
      if ((item.nome || '').toLowerCase().includes('acessivel') || (item.nome || '').toLowerCase().includes('acessível')) {
        tag += ' <span class="info-badge acessivel">♿ Adaptado</span>'
      }
    } else if (categoria === 'rampa') {
      icone = '🟢'
      tag = '<span class="info-badge rampa">🟢 Rampa de Acesso</span>'
    }

    const html = `
      <div class="cartao-ponto">
        <div class="cartao-ponto-header">
          <div class="cartao-ponto-titulo-box">
            <span class="cartao-ponto-icone">${icone}</span>
            <div class="cartao-ponto-textos">
              <span class="ponto-subtitulo">Ponto de Partida</span>
              <h4>${titulo}</h4>
            </div>
          </div>
          <button id="btn-fechar-detalhe" class="btn-fechar-card" aria-label="Fechar detalhes" title="Fechar">✕</button>
        </div>

        <div class="info-tags">${tag}</div>

        ${descricao ? `<p class="info-descricao">${descricao}</p>` : ''}

        <!-- ESCOLHA DO DESTINO -->
        <div class="secao-definir-destino">
          <label for="select-destino">
            <span class="icone-destino">🏁</span> Para onde deseja ir?
          </label>
          <div class="select-wrapper">
            <select id="select-destino">
              ${gerarOpcoesDestino(item.id)}
            </select>
          </div>

          <!-- CARD RESULTADO DA ROTA CALCULADA -->
          <div id="card-resultado-rota" hidden>
            <div class="rota-resumo-card">
              <div class="rota-resumo-header">
                <h4>Trajeto Encontrado</h4>
                <span class="badge-acessivel">♿ Rota Acessível</span>
              </div>
              <div class="rota-metricas">
                <div class="metrica-item">
                  <span class="metrica-label">Distância:</span>
                  <strong id="rota-distancia">0 m</strong>
                </div>
                <div class="metrica-item">
                  <span class="metrica-label">Segmentos:</span>
                  <span id="rota-trechos">0</span>
                </div>
              </div>
              <div class="rota-dica-acessibilidade">
                ✓ Trajeto prioriza piso tátil e rampas acessíveis.
              </div>
              <button id="btn-limpar-rota-ativa" type="button" class="btn-limpar-rota">
                ✕ Limpar rota
              </button>
            </div>
          </div>
        </div>
      </div>
    `

    painelInfoConteudo.innerHTML = html

    // Fechar card
    document.querySelector('#btn-fechar-detalhe')?.addEventListener('click', () => {
      resetarPlaceholderInfo()
    })

    // Seleção de destino dispara o cálculo da rota imediatamente
    const selectDestino = document.querySelector('#select-destino')
    selectDestino?.addEventListener('change', (e) => {
      const idDestino = e.target.value
      executarCalculoRota(item.id, idDestino)
    })

    // Limpar rota ativa
    const btnLimpar = document.querySelector('#btn-limpar-rota-ativa')
    btnLimpar?.addEventListener('click', () => {
      if (svgGrafo) limparRota(svgGrafo)
      const cardRes = document.querySelector('#card-resultado-rota')
      if (cardRes) cardRes.hidden = true
      if (selectDestino) selectDestino.value = ''
    })

    if (item.posicao && mapa?.focarEm) {
      mapa.focarEm(item.posicao.x, item.posicao.y, 2.4)
    }
  }

  // ── 8. Execução do Cálculo de Rota Acessível ──────────────────────
  function executarCalculoRota(idOrigem, idDestino) {
    const cardResultadoRota = document.querySelector('#card-resultado-rota')
    const rotaDistancia = document.querySelector('#rota-distancia')
    const rotaTrechos = document.querySelector('#rota-trechos')

    if (!idOrigem || !idDestino || idOrigem === idDestino || !grafo) {
      if (svgGrafo) limparRota(svgGrafo)
      if (cardResultadoRota) cardResultadoRota.hidden = true
      return
    }

    const itemOrigem = encontrarLocalPorId(idOrigem)
    const itemDestino = encontrarLocalPorId(idDestino)

    if (!itemOrigem || !itemDestino) return

    const noOrigemId = resolverNoGrafo(itemOrigem)
    const noDestinoId = resolverNoGrafo(itemDestino)

    if (!noOrigemId || !noDestinoId) {
      alert('Não foi possível conectar os pontos à malha do mapa.')
      return
    }

    const resultado = calcularRota(grafo, noOrigemId, noDestinoId)

    if (!resultado || !resultado.caminho || resultado.caminho.length === 0) {
      if (cardResultadoRota) {
        cardResultadoRota.innerHTML = `
          <div class="rota-aviso-erro">
            <strong>Rota não encontrada</strong>
            <p>Não há conexão acessível direta entre os pontos selecionados.</p>
          </div>`
        cardResultadoRota.hidden = false
      }
      return
    }

    destacarRota(resultado.caminho, grafo, svgGrafo)

    const ESCALA_METROS = 0.15
    const metros = Math.round(resultado.distancia * ESCALA_METROS)

    if (rotaDistancia) rotaDistancia.textContent = `~${metros} metros`
    if (rotaTrechos) rotaTrechos.textContent = `${resultado.caminho.length - 1} segmentos`
    if (cardResultadoRota) cardResultadoRota.hidden = false

    // Centraliza a visão na origem do trajeto
    const noInicio = grafo[resultado.caminho[0]]?.no
    if (noInicio && mapa?.focarEm) {
      mapa.focarEm(noInicio.posicao.x, noInicio.posicao.y, 2.2)
    }
  }

  function resetarPlaceholderInfo() {
    localPartida = null
    if (svgGrafo) {
      realcarNo(svgGrafo, null, true)
      limparRota(svgGrafo)
    }
    painelInfoConteudo.innerHTML = `
      <div class="painel-info-placeholder">
        <span class="placeholder-icone">🗺️</span>
        <h4>Selecione um ponto de partida</h4>
        <p>Clique em qualquer local no mapa ou use a busca acima para ver detalhes e traçar sua rota acessível.</p>
      </div>`
  }

  // ── 9. Busca Unificada Integrada ─────────────────────────────────
  inicializarBusca(dados, mapa, {}, (item) => {
    definirPontoPartida(item, item._categoria || 'ponto')
  })

  // ── 10. Filtros de Camadas ────────────────────────────────────────
  const filtros = {
    blocos:  false, // Começa desativado por padrão
    pontos:  true,
    tateis:  true,
    rampas:  true,
    ruas:    true,
    arestas: true,
  }

  function aplicarFiltros() {
    if (svgGrafo) atualizarFiltros(svgGrafo, filtros)
  }

  document.querySelector('#filtro-blocos').addEventListener('change',  (e) => { filtros.blocos  = e.target.checked; aplicarFiltros() })
  document.querySelector('#filtro-pontos').addEventListener('change',  (e) => { filtros.pontos  = e.target.checked; aplicarFiltros() })
  document.querySelector('#filtro-tateis').addEventListener('change',  (e) => { filtros.tateis  = e.target.checked; aplicarFiltros() })
  document.querySelector('#filtro-rampas').addEventListener('change',  (e) => { filtros.rampas  = e.target.checked; aplicarFiltros() })
  document.querySelector('#filtro-ruas').addEventListener('change',    (e) => { filtros.ruas    = e.target.checked; aplicarFiltros() })
  document.querySelector('#filtro-arestas').addEventListener('change', (e) => { filtros.arestas = e.target.checked; aplicarFiltros() })
}

iniciarApp()
