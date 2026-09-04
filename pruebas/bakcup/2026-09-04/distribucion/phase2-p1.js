(() => {
  const CANVAS_W = 1448;
  const CANVAS_H = 1086;
  const ROTATION_STEP = 15;
  const KEYBOARD_STEP = 1;
  const KEYBOARD_FAST_STEP = 10;

  if (document.documentElement.dataset.phase2P1 === 'ready') return;
  document.documentElement.dataset.phase2P1 = 'ready';

  let p1Drag = null;

  const isEditing = () => {
    const tag = (document.activeElement?.tagName || '').toLowerCase();
    return ['input', 'select', 'textarea'].includes(tag) || Boolean(document.activeElement?.isContentEditable);
  };

  const clampX = (value) => Math.max(0, Math.min(CANVAS_W, value));
  const clampY = (value) => Math.max(0, Math.min(CANVAS_H, value));
  const normalizeRotation = (value) => {
    let next = Number(value) || 0;
    while (next > 180) next -= 360;
    while (next <= -180) next += 360;
    return next;
  };
  const snapRotation = (value) => Math.round(value / ROTATION_STEP) * ROTATION_STEP;

  function pointerTargetItem(event) {
    if (event.target?.closest?.('.tent-vertex')) return null;
    const node = event.target?.closest?.('[data-id]');
    if (!node) return null;
    return getItem(node.getAttribute('data-id'));
  }

  function pointerRotateItem(event) {
    const node = event.target?.closest?.('[data-rotate-id]');
    if (!node) return null;
    return getItem(node.getAttribute('data-rotate-id'));
  }

  function movableSelection(primary) {
    const selection = isSelected(primary.id) ? selectedItems() : [primary];
    return selection.filter((item) => !isItemLocked(item));
  }

  function updateSelectionChipP1() {
    if (!multiToolbarChip) return;
    const count = selectedIds.length;
    if (count > 1) {
      const locked = selectedItems().filter(isItemLocked).length;
      multiToolbarChip.hidden = false;
      multiToolbarChip.textContent = locked
        ? `${count} elementos seleccionados · ${locked} bloqueado(s)`
        : `${count} elementos seleccionados`;
    } else {
      multiToolbarChip.hidden = true;
      multiToolbarChip.textContent = '';
    }
  }

  function renderP1() {
    render();
    updateSelectionChipP1();
  }

  function beginRotate(event, item) {
    if (!item || isItemLocked(item) || measureMode || drawingTent) return false;
    event.preventDefault();
    event.stopImmediatePropagation();

    setSelection(isSelected(item.id) ? selectedIds : [item.id], item.id);
    const point = svgPoint(event);
    p1Drag = {
      mode: 'rotate',
      pointerId: event.pointerId,
      id: item.id,
      startAngle: Math.atan2(point.y - item.y, point.x - item.x),
      startRotation: Number(item.rotation) || 0,
      moved: false
    };
    try { planner.setPointerCapture(event.pointerId); } catch (_) {}
    renderP1();
    return true;
  }

  function beginMove(event, item) {
    if (!item || measureMode || drawingTent) return false;

    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (isSelected(item.id)) {
        const remaining = selectedIds.filter((id) => id !== item.id);
        setSelection(remaining, remaining[0] || '');
      } else {
        setSelection([...selectedIds, item.id], item.id);
      }
      renderP1();
      return true;
    }

    if (isItemLocked(item)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setSelection([item.id], item.id);
      renderP1();
      return true;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    if (!isSelected(item.id)) setSelection([item.id], item.id);
    else selectedId = item.id;

    const point = svgPoint(event);
    const group = movableSelection(item).map((entry) => ({
      id: entry.id,
      startX: entry.x,
      startY: entry.y
    }));
    p1Drag = {
      mode: 'move',
      pointerId: event.pointerId,
      id: item.id,
      dx: point.x - item.x,
      dy: point.y - item.y,
      originX: item.x,
      originY: item.y,
      group,
      moved: false
    };
    try { planner.setPointerCapture(event.pointerId); } catch (_) {}
    renderP1();
    return true;
  }

  function onPointerDown(event) {
    if (event.target?.closest?.('.tent-vertex')) return;
    const rotateItem = pointerRotateItem(event);
    if (rotateItem && beginRotate(event, rotateItem)) return;

    const item = pointerTargetItem(event);
    if (item && beginMove(event, item)) return;

    if (!measureMode && !drawingTent) {
      event.stopImmediatePropagation();
      clearSelection();
      renderP1();
    }
  }

  function onPointerMove(event) {
    const point = svgPoint(event);
    const scale = currentScale();
    if (cursorCoords) cursorCoords.textContent = `x ${(point.x / scale).toFixed(2)} m · y ${(point.y / scale).toFixed(2)} m`;

    if (!p1Drag || event.pointerId !== p1Drag.pointerId) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const item = getItem(p1Drag.id);
    if (!item || isItemLocked(item)) return;

    if (p1Drag.mode === 'rotate') {
      const currentAngle = Math.atan2(point.y - item.y, point.x - item.x);
      let rotation = p1Drag.startRotation + (currentAngle - p1Drag.startAngle) * 180 / Math.PI;
      if (event.shiftKey) rotation = snapRotation(rotation);
      item.rotation = normalizeRotation(rotation);
      p1Drag.moved = true;
      renderP1();
      return;
    }

    const intendedX = clampX(point.x - p1Drag.dx);
    const intendedY = clampY(point.y - p1Drag.dy);
    const snapped = applySmartGuides(intendedX, intendedY, p1Drag.group.map((entry) => entry.id));
    const shiftX = snapped.x - p1Drag.originX;
    const shiftY = snapped.y - p1Drag.originY;

    p1Drag.group.forEach((entry) => {
      const current = getItem(entry.id);
      if (!current || isItemLocked(current)) return;
      current.x = clampX(entry.startX + shiftX);
      current.y = clampY(entry.startY + shiftY);
    });
    p1Drag.moved = true;
    renderP1();
  }

  function endPointerInteraction(event) {
    if (!p1Drag || event.pointerId !== p1Drag.pointerId) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try { planner.releasePointerCapture(event.pointerId); } catch (_) {}
    const moved = p1Drag.moved;
    p1Drag = null;
    guideLines = { vertical: null, horizontal: null };
    if (moved) {
      pushHistory();
      saveCurrentProposalSnapshot();
    }
    renderP1();
  }

  function moveSelectedByKeyboard(dx, dy) {
    const targets = selectedItems().filter((item) => !isItemLocked(item));
    if (!targets.length) return false;
    targets.forEach((item) => {
      item.x = clampX(item.x + dx);
      item.y = clampY(item.y + dy);
    });
    pushHistory();
    renderP1();
    saveCurrentProposalSnapshot();
    return true;
  }

  function rotateSelectedByKeyboard(delta) {
    const targets = selectedItems().filter((item) => !isItemLocked(item));
    if (!targets.length) return false;
    targets.forEach((item) => {
      item.rotation = normalizeRotation((Number(item.rotation) || 0) + delta);
    });
    pushHistory();
    renderP1();
    saveCurrentProposalSnapshot();
    return true;
  }

  function onKeyDown(event) {
    if (isEditing() || measureMode || drawingTent) return;
    const step = event.shiftKey ? KEYBOARD_FAST_STEP : KEYBOARD_STEP;
    let handled = false;

    if (event.key === 'ArrowUp') handled = moveSelectedByKeyboard(0, -step);
    else if (event.key === 'ArrowDown') handled = moveSelectedByKeyboard(0, step);
    else if (event.key === 'ArrowLeft') handled = moveSelectedByKeyboard(-step, 0);
    else if (event.key === 'ArrowRight') handled = moveSelectedByKeyboard(step, 0);
    else if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 'r') {
      handled = rotateSelectedByKeyboard(event.shiftKey ? -ROTATION_STEP : ROTATION_STEP);
    }

    if (handled) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  function reinforceLockButton() {
    const button = document.getElementById('btnToggleLock');
    if (!button || button.dataset.phase2P1Lock === 'ready') return;
    button.dataset.phase2P1Lock = 'ready';
    button.addEventListener('click', () => {
      queueMicrotask(updateSelectionChipP1);
    });
  }

  planner.addEventListener('pointerdown', onPointerDown, true);
  planner.addEventListener('pointermove', onPointerMove, true);
  planner.addEventListener('pointerup', endPointerInteraction, true);
  planner.addEventListener('pointercancel', endPointerInteraction, true);
  document.addEventListener('keydown', onKeyDown, true);
  reinforceLockButton();
  updateSelectionChipP1();

  window.MiGranDiaDistributionPhase2P1 = Object.freeze({
    canvas: { width: CANVAS_W, height: CANVAS_H },
    interaction: {
      ctrlMetaMultiSelect: true,
      groupDrag: true,
      rotationHandle: true,
      shiftRotationSnapDeg: ROTATION_STEP,
      keyboardMovePx: KEYBOARD_STEP,
      keyboardFastMovePx: KEYBOARD_FAST_STEP,
      keyboardRotateDeg: ROTATION_STEP,
      lockedItemsIgnorePointerMove: true,
      lockedItemsIgnoreKeyboardMove: true,
      tentVertexReservedForSpatialEditor: true
    },
    status: 'ready'
  });
})();
