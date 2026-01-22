// Configuración de Features
// Agrega aquí cada nueva feature que crees

const FEATURES = {
    'welcome': {
        name: 'Bienvenida',
        path: 'features/welcome/index.html',
        description: 'Pantalla de bienvenida inicial'
    },
    'aprobracion-grupos-ia': {
        name: 'Aprobación de Grupos',
        path: 'features/aprobracion-grupos-ia/index.html',
        description: 'Flujo completo de creación y aprobación de grupos con validación automática'
    },
    'extracciones-tupay': {
        name: 'Agregar Cuenta PE (Tupay)',
        path: 'features/extracciones-tupay/index.html',
        description: 'Formulario de creación de cuenta payout con selector de tipo de documento y validaciones'
    },
    'plataformas': {
        name: 'Buscador Plataformas',
        path: 'features/plataformas/index.html',
        description: 'Buscador predictivo con empty state y solicitud de nuevas plataformas'
    },
    'millon': {
        name: 'Campaña Billete Millón',
        path: 'features/millon/index.html',
        description: 'Landing con contador y formulario de reclamo para la campaña del billete de un millón'
    },
};

// Feature por defecto
const DEFAULT_FEATURE = 'welcome';
