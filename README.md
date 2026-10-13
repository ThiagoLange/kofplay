# 🎮 KofPlay — Aprenda Kof jogando

Plataforma web onde você aprende **a própria linguagem Kof** resolvendo desafios
no navegador — estilo Codecademy/LeetCode, com **execução real no compilador de
verdade** (nada de mock: erros vêm com os códigos amigáveis da linguagem).

## Como funciona

- 📚 **19 lições em PT-BR** (460 XP): do `Olá, Kof!` ao FizzBuzz chefe final.
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
├── Lessons.kf      # catálogo das 19 lições
├── Runner.kf       # execução isolada (UUID + timeout + classifica erro)
├── Daemon.kf       # rotas /, /api/health|lessons|run|submit
├── public/         # UI (editor, output, XP)
├── kof.config      # server.port + opções
├── run.sh          # ./run.sh [porta]
└── docs/           # API, arquitetura, segurança, testes
projeto_kofplay_playground_runner.md  # especificação original (hackathon)
```

## Docs

- [`kofplay/README.md`](kofplay/README.md) — quickstart, API resumida, decisões técnicas
- [`kofplay/docs/API.md`](kofplay/docs/API.md) — contratos das rotas
- [`kofplay/docs/ARQUITETURA.md`](kofplay/docs/ARQUITETURA.md) — desenho do sistema
- [`kofplay/docs/SEGURANCA.md`](kofplay/docs/SEGURANCA.md) — limites honestos do Runner
- [`kofplay/docs/TESTES.md`](kofplay/docs/TESTES.md) — unitários + E2E
