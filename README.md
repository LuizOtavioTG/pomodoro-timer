# Pomodoro Timer

Aplicação de produtividade para organizar sessões de concentração e descanso, acompanhar tarefas e visualizar o histórico de pomodoros concluídos.

## Status

**Frontend implementado; backend ainda sem implementação.** A aplicação concentra temporizador, tarefas, preferências e histórico no navegador. Há manifesto e service worker configurados para o build de produção. A pasta `backend/` contém apenas `.gitkeep`.

Status baseado no código local revisado em 29/10/2026. Build, testes, instalação da PWA e experiência no navegador não foram executados nesta revisão.

## Funcionalidades

- Sessões de foco curto, foco longo e descanso; durações padrão de 25, 50 e 10 minutos, respectivamente.
- Controles de temporização e opção de início automático da próxima sessão.
- Criação e conclusão de tarefas, seleção de tarefa ativa e contagem de pomodoros por tarefa.
- Histórico diário e semanal, contagem de sessões do dia e sequências de atividade.
- Tema claro/escuro, alertas sonoros e notificações do navegador quando autorizadas.
- Persistência em `localStorage` de configurações, tarefas, tema, contadores e histórico.

Os dados pertencem ao navegador e à origem acessada. Usar outra porta ou outro navegador não compartilha esse histórico; limpar os dados do site remove a persistência local.

## Stack

- Angular 20, TypeScript 5.8, RxJS 7 e SCSS.
- Angular Service Worker e Web App Manifest.
- Jasmine e Karma para testes unitários.
- Docker com build em Node.js e distribuição estática por Nginx 1.27.

## Requisitos

Para desenvolvimento: Node.js compatível com o lockfile Angular (`^20.19.0`, `^22.12.0` ou `>=24.0.0`) e npm. Para testes via Karma, um navegador Chrome/Chromium disponível.

Para execução em containers: Docker Engine e Docker Compose. Não é necessário banco de dados nem `.env` para o frontend atual.

## Como executar localmente

Partindo da raiz deste projeto:

```bash
cd frontend/pomodoro-frontend
npm ci
npm start -- --host 127.0.0.1
```

Acesse `http://127.0.0.1:4200`. As alterações no código são recarregadas pelo servidor de desenvolvimento.

## Como executar com Docker

Partindo da raiz deste projeto:

```bash
cd frontend/pomodoro-frontend
docker compose up --build -d
```

Acesse `http://127.0.0.1:3000`. O Compose publica `127.0.0.1:3000:80`, restringindo a porta ao computador local.

Para acompanhar ou encerrar:

```bash
docker compose logs -f frontend
docker compose down
```

O Dockerfile usa `node:20-alpine` para compilar e copia `dist/pomodoro-frontend` para o Nginx. O `angular.json` configura a saída do navegador diretamente nessa pasta.

## Build e testes

Na pasta `frontend/pomodoro-frontend`:

```bash
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
npm run watch
```

O último comando recompila em modo de desenvolvimento quando os arquivos mudam. Não há framework end-to-end configurado. O service worker é registrado fora do modo de desenvolvimento; a instalação e o funcionamento offline precisam ser verificados no build de produção.

## Estrutura

```text
frontend/pomodoro-frontend/
  src/app/pomodoro-container/  # Tela, tarefas, preferências e controles
  src/app/services/           # Temporizador, histórico e notificações
  src/app/shared/             # Modal reutilizável
  public/                     # Manifesto e recursos públicos
  ngsw-config.json            # Configuração do service worker
  Dockerfile                  # Build Angular + Nginx
  docker-compose.yml          # Publicação local na porta 3000
backend/.gitkeep              # Reserva para backend futuro
```

## Próximos passos

- Executar build e testes unitários em ambiente com os requisitos instalados.
- Validar temporização em segundo plano, notificações, persistência e instalação/offline da PWA no navegador.
- Sincronização entre dispositivos e backend: a definir; não fazem parte da implementação atual.
