// ============================================
// CONFIGURACIÓN DE FIREBASE - ITLM
// ============================================

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

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Variables globales
let currentChatId = null;
let userId = null;
let adminPresenceRef = null;
let unreadMessages = 0;

// ============================================
// GENERAR ID ÚNICO DE USUARIO
// ============================================

function generateUserId() {
    const stored = localStorage.getItem('itlm_user_id');
    if (stored) {
        return stored;
    }
    
    const newId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('itlm_user_id', newId);
    return newId;
}

// ============================================
// INICIALIZAR CHAT
// ============================================

function initializeFirebaseChat() {
    userId = generateUserId();
    currentChatId = 'chat_' + userId;
    
    // Verificar presencia de admin
    checkAdminPresence();
    
    // Escuchar nuevos mensajes
    listenForMessages();
    
    // Marcar usuario como activo
    updateUserPresence();
}

// ============================================
// VERIFICAR PRESENCIA DE ADMIN
// ============================================

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

// ============================================
// ACTUALIZAR PRESENCIA DEL USUARIO
// ============================================

function updateUserPresence() {
    const userPresenceRef = database.ref(`users/${userId}/presence`);
    
    userPresenceRef.set({
        online: true,
        lastSeen: firebase.database.ServerValue.TIMESTAMP,
        chatId: currentChatId
    });
    
    // Actualizar cuando el usuario se desconecta
    userPresenceRef.onDisconnect().set({
        online: false,
        lastSeen: firebase.database.ServerValue.TIMESTAMP,
        chatId: currentChatId
    });
}

// ============================================
// ABRIR CHAT EN VIVO
// ============================================

function openLiveChat() {
    const modal = document.getElementById('liveChatModal');
    modal.classList.add('active');
    
    // Marcar mensajes como leídos
    unreadMessages = 0;
    updateNotificationBadge();
    
    // Enfocar input
    setTimeout(() => {
        document.getElementById('liveChatInput').focus();
    }, 300);
    
    // Enviar notificación al admin de que usuario abrió chat
    notifyAdminUserOpened();
}

// ============================================
// CERRAR CHAT EN VIVO
// ============================================

function closeLiveChat() {
    const modal = document.getElementById('liveChatModal');
    modal.classList.remove('active');
}

// ============================================
// ENVIAR MENSAJE
// ============================================

function sendLiveChatMessage() {
    const input = document.getElementById('liveChatInput');
    const message = input.value.trim();
    
    if (message === '') return;
    
    // Agregar mensaje a Firebase
    const messageRef = database.ref(`chats/${currentChatId}/messages`).push();
    messageRef.set({
        text: message,
        sender: 'user',
        senderId: userId,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        read: false
    });
    
    // Actualizar info del chat
    database.ref(`chats/${currentChatId}/info`).set({
        lastMessage: message,
        lastMessageTime: firebase.database.ServerValue.TIMESTAMP,
        userId: userId,
        userName: 'Visitante',
        status: 'active'
    });
    
    // Limpiar input
    input.value = '';
    
    // Notificar al admin
    notifyAdmin(message);
}

// ============================================
// ESCUCHAR MENSAJES
// ============================================

function listenForMessages() {
    const messagesRef = database.ref(`chats/${currentChatId}/messages`);
    
    messagesRef.on('child_added', (snapshot) => {
        const messageData = snapshot.val();
        const messageId = snapshot.key;
        
        // No mostrar mensajes duplicados
        if (document.querySelector(`[data-message-id="${messageId}"]`)) {
            return;
        }
        
        if (messageData.sender === 'user') {
            // Mensaje del usuario
            displayUserMessage(messageData, messageId);
        } else if (messageData.sender === 'admin') {
            // Mensaje del admin
            displayAdminMessage(messageData, messageId);
            
            // Incrementar contador si modal cerrado
            const modal = document.getElementById('liveChatModal');
            if (!modal.classList.contains('active')) {
                unreadMessages++;
                updateNotificationBadge();
            }
        }
    });
    
    // Escuchar cuando admin está escribiendo
    listenForAdminTyping();
}

// ============================================
// ESCUCHAR CUANDO ADMIN ESTÁ ESCRIBIENDO
// ============================================

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

// ============================================
// MOSTRAR MENSAJE DEL USUARIO
// ============================================

function displayUserMessage(messageData, messageId) {
    const messagesDiv = document.getElementById('liveChatMessages');
    
    // Remover mensaje del sistema si existe
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

// ============================================
// MOSTRAR MENSAJE DEL ADMIN
// ============================================

function displayAdminMessage(messageData, messageId) {
    const messagesDiv = document.getElementById('liveChatMessages');
    
    // Remover mensaje del sistema si existe
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
    
    // Marcar como leído si modal está abierto
    const modal = document.getElementById('liveChatModal');
    if (modal.classList.contains('active')) {
        database.ref(`chats/${currentChatId}/messages/${messageId}`).update({
            read: true
        });
    }
}

// ============================================
// NOTIFICAR AL ADMIN
// ============================================

function notifyAdmin(message) {
    // Crear notificación para admin
    database.ref('notifications/admin').push({
        chatId: currentChatId,
        userId: userId,
        message: message,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        read: false
    });
}

// ============================================
// NOTIFICAR QUE USUARIO ABRIÓ CHAT
// ============================================

function notifyAdminUserOpened() {
    database.ref(`chats/${currentChatId}/info`).update({
        userOpenedAt: firebase.database.ServerValue.TIMESTAMP,
        status: 'active'
    });
}

// ============================================
// ACTUALIZAR BADGE DE NOTIFICACIONES
// ============================================

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    
    if (unreadMessages > 0) {
        badge.textContent = unreadMessages;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// ============================================
// FORMATEAR TIMESTAMP
// ============================================

function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}`;
}

// ============================================
// SCROLL AL FINAL
// ============================================

function scrollLiveChatToBottom() {
    const messagesDiv = document.getElementById('liveChatMessages');
    setTimeout(() => {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }, 100);
}

// ============================================
// ESCAPAR HTML (SEGURIDAD)
// ============================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// ENTER PARA ENVIAR
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Firebase Chat
    initializeFirebaseChat();
    
    // Enter para enviar
    const liveChatInput = document.getElementById('liveChatInput');
    if (liveChatInput) {
        liveChatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendLiveChatMessage();
            }
        });
    }
    
    // Cerrar modal al hacer click fuera
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