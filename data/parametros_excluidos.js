// data/parametros_excluidos.js

// Mapea el ID de la sucursal al array de parámetros excluidos
window.parametrosExcluidosPorSucursal = {
    // Usa el ID real de cada sucursal/franquicia aquí:
    "altabrisa": [
      "Jardineras y macetas",
      "Puertas y vidrios",
      "Música y volumen",
      "Estado de baños",
      "Tiempo en fila"
    ],
    "americas": [
      "Jardineras y macetas",
      "Puertas y vidrios",
      "Música y volumen",
      "Estado de baños",
      "Tiempo en fila"
    ],
    "centro": [
      "Jardineras y macetas",
      "Música y volumen",
      "Estado de botes de basura",
      "Tiempo en fila"
    ],
    "crystal": [
      "Jardineras y macetas",
      "Puertas y vidrios",
      "Música y volumen",
      "Estado de baños",
      "Tiempo en fila"
    ],
    "galerias": [
      "Jardineras y macetas",
      "Puertas y vidrios",
      "Música y volumen",
      "Estado de baños",
      "Tiempo en fila"
    ],
    "angeles": [
      "Jardineras y macetas",
      "Puertas y vidrios",
      "Música y volumen",
      "Estado de baños",
      "Tiempo en fila"
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
      "Estado de baños",
      "Estado de botes de basura",
      "Limpieza de barra",
      "Estado de muebles"
    ],

    "deportiva": [
      "Puertas y vidrios",
      "Tiempo en fila"
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
      "Jardineras y macetas",
      "Tiempo en fila"
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
      "Estado de muebles",
      "Tiempo en fila"
    ],
    "walmart-carrizal": [
      "Uso de tableta",
      "Jardineras y macetas",
      "Puertas y vidrios",
      "Música y volumen",
      "Estado de baños",
      "Tiempo en fila"
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
      "Estado de muebles",
      "Tiempo en fila"
    ],
    "walmart-universidad": [
      "Uso de tableta",
      "Jardineras y macetas",
      "Puertas y vidrios",
      "Música y volumen",
      "Estado de baños",
      "Tiempo en fila"
    ],
    "usuma": [
      "Jardineras y macetas",
      "Música y volumen",
      "Estado de botes de basura",
      "Tiempo en fila"
    ],
   
  };

  // Mapea el ID de la franquicia al array de parámetros excluidos
window.parametrosExcluidosPorFranquicia = {
  // Franquicias cafetería
  "via2": [
    "Jardineras y macetas",
    "Puertas y vidrios",
    "Música y volumen",
    "Estado de baños",
    "Tiempo en fila"
  ],
  "citycenter": [
    "Jardineras y macetas",
    "Puertas y vidrios",
    "Música y volumen",
    "Estado de baños",
    "Tiempo en fila"
  ],
  "cardenas": [
    "Jardineras y macetas",
    "Puertas y vidrios",
    "Música y volumen",
    "Estado de baños",
    "Tiempo en fila"
  ],
  "paraiso": [
    "Jardineras y macetas",
    "Puertas y vidrios",
    "Música y volumen",
    "Estado de baños",
    "Tiempo en fila"
  ],
  "cunduacan": [
    "Jardineras y macetas",
    "Puertas y vidrios",
    "Música y volumen",
    "Estado de baños",
    "Tiempo en fila"
  ],
  "jalpa": [
    "Jardineras y macetas",
    "Puertas y vidrios",
    "Música y volumen",
    "Estado de baños",
    "Tiempo en fila"
  ],
  "cd-carmen": [
    "Jardineras y macetas",
    "Puertas y vidrios",
    "Música y volumen",
    "Estado de baños",
    "Tiempo en fila"
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