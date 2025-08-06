// ========================================
// CONFIGURACIÓN DE SUPABASE
// ========================================
const { createClient } = window.supabase;

const SUPABASE_URL = 'https://amqkgltayhutgvtbkxsf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcWtnbHRheWh1dGd2dGJreHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0OTIzNzUsImV4cCI6MjA3MDA2ODM3NX0.db9Ca41opRPp2ktNmkmiFQYl9ZJv-vgagFaC_IPexZc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========================================
// VARIABLES GLOBALES
// ========================================
let editandoId = null;
let isLoading = false;

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  cargarEmpleados();
  setupEventListeners();
});

function setupEventListeners() {
  // Event listener para el formulario
  const formulario = document.getElementById('formulario-empleado');
  formulario.addEventListener('submit', handleFormSubmit);
  
  // Event listener para la búsqueda por nombre
  const buscarNombre = document.getElementById('buscar-nombre');
  buscarNombre.addEventListener('input', debounce(handleSearch, 300));

  // Event listener para la búsqueda por equipo
  const buscarEquipo = document.getElementById('buscar-equipo');
  buscarEquipo.addEventListener('input', debounce(handleSearch, 300));
}

// ========================================
// MANEJO DEL FORMULARIO
// ========================================
async function handleFormSubmit(e) {
  e.preventDefault();
  
  if (isLoading) return;
  
  const empleadoData = getFormData();
  
  if (!empleadoData.nombre || empleadoData.nombre.length < 2) {
    showNotification('Por favor, ingresa un nombre válido', 'error');
    return;
  }
  
  setLoading(true);
  
  try {
    let resultado;
    
    if (editandoId) {
      resultado = await supabase
        .from('Empleados')
        .update(empleadoData)
        .eq('id', editandoId);
    } else {
      resultado = await supabase
        .from('Empleados')
        .insert([empleadoData]);
    }
    
    if (resultado.error) {
      console.error('❌ Error:', resultado.error.message);
      showNotification('Error: ' + resultado.error.message, 'error');
    } else {
      showNotification(
        editandoId ? '✅ Empleado actualizado correctamente' : '✅ Empleado registrado correctamente',
        'success'
      );
      resetForm();
      cargarEmpleados();
    }
    
  } catch (error) {
    console.error('Error en handleFormSubmit:', error);
    showNotification('❌ Error inesperado. Inténtalo de nuevo.', 'error');
  } finally {
    setLoading(false);
  }
}

function getFormData() {
  return {
    nombre: document.getElementById('nombre').value.trim(),
    ciudad: document.getElementById('ciudad').value.trim(),
    region: document.getElementById('region').value.trim(),
    tipo_asistencia: document.getElementById('tipo_asistencia').value.trim(),
    equipo: document.getElementById('equipo').value.trim(),
    genero: document.getElementById('genero').value.trim(),
    cargo: document.getElementById('cargo').value.trim(),
    dias_trabajo: document.getElementById('dias_trabajo').value.trim()
  };
}

function resetForm() {
  document.getElementById('formulario-empleado').reset();
  editandoId = null;
  const btnSubmit = document.getElementById('btn-submit');
  btnSubmit.innerHTML = '<span class="btn-icon">✨</span>Registrar empleado';
}

// ========================================
// OPERACIONES CRUD
// ========================================
async function cargarEmpleados() {
  setLoading(true);
  
  try {
    const { data, error } = await supabase
      .from('Empleados')
      .select('*')
      .order('id', { ascending: false });
    
    if (error) {
      console.error('❌ Error al cargar empleados:', error.message);
      showNotification('❌ Error al cargar empleados', 'error');
      renderEmpleados([]);
      return;
    }
    
    renderEmpleados(data || []);
    
  } catch (error) {
    console.error('Error en cargarEmpleados:', error);
    showNotification('❌ Error inesperado al cargar empleados', 'error');
    renderEmpleados([]);
  } finally {
    setLoading(false);
  }
}

