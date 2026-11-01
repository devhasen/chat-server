"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const rooms = new Map();
const clients = new Map();
const wss = new ws_1.WebSocketServer({ port: Number(process.env.PORT) || 8080 });
function broadcast(room, msg) {
    const history = rooms.get(room) || [];
    history.push(msg);
    rooms.set(room, history.slice(-50));
    for (const [ws, info] of clients) {
        if (info.room === room && ws.readyState === ws_1.WebSocket.OPEN) {
            ws.send(JSON.stringify(msg));
        }
    }
}
wss.on('connection', ws => {
    ws.on('message', raw => {
        let data;
        try {
            data = JSON.parse(raw.toString());
        }
        catch {
            return;
        }
        if (data.type === 'join') {
            clients.set(ws, { room: data.room, user: data.user });
            const history = rooms.get(data.room) || [];
            ws.send(JSON.stringify({ type: 'history', messages: history }));
            broadcast(data.room, { room: data.room, user: 'system', text: `${data.user} joined`, ts: Date.now() });
        }
        else if (data.type === 'msg') {
            const info = clients.get(ws);
            if (!info)
                return;
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
