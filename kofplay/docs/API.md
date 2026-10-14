# API — KofPlay MVP

Base: `http://localhost:8081` (ou `KOF_SERVER_PORT`).

## GET /api/health

```json
{"status":"UP","service":"kofplay","port":8081,"timeout_seconds":25,
 "auth_required":false,"kof_version":"kof 0.6.4\n"}
```

## GET /api/lessons

Array com todas as lições (campos: `id, title, difficulty, xp, description,
starter, expected, hint, solution`).

## POST /api/run

```bash
curl -s -X POST localhost:8081/api/run -H 'Content-Type: application/json' \
  -d '{"code":"main() {\n    println(6*7)\n}\n"}'
# {"exitCode":0,"stdout":"42\n","stderr":"","status":"SUCCESS","errorKind":"NONE"}
```

PortuKof (`.ptkf`, mesmos exercícios, mesma saída esperada):

```bash
curl -s -X POST localhost:8081/api/run -H 'Content-Type: application/json' \
  -d '{"code":"principal() {\n    escrevaln(6*7)\n}\n","language":"portukof"}'
# {"exitCode":0,"stdout":"42\n","stderr":"","status":"SUCCESS","errorKind":"NONE"}
```

- `language`: `"kof"` (padrão; ausente/desconhecido cai aqui) ou `"portukof"`.
  O Runner escolhe a extensão (`.kf`/`.ptkf`) — o compilador é o mesmo.

Erro de compilação (código real da linguagem no stderr):

```json
{"exitCode":1,"stdout":"","stderr":"....kf:2:10: error: Undefined variable or type: 'ops' [SEM011]\n","status":"FAILED","errorKind":"COMPILE"}
```

- `errorKind`: `NONE` (exit 0) · `TIMEOUT` (exit 124) · `COMPILE` (stderr contém
  `error:`/`PARSE`/`SEM`) · `RUNTIME` (demais falhas).
- Validações (`exitCode -1`): `code` vazio, `code` > 64KB, JSON inválido.

## POST /api/submit

```bash
curl -s -X POST localhost:8081/api/submit -H 'Content-Type: application/json' \
  -d '{"lessonId":"funcoes","code":"Int dobro(Int x) {\n    return x * 2\n}\nmain() {\n    println(dobro(21))\n}\n"}'
# {"passed":true,"xpAwarded":20,"expected":"42\n","got":"42\n","run":{...}}
```

- `passed` = exit 0 **e** stdout exatamente igual ao `expected` (println termina com `\n`).
- Lição inexistente: `{"passed":false,"xpAwarded":0,"error":"licao desconhecida: ..."}`.
- Todo submit é auditado em `submissions.jsonl` (`{lesson, passed, xp}`).
- `language` opcional (`"portukof"` para a variante em português; o `expected`
  é o mesmo nas duas línguas). A UI tem o seletor Kof | PortuKof no editor.
- `user` opcional (nome de exibição; ausente = `anon`, saneado para
  `[a-zA-Z0-9 _-]` com máx 24). Vai para a auditoria e o ranking.

## GET /api/ranking

```bash
curl -s localhost:8081/api/ranking
# {"users":[{"user":"mel","xp":120,"lessons":["hello-kof",...]}],"feed":[...]}
```

- Agrega `submissions.jsonl` por usuário (soma XP, lições únicas com passou,
  ordem decrescente de XP) + últimas 20 entradas (feed).
- Linhas antigas sem `user` contam como `anon` (compatível).

## Salas (código compartilhado)

```bash
curl -s -X POST localhost:8081/api/room/push -H 'Content-Type: application/json' \
  -d '{"room":"turma-1","user":"mel","code":"main() {\n    println(1)\n}\n"}'
curl -s -X POST localhost:8081/api/room/presence -H 'Content-Type: application/json' \
  -d '{"room":"turma-1","user":"jo"}'
curl -s -X POST localhost:8081/api/room/state -H 'Content-Type: application/json' \
  -d '{"room":"turma-1"}'
```

- `room`: `a-z, 0-9, -`, máx 32 (traversal recusado com erro).
- `push` grava código (máx 64KB) + presença; `presence` só marca presença
  (prune de inativos > 120s); `state` é leitura. Arquivos em `rooms/<id>.json`
  (gitignored). A UI entra na sala, envia o código após 400ms parada e adota a
  versão alheia (poll 1,5s) preservando o cursor quando o editor está limpo
  (senão mostra o botão ↻).

## Auth

Com `kofplay.api-key` configurada, `/api/run` e `/api/submit` exigem header
`x-api-key` (sem ela: erro `unauthorized`, `passed:false`). Sem status 401:
`kof.web` Fase 1 não define status custom.
