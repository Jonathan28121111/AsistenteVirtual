// ============================================
// SUGERENCIAS INTELIGENTES - CHATBOT ITLM
// ============================================

console.log('💡 Cargando sistema de sugerencias inteligentes...');

// Base de conocimiento expandida para sugerencias
const suggestionPatterns = {
    // Académico
    'carreras': ['admisión', 'costos', 'calendario', 'becas'],
    'licenciaturas': ['admisión', 'costos', 'requisitos'],
    'ingeniería': ['carreras', 'admisión', 'posgrados'],
    
    // Admisión e inscripción
    'admisión': ['requisitos', 'fechas', 'costos', 'examen'],
    'admision': ['requisitos', 'fechas', 'costos', 'examen'],
    'inscripción': ['costos', 'requisitos', 'calendario'],
    'inscripcion': ['costos', 'requisitos', 'calendario'],
    'registro': ['admisión', 'requisitos', 'calendario'],
    'examen': ['admisión', 'fechas', 'requisitos'],
    
    // Económico
    'becas': ['costos', 'requisitos', 'calendario', 'apoyo económico'],
    'costos': ['becas', 'formas de pago', 'colegiaturas'],
    'precio': ['costos', 'becas', 'colegiaturas'],
    'pagar': ['costos', 'becas', 'formas de pago'],
    'colegiatura': ['costos', 'becas', 'calendario'],
    
    // Calendario y fechas
    'calendario': ['admisión', 'vacaciones', 'inscripciones', 'fechas'],
    'fechas': ['calendario', 'admisión', 'vacaciones'],
    'vacaciones': ['calendario', 'fechas', 'clases'],
    'semestre': ['calendario', 'inscripciones', 'fechas'],
    
    // Titulación
    'titulación': ['residencias', 'servicio social', 'egel', 'tesis'],
    'titulacion': ['residencias', 'servicio social', 'egel', 'tesis'],
    'título': ['titulación', 'residencias', 'egel'],
    'titulo': ['titulación', 'residencias', 'egel'],
    'graduación': ['titulación', 'residencias', 'servicio social'],
    'graduacion': ['titulación', 'residencias', 'servicio social'],
    'egel': ['titulación', 'costos', 'fechas'],
    'tesis': ['titulación', 'requisitos', 'asesor'],
    
    // Prácticas y servicio
    'servicio social': ['residencias', 'requisitos', 'calendario', 'empresas'],
    'residencias': ['servicio social', 'titulación', 'empresas', 'requisitos'],
    'prácticas': ['residencias', 'servicio social', 'empresas'],
    'practicas': ['residencias', 'servicio social', 'empresas'],
    'empresa': ['residencias', 'servicio social', 'prácticas'],
    
    // Idiomas
    'idiomas': ['inglés', 'certificación', 'costos', 'niveles'],
    'inglés': ['idiomas', 'certificación', 'toefl', 'niveles'],
    'ingles': ['idiomas', 'certificación', 'toefl', 'niveles'],
    'toefl': ['inglés', 'certificación', 'costos'],
    'certificación': ['inglés', 'toefl', 'idiomas'],
    'certificacion': ['inglés', 'toefl', 'idiomas'],
    
    // Posgrados
    'posgrados': ['maestría', 'becas', 'conacyt', 'requisitos'],
    'maestría': ['posgrados', 'becas', 'conacyt', 'costos'],
    'maestria': ['posgrados', 'becas', 'conacyt', 'costos'],
    'conacyt': ['posgrados', 'becas', 'maestría'],
    
    // Información general
    'contacto': ['ubicación', 'horarios', 'teléfono', 'redes'],
    'ubicación': ['contacto', 'dirección', 'cómo llegar'],
    'ubicacion': ['contacto', 'dirección', 'cómo llegar'],
    'teléfono': ['contacto', 'horarios', 'correo'],
    'telefono': ['contacto', 'horarios', 'correo'],
    'dirección': ['contacto', 'ubicación', 'mapa'],
    'direccion': ['contacto', 'ubicación', 'mapa'],
    
    // Historia e identidad
    'historia': ['aniversario', 'fundación', 'dragones'],
    'dragones': ['historia', 'identidad', 'mascota']
};

// Sugerencias contextuales basadas en hora del día
function getTimeBasedSuggestions() {
    const hour = new Date().getHours();
    
    if (hour >= 8 && hour < 12) {
        // Mañana: inscripciones y admisión
        return ['admisión', 'inscripciones', 'horarios'];
    } else if (hour >= 12 && hour < 17) {
        // Tarde: información general
        return ['carreras', 'becas', 'contacto'];
    } else {
        // Noche: consultas rápidas
        return ['calendario', 'costos', 'contacto'];
    }
}

