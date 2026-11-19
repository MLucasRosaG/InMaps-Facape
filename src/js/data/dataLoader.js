
const ARQUIVOS_DADOS = {
  blocos: `${import.meta.env.BASE_URL}data/blocos.json`,
  pontos: `${import.meta.env.BASE_URL}data/pontos.json`,
  rampas: `${import.meta.env.BASE_URL}data/rampas.json`,
  acessos: `${import.meta.env.BASE_URL}data/acessos.json`,
  lombadas: `${import.meta.env.BASE_URL}data/lombadas.json`,
  nos: `${import.meta.env.BASE_URL}data/nos.json`,
  arestas: `${import.meta.env.BASE_URL}data/arestas.json`,
}

async function carregarArquivo(nome, caminho) {
  try {
    const resposta = await fetch(caminho)

    if (!resposta.ok) {
      throw new Error(`HTTP error ${resposta.status}`)
    }

    const conteudo = await resposta.text()

    if (!conteudo.trim()) {
      return []
    }

    const dados = JSON.parse(conteudo)

    if (!Array.isArray(dados)) {
      throw new Error('O conteudo precisa ser um array JSON.')
    }

    return dados
  } catch (erro) {
    console.error(`Falha ao carregar ${nome}:`, erro)
    throw erro
  }
}

export async function carregarDados() {
  const nomes = Object.keys(ARQUIVOS_DADOS)

  const resultados = await Promise.all(
    nomes.map((nome) =>
      carregarArquivo(nome, ARQUIVOS_DADOS[nome])
    )
  )

  return Object.fromEntries(
    nomes.map((nome, indice) => [nome, resultados[indice]])
  )
}
