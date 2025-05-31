const socket = io();

const loginDiv = document.getElementById('login');
const chatDiv = document.getElementById('chat');
const joinBtn = document.getElementById('joinBtn');
const nicknameInput = document.getElementById('nicknameInput');
const roomInput = document.getElementById('roomInput');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const imageInput = document.getElementById('imageInput');
const messagesDiv = document.getElementById('messages');
const roomTitle = document.getElementById('roomTitle');

let username = '';
let room = '';

joinBtn.addEventListener('click', () => {
  const nick = nicknameInput.value.trim();
  const roomName = roomInput.value.trim();

  if (!nick || !roomName) {
    alert('ニックネームとルーム名を入力してください。');
    return;
  }

  username = nick;
  room = roomName;

  socket.emit('joinRoom', { username, room }, (response) => {
    if (response.status === 'ok') {
      loginDiv.style.display = 'none';
      chatDiv.style.display = 'block';
      roomTitle.textContent = `仙人の集い: ${room}`;
    } else {
      alert(response.message || '参加に失敗しました。');
    }
  });
});

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  const file = imageInput.files[0];

  if (!text && !file) return;

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit('chatMessage', {
        user: username,
        room,
        text,
        image: reader.result
      });
    };
    reader.readAsDataURL(file);
  } else {
    socket.emit('chatMessage', {
      user: username,
      room,
      text
    });
  }

  messageInput.value = '';
  imageInput.value = '';
});

socket.on('message', (msg) => {
  const div = document.createElement('div');
  div.classList.add('message');

  if (msg.user === 'system') {
    div.classList.add('system');
    div.textContent = msg.text;
  } else {
    div.classList.add(msg.user === username ? 'self' : 'other');
    div.innerHTML = `
      <div class="user">${msg.user}</div>
      <div class="text">${msg.text || ''}</div>
    `;
    if (msg.image) {
      const img = document.createElement('img');
      img.src = msg.image;
      div.appendChild(img);
    }
  }

  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});
