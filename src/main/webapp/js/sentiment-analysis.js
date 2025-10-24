// ============================================
// ANÁLISIS DE SENTIMIENTO - CHATBOT ITLM
// ============================================

console.log('📊 Cargando sistema de análisis de sentimiento...');

// Diccionario ampliado de palabras clave en español
const sentimentDictionary = {
    positive: [
        // Emociones positivas
        'excelente', 'genial', 'perfecto', 'increíble', 'maravilloso',
        'fantástico', 'espectacular', 'magnífico', 'extraordinario', 'sensacional',
        
        // Agradecimiento y satisfacción
        'gracias', 'agradezco', 'agradecido', 'satisfecho', 'contento',
        'feliz', 'alegre', 'encantado', 'complacido', 'orgulloso',
        
        // Valoración positiva
        'bueno', 'bien', 'mejor', 'óptimo', 'ideal',
        'me gusta', 'me encanta', 'amo', 'adoro', 'fascina',
        
        // Utilidad y ayuda
        'útil', 'ayuda', 'ayudó', 'ayudado', 'solucionó',
        'resolvió', 'funciona', 'funcional', 'eficiente', 'efectivo',
        
        // Recomendación
        'recomiendo', 'recomendable', 'sugiero', 'aconsejo',
        
        // Exclamaciones positivas
        'wow', 'bravo', 'hurra', 'genial', 'súper',
        'super', 'chido', 'padre', 'chévere', 'bacán'
    ],
    
    negative: [
        // Emociones negativas
        'malo', 'terrible', 'horrible', 'pésimo', 'desastroso',
        'espantoso', 'asqueroso', 'repugnante', 'detestable',
        
        // Frustración y enojo
        'molesto', 'frustrado', 'enojado', 'irritado', 'furioso',
        'enfadado', 'disgustado', 'decepcionado', 'desilusionado',
        
        // Problemas y errores
        'problema', 'error', 'falla', 'fallo', 'defecto',
        'no funciona', 'no sirve', 'no anda', 'roto', 'dañado',
        'defectuoso', 'bugueado', 'colgado', 'lento', 'tardado',
        
        // Dificultad y confusión
        'difícil', 'complicado', 'confuso', 'enredado', 'liado',
        'no entiendo', 'no comprendo', 'no sé', 'perdido',
        
        // Valoración negativa
        'peor', 'inferior', 'mediocre', 'deficiente', 'inadecuado',
        'insatisfecho', 'descontento', 'infeliz', 'triste',
        
        // Quejas
        'queja', 'reclamo', 'protesto', 'me molesta', 'odio'
    ],
    
    neutral: [
        // Información
        'información', 'info', 'datos', 'pregunta', 'consulta',
        'duda', 'cuestión', 'tema', 'asunto',
        
        // Indecisión
        'ok', 'normal', 'regular', 'tal vez', 'quizás',
        'puede ser', 'posiblemente', 'probablemente',
        
        // Saludos y despedidas
        'hola', 'buenos días', 'buenas tardes', 'buenas noches',
        'adiós', 'hasta luego', 'nos vemos', 'chao'
    ]
};

// Emojis intensificadores
const intensifiers = {
    positive: ['!!', '!!!', '😊', '😄', '🎉', '❤️', '👍', '🙌', '✨', '🌟'],
    negative: [':(', '😢', '😠', '😡', '💔', '👎', '😤', '😞']
};

// ============================================
// FUNCIÓN PRINCIPAL DE ANÁLISIS
// ============================================

