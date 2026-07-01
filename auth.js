// ===== SISTEMA DE AUTENTICACIÓN Y CONTROL DE ACCESO =====
let usuarioActual = null;
 window.firebaseAdminAuthenticated = window.firebaseAdminAuthenticated || false;
 window.usuarioActual = window.usuarioActual || null;

// Función para iniciar sesión
async function iniciarSesion() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorDiv = document.getElementById('loginError');
    
    // Limpiar errores previos
    errorDiv.style.display = 'none';
    
    if (!email || !password) {
        mostrarErrorLogin('Por favor, complete todos los campos');
        return;
    }
    
    // Roles se resuelven en frontend por email. Las credenciales se validan con Firebase Auth.
    const usuarioPorEmail = window.usuarios.find(u => u.email === email);
    if (!usuarioPorEmail) {
        mostrarErrorLogin('Email o contraseña incorrectos');
        return;
    }

    try {
        await window.firebaseAuth?.signIn(email, password);
    } catch (e) {
        console.error('Error autenticando con Firebase:', e);
        window.firebaseAdminAuthenticated = false;
        mostrarErrorLogin('Email o contraseña incorrectos');
        return;
    }

    // Solo el rol admin habilita acciones de escritura, y requiere sesión Firebase con email.
    const usuario = usuarioPorEmail;
    const fbUser = window.__firebaseCurrentUser || null;
    const adminEmail = 'unknownshoppersmx@gmail.com';
    window.firebaseAdminAuthenticated = !!(usuario.rol === 'admin' && fbUser && fbUser.email && String(fbUser.email).toLowerCase() === adminEmail);

    usuarioActual = usuario;
    window.usuarioActual = usuario;
    localStorage.setItem('usuarioActual', JSON.stringify(usuario));
    
    // Ocultar modal de login
    document.getElementById('loginModal').style.display = 'none';
    document.body.classList.remove('logged-out');
    
    // Mostrar información del usuario
    mostrarInfoUsuario();
    
    // Aplicar restricciones basadas en rol
    aplicarRestriccionesPorRol();
    
    // Recargar dashboard con datos filtrados
    cambiarVista('dashboard');
}

// Función para mostrar error de login
function mostrarErrorLogin(mensaje) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = mensaje;
    errorDiv.style.display = 'block';
}

// Función para mostrar información del usuario
function mostrarInfoUsuario() {
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    
    userName.textContent = usuarioActual.nombre;
    userRole.textContent = usuarioActual.rol;
    userInfo.style.display = 'flex';
}

// Función para cerrar sesión
async function cerrarSesion() {
    usuarioActual = null;
    window.usuarioActual = null;
    localStorage.removeItem('usuarioActual');
    try { await window.firebaseAuth?.signOut(); } catch (e) { console.warn('Error en signOut Firebase:', e); }
    window.firebaseAdminAuthenticated = false;
    
    // Ocultar información del usuario
    document.getElementById('userInfo').style.display = 'none';
    
    // Mostrar modal de login
    document.getElementById('loginModal').style.display = 'block';
    document.body.classList.add('logged-out');
    
    // Limpiar campos de login
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').style.display = 'none';
}

// Función para verificar si el usuario está autenticado
function verificarAutenticacion() {
    const usuarioGuardado = localStorage.getItem('usuarioActual');
    
    if (usuarioGuardado) {
        // Con Firestore protegido, además del rol local, debe existir sesión Firebase Auth.
        const fbUser = window.__firebaseCurrentUser || null;
        if (!fbUser || !fbUser.email) {
            // Sesión local sin Firebase Auth: forzar re-login.
            try { localStorage.removeItem('usuarioActual'); } catch (e) {}
            usuarioActual = null;
            window.usuarioActual = null;
            window.firebaseAdminAuthenticated = false;
            document.getElementById('loginModal').style.display = 'block';
            document.body.classList.add('logged-out');
            return false;
        }

        usuarioActual = JSON.parse(usuarioGuardado);
        window.usuarioActual = usuarioActual;
        // Reestablecer estado conservador: si se recarga la página no asumimos que Firebase Auth sigue válido.
        if (usuarioActual?.rol === 'admin') {
            window.firebaseAdminAuthenticated = !!window.firebaseAdminAuthenticated;
        }
        document.getElementById('loginModal').style.display = 'none';
        document.body.classList.remove('logged-out');
        mostrarInfoUsuario();
        aplicarRestriccionesPorRol();
        cambiarVista('dashboard');
        return true;
    } else {
        window.usuarioActual = null;
        document.getElementById('loginModal').style.display = 'block';
        document.body.classList.add('logged-out');
        return false;
    }
}

