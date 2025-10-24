// ============================================
// SISTEMA DE TICKETS - CHATBOT ITLM
// ============================================

console.log('🎫 Cargando sistema de tickets...');

// Categorías de tickets
const ticketCategories = {
    'admision': 'Admisión e Inscripción',
    'academico': 'Asuntos Académicos',
    'becas': 'Becas y Apoyos',
    'servicios': 'Servicio Social y Residencias',
    'titulacion': 'Titulación',
    'sistemas': 'Problemas Técnicos',
    'general': 'Consulta General'
};

// Estados de tickets
const ticketStatuses = {
    'open': { name: 'Abierto', emoji: '🟡', color: '#fbbf24' },
    'in_progress': { name: 'En Progreso', emoji: '🔵', color: '#3b82f6' },
    'waiting': { name: 'Esperando Respuesta', emoji: '🟣', color: '#a855f7' },
    'resolved': { name: 'Resuelto', emoji: '🟢', color: '#22c55e' },
    'closed': { name: 'Cerrado', emoji: '⚫', color: '#6b7280' }
};

// Prioridades
const ticketPriorities = {
    'urgent': { name: 'Urgente', emoji: '🔴', level: 4 },
    'high': { name: 'Alta', emoji: '🟠', level: 3 },
    'normal': { name: 'Normal', emoji: '🟢', level: 2 },
    'low': { name: 'Baja', emoji: '🔵', level: 1 }
};

// ============================================
// GENERAR NÚMERO DE TICKET
// ============================================

function generateTicketNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `ITLM-${year}${month}${day}${hours}${minutes}-${random}`;
}

// ============================================
// DETERMINAR CATEGORÍA AUTOMÁTICAMENTE
// ============================================

function determineCategory(message) {
    const normalized = message.toLowerCase();
    
    const categoryKeywords = {
        'admision': ['admisión', 'admision', 'inscripción', 'inscripcion', 'registro', 'ingreso', 'ficha'],
        'academico': ['calificaciones', 'materias', 'profesor', 'examen', 'tarea', 'clase', 'horario'],
        'becas': ['beca', 'apoyo', 'dinero', 'económico', 'financiero'],
        'servicios': ['servicio social', 'residencia', 'prácticas', 'practicas', 'empresa'],
        'titulacion': ['titulación', 'titulacion', 'título', 'titulo', 'graduación', 'graduacion', 'egel', 'tesis'],
        'sistemas': ['sistema', 'plataforma', 'no funciona', 'error', 'bug', 'problema técnico', 'acceso', 'contraseña']
    };
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => normalized.includes(keyword))) {
            return category;
        }
    }
    
    return 'general';
}

// ============================================
// DETERMINAR PRIORIDAD AUTOMÁTICAMENTE
// ============================================

function determinePriority(message) {
    const normalized = message.toLowerCase();
    
    // Palabras clave de urgencia
    const urgentKeywords = [
        'urgente', 'emergencia', 'inmediato', 'ya', 'ahora',
        'rápido', 'cuanto antes', 'lo antes posible'
    ];
    
    // Palabras clave de alta prioridad
    const highKeywords = [
        'problema', 'error', 'no funciona', 'no puedo', 'bloqueado',
        'importante', 'necesito', 'ayuda', 'falla'
    ];
    
    // Detectar urgencia
    if (urgentKeywords.some(keyword => normalized.includes(keyword))) {
        return 'urgent';
    }
    
    // Detectar alta prioridad
    if (highKeywords.some(keyword => normalized.includes(keyword))) {
        return 'high';
    }
    
    // Detectar baja prioridad
    const lowKeywords = ['información', 'pregunta', 'duda', 'consulta', 'cuándo', 'cuando'];
    if (lowKeywords.some(keyword => normalized.includes(keyword))) {
        return 'low';
    }
    
    return 'normal';
}

// ============================================
// CREAR TICKET
// ============================================