function analyzeSentiment(text) {
    const normalized = text.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // Remover acentos
    
    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;
    let intensityMultiplier = 1;
    
    // Detectar intensificadores
    if (text.includes('muy') || text.includes('mucho') || text.includes('demasiado')) {
        intensityMultiplier = 1.5;
    }
    
    if (text.includes('!!!') || text.includes('!!')) {
        intensityMultiplier *= 1.3;
    }
    
    // Detectar negaciones
    const hasNegation = /\b(no|nunca|jamás|tampoco|sin)\b/i.test(normalized);
    
    // Contar palabras positivas
    sentimentDictionary.positive.forEach(word => {
        const regex = new RegExp('\\b' + word + '\\b', 'gi');
        const matches = normalized.match(regex);
        if (matches) {
            const count = matches.length * intensityMultiplier;
            positiveScore += hasNegation ? -count : count;
        }
    });
    
    // Contar palabras negativas
    sentimentDictionary.negative.forEach(word => {
        const regex = new RegExp('\\b' + word + '\\b', 'gi');
        const matches = normalized.match(regex);
        if (matches) {
            const count = matches.length * intensityMultiplier;
            negativeScore += hasNegation ? -count : count;
        }
    });
    
    // Contar palabras neutrales
    sentimentDictionary.neutral.forEach(word => {
        const regex = new RegExp('\\b' + word + '\\b', 'gi');
        const matches = normalized.match(regex);
        if (matches) {
            neutralScore += matches.length;
        }
    });
    
    // Detectar emojis
    intensifiers.positive.forEach(emoji => {
        if (text.includes(emoji)) positiveScore += 1;
    });
    
    intensifiers.negative.forEach(emoji => {
        if (text.includes(emoji)) negativeScore += 1;
    });
    
    // Determinar sentimiento dominante
    let sentiment = 'neutral';
    let emoji = '😐';
    let confidence = 'low';
    
    const totalScore = positiveScore + negativeScore + neutralScore;
    
    if (totalScore === 0) {
        sentiment = 'neutral';
        emoji = '😐';
        confidence = 'low';
    } else if (positiveScore > negativeScore && positiveScore > neutralScore) {
        sentiment = 'positive';
        
        // Determinar intensidad
        if (positiveScore >= 3) {
            emoji = '😍';
            confidence = 'high';
        } else if (positiveScore >= 2) {
            emoji = '😊';
            confidence = 'medium';
        } else {
            emoji = '🙂';
            confidence = 'low';
        }
    } else if (negativeScore > positiveScore && negativeScore > 0) {
        sentiment = 'negative';
        
        // Determinar intensidad
        if (negativeScore >= 3) {
            emoji = '😡';
            confidence = 'high';
        } else if (negativeScore >= 2) {
            emoji = '😢';
            confidence = 'medium';
        } else {
            emoji = '😕';
            confidence = 'low';
        }
    } else {
        sentiment = 'neutral';
        emoji = '😐';
        confidence = 'low';
    }
    
    return {
        sentiment: sentiment,
        emoji: emoji,
        confidence: confidence,
        scores: {
            positive: positiveScore,
            negative: negativeScore,
            neutral: neutralScore
        },
        hasNegation: hasNegation,
        intensity: intensityMultiplier
    };
}

// ============================================
// GUARDAR EN FIREBASE
// ============================================

function saveSentimentToFirebase(chatId, messageId, sentimentData) {
    if (typeof database !== 'undefined' && chatId && messageId) {
        database.ref(`chats/${chatId}/messages/${messageId}/sentiment`).set({
            sentiment: sentimentData.sentiment,
            emoji: sentimentData.emoji,
            confidence: sentimentData.confidence,
            scores: sentimentData.scores,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        }).catch(error => {
            console.warn('⚠️ No se pudo guardar sentimiento en Firebase:', error);
        });
    }
}

// ============================================
// MOSTRAR EMOJI EN MENSAJE
// ============================================

function displaySentimentEmoji(messageDiv, emoji, confidence) {
    // Evitar duplicados
    if (messageDiv.querySelector('.sentiment-emoji')) return;
    
    const sentimentSpan = document.createElement('span');
    sentimentSpan.className = 'sentiment-emoji';
    sentimentSpan.textContent = emoji;
    sentimentSpan.title = `Sentimiento detectado (confianza: ${confidence})`;
    
    // Agregar al contenido del mensaje
    const messageContent = messageDiv.querySelector('.message-content');
    if (messageContent) {
        messageContent.appendChild(sentimentSpan);
    }
}

// ============================================
// GENERAR RESPUESTA SEGÚN SENTIMIENTO
// ============================================

