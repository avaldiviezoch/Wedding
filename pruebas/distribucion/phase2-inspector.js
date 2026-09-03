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
    <div class="summary-list" id="tableInspectorSeatSummary">
      <div><dt>Asignados</dt><dd id="tableInspectorOccupied">0</dd></div>
      <div><dt>Libres</dt><dd id="tableInspectorFree">0</dd></div>
    </div>
    <div id="tableInspectorCoreFields"></div>
  `;
  seatWrap.insertAdjacentElement('beforebegin', section);

  const core = section.querySelector('#tableInspectorCoreFields');
  ['selLabel','selRot','selColor'].forEach((id) => {
    const input = document.getElementById(id);
    const field = input?.closest('.field');
    if (field) core.appendChild(field);
  });
  const lockButton = document.getElementById('btnToggleLock');
  if (lockButton) {
    const lockWrap = document.createElement('div');
    lockWrap.className = 'action-grid';
    lockWrap.appendChild(lockButton);
    core.appendChild(lockWrap);
  }

  const legacyShape = document.getElementById('phase2TableShapeControls');
  const legacyCapacity = document.getElementById('phase2CapacityControls');
  if (legacyShape) legacyShape.hidden = true;
  if (legacyCapacity) legacyCapacity.hidden = true;

  const shapeSelect = section.querySelector('#tableInspectorShape');
  const capacitySelect = section.querySelector('#tableInspectorCapacity');
  const badge = section.querySelector('#tableInspectorSeatBadge');
  const occupiedEl = section.querySelector('#tableInspectorOccupied');
  const freeEl = section.querySelector('#tableInspectorFree');

  function currentTable() {
    const item = typeof selected === 'function' ? selected() : null;
    return item?.type === 'table' ? item : null;
  }

  function refresh() {
    const table = currentTable();
    const model = inspectorApi.tableInspectorModel(table);
    section.hidden = !model;
    if (!model) return;
    shapeSelect.value = model.shape;
    capacitySelect.value = String(model.capacity);
    badge.textContent = `${model.seats.occupied}/${model.seats.capacity}`;
    occupiedEl.textContent = String(model.seats.occupied);
    freeEl.textContent = String(model.seats.free);
    const lock = document.getElementById('btnToggleLock');
    if (lock) lock.textContent = model.locked ? '🔓 Desbloquear' : '🔒 Bloquear';
  }

  function applyTransition(request) {
    const table = currentTable();
    if (!table) return;
    const result = capacityApi.transitionTable(table, request);
    if (!result?.ok) {
      refresh();
      return;
    }
    refresh();
  }

  shapeSelect.addEventListener('change', () => applyTransition({ shape: shapeSelect.value }));
  capacitySelect.addEventListener('change', () => applyTransition({ capacity: Number(capacitySelect.value) }));

  const legacyRender = render;
  render = function phase2InspectorAwareRender() {
    const value = legacyRender();
    refresh();
    return value;
  };

  document.documentElement.dataset.phase2TableInspector = 'ready';
  window.MiGranDiaDistributionTableInspectorV1 = Object.freeze({ status:'ready', refresh, applyTransition, unifiedTransition:true, memoryOnly:true });
  refresh();
})();
