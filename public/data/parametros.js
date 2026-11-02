// Categorías de evaluación (estructura oficial vigente desde oct-2026)
const categorias = [
  {
    id: 'experiencia_servicio',
    nombre: 'Experiencia y servicio al cliente',
    descripcion: 'Atención, servicio y experiencia del cliente',
    peso: 30,
    aplicaATodas: true
  },
  {
    id: 'producto_calidad',
    nombre: 'Producto y calidad',
    descripcion: 'Calidad y presentación del producto',
    peso: 25,
    aplicaATodas: true
  },
  {
    id: 'desempeno_comercial',
    nombre: 'Desempeño comercial',
    descripcion: 'Ventas y desempeño comercial',
    peso: 20,
    aplicaATodas: true
  },
  {
    id: 'operacion_orden',
    nombre: 'Operación, orden e imagen',
    descripcion: 'Operación, orden e imagen de la sucursal',
    peso: 25,
    aplicaATodas: false
  }
];

// Parámetros de evaluación
const definirParametros = [
  // ===== Experiencia y servicio al cliente =====
  {
    id: 'bienvenida_contacto_visual',
    categoriaId: 'experiencia_servicio',
    nombre: 'Contacto visual y saludo',
    descripcion: 'El colaborador lo saludó verbalmente y estableció contacto visual',
    tipo: 'booleano',
    peso:4,
    aplicaATodas: true
  },
  {
    id: 'bienvenida_agradecimiento',
    categoriaId: 'experiencia_servicio',
    nombre: 'Agradecimiento y despedida',
    descripcion: 'El colaborador dio las gracias e invitó a volver',
    tipo: 'booleano',
    peso: 2,
    aplicaATodas: true
  },
  {
    id: 'conocimiento_productos',
    categoriaId: 'experiencia_servicio',
    nombre: 'Conocimiento de productos',
    descripcion: 'Demostró conocimiento de los productos',
    tipo: 'booleano',
    peso: 2,
    aplicaATodas: true
  },
  {
    id: 'tiempo_espera_atencion',
    categoriaId: 'experiencia_servicio',
    nombre: 'Tiempo de espera de atención',
    descripcion: 'Tiempo total de espera de atención',
    tipo: 'rango',
    opciones: ['Menos de 2 min', '2-5 min', '5-10 min', 'Más de 10 min'],
    peso: 3,
    aplicaATodas: true
  },
  {
    id: 'tiempo_fila',
    categoriaId: 'experiencia_servicio',
    nombre: 'Tiempo en fila',
    descripcion: 'Tiempo total en la fila',
    tipo: 'rango',
    opciones: ['Menos de 2 min', '2-5 min', '5-10 min', 'Más de 10 min'],
    peso: 3,
    aplicaATodas: false
  },
  {
    id: 'atencion_mesa',
    categoriaId: 'experiencia_servicio',
    nombre: 'Atención en mesa',
    descripcion: 'Se acercaron a la mesa para identificar necesidades/recoger',
    tipo: 'booleano',
    peso: 2,
    aplicaATodas: false
  },
  {
    id: 'entrega_ticket',
    categoriaId: 'experiencia_servicio',
    nombre: 'Entrega de ticket',
    descripcion: 'Se entregó el ticket',
    tipo: 'booleano',
    peso: 3,
    aplicaATodas: true
  },
  {
    id: 'apariencia_personal',
    categoriaId: 'experiencia_servicio',
    nombre: 'Apariencia del personal',
    descripcion: 'Los colaboradores estaban limpios y de buena apariencia (uniformes negros, incluir PIN)',
    tipo: 'booleano',
    peso: 3,
    aplicaATodas: true
  },
  {
    id: 'pin_personalizador',
    categoriaId: 'experiencia_servicio',
    nombre: 'Pin personalizador',
    descripcion: 'Uso del pin personalizador',
    tipo: 'booleano',
    peso: 4,
    aplicaATodas: true
  },
  {
    id: 'musica_volumen',
    categoriaId: 'experiencia_servicio',
    nombre: 'Música y volumen',
    descripcion: 'Música con volumen adecuado (instrumental o bossa nova)',
    tipo: 'booleano',
    peso: 2,
    aplicaATodas: false
  },
  {
    id: 'actitud_servicio',
    categoriaId: 'experiencia_servicio',
    nombre: 'Actitud de servicio (bono)',
    descripcion: 'Bonificación por atención amable y disposición extraordinaria; la otorga Dirección de Operaciones',
    tipo: 'booleano',
    peso: 3,
    soloKPI2: true,
    bono: true,
    aplicaATodas: false,
    aplicaASucursales: [],
    aplicaAFranquicias: []
  },

  // ===== Producto y calidad =====
  {
    id: 'tiempo_espera_cafe',
    categoriaId: 'producto_calidad',
    nombre: 'Tiempo de preparación',
    descripcion: 'Tiempo de espera para el café',
    tipo: 'rango',
    opciones: ['Menos de 2 min', '2-5 min', '5-10 min', 'Más de 10 min'],
    peso: 4,
    aplicaATodas: true
  },
  {
    id: 'presentacion_vaso',
    categoriaId: 'producto_calidad',
    nombre: 'Presentación del vaso',
    descripcion: 'Anotaron en el vaso el producto sin tachones ni manchas',
    tipo: 'booleano',
    peso: 4,
    aplicaATodas: true
  },
  {
    id: 'presentacion_cafe',
    categoriaId: 'producto_calidad',
    nombre: 'Presentación del café',
    descripcion: 'Presentación del café adecuada (sin manchas)',
    tipo: 'booleano',
    peso: 6,
    aplicaATodas: true
  },
  {
    id: 'presentacion_alimento',
    categoriaId: 'producto_calidad',
    nombre: 'Presentación de alimentos',
    descripcion: 'Presentación visual correcta del alimento',
    tipo: 'booleano',
    peso: 6,
    aplicaATodas: true
  },
  {
    id: 'panera_estado',
    categoriaId: 'producto_calidad',
    nombre: 'Estado de la panera',
    descripcion: 'Panera limpia, ordenada y surtida (platos sin migajas)',
    tipo: 'booleano',
    peso: 1,
    aplicaATodas: true
  },
  {
    id: 'existencia',
    categoriaId: 'producto_calidad',
    nombre: 'Existencia',
    descripcion: 'Existencia de producto para venta',
    tipo: 'booleano',
    peso: 5,
    vigenteDesde: '2026-03',
    soloKPI2: true,
    aplicaATodas: true
  },

  // ===== Desempeño comercial =====
  {
    id: 'venta_cruzada',
    categoriaId: 'desempeno_comercial',
    nombre: 'Venta cruzada',
    descripcion: 'Ofreció productos adicionales (venta cruzada o sugerida)',
    tipo: 'booleano',
    peso: 5,
    aplicaATodas: true
  },
  {
    id: 'app_cabana',
    categoriaId: 'desempeno_comercial',
    nombre: 'APP Cabaña Cash',
    descripcion: 'Mencionó la APP Cabaña Cash para acumular puntos o registrarse',
    tipo: 'booleano',
    peso: 7,
    aplicaATodas: true
  },
  {
    id: 'mencion_promociones',
    categoriaId: 'desempeno_comercial',
    nombre: 'Menciona promociones',
    descripcion: 'Mencionó promociones vigentes (producto/temporada/dinámica comercial)',
    tipo: 'booleano',
    peso: 3,
    vigenteDesde: '2026-04',
    soloKPI2: true,
    aplicaATodas: false,
    aplicaASucursales: [
      'altabrisa',
      'americas',
      'angeles',
      'galerias',
      'centro',
      'olmeca',
      'usuma',
      'pista',
      'guayabal',
      'crystal',
      'deportiva',
      'walmart-deportiva',
      'walmart-carrizal',
      'walmart-universidad',
      'movil-deportiva',
      'movil-la-venta'
    ]
  },
  {
    id: 'producto_mes',
    categoriaId: 'desempeno_comercial',
    nombre: 'Producto del mes',
    descripcion: 'Mencionó el producto del mes',
    tipo: 'booleano',
    peso: 3,
    aplicaATodas: true
  },

  // ===== Operación, orden e imagen =====
  {
    id: 'fachada_limpieza',
    categoriaId: 'operacion_orden',
    nombre: 'Limpieza de fachada',
    descripcion: 'Fachada y accesos limpios',
    tipo: 'booleano',
    peso: 1,
    aplicaATodas: true
  },
  {
    id: 'letrero_anuncio',
    categoriaId: 'operacion_orden',
    nombre: 'Letrero/anuncio',
    descripcion: 'Estado del letrero/anuncio',
    tipo: 'booleano',
    peso: 1,
    aplicaATodas: true
  },
  {
    id: 'jardineras_macetas',
    categoriaId: 'operacion_orden',
    nombre: 'Jardineras y macetas',
    descripcion: 'Jardineras y macetas en buen estado y limpias',
    tipo: 'booleano',
    peso: 1,
    aplicaATodas: false
  },
  {
    id: 'interfon',
    categoriaId: 'operacion_orden',
    nombre: 'Interfón',
    descripcion: 'Interfón de atención a vehículos funcionando correctamente',
    tipo: 'booleano',
    peso: 1,
    vigenteDesde: '2026-10',
    soloKPI2: true,
    aplicaATodas: false,
    // Aplica a cualquier entidad cuyo modelo incluya Móvil (pura o combinada),
    // salvo exclusión manual desde el panel de Ponderancias.
    aplicaAModelos: ['Móvil']
  },
  {
    id: 'iluminacion',
    categoriaId: 'operacion_orden',
    nombre: 'Iluminación',
    descripcion: 'Iluminación interior en buen estado',
    tipo: 'booleano',
    peso: 2,
    aplicaATodas: false
  },
  {
    id: 'area_mostrador',
    categoriaId: 'operacion_orden',
    nombre: 'Área de mostrador',
    descripcion: 'Área de mostrador con orden y limpieza',
    tipo: 'booleano',
    peso: 2,
    aplicaATodas: false
  },
  {
    id: 'mesas_sillas_limpieza',
    categoriaId: 'operacion_orden',
    nombre: 'Limpieza de mesas y sillas',
    descripcion: 'Sillas y mesas (dentro y fuera) limpias',
    tipo: 'booleano',
    peso: 2,
    aplicaATodas: false
  },
  {
    id: 'puertas_vidrios',
    categoriaId: 'operacion_orden',
    nombre: 'Puertas y vidrios',
    descripcion: 'Puertas de acceso y vidrios limpios',
    tipo: 'booleano',
    peso: 2,
    aplicaATodas: false
  },
  {
    // Desde oct-2026 sustituye a piso_limpieza
    id: 'presentacion_tienda',
    categoriaId: 'operacion_orden',
    nombre: 'Presentación general de la tienda',
    descripcion: 'Presentación general de la tienda: orden, limpieza e imagen global',
    tipo: 'booleano',
    peso: 3,
    vigenteDesde: '2026-10',
    aplicaATodas: true
  },
  {
    id: 'barra_limpieza',
    categoriaId: 'operacion_orden',
    nombre: 'Orden del área de trabajo',
    descripcion: 'Área de trabajo y barra trasera limpias y ordenadas',
    tipo: 'booleano',
    peso: 1,
    aplicaATodas: false
  },
  {
    id: 'piso_limpieza',
    categoriaId: 'operacion_orden',
    nombre: 'Limpieza de pisos',
    descripcion: 'Piso limpio',
    tipo: 'booleano',
    peso: 3,
    vigenteHasta: '2026-09',
    sustituidoPor: 'presentacion_tienda',
    aplicaATodas: false
  },
  {
    id: 'banos_estado',
    categoriaId: 'operacion_orden',
    nombre: 'Estado de baños',
    descripcion: 'Baños limpios (vidrios, olor, papel, jabón)',
    tipo: 'booleano',
    peso: 2,
    aplicaATodas: false
  },
  {
    id: 'basura_estado',
    categoriaId: 'operacion_orden',
    nombre: 'Estado de botes de basura',
    descripcion: 'Botes de basura limpios y no llenos',
    tipo: 'booleano',
    peso: 2,
    aplicaATodas: false
  },
  {
    id: 'clima_funcionando',
    categoriaId: 'operacion_orden',
    nombre: 'Climatización',
    descripcion: 'Climatización funcionando correctamente',
    tipo: 'booleano',
    peso: 4,
    aplicaATodas: true
  },
  {
    id: 'mesas_sillas_estado',
    categoriaId: 'operacion_orden',
    nombre: 'Estado de muebles',
    descripcion: 'Mesas y sillas en buen estado físico',
    tipo: 'booleano',
    peso: 3,
    aplicaATodas: false
  },
  {
    id: 'tableta',
    categoriaId: 'operacion_orden',
    nombre: 'Uso de tableta',
    descripcion: 'Estado y uso de la tableta',
    tipo: 'booleano',
    peso: 3,
    aplicaATodas: false,
    aplicaASucursales: [
      'galerias',
      'altabrisa',
      'crystal',
      'olmeca',
      'deportiva',
      'usuma',
      'centro',
      'angeles',
      'americas'
    ],
    aplicaAFranquicias: [
      'dosbocas'
    ]
  },
  {
    id: 'cantidad_colaboradores',
    categoriaId: 'operacion_orden',
    nombre: 'Cantidad de colaboradores',
    descripcion: 'Cantidad de colaboradores en la sucursal',
    tipo: 'numero',
    peso: 1,
    aplicaATodas: true
  }
];

