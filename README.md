# 🎮 KofPlay — Aprenda Kof jogando

Plataforma web onde você aprende **a própria linguagem Kof** resolvendo desafios
no navegador — estilo Codecademy/LeetCode, com **execução real no compilador de
verdade** (nada de mock: erros vêm com os códigos amigáveis da linguagem).

## Como funciona

- 📚 **30 lições em PT-BR** (810 XP, básico ao avançado): do `Olá, Kof!` ao FizzBuzz chefe final —
  cada uma em **Kof e PortuKof** (mesmo exercício, mesma saída; seletor no editor).
- ▶️ **Editor no navegador** com Executar, Submeter, dicas e soluções progressivas.
- ⚙️ **Backend em Kof puro** (`kof.web` + `json` + `kof.io`, zero Spring/Express):
  recebe o código via JSON, executa isolado com timeout e devolve stdout,
  erro de compilação (`SEM011`…) ou veredito + XP.
- 🏆 **XP e progresso** salvos no navegador, com botão **↺ Recomeçar do zero**.

## Instalação

```bash
# 1. Toolchain Kof 0.6.4 (Linux x86_64)
cd /tmp
curl -sL -o kof.tgz "https://github.com/KofLang/Kof4j/releases/download/kof-0.6.4-linux-x86_64/kof-0.6.4-linux-x86_64.tar.gz"
mkdir -p /tmp/kof064 && tar -xzf kof.tgz -C /tmp/kof064
mv /tmp/kof064/kof-0.6.4-linux-x86_64 "$HOME/.kof"
export PATH="$HOME/.kof/bin:$PATH"
kof version  # kof 0.6.4

# 2. KofPlay
git clone https://github.com/ThiagoLange/kofplay.git
cd kofplay/kofplay
./run.sh              # http://localhost:8081
```

## Testando

```bash
# Runner direto
curl -X POST localhost:8081/api/run \
  -H 'Content-Type: application/json' \
  -d '{"code":"main() { println(2 + 3) }"}'
# → {"stdout":"5\n","status":"SUCCESS"}

# Submit com nota
curl -X POST localhost:8081/api/submit \
  -H 'Content-Type: application/json' \
  -d '{"lessonId":"hello-kof","code":"main() { println(\"Olá, Kof!\") }"}'
# → {"passed":true,"xpAwarded":10}
```

## Estrutura

```
kofplay/            # app (detalhes em kofplay/README.md)
├── Main.kf         # entrada + porta via config
├── Lessons.kf      # catálogo das 30 lições
├── Runner.kf       # execução isolada (UUID + timeout + classifica erro)
├── Daemon.kf       # rotas /, /api/health|lessons|run|submit
├── public/         # UI (editor, output, XP)
├── kof.config      # server.port + opções
├── run.sh          # ./run.sh [porta]
└── docs/           # API, arquitetura, segurança, testes
projeto_kofplay_playground_runner.md  # especificação original (hackathon)
```

## Docs

- [`kofplay/docs/API.md`](kofplay/docs/API.md) — contratos das rotas
- [`kofplay/docs/ARQUITETURA.md`](kofplay/docs/ARQUITETURA.md) — desenho do sistema
- [`kofplay/docs/SEGURANCA.md`](kofplay/docs/SEGURANCA.md) — limites honestos do Runner
- [`kofplay/docs/TESTES.md`](kofplay/docs/TESTES.md) — unitários + E2E

## Desenvolvimento

```bash
export PATH="$HOME/.kof/bin:$PATH"
cd kofplay
kof test Lessons.kf   # 4 testes
kof test Runner.kf    # 4 testes
./run.sh              # http://localhost:8081
```

> O Runner precisa do binário `kof` no PATH do daemon (o `run.sh` garante).
> Auth opcional: `kofplay.api-key` exige header `x-api-key` em `/api/run` e `/api/submit`.

## Lições (30, PT-BR, 810 XP total)

Básico (10): hello-kof (10) · variaveis (15) · if-else (15) · switch (15) · while (15) ·
strings (15) · operadores (15) · tipos (15) · tabuada (15) · lista-get (15).
Intermediário (12): funcoes (20) · records (25) · listas (30) · classes (20) · enums (20) ·
mapas-sets (20) · null-safe (25) · exceptions (25) · lambdas (30) · arquivos (30) ·
json (30) · recursao (30).
Avançado (8): concorrencia/spawn (50) · fizzbuzz (50, chefe final) · primo (40) ·
ordenar (50) · fibonacci (40) · mdc (40) · matriz-soma (50) · binario (40).

## Decisões técnicas

- **Execução = compilador real**: `Runner.kf` grava `/tmp/kofplay_<UUID>/prog.(kf|ptkf)` e roda
  `kof run` com `timeout` — o aluno vê diagnósticos idênticos aos do terminal.
- **XP no cliente** (localStorage; anti-farm simples: XP só conta 1× por lição);
  servidor é autoridade do veredito e mantém auditoria (não commitada).
