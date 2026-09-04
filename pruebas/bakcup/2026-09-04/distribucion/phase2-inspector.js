(() => {
  if (document.documentElement.dataset.phase2TableInspector === 'ready') return;

  const inspectorApi = window.MiGranDiaDistributionUIInspector;
  const capacityApi = window.MiGranDiaDistributionCapacityV1;
  if (!inspectorApi || !capacityApi?.transitionTable) throw new Error('Inspector de mesa requiere UI inspector y transición unificada');

  const form = document.getElementById('selectionForm');
  const firstSection = form?.querySelector('.panel-section.first-section');
  const seatWrap = document.getElementById('seatEditorWrap');
  if (!form || !firstSection || !seatWrap) return;

  const section = document.createElement('section');
  section.id = 'phase2TableInspector';
  section.className = 'panel-section';
  section.hidden = true;
  section.innerHTML = `
    <div class="section-title-row"><div><h3>Mesa seleccionada</h3><p>Forma, sillas, acomodo y estado en un solo inspector.</p></div><span class="count-chip" id="tableInspectorSeatBadge">0/0</span></div>
    <div class="two-col">
      <label class="field"><span>Forma</span><select id="tableInspectorShape"><option value="round">Redonda</option><option value="square">Cuadrada</option><option value="rectangular">Rectangular</option></select></label>
      <label class="field"><span>Número de sillas</span><select id="tableInspectorCapacity">${inspectorApi.TABLE_CAPACITIES.map((n)=>`<option value="${n}">${n} sillas</option>`).join('')}</select></label>
    </div>
    <label class="field"><span>Acomodo de sillas</span><select id="tableInspectorSeatLayout"></select></label>
    <div class="action-grid" id="tableInspectorChairStepper">
      <button type="button" id="tableInspectorSeatMinus">− Menos sillas</button>
      <button type="button" id="tableInspectorSeatCount" disabled>10 sillas</button>
      <button type="button" id="tableInspectorSeatPlus">+ Más sillas</button>
    </div>
    <p class="field-note" id="tableInspectorCapacityNote"></p>
    <div class="summary-list" id="tableInspectorSeatSummary">
      <div><dt>Asignados</dt><dd id="tableInspectorOccupied">0</dd></div>
      <div><dt>Libres</dt><dd id="tableInspectorFree">0</dd></div>
    </div>
    <div id="tableInspectorCoreFields"></div>
  `;
  seatWrap.insertAdjacentElement('beforebegin', section);

  const core = section.querySelector('#tableInspectorCoreFields');
  const movedControls = [];

  function registerMovable(node, key) {
    if (!node?.parentNode) return;
    const placeholder = document.createComment(`phase2-inspector-${key}`);
    node.parentNode.insertBefore(placeholder, node);
    movedControls.push({ node, placeholder });
  }

  ['selLabel','selRot','selColor'].forEach((id) => {
    const input = document.getElementById(id);
    registerMovable(input?.closest('.field'), id);
  });

  const lockButton = document.getElementById('btnToggleLock');
  registerMovable(lockButton, 'btnToggleLock');
  const lockWrap = document.createElement('div');
  lockWrap.className = 'action-grid';
  core.appendChild(lockWrap);

  function moveCoreIntoTableInspector() {
    movedControls.forEach(({ node }) => {
      if (node === lockButton) lockWrap.appendChild(node);
      else core.insertBefore(node, lockWrap);
    });
  }

  function restoreCoreControls() {
    movedControls.forEach(({ node, placeholder }) => {
      if (placeholder.parentNode && node.parentNode !== placeholder.parentNode) {
        placeholder.parentNode.insertBefore(node, placeholder.nextSibling);
      }
    });
  }

  const legacyShape = document.getElementById('phase2TableShapeControls');
  const legacyCapacity = document.getElementById('phase2CapacityControls');
  if (legacyShape) legacyShape.hidden = true;
  if (legacyCapacity) legacyCapacity.hidden = true;

  const shapeSelect = section.querySelector('#tableInspectorShape');
  const capacitySelect = section.querySelector('#tableInspectorCapacity');
  const seatLayoutSelect = section.querySelector('#tableInspectorSeatLayout');
  const capacityNote = section.querySelector('#tableInspectorCapacityNote');
  const seatMinus = section.querySelector('#tableInspectorSeatMinus');
  const seatPlus = section.querySelector('#tableInspectorSeatPlus');
  const seatCountButton = section.querySelector('#tableInspectorSeatCount');
  const badge = section.querySelector('#tableInspectorSeatBadge');
  const occupiedEl = section.querySelector('#tableInspectorOccupied');
  const freeEl = section.querySelector('#tableInspectorFree');
  const capacities = Array.from(inspectorApi.TABLE_CAPACITIES);

  function currentTable() {
    const item = typeof selected === 'function' ? selected() : null;
    return item?.type === 'table' ? item : null;
  }

  function capacityIndex(value) {
    return capacities.indexOf(Number(value));
  }

  function neighborCapacity(value, direction) {
    const index = capacityIndex(value);
    if (index < 0) return null;
    const next = index + direction;
    return next >= 0 && next < capacities.length ? capacities[next] : null;
  }

  function updateSeatLayoutOptions(table) {
    const variants = capacityApi.seatLayoutVariants?.(table) || [];
    const active = capacityApi.normalizeSeatLayout?.(table) || variants[0]?.id || 'default';
    seatLayoutSelect.replaceChildren(...variants.map((variant) => {
      const option = document.createElement('option');
      option.value = variant.id;
      option.textContent = variant.label;
      return option;
    }));
    seatLayoutSelect.value = active;
    seatLayoutSelect.disabled = variants.length <= 1 || Boolean(table?.locked);
  }

  function updateCapacityAvailability(table, model) {
    let firstBlocked = null;
    Array.from(capacitySelect.options).forEach((option) => {
      const capacity = Number(option.value);
      const blocked = capacityApi.blockedSeatsForCapacity?.(table, capacity) || [];
      option.disabled = blocked.length > 0;
      if (!firstBlocked && blocked.length) firstBlocked = blocked;
    });

    const lower = neighborCapacity(model.capacity, -1);
    const upper = neighborCapacity(model.capacity, 1);
    const lowerBlocked = lower == null ? [] : (capacityApi.blockedSeatsForCapacity?.(table, lower) || []);
    seatMinus.disabled = lower == null || lowerBlocked.length > 0 || model.locked;
    seatPlus.disabled = upper == null || model.locked;
    seatCountButton.textContent = `${model.capacity} sillas`;

    if (firstBlocked?.length) {
      const seats = firstBlocked.map((entry) => entry.seatNumber).join(', ');
      capacityNote.textContent = `Puedes agregar sillas libremente. Para reducir, mueve o libera primero los asientos ${seats}.`;
    } else if (model.seats.occupied) {
      capacityNote.textContent = 'Usa − / + para cambiar sillas y “Acomodo” para elegir su distribución sin perder invitados.';
    } else {
      capacityNote.textContent = 'Sillas disponibles: 4, 6, 8, 10, 12, 14 y 16. El acomodo depende de la forma y cantidad.';
    }
  }

  function refresh() {
    const table = currentTable();
    const model = inspectorApi.tableInspectorModel(table);
    if (!model) {
      section.hidden = true;
      restoreCoreControls();
      return;
    }
    moveCoreIntoTableInspector();
    section.hidden = false;
    shapeSelect.value = model.shape;
    capacitySelect.value = String(model.capacity);
    updateSeatLayoutOptions(table);
    updateCapacityAvailability(table, model);
    badge.textContent = `${model.seats.occupied}/${model.seats.capacity}`;
    occupiedEl.textContent = String(model.seats.occupied);
    freeEl.textContent = String(model.seats.free);
    const lock = document.getElementById('btnToggleLock');
    if (lock) lock.textContent = model.locked ? '🔓 Desbloquear' : '🔒 Bloquear';
  }

  function applyTransition(request) {
    const table = currentTable();
    if (!table) return Object.freeze({ ok:false, reason:'missing-table' });
    const result = capacityApi.transitionTable(table, request);
    refresh();
    return result;
  }

  function stepSeats(direction) {
    const table = currentTable();
    if (!table) return Object.freeze({ ok:false, reason:'missing-table' });
    const next = neighborCapacity(table.capacity, direction);
    if (next == null) return Object.freeze({ ok:false, reason:'limit' });
    return applyTransition({ capacity:next });
  }

  shapeSelect.addEventListener('change', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    applyTransition({ shape: shapeSelect.value });
  }, true);

  capacitySelect.addEventListener('change', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    applyTransition({ capacity: Number(capacitySelect.value) });
  }, true);

  seatLayoutSelect.addEventListener('change', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const table = currentTable();
    if (table) capacityApi.setSeatLayoutVariant?.(table, seatLayoutSelect.value);
    refresh();
  }, true);

  seatMinus.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    stepSeats(-1);
  }, true);

  seatPlus.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    stepSeats(1);
  }, true);

  const legacyRender = render;
  render = function phase2InspectorAwareRender() {
    const value = legacyRender();
    refresh();
    return value;
  };

  document.documentElement.dataset.phase2TableInspector = 'ready';
  window.MiGranDiaDistributionTableInspectorV1 = Object.freeze({
    status:'ready', refresh, applyTransition, stepSeats, neighborCapacity, updateSeatLayoutOptions,
    moveCoreIntoTableInspector, restoreCoreControls,
    unifiedTransition:true, memoryOnly:true, preservesNonTableInspector:true,
    captureOwnedControls:true, explainsBlockedCapacity:true,
    explicitChairStepper:true, explicitSeatLayoutSelector:true
  });
  refresh();
})();