function createTicket(userMessage, email = null, phone = null) {
    const ticketNumber = generateTicketNumber();
    const category = determineCategory(userMessage);
    const priority = determinePriority(userMessage);
    
    const ticketData = {
        ticketNumber: ticketNumber,
        userId: userId || 'anonymous',
        category: category,
        categoryName: ticketCategories[category],
        status: 'open',
        priority: priority,
        priorityName: ticketPriorities[priority].name,
        message: userMessage,
        email: email,
        phone: phone,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        updatedAt: firebase.database.ServerValue.TIMESTAMP,
        assignedTo: null,
        responses: [],
        metadata: {
            browser: navigator.userAgent,
            timestamp: new Date().toISOString(),
            source: 'web_chatbot'
        }
    };
    
    // Guardar en Firebase
    if (typeof database !== 'undefined') {
        database.ref(`tickets/${ticketNumber}`).set(ticketData)
            .then(() => {
                console.log('✅ Ticket creado:', ticketNumber);
                
                // Notificar administradores
                notifyAdminsNewTicket(ticketNumber, userMessage, priority);
                
                // Mostrar modal de confirmación
                showTicketCreatedModal(ticketNumber, priority);
            })
            .catch(error => {
                console.error('❌ Error al crear ticket:', error);
                alert('Hubo un error al crear el ticket. Por favor intenta de nuevo.');
            });
    } else {
        // Fallback sin Firebase
        console.warn('⚠️ Firebase no disponible, simulando creación de ticket');
        showTicketCreatedModal(ticketNumber, priority);
    }
    
    return ticketNumber;
}

// ============================================
// MOSTRAR DIÁLOGO DE CREACIÓN DE TICKET
// ============================================

function showTicketDialog() {
    const dialog = `
        <div class="ticket-modal" id="ticketDialog">
            <div class="ticket-modal-content">
                <button class="ticket-close-btn" onclick="closeTicketDialog()">✕</button>
                
                <div class="ticket-icon">🎫</div>
                <h2>Crear Ticket de Soporte</h2>
                <p>Describe tu problema o consulta y nos pondremos en contacto contigo</p>
                
                <form id="ticketForm" onsubmit="submitTicket(event)">
                    <div class="form-group">
                        <label for="ticketMessage">¿En qué podemos ayudarte? *</label>
                        <textarea id="ticketMessage" placeholder="Describe tu problema o consulta..." rows="4" required></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="ticketEmail">Correo electrónico (opcional)</label>
                        <input type="email" id="ticketEmail" placeholder="tu@correo.com">
                    </div>
                    
                    <div class="form-group">
                        <label for="ticketPhone">Teléfono (opcional)</label>
                        <input type="tel" id="ticketPhone" placeholder="(668) 123-4567">
                    </div>
                    
                    <div class="ticket-info-note">
                        <small>💡 Los campos opcionales nos ayudan a contactarte más rápido</small>
                    </div>
                    
                    <button type="submit" class="ticket-btn-submit">Crear Ticket</button>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', dialog);
    setTimeout(() => {
        document.getElementById('ticketDialog').classList.add('active');
        document.getElementById('ticketMessage').focus();
    }, 100);
}

// ============================================
// CERRAR DIÁLOGO
// ============================================

function closeTicketDialog() {
    const dialog = document.getElementById('ticketDialog');
    if (dialog) {
        dialog.classList.remove('active');
        setTimeout(() => dialog.remove(), 300);
    }
}

// ============================================
// ENVIAR TICKET
// ============================================

function submitTicket(event) {
    event.preventDefault();
    
    const message = document.getElementById('ticketMessage').value.trim();
    const email = document.getElementById('ticketEmail').value.trim();
    const phone = document.getElementById('ticketPhone').value.trim();
    
    if (message === '') {
        alert('Por favor describe tu problema o consulta');
        return;
    }
    
    // Cerrar diálogo
    closeTicketDialog();
    
    // Crear ticket
    createTicket(message, email || null, phone || null);
}

// ============================================
// MOSTRAR MODAL DE TICKET CREADO
// ============================================

function showTicketCreatedModal(ticketNumber, priority) {
    const priorityInfo = ticketPriorities[priority];
    
    let responseTime = '';
    switch(priority) {
        case 'urgent':
            responseTime = '2-4 horas';
            break;
        case 'high':
            responseTime = '8-12 horas';
            break;
        case 'normal':
            responseTime = '24-48 horas';
            break;
        case 'low':
            responseTime = '48-72 horas';
            break;
    }
    
    const modal = `
        <div class="ticket-modal" id="ticketModal">
            <div class="ticket-modal-content ticket-success">
                <div class="ticket-icon">✅</div>
                <h2>Ticket Creado Exitosamente</h2>
                <p>Tu solicitud ha sido registrada</p>
                
                <div class="ticket-number">${ticketNumber}</div>
                
                <div class="ticket-details">
                    <div class="ticket-detail-item">
                        <span class="detail-label">Prioridad:</span>
                        <span class="detail-value">${priorityInfo.emoji} ${priorityInfo.name}</span>
                    </div>
                    <div class="ticket-detail-item">
                        <span class="detail-label">Tiempo de respuesta estimado:</span>
                        <span class="detail-value">⏱️ ${responseTime}</span>
                    </div>
                </div>
                
                <p class="ticket-info">
                    📧 Recibirás actualizaciones por correo<br>
                    🔍 Puedes consultar el estado con el número de ticket
                </p>
                
                <button onclick="closeTicketModal(); checkTicketStatus('${ticketNumber}')" class="ticket-btn-check">
                    Ver Estado del Ticket
                </button>
                <button onclick="closeTicketModal()" class="ticket-btn-close">Entendido</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
    setTimeout(() => {
        document.getElementById('ticketModal').classList.add('active');
    }, 100);
}

