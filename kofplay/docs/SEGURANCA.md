# SEGURANÇA — KofPlay MVP

> Executa código arbitrário de visitantes como o usuário do daemon.
> Demo local (`localhost`) ou VM descartável. Nunca exponha sem proxy com
> auth + TLS + rate limit.

## Riscos

1. **Execução arbitrária de código Kof** — que por sua vez pode chamar
   interop Java (`Runtime.exec`!) e escapar para o SO. O código do aluno
   roda com seus privilégios: lê `~/.ssh`, rede interna etc.
2. **Custo por execução**: cada run/submit boota compilador + JVM (~1–3s CPU).
   Sem rate limit, N requests paralelos = N toolchains (DoS trivial).
3. **Sem isolamento**: UUID + timeout + 64KB limitam tempo/espaço, não dano.

## Mitigações aplicadas

- Temp UUID + delete pós-execução; `timeout Ns` (configurável, padrão 25s).
- Limite 64KB + rejeição de vazio; `writeText` checado.
- API key opcional para `/api/run` e `/api/submit` (e `/api/ranking`, `/api/room/*`).
- Auditoria de submits em `submissions.jsonl`.
- Salas: id validado (`a-z0-9-`, ≤32 — sem traversal para `rooms/`), código ≤64KB,
  nome saneado (sem quebra de JSON); arquivos de sala em `rooms/` (gitignored).

## Turma em rede local (até ~5 pessoas)

- O daemon escuta em todas as interfaces: `http://<IP>:8081` na mesma rede.
- Para turma: suba com `kofplay.api-key` e distribua a chave + o nome da sala.
- 5 × JVM simultâneas pesam (~1–3s CPU cada); com 25s de timeout o pior caso
  enfileira no SO. Para mais gente: worker com fila (v2 acima).
- Nunca exponha na internet sem proxy com auth + TLS + rate limit.

## v2

- [ ] Rate limit por IP (`kof.cache` + janela)
- [ ] Allowlist no código do aluno (bloquear `import java` nos submits iniciantes)
- [ ] Worker com fila + limite de slots concorrentes (`spawn/await`)
- [ ] TLS + status HTTP reais (quando `kof.web` suportar)