// Sugerencias basadas en historial (últimas 5 búsquedas)
let searchHistory = [];

function addToSearchHistory(query) {
    searchHistory.unshift(query.toLowerCase());
    if (searchHistory.length > 5) {
        searchHistory.pop();
    }
    localStorage.setItem('itlm_search_history', JSON.stringify(searchHistory));
}

function loadSearchHistory() {
    const stored = localStorage.getItem('itlm_search_history');
    if (stored) {
        searchHistory = JSON.parse(stored);
    }
}

// Cargar historial al inicio
loadSearchHistory();

// ============================================
// GENERAR SUGERENCIAS INTELIGENTES
// ============================================

function generateSmartSuggestions(userMessage, context = {}) {
    const normalized = userMessage.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    
    let suggestions = new Set();
    let matchedKeywords = [];
    
    // 1. Buscar en patrones de conocimiento
    for (const [keyword, related] of Object.entries(suggestionPatterns)) {
        if (normalized.includes(keyword)) {
            matchedKeywords.push(keyword);
            related.forEach(s => suggestions.add(s));
        }
    }
    
    // 2. Agregar sugerencias del historial (no repetir lo ya buscado)
    searchHistory.forEach(search => {
        if (suggestionPatterns[search] && !matchedKeywords.includes(search)) {
            suggestionPatterns[search].slice(0, 2).forEach(s => suggestions.add(s));
        }
    });
    
    // 3. Agregar sugerencias basadas en hora
    if (suggestions.size < 3) {
        getTimeBasedSuggestions().forEach(s => suggestions.add(s));
    }
    
    // 4. Sugerencias por defecto si no hay coincidencias
    if (suggestions.size === 0) {
        return ['carreras', 'admisión', 'becas', 'calendario'];
    }
    
    // Convertir a array y limitar a 6 sugerencias
    let finalSuggestions = Array.from(suggestions).slice(0, 6);
    
    // Filtrar sugerencias ya mencionadas en el mensaje
    finalSuggestions = finalSuggestions.filter(s => !normalized.includes(s));
    
    // Si quedan muy pocas, agregar populares
    if (finalSuggestions.length < 3) {
        ['contacto', 'calendario', 'costos'].forEach(s => {
            if (!finalSuggestions.includes(s)) {
                finalSuggestions.push(s);
            }
        });
    }
    
    return finalSuggestions.slice(0, 6);
}

// ============================================
// MOSTRAR SUGERENCIAS
// ============================================

function displaySmartSuggestions(suggestions) {
    const container = document.getElementById('smartSuggestionsContainer');
    if (!container) {
        console.warn('⚠️ Contenedor de sugerencias no encontrado');
        return;
    }
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Crear título
    const title = document.createElement('div');
    title.className = 'suggestions-title';
    title.innerHTML = '💡 <strong>Tal vez te interese:</strong>';
    container.appendChild(title);
    
    // Crear botones
    suggestions.forEach((suggestion, index) => {
        const btn = document.createElement('button');
        btn.className = 'suggestion-btn';
        btn.textContent = getDisplayName(suggestion);
        btn.setAttribute('data-suggestion', suggestion);
        
        // Animación escalonada
        btn.style.animationDelay = `${index * 0.1}s`;
        
        btn.onclick = () => {
            // Agregar al historial
            addToSearchHistory(suggestion);
            
            // Enviar mensaje
            document.getElementById('userInput').value = suggestion;
            sendMessage();
            
            // Ocultar sugerencias
            container.style.display = 'none';
        };
        
        container.appendChild(btn);
    });
    
    // Mostrar con animación
    container.style.display = 'flex';
    
    // Auto-ocultar después de 30 segundos
    setTimeout(() => {
        if (container.style.display !== 'none') {
            container.style.opacity = '0';
            setTimeout(() => {
                container.style.display = 'none';
                container.style.opacity = '1';
            }, 300);
        }
    }, 30000);
}

// ============================================
// NOMBRES DESCRIPTIVOS CON EMOJIS
// ============================================