// ============================================
// CERRAR MODAL
// ============================================

function closeTicketModal() {
    const modal = document.getElementById('ticketModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// ============================================
// CONSULTAR ESTADO DE TICKET
// ============================================

function checkTicketStatus(ticketNumber) {
    if (typeof database === 'undefined') {
        console.warn('⚠️ Firebase no disponible');
        if (typeof addBotMessage !== 'undefined') {
            addBotMessage(`Para consultar el estado de tu ticket **${ticketNumber}**, contacta al (668) 812-4939.`);
        }
        return;
    }
    
    database.ref(`tickets/${ticketNumber}`).once('value', (snapshot) => {
        const ticket = snapshot.val();
        if (ticket) {
            displayTicketStatus(ticket);
        } else {
            if (typeof addBotMessage !== 'undefined') {
                addBotMessage(`❌ No encontré el ticket **${ticketNumber}**. Verifica el número e intenta de nuevo.`);
            }
        }
    });
}

// ============================================
// MOSTRAR ESTADO DE TICKET
// ============================================

function displayTicketStatus(ticket) {
    const statusInfo = ticketStatuses[ticket.status];
    const priorityInfo = ticketPriorities[ticket.priority];
    
    const createdDate = new Date(ticket.createdAt);
    const updatedDate = new Date(ticket.updatedAt);
    
    let lastResponse = '';
    if (ticket.responses && ticket.responses.length > 0) {
        const last = ticket.responses[ticket.responses.length - 1];
        lastResponse = `\n\n💬 **Última respuesta:**\n"${last.message}"\n_${formatDate(last.timestamp)}_`;
    } else {
        lastResponse = '\n\n⏳ **Estado:** Esperando respuesta del equipo de soporte';
    }
    
    const response = `
📋 **Estado del Ticket ${ticket.ticketNumber}**

${statusInfo.emoji} **Estado:** ${statusInfo.name}
${priorityInfo.emoji} **Prioridad:** ${priorityInfo.name}
📂 **Categoría:** ${ticket.categoryName}
📅 **Creado:** ${formatDate(createdDate)}
🔄 **Actualizado:** ${formatDate(updatedDate)}
${ticket.assignedTo ? `👤 **Asignado a:** ${ticket.assignedTo}` : '👥 **Asignado a:** Por asignar'}
${lastResponse}

💡 **Consejo:** Guarda tu número de ticket para futuras consultas
    `;
    
    if (typeof addBotMessage !== 'undefined') {
        addBotMessage(response);
    }
}

// ============================================
// NOTIFICAR ADMINISTRADORES
// ============================================

function notifyAdminsNewTicket(ticketNumber, message, priority) {
    if (typeof database === 'undefined') return;
    
    database.ref('notifications/tickets').push({
        type: 'new_ticket',
        ticketNumber: ticketNumber,
        message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
        priority: priority,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        read: false
    });
}

// ============================================
// DETECTAR INTENCIÓN DE CREAR TICKET
// ============================================

function detectTicketIntent(message) {
    const normalized = message.toLowerCase();
    const ticketKeywords = [
        'crear ticket', 'abrir ticket', 'nuevo ticket',
        'reportar', 'queja', 'reclamo', 'problema',
        'no funciona', 'error', 'ayuda urgente'
    ];
    
    return ticketKeywords.some(keyword => normalized.includes(keyword));
}

// ============================================
// DETECTAR CONSULTA DE TICKET
// ============================================

function detectTicketQuery(message) {
    const ticketPattern = /ITLM-\d{12}-\d{3}/i;
    return ticketPattern.test(message);
}

// ============================================
// FORMATEAR FECHA
// ============================================

function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// ============================================
// INTEGRACIÓN CON CHATBOT
// ============================================

(function integrateTicketSystem() {
    // Interceptar mensajes del usuario
    const checkAndIntegrate = setInterval(() => {
        if (typeof addBotMessage !== 'undefined') {
            clearInterval(checkAndIntegrate);
            
            // Guardar función original
            const originalAddUserMessage = window.addUserMessage;
            
            // Sobrescribir función
            window.addUserMessage = function(text) {
                // Llamar función original
                originalAddUserMessage(text);
                
                // Detectar si quiere crear ticket
                if (detectTicketIntent(text)) {
                    setTimeout(() => {
                        addBotMessage('Veo que necesitas ayuda específica. ¿Te gustaría **crear un ticket de soporte**? Así podremos atenderte mejor.');
                        
                        setTimeout(() => {
                            addBotMessage(`
<button onclick="showTicketDialog()" class="create-ticket-btn">
    🎫 Crear Ticket de Soporte
</button>
                            `);
                        }, 500);
                    }, 1000);
                }
                
                // Detectar consulta de ticket
                if (detectTicketQuery(text)) {
                    const match = text.match(/ITLM-\d{12}-\d{3}/i);
                    if (match) {
                        setTimeout(() => {
                            checkTicketStatus(match[0]);
                        }, 1000);
                    }
                }
            };
            
            console.log('✅ Sistema de tickets integrado');
        }
    }, 100);
    
    setTimeout(() => {
        clearInterval(checkAndIntegrate);
    }, 5000);
})();

// ============================================
// ESTILOS CSS INYECTADOS
// ============================================

const ticketStyles = `
<style>
.create-ticket-btn {
    padding: 12px 24px;
    background: linear-gradient(135deg, #8B0000 0%, #660000 100%);
    color: white;
    border: none;
    border-radius: 25px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    margin: 10px 0;
}

.create-ticket-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(139,0,0,0.3);
}

.ticket-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    z-index: 10000;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.ticket-modal.active {
    display: flex;
    opacity: 1;
}

.ticket-modal-content {
    background: white;
    padding: 40px;
    border-radius: 20px;
    text-align: center;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    animation: slideUp 0.3s ease;
    position: relative;
}

.ticket-close-btn {
    position: absolute;
    top: 15px;
    right: 15px;
    width: 35px;
    height: 35px;
    background: #f0f0f0;
    border: none;
    border-radius: 50%;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.2s;
}

.ticket-close-btn:hover {
    background: #e0e0e0;
    transform: rotate(90deg);
}

.ticket-icon {
    font-size: 60px;
    margin-bottom: 20px;
}

.ticket-modal-content h2 {
    color: #8B0000;
    margin-bottom: 10px;
}

.ticket-modal-content p {
    color: #666;
    margin-bottom: 25px;
}

.form-group {
    margin-bottom: 20px;
    text-align: left;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    color: #333;
    font-weight: 600;
    font-size: 14px;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
    border-color: #8B0000;
}

.form-group textarea {
    resize: vertical;
    min-height: 100px;
}

.ticket-info-note {
    background: #f9f9f9;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.ticket-info-note small {
    color: #666;
    font-size: 13px;
}

.ticket-btn-submit {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #8B0000 0%, #660000 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.ticket-btn-submit:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(139,0,0,0.3);
}

.ticket-number {
    font-size: 22px;
    font-weight: bold;
    color: #8B0000;
    background: #f5f5f5;
    padding: 15px;
    border-radius: 10px;
    margin: 20px 0;
    font-family: 'Courier New', monospace;
    letter-spacing: 1px;
}

.ticket-details {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 10px;
    margin: 20px 0;
    text-align: left;
}

.ticket-detail-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #e0e0e0;
}

.ticket-detail-item:last-child {
    border-bottom: none;
}

.detail-label {
    font-weight: 600;
    color: #666;
    font-size: 14px;
}

.detail-value {
    color: #333;
    font-size: 14px;
}

.ticket-info {
    font-size: 14px;
    color: #666;
    margin: 20px 0;
    line-height: 1.6;
}

.ticket-btn-close,
.ticket-btn-check {
    padding: 12px 30px;
    background: linear-gradient(135deg, #8B0000 0%, #660000 100%);
    color: white;
    border: none;
    border-radius: 25px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin: 5px;
}

.ticket-btn-check {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.ticket-btn-close:hover,
.ticket-btn-check:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
`;

// Inyectar estilos
document.head.insertAdjacentHTML('beforeend', ticketStyles);

console.log('✅ Sistema de tickets cargado');
console.log('💡 Usa showTicketDialog() para abrir el diálogo de creación');

