import { abrirInformacoes } from '../map/markerRenderer.js'

const CATEGORIAS = {
  blocos: 'Bloco',
  pontos: 'Ponto de interesse',
  rampas: 'Rampa',
  acessos: 'Acesso',
  lombadas: 'Lombada',
}

export function inicializarBusca(dados, mapa) {
  const campoBusca = document.querySelector('#campo-busca')
  const resultados = document.querySelector('#resultados-busca')

  if (!campoBusca || !resultados || !mapa) {
    console.error('InMaps: elementos da busca ou motor do mapa não encontrados.')
    return
  }

  function pesquisar(termo) {
    resultados.replaceChildren()

    if (!termo.trim()) {
      resultados.hidden = true
      return
    }

    const consulta = termo.trim().toLocaleLowerCase('pt-BR')
    const encontrados = []

    Object.entries(CATEGORIAS).forEach(([categoria, descricao]) => {
      const itens = dados?.[categoria]

      if (!Array.isArray(itens)) return

      itens.forEach((item) => {
        const texto = [
          item.nome,
          item.descricao,
          item.tipo,
          descricao,
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('pt-BR')

        if (texto.includes(consulta)) {
          encontrados.push({
            item,
            categoria,
            descricao,
          })
        }
      })
    })

    if (encontrados.length === 0) {
      const mensagem = document.createElement('p')
      mensagem.textContent = 'Nenhum local encontrado.'
      mensagem.className = 'resultado-vazio'
      resultados.appendChild(mensagem)
      resultados.hidden = false
      return
    }

    encontrados.forEach(({ item, categoria, descricao }) => {
      const botao = document.createElement('button')
      botao.type = 'button'
      botao.className = 'resultado-busca'

      const nome = document.createElement('strong')
      nome.textContent = item.nome || descricao

      const tipo = document.createElement('span')
      tipo.textContent = descricao

      botao.append(nome, tipo)

      botao.addEventListener('click', () => {
        if (!item.posicao) return

        mapa.focarEm(item.posicao.x, item.posicao.y)
        abrirInformacoes(item, categoria)

        resultados.hidden = true
        campoBusca.value = item.nome || ''
      })

      resultados.appendChild(botao)
    })

    resultados.hidden = false
  }

  campoBusca.addEventListener('input', () => {
    pesquisar(campoBusca.value)
  })

  campoBusca.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      resultados.hidden = true
      campoBusca.blur()
    }
  })

  document.addEventListener('click', (evento) => {
    if (
      !campoBusca.contains(evento.target) &&
      !resultados.contains(evento.target)
    ) {
      resultados.hidden = true
    }
  })
}
