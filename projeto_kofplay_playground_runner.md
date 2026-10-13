# Projeto KofPlay: KofScript Playground & Runner — Ambiente de Ensino Gamificado (estilo Codecademy/LeetCode)

## 1. A Ideia

Uma plataforma web interativa onde qualquer pessoa aprende **a própria linguagem Kof**
ou resolve desafios de lógica direto no navegador, com **execução real e isolada
do código no backend** (via o compilador Kof de verdade, não um mock).

Por que combina com Kof: o Kof visa a experiência humana e código limpo. Uma plataforma
que ensina a sua filosofia (*menos cerimônia, mais intenção*) tem tudo a ver com a
comunidade — e o backend prova a filosofia na prática: rotas + JSON nativos, sem
Spring/Express, com o núcleo da aplicação entregue em poucas centenas de linhas.

## 2. O que entregar no Hackathon

- **Interface web com editor de código**: catálogo de lições/desafios, editor com
  exemplos clicáveis, botões *Executar* e *Submeter*, painel de output, barra de XP
  (gamificação) e dicas/soluções progressivas.
- **Microsserviço em Kof**: recebe o código via JSON, grava em arquivo temporário
  isolado (UUID), roda `kof run` com timeout e devolve o resultado: sucesso com stdout,
  **erro de compilação com os códigos amigáveis da linguagem** (`PARSE010`, `SEM011`…),
  erro de runtime ou timeout — além do veredito dos desafios (passou/não passou + XP).

## 3. Arquitetura

```text
[ Browser: editor + lições + XP ] ──(HTTP/JSON)──► [ KofPlay Daemon (Kof, kof.web) ]
                                                        ├─► Lessons.kf  (catálogo: record Lesson + JSON)
                                                        ├─► Runner.kf   (temp file UUID + `kof run` + timeout + classifica erro)
                                                        └─► Daemon.kf   (/, /api/health, /api/lessons, /api/run, /api/submit)
```

Fluxo de um *submit*: `POST /api/submit {lessonId, code}` → busca a lição → executa
via Runner → compara stdout com o `expected` → `{passed, xpAwarded, expected, got}`.

## 4. Estrutura de arquivos

```text
kofplay/
├── Main.kf            # entrada: porta via config + sobe o daemon
├── Lessons.kf         # record Lesson + catálogo + lookup + testes
├── Runner.kf          # record RunResult + execução isolada de código Kof + testes
├── Daemon.kf          # rotas web + comparação de submit + auth opcional
├── public/index.html  # UI: lições, editor, output, XP (Tailwind, sem build)
├── kof.config         # server.port + kofplay.* (kof-bin, timeout, api-key)
├── run.sh             # ./run.sh [porta]
└── docs/              # API.md, ARQUITETURA.md, SEGURANCA.md, TESTES.md
```

## 5. Contratos de API (resumo)

- `GET /api/health` → `{status, service, port, kof_version, auth_required}`
- `GET /api/lessons` → `[{id, title, difficulty, xp, description, starter, expected, hint, solution}]`
- `POST /api/run` `{code}` → `{exitCode, stdout, stderr, status, errorKind}`
  (`errorKind`: `NONE|COMPILE|RUNTIME|TIMEOUT`)
- `POST /api/submit` `{lessonId, code}` → `{passed, xpAwarded, expected, got, run}`

## 6. Lições (19, PT-BR, 460 XP)

| # | id | Título | Nível | XP |
|---|---|---|---|---|
| 1 | `hello-kof` | Olá, Kof! | Fácil | 10 |
| 2 | `variaveis` | Variáveis var/val | Fácil | 15 |
| 3 | `if-else` | Decisões com if e else | Fácil | 15 |
| 4 | `switch` | Switch sem if em cascata | Fácil | 15 |
| 5 | `while` | Laços while | Fácil | 15 |
| 6 | `strings` | Métodos de strings | Fácil | 15 |
| 7 | `funcoes` | Sua primeira função | Médio | 20 |
| 8 | `listas` | Listas e laços | Médio | 30 |
| 9 | `classes` | Classes com métodos | Médio | 20 |
| 10 | `enums` | Enums: conjunto fechado | Médio | 20 |
| 11 | `mapas-sets` | Mapas e conjuntos | Médio | 20 |
| 12 | `null-safe` | Null safety | Médio | 25 |
| 13 | `records` | Modelando com records | Médio | 25 |
| 14 | `exceptions` | Erros sob controle | Médio | 25 |
| 15 | `lambdas` | Map e filter com lambdas | Médio | 30 |
| 16 | `arquivos` | Arquivos com kof.io | Médio | 30 |
| 17 | `json` | JSON tipado | Médio | 30 |
| 18 | `concorrencia` | Paralelismo com spawn | Difícil | 50 |
| 19 | `fizzbuzz` | Desafio FizzBuzz (chefe final) | Difícil | 50 |

## 7. Regras de segurança do Runner (MVP)

1. Todo código roda como arquivo `/tmp/kofplay_<UUID>.kf` (imprevisível, deletado após).
2. Prefixo `timeout Ns` (configurável, padrão 25s) em toda execução; exit 124 = TIMEOUT.
3. Limite de 64KB por submissão; `code` vazio rejeitado antes do disco.
4. `writeText` checado; falha de disco vira erro JSON, nunca execução fantasma.
5. API key opcional (`kofplay.api-key`) para `/api/run` e `/api/submit`.
6. Sem sandbox real (não é Docker): demo local, nunca exposto sem proxy com auth+TLS.

## 8. Dicas de Ouro (diferencial no júri)

- **Versatilidade**: o `/api/health` expõe `kof_version`; na demo, compile uma lição
  também para `native`/`js` no terminal para provar "uma linguagem, vários mundos".
- **Ecossistema nativo**: zero Spring/Express — só `kof.web` + `json.*` + `kof.io`.
- **DX**: na apresentação, compare lado a lado o mesmo servidor em Java/Spring
  (~centenas de linhas + XML) vs KofPlay (~200 linhas, zero boilerplate).
- **Honestidade técnica**: erros do compilador exibidos com os códigos reais
  (`SEM011` etc.) — o júri vê que é o compilador de verdade, não teatro.
