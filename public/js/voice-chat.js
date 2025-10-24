// ============================================
// CHAT POR VOZ - CHATBOT ITLM
// ============================================

console.log('🎤 Cargando sistema de chat por voz...');

// Verificar soporte del navegador
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechSynthesis = window.speechSynthesis;
const SpeechUtterance = window.SpeechSynthesisUtterance;

// Variables globales
let recognition = null;
let isListening = false;
let isSpeaking = false;
let autoSpeak = false; // Auto-reproducir respuestas del bot

// Configuración de voz
const voiceConfig = {
    lang: 'es-MX',
    rate: 0.9,
    pitch: 1.0,
    volume: 1.0
};

// ============================================
// INICIALIZAR RECONOCIMIENTO DE VOZ
// ============================================

function initVoiceRecognition() {
    if (!SpeechRecognition) {
        console.warn('⚠️ Reconocimiento de voz no soportado en este navegador');
        return false;
    }
    
    recognition = new SpeechRecognition();
    recognition.lang = voiceConfig.lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    // Evento: Inicio de reconocimiento
    recognition.onstart = () => {
        isListening = true;
        updateVoiceButton(true);
        showVoiceIndicator('Escuchando... 🎤');
        console.log('🎤 Reconocimiento de voz iniciado');
    };
    
    // Evento: Resultado obtenido
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        
        console.log('🎤 Texto reconocido:', transcript);
        console.log('📊 Confianza:', (confidence * 100).toFixed(1) + '%');
        
        // Mostrar en el input
        const input = document.getElementById('userInput');
        if (input) {
            input.value = transcript;
            
            // Enviar automáticamente si la confianza es alta
            if (confidence > 0.7) {
                setTimeout(() => {
                    if (typeof sendMessage !== 'undefined') {
                        sendMessage();
                    }
                }, 500);
            } else {
                showVoiceIndicator(`Texto reconocido. Presiona Enter o 📤 para enviar`);
                input.focus();
            }
        }
    };
    
    // Evento: Error
    recognition.onerror = (event) => {
        console.error('❌ Error de reconocimiento:', event.error);
        
        let errorMessage = '';
        switch(event.error) {
            case 'no-speech':
                errorMessage = 'No detecté ningún audio. Intenta de nuevo.';
                break;
            case 'audio-capture':
                errorMessage = 'No se pudo acceder al micrófono.';
                break;
            case 'not-allowed':
                errorMessage = 'Permiso de micrófono denegado. Habilítalo en la configuración del navegador.';
                break;
            case 'network':
                errorMessage = 'Error de red. Verifica tu conexión.';
                break;
            default:
                errorMessage = 'Ocurrió un error. Intenta de nuevo.';
        }
        
        showVoiceIndicator(errorMessage, 'error');
        
        isListening = false;
        updateVoiceButton(false);
    };
    
    // Evento: Finalización
    recognition.onend = () => {
        isListening = false;
        updateVoiceButton(false);
        hideVoiceIndicator();
        console.log('🎤 Reconocimiento finalizado');
    };
    
    return true;
}

// ============================================
// TOGGLE RECONOCIMIENTO DE VOZ
// ============================================

function toggleVoiceRecognition() {
    if (!recognition) {
        const initialized = initVoiceRecognition();
        if (!initialized) {
            alert('❌ Tu navegador no soporta reconocimiento de voz.\n\n' +
                  '✅ Funciona en: Chrome, Edge, Safari\n' +
                  '❌ No funciona en: Firefox, Opera');
            return;
        }
    }
    
    if (isListening) {
        recognition.stop();
    } else {
        try {
            recognition.start();
        } catch (error) {
            console.error('❌ Error al iniciar reconocimiento:', error);
            showVoiceIndicator('Error al iniciar el micrófono', 'error');
        }
    }
}

// ============================================
// ACTUALIZAR BOTÓN DE VOZ
// ============================================

function updateVoiceButton(listening) {
    const btn = document.getElementById('voiceBtn');
    if (!btn) return;
    
    if (listening) {
        btn.textContent = '🔴';
        btn.classList.add('listening');
        btn.title = 'Detener grabación';
    } else {
        btn.textContent = '🎤';
        btn.classList.remove('listening');
        btn.title = 'Usar voz';
    }
}

// ============================================
// INDICADOR VISUAL DE VOZ
// ============================================

function showVoiceIndicator(message, type = 'info') {
    let indicator = document.getElementById('voiceIndicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'voiceIndicator';
        indicator.className = 'voice-indicator';
        document.body.appendChild(indicator);
    }
    
    indicator.textContent = message;
    indicator.className = `voice-indicator active ${type}`;
}

