class CardCapas extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
       <div class="card-capas">
        <div class="leyenda-header">
          <h4>Capas</h4>
        </div>
        <div class="leyendas-contenido" style="max-height: 300px; overflow-y: auto;">
          <label class="switch">
            <input type="checkbox" id="toggle-calles" data-layer="toggle-calles">
            <span class="slider round"></span>
            <span class="layer-label">Calles</span>
          </label>
          <label class="switch">
            <input type="checkbox" id="toggle-escuelas" data-layer="toggle-escuelas">
            <span class="slider round"></span>
            <span class="layer-label">Escuelas</span>
          </label>
          <label class="switch">
            <input type="checkbox" id="toggle-parques" data-layer="toggle-parques">
            <span class="slider round"></span>
            <span class="layer-label">Parques</span>
          </label>
          <label class="switch">
            <input type="checkbox" id="toggle-homicidios" data-layer="toggle-homicidios" >
            <span class="slider round"></span>
            <span class="layer-label">Homicidios</span>
          </label>
        </div>
      </div>
    `;

    // Lógica para emitir evento cuando se prende/apaga una capa
    this.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const layer = input.getAttribute('data-layer');
        this.dispatchEvent(new CustomEvent('layer-toggle', {
          detail: { layer, checked: input.checked },
          bubbles: true,
          composed: true
        }));
      });
    });
  }
}
customElements.define('card-capas', CardCapas);

document.addEventListener('DOMContentLoaded', () => {
  const cardCapas = document.querySelector('card-capas');
  if (cardCapas) {
    setTimeout(() => {
      const checkbox = cardCapas.querySelector('#toggle-calles');
      if (checkbox) {
        checkbox.addEventListener('change', () => { /* ... */ });
      }
    }, 0);
  }
});