(function() {
  // ===========================================================
  // 1. Dodawanie stylów do <head>
  // ===========================================================
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
      /* Paski reprezentujące padding: 4 osobne nakładki */
      #inspector-paddingTop,
      #inspector-paddingRight,
      #inspector-paddingBottom,
      #inspector-paddingLeft {
        background: rgba(0, 255, 0, 0.15);
      }
      /* InfoBox (tooltip z danymi o elemencie) */
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
      /* Pomocniczy box z instrukcją klawiszy w lewym dolnym rogu */
      #inspector-helpBox {
        position: fixed;
        bottom: 10px;
        left: 10px;
        z-index: 999998; 
        background: rgba(0, 0, 0, 0.7);
        color: #fff;
        font-size: 13px;
        line-height: 1.4;
        padding: 8px 12px;
        border-radius: 6px;
        max-width: 320px;
        pointer-events: auto; /* pozwala ewentualnie zaznaczać tekst */
      }
      #inspector-helpBox h4 {
        margin: 0 0 6px;
        font-size: 14px;
      }
      #inspector-helpBox ul {
        margin: 0;
        padding-left: 18px;
      }
      #inspector-helpBox li {
        margin-bottom: 2px;
      }
      /* Linia odległości i etykieta */
      #inspector-distanceLine {
        position: absolute;
        z-index: 1000000;
        display: none;
        pointer-events: none;
      }
      #inspector-distanceLine .line-segment {
        position: absolute;
        top: 0;
        left: 0;
        height: 2px;
        background: #f00;
        transform-origin: 0 50%;
      }
      #inspector-distanceLine .line-label {
        position: absolute;
        top: -20px;
        left: 0;
        padding: 2px 5px;
        background: #000;
        color: #fff;
        font-size: 11px;
        border-radius: 3px;
        white-space: nowrap;
        transform: translateX(-50%);
      }
      /* Styl dla obrysu komórek tabeli */
      .inspector-table-cell-overlay {
        position: absolute;
        z-index: 999998;
        pointer-events: none;
        border: 1px dotted #00f;
        background: rgba(0, 0, 255, 0.05);
        font-size: 10px;
        color: #000;
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
      }
      .inspector-table-cell-overlay .cell-size-label {
        background: rgba(0,0,0,0.7);
        color: #fff;
        padding: 2px 4px;
        border-radius: 3px;
        margin: 2px;
        font-size: 10px;
      }
    `;
    const styleEl = document.createElement('style');
    styleEl.id = 'inspector-styles';
    styleEl.innerHTML = css;
    document.head.appendChild(styleEl);
  }

  // ===========================================================
  // 2. Tworzenie elementów HTML inspektora i dodawanie do <body>
  // ===========================================================
  let marginBox, outlineBox,
      paddingTopBox, paddingRightBox, paddingBottomBox, paddingLeftBox,
      infoBox;

  function createInspectorOverlays() {
    marginBox = createDiv('inspector-marginBox', 'inspector-overlay');
    outlineBox = createDiv('inspector-outline', 'inspector-overlay');

    paddingTopBox = createDiv('inspector-paddingTop', 'inspector-overlay');
    paddingRightBox = createDiv('inspector-paddingRight', 'inspector-overlay');
    paddingBottomBox = createDiv('inspector-paddingBottom', 'inspector-overlay');
    paddingLeftBox = createDiv('inspector-paddingLeft', 'inspector-overlay');

    infoBox = createDiv('inspector-info', 'inspector-overlay');

    document.body.append(
      marginBox, outlineBox,
      paddingTopBox, paddingRightBox, paddingBottomBox, paddingLeftBox,
      infoBox
    );
  }

  // Funkcja pomocnicza do tworzenia DIV-ów
  function createDiv(id, className) {
    const d = document.createElement('div');
    d.id = id;
    d.className = className;
    return d;
  }

  // ===========================================================
  // 2a. Tworzymy pudełko z instrukcją skrótów
  // ===========================================================
  let helpBox;
  function createInspectorHelpBox() {
    helpBox = document.createElement('div');
    helpBox.id = 'inspector-helpBox';
    helpBox.innerHTML = `
      <h4>Inspektor – Skróty Klawiszowe</h4>
      <ul>
        <li><strong>Ctrl + Shift + Alt</strong>: włącza/wyłącza inspektora</li>
        <li><strong>Ctrl + Left Click</strong>: zamrożenie/odmrożenie podświetlenia</li>
        <li><strong>Shift</strong> (przy zamrożeniu): pokazuje odległość między elementami</li>
        <li><strong>Ctrl + Shift + T</strong>: podgląd komórek tabel (obrys & wymiary)</li>
      </ul>
    `;
    document.body.appendChild(helpBox);
  }

  // ===========================================================
  // 3. Dodatkowe elementy do pomiaru odległości
  // ===========================================================
  let distanceLine, distanceSegment, distanceLabel;
  function createDistanceLineElements() {
    distanceLine = document.createElement('div');
    distanceLine.id = 'inspector-distanceLine';

    distanceSegment = document.createElement('div');
    distanceSegment.className = 'line-segment';

    distanceLabel = document.createElement('div');
    distanceLabel.className = 'line-label';

    distanceLine.append(distanceSegment, distanceLabel);
    document.body.appendChild(distanceLine);
  }

  // ===========================================================
  // 4. Stan inspektora, tabele i inne
  // ===========================================================
  let isInspectorActive = false;
  let isFrozen = false;
  let frozenTarget = null;
  let hoveredElement = null;
  let isShiftPressed = false;

  // Podgląd tabel
  let isTableDebugActive = false;
  let tableCellsOverlays = [];

  // ===========================================================
  // 5. Podstawowe funkcje on/off, freeze
  // ===========================================================
  function toggleInspector() {
    isInspectorActive = !isInspectorActive;
    if (!isInspectorActive) {
      unfreeze();
      hideAllOverlays();
    }
  }

  function freezeElement(el) {
    isFrozen = true;
    frozenTarget = el;
    highlightElement(el);
  }

  function unfreeze() {
    isFrozen = false;
    frozenTarget = null;
    hideElementOverlays();
    hideDistanceLine();
  }

  // ===========================================================
  // 6. Nakładki i InfoBox
  // ===========================================================
  function hideElementOverlays() {
    marginBox.style.display = 'none';
    outlineBox.style.display = 'none';
    paddingTopBox.style.display = 'none';
    paddingRightBox.style.display = 'none';
    paddingBottomBox.style.display = 'none';
    paddingLeftBox.style.display = 'none';
    infoBox.style.display = 'none';
  }

  function hideAllOverlays() {
    hideElementOverlays();
    hideDistanceLine();
    hideTableCellsOverlays();
  }

  function highlightElement(el) {
    if (!el || el === document.body || el === document.documentElement) {
      hideElementOverlays();
      return;
    }

    const rect = el.getBoundingClientRect();
    if (!rect) {
      hideElementOverlays();
      return;
    }

    const cs = getComputedStyle(el);
    const marginTop    = parseFloat(cs.marginTop)    || 0;
    const marginRight  = parseFloat(cs.marginRight)  || 0;
    const marginBottom = parseFloat(cs.marginBottom) || 0;
    const marginLeft   = parseFloat(cs.marginLeft)   || 0;

    const borderTop    = parseFloat(cs.borderTopWidth)    || 0;
    const borderRight  = parseFloat(cs.borderRightWidth)  || 0;
    const borderBottom = parseFloat(cs.borderBottomWidth) || 0;
    const borderLeft   = parseFloat(cs.borderLeftWidth)   || 0;

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

    // Outline (border-box)
    positionOverlay(
      outlineBox,
      rect.x,
      rect.y,
      rect.width,
      rect.height
    );

    // Padding: 4 paski
    // top
    positionOverlay(
      paddingTopBox,
      rect.x + borderLeft,
      rect.y + borderTop,
      rect.width - (borderLeft + borderRight),
      paddingTop
    );
    // bottom
    positionOverlay(
      paddingBottomBox,
      rect.x + borderLeft,
      rect.y + rect.height - borderBottom - paddingBottom,
      rect.width - (borderLeft + borderRight),
      paddingBottom
    );
    // left
    positionOverlay(
      paddingLeftBox,
      rect.x + borderLeft,
      rect.y + borderTop + paddingTop,
      paddingLeft,
      rect.height - (borderTop + borderBottom + paddingTop + paddingBottom)
    );
    // right
    positionOverlay(
      paddingRightBox,
      rect.x + rect.width - borderRight - paddingRight,
      rect.y + borderTop + paddingTop,
      paddingRight,
      rect.height - (borderTop + borderBottom + paddingTop + paddingBottom)
    );

    // Uzupełniamy infoBox
    const tag = el.tagName.toLowerCase();
    const idPart = el.id ? `#${el.id}` : '';
    const classPart = el.classList.length ? '.' + [...el.classList].join('.') : '';
    const label = tag + idPart + classPart;

    infoBox.innerHTML = `
      <strong>${label}</strong><br>
      Size: ${Math.round(rect.width)} x ${Math.round(rect.height)}<br>
      Margin: ${marginTop}/${marginRight}/${marginBottom}/${marginLeft}<br>
      Border: ${borderTop}/${borderRight}/${borderBottom}/${borderLeft}<br>
      Padding: ${paddingTop}/${paddingRight}/${paddingBottom}/${paddingLeft}
    `;

    // Pozycja InfoBox w okolicach prawego-dolnego rogu elementu
    // (dodajemy window.scrollY żeby InfoBox był w okolicach elementu nawet przy scrollowaniu)
    const desiredX = rect.x + rect.width + 10;
    const desiredY = rect.y + rect.height + 10 + window.scrollY;

    positionInfoBox(infoBox, desiredX, desiredY);
  }

  function positionOverlay(overlay, x, y, w, h) {
    overlay.style.left   = x + 'px';
    overlay.style.top    = y + 'px';
    overlay.style.width  = w + 'px';
    overlay.style.height = h + 'px';
    overlay.style.display= 'block';
  }

  // ===========================================================
  // 7. "Mądre" pozycjonowanie InfoBox (korekta w pionie i poziomie)
  // ===========================================================
  function positionInfoBox(overlay, desiredX, desiredY) {
    // Najpierw wyświetlamy "tymczasowo", żeby poznać rozmiary
    overlay.style.display = 'block';
    overlay.style.left = '-9999px';
    overlay.style.top  = '-9999px';

    const boxRect = overlay.getBoundingClientRect();
    const winWidth  = window.innerWidth;
    const winHeight = window.innerHeight;

    let x = desiredX;
    let y = desiredY;

    // Korygujemy jeśli wykracza za prawą krawędź
    if (x + boxRect.width > winWidth - 10) {
      x = winWidth - boxRect.width - 10;
    }
    // Korygujemy jeśli wykracza za dolną krawędź
    if (y + boxRect.height > winHeight - 10) {
      y = winHeight - boxRect.height - 10;
    }

    // Możesz też ograniczyć od góry/lewej, by nie wchodził w 0,0:
    if (x < 10) x = 10;
    if (y < 10) y = 10;

    overlay.style.left = x + 'px';
    overlay.style.top  = y + 'px';
  }

  // ===========================================================
  // 8. Obsługa linii odległości (Shift)
  // ===========================================================
  function showDistanceLineBetween(aRect, bRect) {
    // Znajdź najbliższe punkty bounding-boxów
    const c = getClosestPointsBetweenRects(aRect, bRect);
    distanceLine.style.display = 'block';

    if (c.dist === 0) {
      // Elementy stykają się (lub overlap)
      distanceLine.style.left = c.x1 + 'px';
      distanceLine.style.top  = c.y1 + 'px';
      distanceSegment.style.width = '0px';
      distanceSegment.style.transform = 'none';
      distanceLabel.textContent = '0 px';
      distanceLabel.style.left = '0px';
      return;
    }

    // Mamy faktyczną odległość > 0
    distanceLine.style.left = c.x1 + 'px';
    distanceLine.style.top  = c.y1 + 'px';
    const dx = c.x2 - c.x1;
    const dy = c.y2 - c.y1;
    const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;

    distanceSegment.style.width = c.dist + 'px';
    distanceSegment.style.transform = `rotate(${angleDeg}deg)`;
    distanceLabel.textContent = Math.round(c.dist) + ' px';
    distanceLabel.style.left = (c.dist / 2) + 'px';
  }

  function hideDistanceLine() {
    distanceLine.style.display = 'none';
  }

  function getClosestPointsBetweenRects(a, b) {
    const aX1 = a.x, aY1 = a.y;
    const aX2 = a.x + a.width, aY2 = a.y + a.height;
    const bX1 = b.x, bY1 = b.y;
    const bX2 = b.x + b.width, bY2 = b.y + b.height;

    // Środek B
    const bCenterX = (bX1 + bX2)/2;
    const bCenterY = (bY1 + bY2)/2;

    // Najbliższy punkt w A do środka B
    let pxA, pyA;
    if (bCenterX < aX1) pxA = aX1;
    else if (bCenterX > aX2) pxA = aX2;
    else pxA = bCenterX;

    if (bCenterY < aY1) pyA = aY1;
    else if (bCenterY > aY2) pyA = aY2;
    else pyA = bCenterY;

    // Najbliższy punkt w B do (pxA, pyA)
    let pxB = clamp(pxA, bX1, bX2);
    let pyB = clamp(pyA, bY1, bY2);

    // Odległość
    const dx = pxB - pxA;
    const dy = pyB - pyA;
    const dist = Math.sqrt(dx*dx + dy*dy);

    return { x1: pxA, y1: pyA, x2: pxB, y2: pyB, dist };
  }

  function clamp(val, min, max) {
    return (val < min) ? min : (val > max) ? max : val;
  }

  // ===========================================================
  // 9. Podgląd tabel (td/th) – Ctrl+Shift+T
  // ===========================================================
  function toggleTableDebug() {
    isTableDebugActive = !isTableDebugActive;
    if (isTableDebugActive) {
      showTableCellsOverlays();
    } else {
      hideTableCellsOverlays();
    }
  }

  function showTableCellsOverlays() {
    const cells = document.querySelectorAll('td, th');
    cells.forEach(cell => {
      const r = cell.getBoundingClientRect();
      const overlay = document.createElement('div');
      overlay.className = 'inspector-table-cell-overlay';
      overlay.style.left   = r.x + 'px';
      overlay.style.top    = r.y + 'px';
      overlay.style.width  = r.width + 'px';
      overlay.style.height = r.height + 'px';

      const label = document.createElement('div');
      label.className = 'cell-size-label';
      label.textContent = `${Math.round(r.width)}x${Math.round(r.height)}`;
      overlay.appendChild(label);

      document.body.appendChild(overlay);
      tableCellsOverlays.push(overlay);
    });
  }

  function hideTableCellsOverlays() {
    tableCellsOverlays.forEach(o => o.remove());
    tableCellsOverlays = [];
  }

  // ===========================================================
  // 10. Obsługa zdarzeń (klawiatura, mysz)
  // ===========================================================
  function onMouseMove(e) {
    hoveredElement = e.target;
    if (!isInspectorActive) return;

    if (!isFrozen) {
      highlightElement(hoveredElement);
    } else {
      // Jeśli SHIFT wciśnięty i mamy zamrożony element, pokazuj odległość
      if (isShiftPressed && frozenTarget) {
        const fr = frozenTarget.getBoundingClientRect();
        const hr = hoveredElement.getBoundingClientRect();
        showDistanceLineBetween(fr, hr);
      }
    }
  }

  function onClick(e) {
    if (!isInspectorActive) return;
    // Ctrl + click => freeze / unfreeze
    if (e.ctrlKey) {
      if (!isFrozen) {
        freezeElement(e.target);
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
      return;
    }
    // Włącz/wyłącz debug tabel: Ctrl+Shift+T
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't') {
      e.preventDefault();
      toggleTableDebug();
      return;
    }
    // SHIFT => pomiar odległości
    if (e.key === 'Shift') {
      isShiftPressed = true;
      // Jeśli już jesteśmy zamrożeni i kursor nad elementem, rysuj
      if (isFrozen && hoveredElement) {
        const fr = frozenTarget ? frozenTarget.getBoundingClientRect() : null;
        const hr = hoveredElement.getBoundingClientRect();
        if (fr && hr) {
          showDistanceLineBetween(fr, hr);
        }
      }
    }
  }

  function onKeyUp(e) {
    // Zwolnienie SHIFT
    if (e.key === 'Shift') {
      isShiftPressed = false;
      hideDistanceLine();
    }
  }

  function onMouseLeave() {
    if (!isFrozen) {
      hideElementOverlays();
    }
    hideDistanceLine();
  }

  // ===========================================================
  // 11. Inicjalizacja po załadowaniu DOM
  // ===========================================================
  document.addEventListener('DOMContentLoaded', () => {
    createInspectorStyles();
    createInspectorOverlays();
    createInspectorHelpBox();
    createDistanceLineElements();

    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('keyup', onKeyUp, true);
    document.addEventListener('mouseleave', onMouseLeave, true);
  });

})();
