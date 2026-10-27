function renderPrd() {
  const body = $('#prdBody');
  const toc = $('#prdToc');
  body.innerHTML = ''; toc.innerHTML = '';
  const sections = D.prd?.sections || [];

  if (state.prdEditing) { renderPrdEditor(body, toc, sections); return; }

  for (const sec of sections) {
    // 目录项
    const t = el('div', `toc-item lvl${sec.level || 2}`, sec.title || sec.id);
    t.dataset.secId = sec.id;
    t.addEventListener('click', () => openPrdSection(sec.id));
    toc.appendChild(t);

    // 章节
    const wrap = el('section', `prd-section`);
    wrap.id = 'sec-' + sec.id;
    wrap.dataset.secId = sec.id;
    const h = el('h' + (sec.level || 2), '', sec.title || sec.id);
    wrap.appendChild(h);
    const content = document.createElement('div');
    content.innerHTML = sec.html || '';
    // 把 <a data-prd-ref="card-xxx"> 或 <span class="prd-ref" data-card="..."> 转成可点击引用
    content.querySelectorAll('[data-card-ref]').forEach(refEl => {
      refEl.classList.add('prd-ref');
      refEl.addEventListener('click', () => focusCard(refEl.dataset.cardRef));
    });
    wrap.appendChild(content);
    body.appendChild(wrap);
  }
}

/* 卡片 → PRD：定位对应章节并高亮（唯一 ID：card.prdId ↔ section.id） */
function openPrdForCard(cardId) {
  const rec = cardIndex.get(cardId);
  if (!rec) return;
  const prdId = rec.card.prdId;
  if (!prdId) return;
  openPrdSection(prdId, { fromCard: cardId });
}

function openPrdSection(secId, opts = {}) {
  if (state.prdEditing) return;   // 编辑 PRD 时不抢滚动位置
  const node = document.getElementById('sec-' + CSS.escape(secId));
  if (!node) return;
  node.scrollIntoView({ behavior: 'smooth', block: 'start' });
  node.classList.remove('section-flash'); void node.offsetWidth;
  node.classList.add('section-flash');
  // TOC 高亮
  document.querySelectorAll('.toc-item').forEach(t =>
    t.classList.toggle('active', t.dataset.secId === secId));
  // 反向：来源卡片闪烁
  if (opts.fromCard) {
    const n = $(`#world [data-card-id="${CSS.escape(opts.fromCard)}"]`);
    if (n) { n.classList.remove('flash'); void n.offsetWidth; n.classList.add('flash'); }
  }
}

/* 独立 Skill 的 PRD 在浏览器编辑，保存为新的自包含 HTML。 */

/* 布局偏好（PRD 宽度 / 编辑区高度）本地记忆；隐私模式等取不到 localStorage 时静默降级 */
function saveLayout(key, val) {
  try {
    if (val == null) localStorage.removeItem('dezibee.' + key);
    else localStorage.setItem('dezibee.' + key, String(val));
  } catch (e) { /* 忽略 */ }
}

function loadLayout(key) {
  try {
    const v = localStorage.getItem('dezibee.' + key);
    return v == null ? null : Number(v);
  } catch (e) { return null; }
}

function canEditPrd() { return true; }

function setPrdStatus(msg, kind) {
  const n = $('#prdStatus');
  if (!msg) { n.textContent = ''; n.className = 'prd-status hidden'; return; }
  n.textContent = msg;
  n.className = 'prd-status ' + (kind || 'info');
}

function setPrdButtons(editing) {
  $('#prdEditBtn').classList.toggle('hidden', editing);
  $('#prdSaveBtn').classList.toggle('hidden', !editing);
  $('#prdCancelBtn').classList.toggle('hidden', !editing);
  $('#prdTocBtn').classList.toggle('hidden', editing);
  $('#prdToc').classList.toggle('hidden', editing);
}

function enterPrdEdit() {
  state.prdEditing = true;
  setPrdButtons(true);
  renderPrd();
  setPrdStatus('', '');
}

function cancelPrdEdit() {
  state.prdEditing = false;
  setPrdButtons(false);
  renderPrd();
  setPrdStatus('', '');
}

/* 编辑态渲染：标题输入 + 层级选择 + 富文本正文（WYSIWYG） */
