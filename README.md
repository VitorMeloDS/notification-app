# Sistema de Notificações com RabbitMQ

Este projeto é um sistema de notificações distribuído que utiliza RabbitMQ para processamento assíncrono de mensagens, com backend em NestJS e frontend em Angular.

## 📋 Pré-requisitos

- Docker e Docker Compose
- Node.js 22+ (apenas para desenvolvimento local)
- npm

## 🚀 Como executar a aplicação

### 1. Clone o repositório

```bash
git clone git@github.com:VitorMeloDS/notification-app.git
cd notification-app
```

### 2. Executar com Docker Compose (Recomendado)

```bash
# Executar a aplicação completa
docker-compose up -d

# Executar e ver logs em tempo real
docker-compose up

# Parar a aplicação
docker-compose down

# Parar e remover volumes
docker-compose down -v
```

### 3. Executar em modo desenvolvimento

#### Backend (NestJS)

```bash
cd backend

# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run start:dev

# Executar testes
npm run test

# Executar testes com cobertura
npm run test:cov
```

#### Frontend (Angular)

```bash
cd frontend

# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm start
# ou
ng serve
```

## 🌐 Acessos

- **Frontend**: <http://localhost:4200>
- **Backend API**: <http://localhost:3000>
- **RabbitMQ Management**: <http://localhost:15672>
  - Usuário: `guest`
  - Senha: `guest`

## 📦 Estrutura do Projeto

```
.
├── backend/                 # API NestJS
│   ├── src/
│   │   ├── notification/   # Módulo de notificações
│   │   ├── providers/      # Provedores (RabbitMQ)
│   │   └── main.ts         # Ponto de entrada
│   └── Dockerfile
├── frontend/               # Aplicação Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── services/   # Services Angular
│   │   │   └── components/ # Componentes
│   │   └── main.ts         # Ponto de entrada
│   └── Dockerfile
└── docker-compose.yml      # Orquestração de containers
```

## 🔌 Endpoints da API

### POST /api/notificar

Envia uma notificação para processamento assíncrono.

**Body:**

```json
{
  "mensagemId": "string",
  "conteudoMensagem": "string"
}
```

**Response:**

```json
{
  "status": "accepted",
  "message": "Notificação recebida e será processada assíncronamente",
  "mensagemId": "string",
  "timestamp": "string"
}
```

### GET /api/status/:mensagemId

Consulta o status de uma mensagem específica.

### GET /api/status

Lista todos os status das mensagens processadas.

### GET /api/notifications

Lista todas as notificações com detalhes completos.

## 🎯 Funcionalidades

- ✅ Envio assíncrono de notificações
- ✅ Processamento distribuído com RabbitMQ
- ✅ WebSocket para atualizações em tempo real
- ✅ Consulta de status de mensagens
- ✅ Interface web em Angular
- ✅ API RESTful com NestJS
- ✅ Filas duráveis e persistentes

## 🔧 Configurações

### Variáveis de Ambiente

**Backend:**

- `RABBITMQ_URI`: amqp://guest:guest@rabbitmq:5672
- `PORT`: 3000

**RabbitMQ:**

- Usuário padrão: `guest`
- Senha padrão: `guest`
- Porta AMQP: `5672`
- Porta Management: `15672`

### Filas RabbitMQ

- `fila.notificacao.entrada.vitor` - Fila de entrada de mensagens
- `fila.notificacao.status.vitor` - Fila de status de processamento

## 🧪 Testes

### Executar testes unitários

```bash
# No diretório backend
npm run test

# Testes com cobertura
npm run test:cov

# Testes específicos
npm run test -- notification.service.spec.ts
```

### Estrutura de Testes

- **Testes unitários**: Services e controllers
- **Testes de integração**: Comunicação com RabbitMQ (mocked)
- **Cobertura**: Relatório detalhado de cobertura de código

## 📊 Monitoramento

- **RabbitMQ Management**: <http://localhost:15672>
  - Monitorar filas e mensagens
  - Verificar conexões
  - Estatísticas de performance

## 🔄 Fluxo de Processamento

1. Frontend envia mensagem para API
2. Backend publica na fila de entrada
3. Consumer processa a mensagem
4. Status é publicado na fila de status
5. Frontend recebe atualização via WebSocket
6. Status é armazenado em memória para consulta
