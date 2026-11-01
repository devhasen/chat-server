import { WebSocketServer, WebSocket } from 'ws';

type Msg = { room: string; user: string; text: string; ts: number };
const rooms = new Map<string, Msg[]>();
const clients = new Map<WebSocket, { room: string; user: string }>();

const wss = new WebSocketServer({ port: Number(process.env.PORT) || 8080 });

function broadcast(room: string, msg: Msg) {
  const history = rooms.get(room) || [];
  history.push(msg);
  rooms.set(room, history.slice(-50));
  for (const [ws, info] of clients) {
    if (info.room === room && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }
}

wss.on('connection', ws => {
  ws.on('message', raw => {
    let data: any;
    try { data = JSON.parse(raw.toString()); } catch { return; }
    if (data.type === 'join') {
      clients.set(ws, { room: data.room, user: data.user });
      const history = rooms.get(data.room) || [];
      ws.send(JSON.stringify({ type: 'history', messages: history }));
      broadcast(data.room, { room: data.room, user: 'system', text: `${data.user} joined`, ts: Date.now() });
    } else if (data.type === 'msg') {
      const info = clients.get(ws);
      if (!info) return;
      broadcast(info.room, { room: info.room, user: info.user, text: data.text, ts: Date.now() });
    }
  });
  ws.on('close', () => {
    const info = clients.get(ws);
    if (info) {
      broadcast(info.room, { room: info.room, user: 'system', text: `${info.user} left`, ts: Date.now() });
      clients.delete(ws);
    }
  });
});

console.log('chat server on', Number(process.env.PORT) || 8080);
