# Revisão de Cibersegurança, Normas e Padrões

Seminário de Tópicos Avançados em Ciência da Computação — Arthur Oliveira Santos, Diego Pereira Maia, Gabriela Lacerda Muniz e Vinícius Goddart.

## Como apresentar

Abra `index.html` no navegador (Chrome/Edge). É preciso internet para carregar Tailwind, Lucide e as fontes.

| Tecla | Ação |
|---|---|
| `→` `↓` `Espaço` `PgDn` | Próximo slide |
| `←` `↑` `PgUp` | Slide anterior |
| `Home` / `End` | Primeiro / último slide |
| `G` | Ir para o slide (digite o número na barra inferior + Enter) |
| `N` | Notas do apresentador (tempo estimado por slide) |
| `O` | Visão geral de todos os slides |
| `F` | Tela cheia |
| `T` | Iniciar/pausar o cronômetro da questão |
| `H` | Ajuda, chance atual da surpresa e botão de teste |

- O slide atual fica salvo: ao recarregar a página você continua no mesmo slide (também dá para usar `index.html#/12`).
- As questões (oficiais do ENADE 2021, POSCOMP 2011 e Cebraspe, com gabarito oficial, mais uma bônus da equipe) têm cronômetro configurável de 15 s a 5 min.
- O tempo estimado de cada slide aparece só nas notas (`N`) e na visão geral (`O`).
- O cronômetro geral da apresentação fica na barra inferior.

## Imagem surpresa

A cada avanço de slide existe uma chance de aparecer uma imagem aleatória da pasta `images/`. A chance começa em 5%, sobe 5% a cada avanço sem imagem e volta para 5% quando a imagem aparece. "Continuar" ou "Voltar" (ou qualquer seta) levam ao slide que estava na fila.

Para usar suas imagens:

1. Coloque os arquivos (`.png`, `.jpg`, `.gif`, `.webp`, `.svg`) em `images/`.
2. Rode no PowerShell, na raiz do projeto: `.\images\atualizar-manifest.ps1`
3. Recarregue a página.

O navegador não consegue listar uma pasta sozinho, por isso o script gera o `images/manifest.js` com a lista de arquivos.

## Estrutura

- `index.html` — os 39 slides e as notas do apresentador (`<aside class="notes" data-min="…">`)
- `assets/app.js` — navegação, persistência, notas, visão geral, cronômetro e surpresa
- `assets/interactive.js` — widgets (abas, mini-jogos, simulador Zero Trust, demo de prompt injection, calculadora de Mosca, questões, Mesa de Crise)
- `assets/style.css` — tema visual

## Roteiro

`docs/Roteiro-Apresentacao.pdf` traz as falas e interações de cada integrante, slide a slide. Para regerar depois de editar `docs/roteiro.html`:

```
msedge --headless --no-pdf-header-footer --print-to-pdf=docs/Roteiro-Apresentacao.pdf docs/roteiro.html
```
