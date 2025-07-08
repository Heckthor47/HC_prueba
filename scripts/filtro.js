import { municipiosGeoJson } from './mapa_config.js';
import { estadosGeoJson } from './mapa_config.js';
import { activarVistaLocal } from './mapa_config.js';

// ==========================
// Diccionario de estados (CVE_ENT -> nombre y key)
// ==========================
const diccionarioEstados = {
  "01": { label: "Aguascalientes", value: "calles01" },
  "02": { label: "Baja California", value: "calles02" },
  "03": { label: "Baja California Sur", value: "calles03" },
  "04": { label: "Campeche", value: "calles04" },
  "05": { label: "Coahuila", value: "calles05" },
  "06": { label: "Colima", value: "calles06" },
  "07": { label: "Chiapas", value: "calles07" },
  "08": { label: "Chihuahua", value: "calles08" },
  "09": { label: "Ciudad de México", value: "calles09" },
  "10": { label: "Durango", value: "calles10" },
  "11": { label: "Guanajuato", value: "calles11" },
  "12": { label: "Guerrero", value: "calles12" },
  "13": { label: "Hidalgo", value: "calles13" },
  "14": { label: "Jalisco", value: "calles14" },
  "15": { label: "Estado de México", value: "calles15" },
  "16": { label: "Michoacán", value: "calles16" },
  "17": { label: "Morelos", value: "calles17" },
  "18": { label: "Nayarit", value: "calles18" },
  "19": { label: "Nuevo León", value: "calles19" },
  "20": { label: "Oaxaca", value: "calles20" },
  "21": { label: "Puebla", value: "calles21" },
  "22": { label: "Querétaro", value: "calles22" },
  "23": { label: "Quintana Roo", value: "calles23" },
  "24": { label: "San Luis Potosí", value: "calles24" },
  "25": { label: "Sinaloa", value: "calles25" },
  "26": { label: "Sonora", value: "calles26" },
  "27": { label: "Tabasco", value: "calles27" },
  "28": { label: "Tamaulipas", value: "calles28" },
  "29": { label: "Tlaxcala", value: "calles29" },
  "30": { label: "Veracruz", value: "calles30" },
  "31": { label: "Yucatán", value: "calles31" },
  "32": { label: "Zacatecas", value: "calles32" }
};

