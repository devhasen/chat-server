# chat-server

WebSocket chat server with rooms and history.

## Protocol

Client sends JSON:
- { "type": "join", "room": "general", "user": "alice" }
- { "type": "msg", "text": "hello" }

Server replies with message objects and history on join.

## Usage

```bash
npm install
npm run build
npm start
```
