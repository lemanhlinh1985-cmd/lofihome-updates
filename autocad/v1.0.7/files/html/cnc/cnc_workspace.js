(function () {
  'use strict';

  function placePreview(library, heading, design) {
    const existing = library.querySelector('.corel-preview-toolbar');
    if (existing) {
      // CorelDRAW already moves its toolbar and includes native panel measurements.
      existing.id = 'lofiPreviewToolbar';
      return;
    }
    const views = design.querySelector('.preview-tools');
    const zoom = design.querySelector('.panel-zoom');
    if (!views || !zoom) return;

    const toolbar = document.createElement('div');
    toolbar.id = 'lofiPreviewToolbar';
    toolbar.setAttribute('role', 'group');
    toolbar.setAttribute('aria-label', 'Điều khiển xem trước');
    const position = document.createComment('Thanh xem trước khi phóng rộng');
    views.before(position);
    toolbar.append(views, zoom);

    function update() {
      toolbar.hidden = design.hidden || library.classList.contains('special-frame-active');
      const expanded = design.classList.contains('panel-expanded');
      if (toolbar.parentElement === (expanded ? design : heading)) return;
      const focused = toolbar.contains(document.activeElement) ? document.activeElement : null;
      if (expanded) position.after(toolbar);
      else heading.prepend(toolbar);
      if (focused && !toolbar.hidden) focused.focus({preventScroll: true});
    }

    const observer = new MutationObserver(update);
    observer.observe(design, {attributes: true, attributeFilter: ['hidden', 'class']});
    observer.observe(library, {attributes: true, attributeFilter: ['class']});
    update();
  }

  function placeHeader(header) {
    const buttons = Array.from(header.children).filter(element => element.tagName === 'BUTTON');
    const license = buttons.find(button => button.textContent.trim() === 'Khóa / Dùng thử');
    if (license) license.setAttribute('data-lofi-license', '');

    const capture = document.getElementById('jdpCaptureNow');
    if (capture) {
      header.append(capture);
      capture.title = 'Chọn đường bao trong JDPaint rồi nhận biên dạng 2D (mm)';
      document.getElementById('jdpWorkflow').hidden = true;
      document.getElementById('jdpMaterials').textContent = 'MAP / Vật liệu';
      const count = window.LofiOriginalCNCCatalog.filter(entry => entry.retired !== true).length;
      header.querySelector('small').textContent = count + ' mẫu thư viện · 24 mẫu thiết kế · Đường nét 2D (mm)';
    }
  }

  function install() {
    const header = document.querySelector('header[data-module="cnc"]');
    const library = document.getElementById('originalLibrary');
    if (!header || !library) return;
    const heading = library.querySelector('.original-heading');
    const design = library.querySelector('.panel-design');
    const designNav = document.getElementById('cncDesignerNav');
    const libraryButton = document.getElementById('originalTab');
    const designerButton = document.getElementById('designerTab');
    const tabs = document.querySelector('.cnc-tabs');
    if (!heading || !design || !designNav || !libraryButton || !designerButton) return;

    heading.classList.add('lofi-workspace-heading');
    const actions = document.createElement('div');
    actions.id = 'lofiHeadingActions';
    actions.append(designerButton);
    designerButton.textContent = 'Thiết kế vách';
    libraryButton.textContent = 'Về thư viện';
    heading.append(actions);
    designNav.prepend(libraryButton);
    designNav.append(document.getElementById('reset'));
    if (tabs) tabs.remove();

    placeHeader(header);
    placePreview(library, heading, design);
  }

  // Wait for host event handlers to attach before moving their existing controls.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.setTimeout(install, 0), {once: true});
  } else {
    window.setTimeout(install, 0);
  }
})();
