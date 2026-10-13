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
- API key opcional para `/api/run` e `/api/submit`.
- Auditoria de submits em `submissions.jsonl`.

## v2

- [ ] Rate limit por IP (`kof.cache` + janela)
- [ ] Allowlist no código do aluno (bloquear `import java` nos submits iniciantes)
- [ ] Worker com fila + limite de slots concorrentes (`spawn/await`)
- [ ] TLS + status HTTP reais (quando `kof.web` suportar)
