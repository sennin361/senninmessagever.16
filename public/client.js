const socket = io({
  query: {
    username: ''
  }
});

const loginDiv = document.getElementById('login');
const chatDiv = document.getElementById('chat');
const nicknameInput = document.getElementById('nicknameInput');
const roomInput = document.getElementById('roomInput');
const joinBtn = document.getElementById('joinBtn');
const roomTitle = document.getElementById('roomTitle');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const imageInput = document.getElementById('imageInput');
const messagesDiv = document.getElementById('messages');

let currentUser = '';
let currentRoom = '';

// 参加ボタンを押したとき
joinBtn.addEventListener('click', () => {
  const username = nicknameInput.value.trim();
  const room = roomInput.value.trim();

  if (!username || !room) {
    alert('ニックネームとルーム名を入力してください');
    return;
  }

  socket.emit('joinRoom', { username, room }, (response) => {
    if (response.status === 'ok') {
      currentUser = username;
      currentRoom = room;

      // BANされたときに備えてクエリ更新
      socket.io.opts.query.username = username;

      // UI切り替え
      loginDiv.style.display = 'none';
      chatDiv.style.display = 'block';
      roomTitle.textContent = `ルーム: ${room}`;
    } else {
      alert(response.message);
    }
  });
});

// メッセージ受信時
socket.on('message', (msg) => {
  const div = document.createElement('div');
  div.className = 'message';

  const text = document.createElement('p');
  text.innerHTML = `<strong>${msg.user}:</strong> ${msg.text || ''}`;
  div.appendChild(text);

  if (msg.image) {
    const img = document.createElement('img');
    img.src = msg.image;
    img.alt = '画像';
    img.style.maxWidth = '200px';
    img.style.display = 'block';
    div.appendChild(img);
  }

  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// メッセージ送信時
messageForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const text = messageInput.value.trim();
  const file = imageInput.files[0];

  if (!text && !file) return;

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit('chatMessage', {
        user: currentUser,
        room: currentRoom,
        text,
        image: reader.result
      });
    };
    reader.readAsDataURL(file);
  } else {
    socket.emit('chatMessage', {
      user: currentUser,
      room: currentRoom,
      text
    });
  }

  messageInput.value = '';
  imageInput.value = '';
});
