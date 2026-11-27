(function () {
  'use strict';

  const by = id => document.getElementById(id);
  const library = by('originalLibrary');
  const filters = by('originalFilters');
  const group = by('originalGroup');
  const cards = by('originalCards');
  const search = by('originalSearch');
  const arrange = by('originalArrange');
  const ordinaryDesign = library && library.querySelector('.panel-design');
  const ordinaryEditor = library && library.querySelector('.panel-feature-editor');
  const modeRow = ordinaryEditor && ordinaryEditor.querySelector('.panel-mode-row');
  const host = window.LofiSpecialFrameHost;
  if (!ordinaryDesign || !modeRow || !filters || !host || window.LofiSpecialFrame) return;

  const categoryId = 'lofi_special_geometry';
  const frameId = 'patterns__khung_hai_vung';
  const categoryName = 'Hình học đặc biệt';
  const frameName = 'Khung hai vùng';
  const dimensionKeys = ['w', 'h', 'depth', 'left', 'right', 'top', 'bottom', 'lower', 'rail'];
  const slots = ['upper', 'lower'];
  const defaultConfig = {
    w: 760, h: 1471, depth: 18, left: 40, right: 40, top: 40, bottom: 40, lower: 574, rail: 40
  };
  const catalog = new Map(window.LofiOriginalCNCCatalog.map(entry => [entry.id, entry]));
  const slotNames = { upper: 'Vùng trên', lower: 'Vùng dưới' };
  const featureNames = { insert: 'Họa tiết chèn', border: 'Chạy viền', cut: 'Đục tấm' };
  const inputs = {};
  const artwork = {};
  const destinations = {};
  const features = {};
  const patternControls = {};
  const patternPreviews = {};
  const toolControls = {};
  const solidZones = {upper: false, lower: false};
  const defaultPatternScale = window.LofiSpecialFramePatterns?.defaultScale ?? 220;
  const patternNumbers = {
    pattern_scale: ['scale', 'Cỡ hoa văn (mm)', 20, 3000, defaultPatternScale],
    web_adjust: ['web', 'Bù dày/mỏng nét (mm)', -30, 30, 0],
    margin: ['margin', 'Khoảng lùi (mm)', 0, 1000, 0],
    left: ['left', 'Lùi trái (mm)', 0, 1000, 0],
    right: ['right', 'Lùi phải (mm)', 0, 1000, 0],
    top: ['top', 'Lùi trên (mm)', 0, 1000, 0],
    bottom: ['bottom', 'Lùi dưới (mm)', 0, 1000, 0],
    angle: ['angle', 'Xoay hoa văn (°)', -360, 360, 0],
    offset_x: ['offsetX', 'Dịch X (mm)', -10000, 10000, 0],
    offset_y: ['offsetY', 'Dịch Y (mm)', -10000, 10000, 0]
  };
  const patternFlags = {
    equal_margins: ['equalMargins', 'Chia đều khoảng lùi 4 cạnh', true],
    weld: ['weld', 'Hàn với khung', true],
    follow_frame: ['follow', 'Bám theo viền', true]
  };
  const separateMargins = ['left', 'right', 'top', 'bottom'];
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const modeToggles = {solid: by('panelSolid'), hollow: by('panelHollow'), frameless: by('panelFrameless')};
  let ordinaryModeChecks = {};
  let frameMode = 'pattern';
  let active = false;
  let loaded = false;
  let applying = false;
  let previousMode = 'panelMode';
  let pick = null;
  let drag = null;
  let validationError = false;
  let applySequence = 0;

  const styles = document.createElement('style');
  styles.textContent = `
    #originalLibrary:not(.special-frame-active) #specialFramePreview,
    #originalLibrary:not(.special-frame-active) :is(#specialFrameEditor,#specialFrameTargets),
    #originalLibrary.special-frame-active .panel-design > :not(#specialFramePreview),
    #originalLibrary.special-frame-active .panel-feature-editor > :not(.panel-mode-row):not(#specialFrameEditor):not(#specialFrameTargets),
    #originalLibrary.special-frame-active :is(#panelFeatureBar,#panelRegionBatch,.original-design,.original-editor,.panel-mode) { display:none!important; }
    #originalLibrary.special-frame-active :is(.panel-design,.panel-feature-editor) { display:flex!important; }
    #originalLibrary:not(.special-frame-active) #specialFrameDelete { display:none!important; }
    #originalLibrary.special-frame-active .panel-mode-row { display:grid!important; grid-template-columns:repeat(4,minmax(0,1fr)); align-items:stretch; }
    #originalLibrary.special-frame-active .panel-mode-row .panel-toggle { width:auto!important; padding:5px 3px!important; gap:3px!important; font-size:9px!important; line-height:1.2; white-space:normal!important; }
    #specialFrameDelete { min-width:0; white-space:normal; align-self:stretch; padding:5px 3px; color:#9a2923; background:#fff8f6; border-color:#e6bdb3; font-size:10px; font-weight:650; line-height:1.2; }
    #specialFrameEditor { flex:1; min-height:0; min-width:0; overflow:auto; padding:0 4px 0 0; overscroll-behavior:contain; }
    #specialFrameEditor fieldset { min-width:0; margin:0 0 8px; padding:8px; border:1px solid #dce5e7; border-radius:6px; background:#f7fafb; }
    #specialFrameEditor legend { padding:0 4px; font-size:12px; font-weight:650; }
    #specialFrameEditor .special-frame-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:6px; }
    #specialFrameEditor #specialFrameEdges { grid-template-columns:repeat(4,minmax(0,1fr)); gap:4px; }
    #specialFrameEditor label { display:grid; gap:3px; min-width:0; margin:0; font-size:11px; }
    #specialFrameEditor :is(input,select) { min-width:0; width:100%; padding:5px 6px; margin:0; font-variant-numeric:tabular-nums; }
    #specialFrameEditor #specialFrameEdges label { white-space:nowrap; }
    #specialFrameEditor #specialFrameEdges input { padding-inline:4px; }
    #specialFrameEditor .special-frame-art { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:4px; }
    #specialFrameEditor .special-frame-art + .special-frame-art { margin-top:8px; }
    #specialFrameEditor .special-frame-art label { grid-column:1/-1; }
    #specialFrameEditor .special-frame-art button { padding:4px; font-size:11px; }
    #specialFrameTargets { display:flex; align-items:center; justify-content:space-between; gap:5px; }
    #specialFrameTargets label { display:flex; flex-direction:row; align-items:center; justify-content:space-between; gap:6px; cursor:pointer; flex:1; min-width:0; margin:0; padding:5px 7px; font-size:11px; font-weight:650; border:1px solid #dce5e7; border-radius:5px; }
    #specialFrameTargets label.is-target { color:#075d4b; background:#e2f4ed; border-color:#79b9ab; }
    #specialFrameTargets input { appearance:auto; width:15px; height:15px; margin:0; padding:0; accent-color:#0c7c66; cursor:pointer; flex:none; }
    #specialFrameEditor .special-frame-art select { grid-column:1/-1; }
    #specialFrameEditor .special-frame-feature { grid-column:1/-1; display:flex; align-items:center; gap:4px; font-size:11px; }
    #specialFrameEditor .special-frame-feature[hidden] { display:none; }
    #specialFrameEditor .special-frame-feature span { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    #specialFrameEditor .special-frame-feature button { flex:none; min-width:24px; min-height:23px; line-height:1; }
    #specialFrameEditor .special-frame-tool details { margin:0; padding:0; background:transparent; }
    #specialFrameEditor .special-frame-tool summary { font-size:12px; color:#144d4c; }
    #specialFrameEditor .special-frame-tool-group { display:grid; gap:6px; margin-top:6px; }
    #specialFrameEditor .special-frame-tool [hidden], #specialFrameEditor .special-frame-tool[hidden] { display:none!important; }
    #specialFrameEditor .special-frame-tool .special-frame-check, #specialFrameEditor .special-frame-options .special-frame-check { display:flex; flex-direction:row; align-items:center; gap:5px; }
    #specialFrameEditor .special-frame-tool .special-frame-check input, #specialFrameEditor .special-frame-options .special-frame-check input { flex:none; width:auto; margin:0; padding:0; }
    #specialFrameEditor .special-frame-tool button { justify-self:start; padding:4px 6px; font-size:11px; }
    #specialFrameEditor .special-frame-tool output { font-size:11px; color:#315763; }
    #specialFrameEditor .special-frame-tuning { grid-column:1/-1; }
    #specialFrameEditor .special-frame-tuning[hidden] { display:none!important; }
    #specialFrameEditor .special-frame-tuning label { grid-column:auto; }
    #specialFrameEditor .special-frame-advanced { grid-column:1/-1; min-width:0; border-top:1px solid #dce5e7; padding-top:4px; }
    #specialFrameEditor .special-frame-advanced summary { cursor:pointer; padding:3px 0; font-size:11px; font-weight:650; }
    #specialFrameEditor .special-frame-options { display:grid; gap:5px; margin-top:4px; }
    #specialFrameEditor .special-frame-flags { align-items:center; }
    #specialFrameEditor .special-frame-flags label { white-space:nowrap; }
    #specialFrameEditor .special-frame-options [hidden] { display:none!important; }
    #specialFramePreview { display:flex; flex:1; flex-direction:column; gap:7px; min-height:0; min-width:0; }
    #specialFrameSize { display:block; font-size:12px; color:#315763; }
    #specialFrameOpenings { font-size:11px; color:#315763; line-height:1.45; }
    #specialFramePreview .special-frame-canvas { min-height:0; border-radius:6px; }
    #specialFrameDrawing { touch-action:none; }
    #specialFrameDrawing text { dominant-baseline:middle; text-anchor:middle; pointer-events:none; fill:#345261; }
    #specialFrameDrawing .special-frame-target-outline { fill:none; stroke:#0c7c66; stroke-width:2; stroke-dasharray:5 3; vector-effect:non-scaling-stroke; pointer-events:none; }
    #specialFrameRail { cursor:ns-resize; }
    #specialFrameRail:hover { fill:#805331; }
    #specialFrameDock { flex:none; display:grid; gap:5px; }
    #specialFrameActions { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; }
    #specialFrameActions button { min-width:0; min-height:30px; }
    #specialFrameMessage { font-size:11px; color:#236858; }
    #specialFrameMessage:empty { display:none; }
    #specialFrameMessage.is-error { color:#a12615; }
    #specialFramePickBanner { display:flex; gap:8px; align-items:center; margin:0 auto 0 0; color:#20595b; font-size:12px; }
    #specialFramePickBanner[hidden] { display:none!important; }
    @media (min-width:851px) {
      #originalLibrary.special-frame-active .original-layout { grid-template-rows:minmax(0,1fr); }
      #originalLibrary.special-frame-active .original-layout > :is(.original-browser,.panel-design,.panel-feature-editor) { grid-row:1; }
    }
    @media (max-width:850px) {
      #originalLibrary.special-frame-active .panel-feature-editor { grid-row:1; }
      #originalLibrary.special-frame-active .panel-design { grid-row:2; }
      #originalLibrary.special-frame-active .original-browser { grid-row:3; }
      #specialFrameEditor { max-height:44vh; }
      #specialFramePreview .special-frame-canvas { height:300px; }
      #specialFrameDock { position:fixed; inset:auto 0 0; z-index:6; padding:6px 8px; background:white; border-top:1px solid #dce5e7; }
      #originalLibrary.special-frame-active ~ #status { position:static; padding-bottom:58px; }
    }
  `;
  document.head.appendChild(styles);

  const preview = document.createElement('section');
  preview.id = 'specialFramePreview';
  preview.setAttribute('aria-label', 'Xem trước khung hai vùng');
  preview.innerHTML = `
    <div class="preview-tools"><strong>Khung hai vùng · 2D</strong></div>
    <output id="specialFrameSize" aria-live="polite"></output>
    <div class="panel-preview special-frame-canvas">
      <svg id="specialFrameDrawing" role="img" aria-label="Khung và hai vùng" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1 1">
        <rect id="specialFrameOuter" fill="#ab754b"/>
        <rect id="specialFrameUpper" fill="#faf7f1"/>
        <rect id="specialFrameLower" fill="#faf7f1"/>
        <g id="specialFrameUpperPaths" fill="#ab754b" fill-rule="evenodd"/>
        <g id="specialFrameLowerPaths" fill="#ab754b" fill-rule="evenodd"/>
        <rect id="specialFrameRail" fill="#996339"><title>Kéo để dịch đố ngang</title></rect>
        <rect id="specialFrameUpperTarget" class="special-frame-target-outline" visibility="hidden"/>
        <rect id="specialFrameLowerTarget" class="special-frame-target-outline" visibility="hidden"/>
        <text id="specialFrameUpperLabel">Vùng trên</text>
        <text id="specialFrameLowerLabel">Vùng dưới</text>
      </svg>
    </div>
    <output id="specialFrameOpenings" aria-live="polite"></output>
    <div id="specialFrameDock">
      <div id="specialFrameMessage" role="status"></div>
      <div id="specialFrameActions">
        <button id="specialFrameRead" type="button">Lấy khung chọn</button>
        <button id="specialFrameApply" type="button" class="primary" disabled>Tạo vách trong AutoCAD</button>
        <button id="specialFrameUpdate" type="button" class="primary" disabled>Cập nhật khung chọn</button>
      </div>
    </div>`;
  ordinaryDesign.appendChild(preview);

  const editor = document.createElement('section');
  editor.id = 'specialFrameEditor';
  editor.setAttribute('aria-label', 'Thông số khung hai vùng');
  editor.innerHTML = `
    <div id="specialFrameTools"></div>
    <fieldset><legend>Kích thước phủ bì</legend><div id="specialFrameOverall" class="special-frame-grid"></div></fieldset>
    <fieldset><legend>Bề rộng viền</legend><div id="specialFrameEdges" class="special-frame-grid"></div></fieldset>
    <fieldset><legend>Đố ngang và hai ô</legend><div id="specialFrameDivider" class="special-frame-grid"></div></fieldset>
    <fieldset id="specialFrameArt"><legend>Hoa văn theo vùng</legend></fieldset>`;
  ordinaryEditor.appendChild(editor);

  const remove = document.createElement('button');
  remove.id = 'specialFrameDelete';
  remove.type = 'button';
  remove.textContent = 'XÓA KHUNG';
  remove.title = 'Bỏ khung khỏi màn hình xem trước';
  modeRow.appendChild(remove);

  const create = by('specialFrameApply');
  const update = by('specialFrameUpdate');
  const read = by('specialFrameRead');
  const canvas = by('specialFrameDrawing');
  const rail = by('specialFrameRail');
  const editorFields = Array.from(editor.querySelectorAll('fieldset'));
  const sides = {top: 'trên', bottom: 'dưới', left: 'trái', right: 'phải'};
  const borderNumbers = {
    width: ['Rộng dải viền (mm)', 8, 1000], module: ['Cỡ mẫu dọc viền (mm)', 10, 2000],
    gap: ['Khe giữa mẫu (mm)', .5, 100], stroke_adjust: ['Bù dày/mỏng nét diềm (±mm)', -Infinity, Infinity],
    'inner_frame.width': ['Rộng viền trong (mm)', 0, 1000],
    'edge_frame.outer': ['Viền bao ngoài (mm)', 0, 10000], 'edge_frame.inner': ['Viền bao trong (mm)', 0, 10000],
    'layout.width': ['Ngang khổ bố trí (mm)', .001, 10000], 'layout.height': ['Cao khổ bố trí (mm)', .001, 10000]
  };
  for (const [side, label] of Object.entries(sides)) borderNumbers['inner_frame.' + side] = ['Viền trong ' + label + ' (mm)', 0, 1000];
  const cutNumbers = {
    x: ['Tâm X (mm)', -10000, 20000], y: ['Tâm Y (mm)', -10000, 20000],
    width: ['Rộng mẫu đục (mm)', 5, 10000], height: ['Cao mẫu đục (mm)', 5, 10000], angle: ['Xoay (°)', -360, 360]
  };
  const insertNumbers = {
    ...cutNumbers,
    width: ['Rộng họa tiết (mm)', 5, 10000], height: ['Cao họa tiết (mm)', 5, 10000],
    rim_adjust: ['Bù dày/mỏng viền (±mm)', -30, 30]
  };
  const targetRow = document.createElement('div');
  targetRow.id = 'specialFrameTargets';
  targetRow.setAttribute('role', 'group');
  targetRow.setAttribute('aria-label', 'Vùng nhận mẫu từ thư viện');
  modeRow.after(targetRow);

  function setStatus(message, error = false) {
    const output = by(active ? 'specialFrameMessage' : 'status');
    output.textContent = message;
    if (active) output.classList.toggle('is-error', error);
  }

  function setActionsDisabled(disabled) {
    create.disabled = update.disabled = disabled;
  }

  function addDimension(container, key, labelText) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    label.textContent = labelText;
    input.type = 'number';
    input.min = '0.5';
    input.max = '10000';
    input.step = 'any';
    input.dataset.specialDimension = key;
    inputs[key] = input;
    label.appendChild(input);
    by(container).appendChild(label);
    input.addEventListener('input', () => {
      setStatus('');
      if (key === 'upper' && Number.isFinite(dim('upper'))) {
        inputs.lower.value = round(dim('h') - dim('top') - dim('bottom') - dim('rail') - dim('upper'));
      }
      draw(key === 'upper');
    });
  }

  [
    ['specialFrameOverall', 'w', 'Rộng (mm)'], ['specialFrameOverall', 'h', 'Cao (mm)'],
    ['specialFrameOverall', 'depth', 'Dày tấm (mm)'],
    ['specialFrameEdges', 'left', 'Viền trái'], ['specialFrameEdges', 'right', 'Viền phải'],
    ['specialFrameEdges', 'top', 'Viền trên'], ['specialFrameEdges', 'bottom', 'Viền dưới'],
    ['specialFrameDivider', 'upper', 'Cao lọt lòng trên (mm)'], ['specialFrameDivider', 'lower', 'Cao lọt lòng dưới (mm)'],
    ['specialFrameDivider', 'rail', 'Bản rộng đố ngang (mm)']
  ].forEach(row => addDimension(...row));

  slots.forEach(slot => {
    const row = document.createElement('div');
    row.className = 'special-frame-art';
    const label = document.createElement('label');
    const target = document.createElement('input');
    target.type = 'checkbox';
    target.dataset.specialZoneTarget = slot;
    target.title = 'Tích để chọn mẫu trong thư viện cho ' + slotNames[slot].toLowerCase();
    destinations[slot] = target;
    label.append(document.createTextNode(slotNames[slot]), target);
    targetRow.append(label);
    target.onchange = () => {
      label.classList.toggle('is-target', target.checked);
      setStatus('');
      draw();
      syncCategory();
    };
    const select = document.createElement('select');
    select.dataset.specialArt = slot;
    const caption = document.createElement('label');
    select.id = 'specialFrameArt_' + slot;
    caption.htmlFor = select.id;
    caption.textContent = slotNames[slot];
    select.setAttribute('aria-label', 'Mẫu ' + slotNames[slot].toLowerCase());
    artwork[slot] = select;
    select.onchange = () => {
      changeArt(slot, true);
      syncCategory();
    };
    const browse = document.createElement('button');
    browse.type = 'button';
    browse.dataset.specialBrowse = slot;
    browse.textContent = 'Chọn trong kho';
    browse.setAttribute('aria-label', 'Chọn trong kho cho ' + slotNames[slot].toLowerCase());
    browse.onclick = () => setPicker({ slot });
    features[slot] = {};
    for (const [kind, caption] of Object.entries(featureNames)) {
      const feature = document.createElement('div');
      feature.className = 'special-frame-feature';
      feature.dataset.specialZoneFeature = slot + '_' + kind;
      feature.hidden = true;
      const name = document.createElement('span');
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.textContent = 'Bỏ';
      clear.dataset.specialZoneClear = slot + '_' + kind;
      clear.setAttribute('aria-label', 'Xóa ' + caption.toLowerCase() + ' ở ' + slotNames[slot].toLowerCase());
      clear.onclick = () => {
        setZoneFeature(slot, kind, '');
        setStatus('');
        draw();
        syncCategory();
      };
      feature.append(name, clear);
      features[slot][kind] = { key: '', feature, name };
    }
    const tools = document.createElement('fieldset');
    tools.className = 'special-frame-tool';
    tools.hidden = true;
    const legend = document.createElement('legend');
    legend.textContent = slotNames[slot];
    const borderTool = createTool(slot, 'border');
    const cutTool = createTool(slot, 'cut');
    const insertTool = createTool(slot, 'insert');
    toolControls[slot] = { section: tools, border: borderTool, cut: cutTool, insert: insertTool };
    tools.append(legend, features[slot].border.feature, features[slot].cut.feature, features[slot].insert.feature,
      borderTool.details, cutTool.details, insertTool.details);
    by('specialFrameTools').append(tools);
    editorFields.push(tools);
    const tuning = document.createElement('div');
    tuning.hidden = true;
    tuning.className = 'special-frame-grid special-frame-tuning';
    const numeric = {};
    for (const key of ['pattern_scale', 'web_adjust']) numeric[key] = addPatternInput(tuning, slot, key);
    numeric.web_adjust.title = '0 giữ nét gốc. Số dương tăng độ dày, số âm làm nét mảnh hơn.';
    const advanced = document.createElement('details');
    advanced.className = 'special-frame-advanced';
    advanced.open = true;
    const summary = document.createElement('summary');
    summary.textContent = 'Khung & gia công';
    const options = document.createElement('div');
    options.className = 'special-frame-options';
    const toggles = document.createElement('div');
    toggles.className = 'special-frame-grid special-frame-flags';
    const flags = {
      equal_margins: addPatternFlag(options, slot, 'equal_margins'),
      weld: addPatternFlag(toggles, slot, 'weld'),
      follow_frame: addPatternFlag(toggles, slot, 'follow_frame')
    };
    flags.equal_margins.parentElement.hidden = true;
    const separate = document.createElement('div');
    separate.className = 'special-frame-grid';
    for (const key of separateMargins) numeric[key] = addPatternInput(separate, slot, key);
    const placement = document.createElement('div');
    placement.className = 'special-frame-grid';
    for (const key of ['margin', 'angle', 'offset_x', 'offset_y']) numeric[key] = addPatternInput(placement, slot, key);
    const common = numeric.margin.parentElement;
    options.append(toggles, separate, placement);
    advanced.append(summary, options);
    tuning.appendChild(advanced);
    patternControls[slot] = { tuning, advanced, numeric, flags, common, separate };
    row.append(caption, select, browse, tuning);
    by('specialFrameArt').appendChild(row);
  });

  function settingAt(settings, path) {
    const [key, nested] = path.split('.');
    return nested ? settings[key]?.[nested] : settings[key];
  }

  function putSetting(settings, path, value) {
    const [key, nested] = path.split('.');
    if (nested) (settings[key] ||= {})[nested] = value;
    else settings[key] = value;
  }

  function createTool(slot, kind) {
    const details = document.createElement('details');
    details.dataset.specialZoneTool = slot + '_' + kind;
    details.open = true;
    details.hidden = true;
    const summary = document.createElement('summary');
    const border = kind === 'border';
    const insert = kind === 'insert';
    const numbers = border ? borderNumbers : insert ? insertNumbers : cutNumbers;
    summary.textContent = {border: 'Chỉnh chạy viền trong', cut: 'Chỉnh đục tấm', insert: 'Chỉnh họa tiết chèn'}[kind];
    const tool = { details, fields: {}, settings: {}, defaults: {}, invalid: new Set() };
    details.append(summary);
    const section = (parent, caption = '', grid = false) => {
      const box = document.createElement('div');
      box.className = grid ? 'special-frame-grid' : 'special-frame-tool-group';
      if (caption) {
        const title = document.createElement('strong');
        title.textContent = caption;
        box.append(title);
      }
      parent.append(box);
      return box;
    };
    function field(box, key, caption, options = []) {
      const limits = numbers[key];
      const label = document.createElement('label');
      const input = document.createElement(options.length ? 'select' : 'input');
      const type = options.length ? 'select' : limits ? 'number' : 'checkbox';
      const text = document.createElement('span');
      text.textContent = caption || limits[0];
      input.dataset[border ? 'specialBorder' : insert ? 'specialInsert' : 'specialCut'] = slot + '_' + key;
      if (options.length) for (const [value, name] of options) input.add(new Option(name, value));
      else input.type = type;
      if (limits) {
        input.step = 'any';
        if (Number.isFinite(limits[1])) input.min = limits[1];
        if (Number.isFinite(limits[2])) input.max = limits[2];
      }
      if (type === 'checkbox') {
        label.className = 'special-frame-check';
        label.append(input, text);
      } else label.append(text, input);
      box.append(label);
      tool.fields[key] = {input, label, text, type};
      input.addEventListener(type === 'number' ? 'input' : 'change', () => {
        const value = type === 'number' ? input.valueAsNumber : type === 'checkbox' ? input.checked : input.value;
        const valid = !limits || Number.isFinite(value) && value >= Number(input.min || -Infinity) && value <= limits[2];
        const previous = readTool(tool, key);
        if (valid) {
          tool.invalid.delete(key);
          putSetting(tool.settings, key, value);
          if (!border && (key === 'width' || key === 'height') && readTool(tool, 'lock') && previous > 0) {
            const other = key === 'width' ? 'height' : 'width';
            const scaled = round(readTool(tool, other) * value / previous);
            if (scaled >= numbers[other][1] && scaled <= numbers[other][2]) {
              putSetting(tool.settings, other, scaled);
              tool.invalid.delete(other);
            }
          }
          if (border && key === 'inner_frame.equal' && !value) {
            for (const side of Object.keys(sides)) putSetting(tool.settings, 'inner_frame.' + side, readTool(tool, 'inner_frame.' + side));
          }
        } else tool.invalid.add(key);
        setStatus('');
        draw();
      });
    }
    function action(box, caption, name, fn) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = caption;
      button.dataset[name] = slot;
      button.onclick = () => {
        fn();
        setStatus('');
        draw();
      };
      box.append(button);
      return button;
    }
    const settings = section(details);
    if (border) {
      field(settings, 'enabled', 'Bật hoa văn chạy viền');
      field(settings, 'join_equal', 'Nối bằng nan của mẫu');
      field(settings, 'photo_fit', 'Giữ trọn mẫu, cân đều hai cạnh');
      const sizes = section(settings, '', true);
      for (const key of ['width', 'module', 'gap', 'stroke_adjust']) field(sizes, key);
      const omitted = section(settings, 'Bỏ riềm theo cạnh');
      const omitGrid = section(omitted, '', true);
      for (const [side, caption] of Object.entries(sides)) field(omitGrid, 'omit_' + side, 'Bỏ riềm ' + caption);
      const inner = tool.inner = section(settings, 'Viền trong & phần giữa');
      field(inner, 'center_mode', 'Phần giữa', [
        ['inherit', 'Theo chế độ tấm'], ['hollow', 'Rỗng xuyên tấm'], ['solid', 'Đặc'], ['pattern', 'Hoa văn']
      ]);
      field(inner, 'inner_frame.equal', 'Dùng chung viền trong 4 cạnh');
      field(inner, 'inner_frame.width');
      const innerSides = section(inner, '', true);
      for (const side of Object.keys(sides)) field(innerSides, 'inner_frame.' + side);
      tool.resetInner = action(inner, 'Khôi phục viền trong ban đầu', 'specialBorderResetInner', () => {
        delete tool.settings.inner_frame;
        for (const key of tool.invalid) if (key.startsWith('inner_frame.')) tool.invalid.delete(key);
      });
      const standalone = tool.standalone = section(settings, 'Viền bao diềm khi Bỏ khung');
      field(standalone, 'edge_frame.enabled', 'Giữ viền bao diềm');
      const edge = section(standalone, '', true);
      field(edge, 'edge_frame.outer');
      field(edge, 'edge_frame.inner');
      field(standalone, 'layout.enabled', 'Kích thước vòng diềm riêng');
      const layout = section(standalone, '', true);
      field(layout, 'layout.width');
      field(layout, 'layout.height');
    } else {
      const sizes = section(settings, '', true);
      for (const key of ['x', 'y', 'width', 'height', 'angle']) field(sizes, key);
      field(settings, 'lock', 'Giữ tỷ lệ');
      field(settings, 'mirror', insert ? 'Lật họa tiết' : 'Lật mẫu đục');
      if (insert) {
        field(settings, 'even_insert', 'Làm đều vòng và hình lặp');
        field(settings, 'rim_adjust');
      }
      const actions = section(settings, '', true);
      action(actions, 'Căn giữa', insert ? 'specialInsertCenter' : 'specialCutCenter', () => {
        for (const key of ['x', 'y']) {
          delete tool.settings[key];
          tool.invalid.delete(key);
        }
      });
      action(actions, 'Xoay +90°', insert ? 'specialInsertRotate' : 'specialCutRotate', () => {
        tool.settings.angle = (readTool(tool, 'angle') + 450) % 360;
        tool.invalid.delete('angle');
      });
    }
    tool.info = document.createElement('output');
    settings.append(tool.info);
    return tool;
  }

  function addPatternInput(container, slot, setting) {
    const [, labelText, min, max, initial] = patternNumbers[setting];
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'number';
    input.min = min;
    input.max = max;
    input.step = setting === 'web_adjust' ? '0.1' : 'any';
    input.value = initial;
    input.dataset.specialPattern = slot + '_' + setting;
    label.textContent = labelText;
    label.appendChild(input);
    container.appendChild(label);
    input.addEventListener('input', () => {
      setStatus('');
      draw();
    });
    return input;
  }

  function addPatternFlag(container, slot, setting) {
    const [, labelText, initial] = patternFlags[setting];
    const label = document.createElement('label');
    label.className = 'special-frame-check';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = initial;
    input.dataset.specialPattern = slot + '_' + setting;
    input.addEventListener('change', () => {
      setStatus('');
      draw();
    });
    label.append(input, document.createTextNode(labelText));
    container.appendChild(label);
    return input;
  }

  const dim = key => inputs[key].valueAsNumber;
  const round = value => Math.round(value * 1000) / 1000;
  const format = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 });
  const mm = value => format.format(value);

  function setBox(node, x, y, width, height) {
    Object.entries({ x, y, width, height }).forEach(([name, value]) => node.setAttribute(name, value));
  }

  function setZoneFeature(slot, kind, key) {
    const feature = features[slot][kind];
    const tool = toolControls[slot][kind];
    if (tool && feature.key !== key && (!key || kind !== 'border')) {
      tool.settings = {};
      tool.invalid.clear();
    }
    feature.key = key;
    feature.feature.hidden = !key;
    const selected = [...artwork[slot].options].find(option => option.value === key);
    feature.name.textContent = key ? featureNames[kind] + ' · ' + (selected?.text || key) : '';
    feature.name.title = feature.name.textContent;
  }

  function readTool(tool, key) {
    return settingAt(tool.settings, key) ?? settingAt(tool.defaults, key);
  }

  function toolOptions(tool) {
    const settings = { ...tool.settings };
    for (const key of ['inner_frame', 'edge_frame', 'layout']) {
      if (settings[key]) settings[key] = { ...tool.defaults[key], ...settings[key] };
    }
    return settings;
  }

  function paintTool(tool, isDisabled) {
    for (const [key, {input, label, type}] of Object.entries(tool.fields)) {
      input.disabled = tool.details.hidden || label.hidden || isDisabled(key);
      const value = readTool(tool, key);
      if (type === 'checkbox') input.checked = !!value;
      else if (!tool.invalid.has(key) && (type === 'number' ? input.valueAsNumber !== value : input.value !== value)) {
        input.value = value ?? '';
      }
    }
  }

  function syncTools(slot, key, width, height) {
    const { section, border, cut, insert } = toolControls[slot];
    const layer = features[slot];
    section.hidden = !Object.values(layer).some(feature => feature.key);
    const mode = zoneMode(slot);
    border.details.hidden = !layer.border.key || mode === 'solid';
    cut.details.hidden = !layer.cut.key || mode === 'hollow' || mode === 'frameless';
    insert.details.hidden = !layer.insert.key;
    const engine = window.LofiSpecialFramePatterns;
    if (layer.border.key) {
      const photo = layer.border.key.startsWith('borders__anh_');
      const paired = window.LofiCNCBorder.isPaired(layer.border.key);
      const base = engine.borderDefaults(layer.border.key, width, height, engine.supports(key));
      const result = patternPreviews[slot]?.result;
      const innerDefault = result?.innerFrameInfo?.default_width ?? border.settings.gap ?? base.gap;
      const equalWidth = border.settings.inner_frame?.width ?? innerDefault;
      border.defaults = {...base, center_mode: 'inherit', stroke_adjust: 0, photo_fit: true,
        inner_frame: {equal: true, width: innerDefault, top: equalWidth, bottom: equalWidth, left: equalWidth, right: equalWidth},
        edge_frame: {enabled: true, outer: 10, inner: 10}, layout: {enabled: false, width, height}};
      const enabled = readTool(border, 'enabled');
      const equal = readTool(border, 'inner_frame.equal');
      const frameless = frameMode === 'frameless';
      border.inner.hidden = frameless;
      border.standalone.hidden = !frameless;
      border.fields.photo_fit.label.hidden = !photo;
      border.fields.join_equal.text.textContent = paired ? 'Chia đều khoảng cách' : photo ? 'Lặp liền chu kỳ' : 'Nối bằng nan của mẫu';
      border.fields.gap.input.min = paired ? 0 : borderNumbers.gap[1];
      border.resetInner.disabled = !enabled || !border.settings.inner_frame;
      for (const side of Object.keys(sides)) border.fields['inner_frame.' + side].label.hidden = equal;
      border.fields['inner_frame.width'].label.hidden = !equal;
      paintTool(border, name => name !== 'enabled' && (!enabled ||
        (name.startsWith('inner_frame.') || name === 'center_mode') && frameless ||
        (name.startsWith('edge_frame.') || name.startsWith('layout.')) && !frameless ||
        ['edge_frame.outer', 'edge_frame.inner'].includes(name) && !readTool(border, 'edge_frame.enabled') ||
        ['layout.width', 'layout.height'].includes(name) && !readTool(border, 'layout.enabled')));
      const bounds = enabled ? result?.borderInfo?.visible_bounds : null;
      border.info.textContent = bounds ? `Khổ diềm thực ${mm(bounds.x1 - bounds.x0)} × ${mm(bounds.y1 - bounds.y0)} mm` : '';
      border.info.hidden = !border.info.textContent;
    }
    if (layer.cut.key) {
      cut.defaults = engine.cutDefaults(layer.cut.key, width, height);
      paintTool(cut, () => false);
    }
    if (layer.insert.key) {
      insert.defaults = engine.insertDefaults(layer.insert.key, width, height, insert.settings.even_insert);
      insert.fields.even_insert.label.hidden = !engine.supportsEvenInsert(layer.insert.key);
      paintTool(insert, () => false);
    }
  }

  function syncModeToggles() {
    for (const [name, toggle] of Object.entries(modeToggles)) {
      toggle.checked = frameMode === name;
      toggle.disabled = !loaded || applying;
    }
    read.disabled = remove.disabled = applying;
    const flags = solidTargets().map(slot => zoneMode(slot) === 'solid');
    modeToggles.solid.checked = flags.every(Boolean);
    modeToggles.solid.indeterminate = flags.some(Boolean) && !modeToggles.solid.checked;
  }

  function zoneMode(slot) {
    return solidZones[slot] ? 'solid' : frameMode;
  }

  function solidTargets() {
    const targets = selectedSlots();
    return targets.length ? targets : slots;
  }

  function changeSolid(checked) {
    const targets = solidTargets();
    if (selectedSlots().length === 0) {
      if (checked || frameMode === 'solid') frameMode = checked ? 'solid' : 'pattern';
      for (const slot of slots) solidZones[slot] = false;
      return;
    }
    if (frameMode === 'solid') {
      frameMode = 'pattern';
      for (const slot of slots) solidZones[slot] = true;
    }
    for (const slot of targets) solidZones[slot] = checked;
  }

  modeRow.addEventListener('change', event => {
    const entry = Object.entries(modeToggles).find(([, toggle]) => toggle === event.target);
    if (!active || !entry) return;
    event.stopImmediatePropagation();
    if (entry[0] === 'solid') changeSolid(entry[1].checked);
    else {
      frameMode = entry[1].checked ? entry[0] : 'pattern';
      for (const slot of slots) solidZones[slot] = false;
    }
    syncModeToggles();
    setStatus('');
    draw();
  }, true);

  function buildOptions(slot, width, height) {
    const layer = features[slot];
    const tools = toolControls[slot];
    return {slot, width, height, depth: dim('depth'), mode: zoneMode(slot), solidFill: frameMode !== 'solid' && solidZones[slot],
      insert: layer.insert.key,
      border: layer.border.key, cut: layer.cut.key, borderSettings: toolOptions(tools.border),
      cutSettings: toolOptions(tools.cut), insertSettings: toolOptions(tools.insert)};
  }

  function patternSpec(slot, key, values, shown) {
    const { tuning, numeric, flags, common, separate } = patternControls[slot];
    const packetKey = shown.primary || shown.insert || shown.border || shown.cut || (shown.fillSolid ? 'solid' : '');
    const canWeld = frameMode !== 'frameless' && !!(shown.primary || shown.border || shown.cut || shown.fillSolid);
    tuning.hidden = !packetKey || values.mode === 'solid' || !(shown.primary || canWeld);
    for (const field of [numeric.pattern_scale, numeric.web_adjust]) field.parentElement.hidden = !shown.primary;
    flags.weld.parentElement.hidden = !canWeld;
    flags.follow_frame.parentElement.hidden = !shown.primary || frameMode === 'frameless';
    if (!packetKey) return null;
    const follows = canWeld && flags.weld.checked && flags.follow_frame.checked;
    flags.equal_margins.disabled = follows;
    common.hidden = !shown.primary || !flags.equal_margins.checked;
    separate.hidden = !shown.primary || flags.equal_margins.checked;
    numeric.margin.disabled = follows || common.hidden;
    separateMargins.forEach(side => { numeric[side].disabled = follows || separate.hidden; });

    let error = '';
    const tools = toolControls[slot];
    for (const kind of Object.keys(featureNames)) {
      if (!shown[kind]) continue;
      const tool = tools[kind];
      const invalid = [...tool.invalid].find(name => !tool.fields[name].input.disabled);
      if (invalid) error ||= 'Nhập giá trị hợp lệ cho ' + tool.fields[invalid].text.textContent + '.';
    }
    for (const [name, [option, label, min, max, initial]] of Object.entries(patternNumbers)) {
      const input = numeric[name];
      const number = input.disabled || !shown.primary ? initial : input.valueAsNumber;
      if (!error && (!Number.isFinite(number) || number < min || number > max)) {
        error = `${label} phải nằm trong khoảng ${mm(min)} đến ${mm(max)}.`;
      }
      values[option] = number;
    }
    for (const [name, [option]] of Object.entries(patternFlags)) values[option] = flags[name].checked;
    values.weld = canWeld && (values.mode === 'solid' || flags.weld.checked);
    return { key, packetKey, values, error, signature: JSON.stringify([key, values]) };
  }

  function clearPatternPreview(slot) {
    const state = patternPreviews[slot];
    if (state) clearTimeout(state.timer);
    delete patternPreviews[slot];
  }

  function queuePatternPreview(slot, spec) {
    if (!spec || spec.error) {
      clearPatternPreview(slot);
      return spec ? { error: spec.error } : null;
    }
    if (patternPreviews[slot]?.spec.signature === spec.signature) return patternPreviews[slot];
    clearPatternPreview(slot);
    const state = { spec, pending: true, result: null, error: '' };
    patternPreviews[slot] = state;
    state.timer = setTimeout(async () => {
      try {
        state.result = await window.LofiSpecialFramePatterns.build(spec.key, spec.values);
        if (!state.result) throw new Error('Mẫu không có dữ liệu hoa văn để dựng trong khung.');
      } catch (error) {
        state.error = error.message || 'Không tính được hoa văn.';
      }
      state.pending = false;
      if (active && patternPreviews[slot] === state) draw();
    }, 145);
    return state;
  }

  function drawPatternPaths(node, state, x, y) {
    if (!state || !state.result) {
      if (node.firstChild) node.replaceChildren();
      delete node.dataset.signature;
      return;
    }
    node.setAttribute('transform', `translate(${x} ${y})`);
    if (node.dataset.signature === state.spec.signature) return;
    const paths = state.result.paths.map(data => {
      const path = document.createElementNS(svgNamespace, 'path');
      path.setAttribute('d', data);
      return path;
    });
    node.replaceChildren(...paths);
    node.dataset.signature = state.spec.signature;
  }

  function draw(keepUpper = false) {
    if (!loaded) return false;
    syncModeToggles();
    const w = dim('w');
    const h = dim('h');
    const x = dim('left');
    const top = dim('top');
    const lower = dim('lower');
    const railHeight = dim('rail');
    const inner = round(w - x - dim('right'));
    const upper = round(h - top - dim('bottom') - railHeight - lower);
    if (!keepUpper) inputs.upper.value = Number.isFinite(upper) ? upper : '';

    const invalid = dimensionKeys.some(key => !Number.isFinite(dim(key)) || dim(key) < .5 || dim(key) > 10000);
    const error = invalid ? 'Nhập kích thước từ 0,5 đến 10.000 mm.' :
      (inner < .5 || upper < .5 || !Number.isFinite(dim('upper')) ? 'Chỉnh lại viền hoặc đố để cả hai ô còn khoảng lọt lòng.' : '');
    setActionsDisabled(!!error || applying);
    canvas.style.visibility = error ? 'hidden' : '';
    if (error) {
      validationError = true;
      setStatus(error, true);
      by('specialFrameSize').textContent = '';
      by('specialFrameOpenings').textContent = '';
      return false;
    }
    if (validationError) setStatus('');
    validationError = false;

    const margin = Math.max(w, h) * .06;
    canvas.setAttribute('viewBox', [-margin, -margin, w + 2 * margin, h + 2 * margin].join(' '));
    const outer = by('specialFrameOuter');
    setBox(outer, 0, 0, w, h);
    outer.style.display = frameMode === 'frameless' ? 'none' : '';
    setBox(rail, x, top + upper, inner, railHeight);
    rail.style.display = frameMode === 'solid' || frameMode === 'frameless' ? 'none' : '';
    let patternError = '';
    let patternPending = false;
    let hasArtwork = false;
    [[top, upper, 'Upper', 'upper'], [top + upper + railHeight, lower, 'Lower', 'lower']].forEach(([y, height, name, slot]) => {
      const label = by('specialFrame' + name + 'Label');
      const key = artwork[slot].value;
      syncTools(slot, key, inner, height);
      const values = buildOptions(slot, inner, height);
      const shown = window.LofiSpecialFramePatterns.activeArtwork(key, values);
      const spec = patternSpec(slot, key, values, shown);
      const pattern = queuePatternPreview(slot, spec);
      hasArtwork ||= !!spec;
      const opening = by('specialFrame' + name);
      setBox(opening, x, y, inner, height);
      opening.style.display = frameMode === 'frameless' || values.mode === 'solid' && !shown.cut ? 'none' : '';
      const target = by('specialFrame' + name + 'Target');
      setBox(target, x, y, inner, height);
      target.setAttribute('visibility', destinations[slot].checked && frameMode !== 'solid' ? 'visible' : 'hidden');
      drawPatternPaths(by('specialFrame' + name + 'Paths'), pattern, x, y);
      label.style.display = pattern?.result || values.mode === 'solid' && !shown.cut ? 'none' : '';
      label.textContent = pattern?.pending ? 'Đang tính hoa văn…' : slotNames[slot];
      label.setAttribute('x', x + inner / 2);
      label.setAttribute('y', y + height / 2);
      label.setAttribute('font-size', Math.min(inner * .085, height * .21));
      if (pattern?.error && !patternError) patternError = `${slotNames[slot]} · ${pattern.error}`;
      if (pattern?.pending) patternPending = true;
    });
    if (frameMode === 'frameless' && !hasArtwork) patternError = 'Bỏ khung: chọn hoa văn, họa tiết chèn hoặc chạy viền để dựng.';
    if (patternError) {
      setStatus(patternError, true);
      validationError = true;
    }
    setActionsDisabled(!!patternError || patternPending || applying);
    by('specialFrameSize').textContent = `${mm(w)} × ${mm(h)} mm · Dày ${mm(dim('depth'))} mm`;
    by('specialFrameOpenings').textContent = `Lọt lòng trên ${mm(inner)} × ${mm(upper)} mm · Dưới ${mm(inner)} × ${mm(lower)} mm`;
    return true;
  }

  function changeArt(slot, focusControls = false) {
    const key = artwork[slot].value;
    if (window.LofiSpecialFramePatterns.supports(key)) {
      const {tuning, advanced} = patternControls[slot];
      advanced.open = true;
      if (focusControls) requestAnimationFrame(() => {
        if (!active || tuning.hidden) return;
        const viewport = editor.getBoundingClientRect();
        const row = tuning.getBoundingClientRect();
        if (row.bottom > viewport.bottom || row.top < viewport.top) editor.scrollTop += row.top - viewport.top;
      });
    }
    draw();
  }

  function chooseZoneFeature(slot, kind, key, focus = true) {
    setZoneFeature(slot, kind, key);
    const tool = toolControls[slot][kind];
    if (tool) tool.details.open = true;
    if (kind === 'border' && tool.settings.enabled === false) tool.settings.enabled = true;
    if (focus) requestAnimationFrame(() => {
      if (!active) return;
      const section = toolControls[slot].section;
      if (section.hidden) return;
      const viewport = editor.getBoundingClientRect();
      const summary = kind === 'insert' && !tool.details.hidden ? tool.details.firstElementChild.getBoundingClientRect() : null;
      const target = summary && summary.bottom > viewport.bottom ? summary : section.getBoundingClientRect();
      editor.scrollTop += target.top - viewport.top;
    });
  }

  function restoreArtwork(slot, config) {
    const primary = config[slot + '_art'] || '';
    const savedCut = config[slot + '_cut_art'] || '';
    const migrateCut = !savedCut && window.LofiSpecialFramePatterns.supportsCut(primary);
    artwork[slot].value = migrateCut ? '' : primary;
    for (const kind of Object.keys(featureNames)) {
      setZoneFeature(slot, kind, migrateCut && kind === 'cut' ? primary : config[slot + '_' + kind + '_art'] || '');
      const tool = toolControls[slot][kind];
      if (tool) {
        tool.settings = JSON.parse(JSON.stringify(config[slot + '_' + kind + '_settings'] || {}));
        tool.invalid.clear();
      }
    }
  }

  function restoreMode(config) {
    frameMode = Object.prototype.hasOwnProperty.call(modeToggles, config.frame_mode) ? config.frame_mode : 'pattern';
    for (const slot of slots) solidZones[slot] = config[slot + '_solid'] === true;
    syncModeToggles();
  }

  function initialize(fields = {}) {
    const config = { ...defaultConfig, ...fields };
    dimensionKeys.forEach(key => { inputs[key].value = config[key]; });
    restoreMode(config);
    slots.forEach(slot => {
      artwork[slot].replaceChildren(new Option('Để trống', ''));
      for (const [key, entry] of catalog) {
        if (artType(key) === 'pattern' && (!entry.retired || key === config[slot + '_art'])) {
          artwork[slot].add(new Option(entry.name, key));
        }
      }
      restoreArtwork(slot, config);
      const { numeric, flags } = patternControls[slot];
      for (const [key, [, , , , initial]] of Object.entries(patternNumbers)) numeric[key].value = config[slot + '_' + key] ?? initial;
      for (const [key, [, , initial]] of Object.entries(patternFlags)) flags[key].checked = config[slot + '_' + key] ?? initial;
    });
    loaded = true;
    applying = false;
    editorFields.forEach(field => { field.disabled = false; });
    setStatus('');
    draw();
    syncCategory();
  }

  function enableEditor() {
    applying = false;
    editorFields.forEach(field => { field.disabled = false; });
    draw();
  }

  async function submitFrame(mode) {
    if (applying || !draw() || create.disabled) return;
    const config = Object.fromEntries(dimensionKeys.map(key => [key, dim(key)]));
    config.frame_mode = frameMode;
    slots.forEach(slot => {
      const { numeric, flags } = patternControls[slot];
      config[slot + '_art'] = artwork[slot].value;
      config[slot + '_solid'] = solidZones[slot];
      for (const kind of Object.keys(featureNames)) config[slot + '_' + kind + '_art'] = features[slot][kind].key;
      for (const kind of Object.keys(featureNames)) config[slot + '_' + kind + '_settings'] = toolOptions(toolControls[slot][kind]);
      for (const [name, [, , min, max, initial]] of Object.entries(patternNumbers)) {
        const number = numeric[name].valueAsNumber;
        config[slot + '_' + name] = number >= min && number <= max ? number : initial;
      }
      for (const name of Object.keys(patternFlags)) config[slot + '_' + name] = flags[name].checked;
    });
    const previews = slots.map(slot => [slot, patternPreviews[slot]]).filter(([, state]) => state?.result);
    const sequence = ++applySequence;
    applying = true;
    syncModeToggles();
    setActionsDisabled(true);
    editorFields.forEach(field => { field.disabled = true; });
    setStatus(mode === 'create' ? 'Đang tạo vách…' : 'Đang cập nhật khung…');
    try {
      const packets = await Promise.all(previews.map(async ([slot, state]) => {
        const { spec } = state;
        const result = spec.values.weld ? state.result : await window.LofiSpecialFramePatterns.build(spec.key, spec.values, true);
        if (!result) throw new Error('Không dựng được mô hình hoa văn.');
        return { slot, key: spec.packetKey, result, spec };
      }));
      if (!active || sequence !== applySequence) return;
      const patterns = {};
      const weldPatterns = {};
      for (const { slot, key, result, spec } of packets) {
        if (spec.values.weld) weldPatterns[slot] = result;
        else patterns[slot] = { key, solids: result.solids };
      }
      let welded = null;
      if (Object.keys(weldPatterns).length) {
        const x = config.left;
        const w = config.w - x - config.right;
        const z = config.bottom + config.lower + config.rail;
        welded = await window.LofiSpecialFramePatterns.buildWelded({
          width: config.w, height: config.h, depth: config.depth,
          solid: config.frame_mode === 'solid',
          openings: { upper: [x, z, w, config.h - config.top - z], lower: [x, config.bottom, w, config.lower] },
          patterns: weldPatterns
        });
      }
      if (!active || sequence !== applySequence) return;
      await host.apply({ mode, config, patterns, welded });
      if (!active || sequence !== applySequence) return;
      enableEditor();
      setStatus(mode === 'create' ? 'Đã tạo vách trong AutoCAD.' : 'Đã cập nhật khung trong AutoCAD.');
    } catch (error) {
      if (!active || sequence !== applySequence) return;
      enableEditor();
      setStatus(error.message || 'Không dựng được hoa văn.', true);
    }
  }

  create.onclick = () => submitFrame('create');
  update.onclick = () => submitFrame('update');
  read.onclick = async () => {
    if (applying) return;
    const sequence = ++applySequence;
    applying = true;
    draw();
    editorFields.forEach(field => { field.disabled = true; });
    setStatus('Đang đọc khung đã chọn…');
    try {
      const config = await host.read();
      if (!active || sequence !== applySequence) return;
      initialize(config);
      setStatus('Đã lấy thông số khung chọn.');
    } catch (error) {
      if (!active || sequence !== applySequence) return;
      enableEditor();
      setStatus(error.message || 'Không đọc được thông số khung.', true);
    }
  };
  remove.onclick = () => {
    if (!active || applying) return;
    leave();
    selectCategory('');
  };

  function svgY(event) {
    const matrix = canvas.getScreenCTM();
    if (!matrix) return null;
    const point = canvas.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(matrix.inverse()).y;
  }

  rail.onpointerdown = event => {
    if (!draw() || applying) return;
    const y = svgY(event);
    if (y === null) return;
    drag = { pointer: event.pointerId, offset: dim('h') - dim('bottom') - dim('lower') - y };
    canvas.setPointerCapture(event.pointerId);
    event.preventDefault();
  };
  canvas.onpointermove = event => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const y = svgY(event);
    if (y === null) return;
    const limit = dim('h') - dim('top') - dim('bottom') - dim('rail') - .5;
    inputs.lower.value = Math.max(.5, Math.min(limit, Math.round(dim('h') - dim('bottom') - y - drag.offset)));
    setStatus('');
    draw();
  };
  canvas.onpointerup = canvas.onpointercancel = canvas.onlostpointercapture = () => { drag = null; };

  group.add(new Option(categoryName, categoryId));
  const filter = document.createElement('button');
  filter.id = 'lofiSpecialGeometry';
  filter.type = 'button';
  filter.dataset.category = categoryId;
  filter.textContent = categoryName;
  filters.querySelector('[data-category="geometry"]').after(filter);

  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className = 'original-card';
  tile.dataset.id = frameId;
  const thumbnail = document.createElement('img');
  thumbnail.src = new URL('../../cnc_source_198/special/khung_hai_vung.svg', document.baseURI).href;
  thumbnail.alt = '';
  const name = document.createElement('span');
  name.textContent = frameName;
  const category = document.createElement('small');
  category.textContent = categoryName;
  tile.append(thumbnail, name, category);

  const banner = document.createElement('div');
  banner.id = 'specialFramePickBanner';
  banner.hidden = true;
  const prompt = document.createElement('strong');
  const cancel = document.createElement('button');
  cancel.type = 'button';
  banner.append(prompt, cancel);
  library.querySelector('.original-heading').prepend(banner);

  function selectedSlots() {
    return slots.filter(slot => destinations[slot].checked);
  }

  function syncCategory() {
    const selected = group.value === categoryId;
    arrange.hidden = selected;
    banner.hidden = !active || (selected && !pick);
    if (!banner.hidden) {
      const targets = selectedSlots();
      prompt.textContent = pick ? 'Chọn hoa văn cho ' + slotNames[pick.slot].toLowerCase() :
        !targets.length ? 'Tích Vùng trên hoặc Vùng dưới để chọn mẫu.' :
        'Chọn mẫu cho ' + (targets.length === 2 ? 'cả hai vùng' : slotNames[targets[0]].toLowerCase()) + '.';
      cancel.textContent = pick ? 'Quay lại khung' : 'Thoát khung';
    }
    if (!selected) {
      if (!active || pick || cards.classList.contains('arranging')) return;
      const ids = new Set(selectedSlots().flatMap(slot =>
        [artwork[slot].value, ...Object.values(features[slot]).map(feature => feature.key)]));
      for (const card of cards.querySelectorAll('.original-card')) {
        const assigned = ids.has(card.dataset.id);
        card.classList.toggle('selected', assigned);
        card.setAttribute('aria-pressed', String(assigned));
      }
      return;
    }
    const words = window.LofiCompat.fold(frameName + ' ' + categoryName + ' ' + frameId);
    if (!words.includes(window.LofiCompat.fold(search.value))) return;
    if (!cards.contains(tile)) cards.replaceChildren(tile);
    tile.classList.toggle('selected', active);
    tile.setAttribute('aria-pressed', String(active));
    by('originalCount').textContent = '1 mẫu';
  }

  function selectCategory(id) {
    group.value = id;
    group.dispatchEvent(new Event('change'));
    syncCategory();
  }

  function open(config) {
    window.LofiOriginalCNC.show(true);
    if (!active) {
      previousMode = by('moduleMode').classList.contains('active') ? 'moduleMode' : 'panelMode';
      by('panelMode').click();
      active = true;
      library.classList.add('special-frame-active');
      ordinaryModeChecks = Object.fromEntries(Object.entries(modeToggles).map(([mode, toggle]) =>
        [mode, {checked: toggle.checked, indeterminate: toggle.indeterminate, disabled: toggle.disabled}]));
    }
    if (cards.classList.contains('arranging')) arrange.click();
    if (!pick) {
      search.value = '';
      selectCategory(categoryId);
    }
    if (loaded && !config) return;
    ++applySequence;
    initialize(config);
  }

  function leave() {
    if (!active) return;
    active = loaded = applying = false;
    ++applySequence;
    host.clearSelection();
    slots.forEach(clearPatternPreview);
    for (const slot of slots) {
      const target = destinations[slot];
      target.checked = false;
      target.parentElement.classList.remove('is-target');
    }
    pick = drag = null;
    banner.hidden = true;
    filter.disabled = arrange.disabled = false;
    library.classList.remove('special-frame-active');
    for (const [mode, toggle] of Object.entries(modeToggles)) Object.assign(toggle, ordinaryModeChecks[mode]);
    if (previousMode === 'moduleMode') by(previousMode).click();
  }

  function setPicker(next) {
    if (next && (!active || applying)) return;
    const hadPick = !!pick;
    pick = next;
    filter.disabled = arrange.disabled = !!next;
    if (!next) {
      if (hadPick && active) {
        search.value = '';
        selectCategory(categoryId);
      }
      return;
    }
    window.LofiOriginalCNC.show(true);
    search.value = '';
    filters.querySelector('[data-category=""]').click();
    syncCategory();
  }

  function artType(key) {
    const entry = catalog.get(key);
    if (!entry || entry.native_frame) return '';
    const engine = window.LofiSpecialFramePatterns;
    if (engine.supportsBorder(key)) return 'border';
    if (engine.supportsInsert(key)) return 'insert';
    if (engine.supportsCut(key)) return 'cut';
    return engine.supports(key) ? 'pattern' : '';
  }

  function assignArtwork(slot, key, type, focus) {
    if (type !== 'pattern') chooseZoneFeature(slot, type, key, focus);
    else {
      artwork[slot].value = key;
      changeArt(slot, focus);
    }
  }

  function returnToFrame(key, type) {
    if (!pick) return;
    const {slot} = pick;
    setPicker(null);
    if (!key) return;
    setStatus('');
    assignArtwork(slot, key, type, true);
    draw();
    syncCategory();
  }

  new MutationObserver(syncCategory).observe(cards, { childList: true });
  filter.onclick = () => open();
  tile.onclick = () => open();
  cancel.onclick = () => {
    if (pick) {
      returnToFrame('');
      return;
    }
    leave();
    selectCategory(group.value);
  };
  cards.addEventListener('click', event => {
    const card = event.target.closest('.original-card');
    if (!card || !active || card === tile || cards.classList.contains('arranging')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const key = card.dataset.id;
    if (!loaded || applying) return;
    const type = artType(key);
    if (!type || catalog.get(key).retired) {
      setStatus('Mẫu này chưa có đường bao để đặt vào khung.', true);
      return;
    }
    if (pick) {
      returnToFrame(key, type);
      return;
    }
    const targets = selectedSlots();
    if (!targets.length) {
      setStatus('Tích Vùng trên hoặc Vùng dưới để chọn mẫu.');
      return;
    }
    setStatus('');
    targets.forEach((slot, i) => assignArtwork(slot, key, type, i === 0));
    draw();
    syncCategory();
  }, true);
  by('designerTab').addEventListener('click', () => {
    if (!active) return;
    leave();
    selectCategory('');
  }, true);

  window.addEventListener('lofi-cnc-reply', ({detail}) => {
    if (detail?.type !== 'special_frame_config' || !detail.config || applying) return;
    try {
      open(host.useLoaded(detail.config, detail.selection));
    } catch (error) {
      setStatus(error.message || 'Không đọc được thông số khung.', true);
    }
  });
  window.LofiSpecialFrame = { open };
})();