async function eliminarEmpleado(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este empleado?\n\nEsta acción no se puede deshacer.')) {
    return;
  }
  
  setLoading(true);
  
  try {
    const { error } = await supabase
      .from('Empleados')
      .delete()
      .eq('id', id);
    
    if (error) {
      showNotification(`❌ Error al eliminar: ${error.message}`, 'error');
      return;
    }
    
    showNotification('✅ Empleado eliminado correctamente', 'success');
    cargarEmpleados();
    
  } catch (error) {
    console.error('Error en eliminarEmpleado:', error);
    showNotification('❌ Error inesperado al eliminar', 'error');
  } finally {
    setLoading(false);
  }
}

async function editarEmpleado(id) {
  setLoading(true);
  
  try {
    const { data, error } = await supabase
      .from('Empleados')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      showNotification('❌ Error al obtener datos del empleado', 'error');
      return;
    }
    
    // Llenar el formulario con los datos
    document.getElementById('nombre').value = data.nombre || '';
    document.getElementById('ciudad').value = data.ciudad || '';
    document.getElementById('region').value = data.region || '';
    document.getElementById('tipo_asistencia').value = data.tipo_asistencia || '';
    document.getElementById('equipo').value = data.equipo || '';
    document.getElementById('genero').value = data.genero || '';
    document.getElementById('cargo').value = data.cargo || '';
    document.getElementById('dias_trabajo').value = data.dias_trabajo || '';
    
    // Cambiar el estado del formulario a modo edición
    editandoId = id;
    const btnSubmit = document.getElementById('btn-submit');
    btnSubmit.innerHTML = '<span class="btn-icon">💾</span>Actualizar empleado';
    
    // Scroll al formulario
    document.getElementById('formulario-empleado').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('nombre').focus();
    
    showNotification('📝 Modo edición activado', 'info');
    
  } catch (error) {
    console.error('Error en editarEmpleado:', error);
    showNotification('❌ Error inesperado', 'error');
  } finally {
    setLoading(false);
  }
}

// Nueva función para editar los días de un equipo
async function promptEditTeamDays() {
  const equipo = document.getElementById('edit-equipo-dias').value.trim();
  if (!equipo) {
    showNotification('Por favor, ingresa el nombre de un equipo para editar sus días.', 'warning');
    return;
  }

  const nuevosDias = prompt(`Introduce los nuevos días de trabajo para el equipo "${equipo}":`);
  if (!nuevosDias || nuevosDias.trim() === '') {
    return; // El usuario canceló o no ingresó nada
  }

  setLoading(true);

  try {
      const { error } = await supabase
          .from('Empleados')
          .update({ dias_trabajo: nuevosDias.trim() })
          .eq('equipo', equipo);

      if (error) {
          console.error('Error al actualizar los días del equipo:', error.message);
          showNotification(`❌ Error al actualizar los días del equipo: ${error.message}`, 'error');
      } else {
          showNotification(`✅ Días de trabajo del equipo "${equipo}" actualizados correctamente.`, 'success');
          cargarEmpleados(); // Recargar la tabla para ver los cambios
      }
  } catch (error) {
      console.error('Error en editarDiasDeEquipo:', error);
      showNotification('❌ Error inesperado al actualizar los días del equipo.', 'error');
  } finally {
      setLoading(false);
  }
}

// ========================================
// BÚSQUEDA Y FILTRADO
// ========================================
async function handleSearch() {
  const nombreFiltro = document.getElementById('buscar-nombre').value.trim();
  const equipoFiltro = document.getElementById('buscar-equipo').value.trim();
  
  if (nombreFiltro === '' && equipoFiltro === '') {
    cargarEmpleados();
    return;
  }
  
  let query = supabase.from('Empleados').select('*');

  if (nombreFiltro !== '') {
    query = query.ilike('nombre', `%${nombreFiltro}%`);
  }
  if (equipoFiltro !== '') {
    query = query.ilike('equipo', `%${equipoFiltro}%`);
  }
  
  try {
    const { data, error } = await query;
    
    if (error) {
      console.error('Error en búsqueda:', error.message);
      showNotification('❌ Error en la búsqueda', 'error');
      return;
    }
    
    renderEmpleados(data || []);
    
  } catch (error) {
    console.error('Error en handleSearch:', error);
    showNotification('❌ Error inesperado en la búsqueda', 'error');
  }
}

