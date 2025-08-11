// data/parametros_excluidos.js

// Mapea el ID de la sucursal al array de parámetros excluidos
window.parametrosExcluidosPorSucursal = {
    // Usa el ID real de cada sucursal/franquicia aquí:
    "altabrisa": [
      "Contacto visual y saludo",
      "APP Cabaña Cash",
      "Jardineras y macetas",
      "Puertas y vidrios",
      "Música y volumen",
      "Estado de baños"
    ],
    "americas": [
      "Pin personalizador",
      "Jardineras y macetas",
      "Puertas y vidrios",
      "Música y volumen",
      "Estado de baños"
    ],
    "centro": [
      "Jardineras y macetas",
      "Música y volumen",
      "Estado de botes de basura"
    ],
    "crystal": [
      "Jardineras y macetas",
      "Puertas y vidrios",
      "Música y volumen",
      "Estado de baños"
    ],
    "galerias": [
      "Jardineras y macetas",
      "Puertas y vidrios",
      "Música y volumen",
      "Estado de baños"
    ],
    "angeles": [
      "Jardineras y macetas",
      "Puertas y vidrios",
      "Música y volumen",
      "Estado de baños"
    ],
    "guayabal": [
      "Uso de tableta",
      "Jardineras y macetas",
      "Música y volumen",
      "Estado de baños",
      "Tiempo en fila"
    ],
    "movil-deportiva": [
      "Atención en mesa",
      "Uso de tableta",
      "Puertas y vidrios",
      "Música y volumen",
      "Limpieza de mesas y sillas",
      "Estado de muebles",
      "Estado de baños",
      "Estado de botes de basura",
      "Limpieza de barra",
      "Estado de muebles"
    ],
    "deportiva": [
      "Puertas y vidrios"
    ],
    "movil-la-venta": [
      "Atención en mesa",
      "Uso de tableta",
      "Jardineras y macetas",
      "Puertas y vidrios",
      "Música y volumen",
      "Limpieza de mesas y sillas",
      "Limpieza de pisos",
      "Estado de baños",
      "Estado de botes de basura",
      "Limpieza de barra",
      "Estado de muebles"
    ],
    "olmeca": [
      "Jardineras y macetas"
    ],
    "pista": [
      "Atención en mesa",
      "Uso de tableta",
      "Jardineras y macetas",
      "Puertas y vidrios",
      "Música y volumen",
      "Limpieza de mesas y sillas",
      "Limpieza de pisos",
      "Estado de baños",
      "Estado de botes de basura",
      "Climatización",
      "Estado de muebles"
    ],
    "walmart-carrizal": [
      "Uso de tableta",
      "Jardineras y macetas",
      "Puertas y vidrios",
      "Música y volumen",
      "Estado de baños"
    ],
    "walmart-deportiva": [
      "Atención en mesa",
      "Uso de tableta",
      "Jardineras y macetas",
      "Puertas y vidrios",
      "Música y volumen",
      "Limpieza de mesas y sillas",
      "Limpieza de pisos",
      "Estado de baños",
      "Estado de botes de basura",
      "Estado de muebles"
    ],
    "walmart-universidad": [
      "Uso de tableta",
      "Jardineras y macetas",
      "Puertas y vidrios",
      "Música y volumen",
      "Estado de baños"
    ],
    "usuma": [
      "Jardineras y macetas",
      "Música y volumen",
      "Estado de botes de basura"
    ],
    "dosbocas": [
      "Atención en mesa",
      "Uso de tableta",
      "Jardineras y macetas",
      "Puertas y vidrios",
      "Música y volumen",
      "Limpieza de mesas y sillas",
      "Limpieza de pisos",
      "Estado de baños",
      "Estado de botes de basura",
      "Limpieza de barra",
      "Estado de muebles"
    ]
  };

  // Mapea el ID de la franquicia al array de parámetros excluidos
window.parametrosExcluidosPorFranquicia = {
  // Franquicias cafetería
  "via2": [
    "Contacto visual y saludo",
    "Jardineras y macetas",
    "Puertas y vidrios",
    "Música y volumen",
    "Estado de baños"
  ],
  "citycenter": [
    "Jardineras y macetas",
    "Puertas y vidrios",
    "Música y volumen",
    "Estado de baños"
  ],
  "cardenas": [
    "Jardineras y macetas",
    "Puertas y vidrios",
    "Música y volumen",
    "Estado de baños"
  ],
  "paraiso": [
    "Jardineras y macetas",
    "Puertas y vidrios",
    "Música y volumen",
    "Estado de baños"
  ],
  "cunduacan": [
    "Jardineras y macetas",
    "Puertas y vidrios",
    "Música y volumen",
    "Estado de baños"
  ],
  "jalpa": [
    "Jardineras y macetas",
    "Puertas y vidrios",
    "Música y volumen",
    "Estado de baños"
  ],
  "cd-carmen": [
    "Jardineras y macetas",
    "Puertas y vidrios",
    "Música y volumen",
    "Estado de baños"
  ],

  // Franquicias móviles
  "cumuapa": [
    "Atención en mesa",
    "Uso de tableta",
    "Jardineras y macetas",
    "Puertas y vidrios",
    "Música y volumen",
    "Limpieza de mesas y sillas",
    "Limpieza de pisos",
    "Estado de baños",
    "Estado de botes de basura",
    "Limpieza de barra",
    "Estado de muebles"
  ],
  "dosbocas": [
    "Atención en mesa",
    "Uso de tableta",
    "Jardineras y macetas",
    "Puertas y vidrios",
    "Música y volumen",
    "Limpieza de mesas y sillas",
    "Limpieza de pisos",
    "Estado de baños",
    "Estado de botes de basura",
    "Limpieza de barra",
    "Estado de muebles"
  ]
};
  
window.obtenerParametrosExcluidos = function(sucursalId) {
    return window.parametrosExcluidosPorSucursal[sucursalId] || [];
}
window.obtenerParametrosExcluidosFranquicia = function(franquiciaId) {
    return window.parametrosExcluidosPorFranquicia[franquiciaId] || [];
}