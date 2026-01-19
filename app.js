// Sistema de routing para features
class FeatureRouter {
    constructor() {
        this.currentFeature = null;
        this.container = document.getElementById('prototype-container');
        this.init();
    }

    init() {
        // features-config.js ya está cargado como script, las variables están disponibles globalmente
        this.features = typeof FEATURES !== 'undefined' ? FEATURES : {};
        this.defaultFeature = typeof DEFAULT_FEATURE !== 'undefined' ? DEFAULT_FEATURE : 'welcome';
        
        // Cargar feature desde URL hash o usar default
        const hash = window.location.hash.slice(1);
        const featureKey = hash || this.defaultFeature;
        
        // Cargar la feature
        this.loadFeature(featureKey);
        
        // Configurar atajos de teclado
        this.setupKeyboardShortcuts();
        
        // Escuchar cambios en el hash para navegar entre features
        window.addEventListener('hashchange', () => {
            const newHash = window.location.hash.slice(1);
            if (newHash) {
                this.loadFeature(newHash);
            }
        });
    }

    async loadFeature(featureKey) {
        if (!this.features[featureKey]) {
            console.warn(`Feature "${featureKey}" no encontrada, cargando default`);
            featureKey = this.defaultFeature;
        }

        const feature = this.features[featureKey];
        this.currentFeature = featureKey;

        try {
            // Cargar el HTML de la feature
            const response = await fetch(feature.path);
            if (!response.ok) {
                throw new Error(`No se pudo cargar ${feature.path}`);
            }
            
            const html = await response.text();
            
            // Crear un contenedor temporal para parsear el HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            // Limpiar el contenedor actual
            this.container.innerHTML = '';
            
            // Agregar el contenido de la feature
            while (tempDiv.firstChild) {
                this.container.appendChild(tempDiv.firstChild);
            }
            
            // Ejecutar los scripts de la feature
            const scripts = this.container.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                // Copiar atributos
                Array.from(oldScript.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                // Copiar contenido
                newScript.textContent = oldScript.textContent;
                // Reemplazar el script viejo con el nuevo para que se ejecute
                oldScript.parentNode.replaceChild(newScript, oldScript);
            });
            
            // Actualizar URL sin recargar
            window.history.replaceState(null, '', `#${featureKey}`);
            
            // Actualizar título
            document.title = `${feature.name} - Lank Prototipos`;
            
            console.log(`Feature cargada: ${feature.name}`);
            
        } catch (error) {
            console.error(`Error cargando feature "${featureKey}":`, error);
            this.showError(`No se pudo cargar la feature "${feature.name}"`);
        }
    }

    showError(message) {
        this.container.innerHTML = `
            <div class="error-message">
                <h2>Error</h2>
                <p>${message}</p>
                <button onclick="router.loadFeature('${this.defaultFeature}')">Volver al inicio</button>
            </div>
        `;
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K para abrir selector de features
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.showFeatureSelector();
            }
            
            // Escape para cerrar selector
            if (e.key === 'Escape') {
                this.hideFeatureSelector();
            }
        });
    }

    showFeatureSelector() {
        let selector = document.getElementById('feature-selector');
        
        if (!selector) {
            selector = document.createElement('div');
            selector.id = 'feature-selector';
            selector.className = 'feature-selector';
            
            const featureList = Object.keys(this.features).map(key => {
                const feature = this.features[key];
                const isActive = key === this.currentFeature ? 'active' : '';
                return `
                    <div class="feature-item ${isActive}" onclick="router.loadFeature('${key}'); router.hideFeatureSelector();">
                        <div class="feature-name">${feature.name}</div>
                        <div class="feature-description">${feature.description || ''}</div>
                    </div>
                `;
            }).join('');
            
            selector.innerHTML = `
                <div class="feature-selector-content">
                    <div class="feature-selector-header">
                        <h3>Seleccionar Feature</h3>
                        <button class="close-btn" onclick="router.hideFeatureSelector()">×</button>
                    </div>
                    <div class="feature-list">
                        ${featureList}
                    </div>
                    <div class="feature-selector-footer">
                        <small>Presiona ESC para cerrar</small>
                    </div>
                </div>
            `;
            
            document.body.appendChild(selector);
        }
        
        selector.style.display = 'flex';
    }

    hideFeatureSelector() {
        const selector = document.getElementById('feature-selector');
        if (selector) {
            selector.style.display = 'none';
        }
    }
}

// Inicializar router cuando el DOM esté listo
let router;
document.addEventListener('DOMContentLoaded', () => {
    router = new FeatureRouter();
});

// Exponer router globalmente para uso en consola
window.router = router;