function getDisplayName(keyword) {
    const names = {
        // Académico
        'carreras': '🎓 Carreras',
        'licenciaturas': '🎓 Licenciaturas',
        'ingeniería': '⚙️ Ingeniería',
        
        // Admisión
        'admisión': '📝 Admisión',
        'admision': '📝 Admisión',
        'inscripción': '📝 Inscripción',
        'inscripcion': '📝 Inscripción',
        'registro': '📝 Registro',
        'requisitos': '📋 Requisitos',
        'examen': '📝 Examen',
        
        // Económico
        'becas': '💰 Becas',
        'costos': '💵 Costos',
        'precio': '💵 Precios',
        'colegiaturas': '💳 Colegiaturas',
        'pagar': '💳 Formas de Pago',
        'apoyo económico': '💰 Apoyo Económico',
        
        // Calendario
        'calendario': '📅 Calendario',
        'fechas': '📅 Fechas',
        'vacaciones': '🏖️ Vacaciones',
        'semestre': '📚 Semestre',
        
        // Titulación
        'titulación': '🎓 Titulación',
        'titulacion': '🎓 Titulación',
        'título': '🎓 Título',
        'titulo': '🎓 Título',
        'graduación': '🎓 Graduación',
        'graduacion': '🎓 Graduación',
        'egel': '📝 EGEL',
        'tesis': '📄 Tesis',
        
        // Prácticas
        'servicio social': '💼 Servicio Social',
        'residencias': '🏢 Residencias',
        'prácticas': '🏢 Prácticas',
        'practicas': '🏢 Prácticas',
        'empresas': '🏭 Empresas',
        
        // Idiomas
        'idiomas': '🌍 Idiomas',
        'inglés': '🇬🇧 Inglés',
        'ingles': '🇬🇧 Inglés',
        'toefl': '📜 TOEFL',
        'certificación': '📜 Certificación',
        'certificacion': '📜 Certificación',
        'niveles': '📊 Niveles',
        
        // Posgrados
        'posgrados': '🎓 Posgrados',
        'maestría': '🎓 Maestría',
        'maestria': '🎓 Maestría',
        'conacyt': '🏆 CONACYT',
        
        // Contacto
        'contacto': '📞 Contacto',
        'ubicación': '📍 Ubicación',
        'ubicacion': '📍 Ubicación',
        'teléfono': '📞 Teléfono',
        'telefono': '📞 Teléfono',
        'horarios': '⏰ Horarios',
        'dirección': '📍 Dirección',
        'direccion': '📍 Dirección',
        'correo': '📧 Correo',
        'redes': '📱 Redes Sociales',
        
        // Historia
        'historia': '🏛️ Historia',
        'dragones': '🐉 Dragones',
        'aniversario': '🎂 Aniversario',
        'fundación': '🏛️ Fundación'
    };
    
    return names[keyword] || `📌 ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`;
}

// ============================================
// OCULTAR SUGERENCIAS
// ============================================

function hideSmartSuggestions() {
    const container = document.getElementById('smartSuggestionsContainer');
    if (container) {
        container.style.display = 'none';
    }
}

// ============================================
// INTEGRACIÓN CON SISTEMA PRINCIPAL
// ============================================

(function integrateSmartSuggestions() {
    // Esperar a que chatbot.js cargue
    const checkAndIntegrate = setInterval(() => {
        if (typeof sendMessage !== 'undefined') {
            clearInterval(checkAndIntegrate);
            
            // Guardar función original
            const originalSendMessage = window.sendMessage;
            
            // Sobrescribir función
            window.sendMessage = function() {
                const input = document.getElementById('userInput');
                const message = input.value.trim();
                
                // Agregar al historial
                if (message !== '') {
                    addToSearchHistory(message);
                }
                
                // Llamar función original
                originalSendMessage();
                
                // Ocultar sugerencias actuales
                hideSmartSuggestions();
                
                // Generar nuevas sugerencias después de la respuesta
                setTimeout(() => {
                    if (message !== '') {
                        const suggestions = generateSmartSuggestions(message);
                        displaySmartSuggestions(suggestions);
                    }
                }, 2000); // Esperar 2 segundos para que aparezca la respuesta
            };
            
            console.log('✅ Sistema de sugerencias inteligentes integrado');
        }
    }, 100);
    
    // Timeout de seguridad
    setTimeout(() => {
        clearInterval(checkAndIntegrate);
    }, 5000);
})();

// ============================================
// SUGERENCIAS AL INICIAR
// ============================================

window.addEventListener('load', () => {
    setTimeout(() => {
        // Mostrar sugerencias iniciales populares
        displaySmartSuggestions(['carreras', 'admisión', 'becas', 'calendario', 'contacto']);
    }, 3000);
});

// ============================================
// LIMPIAR HISTORIAL (COMANDO)
// ============================================

window.clearSearchHistory = function() {
    searchHistory = [];
    localStorage.removeItem('itlm_search_history');
    console.log('✅ Historial de búsqueda limpiado');
};

console.log('✅ Sistema de sugerencias inteligentes cargado');
console.log('💡 Usa clearSearchHistory() para limpiar el historial');