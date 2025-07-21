// ====== Global Variables ======
let isLoggedIn = false;
let currentUser = '';
let fuse;
let dataset = [];

const chatbotResponses = {
  greetings: [
    "Hello! How can I assist you today?",
    "Hi there! What would you like to know?",
    "Welcome! I'm here to help answer your questions.",
    "Greetings! What can I help you with?"
  ],
  default: [
    "That's an interesting question! Based on my knowledge, here's what I can tell you:",
    "Let me help you with that. Here's some information:",
    "Great question! From my understanding:",
    "I'd be happy to help! Here's what I know about that:"
  ],
  technical: [
    "For technical questions like this, I recommend checking the latest documentation and best practices.",
    "This is a technical topic that requires careful consideration of various factors.",
    "Based on current industry standards and best practices:"
  ]
};

// ====== DOM Elements ======
const elements = {
  loginModal: document.getElementById('loginModal'),
  loginBtn: document.getElementById('loginBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  closeModal: document.getElementById('closeModal'),
  loginForm: document.getElementById('loginForm'),
  passwordToggle: document.getElementById('passwordToggle'),
  themeToggle: document.getElementById('theme-toggle'),
  chatbotContainer: document.getElementById('chatbotContainer'),
  chatbotToggle: document.getElementById('chatbotToggle'),
  chatbotMessages: document.getElementById('chatbotMessages'),
  messageInput: document.getElementById('messageInput'),
  sendMessage: document.getElementById('sendMessage'),
  minimizeChat: document.getElementById('minimizeChat'),
  startChatting: document.getElementById('startChatting'),
  notification: document.getElementById('notification')
};

// ====== App Initialization ======
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

function initializeApp() {
  setupEventListeners();
  loadTheme();
  checkLoginStatus();
  loadDataset();
}

// ====== Load Dataset from JSON and Initialize Fuse.js ======
function loadDataset() {
  fetch("pairs_chunk_1.json")
    .then(res => res.json())
    .then(data => {
      dataset = data;
      fuse = new Fuse(dataset, {
        keys: ["q"],
        threshold: 0.4,
        includeScore: true
      });
    });
}

// ====== Event Listeners ======
function setupEventListeners() {
  elements.loginBtn?.addEventListener("click", () => elements.loginModal.style.display = "block");
  elements.logoutBtn?.addEventListener("click", logout);
  elements.closeModal?.addEventListener("click", () => elements.loginModal.style.display = "none");
  elements.loginForm?.addEventListener("submit", handleLogin);
  elements.passwordToggle?.addEventListener("click", togglePassword);
  elements.themeToggle?.addEventListener("click", toggleTheme);

  elements.chatbotToggle?.addEventListener("click", () => {
    elements.chatbotContainer.classList.toggle("active");
    elements.messageInput.focus();
  });

  elements.minimizeChat?.addEventListener("click", () => elements.chatbotContainer.classList.remove("active"));
  elements.sendMessage?.addEventListener("click", sendChatMessage);
  elements.messageInput?.addEventListener("keypress", e => {
    if (e.key === "Enter") sendChatMessage();
  });

  elements.startChatting?.addEventListener("click", () => {
    if (!isLoggedIn) {
      elements.loginModal.style.display = "block";
    } else {
      elements.chatbotContainer.classList.toggle("active");
      elements.messageInput.focus();
    }
  });

  window.addEventListener("click", e => {
    if (e.target === elements.loginModal) {
      elements.loginModal.style.display = "none";
    }
  });
}

// ====== Authentication Functions ======
function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (username === "admin" && password === "admin123") {
    login(username);
    elements.loginModal.style.display = "none";
    showNotification("Welcome back! You are now logged in.", "success");
  } else {
    showNotification("Invalid credentials. Use admin/admin123", "error");
  }
}

function login(username) {
  isLoggedIn = true;
  currentUser = username;
  elements.loginBtn.style.display = "none";
  elements.logoutBtn.style.display = "flex";
  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("currentUser", username);
}

function logout() {
  isLoggedIn = false;
  currentUser = "";
  elements.loginBtn.style.display = "flex";
  elements.logoutBtn.style.display = "none";
  elements.chatbotContainer.classList.remove("active");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("currentUser");
  showNotification("You have been logged out.", "success");
}

function checkLoginStatus() {
  const savedLogin = localStorage.getItem("isLoggedIn");
  const savedUser = localStorage.getItem("currentUser");

  if (savedLogin === "true" && savedUser) {
    login(savedUser);
  }
}

// ====== Theme Toggle Functions ======
function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("theme", isDark ? "dark" : "light");

  elements.themeToggle.style.transform = "scale(0.8)";
  setTimeout(() => {
    elements.themeToggle.style.transform = "scale(1)";
  }, 150);
}

function loadTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.body.classList.add("dark-mode");
  }
}

// ====== Chatbot Message Handling ======
function addMessage(content, sender) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${sender}-message`;

  const icon = document.createElement("i");
  icon.className = sender === "bot" ? "fas fa-robot" : "fas fa-user";

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";
  contentDiv.textContent = content;

  msgDiv.appendChild(icon);
  msgDiv.appendChild(contentDiv);
  elements.chatbotMessages.appendChild(msgDiv);
  elements.chatbotMessages.scrollTop = elements.chatbotMessages.scrollHeight;
}

async function sendChatMessage() {
  const input = elements.messageInput.value.trim();
  if (!input) return;

  addMessage(input, "user");
  elements.messageInput.value = "";

  addMessage("Typing...", "bot");

  const response = await generateAIResponse(input);

  // Remove "Typing..." placeholder
  const typingMsg = elements.chatbotMessages.querySelector(".bot-message:last-child");
  if (typingMsg) typingMsg.remove();

  addMessage(response, "bot");
}

// ====== Generate AI-Like Response ======
async function generateAIResponse(message) {
  const userMsg = message.toLowerCase();

  // First try fuzzy matching
  if (fuse) {
    const result = fuse.search(userMsg);
    if (result.length > 0) return result[0].item.a;
  }

  // Fallback if nothing fuzzy matched
  if (userMsg.includes("hello") || userMsg.includes("hi")) return random(chatbotResponses.greetings);
  if (["code", "programming", "html", "css", "javascript", "react"].some(k => userMsg.includes(k)))
    return random(chatbotResponses.technical);
  return random(chatbotResponses.default);
}

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ====== Utility Functions ======
function togglePassword() {
  const passwordField = document.getElementById("password");
  if (passwordField.type === "password") {
    passwordField.type = "text";
    elements.passwordToggle.className = "fas fa-eye-slash password-toggle";
  } else {
    passwordField.type = "password";
    elements.passwordToggle.className = "fas fa-eye password-toggle";
  }
}

function showNotification(msg, type = "success") {
  if (!elements.notification) return;
  elements.notification.textContent = msg;
  elements.notification.className = `notification ${type}`;
  elements.notification.classList.add("show");

  setTimeout(() => {
    elements.notification.classList.remove("show");
  }, 3000);
}