function generateSentimentResponse(sentimentData) {
    const responses = {
        positive: {
            high: [
                '¡Me alegra muchísimo que estés tan satisfecho! 😊🎉',
                '¡Qué excelente que te haya ayudado tanto! 🌟',
                '¡Genial! Tu entusiasmo me motiva. ¿Hay algo más en lo que pueda ayudarte? 😄'
            ],
            medium: [
                '¡Me alegra que estés contento! 😊',
                '¡Qué bueno que te sirvió! 👍',
                '¡Perfecto! ¿Necesitas algo más? 😄'
            ],
            low: [
                'Me alegra haberte ayudado 🙂',
                'Genial, ¿algo más? 👍'
            ]
        },
        negative: {
            high: [
                'Lamento mucho que hayas tenido una experiencia tan negativa. 😔 Permíteme conectarte con un administrativo inmediatamente para resolver esto.',
                'Entiendo tu frustración y me disculpo sinceramente. 😞 ¿Puedo transferirte con un humano para ayudarte mejor?'
            ],
            medium: [
                'Lamento que hayas tenido problemas. 😕 ¿Puedo ayudarte de alguna otra forma?',
                'Entiendo tu frustración. Déjame intentar ayudarte mejor. 🤝'
            ],
            low: [
                'Lo siento. ¿Hay algo que pueda hacer para mejorar tu experiencia? 😔',
                '¿Quieres que te conecte con un administrativo? 💬'
            ]
        },
        neutral: []
    };
    
    const sentimentResponses = responses[sentimentData.sentiment];
    if (!sentimentResponses || sentimentResponses.length === 0) return null;
    
    const confidenceResponses = sentimentResponses[sentimentData.confidence];
    if (!confidenceResponses || confidenceResponses.length === 0) return null;
    
    return confidenceResponses[Math.floor(Math.random() * confidenceResponses.length)];
}

// ============================================
// INTEGRACIÓN CON SISTEMA PRINCIPAL
// ============================================

// Interceptar envío de mensajes para analizar sentimiento
(function integrateSentimentAnalysis() {
    // Esperar a que chatbot.js cargue
    const checkAndIntegrate = setInterval(() => {
        if (typeof sendMessage !== 'undefined') {
            clearInterval(checkAndIntegrate);
            
            // Guardar función original
            const originalAddUserMessage = window.addUserMessage;
            
            // Sobrescribir función
            window.addUserMessage = function(text) {
                // Llamar función original
                originalAddUserMessage(text);
                
                // Analizar sentimiento
                const sentimentData = analyzeSentiment(text);
                
                // Log para debugging
                console.log('📊 Sentimiento analizado:', sentimentData);
                
                // Mostrar emoji en el último mensaje
                setTimeout(() => {
                    const lastUserMessage = document.querySelector('.message.user-message:last-of-type');
                    if (lastUserMessage) {
                        displaySentimentEmoji(lastUserMessage, sentimentData.emoji, sentimentData.confidence);
                    }
                }, 100);
                
                // Guardar en Firebase si está disponible
                if (typeof currentChatId !== 'undefined') {
                    saveSentimentToFirebase(currentChatId, Date.now(), sentimentData);
                }
                
                // Responder según sentimiento (solo si es negativo alto)
                if (sentimentData.sentiment === 'negative' && sentimentData.confidence !== 'low') {
                    setTimeout(() => {
                        const response = generateSentimentResponse(sentimentData);
                        if (response && typeof addBotMessage !== 'undefined') {
                            addBotMessage(response);
                        }
                    }, 1500);
                }
            };
            
            console.log('✅ Sistema de análisis de sentimiento integrado correctamente');
        }
    }, 100);
    
    // Timeout de seguridad
    setTimeout(() => {
        clearInterval(checkAndIntegrate);
    }, 5000);
})();

// ============================================
// ESTADÍSTICAS DE SENTIMIENTO
// ============================================

function getSentimentStats() {
    if (typeof database === 'undefined' || typeof currentChatId === 'undefined') {
        console.warn('⚠️ Firebase no disponible para estadísticas');
        return;
    }
    
    database.ref(`chats/${currentChatId}/messages`).once('value', (snapshot) => {
        const messages = snapshot.val();
        if (!messages) return;
        
        let positive = 0, negative = 0, neutral = 0;
        
        Object.values(messages).forEach(msg => {
            if (msg.sentiment) {
                switch(msg.sentiment.sentiment) {
                    case 'positive': positive++; break;
                    case 'negative': negative++; break;
                    case 'neutral': neutral++; break;
                }
            }
        });
        
        console.log('📊 Estadísticas de sentimiento:');
        console.log(`   Positivos: ${positive} (${((positive/(positive+negative+neutral))*100).toFixed(1)}%)`);
        console.log(`   Negativos: ${negative} (${((negative/(positive+negative+neutral))*100).toFixed(1)}%)`);
        console.log(`   Neutrales: ${neutral} (${((neutral/(positive+negative+neutral))*100).toFixed(1)}%)`);
    });
}

// Comando para ver estadísticas (consola de desarrollador)
window.showSentimentStats = getSentimentStats;

console.log('✅ Sistema de análisis de sentimiento cargado');
console.log('💡 Usa showSentimentStats() en la consola para ver estadísticas');
