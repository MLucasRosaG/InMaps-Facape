#  Mapa de Acessibilidade FACAPE — InMap

> Mapa web interativo e responsivo do campus da Faculdade de Petrolina (FACAPE) focado em acessibilidade e navegação inclusiva: visualização por blocos, pontos de interesse, rampas, lombadas, pisos táteis e acessos adaptados em 2D.

**Projeto da disciplina de Inovação Tecnológica** · Docente: Luirys Silva · Faculdade de Petrolina – FACAPE · 2026

🔗 **Demo online:** `https://<usuario>.github.io/mapa-acessibilidade-facape/`  
📋 **Quadro de tarefas:** `https://trello.com/b/hQ6sRSu3/mapa-de-acessibilidade-facape`  
🎨 **Protótipo no Figma:** `https://www.figma.com/proto/GrZwTTHMKzWwQ7kTsa0U1D/Prot%C3%B3tipo-InMaps`

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

##  Sobre o projeto

O campus da FACAPE possui diversos blocos e instalações espalhadas. Para pessoas com mobilidade reduzida, deficiência física, idosos ou visitantes iniciantes, identificar onde ficam as rampas, quais caminhos possuem lombadas/piso irregular e qual é a rota acessível até cada bloco é um desafio diário.

O **InMap** resolve essa dor com um **mapa web 2D vetorizado, ultra leve, moderno e responsivo**, focado em dispositivos móveis. A plataforma exibe o campus organizado por blocos e destaca nativamente as rotas e elementos de acessibilidade.

> **Diretriz do MVP:** A solução é 100% estática (Mobile-First, Client-side). Não necessita de servidores nem de bases de dados nesta etapa. Todos os metadados e marcadores são gerenciados via ficheiros JSON versionados no repositório. A gestão dinâmica via painel administrativo e backend está prevista para a Fase 2.

---

##  Objetivos

**Objetivo geral:** Facilitar a micro-navegação e garantir acessibilidade espacial inclusiva dentro do campus da FACAPE.

**Objetivos específicos:**
- Representar o campus em um mapa 2D vetorizado e divido por blocos.
- Destacar marcadores de acessibilidade (rampas, lombadas, piso tátil, portões adaptados e banheiros acessíveis).
- Permitir a seleção e filtragem interativa de pontos de interesse por categoria.
- Oferecer uma interface de alta performance e carregamento instantâneo em qualquer smartphone (incluindo modelos de entrada).
- Entregar um MVP funcional, validado e com custo zero de infraestrutura até ao final do semestre.

---

##  Funcionalidades do MVP

| Funcionalidade | Descrição | Status |
|---|---|---|
| **Mapa por blocos** | Visualização vetorizada 2D do campus com blocos interativos | 🔲 A fazer |
| **Pontos de interesse** | Exibição de detalhes ao selecionar qualquer bloco ou ponto | 🔲 A fazer |
| **Destaque de acessibilidade** | Ícones e sinalizações visuais exclusivas para rampas, acessos e lombadas | 🔲 A fazer |
| **Filtros dinâmicos** | Exibir ou ocultar categorias específicas (ex.: *Apenas Rampas*) | 🔲 A fazer |
| **Layout Responsivo** | Interface adaptada primariamente para telas de smartphones | 🔲 A fazer |

> *Legenda de status: 🔲 A fazer · 🚧 Em andamento · ✅ Concluído*

