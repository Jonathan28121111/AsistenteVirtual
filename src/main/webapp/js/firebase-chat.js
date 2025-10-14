

const firebaseConfig = {
    apiKey: "AIzaSyAYf4FGMI1idP6erXCeCfjhaYtAb1bgukc",
    authDomain: "chatbot-itlm.firebaseapp.com",
    databaseURL: "https://chatbot-itlm-default-rtdb.firebaseio.com",
    projectId: "chatbot-itlm",
    storageBucket: "chatbot-itlm.firebasestorage.app",
    messagingSenderId: "651814065789",
    appId: "1:651814065789:web:1f39b26e24712ef7eb0314",
    measurementId: "G-PSQSVQBYFH"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let currentChatId = null;
let userId = null;
let adminPresenceRef = null;
let unreadMessages = 0;


function generateUserId() {
    const stored = localStorage.getItem('itlm_user_id');
    if (stored) {
        return stored;
    }
    
    const newId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('itlm_user_id', newId);
    return newId;
}


function initializeFirebaseChat() {
    userId = generateUserId();
    currentChatId = 'chat_' + userId;
    checkAdminPresence();
    listenForMessages();
    updateUserPresence();
}


function checkAdminPresence() {
    adminPresenceRef = database.ref('admins/online');
    
    adminPresenceRef.on('value', (snapshot) => {
        const onlineAdmins = snapshot.val();
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        if (onlineAdmins && Object.keys(onlineAdmins).length > 0) {
            // Hay admins en línea
            statusDot.className = 'status-dot online';
            statusText.textContent = 'Administrativo en línea';
        } else {
            // No hay admins en línea
            statusDot.className = 'status-dot offline';
            statusText.textContent = 'Fuera de horario';
        }
    });
}


function updateUserPresence() {
    const userPresenceRef = database.ref(`users/${userId}/presence`);
    
    userPresenceRef.set({
        online: true,
        lastSeen: firebase.database.ServerValue.TIMESTAMP,
        chatId: currentChatId
    });
    
    userPresenceRef.onDisconnect().set({
        online: false,
        lastSeen: firebase.database.ServerValue.TIMESTAMP,
        chatId: currentChatId
    });
}

function openLiveChat() {
    const modal = document.getElementById('liveChatModal');
    modal.classList.add('active');
    
    unreadMessages = 0;
    updateNotificationBadge();
    setTimeout(() => {
        document.getElementById('liveChatInput').focus();
    }, 300);
    
    notifyAdminUserOpened();
}


function closeLiveChat() {
    const modal = document.getElementById('liveChatModal');
    modal.classList.remove('active');
}


function sendLiveChatMessage() {
    const input = document.getElementById('liveChatInput');
    const message = input.value.trim();
    
    if (message === '') return;
    
    const messageRef = database.ref(`chats/${currentChatId}/messages`).push();
    messageRef.set({
        text: message,
        sender: 'user',
        senderId: userId,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        read: false
    });
    
    database.ref(`chats/${currentChatId}/info`).set({
        lastMessage: message,
        lastMessageTime: firebase.database.ServerValue.TIMESTAMP,
        userId: userId,
        userName: 'Visitante',
        status: 'active'
    });
    
    input.value = '';    
    notifyAdmin(message);
}


function listenForMessages() {
    const messagesRef = database.ref(`chats/${currentChatId}/messages`);
    
    messagesRef.on('child_added', (snapshot) => {
        const messageData = snapshot.val();
        const messageId = snapshot.key;
        
        if (document.querySelector(`[data-message-id="${messageId}"]`)) {
            return;
        }
        
        if (messageData.sender === 'user') {
            displayUserMessage(messageData, messageId);
        } else if (messageData.sender === 'admin') {
            displayAdminMessage(messageData, messageId);
            
            const modal = document.getElementById('liveChatModal');
            if (!modal.classList.contains('active')) {
                unreadMessages++;
                updateNotificationBadge();
            }
        }
    });
    
    listenForAdminTyping();
}


function listenForAdminTyping() {
    const typingRef = database.ref(`chats/${currentChatId}/adminTyping`);
    
    typingRef.on('value', (snapshot) => {
        const isTyping = snapshot.val();
        const typingContainer = document.getElementById('adminTypingContainer');
        
        if (isTyping) {
            typingContainer.style.display = 'block';
        } else {
            typingContainer.style.display = 'none';
        }
    });
}

function displayUserMessage(messageData, messageId) {
    const messagesDiv = document.getElementById('liveChatMessages');
    
    const systemMsg = messagesDiv.querySelector('.system-message');
    if (systemMsg) {
        systemMsg.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'live-message user';
    messageDiv.setAttribute('data-message-id', messageId);
    messageDiv.innerHTML = `
        <div class="live-message-content">
            ${escapeHtml(messageData.text)}
            <div class="live-message-time">${formatTimestamp(messageData.timestamp)}</div>
        </div>
        <div class="live-message-avatar">👤</div>
    `;
    messagesDiv.appendChild(messageDiv);
    scrollLiveChatToBottom();
}


function displayAdminMessage(messageData, messageId) {
    const messagesDiv = document.getElementById('liveChatMessages');
    const systemMsg = messagesDiv.querySelector('.system-message');
    if (systemMsg) {
        systemMsg.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'live-message admin';
    messageDiv.setAttribute('data-message-id', messageId);
    messageDiv.innerHTML = `
        <div class="live-message-avatar">👨‍💼</div>
        <div class="live-message-content">
            ${escapeHtml(messageData.text)}
            <div class="live-message-time">${formatTimestamp(messageData.timestamp)}</div>
        </div>
    `;
    messagesDiv.appendChild(messageDiv);
    scrollLiveChatToBottom();
    
    const modal = document.getElementById('liveChatModal');
    if (modal.classList.contains('active')) {
        database.ref(`chats/${currentChatId}/messages/${messageId}`).update({
            read: true
        });
    }
}


function notifyAdmin(message) {
    database.ref('notifications/admin').push({
        chatId: currentChatId,
        userId: userId,
        message: message,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        read: false
    });
}


function notifyAdminUserOpened() {
    database.ref(`chats/${currentChatId}/info`).update({
        userOpenedAt: firebase.database.ServerValue.TIMESTAMP,
        status: 'active'
    });
}


function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    
    if (unreadMessages > 0) {
        badge.textContent = unreadMessages;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}


function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}`;
}

function scrollLiveChatToBottom() {
    const messagesDiv = document.getElementById('liveChatMessages');
    setTimeout(() => {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }, 100);
}


function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


document.addEventListener('DOMContentLoaded', function() {
    initializeFirebaseChat();
    
    const liveChatInput = document.getElementById('liveChatInput');
    if (liveChatInput) {
        liveChatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendLiveChatMessage();
            }
        });
    }
    
    const modal = document.getElementById('liveChatModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeLiveChat();
            }
        });
    }
});

console.log('🔥 Firebase Chat ITLM inicializado correctamente');