import './style.css'
import { inicializarMapa } from './js/map/mapEngine.js'
import { carregarDados } from './js/data/dataLoader.js'
import { renderizarMarcadores } from './js/map/markerRenderer.js'
import { inicializarBusca } from './js/search/searchEngine.js'

async function iniciarAplicacao() {
  const app = document.querySelector('#app')

  if (!app) {
    console.error('Elemento #app não encontrado no index.html.')
    return
  }

  app.innerHTML = `
    <main>
      <header class="cabecalho cabecalho-layout">
        <div class="cabecalho-texto">
          <h1>InMaps – FACAPE</h1>
          <p>Mapa de acessibilidade do campus</p>
        </div>

        <div id="busca-container">
          <input
            id="campo-busca"
            type="search"
            placeholder="Buscar blocos, rampas, locais..."
            aria-label="Buscar locais no mapa"
            autocomplete="off"
          />
          <div id="resultados-busca" hidden></div>
        </div>
      </header>

      <section id="mapa-container">

        <div id="mapa-controles">
          <button id="zoom-in" type="button" aria-label="Aumentar zoom">+</button>
          <button id="zoom-out" type="button" aria-label="Diminuir zoom">-</button>
          <button id="zoom-reset" type="button" aria-label="Redefinir mapa">Redefinir</button>
        </div>

        <div id="mapa-viewport">
          <div id="mapa-camada">
            <img
              id="mapa-imagem"
              src="${import.meta.env.BASE_URL}images/Mapa_Facape.jpg"
              alt="Mapa do campus da FACAPE"
            />
          </div>
        </div>
      </section>
    </main>
  `

  let dados = null

  try {
    dados = await carregarDados()
    console.log('Dados do InMaps carregados:', dados)
  } catch (erro) {
    console.error('Não foi possível carregar os dados do InMaps:', erro)
  }

  const mapa = inicializarMapa()

  if (dados) {
    renderizarMarcadores(dados)

    if (mapa) {
      inicializarBusca(dados, mapa)
    }
  }
}

iniciarAplicacao()