function hideVoiceIndicator() {
    const indicator = document.getElementById('voiceIndicator');
    if (indicator) {
        indicator.classList.remove('active');
        setTimeout(() => {
            if (!indicator.classList.contains('active')) {
                indicator.remove();
            }
        }, 300);
    }
}

// ============================================
// SÍNTESIS DE VOZ (LEER RESPUESTAS)
// ============================================

function speakText(text, options = {}) {
    if (!SpeechSynthesis) {
        console.warn('⚠️ Síntesis de voz no soportada');
        return;
    }
    
    // Detener cualquier voz en curso
    if (isSpeaking) {
        SpeechSynthesis.cancel();
    }
    
    // Limpiar texto de markdown y HTML
    const cleanText = cleanTextForSpeech(text);
    
    if (cleanText.trim() === '') {
        console.warn('⚠️ Texto vacío después de limpiar');
        return;
    }
    
    const utterance = new SpeechUtterance(cleanText);
    utterance.lang = options.lang || voiceConfig.lang;
    utterance.rate = options.rate || voiceConfig.rate;
    utterance.pitch = options.pitch || voiceConfig.pitch;
    utterance.volume = options.volume || voiceConfig.volume;
    
    // Seleccionar voz en español si está disponible
    const voices = SpeechSynthesis.getVoices();
    const spanishVoice = voices.find(voice => voice.lang.startsWith('es'));
    if (spanishVoice) {
        utterance.voice = spanishVoice;
    }
    
    // Eventos
    utterance.onstart = () => {
        isSpeaking = true;
        showSpeakingIndicator();
        console.log('🔊 Reproduciendo voz...');
    };
    
    utterance.onend = () => {
        isSpeaking = false;
        hideSpeakingIndicator();
        console.log('🔇 Reproducción finalizada');
    };
    
    utterance.onerror = (event) => {
        console.error('❌ Error en síntesis de voz:', event.error);
        isSpeaking = false;
        hideSpeakingIndicator();
    };
    
    SpeechSynthesis.speak(utterance);
}

// ============================================
// LIMPIAR TEXTO PARA VOZ
// ============================================

function cleanTextForSpeech(text) {
    return text
        // Remover markdown
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/__(.*?)__/g, '$1')
        .replace(/_(.*?)_/g, '$1')
        
        // Remover HTML
        .replace(/<[^>]*>/g, '')
        
        // Remover URLs
        .replace(/https?:\/\/[^\s]+/g, 'enlace')
        
        // Remover emojis (opcional)
        .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
        .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
        .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
        .replace(/[\u{2600}-\u{26FF}]/gu, '')
        .replace(/[\u{2700}-\u{27BF}]/gu, '')
        
        // Reemplazar saltos de línea múltiples
        .replace(/\n+/g, '. ')
        
        // Limpiar espacios
        .trim();
}

// ============================================
// INDICADOR DE REPRODUCCIÓN
// ============================================

function showSpeakingIndicator() {
    let indicator = document.getElementById('speakingIndicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'speakingIndicator';
        indicator.className = 'speaking-indicator';
        indicator.innerHTML = `
            <div class="speaking-icon">🔊</div>
            <div class="speaking-text">Reproduciendo respuesta...</div>
            <button onclick="stopSpeaking()" class="stop-speaking-btn">⏹️ Detener</button>
        `;
        document.body.appendChild(indicator);
    }
    
    indicator.classList.add('active');
}

function hideSpeakingIndicator() {
    const indicator = document.getElementById('speakingIndicator');
    if (indicator) {
        indicator.classList.remove('active');
        setTimeout(() => {
            if (!indicator.classList.contains('active')) {
                indicator.remove();
            }
        }, 300);
    }
}

function stopSpeaking() {
    if (SpeechSynthesis && isSpeaking) {
        SpeechSynthesis.cancel();
        isSpeaking = false;
        hideSpeakingIndicator();
    }
}

// ============================================
// TOGGLE AUTO-SPEAK
// ============================================

function toggleAutoSpeak() {
    autoSpeak = !autoSpeak;
    const btn = document.getElementById('autoSpeakBtn');
    if (btn) {
        btn.classList.toggle('active', autoSpeak);
        btn.title = autoSpeak ? 'Desactivar lectura automática' : 'Activar lectura automática';
    }
    
    const message = autoSpeak 
        ? 'Lectura automática activada 🔊' 
        : 'Lectura automática desactivada 🔇';
    
    showVoiceIndicator(message, 'info');
    setTimeout(hideVoiceIndicator, 2000);
}