### ⛔ Fora do escopo do MVP
Servidores/API backend, bases de dados relacionais, painel administrativo dinâmico e suporte a múltiplos complexos. Todos mapeados no [Roadmap](#-roadmap).

---

## 🛠️ Stack tecnológica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| **Frontend Base** | **HTML5, CSS3, JavaScript (ES6+)** | Estruturação semântica, estilos leves e lógica leve de manipulação do DOM e marcadores |
| **Build & Dev** | **Vite** | Servidor de desenvolvimento ultrarrápido e otimização automatizada para produção |
| **Renderização Visual** | **SVG / Canvas 2D Interativo** | Visualização leve e vetorizada do mapa sem sobrecarregar o hardware do celular |
| **Dados** | **JSON Local Versionado** | Ficheiros de dados locais imitando a resposta de uma API REST para fácil transição futura |
| **Hospedagem** | **GitHub Pages** | Alojamento estático público, gratuito e com integração contínua (CI/CD) |
| **Gestão do Projeto** | **Trello / ClickUp** | Acompanhamento de sprints e quadro Kanban de tarefas |

###  Por que esta stack?
- **Desempenho e Leveza (Mobile-First):** O mapa 2D é processado instantaneamente sem o consumo elevado de memória/GPU exigido por bibliotecas 3D (Web-GL/Three.js), garantindo uso fluído em qualquer telemóvel.
- **Foco no Core Feature:** Resolve a dor real do utilizador (localizar rampas e caminhos acessíveis) sem perder tempo com configurações de backend nesta fase de validação.
- **Zero Custos:** Arquivos estáticos alojados gratuitamente no GitHub Pages sem manutenção de infraestrutura.
- **Apoio da IA:** A ilustração vetorizada e o esquema gráfico do mapa da FACAPE são vetorizados e refinados com ferramentas de IA generativa para um acabamento visual moderno.

---

## 📁 Estrutura de pastas

```
mapa-acessibilidade-facape/
├── index.html                 # Ponto de entrada HTML da aplicação
├── package.json               # Scripts e dependências do projeto
├── vite.config.js             # Configuração do Vite (com 'base' para o GitHub Pages)
├── .gitignore                 # Arquivos ignorados pelo Git (node_modules, dist)
├── README.md                  # Documentação do repositório
│
├── public/                    # Ficheiros estáticos servidos diretamente
│   ├── data/                  # Base de dados em JSON
│   │   ├── blocos.json        # Mapeamento dos blocos do campus
│   │   ├── pontos.json        # Pontos de interesse gerais
│   │   ├── rampas.json        # Localização de rampas de acesso
│   │   ├── lombadas.json      # Lombadas e obstáculos do solo
│   │   └── acessos.json       # Portões e entradas adaptadas
│   ├── icons/                 # Marcadores e ícones da interface (SVG/PNG)
│   └── images/                # Imagens e mapa vetorizado de base 2D
│
├── src/                       # Código-fonte da aplicação
│   ├── main.js                # Ficheiro principal de inicialização
│   ├── css/
│   │   └── style.css          # Estilos gerais e responsividade
│   └── js/
│       ├── map/               # Lógica de renderização 2D, marcadores e zoom/pan
│       ├── data/              # Funções de carregamento (fetch) dos ficheiros JSON
│       └── ui/                # Controladores do painel lateral, filtros e legenda
│
└── docs/                      # Documentação técnica e académica
├── relatorio-stack.pdf    # Relatório formal da disciplina
└── prototipo/             # Exportações do protótipo do Figma
```

---

##  Modelo de dados (JSON)

Os ficheiros JSON funcionam como a fonte única de verdade (*Single Source of Truth*). A sua estrutura modular permite que os membros editem ou adicionem dados sem gerar conflitos de código.

**Exemplo: `public/data/rampas.json`**
```
json
[
  {
    "id": "rampa-01",
    "nome": "Rampa do Bloco 11",
    "blocoId": "bloco-11",
    "posicao": { "x": 120, "y": 340 },
    "observacao": "Possui corrimão e piso antiderrapante"
  }
]
```
---

##  Como rodar localmente

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

##  Publicação (GitHub Pages)

1. No `vite.config.js`, defina o `base` com o nome do repositório:

   ```js
   export default {
     base: '/mapa-acessibilidade-facape/',
   }
   ```

2. Gere o build com `npm run build`.
3. Publique a pasta `dist/` (manualmente na branch `gh-pages` ou por GitHub Actions usando o `deploy.yml`).
4. Em **Settings → Pages**, selecione a fonte de publicação e copie o link gerado para o topo deste README.

---

##  Divisão de responsabilidades

| Módulo | Responsável | Entrega |
|---|---|---|
| Frontend e mapa | Luiz Eduardo Fernandes Cruz | Estrutura HTML/CSS/JS, renderização 2D, marcadores interativos e destaques de rotas |
| Visualização do Mapa | Márcio Lucas Rosa Gonçalves | Geração do Mapa 2D via IA, gestão do repositório no GitHub, automação de deploy e tarefas |
| Dados | Vinícius Silva dos Santos | Modelagem e preenchimento dos ficheiros JSON (blocos, rampas, acessos) |
| Repositório, publicação e tarefas | Márcio Lucas Rosa Gonçalves | Repositório GitHub, publicação no GitHub Pages e quadro Trello |
| Testes de usabilidade | Luan Regis Monteiro | Condução e registo de testes de interface com estudantes no campus da FACAPE |
| Interface visual | Kelvin Keiti Souza Fukagawa | Garantir a fidelidade da interface com o protótipo do Figma e alinhamento do design |

---

##  Fluxo de trabalho da equipe

1. **Cada tarefa vira um card** no Trello, com responsável definido.
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

---

##  Roadmap

### ✅ MVP (este semestre)

[ ] Configuração do ambiente Vite e repositório.

[ ] Implementação do mapa 2D responsivo do campus da FACAPE.

[ ] Renderização dos marcadores de rampas, acessos, lombadas e blocos via JSON.

[ ] Filtros interativos de visibilidade das categorias.

[ ] Testes de usabilidade no campus com utilizadores reais.

[ ] Publicação e homologação no GitHub Pages.

###  Fase 2 (futuro)

[ ] Desenvolvimento de API Backend em Node.js.

[ ] Migração dos JSONs para uma base de dados relacional.

[ ] Painel Administrativo B2B para atualização dinâmica de pontos e rotas pelas instituições.

[ ] Algoritmo dinâmico de Pathfinding (cálculo da menor rota totalmente acessível).

[ ] Suporte a múltiplos campi e novos clientes B2B no Vale do São Francisco.

---

## 🧑‍💻 Equipe

| Nome | Função |
|---|---|
| Márcio Lucas Rosa Gonçalves | ( Desenvolvedor / IA & Arquitetura )
| Luiz Eduardo Fernandes Cruz | ( Líder / Frontend )
| Vinícius Silva dos Santos | ( Estrutura de Dados )
| Luan Regis Monteiro | ( Operações / Testes )
| Kelvin Keiti Souza Fukagawa | ( Relações / UI & Apresentação )

---

<sub>Projeto acadêmico desenvolvido para a disciplina de Inovação Tecnológica · FACAPE · 2026</sub>
