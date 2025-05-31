const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const PORT = process.env.PORT || 3000;
app.use(express.static('public'));

let users = {};
let chatLog = [];
let bannedUsers = [];

io.on('connection', (socket) => {
  socket.on('join', ({ nickname, room }) => {
    if (bannedUsers.includes(nickname)) {
      socket.emit('banned');
      return;
    }

    socket.join(room);
    socket.nickname = nickname;
    socket.room = room;

    users[socket.id] = { nickname, room };
    io.to(room).emit('message', {
      type: 'system',
      text: `${nickname} が入室しました`
    });

    updateUserCount();
  });

  socket.on('message', (text) => {
    if (!users[socket.id]) return;
    const user = users[socket.id];
    const time = new Date().toLocaleTimeString();
    const message = {
      type: 'chat',
      user: user.nickname,
      text,
      time
    };
    chatLog.push(message);
    io.to(user.room).emit('message', message);
    updateKeywordList();
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      io.to(user.room).emit('message', {
        type: 'system',
        text: `${user.nickname} が退室しました`
      });
      delete users[socket.id];
      updateUserCount();
    }
  });
});

// 管理者用名前空間
const adminNamespace = io.of('/admin');

adminNamespace.on('connection', (socket) => {
  socket.on('admin-login', () => {
    socket.emit('update-user-count', Object.keys(users).length);
    socket.emit('chat-log', chatLog);
    socket.emit('keyword-list', extractKeywords(chatLog));
  });

  socket.on('broadcast', (text) => {
    io.emit('message', {
      type: 'system',
      text: `[管理者送信] ${text}`
    });
  });

  socket.on('ban-user', (nickname) => {
    bannedUsers.push(nickname);
    for (const id in users) {
      if (users[id].nickname === nickname) {
        const sock = io.sockets.sockets.get(id);
        if (sock) sock.disconnect(true);
      }
    }
  });

  socket.on('reset-server', () => {
    users = {};
    chatLog = [];
    bannedUsers = [];
    io.emit('message', { type: 'system', text: '💥 サーバーが初期化されました' });
    updateUserCount();
  });
});

function updateUserCount() {
  const count = Object.keys(users).length;
  adminNamespace.emit('update-user-count', count);
}

function extractKeywords(log) {
  const words = {};
  log.forEach(({ text }) => {
    const list = text.split(/\s|。|、|\.|,|!|！|？|\?/);
    list.forEach(word => {
      if (word.length > 1) words[word] = (words[word] || 0) + 1;
    });
  });
  return Object.entries(words)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