// Asigna los parámetros al objeto global window
window.parametros = definirParametros;

// Funciones de utilidad

/**
 * Obtiene los parámetros agrupados por categoría
 * @returns {Object} Objeto con los parámetros agrupados por categoría
 */
function getParametrosPorCategoria() {
  return categorias.map(categoria => ({
    ...categoria,
    parametros: window.parametros.filter(p => p.categoriaId === categoria.id)
  }));
}

/**
 * Obtiene un parámetro por su ID
 * @param {string} id - ID del parámetro a buscar
 * @returns {Object} Parámetro encontrado o undefined
 */
function getParametroPorId(id) {
  return window.parametros.find(p => p.id === id);
}

/**
 * Obtiene los parámetros que aplican a una sucursal específica
 * @param {string} sucursalId - ID de la sucursal
 * @returns {Array} Lista de parámetros que aplican a la sucursal
 */
function getParametrosParaSucursal(sucursalId) {
  return window.parametros.filter(p => 
    p.aplicaATodas || 
    (p.sucursalesEspecificas && p.sucursalesEspecificas.includes(sucursalId))
  );
}

/**
 * Calcula el puntaje máximo posible para una evaluación
 * @param {string} sucursalId - ID de la sucursal (opcional)
 * @returns {number} Puntaje máximo posible
 */
function getPuntajeMaximo(sucursalId = null) {
  const params = sucursalId ? getParametrosParaSucursal(sucursalId) : window.parametros;
  return params.reduce((total, param) => total + param.peso, 0);
}
