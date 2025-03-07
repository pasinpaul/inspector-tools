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
  // 4) Podstawowe podświetlanie
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
    positionOverlay(infoBox, rect.x + rect.width + 10, rect.y + rect.height + 10, 200, 'auto');
    // Ten "200" na szerokość jest przykładowy. Można zrobić `auto` i zmodyfikować logikę.
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

  // ==================================================================
  // 6) Start
  // ==================================================================
  // Uruchamiamy skrypt dopiero po załadowaniu DOM
  document.addEventListener('DOMContentLoaded', () => {
    createInspectorStyles();
    createInspectorOverlays();

    // Eventy
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
  });
})();
