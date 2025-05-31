const socket = io();

console.log('client.js loaded');

const loginDiv = document.getElementById('login');
const chatDiv = document.getElementById('chat');
const joinBtn = document.getElementById('joinBtn');
const nicknameInput = document.getElementById('nicknameInput');
const roomInput = document.getElementById('roomInput');
const roomTitle = document.getElementById('roomTitle');

joinBtn.addEventListener('click', () => {
  console.log('joinBtn clicked');

  const username = nicknameInput.value.trim();
  const room = roomInput.value.trim();

  if (!username || !room) {
    alert('ニックネームとルーム名を入力してください。');
    return;
  }

  socket.emit('joinRoom', { username, room }, (response) => {
    console.log('joinRoom response:', response);
    if (response.status === 'ok') {
      loginDiv.style.display = 'none';
      chatDiv.style.display = 'block';
      roomTitle.textContent = `仙人の集い: ${room}`;
    } else {
      alert(response.message || '参加に失敗しました。');
    }
  });
});

socket.on('message', (msg) => {
  console.log('message received:', msg);
});
