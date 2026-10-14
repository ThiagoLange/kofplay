# ARQUITETURA — KofPlay MVP

```
Browser (editor + lições + XP localStorage)
  │ HTTP/JSON (mesma origem, sem CORS)
  ▼
Daemon.kf (kof.web, JVM, virtual thread por conexão)
  GET  /              → index.html (headerSet text/html + cache em memória)
  GET  /styles.css    → tema próprio (text/css, com cache)
  GET  /app.js        → lógica da UI (javascript, com cache)
  GET  /api/health    → status + kof_version (capturada via `kof version`, com cache)
  GET  /api/lessons   → lessonsJson() (array direto, sem montagem manual)
  POST /api/run       → runKof(code) → RunResult JSON
  POST /api/submit    → findLesson + runKof + compara stdout == expected + logSubmit
  GET  /api/ranking   → agrega submissions.jsonl por usuário (XP + lições + feed)
  POST /api/room/state|push|presence → código compartilhado em rooms/<id>.json
```

## Turma (ranking + salas)

- **Identidade**: `user` opcional em run/submit (saneado `[a-zA-Z0-9 _-]`/24,
  ausente = `anon`); vai para a auditoria. Linhas antigas sem `user` contam
  como `anon` — compatível para trás.
- **Ranking**: `rankingJson()` relê o audit, soma XP, lições únicas com passou,
  ordena desc, feed das últimas 20. Sem estado em memória (reinício perde nada).
- **Salas**: `rooms/<id>.json` (`{code, updatedBy, updatedAt, users[{user,seen}]}`),
  id validado (`a-z0-9-`, ≤32, anti-traversal), código ≤64KB, presença com
  prune de inativos >120s. `push` grava+cora, `presence` marca+devolve estado,
  `state` é leitura. Concorrência: last-writer-wins por arquivo (ok p/ ≤5).
- **UI**: nome persistido, ranking (poll 10s), sala com push após 2,5s parado;
  adota versão alheia sozinha só com editor limpo (botão ↻ senão).

## Runner (execução isolada)

`/tmp/kofplay_<UUID>/prog.(kf|ptkf)` → `timeout Ns kof run <file>` → stdout/stderr via
Scanner (lidos **antes** de `waitFor`) → classifica `errorKind` → deleta o temp.
Subdir próprio por run: um `.kf` perdido em `/tmp` quebrava tudo (`PKG005`,
o `kof run` compila o diretório). Cada execução é um processo `kof` fresco: compilação + JVM do zero (~1s a mais
por run, aceitável para ensino; v2 pode manter daemon de compilação aquecido).

## Veredito

`passed = exitCode == 0 && stdout == expected`. Comparação exata de propósito:
ensina o aluno a observar cada caractere (inclusive o `\n` final do println).
O `expected` de cada lição foi capturado no compilador real (ver TESTES.md).

## Limites honestos

- Latência de submit ~1–3s (boot do compilador por execução).
- Comparação por stdout exato (v2: múltiplos casos de teste + normalização).
- XP no cliente (servidor não autentica usuário; auditoria via submissions.jsonl).
- JVM-only (interop Java para processos; native/js fora do escopo).
