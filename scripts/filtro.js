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
          <select id="select-estado">
            <option disabled selected>Cargando estados...</option>
          </select>
        </div>
        <div class="grupo-municipio">
          <label for="select-municipio">Selecciona un municipio:</label>
          <select id="select-municipio" disabled>
            <option value="">-- Municipio --</option>
          </select>
        </div>
      </div>
    `;
    this.estadoSelect = this.querySelector('#select-estado');
    this.municipioSelect = this.querySelector('#select-municipio');
    this.estados = [];
    this._initListeners();
  }

  _initListeners() {
    this.estadoSelect.addEventListener('change', () => {
      const estado = this.estados.find(e => e.value === this.estadoSelect.value);
      if (estado) {
        this._poblarMunicipios(estado.municipios);
        this.municipioSelect.disabled = false;
      } else {
        this._poblarMunicipios([]);
        this.municipioSelect.disabled = true;
      }
      this.dispatchEvent(new CustomEvent('estado-change', {
        detail: { value: this.estadoSelect.value },
        bubbles: true
      }));
    });

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
    this.municipioSelect.disabled = true;
    this._poblarMunicipios([]);
  }

  _poblarMunicipios(municipios) {
    this.municipioSelect.innerHTML = '<option value="">-- Municipio --</option>';
    municipios.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.value;
      opt.textContent = m.label;
      this.municipioSelect.appendChild(opt);
    });
  }

  get value() {
    return {
      estado: this.estadoSelect.value,
      municipio: this.municipioSelect.value
    };
  }
}
customElements.define('dropdown-filtros-ubicacion', DropdownFiltrosUbicacion);

// ==========================
// Cargar municipios y poblar
// ==========================



