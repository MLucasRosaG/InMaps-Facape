/**
 * searchEngine.js — InMaps FACAPE
 * Busca unificada por:
 * - Blocos (ex: Bloco de Direito, Bloco Computação, Biblioteca...)
 * - Pontos de Interesse (ex: Banheiro Acessível, CAD, NTI, Hall de Entrada, Santander...)
 * - Rampas de acessibilidade
 * - Nós do mapa
 */

/**
 * @param {Object} dados — { blocos, pontos, rampas, nos, nosTateis, ... }
 * @param {Object} mapa  — retorno de inicializarMapa()
 * @param {Object} rotaCallbacks — { onSelecionarOrigem(item), onSelecionarDestino(item) }
 * @param {Function} onFocarItem — callback(item) chamado ao clicar num resultado
 */
export function inicializarBusca(dados, mapa, rotaCallbacks = {}, onFocarItem = null) {
  const campoBusca = document.querySelector('#campo-busca')
  const resultados = document.querySelector('#resultados-busca')

  if (!campoBusca || !resultados) {
    console.error('InMaps: elementos da busca não encontrados.')
    return
  }

  // Monta lista de pesquisa com prioridades
  const fontes = [
    ...(dados.blocos ?? []).map((b) => ({
      ...b,
      _tipo: 'Bloco',
      _categoria: 'bloco',
      _icone: '🏢',
      _prioridade: 1,
    })),
    ...(dados.pontos ?? []).map((p) => ({
      ...p,
      _tipo: p.tipo ? `Ponto (${p.tipo})` : 'Ponto de Interesse',
      _categoria: 'ponto',
      _icone: (p.nome || '').toLowerCase().includes('acessivel') || (p.nome || '').toLowerCase().includes('acessível')
        ? '♿'
        : p.tipo === 'banheiro'
        ? '🚻'
        : p.tipo === 'laboratorio'
        ? '💻'
        : p.tipo === 'auditorio'
        ? '📢'
        : p.tipo === 'entrada'
        ? '🚪'
        : '📍',
      _prioridade: 2,
    })),
    ...(dados.rampas ?? []).map((r) => ({
      ...r,
      _tipo: 'Rampa Acessível',
      _categoria: 'rampa',
      _icone: '♿',
      _prioridade: 3,
    })),
  ]

  function normalizar(texto) {
    return (texto || '')
      .trim()
      .toLocaleLowerCase('pt-BR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }

  function pesquisar(termo) {
    resultados.replaceChildren()

    const consulta = normalizar(termo)
    if (!consulta) {
      resultados.hidden = true
      return
    }

    const encontrados = fontes
      .filter((item) => {
        const textoBusca = normalizar(
          [item.nome, item.descricao, item.tipo, item.id, item.observacao, item._tipo].join(' ')
        )
        return textoBusca.includes(consulta)
      })
      .sort((a, b) => a._prioridade - b._prioridade)

    if (encontrados.length === 0) {
      const p = document.createElement('p')
      p.className = 'resultado-vazio'
      p.textContent = 'Nenhum local ou bloco encontrado.'
      resultados.appendChild(p)
      resultados.hidden = false
      return
    }

    for (const item of encontrados.slice(0, 18)) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'resultado-busca'

      const icone = document.createElement('span')
      icone.className = 'resultado-icone'
      icone.textContent = item._icone || '📍'

      const info = document.createElement('div')
      info.className = 'resultado-info'

      const nome = document.createElement('strong')
      nome.textContent = item.nome || item.id

      const tipo = document.createElement('span')
      tipo.className = 'resultado-tipo'
      tipo.textContent = item._tipo

      info.append(nome, tipo)
      btn.append(icone, info)

      btn.addEventListener('click', () => {
        if (item.posicao && mapa?.focarEm) {
          mapa.focarEm(item.posicao.x, item.posicao.y, 2.5)
        }

        if (typeof onFocarItem === 'function') {
          onFocarItem(item)
        }

        campoBusca.value = item.nome || item.id
        resultados.hidden = true
        campoBusca.blur()
      })

      resultados.appendChild(btn)
    }

    resultados.hidden = false
  }

  campoBusca.addEventListener('input', () => pesquisar(campoBusca.value))

  campoBusca.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      resultados.hidden = true
      campoBusca.blur()
    }
  })

  document.addEventListener('click', (ev) => {
    if (!campoBusca.contains(ev.target) && !resultados.contains(ev.target)) {
      resultados.hidden = true
    }
  })

  return {
    limpar() {
      campoBusca.value = ''
      resultados.hidden = true
      resultados.replaceChildren()
    },
  }
}