// ===== FUNCIONES DE CONTROL DE ACCESO POR ROL =====

function puedeVerCompetencia() {
    try {
        const rol = (window.usuarioActual && window.usuarioActual.rol) ? String(window.usuarioActual.rol).toLowerCase() : '';
        const email = (window.usuarioActual && window.usuarioActual.email) ? String(window.usuarioActual.email).toLowerCase() : '';
        const esAdmin = rol === 'admin';
        const esDg = rol === 'dg' || email === 'dg@cafelacabana.com';
        const esDirGral = rol === 'dirgral' || email === 'dirgral@cafelacabana.com';
        return !!(esAdmin || esDg || esDirGral);
    } catch (e) {
        return false;
    }
}

// Función para aplicar restricciones basadas en el rol del usuario
function aplicarRestriccionesPorRol() {
    if (!usuarioActual) return;
    
    const rol = usuarioActual.rol;
    
    // Ocultar/mostrar botones según el rol
    const btnNuevaEvaluacion = document.querySelector('[onclick="abrirModalNuevaEvaluacion()"]');
    const botonesEditar = document.querySelectorAll('.btn-edit, .btn-editar');
    const botonesEliminar = document.querySelectorAll('.btn-delete, .btn-eliminar');
    const tabCompetencia = document.querySelector('.tab-btn[data-section="competencia"]');
    
    if (rol === 'admin') {
        // Admin puede hacer todo
        const puedeEscribir = !!window.firebaseAdminAuthenticated;
        if (btnNuevaEvaluacion) btnNuevaEvaluacion.style.display = puedeEscribir ? 'inline-block' : 'none';
        botonesEditar.forEach(btn => btn.style.display = puedeEscribir ? 'inline-flex' : 'none');
        botonesEliminar.forEach(btn => btn.style.display = puedeEscribir ? 'inline-flex' : 'none');
    } else {
        // Otros roles no pueden crear, editar o eliminar
        if (btnNuevaEvaluacion) btnNuevaEvaluacion.style.display = 'none';
        botonesEditar.forEach(btn => btn.style.display = 'none');
        botonesEliminar.forEach(btn => btn.style.display = 'none');
    }

    if (tabCompetencia) {
        tabCompetencia.style.display = puedeVerCompetencia() ? '' : 'none';
    }
    
    console.log(`Restricciones aplicadas para rol: ${rol}`);
    console.log(`Botones editar encontrados: ${botonesEditar.length}`);
    console.log(`Botones eliminar encontrados: ${botonesEliminar.length}`);
}