// ==========================
// Custom element: dropdown
// ==========================
class DropdownFiltrosUbicacion extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="dropdown-filtros-ubicacion">
        <div class="grupo-estado">
          <label for="select-estado">Selecciona un estado:</label>
          <div class="estado-container">
            <input type="text" 
                   id="search-estado" 
                   placeholder="Cargando estados..." 
                   disabled 
                   readonly>
            <div id="estado-dropdown">
            </div>
            <select id="select-estado" style="display: none;">
              <option disabled selected>Cargando estados...</option>
            </select>
          </div>
        </div>
        <div class="grupo-municipio">
          <label for="select-municipio">Selecciona un municipio:</label>
          <div class="municipio-container">
            <input type="text" 
                   id="search-municipio" 
                   placeholder="-- Municipio --" 
                   disabled 
                   readonly>
            <div id="municipio-dropdown">
            </div>
            <select id="select-municipio" disabled style="display: none;">
              <option value="">-- Municipio --</option>
            </select>
          </div>
        </div>
      </div>
    `;
    this.estadoSelect = this.querySelector('#select-estado');
    this.municipioSelect = this.querySelector('#select-municipio');
    this.searchEstado = this.querySelector('#search-estado');
    this.estadoDropdown = this.querySelector('#estado-dropdown');
    this.searchMunicipio = this.querySelector('#search-municipio');
    this.municipioDropdown = this.querySelector('#municipio-dropdown');
    this.estados = [];
    this.municipiosOriginales = []; // Para guardar la lista completa
    this.isEstadoDropdownOpen = false;
    this.isDropdownOpen = false;
    this._initListeners();
  }

  _initListeners() {
    // ===== LISTENERS PARA ESTADO =====
    
    // Click en el input para abrir/cerrar dropdown de estado
    this.searchEstado.addEventListener('click', (e) => {
      if (!this.searchEstado.disabled) {
        this._toggleEstadoDropdown();
      }
    });

    // Focus en el input de estado
    this.searchEstado.addEventListener('focus', (e) => {
      if (!this.searchEstado.disabled && !this.isEstadoDropdownOpen) {
        this._openEstadoDropdown();
      }
    });

    // Input para búsqueda en tiempo real de estado
    this.searchEstado.addEventListener('input', (e) => {
      if (this.searchEstado.disabled) return;
      
      if (!this.isEstadoDropdownOpen) {
        this._openEstadoDropdown();
      }
      this._filterEstados(e.target.value);
      
      // Auto-seleccionar si solo hay un resultado
      const filtered = this.estados.filter(estado =>
        estado.label.toLowerCase().includes(e.target.value.toLowerCase())
      );
      
      if (filtered.length === 1 && e.target.value.trim() !== '') {
        // Resaltar automáticamente el único resultado
        setTimeout(() => {
          const firstItem = this.estadoDropdown.querySelector('div[data-value]');
          if (firstItem) {
            this._highlightEstadoItem(firstItem);
          }
        }, 50);
      }
    });

    // Teclas especiales para estado
    this.searchEstado.addEventListener('keydown', (e) => {
      if (this.searchEstado.disabled) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!this.isEstadoDropdownOpen) {
          this._openEstadoDropdown();
        }
        this._navigateEstadoDropdown(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!this.isEstadoDropdownOpen) {
          this._openEstadoDropdown();
        }
        this._navigateEstadoDropdown(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (this.isEstadoDropdownOpen) {
          this._selectHighlightedEstado();
        } else {
          this._openEstadoDropdown();
        }
      } else if (e.key === 'Escape') {
        this._closeEstadoDropdown();
        this.searchEstado.blur();
      } else if (e.key === 'Tab') {
        this._closeEstadoDropdown();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        if (this.searchEstado.value === '' && !this.isEstadoDropdownOpen) {
          // Limpiar selección si está vacío
          this.estadoSelect.value = '';
          this.estadoSelect.dispatchEvent(new Event('change'));
        }
      }
    });

    // Listener para cambios en el select oculto de estado (para compatibilidad)
    this.estadoSelect.addEventListener('change', () => {
      if (!this.estadoSelect || !this.estadoSelect.value) {
        console.warn("El selector de estado no tiene un valor válido.");
        return;
      }

      const estado = this.estados.find(e => e.value === this.estadoSelect.value);
      if (estado) {
        this.municipiosOriginales = estado.municipios; // Guardar lista completa
        this._resetMunicipioInput();
        this.searchMunicipio.disabled = false;
        this.searchMunicipio.readOnly = true;
        this.municipioSelect.disabled = false;
      } else {
        this.municipiosOriginales = [];
        this._resetMunicipioInput();
        this.searchMunicipio.disabled = true;
        this.municipioSelect.disabled = true;
      }

      // Disparar evento personalizado
      this.dispatchEvent(new CustomEvent('estado-change', {
        detail: { value: this.estadoSelect.value },
        bubbles: true
      }));
    });

    // ===== LISTENERS PARA MUNICIPIO =====

    // Click en el input para abrir/cerrar dropdown
    this.searchMunicipio.addEventListener('click', (e) => {
      if (!this.searchMunicipio.disabled) {
        this._toggleDropdown();
      }
    });

    // Focus en el input
    this.searchMunicipio.addEventListener('focus', (e) => {
      if (!this.searchMunicipio.disabled && !this.isDropdownOpen) {
        this._openDropdown();
      }
    });

    // Input para búsqueda en tiempo real
    this.searchMunicipio.addEventListener('input', (e) => {
      if (!this.isDropdownOpen) {
        this._openDropdown();
      }
      this._filterMunicipios(e.target.value);
      
      // Auto-seleccionar si solo hay un resultado
      const filtered = this.municipiosOriginales.filter(municipio =>
        municipio.label.toLowerCase().includes(e.target.value.toLowerCase())
      );
      
      if (filtered.length === 1 && e.target.value.trim() !== '') {
        // Resaltar automáticamente el único resultado
        setTimeout(() => {
          const firstItem = this.municipioDropdown.querySelector('div[data-value]');
          if (firstItem) {
            this._highlightItem(firstItem);
          }
        }, 50);
      }
    });

    // Teclas especiales
    this.searchMunicipio.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!this.isDropdownOpen) {
          this._openDropdown();
        }
        this._navigateDropdown(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!this.isDropdownOpen) {
          this._openDropdown();
        }
        this._navigateDropdown(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (this.isDropdownOpen) {
          this._selectHighlighted();
        } else {
          this._openDropdown();
        }
      } else if (e.key === 'Escape') {
        this._closeDropdown();
        this.searchMunicipio.blur();
      } else if (e.key === 'Tab') {
        this._closeDropdown();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        if (this.searchMunicipio.value === '' && !this.isDropdownOpen) {
          // Limpiar selección si está vacío
          this.municipioSelect.value = '';
          this.municipioSelect.dispatchEvent(new Event('change'));
        }
      }
    });

    // Cerrar dropdowns cuando se hace click fuera
    document.addEventListener('click', (e) => {
      if (!this.contains(e.target)) {
        this._closeDropdown();
        this._closeEstadoDropdown();
      }
    });

    // Listener para cambios en el select oculto (para compatibilidad)
    this.municipioSelect.addEventListener('change', () => {
      this.dispatchEvent(new CustomEvent('municipio-change', {
        detail: { value: this.municipioSelect.value },
        bubbles: true
      }));
    });
  }

  setEstados(estados) {
    this.estados = estados;
    this.estadoSelect.innerHTML = '<option value="">-- Estado --</option>';
    estados.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.value;
      opt.textContent = e.label;
      this.estadoSelect.appendChild(opt);
    });
    
    // Habilitar el filtro de estado una vez cargados los datos
    this.searchEstado.disabled = false;
    this.searchEstado.placeholder = '-- Estado --';
    this.searchEstado.readOnly = true;
    
    this._resetMunicipioInput();
    this.municipiosOriginales = [];
  }

  // ===== MÉTODOS PARA DROPDOWN DE ESTADOS =====

  _toggleEstadoDropdown() {
    if (this.isEstadoDropdownOpen) {
      this._closeEstadoDropdown();
    } else {
      this._openEstadoDropdown();
    }
  }

  _openEstadoDropdown() {
    this.isEstadoDropdownOpen = true;
    this.estadoDropdown.style.display = 'block';
    this.searchEstado.placeholder = 'Buscar estado...';
    this.searchEstado.readOnly = false;
    this.searchEstado.style.borderRadius = '10px 10px 0 0';
    
    // Cerrar el dropdown de municipios si está abierto
    this._closeDropdown();
    
    this._populateEstadoDropdown(this.estados);
    
    // Si hay texto, filtrar inmediatamente
    if (this.searchEstado.value.trim() !== '') {
      this._filterEstados(this.searchEstado.value);
    }
    
    // Enfocar el input para empezar a escribir
    setTimeout(() => {
      this.searchEstado.focus();
    }, 100);
  }

  _closeEstadoDropdown() {
    this.isEstadoDropdownOpen = false;
    this.estadoDropdown.style.display = 'none';
    this.searchEstado.style.borderRadius = '10px';
    
    if (this.searchEstado.value === '') {
      this.searchEstado.placeholder = '-- Estado --';
      this.searchEstado.readOnly = true;
    } else {
      // Si hay texto seleccionado, mantenerlo pero hacer readonly
      this.searchEstado.readOnly = true;
    }
  }

  _filterEstados(searchTerm) {
    if (searchTerm.trim() === '') {
      this._populateEstadoDropdown(this.estados);
      return;
    }

    const normalizedSearch = this._normalizeText(searchTerm.toLowerCase());
    const filtered = this.estados.filter(estado => {
      const normalizedEstado = this._normalizeText(estado.label.toLowerCase());
      return normalizedEstado.includes(normalizedSearch) || 
             normalizedEstado.startsWith(normalizedSearch);
    });

    // Ordenar por relevancia: primero los que empiezan con el término, luego los que lo contienen
    filtered.sort((a, b) => {
      const aNormalized = this._normalizeText(a.label.toLowerCase());
      const bNormalized = this._normalizeText(b.label.toLowerCase());
      const aStarts = aNormalized.startsWith(normalizedSearch);
      const bStarts = bNormalized.startsWith(normalizedSearch);
      
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.label.localeCompare(b.label);
    });

    this._populateEstadoDropdown(filtered);
  }

  _populateEstadoDropdown(estados) {
    this.estadoDropdown.innerHTML = '';
    
    if (estados.length === 0) {
      const noResults = document.createElement('div');
      noResults.textContent = 'No se encontraron estados';
      noResults.style.cssText = `
        padding: 12px 16px;
        color: #666;
        font-style: italic;
        text-align: center;
        background: #f8f9fa;
        border-bottom: 1px solid #e9ecef;
      `;
      this.estadoDropdown.appendChild(noResults);
      return;
    }

    // Añadir contador de resultados si hay filtro activo
    if (this.searchEstado.value.trim() !== '' && estados.length < this.estados.length) {
      const counter = document.createElement('div');
      counter.textContent = `${estados.length} resultado${estados.length !== 1 ? 's' : ''}`;
      counter.style.cssText = `
        padding: 8px 16px;
        background: #f0f0f0;
        font-size: 12px;
        color: #666;
        font-weight: 500;
        border-bottom: 1px solid #e0e0e0;
      `;
      this.estadoDropdown.appendChild(counter);
    }

    estados.forEach((estado, index) => {
      const item = document.createElement('div');
      
      // Resaltar el texto de búsqueda
      const searchTerm = this.searchEstado.value.trim();
      let displayText = estado.label;
      
      if (searchTerm !== '') {
        const normalizedSearch = this._normalizeText(searchTerm.toLowerCase());
        const normalizedEstado = this._normalizeText(estado.label.toLowerCase());
        const searchIndex = normalizedEstado.indexOf(normalizedSearch);
        
        if (searchIndex !== -1) {
          const before = estado.label.substring(0, searchIndex);
          const match = estado.label.substring(searchIndex, searchIndex + searchTerm.length);
          const after = estado.label.substring(searchIndex + searchTerm.length);
          
          item.innerHTML = `${before}<strong style="background-color: #f0f0f0; color: #333;">${match}</strong>${after}`;
        } else {
          item.textContent = estado.label;
        }
      } else {
        item.textContent = estado.label;
      }
      
      item.style.cssText = `
        padding: 10px 16px;
        cursor: pointer;
        border-bottom: 1px solid #f0f0f0;
        transition: background-color 0.15s ease;
        font-size: 14px;
        color: #333;
      `;
      item.dataset.value = estado.value;
      item.dataset.index = index;

      // Hover effects
      item.addEventListener('mouseenter', () => {
        this._highlightEstadoItem(item);
      });

      item.addEventListener('mouseleave', () => {
        if (!item.style.backgroundColor.includes('240, 240, 240')) {
          item.style.backgroundColor = '';
          item.style.color = '#333';
        }
      });

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        this._selectEstado(estado);
      });

      this.estadoDropdown.appendChild(item);
    });
  }

  _highlightEstadoItem(item) {
    // Remover highlight anterior
    this.estadoDropdown.querySelectorAll('div[data-value]').forEach(div => {
      div.style.backgroundColor = '';
      div.style.color = '#333';
    });
    // Añadir highlight al item actual
    if (item && item.dataset.value) {
      item.style.backgroundColor = '#f0f0f0';
      item.style.color = '#333';
    }
  }

  _navigateEstadoDropdown(direction) {
    const items = this.estadoDropdown.querySelectorAll('div[data-value]');
    if (items.length === 0) return;

    const currentHighlighted = this.estadoDropdown.querySelector('div[style*="background-color"]');
    let newIndex = 0;

    if (currentHighlighted) {
      const currentIndex = parseInt(currentHighlighted.dataset.index);
      newIndex = currentIndex + direction;
    } else {
      newIndex = direction > 0 ? 0 : items.length - 1;
    }

    // Wrap around
    if (newIndex < 0) newIndex = items.length - 1;
    if (newIndex >= items.length) newIndex = 0;

    this._highlightEstadoItem(items[newIndex]);
    items[newIndex].scrollIntoView({ block: 'nearest' });
  }

  _selectHighlightedEstado() {
    const highlighted = this.estadoDropdown.querySelector('div[data-value][style*="background-color: rgb(240, 240, 240)"]');
    if (highlighted && highlighted.dataset.value) {
      const estado = this.estados.find(e => e.value === highlighted.dataset.value);
      if (estado) {
        this._selectEstado(estado);
      }
    }
  }

  _selectEstado(estado) {
    this.searchEstado.value = estado.label;
    this.searchEstado.readOnly = true;
    this.estadoSelect.value = estado.value;
    this._closeEstadoDropdown();
    
    // Disparar evento de cambio
    this.estadoSelect.dispatchEvent(new Event('change'));
    
    // Feedback visual sutil con borde verde
    this.searchEstado.style.borderColor = '#28a745';
    this.searchEstado.style.transition = 'border-color 0.3s ease';
    setTimeout(() => {
      this.searchEstado.style.borderColor = '#ddd';
      setTimeout(() => {
        this.searchEstado.style.transition = '';
      }, 300);
    }, 800);
  }

  // ===== MÉTODOS PARA DROPDOWN DE MUNICIPIOS =====

  _resetMunicipioInput() {
    this.searchMunicipio.value = '';
    this.searchMunicipio.placeholder = '-- Municipio --';
    this.searchMunicipio.disabled = true;
    this.searchMunicipio.readOnly = true;
    this.municipioSelect.value = '';
    this._closeDropdown();
  }

  _toggleDropdown() {
    if (this.isDropdownOpen) {
      this._closeDropdown();
    } else {
      this._openDropdown();
    }
  }

  _openDropdown() {
    this.isDropdownOpen = true;
    this.municipioDropdown.style.display = 'block';
    this.searchMunicipio.placeholder = 'Buscar municipio...';
    this.searchMunicipio.readOnly = false;
    this.searchMunicipio.style.borderRadius = '10px 10px 0 0';
    
    // Cerrar el dropdown de estados si está abierto
    this._closeEstadoDropdown();
    
    this._populateDropdown(this.municipiosOriginales);
    
    // Si hay texto, filtrar inmediatamente
    if (this.searchMunicipio.value.trim() !== '') {
      this._filterMunicipios(this.searchMunicipio.value);
    }
    
    // Enfocar el input para empezar a escribir
    setTimeout(() => {
      this.searchMunicipio.focus();
    }, 100);
  }

  _closeDropdown() {
    this.isDropdownOpen = false;
    this.municipioDropdown.style.display = 'none';
    this.searchMunicipio.style.borderRadius = '10px';
    
    if (this.searchMunicipio.value === '') {
      this.searchMunicipio.placeholder = '-- Municipio --';
      this.searchMunicipio.readOnly = true;
    } else {
      // Si hay texto seleccionado, mantenerlo pero hacer readonly
      this.searchMunicipio.readOnly = true;
    }
  }

  _filterMunicipios(searchTerm) {
    if (searchTerm.trim() === '') {
      this._populateDropdown(this.municipiosOriginales);
      return;
    }

    const normalizedSearch = this._normalizeText(searchTerm.toLowerCase());
    const filtered = this.municipiosOriginales.filter(municipio => {
      const normalizedMunicipio = this._normalizeText(municipio.label.toLowerCase());
      return normalizedMunicipio.includes(normalizedSearch) || 
             normalizedMunicipio.startsWith(normalizedSearch);
    });

    // Ordenar por relevancia: primero los que empiezan con el término, luego los que lo contienen
    filtered.sort((a, b) => {
      const aNormalized = this._normalizeText(a.label.toLowerCase());
      const bNormalized = this._normalizeText(b.label.toLowerCase());
      const aStarts = aNormalized.startsWith(normalizedSearch);
      const bStarts = bNormalized.startsWith(normalizedSearch);
      
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.label.localeCompare(b.label);
    });

    this._populateDropdown(filtered);
  }

  _normalizeText(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remover acentos
  }

  _populateDropdown(municipios) {
    this.municipioDropdown.innerHTML = '';
    
    if (municipios.length === 0) {
      const noResults = document.createElement('div');
      noResults.textContent = 'No se encontraron municipios';
      noResults.style.cssText = `
        padding: 12px 16px;
        color: #666;
        font-style: italic;
        text-align: center;
        background: #f8f9fa;
        border-bottom: 1px solid #e9ecef;
      `;
      this.municipioDropdown.appendChild(noResults);
      return;
    }

    // Añadir contador de resultados si hay filtro activo
    if (this.searchMunicipio.value.trim() !== '' && municipios.length < this.municipiosOriginales.length) {
      const counter = document.createElement('div');
      counter.textContent = `${municipios.length} resultado${municipios.length !== 1 ? 's' : ''}`;
      counter.style.cssText = `
        padding: 8px 16px;
        background: #f0f0f0;
        font-size: 12px;
        color: #666;
        font-weight: 500;
        border-bottom: 1px solid #e0e0e0;
      `;
      this.municipioDropdown.appendChild(counter);
    }

    municipios.forEach((municipio, index) => {
      const item = document.createElement('div');
      
      // Resaltar el texto de búsqueda
      const searchTerm = this.searchMunicipio.value.trim();
      let displayText = municipio.label;
      
      if (searchTerm !== '') {
        const normalizedSearch = this._normalizeText(searchTerm.toLowerCase());
        const normalizedMunicipio = this._normalizeText(municipio.label.toLowerCase());
        const searchIndex = normalizedMunicipio.indexOf(normalizedSearch);
        
        if (searchIndex !== -1) {
          const before = municipio.label.substring(0, searchIndex);
          const match = municipio.label.substring(searchIndex, searchIndex + searchTerm.length);
          const after = municipio.label.substring(searchIndex + searchTerm.length);
          
          item.innerHTML = `${before}<strong style="background-color: #f0f0f0; color: #333;">${match}</strong>${after}`;
        } else {
          item.textContent = municipio.label;
        }
      } else {
        item.textContent = municipio.label;
      }
      
      item.style.cssText = `
        padding: 10px 16px;
        cursor: pointer;
        border-bottom: 1px solid #f0f0f0;
        transition: background-color 0.15s ease;
        font-size: 14px;
        color: #333;
      `;
      item.dataset.value = municipio.value;
      item.dataset.index = index;

      // Hover effects
      item.addEventListener('mouseenter', () => {
        this._highlightItem(item);
      });

      item.addEventListener('mouseleave', () => {
        if (!item.style.backgroundColor.includes('240, 240, 240')) {
          item.style.backgroundColor = '';
          item.style.color = '#333';
        }
      });

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        this._selectMunicipio(municipio);
      });

      this.municipioDropdown.appendChild(item);
    });
  }

  _highlightItem(item) {
    // Remover highlight anterior
    this.municipioDropdown.querySelectorAll('div[data-value]').forEach(div => {
      div.style.backgroundColor = '';
      div.style.color = '#333';
    });
    // Añadir highlight al item actual
    if (item && item.dataset.value) {
      item.style.backgroundColor = '#f0f0f0';
      item.style.color = '#333';
    }
  }

  _navigateDropdown(direction) {
    const items = this.municipioDropdown.querySelectorAll('div[data-value]');
    if (items.length === 0) return;

    const currentHighlighted = this.municipioDropdown.querySelector('div[style*="background-color"]');
    let newIndex = 0;

    if (currentHighlighted) {
      const currentIndex = parseInt(currentHighlighted.dataset.index);
      newIndex = currentIndex + direction;
    } else {
      newIndex = direction > 0 ? 0 : items.length - 1;
    }

    // Wrap around
    if (newIndex < 0) newIndex = items.length - 1;
    if (newIndex >= items.length) newIndex = 0;

    this._highlightItem(items[newIndex]);
    items[newIndex].scrollIntoView({ block: 'nearest' });
  }

  _selectHighlighted() {
    const highlighted = this.municipioDropdown.querySelector('div[data-value][style*="background-color: rgb(240, 240, 240)"]');
    if (highlighted && highlighted.dataset.value) {
      const municipio = this.municipiosOriginales.find(m => m.value === highlighted.dataset.value);
      if (municipio) {
        this._selectMunicipio(municipio);
      }
    }
  }

  _selectMunicipio(municipio) {
    this.searchMunicipio.value = municipio.label;
    this.searchMunicipio.readOnly = true;
    this.municipioSelect.value = municipio.value;
    this._closeDropdown();
    
    // Disparar evento de cambio
    this.municipioSelect.dispatchEvent(new Event('change'));
    
    // Feedback visual sutil con borde verde
    this.searchMunicipio.style.borderColor = '#28a745';
    this.searchMunicipio.style.transition = 'border-color 0.3s ease';
    setTimeout(() => {
      this.searchMunicipio.style.borderColor = '#ddd';
      setTimeout(() => {
        this.searchMunicipio.style.transition = '';
      }, 300);
    }, 800);
  }

  _poblarMunicipios(municipios) {
    this.municipioSelect.innerHTML = '<option value="">-- Municipio --</option>';
    
    if (municipios.length === 0 && this.searchMunicipio && this.searchMunicipio.value.trim() !== '') {
      // Si hay búsqueda pero no hay resultados
      const optNoResults = document.createElement('option');
      optNoResults.disabled = true;
      optNoResults.textContent = 'No se encontraron municipios';
      this.municipioSelect.appendChild(optNoResults);
    } else {
      municipios.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.value;
        opt.textContent = m.label;
        this.municipioSelect.appendChild(opt);
      });
      
      // Mostrar número de resultados si hay búsqueda activa
      if (this.searchMunicipio && this.searchMunicipio.value.trim() !== '' && municipios.length > 0) {
        const countOption = document.createElement('option');
        countOption.disabled = true;
        countOption.textContent = `--- ${municipios.length} resultado(s) ---`;
        this.municipioSelect.insertBefore(countOption, this.municipioSelect.children[1]);
      }
    }
  }

  get value() {
    return {
      estado: this.estadoSelect.value,
      municipio: this.municipioSelect.value
    };
  }

  // ==========================
  // MÉTODOS DE RESETEO Y LIMPIEZA
  // ==========================
  
  /**
   * Resetea ambos filtros a su estado inicial
   */
  resetFilters() {
    this.clearEstadoFilter();
    this.clearMunicipioFilter();
  }

  /**
   * Limpia el filtro de estado y resetea municipios
   */
  clearEstadoFilter() {
    // Limpiar input visual
    this.searchEstado.value = '';
    this.searchEstado.placeholder = 'Selecciona un estado';
    
    // Limpiar select oculto
    this.estadoSelect.value = '';
    
    // Cerrar dropdown si está abierto
    this._closeEstadoDropdown();
    
    // Limpiar y deshabilitar municipios
    this.clearMunicipioFilter();
    this.municipioSelect.disabled = true;
    this.searchMunicipio.disabled = true;
    this.searchMunicipio.placeholder = '-- Municipio --';
    
    // Emitir evento de cambio
    this.estadoSelect.dispatchEvent(new Event('change'));
  }

  /**
   * Limpia solo el filtro de municipio
   */
  clearMunicipioFilter() {
    // Limpiar input visual
    this.searchMunicipio.value = '';
    this.searchMunicipio.placeholder = this.municipioSelect.disabled ? '-- Municipio --' : 'Selecciona un municipio';
    
    // Limpiar select oculto
    this.municipioSelect.value = '';
    
    // Cerrar dropdown si está abierto
    this._closeDropdown();
    
    // Emitir evento de cambio
    this.municipioSelect.dispatchEvent(new Event('change'));
  }

  /**
   * Actualiza el filtro de estado desde el geocoder
   */
  updateFromGeocoder(estadoValue, municipioValue = null) {
    // Buscar el estado en la lista
    const estado = this.estados.find(e => e.value === estadoValue);
    if (estado) {
      this.searchEstado.value = estado.label;
      this.estadoSelect.value = estado.value;
      this.estadoSelect.dispatchEvent(new Event('change'));
      
      // Si se proporciona municipio, actualizarlo después de que se carguen
      if (municipioValue) {
        setTimeout(() => {
          this.updateMunicipioFromGeocoder(municipioValue);
        }, 100);
      }
    }
  }

  /**
   * Actualiza el filtro de municipio desde el geocoder
   */
  updateMunicipioFromGeocoder(municipioValue) {
    const municipioOption = Array.from(this.municipioSelect.options).find(opt => 
      opt.value === municipioValue
    );
    
    if (municipioOption) {
      this.searchMunicipio.value = municipioOption.textContent;
      this.municipioSelect.value = municipioValue;
      this.municipioSelect.dispatchEvent(new Event('change'));
    }
  }
}
customElements.define('dropdown-filtros-ubicacion', DropdownFiltrosUbicacion);

// ==========================
// Cargar municipios y poblar
// ==========================
document.addEventListener("municipios-cargados", () => {
  if (!municipiosGeoJson || !municipiosGeoJson.features) {
    console.error("Los datos de municipios no están disponibles.");
    return;
  }
  console.log("Datos de municipios disponibles:", municipiosGeoJson);
  poblarFiltrosConMunicipios(municipiosGeoJson);
});

// Función para poblar los filtros con los municipios
function poblarFiltrosConMunicipios(data) {
  const estadosMap = new Map();

  data.features.forEach(f => {
    const cveEnt = f.properties.CVE_ENT; // Usar directamente la propiedad CVE_ENT
    const estadoInfo = diccionarioEstados[cveEnt];
    if (!estadoInfo) return;

    if (!estadosMap.has(estadoInfo.value)) {
      estadosMap.set(estadoInfo.value, {
        value: estadoInfo.value,
        label: estadoInfo.label,
        municipios: []
      });
    }

    estadosMap.get(estadoInfo.value).municipios.push({
      value: f.properties.CVEGEO,
      label: f.properties.NOMGEO
    });
  });

  const estados = Array.from(estadosMap.values());
  const filtro = document.querySelector('dropdown-filtros-ubicacion');
  if (filtro) {
    filtro.setEstados(estados);
    console.log("Estados y municipios configurados:", estados);
  } else {
    console.error("No se encontró el elemento <dropdown-filtros-ubicacion>.");
  }
}

// Escuchar el evento de cambio de estado
document.addEventListener('estado-change', (e) => {
  const codigoEntidad = e.detail.value;

  if (!codigoEntidad) {
    console.warn(`No se encontró un código de estado válido: ${codigoEntidad}`);
    return;
  }

  // Extraer el código numérico del estado (quitar "calles" del principio)
  const codigoNumerico = codigoEntidad.replace('calles', '');

  // Mover el mapa al estado seleccionado
  moverMapaAEstado(codigoNumerico);

  // Activar la vista local para el estado
  activarVistaLocal(codigoNumerico, 'estado');

  // Cargar calles dinámicamente según el estado seleccionado
  const source = window.map.getSource('calles');
  if (source) {
    source.setData(`https://fabulous-dodol-d03b96.netlify.app/calles${codigoNumerico}.geojson`);
  } else {
    console.warn('La fuente "calles" todavía no existe en el mapa.');
  }

  // Limpiar el dropdown de municipios
  const filtro = document.querySelector('dropdown-filtros-ubicacion');
  const selectMunicipio = filtro?.querySelector('#select-municipio');

  if (!selectMunicipio) {
    console.error("No se encontró el dropdown de municipios.");
    return;
  }

  selectMunicipio.innerHTML = '<option value="">-- Municipio --</option>';

  // Filtrar municipios por el estado seleccionado
  const municipios = municipiosGeoJson.features.filter(mun =>
    mun.properties.CVE_ENT === codigoNumerico.padStart(2, '0') // Asegurar formato de 2 dígitos
  );

  // Poblar el dropdown con los municipios del estado seleccionado
  municipios.forEach(mun => {
    const opt = document.createElement('option');
    opt.value = mun.properties.CVEGEO; // Código del municipio
    opt.textContent = mun.properties.NOMGEO; // Nombre del municipio
    selectMunicipio.appendChild(opt);
  });

  // Habilitar el dropdown de municipios
  selectMunicipio.disabled = false;
  console.log(`Dropdown de municipios actualizado para el estado: ${codigoEntidad}`);
});

