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
```

## Runner (execução isolada)

`/tmp/kofplay_<UUID>.kf` → `timeout Ns kof run <file>` → stdout/stderr via
Scanner (lidos **antes** de `waitFor`) → classifica `errorKind` → deleta o temp.
Cada execução é um processo `kof` fresco: compilação + JVM do zero (~1s a mais
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
