// Versión mínima pública de Competencia para evitar errores y mostrar contenido básico
(function(){
  // Utilidades simples
  function formatearMesLegible(mes) {
    if (!mes) return '';
    const [y,m] = mes.split('-');
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return `${meses[parseInt(m,10)-1]} ${y}`;
  }

  // Render básico de competencia
  window.renderCompetencia = function renderCompetencia() {
    const container = document.getElementById('competencia');
    if (!container) return;

    const competidores = Array.isArray(window.competencia) ? window.competencia.filter(c => c.activa) : [];

    let html = `
      <div style="margin-bottom: 20px;">
        <h2 style="color:#dc3545; margin-bottom: 10px; text-align:center;">Competencia - ${formatearMesLegible(window.mesSeleccionado || '')}</h2>
        <p style="text-align:center; color:#666;">Versión básica pública. Para funcionalidades completas, use la app principal.</p>
      </div>
    `;

    if (competidores.length === 0) {
      html += `
        <div style="text-align:center; padding: 40px; color:#666; background:#f8f9fa; border-radius:8px;">
          <i class="fas fa-users-slash" style="font-size:3rem; color:#ccc; margin-bottom:1rem;"></i>
          <h3>No hay competidores activos</h3>
        </div>
      `;
      container.innerHTML = html;
      return;
    }

    html += '<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:16px;">';

    competidores.forEach(comp => {
      html += `
        <div style="background:white; border:1px solid #eee; border-radius:10px; padding:16px; box-shadow:0 2px 6px rgba(0,0,0,0.06);">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
            <h3 style="margin:0; color:#333; font-size:1.1rem;">${comp.nombre}</h3>
            <span style="background:#dc3545; color:white; padding:2px 8px; border-radius:12px; font-size:12px;">Competencia</span>
          </div>
          <div style="font-size:12px; color:#666; margin-bottom:10px;">${comp.modelo || 'Cafetería'}</div>
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <div style="color:#666; font-size:12px;">${comp.direccion || ''}</div>
          </div>
        </div>
      `;
    });

    html += '</div>';

    container.innerHTML = html;
  };
})();
