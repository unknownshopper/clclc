// Configuración de competidores (competencia)
window.competencia = [
  { id: 'cacep', nombre: 'CACEP', activa: true, direccion: 'Ubicación por definir', modelo: 'Cafetería', fechaCreacion: new Date().toISOString() },
  { id: 'starbucks', nombre: 'Starbucks', activa: true, direccion: 'Ubicación por definir', modelo: 'Cafetería', fechaCreacion: new Date().toISOString() },
  { id: 'gloria-jeans', nombre: 'Gloria Jeans', activa: true, direccion: 'Ubicación por definir', modelo: 'Cafetería', fechaCreacion: new Date().toISOString() },
  { id: 'cafeloco', nombre: 'Cafeloco', activa: true, direccion: 'Ubicación por definir', modelo: 'Cafetería', fechaCreacion: new Date().toISOString() },
  { id: 'cafeteria', nombre: 'Cafetería', activa: true, direccion: 'Ubicación por definir', modelo: 'Cafetería', fechaCreacion: new Date().toISOString() }
];

// Función para obtener un competidor por su ID
document.getCompetidorPorId = function(id) {
  return window.competencia.find(c => c.id === id);
};

// Función para obtener todos los competidores activos
document.getCompetidoresActivos = function() {
  return window.competencia.filter(c => c.activa);
};
