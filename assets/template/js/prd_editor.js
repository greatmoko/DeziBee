function renderPrdEditor(body, toc, sections) {
  toc.innerHTML = '<div class="toc-item lvl2 active">编辑中…</div>';
  if (!sections.length) {
    body.appendChild(el('p', '', '当前没有 PRD 章节 — 可在 DeziBee 对话里让 AI 先创建。'));
    return;
  }
  sections.forEach((sec, idx) => {
    const wrap = el('section', 'prd-edit-sec');
    wrap.dataset.idx = String(idx);
    wrap.dataset.secId = sec.id || '';

    const head = el('div', 'prd-edit-head');
    const title = document.createElement('input');
    title.className = 'prd-edit-title';
    title.value = sec.title || sec.id || '';
    title.placeholder = '章节标题';
    head.appendChild(title);
    const level = document.createElement('select');
    level.className = 'prd-edit-level';
    for (const l of [2, 3, 4]) {
      const o = document.createElement('option');
      o.value = String(l); o.textContent = 'H' + l;
      if ((sec.level || 2) === l) o.selected = true;
      level.appendChild(o);
    }
    head.appendChild(level);
    wrap.appendChild(head);

    const content = document.createElement('div');
    content.className = 'prd-edit-content';
    content.contentEditable = 'true';
    content.innerHTML = sec.html || '';
    // 恢复上次拖动的高度（默认 46vh 由 CSS 给）
    const savedH = loadLayout('prdEditH');
    if (savedH && savedH >= 64) content.style.height = savedH + 'px';
    wrap.appendChild(content);

    // 高度拖拽手柄：向下拖加高编辑区
    const grip = el('div', 'prd-edit-grip');
    grip.title = '上下拖动调整编辑区高度';
    grip.addEventListener('pointerdown', (e) => startEditResize(e, content));
    wrap.appendChild(grip);

    body.appendChild(wrap);
  });
}

/* 收集编辑结果：id 保持原值 → 卡片 prdId 关联不断 */
function collectPrdEdits() {
  const orig = D.prd?.sections || [];
  const out = [];
  document.querySelectorAll('#prdBody .prd-edit-sec').forEach((wrap) => {
    const sec = orig[Number(wrap.dataset.idx)] || {};
    out.push({
      ...sec,
      id: sec.id,
      title: wrap.querySelector('.prd-edit-title').value.trim() || sec.id,
      level: Number(wrap.querySelector('.prd-edit-level').value) || 2,
      html: wrap.querySelector('.prd-edit-content').innerHTML,
    });
  });
  return out;
}

async function savePrd() {
  if (!state.prdEditing || state.portableBusy) return;
  state.portableBusy = true;
  const next = JSON.parse(JSON.stringify(D));
  next.prd = Object.assign({}, next.prd || {}, { sections: collectPrdEdits() });
  try {
    const filename = await downloadWorkbench(next, '-updated');
    D.prd = next.prd;
    state.prdEditing = false;
    setPrdButtons(false);
    renderPrd();
    setPrdStatus('已保存 ' + filename, 'ok');
  } catch (err) {
    if (err?.name === 'AbortError') return;
    setPrdStatus('保存失败：' + err.message, 'err');
  } finally {
    state.portableBusy = false;
  }
}
