// ============================================
// MODO OSCURO - CHATBOT ITLM (CORREGIDO)
// ============================================

console.log('🌙 Cargando sistema de modo oscuro...');

// Variable global
let darkModeEnabled = false;

// ============================================
// CARGAR PREFERENCIA AL INICIO
// ============================================

function loadDarkModePreference() {
    const saved = localStorage.getItem('itlm_dark_mode');
    console.log('📦 Preferencia guardada:', saved);
    
    if (saved === 'true') {
        darkModeEnabled = true;
        applyDarkMode();
    } else {
        darkModeEnabled = false;
        applyLightMode();
    }
}

// ============================================
// APLICAR MODO OSCURO
// ============================================

function applyDarkMode() {
    console.log('🌙 Aplicando modo oscuro...');
    document.body.classList.add('dark-mode');
    updateThemeIcon('☀️');
}

// ============================================
// APLICAR MODO CLARO
// ============================================

function applyLightMode() {
    console.log('☀️ Aplicando modo claro...');
    document.body.classList.remove('dark-mode');
    updateThemeIcon('🌙');
}

// ============================================
// TOGGLE MODO OSCURO
// ============================================

function toggleDarkMode() {
    console.log('🔄 Toggle modo oscuro...');
    darkModeEnabled = !darkModeEnabled;
    
    if (darkModeEnabled) {
        applyDarkMode();
    } else {
        applyLightMode();
    }
    
    // Guardar preferencia
    localStorage.setItem('itlm_dark_mode', darkModeEnabled.toString());
    console.log('💾 Preferencia guardada:', darkModeEnabled);
    
    // Mostrar notificación
    showModeNotification(darkModeEnabled);
}

// ============================================
// ACTUALIZAR ICONO DEL TEMA
// ============================================

function updateThemeIcon(icon) {
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.textContent = icon;
        console.log('🎨 Icono actualizado:', icon);
    } else {
        console.warn('⚠️ Elemento themeIcon no encontrado');
    }
}

// ============================================
// MOSTRAR NOTIFICACIÓN
// ============================================

function showModeNotification(isDark) {
    // Eliminar notificación anterior si existe
    const oldNotification = document.querySelector('.mode-notification');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'mode-notification';
    notification.innerHTML = `
        <span style="font-size: 20px; margin-right: 8px;">${isDark ? '🌙' : '☀️'}</span>
        <span>${isDark ? 'Modo oscuro activado' : 'Modo claro activado'}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Mostrar con animación
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Ocultar después de 2 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// ============================================
// INICIALIZAR AL CARGAR LA PÁGINA
// ============================================

// Usar DOMContentLoaded para asegurar que todo esté cargado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDarkMode);
} else {
    initializeDarkMode();
}

function initializeDarkMode() {
    console.log('🚀 Inicializando modo oscuro...');
    loadDarkModePreference();
    console.log('✅ Modo oscuro inicializado correctamente');
}

// Exponer función globalmente
window.toggleDarkMode = toggleDarkMode;

console.log('✅ Sistema de modo oscuro cargado');