// Escuchar el evento de cambio de municipio
// La lógica de filtros municipales se maneja en eventos_selector.js
// para evitar conflictos
document.addEventListener('municipio-change', (e) => {
  const cvegeo = e.detail.value;
  if (cvegeo) {
    moverMapaAMunicipio(cvegeo);
    // activarVistaLocal se maneja en eventos_selector.js
  }
});

export function moverMapaAEstado(codigoEntidad) {
  const estadoFeature = estadosGeoJson.features.find(f => f.properties.CVE_ENT === codigoEntidad);
  if (estadoFeature) {
    const bbox = turf.bbox(estadoFeature); // Calcular el bounding box del estado
    window.map.fitBounds(bbox, { padding: 20, duration: 1000 });
  } else {
    console.warn(`No se encontró el estado con código: ${codigoEntidad}`);
  }
}

export function moverMapaAMunicipio(cvegeo) {
  const municipioFeature = municipiosGeoJson.features.find(f => f.properties.CVEGEO === cvegeo);
  if (municipioFeature) {
    const bbox = turf.bbox(municipioFeature); // Calcular el bounding box del municipio
    window.map.fitBounds(bbox, { padding: 20, duration: 1000 });
  } else {
    console.warn(`No se encontró el municipio con código: ${cvegeo}`);
  }
}