// Función para filtrar datos según el rol del usuario
function filtrarDatosPorRol(evaluaciones) {
    if (!usuarioActual) return [];
    
    const rol = usuarioActual.rol;
    console.log(`Filtrando datos para rol: ${rol}, evaluaciones totales: ${evaluaciones.length}`);

    const normalizarTipo = (t) => {
        const s = String(t || '').toLowerCase().trim();
        if (s === 'sucursal' || s === 'sucursales') return 'sucursal';
        if (s === 'franquicia' || s === 'franquicias') return 'franquicia';
        if (s === 'competencia') return 'competencia';
        return s;
    };

    const evalsNormalizadas = (evaluaciones || []).map(ev => ({
        ...ev,
        tipo: normalizarTipo(ev && ev.tipo)
    }));
    
    // Función auxiliar para filtrar por estado de publicación
    const filtrarPorPublicacion = (evals) => {
        if (rol === 'admin') {
            // Admin puede ver todas las evaluaciones (borradores y publicadas)
            return evals;
        } else {
            // Otros roles solo ven evaluaciones publicadas
            return evals.filter(ev => ev.estadoPublicacion === 'publicado');
        }
    };
    
    switch (rol) {
        case 'admin':
            // Admin puede ver todo
            console.log('Admin: mostrando todas las evaluaciones');
            return filtrarPorPublicacion(evalsNormalizadas);
            
        case 'gop':
            // GOP puede ver evaluaciones de sucursales (solo publicadas)
            const evaluacionesGop = evalsNormalizadas.filter(ev => ev.tipo === 'sucursal');
            const evaluacionesGopPublicadas = filtrarPorPublicacion(evaluacionesGop);
            console.log(`GOP: filtrando ${evaluacionesGopPublicadas.length} sucursales publicadas de ${evaluacionesGop.length} total`);
            return evaluacionesGopPublicadas;
            
        case 'franquicias':
            // Franquicias solo puede ver evaluaciones de franquicias (solo publicadas)
            const evaluacionesFranquicias = evalsNormalizadas.filter(ev => ev.tipo === 'franquicia');
            const evaluacionesFranquiciasPublicadas = filtrarPorPublicacion(evaluacionesFranquicias);
            console.log(`Franquicias: filtrando ${evaluacionesFranquiciasPublicadas.length} franquicias publicadas de ${evaluacionesFranquicias.length} total`);
            return evaluacionesFranquiciasPublicadas;
            
        case 'dg':
            // DG puede ver sucursales, franquicias y competencia (solo publicadas)
            const evaluacionesDg = evalsNormalizadas.filter(ev => 
                ev.tipo === 'sucursal' || ev.tipo === 'franquicia' || ev.tipo === 'competencia'
            );
            const evaluacionesDgPublicadas = filtrarPorPublicacion(evaluacionesDg);
            console.log(`DG: filtrando ${evaluacionesDgPublicadas.length} evaluaciones publicadas (sucursales + franquicias + competencia) de ${evaluacionesDg.length} total`);
            return evaluacionesDgPublicadas;

        case 'capacitacion':
            // Capacitación NO debe ver competencia: solo sucursales + franquicias (solo publicadas)
            const evaluacionesCap = evalsNormalizadas.filter(ev => 
                ev.tipo === 'sucursal' || ev.tipo === 'franquicia'
            );
            const evaluacionesCapPublicadas = filtrarPorPublicacion(evaluacionesCap);
            console.log(`Capacitación: filtrando ${evaluacionesCapPublicadas.length} evaluaciones publicadas (sucursales + franquicias) de ${evaluacionesCap.length} total`);
            return evaluacionesCapPublicadas;
            
        default:
            console.log(`Rol desconocido: ${rol}, no se muestran datos`);
            return [];
    }
}

// Función para verificar permisos de acción
function tienePermiso(accion) {
    if (!usuarioActual) return false;
    
    const rol = usuarioActual.rol;
    const adminEscrituraOk = rol === 'admin' && !!window.firebaseAdminAuthenticated;
    
    switch (accion) {
        case 'crear':
        case 'editar':
        case 'eliminar':
        case 'publicar':
            return adminEscrituraOk;
        case 'ver':
            return true; // Todos pueden ver (pero con filtros)
        case 'admin':
            return rol === 'admin'; // Verificación específica de rol admin
        default:
            return false;
    }
}

// Blindaje: aunque el tab esté oculto por rol, impedir acceso directo a la vista
(function protegerVistaCompetencia() {
    try {
        if (window.__wrapCambiarVistaCompetencia) return;

        const intentarWrap = () => {
            if (typeof window.cambiarVista !== 'function') return false;
            const __origCambiarVista = window.cambiarVista;
            window.cambiarVista = function (vista) {
                if (vista === 'competencia' && !puedeVerCompetencia()) {
                    alert('No tiene permisos para ver Competencia.');
                    return __origCambiarVista.call(this, 'dashboard');
                }
                return __origCambiarVista.apply(this, arguments);
            };
            window.__wrapCambiarVistaCompetencia = true;
            return true;
        };

        if (intentarWrap()) return;

        let intentos = 0;
        const t = setInterval(() => {
            intentos++;
            if (intentarWrap() || intentos >= 80) {
                clearInterval(t);
            }
        }, 50);
    } catch (e) {}
})();

// Event listener para Enter en el formulario de login
document.addEventListener('DOMContentLoaded', function() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                iniciarSesion();
            }
        });
    }
});