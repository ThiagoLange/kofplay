# TESTES — KofPlay MVP (Kof 0.6.4, JVM)

## 1. Unitários (`kof test`)

```bash
kof test kofplay/Lessons.kf   # 6 testes
kof test kofplay/Runner.kf     # 7 testes
```

| Arquivo | Teste | Resultado |
|---|---|---|
| Lessons | catálogo tem 30 lições | PASS ✅ |
| Lessons | ids são únicos | PASS ✅ |
| Lessons | lookup por id + missing | PASS ✅ |
| Lessons | todo expected termina com `\n` | PASS ✅ |
| Lessons | toda lição tem variante portukof | PASS ✅ |
| Lessons | toda lição tem variante portukof | PASS ✅ |
| Runner | classifyError (NONE/TIMEOUT/COMPILE/RUNTIME) | PASS ✅ |
| Runner | rejeita código vazio | PASS ✅ |
| Runner | hello funciona (exit 0, `Oi\n`) | PASS ✅ |
| Runner | erro de compilação → COMPILE | PASS ✅ |
| Runner | normalizeLang + extOf (kof/portukof/default) | PASS ✅ |
| Runner | runKofLang executa `.ptkf` | PASS ✅ |
| Runner | runKofLang sem language usa kof | PASS ✅ |

## 2. E2E (servidor em 8081)

| # | Caso | Resultado |
|---|---|---|
| 1 | `GET /api/health` (port, timeout 25, kof_version) | ✅ |
| 2 | `GET /api/lessons` (30 lições, campos completos) | ✅ |
| 3 | `POST /api/run` erro real (`SEM011` no stderr) | ✅ |
| 4 | `POST /api/submit` com as 30 `solution` Kof | 30× PASS ✅ |
| 5 | `POST /api/submit` com as 30 `solutionPtkf` (portukof) | 30× PASS ✅ |
| 6 | `POST /api/submit` sem `language` (default kof) | PASS ✅ |
| 7 | Runner isolado: `.kf` estranho em `/tmp` não quebra (subdir por run) | ✅ |
| 15 | XP total do currículo (30 lições) | 810 XP | ✅ |
| 10 | submit com resposta errada (`got 1` vs `expected 42`) | `passed:false`, diff no output ✅ |
| 11 | submit lição inexistente | `licao desconhecida` ✅ |
| 12 | `GET /` como `text/html` (renderiza no navegador) | ✅ |
| 13 | `submissions.jsonl` com linhas auditadas (+`user`) | ✅ |
| 16 | `GET /api/ranking` agrega XP/lições por usuário (+feed) | ✅ |
| 17 | `POST /api/room/push|presence|state` (round-trip + 2 presentes) | ✅ |
| 18 | Sala inválida (`../x`, maiúscula) recusada | ✅ |
| 19 | `user` malicioso saneado (`a<b>c"d` → `abcd`) | ✅ |

## 3. UI v2 autocontida (sem CDN, mesmo padrão do KofBox)

| # | Caso | Resultado |
|---|---|---|
| 14 | `GET /styles.css` → `text/css`, idêntico ao arquivo | ✅ |
| 15 | `GET /app.js` → `application/javascript`, idêntico + `node --check` OK | ✅ |
| 16 | HTML sem handlers/`<script>`/`<style>` inline; tags balanceadas; ids do JS existem | ✅ |

Para repetir: `./run.sh 8081` + seção 2 (troque `solution` pelo seu código).
