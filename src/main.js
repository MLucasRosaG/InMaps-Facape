import './style.css'
import { inicializarMapa } from './js/map/mapEngine.js'

function iniciarAplicacao() {
  const app = document.querySelector('#app')

  if (!app) {
    console.error('Elemento #app não encontrado no index.html.')
    return
  }

  app.innerHTML = `
    <main>
      <header class="cabecalho">
        <h1>InMaps – FACAPE</h1>
        <p>Mapa de acessibilidade do campus</p>
      </header>

      <section id="mapa-container">
        <div id="mapa-controles">
          <button id="zoom-in" type="button" aria-label="Aumentar zoom">+</button>
          <button id="zoom-out" type="button" aria-label="Diminuir zoom">-</button>
          <button id="zoom-reset" type="button" aria-label="Redefinir mapa">Redefinir</button>
        </div>

        <div id="mapa-viewport">
          <img
            id="mapa-imagem"
            src="/images/Mapa_Facape.jpg"
            alt="Mapa do campus da FACAPE"
          />
        </div>
      </section>
    </main>
  `

  inicializarMapa()
}

iniciarAplicacao()
