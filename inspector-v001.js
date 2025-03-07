(function() {

  // ==================================================================
  // 1) Tworzymy <style> z całym CSS i dołączamy do <head>
  // ==================================================================
  function createInspectorStyles() {
    const css = `
      .inspector-overlay {
        position: absolute;
        z-index: 999999;
        pointer-events: none;
        display: none;
      }
      #inspector-marginBox {
        background: rgba(255, 0, 0, 0.1);
      }
      #inspector-outline {
        border: 1px dashed red;
      }
      #inspector-paddingTop,
      #inspector-paddingRight,
      #inspector-paddingBottom,
      #inspector-paddingLeft {
        background: rgba(0, 255, 0, 0.15);
      }
      #inspector-info {
        position: absolute;
        background: rgba(0, 0, 0, 0.85);
        color: #fff;
        padding: 6px 8px;
        font-size: 12px;
        border-radius: 4px;
        max-width: 300px;
        box-sizing: border-box;
      }

      /* Pomocniczy box z instrukcją skrótów */
      #inspector-helpBox {
        position: fixed; 
        left: 10px; 
        bottom: 10px;
        z-index: 999998; /* Troszkę mniej, by nakładki overlays były nad nim w razie potrzeby */
        background: rgba(0, 0, 0, 0.7);
        color: #fff;
        font-size: 13px;
        line-height: 1.4;
        padding: 8px 12px;
        border-radius: 6px;
        max-width: 320px;
        pointer-events: auto; /* Pozwól kliknąć ewentualne linki, przyciski itp. */
      }
      #inspector-helpBox h4 {
        margin: 0 0 6px;
        font-size: 14px;
      }
      #inspector-helpBox ul {
        padding-left: 18px;
        margin: 0;
      }
      #inspector-helpBox li {
        margin-bottom: 2px;
      }
    `;
    const styleEl = document.createElement('style');
    styleEl.id = 'inspector-styles';
    styleEl.innerHTML = css;
    document.head.appendChild(styleEl);
  }

  // ==================================================================
  // 2) Tworzymy divy (HTML) potrzebne do inspektora i dodajemy do body
  // ==================================================================
  let marginBox, outlineBox,
      paddingTopBox, paddingRightBox, paddingBottomBox, paddingLeftBox,
      infoBox;

  function createInspectorOverlays() {
    // Margin
    marginBox = document.createElement('div');
    marginBox.id = 'inspector-marginBox';
    marginBox.className = 'inspector-overlay';
    document.body.appendChild(marginBox);

    // Outline
    outlineBox = document.createElement('div');
    outlineBox.id = 'inspector-outline';
    outlineBox.className = 'inspector-overlay';
    document.body.appendChild(outlineBox);

    // Padding (4 panele)
    paddingTopBox = document.createElement('div');
    paddingTopBox.id = 'inspector-paddingTop';
    paddingTopBox.className = 'inspector-overlay';
    document.body.appendChild(paddingTopBox);

    paddingRightBox = document.createElement('div');
    paddingRightBox.id = 'inspector-paddingRight';
    paddingRightBox.className = 'inspector-overlay';
    document.body.appendChild(paddingRightBox);

    paddingBottomBox = document.createElement('div');
    paddingBottomBox.id = 'inspector-paddingBottom';
    paddingBottomBox.className = 'inspector-overlay';
    document.body.appendChild(paddingBottomBox);

    paddingLeftBox = document.createElement('div');
    paddingLeftBox.id = 'inspector-paddingLeft';
    paddingLeftBox.className = 'inspector-overlay';
    document.body.appendChild(paddingLeftBox);

    // Info
    infoBox = document.createElement('div');
    infoBox.id = 'inspector-info';
    infoBox.className = 'inspector-overlay';
    document.body.appendChild(infoBox);
  }

  // ==================================================================
  // 2a) Tworzymy pudełko z instrukcją skrótów i dodajemy na stronę
  // ==================================================================
  let helpBox; // referencja do div-a z instrukcją

  function createInspectorHelpBox() {
    helpBox = document.createElement('div');
    helpBox.id = 'inspector-helpBox';

    // Zawartość w HTML (możesz edytować tekst wg uznania)
    helpBox.innerHTML = `
      <h4>Inspektor – Skróty Klawiszowe</h4>
      <ul>
        <li><strong>Ctrl + Shift + Alt</strong>: włącza / wyłącza inspektora</li>
        <li><strong>Ctrl + Klik</strong> na elemencie: zamrożenie / odmrożenie podświetlenia</li>
        <li><strong>Shift</strong>: przytrzymanie w trybie zamrożenia wyświetla linię i pomiar odległości</li>
      </ul>
    `;
    document.body.appendChild(helpBox);
  }

  // ==================================================================
  // 3) Stan inspektora i funkcje do jego logiki
  // ==================================================================
  let isInspectorActive = false;
  let isFrozen = false;
  let frozenTarget = null;

  function toggleInspector() {
    isInspectorActive = !isInspectorActive;
    if (!isInspectorActive) {
      unfreeze();
      hideOverlays();
    }
  }
  function freeze(el) {
    isFrozen = true;
    frozenTarget = el;
    highlightElement(el);
  }
  function unfreeze() {
    isFrozen = false;
    frozenTarget = null;
    hideOverlays();
  }

  // ==================================================================
  // 4) Podświetlanie
  // ==================================================================
  function hideOverlays() {
    marginBox.style.display = 'none';
    outlineBox.style.display = 'none';
    paddingTopBox.style.display = 'none';
    paddingRightBox.style.display = 'none';
    paddingBottomBox.style.display = 'none';
    paddingLeftBox.style.display = 'none';
    infoBox.style.display = 'none';
  }

  function highlightElement(el) {
    if (!el || el === document.body || el === document.documentElement) {
      hideOverlays();
      return;
    }
    const rect = el.getBoundingClientRect();
    const cs = getComputedStyle(el);

    // parse metrics
    const marginTop    = parseFloat(cs.marginTop)    || 0;
    const marginRight  = parseFloat(cs.marginRight)  || 0;
    const marginBottom = parseFloat(cs.marginBottom) || 0;
    const marginLeft   = parseFloat(cs.marginLeft)   || 0;
    const borderTop    = parseFloat(cs.borderTopWidth) || 0;
    const borderRight  = parseFloat(cs.borderRightWidth) || 0;
    const borderBottom = parseFloat(cs.borderBottomWidth) || 0;
    const borderLeft   = parseFloat(cs.borderLeftWidth) || 0;
    const paddingTop   = parseFloat(cs.paddingTop)   || 0;
    const paddingRight = parseFloat(cs.paddingRight) || 0;
    const paddingBottom= parseFloat(cs.paddingBottom)|| 0;
    const paddingLeft  = parseFloat(cs.paddingLeft)  || 0;

    // Margin box
    positionOverlay(
      marginBox,
      rect.x - marginLeft,
      rect.y - marginTop,
      rect.width + marginLeft + marginRight,
      rect.height + marginTop + marginBottom
    );

    // Outline (border box)
    positionOverlay(
      outlineBox,
      rect.x,
      rect.y,
      rect.width,
      rect.height
    );

    // Padding (4 paski)
    //  top
    positionOverlay(
      paddingTopBox,
      rect.x + borderLeft,
      rect.y + borderTop,
      rect.width - borderLeft - borderRight,
      paddingTop
    );
    //  bottom
    positionOverlay(
      paddingBottomBox,
      rect.x + borderLeft,
      rect.y + rect.height - borderBottom - paddingBottom,
      rect.width - borderLeft - borderRight,
      paddingBottom
    );
    //  left
    positionOverlay(
      paddingLeftBox,
      rect.x + borderLeft,
      rect.y + borderTop + paddingTop,
      paddingLeft,
      rect.height - borderTop - borderBottom - paddingTop - paddingBottom
    );
    //  right
    positionOverlay(
      paddingRightBox,
      rect.x + rect.width - borderRight - paddingRight,
      rect.y + borderTop + paddingTop,
      paddingRight,
      rect.height - borderTop - borderBottom - paddingTop - paddingBottom
    );

    // Info
    const label = el.tagName.toLowerCase() +
      (el.id ? '#' + el.id : '') +
      (el.classList.length ? '.' + [...el.classList].join('.') : '');
    infoBox.innerHTML = `
      <strong>${label}</strong><br>
      Size: ${Math.round(rect.width)} x ${Math.round(rect.height)}<br>
      Margin: ${marginTop}/${marginRight}/${marginBottom}/${marginLeft}<br>
      Border: ${borderTop}/${borderRight}/${borderBottom}/${borderLeft}<br>
      Padding: ${paddingTop}/${paddingRight}/${paddingBottom}/${paddingLeft}
    `;
    // W prostszej wersji – nie dbamy o "chowanie poza ekran"
    positionOverlay(infoBox, rect.x + rect.width + 10, rect.y + rect.height + 10, 200, 'auto');
  }

  function positionOverlay(overlay, x, y, w, h) {
    overlay.style.left   = x + 'px';
    overlay.style.top    = y + 'px';
    overlay.style.width  = (w !== 'auto' ? w + 'px' : 'auto');
    overlay.style.height = (h !== 'auto' ? h + 'px' : 'auto');
    overlay.style.display= 'block';
  }

  // ==================================================================
  // 5) Obsługa zdarzeń
  // ==================================================================
  function onMouseMove(e) {
    if (!isInspectorActive) return;
    if (!isFrozen) {
      highlightElement(e.target);
    }
  }
  function onClick(e) {
    if (!isInspectorActive) return;
    // Ctrl + click => freeze/unfreeze
    if (e.ctrlKey) {
      if (!isFrozen) {
        freeze(e.target);
      } else {
        unfreeze();
      }
    }
  }
  function onKeyDown(e) {
    // Włącz/wyłącz inspektor: Ctrl+Shift+Alt
    if (e.ctrlKey && e.shiftKey && e.altKey) {
      e.preventDefault();
      toggleInspector();
    }
  }

  function onMouseLeave() {
    if (!isFrozen) {
      hideOverlays();
    }
  }

  // ==================================================================
  // 6) Start
  // ==================================================================
  document.addEventListener('DOMContentLoaded', () => {
    createInspectorStyles();
    createInspectorOverlays();
    createInspectorHelpBox(); // <-- WYWŁOŁANIE funkcji tworzącej okienko z instrukcją

    // Eventy
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('mouseleave', onMouseLeave, true);
  });

})();
