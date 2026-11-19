/**
 * dataLoader.js — InMaps FACAPE
 * Carrega os 6 arquivos de dados do grafo de acessibilidade.
 */

const BASE = import.meta.env.BASE_URL

const ARQUIVOS = {
  nos:           `${BASE}data/nos.json`,
  arestas:       `${BASE}data/arestas.json`,
  nosTateis:     `${BASE}data/nosTateis.json`,
  arestasTateis: `${BASE}data/arestasTateis.json`,
  rampas:        `${BASE}data/rampas.json`,
  ruas:          `${BASE}data/ruas.json`,
  blocos:        `${BASE}data/blocos.json`,
  pontos:        `${BASE}data/pontos.json`,
}

async function carregarArquivo(nome, caminho) {
  try {
    const resposta = await fetch(caminho)

    if (!resposta.ok) {
      throw new Error(`HTTP ${resposta.status} ao buscar ${caminho}`)
    }

    const texto = await resposta.text()

    if (!texto.trim()) {
      console.warn(`InMaps: arquivo vazio — ${nome}`)
      return []
    }

    const dados = JSON.parse(texto)

    if (!Array.isArray(dados)) {
      throw new Error(`${nome}: conteúdo não é um array JSON`)
    }

    return dados
  } catch (erro) {
    console.error(`InMaps: falha ao carregar "${nome}":`, erro)
    return [] // retorna vazio para não bloquear a inicialização
  }
}

/**
 * Carrega todos os arquivos de dados em paralelo.
 * @returns {Promise<{nos, arestas, nosTateis, arestasTateis, rampas, ruas}>}
 */
export async function carregarDados() {
  const nomes = Object.keys(ARQUIVOS)

  const resultados = await Promise.all(
    nomes.map((nome) => carregarArquivo(nome, ARQUIVOS[nome]))
  )

  const dados = Object.fromEntries(
    nomes.map((nome, i) => [nome, resultados[i]])
  )

  console.info(
    `InMaps: dados carregados — ` +
    `${dados.nos.length} nós, ${dados.arestas.length} arestas, ` +
    `${dados.nosTateis.length} nós táteis, ${dados.arestasTateis.length} arestas táteis, ` +
    `${dados.rampas.length} rampas, ${dados.ruas.length} ruas`
  )

  return dados
}
