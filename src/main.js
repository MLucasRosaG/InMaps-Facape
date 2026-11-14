import './style.css'

// Ponto de entrada da aplicação InMaps - FACAPE.
// Organização prevista (ainda sem implementação):
//   src/js/data/  -> carregamento e tratamento dos dados JSON
//   src/js/map/   -> motor do mapa (mapEngine.js)
//   src/js/ui/    -> componentes de interface

function iniciarAplicacao() {
  const app = document.querySelector('#app')

  if (!app) {
    console.error('Elemento #app não encontrado no index.html.')
    return
  }

  // As próximas etapas serão iniciadas a partir daqui.
}

iniciarAplicacao()