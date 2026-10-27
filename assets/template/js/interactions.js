function startDrag(e, onMove, onEnd, bodyClass) {
  const el = e.currentTarget;
  const startX = e.clientX, startY = e.clientY;
  try { el.setPointerCapture(e.pointerId); } catch (err) { /* 忽略 */ }
  document.body.classList.add(bodyClass);

  const move = (ev) => onMove(ev, { startX, startY });
  const end = () => {
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', end);
    el.removeEventListener('pointercancel', end);
    window.removeEventListener('pointerup', end);
    window.removeEventListener('mouseup', end);
    window.removeEventListener('blur', end);
    document.body.classList.remove(bodyClass);
    el.classList.remove('dragging');
    if (onEnd) onEnd();
  };
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  // 兜底：即使指针捕获不可用，松手/失焦也一定结束拖拽
  window.addEventListener('pointerup', end);
  window.addEventListener('mouseup', end);
  window.addEventListener('blur', end);
  el.classList.add('dragging');
}

/* 编辑区高度：拖动向下加高，上限 90vh，高度被记住 */
function startEditResize(e, content) {
  e.preventDefault();
  const startH = content.getBoundingClientRect().height;
  startDrag(e,
    (ev, { startY }) => {
      const h = Math.max(64, Math.min(window.innerHeight * 0.9, startH + (ev.clientY - startY)));
      content.style.height = h + 'px';
    },
    () => saveLayout('prdEditH', Math.round(parseFloat(content.style.height))),
    'resizing-row');
}

/* PRD 窗格宽度：拖拽左右调整，双击复位；宽度被记住 */
function bindPrdResizer() {
  const rz = $('#prdResizer');
  const prd = $('#prd');
  if (!rz || !prd) return;
  const clamp = (w) => Math.max(260, Math.min(window.innerWidth - 460, w));

  const saved = loadLayout('prdW');
  if (saved && saved >= 260) prd.style.width = clamp(saved) + 'px';

  rz.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    startDrag(e,
      (ev) => { prd.style.width = clamp(window.innerWidth - ev.clientX) + 'px'; },
      () => saveLayout('prdW', Math.round(parseFloat(prd.style.width))),
      'resizing-col');
  });

  rz.addEventListener('dblclick', () => { prd.style.width = ''; saveLayout('prdW', null); });

  window.addEventListener('resize', () => {
    if (prd.style.width) prd.style.width = clamp(parseFloat(prd.style.width)) + 'px';
  });
}

/* 打包当前数据并另存为；未保存的编辑合并到同一次保存。 */
async function exportSingleFile() {
  if (state.portableBusy) return;
  state.portableBusy = true;
  const next = JSON.parse(JSON.stringify(D));
  if (state.prdEditing) next.prd = Object.assign({}, next.prd || {}, { sections: collectPrdEdits() });
  try {
    const filename = await downloadWorkbench(next, '');
    if (state.prdEditing) {
      D.prd = next.prd;
      state.prdEditing = false;
      setPrdButtons(false);
      renderPrd();
    }
    setPrdStatus('已保存 ' + filename, 'ok');
  } catch (err) {
    if (err?.name === 'AbortError') return;
    setPrdStatus('导出失败：' + err.message, 'err');
  } finally {
    state.portableBusy = false;
  }
}