// ============================================
// INTEGRACIÓN CON CHATBOT
// ============================================

(function integrateVoiceChat() {
    // Cargar voces disponibles
    if (SpeechSynthesis) {
        // Las voces se cargan de forma asíncrona
        SpeechSynthesis.onvoiceschanged = () => {
            const voices = SpeechSynthesis.getVoices();
            console.log('🔊 Voces disponibles:', voices.length);
            
            const spanishVoices = voices.filter(v => v.lang.startsWith('es'));
            if (spanishVoices.length > 0) {
                console.log('✅ Voces en español disponibles:', spanishVoices.length);
            }
        };
    }
    
    // Interceptar respuestas del bot para auto-speak
    const checkAndIntegrate = setInterval(() => {
        if (typeof addBotMessage !== 'undefined') {
            clearInterval(checkAndIntegrate);
            
            // Guardar función original
            const originalAddBotMessage = window.addBotMessage;
            
            // Sobrescribir función
            window.addBotMessage = function(text) {
                // Llamar función original
                originalAddBotMessage(text);
                
                // Reproducir si auto-speak está activado
                if (autoSpeak && !isListening) {
                    setTimeout(() => {
                        speakText(text);
                    }, 500);
                }
            };
            
            console.log('✅ Chat por voz integrado');
        }
    }, 100);
    
    setTimeout(() => {
        clearInterval(checkAndIntegrate);
    }, 5000);
})();

// ============================================
// ATAJOS DE TECLADO
// ============================================

document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Shift + V: Toggle reconocimiento de voz
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        toggleVoiceRecognition();
    }
    
    // Ctrl/Cmd + Shift + S: Toggle auto-speak
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        toggleAutoSpeak();
    }
    
    // Escape: Detener voz
    if (e.key === 'Escape' && isSpeaking) {
        stopSpeaking();
    }
});

// ============================================
// ESTILOS CSS INYECTADOS
// ============================================

const voiceStyles = `
<style>
.voice-btn {
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 24px;
    cursor: pointer;
    transition: all 0.3s;
    flex-shrink: 0;
}

.voice-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(74, 222, 128, 0.4);
}

.voice-btn.listening {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

.voice-indicator {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    padding: 15px 25px;
    border-radius: 30px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.3s ease;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
}

.voice-indicator.active {
    opacity: 1;
}

.voice-indicator.info {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
}

.voice-indicator.error {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
}

.speaking-indicator {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    padding: 20px 30px;
    border-radius: 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.3s ease;
    display: flex;
    align-items: center;
    gap: 15px;
}

.speaking-indicator.active {
    opacity: 1;
}

.speaking-icon {
    font-size: 24px;
    animation: soundWave 1s infinite;
}

@keyframes soundWave {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
}

.speaking-text {
    font-size: 14px;
    font-weight: 600;
    color: #333;
}

.stop-speaking-btn {
    padding: 8px 16px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.stop-speaking-btn:hover {
    background: #dc2626;
    transform: scale(1.05);
}

#autoSpeakBtn {
    width: 45px;
    height: 45px;
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    color: white;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
}

#autoSpeakBtn:hover {
    background: rgba(255, 255, 255, 0.3);
}

#autoSpeakBtn.active {
    background: rgba(74, 222, 128, 0.3);
    border-color: #4ade80;
}

body.dark-mode .voice-indicator,
body.dark-mode .speaking-indicator {
    background: #2d2d2d;
}

body.dark-mode .speaking-text {
    color: #e0e0e0;
}

@media (max-width: 768px) {
    .voice-btn {
        width: 45px;
        height: 45px;
        font-size: 20px;
    }
    
    .voice-indicator,
    .speaking-indicator {
        bottom: 80px;
        left: 10px;
        right: 10px;
        transform: none;
        width: auto;
    }
}
</style>
`;

// Inyectar estilos
document.head.insertAdjacentHTML('beforeend', voiceStyles);

// ============================================
// API PÚBLICA
// ============================================

window.voiceChat = {
    speak: speakText,
    listen: toggleVoiceRecognition,
    stopSpeaking: stopSpeaking,
    toggleAutoSpeak: toggleAutoSpeak,
    isListening: () => isListening,
    isSpeaking: () => isSpeaking,
    autoSpeakEnabled: () => autoSpeak
};

console.log('✅ Sistema de chat por voz cargado');
console.log('🎤 Usa Ctrl+Shift+V para activar/desactivar micrófono');
console.log('🔊 Usa Ctrl+Shift+S para activar/desactivar lectura automática');
console.log('💡 API disponible en: window.voiceChat');