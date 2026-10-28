function init() {
  ensurePanner();
  // 三栏固定称呼：画布导航 | 画布详情 | 产品需求说明书（与 GUIDE 术语一致，覆盖旧模板文案）
  $('#navProjectTitle').textContent = '画布导航';
  if (D.project?.title) document.title = D.project.title;
  const prdTitle = document.querySelector('.prd-title');
  if (prdTitle) prdTitle.textContent = '产品需求说明书';
  buildNavTree();
  renderPrd();
  state.selectedCardId = D.pages[0]?.cards?.[0]?.id || null;
  renderPage();
  markSelected();
  bindViewport();
  bindPrdResizer();
  if (D.pages[0]?.cards?.[0]?.prdId) openPrdForCard(state.selectedCardId);
  else syncPrdToPage(state.currentPageId);
  // 首屏自动适应内容
  requestAnimationFrame(() => fitAll());

  $('#zoomInBtn').addEventListener('click', () => { const c = viewportCenter(); zoomAt(1.2, c.x, c.y); });
  $('#zoomOutBtn').addEventListener('click', () => { const c = viewportCenter(); zoomAt(1 / 1.2, c.x, c.y); });
  $('#fitAllBtn').addEventListener('click', fitAll);
  $('#originBtn').addEventListener('click', resetOrigin);
  $('#focusBtn').addEventListener('click', () => {
    if (state.selectedCardId) focusCard(state.selectedCardId);
  });
  $('#flowFullscreenBtn').addEventListener('click', () => setFlowFullscreen(!state.flowFullscreen));
  $('#prdTocBtn').addEventListener('click', () => {
    const toc = $('#prdToc');
    const btn = $('#prdTocBtn');
    const open = toc.classList.toggle('hidden') === false;
    btn.classList.toggle('is-open', open);
    btn.classList.toggle('is-closed', !open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? '收起目录' : '展开目录');
    btn.title = open ? '收起目录' : '展开目录';
  });

  $('#prdEditBtn').classList.remove('hidden');
  $('#prdEditBtn').title = '编辑产品需求说明书';
  $('#prdSaveBtn').title = '下载新的 HTML（Ctrl+S）';
  $('#prdEditBtn').addEventListener('click', enterPrdEdit);
  $('#prdSaveBtn').addEventListener('click', savePrd);
  $('#prdCancelBtn').addEventListener('click', cancelPrdEdit);
  $('#exportBtn').classList.remove('hidden');
  $('#exportBtn').addEventListener('click', exportSingleFile);
}

document.addEventListener('DOMContentLoaded', init);
