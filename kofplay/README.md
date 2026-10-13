# 🎮 KofPlay — Aprenda Kof jogando (Codecademy/LeetCode em Kof puro)

> **Status:** MVP funcional em **Kof real (0.6.4, target JVM)**.
> Especificação original: [`../projeto_kofplay_playground_runner.md`](../projeto_kofplay_playground_runner.md).

Plataforma web onde você aprende **a própria linguagem Kof** resolvendo desafios
no navegador, com **execução real no compilador de verdade** — erros vêm com os
códigos amigáveis da linguagem (`SEM011`, `PARSE010`…), não mock.

## Estrutura

```
kofplay/
├── Main.kf            # entrada: porta via config + sobe o daemon
├── Lessons.kf         # catálogo (record Lesson + lookup + testes)
├── Runner.kf          # execução isolada de código Kof + testes
├── Daemon.kf          # rotas /, /api/health, /api/lessons, /api/run, /api/submit
├── public/index.html  # UI: lições, editor, output, XP em localStorage
├── kof.config         # server.port=8081 + opções (kof-bin, timeout, api-key)
├── run.sh             # ./run.sh [porta]
├── submissions.jsonl  # criado em runtime (auditoria dos submits)
└── docs/              # API.md, TESTES.md, ARQUITETURA.md, SEGURANCA.md
```

## Instalação

Pré-requisito: **Kof 0.6.4** (testado nessa versão; o Runner usa o binário `kof` do PATH).

```bash
# 1. Toolchain Kof (Linux x86_64) — ~380MB
cd /tmp
curl -sL -o kof.tgz "https://github.com/KofLang/Kof4j/releases/download/kof-0.6.4-linux-x86_64/kof-0.6.4-linux-x86_64.tar.gz"
curl -sL -o SHA256SUMS "https://github.com/KofLang/Kof4j/releases/download/kof-0.6.4-linux-x86_64/SHA256SUMS"
sha256sum -c SHA256SUMS --ignore-missing
mkdir -p /tmp/kof064 && tar -xzf kof.tgz -C /tmp/kof064
mv /tmp/kof064/kof-0.6.4-linux-x86_64 "$HOME/.kof"
export PATH="$HOME/.kof/bin:$PATH"
kof version  # deve imprimir: kof 0.6.4

# 2. KofPlay
git clone https://github.com/ThiagoLange/kofplay.git
cd kofplay/kofplay
./run.sh              # http://localhost:8081
```

> Dica: ponha `export PATH="$HOME/.kof/bin:$PATH"` no `~/.bashrc` para não repetir.
> Porta alternativa: `./run.sh 9090` (ou `KOF_SERVER_PORT=9090`).

## Quickstart

```bash
export PATH="$HOME/.kof/bin:$PATH"
cd kofplay
kof check kofplay 2>/dev/null || kof check .   # 0 erros (só warning MEM014 esperado)
kof test Lessons.kf   # 4 testes
kof test Runner.kf    # 4 testes
./run.sh              # http://localhost:8081
```

> O Runner precisa do binário `kof` no PATH do daemon (o `run.sh` garante).
> Override: `kofplay.kof-bin=/caminho/absoluto/kof`.

## API (resumo)

| Rota | Uso |
|---|---|
| `GET /` | dashboard (text/html) |
| `GET /api/health` | `{status, service, port, timeout_seconds, auth_required, kof_version}` |
| `GET /api/lessons` | array com as 19 lições (id, título, nível, xp, descrição, starter, expected, hint, solution) |
| `POST /api/run` `{code}` | `{exitCode, stdout, stderr, status, errorKind}` (`NONE\|COMPILE\|RUNTIME\|TIMEOUT`) |
| `POST /api/submit` `{lessonId, code}` | `{passed, xpAwarded, expected, got, run}` |

Auth opcional: `kofplay.api-key` (ou `KOF_KOFPLAY_API_KEY`) exige header
`x-api-key` em `/api/run` e `/api/submit`.

## Lições (19, PT-BR, 460 XP total)

Básico: hello-kof (10) · variaveis (15) · if-else (15) · switch (15) · while (15) ·
strings (15) · funcoes (20) · listas (30).
Intermediário: classes (20) · enums (20) · mapas-sets (20) · null-safe (25) ·
exceptions (25) · lambdas (30) · arquivos (30) · json (30) · records (25).
Avançado: concorrencia/spawn (50) · fizzbuzz (50, chefe final).

## Decisões técnicas

- **Execução = compilador real**: `Runner.kf` grava `/tmp/kofplay_<UUID>.kf` e roda
  `kof run` com `timeout` — o aluno vê diagnósticos idênticos aos do terminal.
- **Padrões herdados do KofBox e validados**: UUID anti-race, streams lidos antes
  de `waitFor` (sem deadlock), `writeText` checado, limite 64KB, `headerSet` para
  `text/html`, sem middleware `app.use` (quebra rotas no Kof atual).
- **`kof.process` NATIVO**: `process.run(kofBin, "run", file)` (a doc dizia inexistente; o runtime tem).
- **XP no cliente** (localStorage; anti-farm simples: XP só conta 1× por lição);
  servidor é autoridade do veredito e mantém `submissions.jsonl` de auditoria.
