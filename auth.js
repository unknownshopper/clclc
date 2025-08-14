// ===== SISTEMA DE AUTENTICACIÓN Y CONTROL DE ACCESO =====
let usuarioActual = null;

// Función para iniciar sesión
function iniciarSesion() {
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
    const usuario = window.usuarios.find(u => u.email === email && u.password === password);
    
    if (usuario) {
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
function cerrarSesion() {
    usuarioActual = null;
    localStorage.removeItem('usuarioActual');
    
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
        if (btnNuevaEvaluacion) btnNuevaEvaluacion.style.display = 'inline-block';
        botonesEditar.forEach(btn => btn.style.display = 'inline-flex');
        botonesEliminar.forEach(btn => btn.style.display = 'inline-flex');
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
    
    switch (rol) {
        case 'admin':
            // Admin puede ver todo
            return evaluaciones;
            
        case 'gop':
            // Gop solo puede ver evaluaciones de GOP
            return evaluaciones.filter(eval => {
                return eval.tipo === 'gop' || 
                       (eval.entidadId && eval.entidadId.toLowerCase().includes('gop'));
            });
            
        case 'franquicias':
            // Franquicias solo puede ver evaluaciones de franquicias
            return evaluaciones.filter(eval => eval.tipo === 'franquicia');
            
        case 'dg':
            // DG puede ver sucursales y franquicias
            return evaluaciones.filter(eval => 
                eval.tipo === 'sucursal' || eval.tipo === 'franquicia'
            );
            
        default:
            return [];
    }
}

// Función para verificar permisos de acción
function tienePermiso(accion) {
    if (!usuarioActual) return false;
    
    const rol = usuarioActual.rol;
    
    switch (accion) {
        case 'crear':
        case 'editar':
        case 'eliminar':
            return rol === 'admin';
        case 'ver':
            return true; // Todos pueden ver (pero con filtros)
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