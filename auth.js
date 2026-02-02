// ===== SISTEMA DE AUTENTICACIÓN Y CONTROL DE ACCESO =====
let usuarioActual = null;
 window.firebaseAdminAuthenticated = window.firebaseAdminAuthenticated || false;

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
    
    // Buscar usuario en la base de datos
    let usuario = window.usuarios.find(u => u.email === email && u.password === password);
    const usuarioPorEmail = window.usuarios.find(u => u.email === email);
    
    // Caso especial: admin puede validar contraseña contra Firebase aunque el password local no coincida
    if (!usuario && usuarioPorEmail?.rol === 'admin') {
        try {
            await window.firebaseAuth?.signInAdmin(email, password);
            window.firebaseAdminAuthenticated = true;
            usuario = usuarioPorEmail;
        } catch (e) {
            console.error('Error autenticando admin con Firebase:', e);
            window.firebaseAdminAuthenticated = false;
            mostrarErrorLogin('Email o contraseña incorrectos');
            return;
        }
    }
    
    if (usuario) {
        // Para cumplir con las reglas de Firestore, solo el admin inicia sesión en Firebase
        try {
            if (usuario.rol === 'admin') {
                await window.firebaseAuth?.signInAdmin(email, password);
                window.firebaseAdminAuthenticated = true;
            } else {
                await window.firebaseAuth?.signOut();
                window.firebaseAdminAuthenticated = false;
            }
        } catch (e) {
            console.error('Error autenticando con Firebase:', e);
            // No bloquear el acceso a la app si el login local es válido.
            // Sin Firebase Auth, el admin no podrá ejecutar acciones de escritura en Firestore.
            window.firebaseAdminAuthenticated = false;
            if (usuario.rol === 'admin') {
                mostrarErrorLogin('Entraste, pero no se pudo autenticar con Firebase. Acciones de admin (crear/editar/eliminar/publicar) quedarán deshabilitadas.');
            }
        }
        usuarioActual = usuario;
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
    } else {
        mostrarErrorLogin('Email o contraseña incorrectos');
    }
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
        usuarioActual = JSON.parse(usuarioGuardado);
        // Reestablecer estado conservador: si se recarga la página no asumimos que Firebase Auth sigue válido.
        if (usuarioActual?.rol === 'admin') {
            window.firebaseAdminAuthenticated = false;
        }
        document.getElementById('loginModal').style.display = 'none';
        document.body.classList.remove('logged-out');
        mostrarInfoUsuario();
        aplicarRestriccionesPorRol();
        cambiarVista('dashboard');
        return true;
    } else {
        document.getElementById('loginModal').style.display = 'block';
        document.body.classList.add('logged-out');
        return false;
    }
}

// ===== FUNCIONES DE CONTROL DE ACCESO POR ROL =====

// Función para aplicar restricciones basadas en el rol del usuario
function aplicarRestriccionesPorRol() {
    if (!usuarioActual) return;
    
    const rol = usuarioActual.rol;
    
    // Ocultar/mostrar botones según el rol
    const btnNuevaEvaluacion = document.querySelector('[onclick="abrirModalNuevaEvaluacion()"]');
    const botonesEditar = document.querySelectorAll('.btn-edit, .btn-editar');
    const botonesEliminar = document.querySelectorAll('.btn-delete, .btn-eliminar');
    
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
    
    console.log(`Restricciones aplicadas para rol: ${rol}`);
    console.log(`Botones editar encontrados: ${botonesEditar.length}`);
    console.log(`Botones eliminar encontrados: ${botonesEliminar.length}`);
}

// Función para filtrar datos según el rol del usuario
function filtrarDatosPorRol(evaluaciones) {
    if (!usuarioActual) return [];
    
    const rol = usuarioActual.rol;
    console.log(`Filtrando datos para rol: ${rol}, evaluaciones totales: ${evaluaciones.length}`);
    
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
            return filtrarPorPublicacion(evaluaciones);
            
        case 'gop':
            // GOP puede ver evaluaciones de sucursales (solo publicadas)
            const evaluacionesGop = evaluaciones.filter(ev => ev.tipo === 'sucursal');
            const evaluacionesGopPublicadas = filtrarPorPublicacion(evaluacionesGop);
            console.log(`GOP: filtrando ${evaluacionesGopPublicadas.length} sucursales publicadas de ${evaluacionesGop.length} total`);
            return evaluacionesGopPublicadas;
            
        case 'franquicias':
            // Franquicias solo puede ver evaluaciones de franquicias (solo publicadas)
            const evaluacionesFranquicias = evaluaciones.filter(ev => ev.tipo === 'franquicia');
            const evaluacionesFranquiciasPublicadas = filtrarPorPublicacion(evaluacionesFranquicias);
            console.log(`Franquicias: filtrando ${evaluacionesFranquiciasPublicadas.length} franquicias publicadas de ${evaluacionesFranquicias.length} total`);
            return evaluacionesFranquiciasPublicadas;
            
        case 'dg':
        case 'capacitacion':
            // DG y Capacitación pueden ver sucursales y franquicias (solo publicadas)
            const evaluacionesDg = evaluaciones.filter(ev => 
                ev.tipo === 'sucursal' || ev.tipo === 'franquicia'
            );
            const evaluacionesDgPublicadas = filtrarPorPublicacion(evaluacionesDg);
            console.log(`DG/Capacitación: filtrando ${evaluacionesDgPublicadas.length} evaluaciones publicadas (sucursales + franquicias) de ${evaluacionesDg.length} total`);
            return evaluacionesDgPublicadas;
            
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