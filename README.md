#  Mapa de Acessibilidade FACAPE

> Mapa web interativo do campus da Faculdade de Petrolina (FACAPE) com foco em acessibilidade: blocos, pontos de interesse, rampas, lombadas e acessos, em 2D e 3D.

**Projeto da disciplina de Inovação Tecnológica** · Docente: Luirys Silva · Faculdade de Petrolina – FACAPE · 2026

🔗 **Demo online:** ``
📋 **Quadro de tarefas:** `-https://trello.com/b/hQ6sRSu3/mapa-de-acessibilidade-facape`
🎨 **Protótipo no Figma:** `(https://www.figma.com/proto/GrZwTTHMKzWwQ7kTsa0U1D/Prot%C3%B3tipo-InMaps?node-id=12-236&p=f&t=wa9u2qsxNiOoaeFE-1&scaling=scale-down&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=48%3A111)`

---

## 📌 Sumário

1. [Sobre o projeto](#-sobre-o-projeto)
2. [Objetivos](#-objetivos)
3. [Funcionalidades do MVP](#-funcionalidades-do-mvp)
4. [Stack tecnológica](#-stack-tecnológica)
5. [Estrutura de pastas](#-estrutura-de-pastas)
6. [Modelo de dados (JSON)](#-modelo-de-dados-json)
7. [Como rodar localmente](#-como-rodar-localmente)
8. [Publicação (GitHub Pages)](#-publicação-github-pages)
9. [Divisão de responsabilidades](#-divisão-de-responsabilidades)
10. [Fluxo de trabalho da equipe](#-fluxo-de-trabalho-da-equipe)
11. [Roadmap](#-roadmap)
12. [Equipe](#-equipe)

---

## 📖 Sobre o projeto

O campus da FACAPE tem vários blocos, e quem tem mobilidade reduzida ou está no campus pela primeira vez muitas vezes não sabe onde ficam as rampas, quais caminhos têm lombadas ou piso irregular e por onde é possível chegar a cada bloco.

Este projeto resolve essa dor com um **mapa web simples, bonito e acessível pelo celular**, que mostra o campus dividido em blocos e destaca os elementos de acessibilidade.

O MVP é **100% estático**: não tem servidor nem banco de dados. Todos os dados ficam em arquivos JSON dentro do repositório. A gestão dinâmica (cadastrar pontos e rotas por um painel) está planejada para a Fase 2.

## 🎯 Objetivos

**Objetivo geral:** facilitar a navegação e a acessibilidade dentro do campus da FACAPE.

**Objetivos específicos:**

- Representar o campus dividido em blocos, com identificação clara de cada um.
- Marcar pontos de acesso, rampas, lombadas e outros elementos relevantes de acessibilidade.
- Exibir detalhes de cada ponto ao selecionar no mapa.
- Oferecer uma visualização 3D do campus, gerada ou refinada com apoio de IA.
- Entregar um MVP funcional até o final do semestre, com arquitetura simples e pronta para evoluir.

## ✅ Funcionalidades do MVP

| Funcionalidade | Descrição | Status |
|---|---|---|
| Mapa por blocos | Campus dividido em blocos selecionáveis | 🔲 A fazer |
| Pontos de interesse | Ao clicar, exibe nome, descrição e tipo do ponto | 🔲 A fazer |
| Destaque de acessibilidade | Rampas, lombadas e acessos com ícones e cores próprios | 🔲 A fazer |
| Filtros | Mostrar ou ocultar categorias (ex.: só rampas) | 🔲 A fazer |
| Visualização 3D | Modelo 3D do campus navegável no navegador | 🔲 A fazer |
| Layout responsivo | Funciona bem no celular e no computador | 🔲 A fazer |

> Atualize a coluna *Status* conforme o projeto avançar (🔲 A fazer · 🚧 Em andamento · ✅ Concluído).

### Fora do escopo do MVP

Backend/API, banco de dados, painel administrativo, cadastro dinâmico de rotas e suporte a outras instituições. Tudo isso está no [Roadmap](#-roadmap).

## 🛠️ Stack tecnológica

| Camada | Tecnologia | Para que serve |
|---|---|---|
| Frontend | **HTML5, CSS3 e JavaScript** | Estrutura, estilo e lógica do mapa |
| Build/dev | **Vite** | Servidor local rápido e build otimizado para publicação |
| 3D | **Three.js** | Exibir o modelo 3D do campus no navegador |
| Estilo (opcional) | **Tailwind CSS** | Agilizar a estilização |
| Backend | *Não aplicável ao MVP* | Previsto para a Fase 2 |
| Base de dados | *Não aplicável ao MVP* | Dados em JSON versionado no repositório |
| Hospedagem | **GitHub Pages** | Link público e gratuito (Netlify/Vercel são alternativas) |
| Gestão de tarefas | **Trello / ClickUp** | Acompanhamento das tarefas de desenvolvimento |

**Papel da IA:** o modelo 3D do campus é gerado ou refinado com uma ferramenta de IA, exportado em formato **glTF/GLB** e exibido pelo Three.js. A IA é apoio visual e reforça o caráter inovador do projeto, mas a lógica do mapa não depende dela.

### Por que essa stack?

- **Simplicidade e velocidade:** curva de aprendizagem rápida e resultado imediato no navegador.
- **Foco no core feature:** o que resolve a dor do usuário é visualizar blocos, rampas e acessos. Servidor e banco consumiriam tempo sem agregar a isso.
- **Custo zero:** arquivos estáticos são hospedados gratuitamente, sem manutenção de servidor.
- **Evolução facilitada:** os dados em JSON podem ser reaproveitados quase sem mudança quando houver um backend.

## 📁 Estrutura de pastas

```
mapa-acessibilidade-facape/
├── index.html                 # Página principal (ponto de entrada do Vite)
├── package.json               # Dependências e scripts do projeto
├── vite.config.js             # Configuração do Vite (inclui o base do GitHub Pages)
├── .gitignore                 # Arquivos ignorados pelo Git (node_modules, dist...)
├── README.md                  # Este arquivo
│
├── public/                    # Arquivos estáticos servidos como estão
│   ├── data/                  # 📊 Dados do mapa em JSON
│   │   ├── blocos.json        #    Blocos do campus
│   │   ├── pontos.json        #    Pontos de interesse
│   │   ├── rampas.json        #    Rampas
│   │   ├── lombadas.json      #    Lombadas e obstáculos de piso
│   │   ├── acessos.json       #    Portões, entradas e acessos
│   │   └── rotas.json         #    Rotas acessíveis
│   ├── models/                # 🧊 Modelos 3D (.glb / .gltf)
│   │   └── campus.glb
│   └── icons/                 # Ícones dos marcadores (SVG/PNG)
│
├── src/                       # 💻 Código-fonte da aplicação
│   ├── main.js                # Inicialização da aplicação
│   ├── css/                   # Estilos
│   │   └── style.css
│   ├── js/
│   │   ├── map/               # Lógica do mapa 2D (blocos, marcadores, seleção)
│   │   ├── three/             # Cena 3D (câmera, luzes, carregamento do modelo)
│   │   ├── data/              # Funções que carregam e tratam os JSON
│   │   └── ui/                # Componentes de interface (painel de detalhes, filtros)
│   └── assets/                # Imagens usadas na interface
│
├── docs/                      # 📚 Documentação do projeto
│   ├── relatorio-stack.pdf    # Relatório técnico entregue na disciplina
│   ├── prototipo/             # Capturas do Figma
│   └── referencias/           # Mapas, plantas e fotos de referência do campus
│
└── .github/
    └── workflows/
        └── deploy.yml         # (opcional) Publicação automática no GitHub Pages
```

### O que cada pasta faz

| Pasta | Responsabilidade |
|---|---|
| `public/data/` | Fonte única de verdade dos dados. Para adicionar uma rampa ou ponto, basta editar o JSON correspondente, sem mexer no código. |
| `public/models/` | Guarda o modelo 3D do campus exportado em GLB/glTF. |
| `public/icons/` | Ícones usados nos marcadores de cada tipo de ponto. |
| `src/js/map/` | Renderização do mapa em blocos, clique, seleção e destaque. |
| `src/js/three/` | Tudo que é 3D: cena, câmera, controles e carregamento do modelo. |
| `src/js/data/` | Leitura dos JSON e conversão para o formato usado pela interface. |
| `src/js/ui/` | Painel de detalhes, filtros, legenda e menus. |
| `docs/` | Relatório, protótipo e materiais de referência. |

## 🧩 Modelo de dados (JSON)

Cada categoria tem um arquivo próprio, o que permite que qualquer membro edite os dados sem conflito. O histórico de mudanças fica registrado pelo Git.

**Exemplo: `public/data/blocos.json`**

```json
[
  {
    "id": "bloco-11",
    "nome": "Bloco 11",
    "descricao": "Descrição do bloco",
    "posicao": { "x": 120, "y": 340 },
    "acessivel": true
  }
]
```

**Exemplo: `public/data/rampas.json`**

```json
[
  {
    "id": "rampa-01",
    "nome": "Rampa de acesso ao Bloco 11",
    "blocoId": "bloco-11",
    "posicao": { "x": 118, "y": 352 },
    "observacao": "Piso antiderrapante"
  }
]
```

> Os campos acima são um ponto de partida.

## 🚀 Como rodar localmente

**Pré-requisitos:** [Node.js](https://nodejs.org/) (versão LTS) e [Git](https://git-scm.com/).

```bash
# 1. Clonar o repositório
git clone https://github.com/<usuario>/mapa-acessibilidade-facape.git
cd mapa-acessibilidade-facape

# 2. Instalar as dependências
npm install

# 3. Iniciar o servidor de desenvolvimento
npm run dev
```

O Vite mostra no terminal o endereço local (normalmente `http://localhost:5173`).

**Outros comandos:**

```bash
npm run build     # Gera a versão final na pasta dist/
npm run preview   # Testa a versão final localmente
```

## 🌐 Publicação (GitHub Pages)

1. No `vite.config.js`, defina o `base` com o nome do repositório:

   ```js
   export default {
     base: '/mapa-acessibilidade-facape/',
   }
   ```

2. Gere o build com `npm run build`.
3. Publique a pasta `dist/` (manualmente na branch `gh-pages` ou por GitHub Actions usando o `deploy.yml`).
4. Em **Settings → Pages**, selecione a fonte de publicação e copie o link gerado para o topo deste README.

## 👥 Divisão de responsabilidades

| Módulo | Responsável | Entrega |
|---|---|---|
| Frontend e mapa | Luiz Eduardo Fernandes Cruz | Estrutura HTML/CSS/JS, mapa do campus, marcação de pontos de interesse e destaque de rampas e acessos |
| Visualização 3D | Márcio Lucas Rosa Gonçalves | Geração do modelo com IA e integração com Three.js |
| Dados | Vinícius Silva dos Santos | Arquivos JSON de blocos, pontos de interesse, rampas, acessos e rotas |
| Repositório, publicação e tarefas | Márcio Lucas Rosa Gonçalves | Repositório GitHub, publicação no GitHub Pages e quadro Trello/ClickUp |
| Testes de usabilidade | Luan Regis Monteiro | Testes do mapa com estudantes e registro de ajustes |
| Interface visual | Kelvin Keiti Souza Fukagawa | Validação do layout e da identidade visual conforme o protótipo |

**Quem mexe em quê no código:**

| Área do repositório | Principal responsável |
|---|---|
| `src/js/map/`, `src/js/ui/`, `src/css/`, `index.html` | Luiz Eduardo (com validação visual do Kelvin) |
| `src/js/three/`, `public/models/` | Márcio |
| `public/data/`, `src/js/data/` | Vinícius |
| `docs/`, testes e relatórios de ajustes | Luan |

## 🔄 Fluxo de trabalho da equipe

1. **Cada tarefa vira um card** no Trello/ClickUp, com responsável definido.
2. **Branch por tarefa**, a partir da `main`:

   ```bash
   git checkout -b feature/nome-da-tarefa
   ```

3. **Commits pequenos e descritivos**, por exemplo:
   - `feat: adiciona marcadores de rampas no mapa`
   - `fix: corrige posição do Bloco 11`
   - `data: adiciona lombadas da praça central`
   - `docs: atualiza README`
4. **Pull Request** para a `main`, com pelo menos um colega revisando.
5. **Não commitar direto na `main`** e não subir `node_modules/` nem `dist/`.

## 🛣️ Roadmap

### ✅ MVP (este semestre)

- [ ] Estrutura do projeto com Vite
- [ ] Mapa do campus dividido em blocos
- [ ] Pontos de interesse, rampas, lombadas e acessos
- [ ] Filtros por categoria
- [ ] Modelo 3D com Three.js
- [ ] Layout responsivo para celular
- [ ] Testes de usabilidade com estudantes
- [ ] Publicação no GitHub Pages

### 🔮 Fase 2 (futuro)

- [ ] Backend e API (por exemplo, Node.js)
- [ ] Banco de dados no lugar dos arquivos JSON
- [ ] Painel para cadastrar e atualizar pontos e rotas dinamicamente
- [ ] Cálculo automático de rotas acessíveis
- [ ] Suporte a outras instituições
- [ ] Refinamento do modelo 3D

## 🧑‍💻 Equipe

| Nome | Função |
|---|---|
| Márcio Lucas Rosa Gonçalves | Visualização 3D · Repositório, publicação e tarefas |
| Luiz Eduardo Fernandes Cruz | Frontend e mapa |
| Vinícius Silva dos Santos | Dados |
| Luan Regis Monteiro | Testes de usabilidade |
| Kelvin Keiti Souza Fukagawa | Interface visual |

---

<sub>Projeto acadêmico desenvolvido para a disciplina de Inovação Tecnológica · FACAPE · 2026</sub>
