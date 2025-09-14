let ws;
const HOST = "http://localhost:3000";

// Hàm kết nối WebSocket
function connectWebSocket() {
  const wsUrl = HOST.replace("http", "ws") + "/api.artemis/socket";
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    setStatus(true);
    console.log(" WebSocket connected");

    // gọi lại loadInitialData khi kết nối thành công
    loadInitialData();
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      addRowToTable(data, true); // thêm row mới nhất
    } catch (err) {
      console.error("Parse error:", err);
    }
  };

  ws.onclose = () => {
    setStatus(false);
    console.log(" Disconnected, retrying in 3s...");
    setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = (err) => {
    console.error(" WebSocket error:", err);
  };
}

// Gửi dữ liệu lên server
function sendData(qr_code, user_id) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ qr_code, user_id }));
  } else {
    alert("WebSocket not connected!");
  }
}

// Cập nhật trạng thái kết nối
function setStatus(connected) {
  const dot = document.getElementById("conn-dot");
  const text = document.getElementById("conn-text");
  if (!dot || !text) return;

  if (connected) {
    dot.style.background = "green";
    text.textContent = "Connected";
  } else {
    dot.style.background = "red";
    text.textContent = "Disconnected";
  }
}

// Thêm row vào bảng
function addRowToTable({ qr_code, user_id, date }, prepend = false) {
  const tbody = document.querySelector("#tbl tbody");
  if (!tbody) return;

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${qr_code}</td>
    <td>${user_id}</td>
    <td>${new Date(date).toLocaleString()}</td>
  `;

  if (prepend) {
    tbody.prepend(tr);
    tr.classList.add("new");
    setTimeout(() => tr.classList.remove("new"), 2000);
  } else {
    tbody.appendChild(tr);
  }
}

async function loadInitialData() {
  try {
    const res = await fetch(`${HOST}/api.artemis/get`);
    const data = await res.json();
    const tbody = document.querySelector("#tbl tbody");
    tbody.innerHTML = ""; // clear table
    data.forEach(row => addRowToTable(row, false));
  } catch (err) {
    console.error("Load data error:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  connectWebSocket();

  const form = document.getElementById("send-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const qr_code = document.getElementById("inp-qr").value.trim();
    const user_id = document.getElementById("inp-user").value.trim();

    if (qr_code && user_id) {
      sendData(qr_code, user_id);
      form.reset();
    }
  });

  // 4. Nút connect / disconnect
  document.getElementById("btn-connect").addEventListener("click", connectWebSocket);
  document.getElementById("btn-disconnect").addEventListener("click", () => {
    if (ws) ws.close();
  });
});
