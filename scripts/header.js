class HeaderGob extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="barra-logo">
        <img src="imagenes/logo_gob.svg" alt="Logo" class="logo-izquierdo">
        <div class="header-content">
          <h1>Homicidios: Zonas de Riesgo</h1>
        </div>
      </header>
    `;
  }
}

customElements.define('header-gob', HeaderGob);

