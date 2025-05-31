const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// CORS対策
app.use(cors());

// 静的ファイル配信
app.use(express.static(path.join(__dirname, 'public')));

// ルート
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 管理画面
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ルームごとのチャット履歴を保持（メモリ上）
const chatLogs = {}; // { roomName: [ { user, text, image } ] }

// BANリスト
const bannedUsers = new Set();

// ソケット通信
io.on('connection', (socket) => {
  let currentUser = '';
  let currentRoom = '';

  // 参加処理
  socket.on('joinRoom', ({ username, room }, callback) => {
    if (!username || !room) {
      return callback({ status: 'error', message: 'ニックネームとルーム名は必須です' });
    }

    if (bannedUsers.has(username)) {
      return callback({ status: 'error', message: 'このユーザーはBANされています。' });
    }

    currentUser = username;
    currentRoom = room;

    socket.join(room);
    callback({ status: 'ok' });

    // 過去ログ送信
    if (chatLogs[room]) {
      chatLogs[room].forEach(log => {
        socket.emit('message', log);
      });
    }

    // 入室メッセージ
    const joinMsg = {
      user: 'system',
      text: `${username} さんが入室しました。`
    };
    io.to(room).emit('message', joinMsg);

    // ログ追加
    if (!chatLogs[room]) chatLogs[room] = [];
    chatLogs[room].push(joinMsg);
  });

  // チャット送信
  socket.on('chatMessage', ({ user, room, text, image }) => {
    if (!room || !user) return;

    const msg = { user, text, image };

    io.to(room).emit('message', msg);

    // ログ追加
    if (!chatLogs[room]) chatLogs[room] = [];
    chatLogs[room].push(msg);
  });

  // 管理者からの全体送信
  socket.on('adminBroadcast', ({ password, message }) => {
    if (password === 'sennin21345528') {
      const msg = {
        user: '管理者',
        text: `📢 ${message}`
      };
      io.emit('message', msg);
    }
  });

  // BAN処理
  socket.on('banUser', ({ password, username }) => {
    if (password === 'sennin21345528' && username) {
      bannedUsers.add(username);
      // ユーザーがまだ接続中なら強制切断
      for (let [id, s] of io.of("/").sockets) {
        if (s.handshake.query.username === username) {
          s.disconnect(true);
        }
      }
    }
  });

  // サーバーリセット
  socket.on('resetServer', ({ password }) => {
    if (password === 'sennin21345528') {
      Object.keys(chatLogs).forEach(room => delete chatLogs[room]);
    }
  });

  // 切断時
  socket.on('disconnect', () => {
    if (currentRoom && currentUser) {
      const leaveMsg = {
        user: 'system',
        text: `${currentUser} さんが退室しました。`
      };
      io.to(currentRoom).emit('message', leaveMsg);
      if (chatLogs[currentRoom]) {
        chatLogs[currentRoom].push(leaveMsg);
      }
    }
  });
});

// サーバー起動
server.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`);
});