// ========================================
// RENDERIZADO
// ========================================
function renderEmpleados(empleadosArray) {
  const lista = document.getElementById('lista-empleados');
  
  if (!empleadosArray || empleadosArray.length === 0) {
    lista.innerHTML = `
      <tr class="empty-state">
        <td colspan="9" class="loading-cell">
          <div class="empty-content">
            <span style="font-size: 3rem; opacity: 0.3;">👥</span>
            <p style="margin: 1rem 0; font-weight: 500; color: var(--gray-600);">
              No hay empleados registrados
            </p>
            <p style="color: var(--gray-500); font-size: 0.875rem;">
              Agrega el primer empleado usando el formulario de arriba
            </p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  lista.innerHTML = empleadosArray.map(emp => `
    <tr class="employee-row" data-id="${emp.id}">
      <td class="employee-name">
        <strong>${escapeHtml(emp.nombre || 'Sin nombre')}</strong>
      </td>
      <td>${escapeHtml(emp.ciudad || '-')}</td>
      <td>${escapeHtml(emp.region || '-')}</td>
      <td>
        <span class="badge badge-info">
          ${escapeHtml(emp.tipo_asistencia || '-')}
        </span>
      </td>
      <td>
        <span class="badge badge-primary">
          ${escapeHtml(emp.equipo || '-')}
        </span>
      </td>
      <td>${escapeHtml(emp.genero || '-')}</td>
      <td>
        <span class="badge badge-secondary">
          ${escapeHtml(emp.cargo || '-')}
        </span>
      </td>
      <td>${escapeHtml(emp.dias_trabajo || '-')}</td>
      <td class="actions-cell">
        <div class="actions">
          <button 
            onclick="editarEmpleado(${emp.id})" 
            class="btn-edit"
            title="Editar empleado"
          >
            <span class="btn-icon">✏️</span>
            <span class="btn-text">Editar</span>
          </button>
          <button 
            onclick="eliminarEmpleado(${emp.id})" 
            class="btn-delete"
            title="Eliminar empleado"
          >
            <span class="btn-icon">🗑️</span>
            <span class="btn-text">Eliminar</span>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ========================================
// UTILIDADES Y HELPERS
// ========================================
function setLoading(loading) {
  isLoading = loading;
  
  const loadingOverlay = document.getElementById('loading-overlay');
  const btnSubmit = document.getElementById('btn-submit');
  
  if (loading) {
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.style.opacity = '0.6';
    }
  } else {
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.style.opacity = '1';
    }
  }
}

function showNotification(message, type = 'info') {
  // Remover notificaciones existentes
  const existing = document.querySelectorAll('.notification');
  existing.forEach(n => n.remove());
  
  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
        ×
      </button>
    </div>
  `;
  
  // Estilos inline
  const colors = {
    success: '#059669',
    error: '#dc2626',
    warning: '#d97706',
    info: '#2563eb'
  };
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1001;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    max-width: 400px;
    background: ${colors[type] || colors.info};
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    animation: slideInRight 0.3s ease-in-out;
  `;
  
  // Agregar al DOM
  document.body.appendChild(notification);
  
  // Auto-remover después de 4 segundos
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = 'slideOutRight 0.3s ease-in-out';
      setTimeout(() => notification.remove(), 300);
    }
  }, 4000);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.toString().replace(/[&<>"']/g, m => map[m]);
}

// ========================================
// FUNCIONES GLOBALES (para onclick en HTML)
// ========================================
window.eliminarEmpleado = eliminarEmpleado;
window.editarEmpleado = editarEmpleado;
window.cargarEmpleados = cargarEmpleados;
window.promptEditTeamDays = promptEditTeamDays;

// ========================================
// MANEJO DE ERRORES GLOBALES
// ========================================
window.addEventListener('error', (e) => {
  console.error('Error global:', e.error);
  showNotification('❌ Ha ocurrido un error inesperado', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Promise rechazada:', e.reason);
  showNotification('❌ Error de conexión', 'error');
  e.preventDefault();
});