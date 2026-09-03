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
    <div class="section-title-row"><div><h3>Mesa seleccionada</h3><p>Forma, capacidad y estado en un solo inspector.</p></div><span class="count-chip" id="tableInspectorSeatBadge">0/0</span></div>
    <div class="two-col">
      <label class="field"><span>Forma</span><select id="tableInspectorShape"><option value="round">Redonda</option><option value="square">Cuadrada</option><option value="rectangular">Rectangular</option></select></label>
      <label class="field"><span>Capacidad</span><select id="tableInspectorCapacity">${inspectorApi.TABLE_CAPACITIES.map((n)=>`<option value="${n}">${n} personas</option>`).join('')}</select></label>
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
  const capacityNote = section.querySelector('#tableInspectorCapacityNote');
  const badge = section.querySelector('#tableInspectorSeatBadge');
  const occupiedEl = section.querySelector('#tableInspectorOccupied');
  const freeEl = section.querySelector('#tableInspectorFree');

  function currentTable() {
    const item = typeof selected === 'function' ? selected() : null;
    return item?.type === 'table' ? item : null;
  }

  function updateCapacityAvailability(table, model) {
    let firstBlocked = null;
    Array.from(capacitySelect.options).forEach((option) => {
      const capacity = Number(option.value);
      const blocked = capacityApi.blockedSeatsForCapacity?.(table, capacity) || [];
      option.disabled = blocked.length > 0;
      if (!firstBlocked && blocked.length) firstBlocked = blocked;
    });
    if (firstBlocked?.length) {
      const seats = firstBlocked.map((entry) => entry.seatNumber).join(', ');
      capacityNote.textContent = `Para reducir capacidad, mueve o libera primero los asientos ${seats}.`;
    } else if (model.seats.occupied) {
      capacityNote.textContent = 'La capacidad puede cambiar sin perder invitados asignados.';
    } else {
      capacityNote.textContent = 'Capacidades disponibles: 4, 6, 8, 10, 12, 14 y 16.';
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

  const legacyRender = render;
  render = function phase2InspectorAwareRender() {
    const value = legacyRender();
    refresh();
    return value;
  };

  document.documentElement.dataset.phase2TableInspector = 'ready';
  window.MiGranDiaDistributionTableInspectorV1 = Object.freeze({
    status:'ready', refresh, applyTransition, moveCoreIntoTableInspector, restoreCoreControls,
    unifiedTransition:true, memoryOnly:true, preservesNonTableInspector:true,
    captureOwnedControls:true, explainsBlockedCapacity:true
  });
  refresh();
})();