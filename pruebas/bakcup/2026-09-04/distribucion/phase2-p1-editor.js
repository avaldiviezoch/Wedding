(() => {
  const CANVAS_W = 1448;
  const CANVAS_H = 1086;
  const HISTORY_LIMIT = 80;
  const PASTE_OFFSET = 28;
  const DUPLICATE_OFFSET = 35;

  document.documentElement.dataset.phase2P1Editor = 'true';

  const clampX = (value) => Math.max(0, Math.min(CANVAS_W, Number(value) || 0));
  const clampY = (value) => Math.max(0, Math.min(CANVAS_H, Number(value) || 0));

  function unlockedSelectedItems() {
    return selectedItems().filter((item) => !isItemLocked(item));
  }

  function hasUnlockedSelection() {
    return unlockedSelectedItems().length > 0;
  }

  function commitWhenChanged(changed) {
    if (!changed) return false;
    commitMutation();
    return true;
  }

  pushHistory = function phase2P1PushHistory() {
    if (restoringHistory) return;
    const raw = JSON.stringify(stateSnapshot());
    if (historyPast.at(-1) === raw) return;
    historyPast.push(raw);
    if (historyPast.length > HISTORY_LIMIT) historyPast.shift();
    historyFuture = [];
    updateHistoryButtons();
  };

  function bringUnlockedSelectionFront() {
    const chosen = unlockedSelectedItems();
    if (!chosen.length) return false;
    const ids = new Set(chosen.map((item) => item.id));
    const rest = elements.filter((item) => !ids.has(item.id));
    elements = [...rest, ...chosen];
    return commitWhenChanged(true);
  }

  function sendUnlockedSelectionBack() {
    const chosen = unlockedSelectedItems();
    if (!chosen.length) return false;
    const ids = new Set(chosen.map((item) => item.id));
    const rest = elements.filter((item) => !ids.has(item.id));
    elements = [...chosen, ...rest];
    return commitWhenChanged(true);
  }

  function alignUnlockedSelection() {
    const items = selectedItems();
    if (items.length < 2) return false;
    const base = getItem(selectedId) || items[0];
    if (!base) return false;
    let changed = false;
    items.forEach((item) => {
      if (item.id === base.id || isItemLocked(item)) return;
      if (item.y !== base.y) {
        item.y = base.y;
        changed = true;
      }
    });
    return commitWhenChanged(changed);
  }

  function clonePlannerItem(item) {
    const copy = clone(item);
    if (item.type === 'tent' && Array.isArray(item.points)) {
      copy.points = item.points.map((point) => ({ ...point }));
    }
    return copy;
  }

  function clearCopiedTableSeats(copy) {
    if (copy.type !== 'table') return;
    const capacity = Math.max(1, Number(copy.capacity) || 10);
    copy.seats = Array.from({ length: capacity }, () => null);
  }

  function duplicatePrimarySelection() {
    const item = selected();
    if (!item || isItemLocked(item)) return false;
    const copy = clonePlannerItem(item);
    copy.id = makeId(item.type);
    copy.x = clampX((Number(item.x) || 0) + DUPLICATE_OFFSET);
    copy.y = clampY((Number(item.y) || 0) + DUPLICATE_OFFSET);
    copy.label = `${item.label} copia`;
    copy.locked = false;
    clearCopiedTableSeats(copy);
    elements.push(copy);
    setSelection([copy.id], copy.id);
    commitMutation();
    return true;
  }

  copySelectedPlannerItems = function phase2P1CopySelectedPlannerItems() {
    const items = selectedItems();
    if (!items.length) return false;
    copiedPlannerItems = items.map(clonePlannerItem);
    pasteSequence = 0;
    return true;
  };

  pastePlannerItems = function phase2P1PastePlannerItems() {
    if (!copiedPlannerItems.length) return false;
    pasteSequence += 1;
    const offset = PASTE_OFFSET * pasteSequence;
    const copies = copiedPlannerItems.map((sourceItem) => {
      const copy = clonePlannerItem(sourceItem);
      copy.id = makeId(sourceItem.type);
      copy.label = `${sourceItem.label} copia`;
      copy.x = clampX((Number(sourceItem.x) || 0) + offset);
      copy.y = clampY((Number(sourceItem.y) || 0) + offset);
      copy.locked = false;
      clearCopiedTableSeats(copy);
      if (copy.type === 'tent') hiddenLayers.tent = false;
      return copy;
    });
    elements.push(...copies);
    setSelection(copies.map((item) => item.id), copies[0]?.id || '');
    commitMutation();
    return true;
  };

  function deleteUnlockedSelection() {
    const unlocked = unlockedSelectedItems();
    if (!unlocked.length) return false;
    const ids = new Set(unlocked.map((item) => item.id));
    elements = elements.filter((item) => !ids.has(item.id));
    const survivors = selectedIds.filter((id) => getItem(id));
    setSelection(survivors, survivors.includes(selectedId) ? selectedId : (survivors[0] || ''));
    commitMutation();
    return true;
  }

  renderLayerList = function phase2P1RenderLayerList() {
    layerList.replaceChildren();
    const types = Object.keys(LAYERS).filter((type) => elements.some((item) => item.type === type));
    if (!types.length) {
      const empty = document.createElement('div');
      empty.className = 'validation-item';
      empty.textContent = 'Todavía no hay elementos en el plano.';
      layerList.appendChild(empty);
      return;
    }

    types.forEach((type) => {
      const row = document.createElement('div');
      row.className = 'layer-row';

      const eye = document.createElement('button');
      eye.type = 'button';
      eye.className = 'layer-eye';
      eye.textContent = hiddenLayers[type] ? '○' : '●';
      eye.title = hiddenLayers[type] ? 'Mostrar capa' : 'Ocultar capa';
      eye.dataset.layerAction = 'toggle-visibility';
      eye.dataset.layerType = type;
      eye.addEventListener('click', () => {
        hiddenLayers[type] = !hiddenLayers[type];
        if (hiddenLayers[type]) {
          const remaining = selectedIds.filter((id) => getItem(id)?.type !== type);
          const primary = selectedId && getItem(selectedId)?.type !== type ? selectedId : (remaining[0] || '');
          setSelection(remaining, primary);
        }
        commitMutation();
      });

      const text = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = LAYERS[type];
      const small = document.createElement('small');
      const count = elements.filter((item) => item.type === type).length;
      small.textContent = `${count} elemento(s)`;
      text.append(strong, small);

      const lock = document.createElement('button');
      lock.type = 'button';
      lock.className = 'layer-lock';
      lock.textContent = lockedLayers[type] ? '🔒' : '🔓';
      lock.title = lockedLayers[type] ? 'Desbloquear capa' : 'Bloquear capa';
      lock.dataset.layerAction = 'toggle-lock';
      lock.dataset.layerType = type;
      lock.addEventListener('click', () => {
        lockedLayers[type] = !lockedLayers[type];
        commitMutation();
      });

      row.append(eye, text, lock);
      layerList.appendChild(row);
    });
  };

  function showAllLayers() {
    let changed = false;
    Object.keys(LAYERS).forEach((type) => {
      if (hiddenLayers[type]) {
        hiddenLayers[type] = false;
        changed = true;
      }
    });
    return commitWhenChanged(changed);
  }

  function unlockEverything() {
    let changed = false;
    Object.keys(LAYERS).forEach((type) => {
      if (lockedLayers[type]) {
        lockedLayers[type] = false;
        changed = true;
      }
    });
    elements.forEach((item) => {
      if (item.locked) {
        item.locked = false;
        changed = true;
      }
    });
    return commitWhenChanged(changed);
  }

  const originalRenderInspector = typeof renderInspector === 'function' ? renderInspector : null;
  if (originalRenderInspector) {
    renderInspector = function phase2P1RenderInspector() {
      originalRenderInspector();
      const items = selectedItems();
      const primary = selected();
      const unlocked = items.filter((item) => !isItemLocked(item));
      const base = getItem(selectedId) || items[0] || null;
      const alignable = Boolean(base && items.some((item) => item.id !== base.id && !isItemLocked(item)));

      const deleteButton = document.getElementById('btnDelete');
      const duplicateButton = document.getElementById('btnDuplicate');
      const frontButton = document.getElementById('btnBringFront');
      const backButton = document.getElementById('btnSendBack');
      const alignButton = document.getElementById('btnAlignNow');

      if (deleteButton) deleteButton.disabled = unlocked.length === 0;
      if (duplicateButton) duplicateButton.disabled = !primary || isItemLocked(primary);
      if (frontButton) frontButton.disabled = unlocked.length === 0;
      if (backButton) backButton.disabled = unlocked.length === 0;
      if (alignButton) alignButton.disabled = items.length < 2 || !alignable;
    };
  }

  function captureButton(id, handler) {
    const button = document.getElementById(id);
    if (!button) return;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      handler();
    }, true);
  }

  captureButton('btnBringFront', bringUnlockedSelectionFront);
  captureButton('btnSendBack', sendUnlockedSelectionBack);
  captureButton('btnAlignNow', alignUnlockedSelection);
  captureButton('btnDuplicate', duplicatePrimarySelection);
  captureButton('btnDelete', deleteUnlockedSelection);
  captureButton('btnShowAllLayers', showAllLayers);
  captureButton('btnUnlockAllLayers', unlockEverything);

  render();
  updateHistoryButtons();

  window.MiGranDiaDistributionPhase2P1Editor = Object.freeze({
    historyLimit: HISTORY_LIMIT,
    pasteOffset: PASTE_OFFSET,
    duplicateOffset: DUPLICATE_OFFSET,
    canvas: { width: CANVAS_W, height: CANVAS_H },
    status: 'ready'
  });
})();
