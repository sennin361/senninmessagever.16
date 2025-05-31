const socket = io('/admin');
const PASSWORD = 'sennin21345528';

const loginBtn = document.getElementById('loginBtn');
const adminPanel = document.getElementById('adminPanel');
const adminPassword = document.getElementById('adminPassword');

loginBtn.onclick = () => {
  if (adminPassword.value === PASSWORD) {
    adminPanel.style.display = 'block';
    adminPassword.parentElement.style.display = 'none';
    socket.emit('admin-login');
  } else {
    alert('パスワードが間違っています');
  }
};

const userCount = document.getElementById('userCount');
const logOutput = document.getElementById('logOutput');
const keywordList = document.getElementById('keywordList');

socket.on('update-user-count', (count) => {
  userCount.textContent = count;
});

socket.on('chat-log', (log) => {
  logOutput.innerHTML = '';
  log.forEach(entry => {
    const div = document.createElement('div');
    div.textContent = `[${entry.time}] ${entry.user}: ${entry.text}`;
    logOutput.appendChild(div);
  });
});

socket.on('keyword-list', (keywords) => {
  keywordList.innerHTML = '';
  keywords.forEach(word => {
    const li = document.createElement('li');
    li.textContent = word;
    keywordList.appendChild(li);
  });
});

document.getElementById('broadcastBtn').onclick = () => {
  const text = document.getElementById('broadcastInput').value;
  if (text) {
    socket.emit('broadcast', text);
    document.getElementById('broadcastInput').value = '';
  }
};

document.getElementById('banBtn').onclick = () => {
  const user = document.getElementById('banUserInput').value;
  if (user) {
    socket.emit('ban-user', user);
    alert(`${user} をBANしました`);
    document.getElementById('banUserInput').value = '';
  }
};

document.getElementById('resetBtn').onclick = () => {
  if (confirm('本当に全てのデータをリセットしますか？')) {
    socket.emit('reset-server');
    alert('サーバーを初期化しました');
  }
};
