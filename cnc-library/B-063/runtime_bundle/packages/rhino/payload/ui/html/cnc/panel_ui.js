function _regenerator() { var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t.return || t.return(); } finally { if (u) throw o; } } }; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
(function () {
  'use strict';

  var P = LofiCNCPanel,
    G = LofiCNCGeometry,
    $ = function $(id) {
      return document.getElementById(id);
    },
    entries = LofiOriginalCNCCatalog,
    byId = Object.fromEntries(entries.map(function (e) {
      return [e.id, e];
    })),
    view = $('originalLibrary');
  var cfg = P.normalize({follow_frame:true,custom_lock:false}),
    mode = 'panel',
    result = null,
    regionDocument = null, regionIndex = -1, regionSelection = [], regionBatchEpoch = 0, wholeResult = null,
    timer = null,
    revision = 0,
    is3d = false,
    selected = {
      insert: -1,
      cut: -1
    },
    activeKind = 'insert',
    chosen = [],
    dragGesture = null,
    ignoreDragClick = false;
  var pendingCreation = null, creationSequence = 0, creationSession = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  var promises = {},
    layout = view.querySelector('.original-layout'),
    oldDesign = view.querySelector('.original-design'),
    oldEditor = view.querySelector('.original-editor');
  var switches = document.createElement('div');
  switches.className = 'panel-mode';
  switches.innerHTML = '<button id="panelMode">Vách có thông số</button><button id="moduleMode">Chèn mô-đun</button>';
  view.querySelector('.original-heading').appendChild(switches);
  var design = document.createElement('div');
  design.className = 'panel-design';
  design.innerHTML = '<div class="preview-tools"><strong id="panelTitle">Xem trước vách</strong><button id="panel2d">2D</button><button id="panel3d">3D</button><button id="panelExpand" aria-pressed="false" title="Mở rộng bảng xem trước; Esc để thu gọn">Phóng rộng</button></div><div class="panel-zoom"><button id="panelZoomOut" aria-label="Thu nhỏ">−</button><output id="panelZoomValue" aria-label="Mức phóng đại">100%</output><button id="panelZoomIn" aria-label="Phóng to">＋</button><button id="panelFit" title="Hiện toàn bộ hình và đưa khung nhìn về giữa">Vừa khung</button><button id="panelPan" aria-pressed="false" title="Bật để kéo khung nhìn; cũng có thể giữ chuột giữa hoặc Space + kéo">Kéo khung nhìn</button><small>Cuộn chuột để zoom</small></div><div id="panelPreview" class="panel-preview"></div><div id="panelMetrics"></div><div id="panelValidation" role="status"></div><div class="actions"><button class="primary" id="panelCreate">Tạo vách trong Rhino</button><button class="primary" id="panelUpdate">Cập nhật vách chọn</button></div>';
  var editor = document.createElement('div');
  editor.className = 'panel-editor';
  function field(key, label, min, max) {
    var step = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 'any';
    return '<label>' + label + '<input data-panel="' + key + '" type="number" step="' + step + '"></label>';
  }
  function check(key, label) {
    return '<label class="check"><input data-panel="' + key + '" type="checkbox">' + label + '</label>';
  }
  function section(title, contents) {
    var open = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    return '<details' + (open ? ' open' : '') + '><summary>' + title + '</summary><div class="panel-section">' + contents + '</div></details>';
  }
  var sheetEdges=[
    {id:'left',label:'Cách mép trái',axis:'x',sign:1},
    {id:'right',label:'Cách mép phải',axis:'x',sign:-1},
    {id:'top',label:'Cách mép trên',axis:'y',sign:-1},
    {id:'bottom',label:'Cách mép dưới',axis:'y',sign:1}
  ];
  var edgeDraft=null;
  function sheetEdgeInputs(){
    return sheetEdges.map(function(side){
      return '<label title="Đo từ đường bao họa tiết đến mép ngoài của tấm theo trục '+side.axis.toUpperCase()+'">'+side.label+
        ' (mm)<input id="insertEdge_'+side.id+'" type="number" min="0" step="any" disabled></label>';
    }).join('');
  }
  function itemSection(kind) {
    var cut = kind === 'cut';
    return '<div class="row"><select id="' + kind + 'Choice" aria-label="Chọn ' + (cut ? 'mẫu đục' : 'họa tiết') + '"></select><button id="' + kind + 'Add">＋ Thêm</button></div><div id="' + kind + 'List" class="panel-item-list"></div>' + (cut ? '' : '<div class="row" role="group" aria-label="Căn tâm họa tiết"><button type="button" id="insertCenterX" title="Về giữa khung theo chiều ngang">Tâm X</button><button type="button" id="insertCenterY" title="Về giữa khung theo chiều dọc">Tâm Y</button><button type="button" id="insertCenter" title="Về giữa khung theo cả hai trục">Căn giữa</button></div>') + '<div class="fields">' + [['x', 'Tâm X (mm)', -10000, 20000], ['y', 'Tâm Y (mm)', -10000, 20000], ['width', 'Rộng (mm)', 5, 10000], ['height', 'Cao (mm)', 5, 10000], ['angle', 'Xoay (°)', -360, 360], ['depth', 'Độ nổi (mm)', 1, 100]].map(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 4),
        key = _ref2[0],
        label = _ref2[1],
        min = _ref2[2],
        max = _ref2[3];
      if(!cut && key==='x')return '';
      if(!cut && key==='y')return sheetEdgeInputs();
      return '<label>' + label + '<input data-layer="' + kind + '" data-param="' + key + '" type="number" step="any"></label>';
    }).join('') + '</div>' + (!cut ? '<div class="panel-rim-controls"><label class="check"><input type="checkbox" id="insertEven"> Làm đều vòng và hình lặp</label><label>Bù dày/mỏng viền (±mm)<input data-layer="insert" data-param="rim_adjust" type="number" step="any"></label><small>0 giữ viền gốc. Số dương dày ra ngoài, số âm mỏng vào trong; giữ nguyên nét chữ. Kích thước bao và khoảng cách tính theo mép viền mới.</small></div><div class="panel-rim-controls"><strong>Viền trong và viền ngoài</strong><div class="fields"><label>Viền trong (mm)<input id="insertInnerRim" type="number" min="0" step="any" disabled></label><label>Viền ngoài (mm)<input id="insertOuterRim" type="number" min="0" step="any" disabled></label></div><small id="insertRimSize" role="status"></small><button id="insertRimReset">Về viền gốc</button></div><div class="panel-rim-controls"><label class="check"><input id="insertGapOn" type="checkbox"> Chỉnh khe cho dao CNC 6 mm</label><label>Phạm vi chỉnh<select id="insertGapScope"><option value="rim">Viền hồi văn · chia đều cầu nối</option><option value="all">Khe nhỏ trong toàn mẫu</option></select></label><label>Bề rộng sau nới (mm, từ 6,1)<input id="insertGapMm" type="number" min="6.1" step="any" value="6.1"></label><label id="insertBridgeLabel">Cầu nối chia đều (mm)<input id="insertBridgeMm" type="number" min="0" step="any" value="6.1"></label><small>Viền hồi văn: mỗi cầu nối trắng có bề rộng đã nhập; viền ngoài và phần giữa mẫu giữ nét gốc. Toàn mẫu: chỉ nới chỗ nhỏ hơn 6 mm.</small></div><label>Kiểu chèn<select data-layer="insert" data-param="mode"><option value="inlay">Chèn chìm, dọn nền theo viền</option><option value="union">Ghép vào vách</option><option value="background">Đục nền, giữ họa tiết</option><option value="raised">Họa tiết nổi</option></select></label><div class="actions"><button id="insertExportDxf">Xuất riêng DXF</button><button id="insertExportSkp">Xuất riêng 3DM</button></div><small>Chỉ xuất họa tiết đang chọn, không kèm khung hoặc vách.</small>' : '') + '<div class="row"><label class="check"><input data-layer="' + kind + '" data-param="lock" type="checkbox">Giữ tỷ lệ</label><label class="check"><input data-layer="' + kind + '" data-param="mirror" type="checkbox">Lật</label></div><div class="actions">' + [['Rotate', 'Xoay +90°'], ['Duplicate', 'Nhân bản'], ['Vertical', 'Xếp dọc'], ['Horizontal', 'Xếp ngang'], ['Center', 'Căn giữa'], ['Delete', 'Xóa hình']].map(function (_ref3) {
      var _ref4 = _slicedToArray(_ref3, 2),
        id = _ref4[0],
        label = _ref4[1];
      if(!cut && id==='Center')return '';
      return '<button id="' + kind + id + '">' + label + '</button>';
    }).join('') + '</div>' + (!cut ? '<button id="insertPlace" class="primary">Đặt trực tiếp trên vách Rhino</button>' : '') + '<small>' + (cut ? 'Vùng hình mẫu được trừ xuyên toàn bộ độ dày tấm.' : 'Chèn chìm: dọn nền theo viền họa tiết, giữ khung và cùng độ dày vách. Chọn vách LOFIHOME trong Rhino, bấm Đặt trực tiếp rồi bấm vị trí; Esc để hủy. Nút này cũng đổi vị trí họa tiết đã nạp từ vách.') + '</small>';
  }
  editor.innerHTML = '<div class="row panel-top-actions"><button id="panelLoad">Lấy vách chọn</button><button id="panelReset">Mặc định</button></div><label class="panel-toggle"><input id="panelSolid" type="checkbox"> TẤM ĐẶC</label><label class="panel-toggle"><input id="panelHollow" type="checkbox"> KHUNG RỖNG</label>' + section('Kích thước tấm', '<label>Tên vách<input data-panel="name" maxlength="100"></label><div class="fields">' + field('width', 'Rộng (mm)', 50, 10000) + field('height', 'Cao (mm)', 50, 10000) + field('thickness', 'Dày tấm (mm)', 1, 200, .1) + '<label>Màu vật liệu<input data-panel="material" type="color"></label></div><label>Hướng đặt<select data-panel="plane"><option value="xz">Đứng (XZ)</option><option value="xy">Nằm (XY)</option></select></label><div class="panel-pattern-controls"><strong>Nét & khoảng hở hoa văn nền</strong><div class="fields">' + field('bar_adjust', 'Bù rộng nét/nan (±mm)', -30, 30, .1) + '<label>Bù khoảng hở (±mm)<input id="panelPatternGap" type="number" step="0.1" aria-describedby="panelPatternHelp panelPatternInfo"></label></div>' + field('module', 'Cỡ hoa văn (mm)', 20, 3000) + '<small id="panelPatternHelp">0 mm giữ nét và khe của mẫu gốc ở cỡ đang chọn. Tăng nét làm khe hẹp lại; tăng khe làm nét mảnh hơn. Hai ô bù liên kết với nhau, không phải kích thước tuyệt đối.</small><small id="panelPatternInfo" role="status"></small><button id="panelPatternReset">Đưa bù nét / khe về 0</button></div>', true) + section('Khung & gia công', '<div class="fields">' + field('frame', 'Rộng khung (mm)', 0, 1000) + '</div>' + check('frame_equal', 'Dùng chung bề rộng khung 4 cạnh') + '<div id="panelFrameSides" class="fields" hidden>' + field('frame_top', 'Khung trên (mm)', 0, 1000) + field('frame_bottom', 'Khung dưới (mm)', 0, 1000) + field('frame_left', 'Khung trái (mm)', 0, 1000) + field('frame_right', 'Khung phải (mm)', 0, 1000) + '</div><p id="panelFrameSidesInfo" class="hint"></p><div class="fields">' + field('margin', 'Khoảng lùi (mm)', 0, 1000) + '</div>' + check('equal_margins', 'Chia đều khoảng lùi 4 cạnh') + '<div id="panelMargins" class="fields">' + field('left', 'Lùi trái (mm)', 0, 1000) + field('right', 'Lùi phải (mm)', 0, 1000) + field('top', 'Lùi trên (mm)', 0, 1000) + field('bottom', 'Lùi dưới (mm)', 0, 1000) + '</div>' + check('weld', 'Hàn hoa văn với khung') + check('follow_frame', 'Hoa văn bám theo viền') + '<small id="panelFrameFollowInfo" role="status"></small>' + '<div class="fields">' + field('angle', 'Xoay hoa văn (°)', -360, 360) + field('offset_x', 'Dịch X (mm)', -10000, 10000) + field('offset_y', 'Dịch Y (mm)', -10000, 10000) + '</div>' + check('mirror', 'Lật hoa văn') + '<button id="panelBalance">Cân giữa hoa văn</button><small>Khoảng lùi tính từ mép ngoài tấm khi tắt bám viền. Cỡ hoa văn được giữ theo thông số đã nhập.</small>') + section('Họa tiết chèn', itemSection('insert')) + section('Biên dạng tùy chỉnh', '<label class="check"><input id="panelCustomEnabled" type="checkbox">Bật chế độ biên dạng tùy chỉnh</label><button id="panelCapture" class="custom-capture">Đọc hình vẽ đang chọn</button><small id="panelCustomStatus" role="status">Chưa đọc biên dạng.</small><div id="panelCustomDimensions"><strong>Kích thước biên dạng</strong><div class="fields"><label>Ngang (mm)<input id="panelCustomWidth" type="number" min="0" step="any" disabled></label><label>Cao (mm)<input id="panelCustomHeight" type="number" min="0" step="any" disabled></label></div>' + check('custom_lock', 'Giữ tỷ lệ ngang / cao') + '<small id="panelCustomSizeInfo" role="status"></small></div><label>Biên tấm<select data-panel="outline"><option value="rectangle">Chữ nhật</option><option value="arch">Vòm</option><option value="custom">Biên dạng đã đọc</option></select></label>' + check('custom_fill_inner', 'Lồng hoa văn vào ô khung đã vẽ') + '<small id="panelDrawnFrameNote"></small><div id="panelCustomFrameControls" class="panel-custom-frame-controls"><strong>Độ dày/mỏng khung biên dạng</strong><div id="panelDrawnFrameControls">' + field('custom_frame_adjust', 'Bù dày/mỏng khung (±mm)', -1000, 1000, .1) + '<small>0 giữ khung gốc. Số dương làm khung dày vào trong; số âm làm khung mỏng đi. Giữ nguyên viền ngoài và kích thước tấm.</small><button id="panelCustomFrameReset">Giữ khung gốc · 0 mm</button></div><div id="panelOutlineFrameControls"><label>Rộng khung (mm)<input id="panelCustomFrameWidth" type="number" min="0" step="0.1"></label><small>Biên dạng chỉ có viền ngoài: khung chạy đều vào trong theo bề rộng này.</small></div><small id="panelCustomFrameInfo" role="status"></small></div>' + check('custom_place', 'Đặt tại vị trí hình đã đọc') + '<small>Chọn Face, một Group/Component dạng tấm hoặc đường viền kín. Chọn đủ viền ngoài và viền trong để giữ khung đã vẽ, lồng hoa văn vào ô bên trong. Tắt Lồng hoa văn để giữ các lỗ trống. Hình gốc được giữ lại.</small>') + section('Đục thủng tấm đặc', itemSection('cut')) + section('Lưu và xuất', '<div class="actions"><button id="panelSvg">Xuất SVG (mm)</button><button id="panelDxf">Xuất DXF (mm)</button><button id="panelExportSkp">Lưu vách chọn CDR</button><button id="panelExportConfig">Lưu thông số JSON</button><button id="panelImportConfig">Mở thông số JSON</button><button id="panelCreateItems">Tạo họa tiết riêng 3D</button></div><small>SVG/DXF dùng đúng đường biên đang xem. Các lệnh xuất không tạo đường chạy dao.</small>') + '<small class="original-note">Nguồn 295 mẫu: Nguyễn Khánh CNC 1.9.8. Bộ dựng và thông số vách: LOFIHOME độc lập.</small>';
  layout.append(design, editor);
  var viewport=LofiPanelViewport.create($('panelPreview'),{design:design,cancelEdit:function(){finishDrag(false);},editing:function(){return !!dragGesture;}});
  var regionBar=document.createElement('div');regionBar.id='panelRegionBar';regionBar.hidden=true;
  regionBar.innerHTML='<div class="row"><button id="panelAllRegions" title="Bỏ chọn vùng và xem thông số tổng">Toàn bộ vùng</button><select id="panelRegionChoice" aria-label="Chọn vùng làm việc"></select><button id="panelSelectAllRegions">Chọn tất cả vùng</button><button id="panelClearRegions">Bỏ chọn vùng</button><strong id="panelRegionStatus"></strong></div>';
  design.querySelector('.preview-tools').before(regionBar);
  var regionCapture=document.createElement('button');regionCapture.id='panelCaptureRegions';regionCapture.className='custom-capture';regionCapture.textContent='Đọc hình chia vùng bằng line';
  $('panelCapture').after(regionCapture);
  regionCapture.onclick=function(){send('panel_capture_regions');};
  var batchEditor=LofiRegionBatch.create(entries,{changed:function(){if($('panelCreateItems'))blocked(!result);},refresh:function(){if(regionDocument)batchEditor.refresh(regionDocument,regionSelection);},apply:applyRegionBatch});
  layout.appendChild(batchEditor.element);
  var dimensionInfo=LofiPanelDimensions.create({choose:chooseRegion});
  $('panelPreview').before(dimensionInfo.element);
  $('panelMetrics').before(dimensionInfo.stockElement);
  var smoothButton=document.createElement('button');smoothButton.id='panelSmooth';smoothButton.textContent='Làm mịn';smoothButton.title='Làm mịn hoa văn ngay trong bản xem trước';
  $('panelFit').after(smoothButton);
  var smoothingJobs=LofiGeometryJobs.create(),smoothPending=null;
  var smoothCancel=document.createElement('button');smoothCancel.id='panelSmoothCancel';smoothCancel.textContent='Hủy tính';smoothCancel.hidden=true;smoothButton.after(smoothCancel);
  function smoothingAssets(c){var assets={};LofiPanelRegions.assets(c).forEach(function(id){if(LofiCNCShapes[id])assets[id]=LofiCNCShapes[id];});return assets;}
  function acceptSmoothing(built,assets){
    var cached=built._worker_item_cache||{};delete built._worker_item_cache;
    Object.keys(cached).forEach(function(id){if(assets[id]===LofiCNCShapes[id])P.acceptWorkerItemCache(assets[id],cached[id]);});
  }
  function hasSmoothing(c){return LofiPanelSmoothing.active(c.smoothing) || (c.items||[]).some(function(i){return LofiPanelSmoothing.active(i.smoothing);}) || (c.custom_regions||[]).some(function(r){return hasSmoothing(r.config);});}
  function hasPattern(c){return c.mode==='pattern' || c.border && c.border.enabled || (c.custom_regions||[]).some(function(r){return hasPattern(r.config);});}
  function showCapturedOutline(c){
    if(c.outline!=='custom' || !Array.isArray(c.custom_outer) || !(c.width>0&&c.height>0))return false;
    var box=G.bounds(c.custom_outer),w=c.width,h=c.height,pad=Math.max(w,h)*.06;
    if(!(box.x1>box.x0&&box.y1>box.y0))return false;
    var loops=[c.custom_outer].concat(c.custom_holes||[]).map(function(l){return l.map(function(p){return [(p[0]-box.x0)*w/(box.x1-box.x0),(p[1]-box.y0)*h/(box.y1-box.y0)];});});
    $('panelPreview').innerHTML='<svg data-captured-outline="true" xmlns="http://www.w3.org/2000/svg" viewBox="'+[-pad,-pad,w+2*pad,h+2*pad].join(' ')+'"><g transform="translate(0 '+h+') scale(1 -1)"><path d="'+loops.map(G.path).join(' ')+'" fill="'+c.material+'" fill-rule="evenodd" stroke="#704e32" stroke-width="1" vector-effect="non-scaling-stroke"/></g></svg>';
    $('panelMetrics').textContent='Đã đọc khung: '+LofiPanelDimensions.size(w,h)+' (ngang × cao) · '+loops.length+' đường viền. Hoa văn đang chờ tính.';
    return true;
  }
  function cancelSmoothing(message){
    if(!smoothPending)return;
    smoothPending=null;smoothingJobs.cancel();smoothCancel.hidden=true;blocked(!result);
    if(message){$('panelSmoothMessage').textContent=message;status(message);}
  }
  smoothCancel.onclick=function(){cancelSmoothing('Đã hủy tính. Chưa thay đổi hình trong Rhino.');};
  document.addEventListener('keydown',function(e){if(e.key==='Escape' && smoothPending)cancelSmoothing('Đã hủy tính. Chưa thay đổi hình trong Rhino.');});
  window.addEventListener('beforeunload',function(){smoothPending=null;smoothingJobs.cancel();});
  var smoothBox=document.createElement('div');smoothBox.id='panelSmoothBox';smoothBox.className='panel-smooth-popup';smoothBox.hidden=true;
  smoothBox.innerHTML='<div class="row"><strong>Làm mượt & bo góc</strong><button id="panelSmoothClose" aria-label="Đóng làm mịn">×</button></div><small id="panelSmoothScope"></small><label class="check"><input id="panelSmoothEnabled" type="checkbox"> Bật làm mịn</label><label>Cách xử lý<select id="panelSmoothMode"><option value="arcs">Làm mịn cung và thành đứng (giữ góc)</option><option value="curves">Làm mượt đường cong</option><option value="round">Bo góc theo R</option><option value="both">Làm mượt + bo góc</option><option value="legacy">Làm mịn cũ (V317.116)</option></select></label><div class="fields"><label>Góc ngưỡng (°)<input id="panelSmoothAngle" type="number" min="0" max="90" step="1" value="10"></label><label>Độ mịn (2–12)<input id="panelSmoothSegments" type="number" min="2" max="12" step="1" value="8"></label><label id="panelSmoothRadiusLabel">Bán kính bo R (mm)<input id="panelSmoothRadius" type="number" min="0" step="0.05" value="1"></label><label id="panelSmoothToleranceLabel">Độ chính xác (mm)<input id="panelSmoothTolerance" type="number" min="0.005" max="0.5" step="0.005" value="0.02"></label></div><small id="panelSmoothHelp"></small><small>Giữ nguyên khung, kích thước tấm và điểm nối với khung. Xem trước, tạo vách và DXF dùng cùng kết quả.</small><div class="row"><button id="panelSmoothApply" class="primary">Áp dụng xem trước</button><button id="panelSmoothReset">Nét gốc</button></div><small id="panelSmoothMessage" role="status"></small>';
  design.appendChild(smoothBox);
  function smoothModeControls(){
    var mode=$('panelSmoothMode').value;
    $('panelSmoothRadiusLabel').hidden=mode==='legacy' || mode==='curves' || mode==='arcs';
    $('panelSmoothToleranceLabel').hidden=mode==='legacy';
    $('panelSmoothHelp').textContent=mode==='arcs'?'Nội suy cung tròn theo dung sai mm, làm mịn các mặt đứng liền nhau dưới góc ngưỡng. Giữ góc vuông và đường bao khung.':mode==='legacy'?'Giữ cách làm mịn đã lưu ở bản cũ.':mode==='curves'?'Làm mượt góc dưới ngưỡng; giữ góc nhọn. Độ chính xác mm càng nhỏ, đường cong càng mượt.':mode==='round'?'Bo các góc lớn hơn ngưỡng theo đúng R; giữ đường cong nhỏ. R quá lớn sẽ báo lỗi.':'Làm mượt góc dưới ngưỡng và bo góc lớn hơn ngưỡng theo R. R quá lớn sẽ báo lỗi.';
  }
  $('panelSmoothMode').onchange=smoothModeControls;
  function smoothControls(){
    if(!$('panelSmoothEnabled'))return;
    var values=regionDocument && regionSelection.length ? regionSelection.map(function(i){return regionDocument.custom_regions[i].config.smoothing;}) : [cfg.smoothing];
    var value=values[0] || {enabled:false,angle:15,segments:8,mode:'arcs',radius:1,tolerance:.02},mixed=values.some(function(v){return JSON.stringify(v)!==JSON.stringify(values[0]);});
    $('panelSmoothEnabled').checked=value.enabled;$('panelSmoothAngle').value=value.angle;$('panelSmoothSegments').value=value.segments;
    $('panelSmoothMode').value=value.mode || 'legacy';$('panelSmoothRadius').value=value.radius===undefined?1:value.radius;$('panelSmoothTolerance').value=value.tolerance===undefined?.02:value.tolerance;smoothModeControls();
    $('panelSmoothScope').textContent=(regionDocument ? regionSelection.length ? 'Áp dụng cho vùng '+regionSelection.map(function(i){return i+1;}).join(', ') : 'Chọn vùng trên bản xem trước trước khi làm mịn.' : 'Hoa văn nền, chạy viền và họa tiết chèn.')+(mixed ? ' · Các vùng đang có thiết lập khác nhau.':'');
    $('panelSmoothApply').disabled=$('panelSmoothReset').disabled=!!regionDocument && !regionSelection.length;
    smoothButton.classList.toggle('active',values.some(function(v){return LofiPanelSmoothing.active(v);}));
    $('panelSmoothMessage').textContent='';
  }
  smoothButton.onclick=function(){smoothBox.hidden=!smoothBox.hidden;if(!smoothBox.hidden)smoothControls();};
  $('panelSmoothClose').onclick=function(){smoothBox.hidden=true;};
  function applySmoothing(reset){
    if(smoothPending || pendingCreation || !result || batchEditor.dirty() || batchEditor.busy()){$('panelSmoothMessage').textContent='Hoàn tất thông số đang chỉnh trước khi làm mịn.';return;}
    if(regionDocument && !regionSelection.length)return;
    try{
      var setting;
      if(!reset){
        if(['panelSmoothAngle','panelSmoothSegments'].some(function(id){return $(id).value==='' || !$(id).checkValidity();}))throw Error('Góc 0–90°, độ mịn nguyên 2–12 đoạn.');
        var draft={enabled:$('panelSmoothEnabled').checked,angle:Number($('panelSmoothAngle').value),segments:Number($('panelSmoothSegments').value)};
        if($('panelSmoothMode').value!=='legacy'){
          if(['panelSmoothRadius','panelSmoothTolerance'].some(function(id){return $(id).value==='' || !$(id).checkValidity();}))throw Error('R 0,05–100 mm; độ chính xác 0,005–0,5 mm.');
          draft.mode=$('panelSmoothMode').value;draft.radius=Number($('panelSmoothRadius').value);draft.tolerance=Number($('panelSmoothTolerance').value);
        }
        setting=LofiPanelSmoothing.normalize(draft);
      }
      finishDrag(false);
      var previous=JSON.stringify(workConfig()),candidate=JSON.parse(previous);
      var targets=regionDocument ? regionSelection.map(function(i){return candidate.custom_regions[i].config;}) : [candidate];
      targets.forEach(function(c){if(reset)delete c.smoothing;else c.smoothing=Object.assign({},setting);});
      // Build the complete candidate before changing the live document. Invalid
      // smoothing drafts leave every region, preview and export unchanged.
      var task={stamp:revision,region:regionIndex,selection:regionSelection.join(','),kind:'apply'};
      smoothPending=task;smoothCancel.hidden=false;blocked(true);$('panelSmoothMessage').textContent='Đang tính làm mịn… Có thể bấm Hủy tính.';
      var workerAssets=smoothingAssets(candidate);
      smoothingJobs.run({kind:'panel',config:candidate,assets:workerAssets,measure:{region:regionIndex,index:exportIndex()},mesh:false},function(text){if(smoothPending===task)$('panelSmoothMessage').textContent=text;}).then(function(built){
        if(smoothPending!==task)return;
        smoothPending=null;smoothCancel.hidden=true;
        if(task.stamp!==revision || task.region!==regionIndex || task.selection!==regionSelection.join(',') || mode!=='panel' || view.hidden || previous!==JSON.stringify(workConfig())){blocked(!result);return;}
        acceptSmoothing(built,workerAssets);
        clearTimeout(timer);revision++;
        if(regionDocument){regionDocument=built.config;wholeResult=built;cfg=LofiPanelRegions.clone(regionDocument.custom_regions[regionIndex].config);}
        else cfg=built.config;
        controls();publishResult(regionDocument ? built.region_results[regionIndex].result : built);
        $('panelSmoothMessage').textContent=reset?'Đã trở về nét gốc.':LofiPanelSmoothing.active(setting)?'Đã làm mịn hoa văn. Khung và kích thước tấm được giữ nguyên.':'Đã tắt làm mịn; giữ thông số để dùng lại.';
      }).catch(function(e){if(smoothPending!==task)return;smoothPending=null;smoothCancel.hidden=true;blocked(!result);$('panelSmoothMessage').textContent='Chưa thay đổi vách. '+e.message;});
    }catch(e){$('panelSmoothMessage').textContent='Chưa thay đổi vách. '+e.message;}
  }
  $('panelSmoothApply').onclick=function(){applySmoothing(false);};
  $('panelSmoothReset').onclick=function(){applySmoothing(true);};
  function multipleRegions(){return !!regionDocument && regionSelection.length>1;}
  function resetRegionBatch(){regionBatchEpoch++;batchEditor.reset();}
  function applyRegionBatch(patch){
    if(!multipleRegions() || batchEditor.busy() || pendingCreation)return;
    var target=regionDocument,indices=regionSelection.slice(),ids=indices.map(function(i){return target.custom_regions[i].id;}),epoch=++regionBatchEpoch,sequence=revision;
    batchEditor.setBusy(true);
    Promise.resolve().then(function(){
      var draft=LofiRegionBatch.draft(target,ids,patch);
      return Promise.all(LofiPanelRegions.assets(draft).map(asset)).then(function(){return draft;});
    }).then(function(draft){
      if(epoch!==regionBatchEpoch || target!==regionDocument || sequence!==revision)return;
      var built=P.build(draft,LofiCNCShapes,false);
      regionDocument=built.config;wholeResult=built;cfg=LofiPanelRegions.clone(regionDocument.custom_regions[regionIndex].config);
      clearTimeout(timer);revision++;resetRegionBatch();controls();publishResult(built.region_results[regionIndex].result);
      status('Đã áp dụng thông số chung cho '+indices.length+' vùng.');
    }).catch(function(e){
      if(epoch!==regionBatchEpoch || target!==regionDocument || sequence!==revision)return;
      batchEditor.error('Chưa áp dụng cho vùng nào. '+e.message);blocked(!result);
    });
  }
  function commitRegion(){
    if(regionDocument && regionIndex>=0 && !multipleRegions()){regionDocument.custom_regions[regionIndex].config=cfg;regionDocument.thickness=cfg.thickness;}
  }
  function workConfig(){commitRegion();return regionDocument ? P.normalize(regionDocument) : P.normalize(cfg);}
  function buildWorkingCandidate(next){
    if(!regionDocument || regionIndex<0)return {local:P.build(next,LofiCNCShapes,false)};
    var document=LofiPanelRegions.clone(regionDocument);document.custom_regions[regionIndex].config=next;
    var whole=P.build(document,LofiCNCShapes,false);
    return {local:whole.region_results[regionIndex].result,whole:whole};
  }
  function unlockRegions(){editor.querySelectorAll('[data-region-disabled]').forEach(function(e){e.disabled=e.dataset.regionDisabled==='true';delete e.dataset.regionDisabled;});}
  function regionControls(){
    var multi=multipleRegions();
    batchEditor.element.hidden=mode!=='panel'||!multi;editor.hidden=mode!=='panel'||multi;
    featureBar.hidden=mode!=='panel'||multi;
    layout.classList.toggle('panel-horizontal-layout', mode==='panel'&&!multi);
    regionBar.hidden=!regionDocument;
    if(!regionDocument)return;
    $('panelRegionChoice').innerHTML='<option value="-1">Toàn bộ vùng</option>'+(multi?'<option value="-2" disabled>'+regionSelection.length+' vùng đang chọn</option>':'')+regionDocument.custom_regions.map(function(r,i){return '<option value="'+i+'">Vùng '+(i+1)+'</option>';}).join('');
    $('panelRegionChoice').value=String(multi?-2:regionIndex);
    $('panelRegionStatus').textContent=multi ? 'Đang chọn '+regionSelection.length+' vùng: '+regionSelection.map(function(i){return i+1;}).join(', ') : regionIndex<0 ? regionDocument.custom_regions.length+' vùng · Bấm một vùng để bắt đầu' : 'Đang chỉnh Vùng '+(regionIndex+1)+' / '+regionDocument.custom_regions.length;
    if(multi)batchEditor.refresh(regionDocument,regionSelection);
    ['panelSelectAll','panelSelectNone','panelDeleteSelection'].forEach(function(id){if(multi)$(id).disabled=true;});
    if(multi)$('panelSelectionStatus').textContent='Đang chỉnh chung các vùng. Chọn riêng một vùng để chỉnh họa tiết chèn.';
    var allow=['panelLoad','panelCapture','panelCaptureRegions','panelImportConfig','panelExportConfig','panelSvg','panelDxf','panelExportSkp'];
    editor.querySelectorAll('input,select,button').forEach(function(e){
      var globalField=['width','height','thickness','name','material','plane','custom_lock','custom_place'].indexOf(e.dataset.panel)>=0;
      var fixed=(regionIndex>=0 && ['width','height','outline','custom_fill_inner','custom_lock','custom_place','material','plane'].indexOf(e.dataset.panel)>=0) || e.id==='panelCustomEnabled';
      if((regionIndex<0 && allow.indexOf(e.id)<0 && !globalField)||fixed){if(e.dataset.regionDisabled===undefined)e.dataset.regionDisabled=String(e.disabled);e.disabled=true;}
    });
  }
  function selectRegions(indices,anchor){
    if(!regionDocument || pendingCreation)return;
    if(batchEditor.dirty() || batchEditor.busy()){status('Áp dụng hoặc Bỏ thay đổi trước khi đổi các vùng chọn.',true);$('panelRegionChoice').value=String(multipleRegions()?-2:regionIndex);return;}
    if(indices.join(',')===regionSelection.join(','))return;
    if(!result){status('Chỉnh lại thông số vùng hiện tại trước khi đổi vùng.',true);return;}
    finishDrag(false);commitRegion();regionSelection=indices;regionIndex=indices.length ? anchor : -1;chosen=[];selected={insert:-1,cut:-1};resetRegionBatch();
    cfg=regionIndex<0 ? regionDocument : LofiPanelRegions.clone(regionDocument.custom_regions[regionIndex].config);
    controls();schedule();
  }
  function chooseRegion(index,toggle){
    if(index<0){selectRegions([],-1);return;}
    var indices=toggle ? regionSelection.slice() : [],found=indices.indexOf(index);
    if(found>=0)indices.splice(found,1);else indices.push(index);
    selectRegions(indices,indices.indexOf(index)>=0 ? index : indices[indices.length-1]);
  }
  $('panelAllRegions').onclick=function(){chooseRegion(-1);};
  $('panelClearRegions').onclick=function(){chooseRegion(-1);};
  $('panelSelectAllRegions').onclick=function(){if(regionDocument){var indices=regionDocument.custom_regions.map(function(_,i){return i;});selectRegions(indices,indices[0]);}};
  $('panelRegionChoice').onchange=function(){chooseRegion(Number(this.value));};
  function previewPoint(x,y,z){
    var height=regionDocument ? regionDocument.height : cfg.height;
    return is3d ? [(x-y)*.8,-(x+y)*.38-z] : [x,height-y];
  }
  function regionDrawing(box){
    var r=wholeResult;if(!regionDocument || !r)return '';
    var drawing='',sx=r.width/r.config.region_basis[0],sy=r.height/r.config.region_basis[1];
    r.config.custom_regions.forEach(function(region,i){
      var ls=[region.outer].concat(region.holes).map(function(l){return l.map(function(p){return [p[0]*sx,p[1]*sy];});});
      var active=regionSelection.indexOf(i)>=0,color=active ? '#d86b00' : '#078cad';
      drawing+='<path data-panel-region="'+i+'" tabindex="0" role="button" aria-label="Chỉnh Vùng '+(i+1)+'" aria-pressed="'+active+'" d="'+ls.map(function(l){return G.path(l.map(function(p){return previewPoint(p[0],p[1],r.thickness);}));}).join(' ')+'" fill="'+(active ? 'rgba(255,166,35,0.06)' : 'rgba(0,140,180,0.015)')+'" fill-rule="evenodd" stroke="'+color+'" stroke-width="'+(active ? 2.5 : 1)+'" vector-effect="non-scaling-stroke" pointer-events="fill" style="cursor:pointer"/>';
    });
    return drawing;
  }
  $('panelPreview').addEventListener('click',function(event){var target=event.target.closest('[data-panel-region]');if(target && (event.shiftKey || multipleRegions() || Number(target.dataset.panelRegion)!==regionIndex)){event.stopImmediatePropagation();if(ignoreDragClick){ignoreDragClick=false;event.preventDefault();return;}chooseRegion(Number(target.dataset.panelRegion),event.shiftKey);}},true);
  $('panelPreview').addEventListener('keydown',function(event){var target=event.target.closest('[data-panel-region]');if(target&&(event.key==='Enter'||event.key===' ')){event.preventDefault();event.stopImmediatePropagation();chooseRegion(Number(target.dataset.panelRegion),event.shiftKey);}},true);

  var spacingState={insert:{key:null,draft:false},cut:{key:null,draft:false}};
  ['insert','cut'].forEach(function (kind) {
    var box=document.createElement('div');box.className='panel-spacing';
    box.innerHTML='<strong>Khoảng cách nhóm chọn</strong><div class="fields"><label>Hướng<select id="'+kind+'SpacingAxis"><option value="y">Dọc</option><option value="x">Ngang</option></select></label><label>Khoảng cách (mm)<input id="'+kind+'SpacingGap" data-spacing-gap="'+kind+'" type="number" min="0" step="any"></label></div><button id="'+kind+'SpacingApply">Áp dụng khoảng cách</button><small id="'+kind+'SpacingInfo" role="status"></small>';
    $(kind+'Horizontal').closest('.actions').after(box);
    $(kind+'SpacingGap').addEventListener('input',function () {spacingState[kind].draft=true;});
    $(kind+'SpacingGap').addEventListener('keydown',function (event) {if(event.key==='Enter') {event.preventDefault();applySpacing(kind);}});
    $(kind+'SpacingAxis').onchange=function () {spacingState[kind].draft=false;renderSpacing(kind);};
    $(kind+'SpacingApply').onclick=function () {applySpacing(kind);};
  });
  var borderDetails=document.createElement('details');borderDetails.id='panelBorderSection';
  borderDetails.innerHTML='<summary>Chạy viền trong</summary><label class="check"><input id="panelBorderEnabled" type="checkbox">Bật hoa văn chạy viền</label><label class="check"><input id="panelBorderJoinEqual" type="checkbox"><span id="panelBorderJoinLabel">Nối bằng nan của mẫu</span></label><label id="panelBorderPhotoFitRow" class="check" hidden><input id="panelBorderPhotoFit" type="checkbox">Giữ trọn mẫu, cân đều hai cạnh</label><small id="panelBorderName">Chọn một mẫu trong nhóm Chạy viền bên trái.</small><div class="fields"><label>Rộng dải viền (mm)<input data-border="width" type="number" min="0" step="1"></label><label><span id="panelBorderModuleLabel">Cỡ mẫu dọc viền (mm)</span><input data-border="module" type="number" min="0" step="1"></label><label><span id="panelBorderGapLabel">Khe giữa mẫu (mm)</span><input data-border="gap" type="number" min="0" step="0.5"></label></div><label>Bù dày/mỏng nét diềm (±mm)<input data-border="stroke_adjust" type="number" step="any"></label><small>Số dương làm nét diềm dày hơn; số âm làm mỏng hơn. Viền bao chỉnh riêng bên dưới.</small><small id="panelBorderHelp">Lặp đều theo viền trong thực của tấm hoặc các ô khung đã đọc. Góc vuông giữ một mẫu nguyên, không kéo méo. Các mẫu còn lại chia đều trên từng cạnh; dải cong chạy liên tục. Đổi kích thước tấm sẽ tự bố trí lại.</small><small id="panelBorderInfo" role="status"></small><button id="panelBorderRemove">Bỏ hoa văn viền</button>';
  var innerControls=document.createElement('div');innerControls.className='panel-custom-frame-controls';
  var omitControls=document.createElement('div');omitControls.className='panel-custom-frame-controls';
  omitControls.innerHTML='<strong>Bỏ riềm theo cạnh</strong><div class="fields">'+[['top','Trên'],['bottom','Dưới'],['left','Trái'],['right','Phải']].map(function(s){return '<label class="check" style="display:flex;align-items:center;gap:6px;white-space:nowrap"><input type="checkbox" style="width:auto;flex:0 0 auto;margin:0" data-border-omit="'+s[0]+'"> Bỏ riềm '+s[1].toLowerCase()+'</label>';}).join('')+'</div><small>Chọn cạnh cần bỏ dải hoa văn; bỏ dấu chọn để khôi phục. Khi Bỏ khung, viền bao đi theo phần diềm còn lại. Trên/dưới/trái/phải theo hình xem trước 2D.</small>';
  borderDetails.querySelector('#panelBorderInfo').before(omitControls);
  var edgeControls=document.createElement('div');edgeControls.id='panelBorderEdgeFrame';edgeControls.className='panel-custom-frame-controls';
  edgeControls.innerHTML='<strong>Viền bao diềm khi Bỏ khung</strong><div class="fields"><label>Viền ngoài (mm)<input data-edge-frame="outer" type="number" min="0" step="any"></label><label>Viền trong (mm)<input data-edge-frame="inner" type="number" min="0" step="any"></label></div><label class="check" style="display:flex;align-items:center;gap:6px"><input id="panelBorderOmitRims" type="checkbox" style="width:auto;margin:0">Bỏ viền — lấy riêng diềm</label><small>Bề rộng thực của viền tính từ mép lỗ cắt. Không cộng thêm khoảng dư của mẫu. Đầu hở bọc kín theo bề rộng lớn hơn của viền trong/ngoài.</small>';
  borderDetails.querySelector('#panelBorderInfo').before(edgeControls);
  var layoutControlsBox=document.createElement('div');layoutControlsBox.id='panelBorderLayout';layoutControlsBox.className='panel-custom-frame-controls';
  layoutControlsBox.innerHTML='<label class="check" style="display:flex;align-items:center;gap:6px"><input id="panelBorderIndependent" type="checkbox" style="width:auto;margin:0">Kích thước vòng diềm riêng</label><div class="fields"><label>Ngang khổ bố trí (mm)<input data-border-layout="width" type="number" min="0" step="any"></label><label>Cao khổ bố trí (mm)<input data-border-layout="height" type="number" min="0" step="any"></label></div><small>Khổ bao ngoài của toàn vòng, tính cả viền bao. Vòng chữ nhật: bỏ trên/dưới thì dải dọc giữ đủ chiều cao; bỏ trái/phải thì dải ngang giữ đủ chiều ngang, tính cả viền bọc đầu. Hoa văn bố trí lại; bề rộng nét và viền vẫn tính riêng theo mm. Khi lấy riêng diềm nguyên mẫu và bỏ viền, kích thước vật liệu thực có thể nhỏ hơn khổ bố trí; xem số đo bên dưới.</small><small id="panelBorderVisibleSize" role="status"></small>';
  edgeControls.before(layoutControlsBox);
  function borderLayoutDraft(){cfg.border.layout=Object.assign({enabled:false,width:cfg.width,height:cfg.height},cfg.border.layout||{});return cfg.border.layout;}
  function borderLayoutControls(values){
    var b=cfg.border,l=b&&b.layout,enabled=!!(b&&b.enabled),active=cfg.mode==='frameless';
    layoutControlsBox.hidden=!active;
    var toggle=layoutControlsBox.querySelector('#panelBorderIndependent');toggle.checked=!!(l&&l.enabled);toggle.disabled=!enabled;
    layoutControlsBox.querySelectorAll('[data-border-layout]').forEach(function(e){e.disabled=!enabled||!l||!l.enabled;if(values)e.value=l&&l[e.dataset.borderLayout]!==undefined?l[e.dataset.borderLayout]:cfg[e.dataset.borderLayout];});
    var bounds=result&&result.border_info&&result.border_info.visible_bounds;
    layoutControlsBox.querySelector('#panelBorderVisibleSize').textContent=enabled&&bounds?'Phần diềm còn lấy: '+LofiPanelDimensions.size(bounds.x1-bounds.x0,bounds.y1-bounds.y0)+' (ngang × cao).':'';
  }
  layoutControlsBox.querySelector('#panelBorderIndependent').onchange=function(){if(cfg.border){borderLayoutDraft().enabled=this.checked;borderLayoutControls(true);schedule();}};
  layoutControlsBox.querySelectorAll('[data-border-layout]').forEach(function(e){e.addEventListener('input',function(){if(cfg.border){borderLayoutDraft()[e.dataset.borderLayout]=e.value===''?NaN:Number(e.value);schedule();}});});

  function edgeFrameDraft(){
    cfg.border.edge_frame=Object.assign({enabled:true,outer:10,inner:10},cfg.border.edge_frame||{});
    return cfg.border.edge_frame;
  }
  function edgeFrameControls(values){
    var b=cfg.border,f=b&&b.edge_frame,enabled=!!(b&&b.enabled),active=cfg.mode==='frameless';
    edgeControls.hidden=!active;innerControls.hidden=active;
    edgeControls.querySelector('#panelBorderOmitRims').checked=!!(f&&f.enabled===false);edgeControls.querySelector('#panelBorderOmitRims').disabled=!enabled;
    edgeControls.querySelectorAll('[data-edge-frame]').forEach(function(e){
      e.disabled=!enabled||!!(f&&f.enabled===false);
      if(values)e.value=f&&f[e.dataset.edgeFrame]!==undefined ? f[e.dataset.edgeFrame] : 10;
    });
  }
  edgeControls.querySelectorAll('[data-edge-frame]').forEach(function(e){e.addEventListener('input',function(){
    if(cfg.border){edgeFrameDraft()[e.dataset.edgeFrame]=e.value==='' ? NaN : Number(e.value);schedule();}
  });});
  edgeControls.querySelector('#panelBorderOmitRims').onchange=function(){if(cfg.border){edgeFrameDraft().enabled=!this.checked;edgeFrameControls(true);schedule();}};

  innerControls.innerHTML='<strong>Viền trong & phần giữa</strong><label>Phần giữa<select id="panelCenterMode"><option value="inherit">Theo chế độ tấm</option><option value="hollow">Rỗng xuyên tấm</option><option value="solid">Đặc</option><option value="pattern">Hoa văn</option></select></label><label>Rộng viền trong (mm)<input data-inner-frame="width" type="number" min="0" step="any"></label><label class="check"><input id="panelInnerFrameEqual" type="checkbox">Dùng chung viền trong 4 cạnh</label><div id="panelInnerFrameSides" class="fields" hidden><label>Viền trong trên (mm)<input data-inner-frame="top" type="number" min="0" step="any"></label><label>Viền trong dưới (mm)<input data-inner-frame="bottom" type="number" min="0" step="any"></label><label>Viền trong trái (mm)<input data-inner-frame="left" type="number" min="0" step="any"></label><label>Viền trong phải (mm)<input data-inner-frame="right" type="number" min="0" step="any"></label></div><small>Chọn Rỗng xuyên tấm để bỏ phần giữa, giữ hoa văn chạy viền. Rộng viền trong tính từ mép sâu nhất của hoa văn viền tới lỗ giữa; không thay đổi rộng khung ngoài.</small><small id="panelInnerFrameInfo" role="status"></small><button id="panelInnerFrameReset">Khôi phục viền trong ban đầu</button>';
  borderDetails.querySelector('#panelBorderRemove').before(innerControls);
  editor.querySelector('#insertList').closest('details').before(borderDetails);
  borderDetails.querySelectorAll('small').forEach(function(e){e.style.display='block';e.style.margin='6px 0';});

  // Keep dimensions above the two modes; the six tools follow them directly.
  var sizeSection = editor.querySelector('[data-panel="width"]').closest('details');
  editor.insertBefore(sizeSection, $('panelSolid').closest('label'));
  var modeRow=document.createElement('div');modeRow.className='panel-mode-row';
  modeRow.style.cssText='display:flex;gap:4px;margin:8px 0;';
  $('panelSolid').closest('label').before(modeRow);
  var framelessLabel=document.createElement('label');framelessLabel.className='panel-toggle';
  framelessLabel.innerHTML='<input id="panelFrameless" type="checkbox"> BỎ KHUNG';
  [ $('panelSolid').closest('label'),$('panelHollow').closest('label'),framelessLabel ].forEach(function(label){
    label.style.cssText='display:flex;align-items:center;gap:4px;flex:1;min-width:0;padding:8px 4px;margin:0;font-size:10px;white-space:nowrap;';
    label.querySelector('input').style.cssText='width:auto;flex:0 0 auto;margin:0;';modeRow.appendChild(label);
  });
  framelessLabel.title='Giữ họa tiết chèn và diềm; diềm có viền bao 10 mm chỉnh được. Bật Bỏ viền để lấy diềm trần.';
  var featureSections = [
    editor.querySelector('[data-panel="frame"]').closest('details'),
    borderDetails,
    $('insertList').closest('details'),
    $('panelCapture').closest('details'),
    $('cutList').closest('details'),
    $('panelDxf').closest('details')
  ];
  // One set of controls, now beside the sheet size. Keep the previous entry
  // as a shortcut so existing users can still find frame editing.
  var frameSection = featureSections[0], frameBox = document.createElement('div');
  frameBox.id = 'panelFrameInDimensions';frameBox.className = 'panel-pattern-controls';
  frameBox.innerHTML = '<strong>Khung & gia công</strong>';
  Array.from(frameSection.children).forEach(function(child){if(child.tagName !== 'SUMMARY')frameBox.appendChild(child);});
  sizeSection.querySelector('.panel-pattern-controls').before(frameBox);
  var frameShortcut = document.createElement('button');frameShortcut.id = 'panelOpenFrameDimensions';
  frameShortcut.textContent = 'Chỉnh viền trong Kích thước tấm';frameSection.appendChild(frameShortcut);
  frameShortcut.onclick = function(){openPanelFeature(sizeSection);var input=editor.querySelector('[data-panel="'+(P.usesFrameSides(cfg)?'frame_top':'frame')+'"]');input.scrollIntoView({block:'center'});input.focus();};
  // Keep the seven feature selectors outside the scrolling parameter pane.
  // Move existing controls, rather than cloning them, so values and callbacks
  // remain shared with saved configurations and native host actions.
  var accordionSections = [sizeSection].concat(featureSections);
  var featureBar = document.createElement('div');
  featureBar.id = 'panelFeatureBar';
  var featureNav = document.createElement('div');
  featureNav.id = 'panelFeatureNav';
  featureNav.setAttribute('role', 'group');
  featureNav.setAttribute('aria-label', 'Chức năng vách');
  featureBar.appendChild(featureNav);
  layout.insertBefore(featureBar, layout.firstChild);
  var featureBody = document.createElement('div');
  featureBody.id = 'panelFeatureBody';
  editor.appendChild(featureBody);
  editor.classList.add('panel-feature-editor');
  var featureButtons = [];
  var frameSlot = document.createComment('Frame controls in sheet dimensions');
  frameBox.before(frameSlot);
  frameShortcut.hidden = true;

  function syncFeatureButtons() {
    accordionSections.forEach(function(section, index) {
      var button = featureButtons[index];
      if (!button) return;
      button.setAttribute('aria-expanded', String(section.open));
      button.classList.toggle('active', section.open);
    });
  }
  function openPanelFeature(section) {
    var changed = !section.open;
    if (section === frameSection) frameSection.appendChild(frameBox);
    else if (section === sizeSection) frameSlot.parentNode.insertBefore(frameBox, frameSlot.nextSibling);
    accordionSections.forEach(function(other) {
      if (other !== section && other.open) other.open = false;
    });
    if (!section.open) section.open = true;
    syncFeatureButtons();
    if (changed) featureBody.scrollTop = 0;
  }
  function togglePanelFeature(section) {
    if (section.open) { section.open = false; syncFeatureButtons(); }
    else openPanelFeature(section);
  }
  featureSections.forEach(function(section) { section.classList.add('panel-feature-section'); });
  accordionSections.forEach(function(section, index) {
    section.open = false;
    var summary = section.querySelector('summary');
    if (!section.id) section.id = 'panelFeatureSection' + index;
    var button = document.createElement('button');
    button.type = 'button';
    button.id = 'panelFeatureButton' + index;
    button.setAttribute('data-panel-feature', String(index));
    button.setAttribute('aria-controls', section.id);
    button.setAttribute('aria-expanded', 'false');
    button.textContent = summary.textContent;
    section.setAttribute('aria-labelledby', button.id);
    featureButtons.push(button);
    featureNav.appendChild(button);
    featureBody.appendChild(section);
    button.addEventListener('click', function() {
      togglePanelFeature(section);
      // On a narrow window the parameter pane is immediately below the bar.
      // Scroll it into view in normal document flow, never over the drawing.
      if (section.open && window.innerWidth <= 850) {
        var top = editor.getBoundingClientRect().top + window.pageYOffset - featureBar.offsetHeight - 8;
        window.scrollTo(0, Math.max(0, top));
      }
    });
    button.addEventListener('keydown', function(event) {
      var next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % featureButtons.length;
      else if (event.key === 'ArrowLeft') next = (index + featureButtons.length - 1) % featureButtons.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = featureButtons.length - 1;
      else return;
      event.preventDefault();
      featureButtons[next].focus();
    });
    summary.addEventListener('click', function(event) {
      event.preventDefault();
      togglePanelFeature(section);
    });
    section.addEventListener('toggle', function() {
      if (section.open) openPanelFeature(section);
      else syncFeatureButtons();
    });
  });
  // Keep the existing source credit after the controls, as in the old pane.
  Array.from(editor.children).forEach(function(child) {
    if (child.tagName === 'SMALL') featureBody.appendChild(child);
  });


  function borderControls(){
    var b=cfg.border;
    $('panelBorderJoinLabel').textContent=b&&photoBorder(b.id)?'Lặp liền chu kỳ':'Nối bằng nan của mẫu';
    $('panelBorderEnabled').checked=!!(b&&b.enabled);
    $('panelBorderEnabled').disabled=!b;
    $('panelBorderRemove').disabled=!b;
    $('panelBorderPhotoFitRow').hidden=!(b&&photoBorder(b.id));
    $('panelBorderPhotoFit').checked=!!(b&&b.photo_fit!==false);
    $('panelBorderPhotoFit').disabled=!b||!b.enabled;
    $('panelBorderJoinEqual').checked=!!(b&&b.join_equal);
    $('panelBorderJoinEqual').disabled=!b || !b.enabled;
    $('panelBorderName').textContent=b ? (byId[b.id] ? byId[b.id].name : b.id) : 'Chọn một mẫu trong nhóm Chạy viền bên trái.';
    borderDetails.querySelectorAll('[data-border]').forEach(function(e){e.value=b ? (e.dataset.border==='stroke_adjust' && b.stroke_adjust===undefined ? 0 : b[e.dataset.border]) : '';e.disabled=!b || !b.enabled;});
    omitControls.querySelectorAll('[data-border-omit]').forEach(function(e){e.checked=!!(b&&b['omit_'+e.dataset.borderOmit]);e.disabled=!b||!b.enabled;});
    $('panelBorderInfo').textContent='';
    innerFrameControls(true);
    edgeFrameControls(true);
    borderLayoutControls(true);
    patternStatus();
  }
  function innerFrameControls(values){
    var b=cfg.border,f=b&&b.inner_frame,enabled=!!(b&&b.enabled),meta=result&&result.inner_frame_info,
        defaultWidth=meta ? meta.default_width : b ? b.gap : 0,equal=!f||f.equal;
    $('panelCenterMode').disabled=!enabled;$('panelCenterMode').value=b&&b.center_mode||'inherit';
    $('panelInnerFrameEqual').disabled=!enabled || !!(meta&&!meta.rectangular&&equal);$('panelInnerFrameEqual').checked=equal;
    $('panelInnerFrameSides').hidden=equal;$('panelInnerFrameReset').disabled=!enabled||!f;
    innerControls.querySelectorAll('[data-inner-frame]').forEach(function(e){
      var key=e.dataset.innerFrame;e.disabled=!enabled || (key==='width' ? !equal : equal);
      if(values || !f)e.value=f ? f[key] : Math.round(defaultWidth*10000)/10000;
    });
    $('panelInnerFrameInfo').textContent=meta&&!meta.rectangular ? 'Biên cong hoặc xiên dùng một bề rộng viền trong chung.' : 'Có thể dùng chung hoặc nhập riêng Trên / Dưới / Trái / Phải.';
  }
  function innerFrameDraft(){
    if(!cfg.border.inner_frame){
      var value=Number(innerControls.querySelector('[data-inner-frame="width"]').value);
      cfg.border.inner_frame={equal:true,width:value,left:value,right:value,top:value,bottom:value};
    }
    return cfg.border.inner_frame;
  }
  innerControls.querySelectorAll('[data-inner-frame]').forEach(function(e){e.addEventListener('input',function(){
    if(cfg.border){innerFrameDraft()[e.dataset.innerFrame]=e.value==='' ? NaN : Number(e.value);schedule();}
  });});
  $('panelInnerFrameEqual').onchange=function(){if(cfg.border){innerFrameDraft().equal=this.checked;innerFrameControls(true);schedule();}};
  $('panelCenterMode').onchange=function(){if(cfg.border){cfg.border.center_mode=this.value;patternStatus();schedule();}};
  $('panelInnerFrameReset').onclick=function(){if(cfg.border){delete cfg.border.inner_frame;innerFrameControls(true);schedule();}};
  function photoBorder(id){return typeof id==='string' && id.indexOf('borders__anh_')===0;}
  function chooseBorder(id){
    if(photoBorder(id) && (!cfg.border || !photoBorder(cfg.border.id)))cfg.border=Object.assign({},cfg.border||{},{width:110,module:100,gap:4,join_equal:true});
    cfg.border=Object.assign({width:Math.min(90,Math.min(cfg.width,cfg.height)*.12),module:90,gap:4},cfg.border||{},{id:id,enabled:true,join_equal:cfg.border && typeof cfg.border.join_equal==='boolean' ? cfg.border.join_equal : true});
    openPanelFeature(borderDetails);borderControls();schedule();
  }
  borderDetails.querySelectorAll('[data-border]').forEach(function(e){e.addEventListener('input',function(){if(cfg.border){cfg.border[e.dataset.border]=e.value==='' ? NaN : Number(e.value);schedule();}});});
  $('panelBorderPhotoFit').onchange=function(){if(cfg.border){cfg.border.photo_fit=this.checked;schedule();}};
  $('panelBorderJoinEqual').onchange=function(){if(cfg.border){cfg.border.join_equal=this.checked;schedule();}};
  omitControls.querySelectorAll('[data-border-omit]').forEach(function(e){e.onchange=function(){if(cfg.border){cfg.border['omit_'+e.dataset.borderOmit]=e.checked;schedule();}};});
  $('panelBorderEnabled').onchange=function(){if(cfg.border){cfg.border.enabled=this.checked;borderControls();schedule();}};
  $('panelBorderRemove').onclick=function(){delete cfg.border;borderControls();schedule();};
  function renderSpacing(kind) {
    var list=picked(kind),state=spacingState[kind],axis=$(kind+'SpacingAxis'),input=$(kind+'SpacingGap'),
        info=$(kind+'SpacingInfo'),key=list.slice().sort(function (a,b) {return a-b;}).map(function (i) {return i+':'+cfg.items[i].uid;}).join('|');
    if (state.key!==key) {state.key=key;state.draft=false;axis.value=LofiPanelSpacing.suggestedAxis(cfg,list);}
    var enabled=list.length>=2;
    axis.disabled=input.disabled=!enabled;
    $(kind+'SpacingApply').disabled=!enabled || !result || !!dragGesture;
    if (!enabled) {input.value='';info.textContent='Chọn ít nhất 2 hình trong mục này. Khoảng cách tính giữa các mép theo hướng đã chọn.';return;}
    try {
      var current=LofiPanelSpacing.current(cfg,list,axis.value,window.LofiCNCShapes||{});
      if (!state.draft) {input.value=current.uniform && current.value>=-.001 ? String(Math.round(Math.max(0,current.value)*1000)/1000) : '';}
      input.placeholder=current.gaps.some(function (v) {return v<-.001;}) ? 'Đang chồng hình' : 'Chưa đều';
      info.textContent='Áp dụng cho '+list.length+' hình · Giữ tâm nhóm và thứ tự hiện tại · Tính từ mép hình theo hướng '+(axis.value==='y' ? 'dọc.' : 'ngang.');
    } catch (_) {if(!state.draft) input.value='';info.textContent='Chờ nạp hình xem trước xong.';$(kind+'SpacingApply').disabled=true;}
  }
  function applySpacing(kind) {
    var input=$(kind+'SpacingGap');
    try {
      if (!result || dragGesture) throw Error('Chờ hình xem trước cập nhật xong.');
      if (input.value.trim()==='' || !input.checkValidity()) throw Error('Nhập khoảng cách không âm, theo mm.');
      var next=LofiPanelSpacing.arrange(cfg,picked(kind),$(kind+'SpacingAxis').value,Number(input.value),LofiCNCShapes);
      next=P.normalize(next);
      LofiPanelSpacing.assertFits(next,picked(kind),LofiCNCShapes);
      var candidate=buildWorkingCandidate(next),built=candidate.local;
      clearTimeout(timer);revision++;cfg=next;spacingState[kind].draft=false;
      if(candidate.whole)wholeResult=candidate.whole;
      renderItems();publishResult(built);
      status('Đã áp dụng khoảng cách '+input.value+' mm. Bấm Tạo vách hoặc Cập nhật vách chọn để áp dụng trong Rhino.');
    } catch (e) {$(kind+'SpacingInfo').textContent=e.message+' Đã giữ bố trí cũ.';status(e.message,true);}
  }
  var selectionBar = document.createElement('div');
  selectionBar.className = 'panel-selection-tools';
  selectionBar.innerHTML = '<small id="panelSelectionStatus" role="status"></small><div class="row"><button id="panelSelectAll">Chọn tất cả</button><button id="panelSelectNone">Bỏ chọn</button><button id="panelDeleteSelection">Xóa đã chọn</button></div><details class="panel-preview-help"><summary>Hướng dẫn</summary><small>Cuộn chuột: phóng to/thu nhỏ tại con trỏ (10–2000%). Kéo chuột giữa, giữ Space + kéo hoặc bật Kéo khung nhìn để xem phần khác. Vừa khung đưa toàn bộ hình về giữa.<br>Bấm chọn họa tiết/vùng; Shift + bấm để chọn nhiều. Kéo họa tiết để di chuyển; Esc hủy kéo/bỏ chọn.<br>Chỉnh các vùng đã chọn ở bảng bên phải rồi bấm Áp dụng. Khi tạo vách, mỗi vùng là một nhóm độc lập, giữ đúng vị trí.</small></details>';
  $('panelPreview').after(selectionBar);
  $('panelPreview').tabIndex = 0;
  $('panelPreview').setAttribute('aria-label', 'Xem trước vách; cuộn để zoom, chuột giữa để kéo khung nhìn; Shift để chọn nhiều');
  function picked(kind) {
    return chosen.filter(function (index) {
      var item = cfg.items[index];
      return item && (!kind || (item.mode === 'cut' ? 'cut' : 'insert') === kind);
    });
  }
  function syncSelection() {
    chosen = Array.from(new Set(picked()));
    ['insert','cut'].forEach(function (kind) {
      var list = picked(kind);
      selected[kind] = list.length ? list[list.length - 1] : -1;
    });
    $('panelSelectionStatus').textContent = chosen.length ? 'Đã chọn ' + chosen.length + ' họa tiết' + (chosen.length > 1 ? ' · Chọn một hình để sửa thông số riêng.' : '') : 'Chưa chọn họa tiết';
    $('panelSelectAll').disabled = !cfg.items.length;
    $('panelSelectNone').disabled = $('panelDeleteSelection').disabled = !chosen.length;
  }
  function chooseItem(index, extend) {
    if (!cfg.items[index]) return;
    if (!extend) chosen = [index];
    else if (chosen.indexOf(index) >= 0) chosen = chosen.filter(function (i) { return i !== index; });
    else chosen.push(index);
    activeKind = cfg.items[index].mode === 'cut' ? 'cut' : 'insert';
    openPanelFeature($(activeKind + 'List').closest('details'));
    renderItems(); renderPreview();
  }
  function clearSelection() { chosen = []; renderItems(); renderPreview(); }
  function deleteSelection(kind) {
    var removed = picked(kind), retained = [];
    cfg.items = cfg.items.filter(function (item,index) {
      if (removed.indexOf(index) >= 0) return false;
      if (chosen.indexOf(index) >= 0) retained.push(index - removed.filter(function (i) { return i < index; }).length);
      return true;
    });
    chosen = retained; renderItems(); schedule();
  }
  $('panelSelectAll').onclick = function () { chosen = cfg.items.map(function (_,i) { return i; }); renderItems(); renderPreview(); };
  $('panelSelectNone').onclick = clearSelection;
  $('panelDeleteSelection').onclick = function () { deleteSelection(); };
  $('panelPreview').addEventListener('click', function (event) {
    if (ignoreDragClick) { ignoreDragClick = false; event.preventDefault(); return; }
    var target = event.target.closest('[data-panel-item]');
    if (target) chooseItem(Number(target.dataset.panelItem), event.shiftKey);
    else if (!event.shiftKey) clearSelection();
    $('panelPreview').focus({preventScroll:true});
  });
  $('panelPreview').addEventListener('keydown', function (event) {
    if (dragGesture) {
      if (event.key === 'Escape') finishDrag(false);
      event.preventDefault(); return;
    }
    if (event.key === 'Escape') { event.preventDefault(); clearSelection(); }
    else if ((event.key === 'Delete' || event.key === 'Backspace') && chosen.length) { event.preventDefault(); deleteSelection(); }
    else if (event.key === 'Enter' || event.key === ' ') {
      var target = event.target.closest('[data-panel-item]');
      if (target) { event.preventDefault(); chooseItem(Number(target.dataset.panelItem),event.shiftKey); $('panelPreview').focus({preventScroll:true}); }
    }
  });
  function itemPoint(item,source,p) {
    var a=item.angle*Math.PI/180, ca=Math.cos(a), sa=Math.sin(a),
        u=(p[0]/source.width-.5)*item.width*(item.mirror ? -1 : 1),
        v=(p[1]/source.height-.5)*item.height,
        x=item.x+u*ca-v*sa, y=item.y+u*sa+v*ca;
    if(regionDocument && regionIndex>=0){
      var region=wholeResult.region_results[regionIndex];x+=region.x;y+=region.y;
    }
    return previewPoint(x,y,cfg.thickness+(item.mode==='raised' ? item.depth : 0));
  }
  function gesturePoint(event,gesture) {
    var p=gesture.svg.createSVGPoint();p.x=event.clientX;p.y=event.clientY;
    return p.matrixTransform(gesture.inverse);
  }
  function sameDragView(gesture) {
    var current=gesture.svg.isConnected && gesture.svg.getScreenCTM();
    return current && ['a','b','c','d','e','f'].every(function (key) { return Math.abs(current[key]-gesture.matrix[key])<1e-7; });
  }
  function itemCorners(source) {
    var b=G.bounds(source.parts.flatMap(function (p) {return p.outer;}));
    return [[b.x0,b.y0],[b.x1,b.y0],[b.x1,b.y1],[b.x0,b.y1]];
  }
  function dragBounds(indices) {
    var points=[];
    indices.forEach(function (index) {
      var item=cfg.items[index],a=item.angle*Math.PI/180,
          rx=(Math.abs(item.width*Math.cos(a))+Math.abs(item.height*Math.sin(a)))/2,
          ry=(Math.abs(item.width*Math.sin(a))+Math.abs(item.height*Math.cos(a)))/2;
      if (item.inner_rim_mm!==undefined || item.outer_rim_mm!==undefined || item.inner_gap || item.rim_adjust || LofiPanelSmoothing.active(item.smoothing)) {
        var b=LofiPanelSpacing.bounds(item,LofiCNCShapes[item.id]);
        points.push([b.x0,b.y0],[b.x1,b.y1]);
      } else points.push([item.x-rx,item.y-ry],[item.x+rx,item.y+ry]);
    });
    return G.bounds(points);
  }
  function beginDrag(gesture) {
    // Defer selection until movement: plain click still selects one, but a
    // drag on a member of a multi-selection must keep the whole group.
    if (chosen.indexOf(gesture.index)<0) {
      chosen=gesture.shift ? chosen.concat([gesture.index]) : [gesture.index];
    }
    activeKind=cfg.items[gesture.index].mode==='cut' ? 'cut' : 'insert';
    openPanelFeature($(activeKind+'List').closest('details'));
    renderItems();
    gesture.indices=picked();gesture.bounds=dragBounds(gesture.indices);
    gesture.active=true;
    var ghost=document.createElementNS('http://www.w3.org/2000/svg','g');
    ghost.id='panelDragGhost';ghost.setAttribute('pointer-events','none');
    gesture.indices.forEach(function (index) {
      var item=cfg.items[index],source=P.itemDisplaySource(item,LofiCNCShapes[item.id]),point=function (p) {return itemPoint(item,source,p);};
      source.parts.forEach(function (part) {
        var path=document.createElementNS(ghost.namespaceURI,'path');
        path.setAttribute('d',[part.outer].concat(part.holes||[]).map(function (loop) {return G.path(loop.map(point));}).join(' '));
        path.setAttribute('fill-rule','evenodd');path.setAttribute('fill',item.mode==='cut' ? '#d48b55' : cfg.material);
        path.setAttribute('stroke','#1681ff');path.setAttribute('stroke-width','1');path.setAttribute('vector-effect','non-scaling-stroke');
        ghost.appendChild(path);
      });
      var box=document.createElementNS(ghost.namespaceURI,'path');
      box.setAttribute('d',G.path(itemCorners(source).map(point)));
      box.setAttribute('class','panel-item-selected');ghost.appendChild(box);
    });
    gesture.svg.appendChild(ghost);gesture.ghost=ghost;
    gesture.disabled=Array.from(view.querySelectorAll('button,input,select')).map(function (el) { var state=[el,el.disabled];el.disabled=true;return state; });
    $('panelPreview').classList.add('dragging');
    $('panelPreview').focus({preventScroll:true});
    try { $('panelPreview').setPointerCapture(gesture.pointer); } catch (_) { /* Window listeners still finish safely. */ }
    blocked(true);
  }
  function moveDrag(event) {
    var gesture=dragGesture;
    if (!gesture || gesture.pointer!==event.pointerId) return;
    if (!sameDragView(gesture)) { finishDrag(false); return; }
    if (!(event.buttons&1)) { finishDrag(false); return; }
    if (!gesture.active && Math.hypot(event.clientX-gesture.screenX,event.clientY-gesture.screenY)<4) return;
    if (!gesture.active) beginDrag(gesture);
    event.preventDefault();
    var p=gesturePoint(event,gesture),sx=p.x-gesture.start.x,sy=p.y-gesture.start.y,
        dx=gesture.threeD ? sx/1.6-sy/.76 : sx,
        dy=gesture.threeD ? -sx/1.6-sy/.76 : -sy,b=gesture.bounds;
    // Keep a group together at the rectangular sheet limits. Custom curves
    // and openings still use the production geometry validation on release.
    if (b.x1-b.x0<=cfg.width) dx=Math.max(-b.x0,Math.min(cfg.width-b.x1,dx));
    if (b.y1-b.y0<=cfg.height) dy=Math.max(-b.y0,Math.min(cfg.height-b.y1,dy));
    gesture.dx=Math.round(dx*1e6)/1e6;gesture.dy=Math.round(dy*1e6)/1e6;
    var tx=gesture.threeD ? (gesture.dx-gesture.dy)*.8 : gesture.dx,
        ty=gesture.threeD ? -(gesture.dx+gesture.dy)*.38 : -gesture.dy;
    gesture.ghost.setAttribute('transform','translate('+tx+' '+ty+')');
    $('panelSelectionStatus').textContent='Đang kéo '+gesture.indices.length+' họa tiết · ΔX '+gesture.dx.toFixed(1)+' / ΔY '+gesture.dy.toFixed(1)+' mm · Esc để hủy';
  }
  function finishDrag(commit) {
    var gesture=dragGesture;
    if (!gesture) return;
    if (commit && !sameDragView(gesture)) commit=false;
    dragGesture=null;
    if (!gesture.active) return;
    ignoreDragClick=true;
    if (gesture.ghost) gesture.ghost.remove();
    $('panelPreview').classList.remove('dragging');
    gesture.disabled.forEach(function (state) { if(state[0].isConnected) state[0].disabled=state[1]; });
    try { if($('panelPreview').hasPointerCapture(gesture.pointer)) $('panelPreview').releasePointerCapture(gesture.pointer); } catch (_) {}
    var next=null, built=null, error=null;
    if (commit && (gesture.dx || gesture.dy)) {
      try {
        next=JSON.parse(JSON.stringify(cfg));
        gesture.indices.forEach(function (index) {next.items[index].x+=gesture.dx;next.items[index].y+=gesture.dy;});
        next=P.normalize(next);
        var candidate=buildWorkingCandidate(next);built=candidate.local;
      } catch (e) { error=e; }
    }
    if (built) {
      if(candidate.whole)wholeResult=candidate.whole;
      clearTimeout(timer);revision++;cfg=next;renderItems();publishResult(built);
      status('Đã di chuyển '+gesture.indices.length+' họa tiết. Bấm Tạo vách hoặc Cập nhật vách chọn để áp dụng trong Rhino.');
    } else {
      if (!commit || error) chosen=gesture.previousSelection;
      renderItems();renderPreview();blocked(!result);
      if (error) status('Vị trí kéo chưa hợp lệ; đã giữ vị trí cũ. '+error.message,true);
      else if (!commit) status('Đã hủy kéo, giữ nguyên vị trí cũ.');
    }
  }
  $('panelPreview').addEventListener('pointerdown',function (event) {
    ignoreDragClick=false;
    if (event.button!==0 || event.isPrimary===false || !result || mode!=='panel') return;
    var target=event.target.closest('[data-panel-item]'),svg=$('panelPreview').querySelector('svg');
    if (!target || !svg || !svg.getScreenCTM()) return;
    var index=Number(target.dataset.panelItem);
    if (!cfg.items[index]) return;
    var matrix=svg.getScreenCTM();
    dragGesture={index:index,pointer:event.pointerId,shift:event.shiftKey,screenX:event.clientX,screenY:event.clientY,
      previousSelection:chosen.slice(),svg:svg,matrix:matrix,inverse:matrix.inverse(),threeD:is3d,active:false,dx:0,dy:0};
    dragGesture.start=gesturePoint(event,dragGesture);
    event.preventDefault();
  });
  window.addEventListener('pointermove',moveDrag);
  window.addEventListener('pointerup',function (event) { if(dragGesture && dragGesture.pointer===event.pointerId) finishDrag(true); });
  window.addEventListener('pointercancel',function (event) { if(dragGesture && dragGesture.pointer===event.pointerId) finishDrag(false); });
  $('panelPreview').addEventListener('lostpointercapture',function (event) { if(dragGesture && dragGesture.pointer===event.pointerId) finishDrag(false); });
  window.addEventListener('blur',function () {finishDrag(false);});
  window.addEventListener('resize',function () {finishDrag(false);});
  function selectionDrawing() {
    if(regionDocument && (regionIndex<0 || multipleRegions()))return '';
    var drawing = '';
    cfg.items.forEach(function (item,index) {
      var source = window.LofiCNCShapes && LofiCNCShapes[item.id];
      if (!source) return;
      source=P.itemDisplaySource(item,source);
      function point(p) { return itemPoint(item,source,p); }
      // Use each motif's actual outer contour, including its internal holes as
      // selectable space. The merged panel contours no longer identify items.
      var name = (byId[item.id] || {}).name || 'Họa tiết';
      var label = name.replace(/[&<>"']/g,function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; });
      // The model clips motifs to their region. Apply that same region to hit
      // areas, so invisible overhangs cannot steal a neighbouring region click.
      if(regionDocument){
        var region=wholeResult.config.custom_regions[regionIndex],sx=wholeResult.width/wholeResult.config.region_basis[0],sy=wholeResult.height/wholeResult.config.region_basis[1],z=cfg.thickness+(item.mode==='raised' ? item.depth : 0),clipId='panelRegionItemClip'+index;
        var clip=[region.outer].concat(region.holes).map(function(loop){return G.path(loop.map(function(p){return previewPoint(p[0]*sx,p[1]*sy,z);}));}).join(' ');
        drawing+='<defs><clipPath id="'+clipId+'" clipPathUnits="userSpaceOnUse"><path d="'+clip+'" clip-rule="evenodd"/></clipPath></defs><g clip-path="url(#'+clipId+')">';
      }
      drawing += '<g data-panel-item="' + index + '" class="panel-item-hit" role="button" tabindex="0" aria-label="' + label + '" aria-pressed="' + (chosen.indexOf(index)>=0) + '"><title>' + label + ' · Shift + bấm để chọn nhiều</title>';
      source.parts.forEach(function (part) { drawing += '<path d="' + G.path(part.outer.map(point)) + '"/>'; });
      drawing += '</g>';
      if (chosen.indexOf(index)>=0) {
        var corners = itemCorners(source).map(point);
        drawing += '<path class="panel-item-selected" data-selection-box="' + index + '" d="' + G.path(corners) + '"/>';
      }
      if(regionDocument)drawing+='</g>';
    });
    return drawing;
  }
  function send(action) {
    var payload = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    if (window.sketchup && typeof sketchup.cnc_action === 'function') sketchup.cnc_action(JSON.stringify({
      action: action,
      payload: payload
    }));else status('Mở Vách CNC trong Rhino để dùng chức năng này.', true);
  }
  function useMode(value) {
    cancelSmoothing();
    finishDrag(false);
    if(value!=='panel')viewport.leave();
    mode = value;
    oldDesign.hidden = oldEditor.hidden = value === 'panel';
    design.hidden = editor.hidden = value !== 'panel';
    $('panelMode').classList.toggle('active', value === 'panel');
    $('moduleMode').classList.toggle('active', value === 'module');
    if (value === 'panel') schedule();
    regionControls();
  }
  function controls() {
    unlockRegions();
    smoothControls();
    borderControls();
    editor.querySelectorAll('[data-panel]').forEach(function (e) {
      var v = e.dataset.panel === 'custom_frame_adjust' ? cfg.custom_frame_adjust || 0 : cfg[e.dataset.panel];
      if (e.dataset.panel === 'frame_equal') v = !P.usesFrameSides(cfg);
      if (/^frame_(left|right|top|bottom)$/.test(e.dataset.panel) && v === undefined) v = cfg.frame;
      if (e.type === 'checkbox') e.checked = !!v;else e.value = v;
    });
    syncPatternGap();
    $('panelSolid').checked = cfg.mode === 'solid';
    $('panelHollow').checked = cfg.mode === 'hollow';
    $('panelFrameless').checked = cfg.mode === 'frameless';
    $('panelMargins').hidden = cfg.equal_margins;
    customStatus();
    renderItems();
    regionControls();
  }
  function syncPatternGap() {
    var field = editor.querySelector('[data-panel="bar_adjust"]');
    $('panelPatternGap').value = field.value !== '' && field.checkValidity() ? -Number(field.value) : '';
  }
  function patternStatus() {
    var enabled = cfg.mode!=='frameless' && (cfg.border && cfg.border.enabled && cfg.border.center_mode && cfg.border.center_mode!=='inherit' ? cfg.border.center_mode==='pattern' : cfg.mode === 'pattern');
    ['bar_adjust','module'].forEach(function (key) {
      editor.querySelector('[data-panel="'+key+'"]').disabled = !enabled;
    });
    // Keep these controls unchanged for every other library pattern.
    var photo33=cfg.id==='patterns__vach_anh_033' && cfg.outline==='rectangle';
    if(photo33 || (cfg.id==='patterns__capnhat_b-063' && cfg.b063_single_panel===true))editor.querySelector('[data-panel="module"]').disabled=true;
    ['angle','offset_x','offset_y'].forEach(function(key){
      var input=editor.querySelector('[data-panel="'+key+'"]');
      if(photo33 && !input.dataset.photo33Disabled){input.dataset.photo33Disabled=input.disabled?'yes':'no';input.disabled=true;}
      else if(!photo33 && input.dataset.photo33Disabled){input.disabled=input.dataset.photo33Disabled==='yes';delete input.dataset.photo33Disabled;}
    });
    $('panelPatternGap').disabled = !enabled;
    $('panelPatternReset').disabled = !enabled;
    var value = Math.round(cfg.bar_adjust*1000)/1000;
    $('panelPatternInfo').textContent = !enabled ? 'Chọn chế độ hoa văn để chỉnh nét và khe.' :
      !value ? 'Đang giữ nét / khe gốc. Chỉ áp dụng hoa văn nền.' :
      (value > 0 ? 'Nét rộng thêm '+value+' mm; khe hẹp đi '+value+' mm.' :
        'Khe rộng thêm '+(-value)+' mm; nét mảnh đi '+(-value)+' mm.') + ' Khung và họa tiết chèn giữ nguyên.';
    if(photo33 && enabled)$('panelPatternInfo').textContent += ' Vách 33: 3 thanh ngang tự chia 4 khoảng đều theo lòng khung; đổi Rộng/Cao tấm hoặc Rộng khung để chỉnh.';
  }
  function customFrameStatus(drawn,hasInner) {
    var custom=cfg.outline==='custom',solid=cfg.mode==='solid',adjust=cfg.custom_frame_adjust || 0;
    $('panelCustomFrameControls').hidden=!custom;
    $('panelDrawnFrameControls').hidden=!hasInner;
    $('panelOutlineFrameControls').hidden=hasInner;
    editor.querySelector('[data-panel="custom_frame_adjust"]').disabled=!drawn || solid;
    $('panelCustomFrameReset').disabled=!drawn || solid;
    var backing=editor.querySelector('[data-panel="frame"]');
    $('panelCustomFrameWidth').value=backing.value;
    $('panelCustomFrameWidth').disabled=!custom || hasInner || solid || P.usesFrameSides(cfg);
    $('panelCustomFrameInfo').textContent=P.usesFrameSides(cfg) ? 'Đang chỉnh riêng Trên / Dưới / Trái / Phải tại Kích thước tấm.' : solid ? 'Tấm đặc không có vùng khung riêng. Bỏ chọn TẤM ĐẶC để chỉnh khung.' :
      hasInner && !drawn ? 'Bật Lồng hoa văn vào ô khung đã vẽ để chỉnh dày/mỏng khung.' :
      drawn ? (!adjust ? 'Đang giữ đúng hai đường viền đã đọc.' :
        (adjust>0 ? 'Khung dày thêm '+adjust+' mm vào trong.' : 'Khung mỏng đi '+(-adjust)+' mm.')+' Hoa văn tự cập nhật theo lòng khung mới.') :
      'Chiều dày khối vẫn chỉnh tại Dày tấm; ô này chỉnh bề rộng khung nhìn từ mặt trước.';
    var capturedWidths=P.capturedFrameInsets(cfg);
    if(capturedWidths && !solid){
      $('panelCustomFrameInfo').textContent='Giữ bề rộng khung khi đổi ngang/cao: '+
        ['left','right','top','bottom'].map(function(side){return ({left:'Trái',right:'Phải',top:'Trên',bottom:'Dưới'})[side]+' '+(Math.round((capturedWidths[side]+adjust)*100)/100)+' mm';}).join(' · ')+
        '. Hoa văn cập nhật theo lòng khung mới.';
    }
    if(custom && !hasInner && !solid && P.supportsFrameSides(cfg)){
      var sides=P.frameInsets(cfg),innerW=cfg.width-sides.left-sides.right,innerH=cfg.height-sides.top-sides.bottom;
      $('panelCustomFrameInfo').textContent+=' Lòng khung còn '+(Math.round(innerW*100)/100)+' × '+(Math.round(innerH*100)/100)+' mm.'+
        (Math.min(innerW/cfg.width,innerH/cfg.height)<.25?' Khung đang chiếm phần lớn biên dạng. Giảm bề rộng hoặc chọn đủ hai viền của khung gốc rồi đọc lại.':'');
    }
    // Keep host-specific measurements; hide the explanatory-only status.
    $('panelCustomFrameInfo').hidden = !(capturedWidths && !solid) && !(custom && !hasInner && !solid && P.supportsFrameSides(cfg));
  }
  function frameSidesStatus(drawn) {
    var rectangular = P.supportsFrameSides(cfg), separate = P.usesFrameSides(cfg);
    editor.querySelector('[data-panel="frame_equal"]').checked = !separate;
    $('panelFrameSides').hidden = !separate;
    editor.querySelector('[data-panel="frame_equal"]').disabled = !rectangular;
    editor.querySelector('[data-panel="frame"]').disabled = drawn || separate;
    ['left','right','top','bottom'].forEach(function (side) {
      editor.querySelector('[data-panel="frame_'+side+'"]').disabled = !separate;
    });
    $('panelFrameSidesInfo').textContent = drawn ? 'Khung đã có viền trong: chỉnh bằng Bù dày/mỏng khung ở Biên dạng tùy chỉnh.' : !rectangular ? 'Biên này có cạnh cong hoặc xiên. Rộng khung áp dụng đều theo đường viền.' :
      separate ? 'Trên/dưới/trái/phải nhìn từ mặt trước vách ở chế độ 2D. Khoảng lùi hoa văn được chỉnh riêng bên dưới.' :
      (cfg.outline === 'custom' ? 'Đã nhận diện biên chữ nhật. ' : '') + 'Bỏ chọn dùng chung để nhập bề rộng từng cạnh.';
  }
  function customDimensionStatus() {
    var active = cfg.outline === 'custom';
    ['width','height'].forEach(function (key) {
      var input = $(key === 'width' ? 'panelCustomWidth' : 'panelCustomHeight');
      var backing = editor.querySelector('[data-panel="' + key + '"]');
      input.disabled = !active || regionIndex >= 0;
      input.value = backing.value;
    });
    editor.querySelector('[data-panel="custom_lock"]').disabled = !active || regionIndex >= 0;
    $('panelCustomSizeInfo').textContent = !active ? 'Đọc biên dạng để chỉnh ngang và cao.' : cfg.custom_lock ?
      'Đang giữ tỷ lệ: đổi một chiều sẽ đổi chiều còn lại. Bỏ chọn để chỉnh riêng.' :
      'Chỉnh riêng từng chiều: đổi ngang giữ nguyên cao; đổi cao giữ nguyên ngang.';
    if(active) $('panelCustomSizeInfo').textContent+=P.capturedFrameInsets(cfg) ?
      ' Khung chữ nhật giữ bề rộng từng cạnh theo mm.' :
      (cfg.custom_holes || []).length ? ' Các đường viền đã đọc co giãn theo chiều đã đổi.' : ' Bề rộng khung giữ theo thông số mm đã nhập.';
  }
  function customStatus() {
    customDimensionStatus();
    patternStatus();
    $('panelCustomEnabled').checked = cfg.outline === 'custom';
    var hasInner = cfg.outline === 'custom' && (cfg.custom_holes || []).length > 0;
    var drawn = P.usesDrawnFrame(cfg);
    editor.querySelector('[data-panel="custom_fill_inner"]').disabled = !hasInner;
    ['frame','margin','equal_margins','left','right','top','bottom'].forEach(function (key) {
      editor.querySelector('[data-panel="' + key + '"]').disabled = drawn;
    });
    var follows = cfg.weld && cfg.follow_frame === true;
    ['margin','equal_margins','left','right','top','bottom'].forEach(function(key){editor.querySelector('[data-panel="'+key+'"]').disabled=drawn || follows;});
    editor.querySelector('[data-panel="follow_frame"]').checked=cfg.follow_frame===true;
    $('panelFrameFollowInfo').textContent = follows ? 'Hoa văn tự bám mép trong khi đổi rộng khung. Giữ cỡ hoa văn. Tắt bám viền để chỉnh khoảng lùi riêng.' : 'Bật Hàn hoa văn với khung và Hoa văn bám theo viền để nối theo lòng khung khi đổi bề rộng.';
    frameSidesStatus(drawn);
    customFrameStatus(drawn,hasInner);
    $('panelDrawnFrameNote').textContent = drawn ? 'Hoa văn lồng trong ô khung. Dùng bảng Độ dày/mỏng khung bên dưới để chỉnh; Rộng khung/Khoảng lùi ở Kích thước tấm không áp dụng.' :
      hasInner ? 'Các viền trong đang là lỗ trống. Bật tùy chọn trên nếu đây là ô khung cần lồng hoa văn.' : 'Chỉ đọc được viền ngoài. Chọn cả viền ngoài và viền trong trong Rhino (giữ Shift để chọn thêm), rồi bấm Đọc hình vẽ để giữ đúng khung gốc.';
    $('panelCustomStatus').textContent = cfg.custom_outer ?
      (cfg.outline === 'custom' ? 'Đang dùng: ' : 'Đã lưu biên dạng: ') +
      (cfg.custom_source || 'Biên dạng đã đọc') + ' · ' + Math.round(cfg.width * 100) / 100 + ' × ' + Math.round(cfg.height * 100) / 100 + ' × ' + cfg.thickness + ' mm' +
      ((cfg.custom_holes || []).length ? ' · ' + cfg.custom_holes.length + (drawn ? ' ô khung · Lồng hoa văn' : ' lỗ trống') : '') : 'Chưa đọc biên dạng. Chọn hình trong Rhino rồi bấm Đọc hình vẽ đang chọn.';
  }
  function asset(id) {
    if (!byId[id]) return Promise.reject(Error('Mã mẫu không có trong thư viện 295.'));
    var even=window.LofiUniformInsertIndex[id],source=window.LofiCNCShapes && LofiCNCShapes[id];
    if(source && (!even || source.even))return Promise.resolve(source);
    if (promises[id]) return promises[id];
    function load(folder){
      return new Promise(function(resolve,reject){
        var script=document.createElement('script');
        script.src=folder+'/'+id+'.js';
        script.onload=resolve;
        script.onerror=function(){script.remove();reject(Error('Không nạp được dữ liệu mẫu '+byId[id].name));};
        document.head.appendChild(script);
      });
    }
    promises[id]=(source?Promise.resolve():load('source_shapes')).then(function(){
      return even && !LofiCNCShapes[id].even?load('uniform'):undefined;
    }).then(function(){return LofiCNCShapes[id];}).catch(function(error){delete promises[id];throw error;});
    return promises[id];
  }
  function blocked(on) {
    on=on || !!rimDraft || !!edgeDraft || !!smoothPending;
    refreshCenterControls();
    ['panelCreate', 'panelUpdate', 'panelSvg', 'panelDxf', 'panelExportConfig', 'panelCreateItems'].forEach(function (id) {
      return $(id).disabled = on || !!pendingCreation || (batchEditor && (batchEditor.dirty()||batchEditor.busy())) || (id==='panelCreateItems'&&multipleRegions());
    });
    exportControls(on);
    if(on) ['insert','cut'].forEach(function (kind) {$(kind+'SpacingApply').disabled=true;});
  }
  function schedule() {
    cancelEdgeDraft();
    cancelSmoothing();
    if(batchEditor.busy()){regionBatchEpoch++;batchEditor.setBusy(false);}
    commitRegion();wholeResult=null;
    finishDrag(false);
    clearTimeout(timer);
    revision++;
    result = null;
    window.LofiPanelResult = null;
    blocked(true);
    if (mode === 'panel') timer = setTimeout(update, 180);
  }
  async function update() {
    if(mode!=='panel' || view.hidden)return;
    var stamp=revision,task=null;
    try{
      editor.querySelectorAll('input[type=number][data-panel],input[type=number][data-layer],#insertGapMm').forEach(function(e){
        if(!e.disabled && (e.value==='' || !e.checkValidity()))throw Error('Thông số số học đang trống hoặc ngoài giới hạn.');
      });
      cfg=P.normalize(cfg);
      await Promise.all(LofiPanelRegions.assets(workConfig()).map(asset));
      if(stamp!==revision || mode!=='panel' || view.hidden)return;
      var candidate=workConfig(),built;
      if(hasSmoothing(candidate)||hasPattern(candidate)){
        task={stamp:stamp,kind:'preview'};smoothPending=task;smoothCancel.hidden=false;blocked(true);
        showCapturedOutline(cfg);
        $('panelValidation').textContent='Đang tính hoa văn ở nền. Có thể đổi thông số hoặc bấm Hủy tính.';
        status('Đang tính hoa văn… Có thể bấm Hủy tính.');
        var workerAssets=smoothingAssets(candidate);
        built=await smoothingJobs.run({kind:'panel',config:candidate,assets:workerAssets,measure:{region:regionIndex,index:exportIndex()},mesh:false},function(text){if(smoothPending===task)status(text);});
        if(smoothPending!==task)return;
        acceptSmoothing(built,workerAssets);
        smoothPending=null;smoothCancel.hidden=true;
      }else built=P.build(candidate,LofiCNCShapes,false);
      if(stamp!==revision || mode!=='panel' || view.hidden)return;
      if(regionDocument){
        regionDocument=built.config;wholeResult=built;
        cfg=regionIndex<0?regionDocument:LofiPanelRegions.clone(regionDocument.custom_regions[regionIndex].config);
        publishResult(regionIndex<0?wholeResult:wholeResult.region_results[regionIndex].result);
      }else publishResult(built);
    }catch(e){
      if(stamp!==revision || (task && smoothPending!==task))return;
      smoothPending=null;smoothCancel.hidden=true;result=null;window.LofiPanelResult=null;blocked(true);
      $('panelValidation').textContent=e.message;$('panelValidation').classList.add('warning');
      if(!showCapturedOutline(cfg))$('panelPreview').textContent='Chỉnh lại thông số để xem vách.';
      else $('panelMetrics').textContent='Đã đọc khung: '+LofiPanelDimensions.size(cfg.width,cfg.height)+' (ngang × cao). Hoa văn chưa hoàn tất.';
      status(e.message,true);
    }
  }
  function publishResult(built) {
    result=built;
    refreshEdgeFields();
    refreshRimFields();
    var photo=cfg.border&&photoBorder(cfg.border.id);
    var borderInfo=result.border_info, equalBorder=!photo && borderInfo && borderInfo.placements.length && borderInfo.placements.every(function(p){return p.uniform_size;});
    var joinedBorder=!photo && borderInfo && borderInfo.placements.length && borderInfo.placements.every(function(p){return p.join_equal;});
    $('panelBorderModuleLabel').textContent=joinedBorder ? 'Cỡ mẫu tham chiếu (mm)' : equalBorder ? 'Cỡ mẫu tối đa (mm)' : 'Cỡ mẫu dọc viền (mm)';
    $('panelBorderGapLabel').textContent=joinedBorder ? 'Chừa mép trong tối thiểu (mm)' : equalBorder ? 'Khe tối thiểu (mm)' : 'Khe giữa mẫu (mm)';
    $('panelBorderHelp').textContent=joinedBorder ? 'Nan trong mẫu và mối nối giữa các mẫu cùng bề rộng, kể cả nối vào góc. Khoảng rỗng tự cân theo chiều dài từng cạnh. Bỏ chọn Nối bằng nan để giữ toàn bộ mẫu cùng kích thước như bản trước.' : equalBorder ? 'Mẫu ở cạnh và góc giữ cùng kích thước, đúng tỷ lệ gốc. Cỡ mẫu được giới hạn bởi bề rộng dải. Phần dư chia đều vào khe; không kéo giãn hoa văn.' : 'Lặp đều theo viền trong thực của tấm hoặc các ô khung đã đọc. Góc vuông giữ một mẫu nguyên, không kéo méo. Các mẫu còn lại chia đều trên từng cạnh; dải cong chạy liên tục. Đổi kích thước tấm sẽ tự bố trí lại.';
    if(borderInfo && cfg.border.join_equal && !joinedBorder)$('panelBorderHelp').textContent+=' Nối bằng nan áp dụng cho biên gồm các cạnh thẳng vuông góc; biên cong hoặc góc khác giữ cách chạy viền thường.';
    innerFrameControls(false);
    edgeFrameControls(false);
    borderLayoutControls(false);
    if(borderInfo)$('panelBorderHelp').textContent+=' Hoa văn bám đúng mép trong khung. Phần chừa dải nằm về phía hoa văn nền, không cộng vào rộng khung.';
    $('panelBorderInfo').textContent=borderInfo ? borderInfo.count+' mẫu · '+(joinedBorder ? 'nan và mối nối '+borderInfo.placements[0].stroke.toFixed(2)+' mm' : equalBorder ? 'mỗi mẫu '+borderInfo.placements[0].width.toFixed(2)+' × '+borderInfo.placements[0].height.toFixed(2)+' mm' : 'lặp đều theo viền trong') : '';
    if(photo){
      $('panelBorderModuleLabel').textContent='Cao mẫu tham chiếu (mm)';
      $('panelBorderGapLabel').textContent=cfg.border.join_equal?'Chừa mép trong (mm)':'Khoảng ngắt chu kỳ (mm)';
      $('panelBorderHelp').textContent='Giữ tỷ lệ hoa văn theo ảnh. Lặp liền chu kỳ để nối sát các mẫu; bỏ chọn để có khoảng ngắt. Đổi khổ sẽ bố trí lại hoa văn; góc ghép vát theo hai dải. Viền bao và bù nét chỉnh riêng theo mm.';
      $('panelBorderInfo').textContent=borderInfo?borderInfo.count+' mẫu · Giữ tỷ lệ ảnh gốc':'';
      if(cfg.border.photo_fit!==false){
        $('panelBorderModuleLabel').textContent='Cao mẫu tối đa (mm)';
        $('panelBorderHelp').textContent='Khung chữ nhật: giữ nguyên chu kỳ, hai cạnh đối diện cùng nhịp và cùng hướng. Tự thu đồng tỷ lệ khi cần, phần dư chia đều hai đầu; góc nối trơn riêng, không cắt hoa văn. Bỏ chọn để dùng cách chạy cắt theo biên cong/xiên.';
        var fit=borderInfo&&borderInfo.fit_info;
        $('panelBorderInfo').textContent=fit?fit.map(function(f){return 'Cao thực '+LofiPanelDimensions.number(f.actual_height)+' mm · '+f.horizontal_count+' chu kỳ ngang / '+f.vertical_count+' chu kỳ dọc';}).join(' · '):'';
      }
    }
    renderPreview();
    var measured=regionDocument?wholeResult:result;
    var ownBounds=independentBorderBounds(measured);
    $('panelMetrics').textContent=(ownBounds?'Diềm thực: ':regionDocument?'Toàn bộ bản vẽ: ':'Tấm: ')+LofiPanelDimensions.size(ownBounds?ownBounds.x1-ownBounds.x0:measured.width,ownBounds?ownBounds.y1-ownBounds.y0:measured.height)+' (ngang × cao) · Dày '+LofiPanelDimensions.number(measured.thickness)+' mm · '+measured.holes+' lỗ · '+measured.base_count+' phần nền';
    $('panelValidation').textContent=(result.rim_notes||[]).concat(result.warnings).join(' ') || 'Đường biên hợp lệ · Xem trước và dựng hình dùng cùng dữ liệu.';
    $('panelValidation').classList.toggle('warning',!!result.warnings.length);
    status(result.warnings.join(' ') || 'Vách sẵn sàng. Chỉnh thông số để cập nhật hình xem trước.');
    blocked(false);window.LofiPanelResult=result;
    ['insert','cut'].forEach(renderSpacing);
    regionControls();
  }
  function independentBorderBounds(built) {
    var c=built.config,b=c.border;
    return c.mode==='frameless' && b && b.enabled && b.layout && b.layout.enabled && built.border_info && built.border_info.visible_bounds;
  }
  function renderPreview() {
    if (!result) return;
    var displayed=regionDocument ? wholeResult : result;
    if(!displayed)return;
    var w = displayed.width,
      h = displayed.height,
      pad = Math.max(w, h) * .08;
    var drawing = '',
      box = [-pad, -pad, w + 2 * pad, h + 2 * pad];
    if (!is3d) {
      if(displayed.config.mode==='frameless'||(displayed.config.custom_regions||[]).some(function(r){return r.config.mode==='frameless';})){
        var rimPoints=[];
        displayed.contours.forEach(function(c){c.loops.forEach(function(l){l.forEach(function(p){rimPoints.push([p[0],h-p[1]]);});});});
        if(rimPoints.length){var rb=G.bounds(rimPoints),rx0=Math.min(0,rb.x0),ry0=Math.min(0,rb.y0),rx1=Math.max(w,rb.x1),ry1=Math.max(h,rb.y1);pad=Math.max(rx1-rx0,ry1-ry0)*.08;box=[rx0-pad,ry0-pad,rx1-rx0+2*pad,ry1-ry0+2*pad];}
      }
      drawing = '<g transform="translate(0 ' + h + ') scale(1 -1)">';
      var _iterator = _createForOfIteratorHelper(displayed.contours),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var s = _step.value;
          drawing += '<path d="' + s.loops.map(G.path).join(' ') + '" fill="' + (s.z ? '#e5bd7f' : cfg.material) + '" fill-rule="evenodd" stroke="#704e32" stroke-width="1" vector-effect="non-scaling-stroke"/>';
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      var ownBounds=independentBorderBounds(displayed),labelX=ownBounds?(ownBounds.x0+ownBounds.x1)/2:w/2,labelY=ownBounds?h-ownBounds.y0+pad*.7:h+pad*.7;
      drawing += '</g><text data-panel-overall-size="true" x="' + labelX + '" y="' + labelY + '" text-anchor="middle" font-size="' + Math.max(w, h) / 48 + '">' + (ownBounds?'Diềm: '+LofiPanelDimensions.size(ownBounds.x1-ownBounds.x0,ownBounds.y1-ownBounds.y0):LofiPanelDimensions.size(w,h)) + '</text>';
    } else {
      var proj = function proj(_ref5, z) {
          var _ref6 = _slicedToArray(_ref5, 2),
            x = _ref6[0],
            y = _ref6[1];
          return [(x - y) * .8, -(x + y) * .38 - z];
        },
        all = [];
      var _iterator2 = _createForOfIteratorHelper(displayed.contours),
        _step2;
      try {
        var _loop = function _loop() {
          var s = _step2.value;
          var _iterator3 = _createForOfIteratorHelper(s.loops),
            _step3;
          try {
            for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
              var loop = _step3.value;
              for (var i = 0; i < loop.length; i++) {
                var p = loop[i],
                  q = loop[(i + 1) % loop.length],
                  points = [proj(p, s.z), proj(q, s.z), proj(q, s.z + s.depth), proj(p, s.z + s.depth)];
                all.push.apply(all, points);
                drawing += '<path d="' + G.path(points) + '" fill="#785331" stroke="#785331" stroke-width=".2"/>';
              }
            }
          } catch (err) {
            _iterator3.e(err);
          } finally {
            _iterator3.f();
          }
          drawing += '<path d="' + s.loops.map(function (loop) {
            return G.path(loop.map(function (p) {
              return proj(p, s.z + s.depth);
            }));
          }).join(' ') + '" fill="' + (s.z ? '#e5bd7f' : cfg.material) + '" fill-rule="evenodd"/>';
        };
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          _loop();
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      if(regionDocument)displayed.config.custom_regions.forEach(function(r){
        r.outer.forEach(function(p){all.push(proj([p[0]*w/displayed.config.region_basis[0],p[1]*h/displayed.config.region_basis[1]],displayed.thickness));});
      });
      var b = G.bounds(all);
      box = [b.x0 - pad, b.y0 - pad, b.x1 - b.x0 + 2 * pad, b.y1 - b.y0 + 2 * pad];
    }
    $('panelPreview').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + box.join(' ') + '"><g class="panel-sheet-drawing">' + drawing + '</g><g class="panel-region-overlay">'+regionDrawing(box)+'</g><g class="panel-selection-overlay">' + selectionDrawing() + '</g>'+rimDrawing(box)+'</svg>';
    viewport.attach($('panelPreview').querySelector('svg'),box);
    $('panel2d').classList.toggle('active', !is3d);
    $('panel3d').classList.toggle('active', is3d);
    dimensionInfo.update(displayed.config,regionSelection);
    $('panelTitle').textContent = (regionDocument ? (multipleRegions() ? 'Chỉnh chung '+regionSelection.length+' vùng' : regionIndex<0 ? 'Toàn bộ bản vẽ' : 'Đang chỉnh Vùng '+(regionIndex+1))+' · '+regionDocument.custom_regions.length+' vùng' : (byId[cfg.id] || {}).name) + ' · ' + (is3d ? '3D' : '2D');
  }
  function indices(kind) {
    return cfg.items.map(function (item, index) {
      return {
        item: item,
        index: index
      };
    }).filter(function (_ref7) {
      var item = _ref7.item;
      return item.mode === 'cut' === (kind === 'cut');
    });
  }
  function renderItems() {
    syncSelection();
    var _loop2 = function _loop2() {
      var kind = _arr[_i];
      var available = indices(kind);
      var list = $(kind + 'List');
      list.textContent = '';
      var _iterator4 = _createForOfIteratorHelper(available),
        _step4;
      try {
        var _loop3 = function _loop3() {
          var _step4$value = _step4.value,
            item = _step4$value.item,
            index = _step4$value.index;
          var b = document.createElement('button');
          b.textContent = index + 1 + '. ' + byId[item.id].name;
          b.classList.toggle('active', chosen.indexOf(index) >= 0);
          b.setAttribute('aria-pressed',chosen.indexOf(index) >= 0);
          b.onclick = function (event) { chooseItem(index,event.shiftKey); };
          list.appendChild(b);
        };
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          _loop3();
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
      var active = cfg.items[selected[kind]];
      if (kind === 'insert'){
        refreshEdgeFields();
        $('insertEven').disabled=!active || chosen.length!==1 || !window.LofiUniformInsertIndex[active.id];
        $('insertEven').checked=!!(active && active.even_insert);
        $('insertPlace').disabled = !active || chosen.length !== 1;
        $('insertGapOn').disabled=!active || chosen.length!==1;
        $('insertGapOn').checked=!!(active && active.inner_gap);
        $('insertGapMm').disabled=$('insertGapOn').disabled || !$('insertGapOn').checked;
        $('insertGapScope').disabled=$('insertGapOn').disabled;
        $('insertGapScope').value=active && active.inner_gap?(active.inner_gap_scope || 'all'):'rim';
        $('insertBridgeMm').value=active && active.inner_gap_bridge || 6.1;
        bridgeControls();
        $('insertGapMm').value=active && active.inner_gap || 6.1;
        refreshRimFields();
        exportControls();
      }
      editor.querySelectorAll('[data-layer="' + kind + '"]').forEach(function (e) {
        e.disabled = !active || chosen.length !== 1 || (e.dataset.param === 'depth' && active.mode !== 'raised');
        if (e.type === 'checkbox') e.checked = active ? !!active[e.dataset.param] : false;else e.value = active ? (e.dataset.param === 'rim_adjust' ? active.rim_adjust || 0 : active[e.dataset.param]) : '';
      });
      for (var _i2 = 0, _arr2 = ['Rotate', 'Duplicate', 'Vertical', 'Horizontal', 'Center', 'Delete']; _i2 < _arr2.length; _i2++) {
        var suffix = _arr2[_i2];
        $(kind + suffix).disabled = !active;
      }
      renderSpacing(kind);
    };
    for (var _i = 0, _arr = ['insert', 'cut']; _i < _arr.length; _i++) {
      _loop2();
    }
    refreshCenterControls();
  }
  function add(id, cut) {
    if (cfg.items.length >= 24) {
      status('Tối đa 24 họa tiết chèn/đục.', true);
      return;
    }
    var item = byId[id],
      size = Math.min(300, cfg.width * .5, cfg.height * .5),
      kind = cut ? 'cut' : 'insert';
    cfg.items.push({
      id: id,
      uid: String(Date.now()) + '-' + cfg.items.length,
      mode: cut ? 'cut' : 'inlay',
      x: cfg.width / 2,
      y: cfg.height / 2,
      width: size,
      height: !cut && window.LofiUniformInsertIndex[id]==='round' ? size : size * item.height / item.width,
      angle: 0,
      mirror: false,
      lock: true,
      depth: 5
    });
    if(!cut && window.LofiUniformInsertIndex[id])cfg.items[cfg.items.length-1].even_insert=true;
    chosen = [cfg.items.length - 1];
    activeKind = kind;
    openPanelFeature($(kind + 'List').closest('details'));
    renderItems();
    schedule();
  }
  function keepCenteredItems(next,oldWidth,oldHeight){
    next.items.forEach(function(item){
      if(oldWidth>0&&next.width>0&&Math.abs(item.x-oldWidth/2)<.00001)item.x=next.width/2;
      if(oldHeight>0&&next.height>0&&Math.abs(item.y-oldHeight/2)<.00001)item.y=next.height/2;
    });
  }
  var _loop4 = function _loop4() {
    var kind = _arr3[_i3];
    var _iterator5 = _createForOfIteratorHelper(entries.filter(function (e) {
        return e.group === (kind === 'cut' ? 'cutout_patterns' : 'inserts');
      })),
      _step5;
    try {
      for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
        var entry = _step5.value;
        var option = document.createElement('option');
        option.value = entry.id;
        option.textContent = entry.name;
        $(kind + 'Choice').appendChild(option);
      }
    } catch (err) {
      _iterator5.e(err);
    } finally {
      _iterator5.f();
    }
    $(kind + 'Add').onclick = function () {
      return add($(kind + 'Choice').value, kind === 'cut');
    };
    editor.querySelectorAll('[data-layer="' + kind + '"]').forEach(function (e) {
      return e.addEventListener('input', function () {
        var item = cfg.items[selected[kind]];
        if (!item) return;
        activeKind = kind;
        if (e.getAttribute('type') === 'number' && (e.value === '' || !e.checkValidity())) {
          schedule();
          return;
        }
        var k = e.dataset.param,
          value = e.type === 'checkbox' ? e.checked : e.getAttribute('type') === 'number' ? Number(e.value) : e.value;
        if (item.lock && k === 'width') item.height = value * item.height / item.width;
        if (item.lock && k === 'height') item.width = value * item.width / item.height;
        item[k] = value;
        renderItems();
        schedule();
      });
    });
    $(kind + 'Rotate').onclick = function () {
      picked(kind).forEach(function (index) { var i=cfg.items[index]; i.angle = (i.angle + 90) % 360; });
      renderItems();
      schedule();
    };
    $(kind + 'Center').onclick = function () {
      if(kind==='insert'){centerInsert('both');return;}
      var list = picked(kind).map(function (index) { return cfg.items[index]; });
      if (!list.length) return;
      var b = G.bounds(list.map(function (i) { return [i.x,i.y]; })), dx = cfg.width/2-(b.x0+b.x1)/2, dy = cfg.height/2-(b.y0+b.y1)/2;
      list.forEach(function (i) { i.x+=dx; i.y+=dy; });
      renderItems();
      schedule();
    };
    $(kind + 'Delete').onclick = function () {
      deleteSelection(kind);
    };
    $(kind + 'Duplicate').onclick = function () {
      var list = picked(kind), copies = [];
      if (cfg.items.length + list.length > 24) { status('Tối đa 24 họa tiết chèn/đục; không đủ chỗ để nhân bản nhóm chọn.',true); return; }
      list.forEach(function (index) {
        var old = cfg.items[index];
        copies.push(cfg.items.length);
        cfg.items.push(Object.assign({}, old, {uid:String(Date.now())+'-'+cfg.items.length,x:old.x+20,y:old.y+20}));
      });
      chosen = copies;
      activeKind = kind;
      renderItems();
      schedule();
    };
    var _loop5 = function _loop5() {
      var axis = _arr4[_i4];
      $(kind + axis).onclick = function () {
        $(kind+'SpacingAxis').value=axis==='Horizontal' ? 'x' : 'y';spacingState[kind].draft=false;
        var list = picked(kind).map(function (index) { return {item:cfg.items[index]}; });
        var frameInsets = P.frameInsets(cfg);
        list.forEach(function (_ref8, i) {
          var item = _ref8.item;
          item.x = axis === 'Horizontal' ? frameInsets.left + (cfg.width - frameInsets.left - frameInsets.right) * (i + 1) / (list.length + 1) : (frameInsets.left + cfg.width - frameInsets.right) / 2;
          item.y = axis === 'Vertical' ? frameInsets.bottom + (cfg.height - frameInsets.top - frameInsets.bottom) * (i + 1) / (list.length + 1) : (frameInsets.bottom + cfg.height - frameInsets.top) / 2;
        });
        renderItems();
        schedule();
      };
    };
    for (var _i4 = 0, _arr4 = ['Vertical', 'Horizontal']; _i4 < _arr4.length; _i4++) {
      _loop5();
    }
  };
  for (var _i3 = 0, _arr3 = ['insert', 'cut']; _i3 < _arr3.length; _i3++) {
    _loop4();
  }
  editor.querySelectorAll('[data-panel]').forEach(function (e) {
    return e.addEventListener('input', function () {
      var key = e.dataset.panel, previous = cfg[key],oldWidth=cfg.width,oldHeight=cfg.height;
      cfg[key] = e.type === 'checkbox' ? e.checked : e.getAttribute('type') === 'number' ? Number(e.value) : e.value;
      if (cfg.outline === 'custom' && cfg.custom_lock && (key === 'width' || key === 'height') && previous > 0 && cfg[key] > 0) {
        var other = key === 'width' ? 'height' : 'width';
        cfg[other] *= cfg[key] / previous;
        editor.querySelector('[data-panel="' + other + '"]').value = Math.round(cfg[other] * 1000000) / 1000000;
      }
      if(cfg.outline==='custom'&&(key==='width'||key==='height')){keepCenteredItems(cfg,oldWidth,oldHeight);renderItems();}
      var firstCustomSides = key === 'frame_equal' && cfg.outline === 'custom' && cfg.custom_frame_sides === undefined;
      if (key === 'frame_equal' && cfg.outline === 'custom' && P.supportsFrameSides(cfg)) cfg.custom_frame_sides = !cfg.frame_equal;
      if (key === 'frame_equal' && cfg.frame_equal === false) {
        ['left','right','top','bottom'].forEach(function (side) {
          var sideKey = 'frame_' + side;
          if (cfg[sideKey] === undefined || firstCustomSides) cfg[sideKey] = cfg.frame;
          editor.querySelector('[data-panel="'+sideKey+'"]').value = cfg[sideKey];
        });
      }
      P.activateFrameFollow(cfg,key);
      if (key === 'bar_adjust') syncPatternGap();
      customStatus();
      $('panelMargins').hidden = cfg.equal_margins;
      schedule();
    });
  });
  ['width','height'].forEach(function (key) {
    $(key === 'width' ? 'panelCustomWidth' : 'panelCustomHeight').addEventListener('input', function () {
      var backing = editor.querySelector('[data-panel="' + key + '"]');
      backing.value = this.value;
      backing.dispatchEvent(new Event('input', {bubbles:true}));
    });
  });
  $('panelCustomFrameWidth').addEventListener('input', function () {
    var backing=editor.querySelector('[data-panel="frame"]');
    backing.value=this.value;backing.dispatchEvent(new Event('input',{bubbles:true}));
  });
  $('panelCustomFrameReset').onclick=function () {
    delete cfg.custom_frame_adjust;controls();schedule();
  };
  $('panelPatternGap').addEventListener('input', function () {
    var gap = $('panelPatternGap'), bar = editor.querySelector('[data-panel="bar_adjust"]');
    if (gap.value === '' || !gap.checkValidity()) {
      // Keep invalid input visible and block preview/export via the backing field.
      // Never turn an empty or out-of-range draft into a valid zero adjustment.
      bar.value = '';
    } else {
      cfg.bar_adjust = -Number(gap.value);
      bar.value = cfg.bar_adjust;
      patternStatus();
    }
    schedule();
  });
  $('panelPatternReset').onclick = function () {
    cfg.bar_adjust = 0;
    controls();
    schedule();
  };
  var _loop6 = function _loop6() {
    var _arr5$_i = _slicedToArray(_arr5[_i5], 2),
      id = _arr5$_i[0],
      value = _arr5$_i[1];
    $(id).onchange = function () {
      cfg.mode = $(id).checked ? value : 'pattern';
      controls();
      schedule();
    };
  };
  for (var _i5 = 0, _arr5 = [['panelSolid', 'solid'], ['panelHollow', 'hollow'], ['panelFrameless','frameless']]; _i5 < _arr5.length; _i5++) {
    _loop6();
  }
  $('panelMode').onclick = function () {
    return useMode('panel');
  };
  $('moduleMode').onclick = function () {
    return useMode('module');
  };
  $('panelBalance').onclick = function () {
    cfg.offset_x = cfg.offset_y = 0;
    controls();
    schedule();
  };
  $('panelReset').onclick = function () {
    if(regionDocument && regionIndex<0)return;
    cfg = P.normalize({
      id: cfg.id, follow_frame:true
    });
    chosen = [];
    controls();
    schedule();
  };
  function creationFinished() {
    pendingCreation = null;
    $('panelCreate').textContent = 'Tạo vách trong Rhino';
    $('panelUpdate').textContent = 'Cập nhật vách chọn';
    blocked(!result);
  }
  function create(action) {
    if (pendingCreation || smoothPending || edgeDraft) return;
    if(batchEditor.dirty() || batchEditor.busy()){status('Áp dụng hoặc Bỏ thay đổi chung trước khi tạo vách.',true);return;}
    try {
      if (!result) throw Error('Chờ hình xem trước cập nhật xong.');
      if (!window.sketchup || typeof sketchup.cnc_action !== 'function') throw Error('Mở Vách CNC trong Rhino để dùng chức năng này.');
      // Hold the lock through Ruby's commit, not just through JS mesh building.
      pendingCreation = {id:'panel-' + creationSession + '-' + (++creationSequence), action:action};
      blocked(true);
      $(action === 'panel_create' ? 'panelCreate' : 'panelUpdate').textContent = action === 'panel_create' ? 'Đang tạo vách…' : 'Đang cập nhật…';
      status(action === 'panel_create' ? (regionDocument ? 'Đang tạo các tấm độc lập trong Rhino…' : 'Đang tạo một vách trong Rhino…') : 'Đang cập nhật vách đã chọn…');
      // The verified preview already contains the exact closed Corel vectors.
      // Reuse it; generating a 3D mesh here blocks large 2D jobs unnecessarily.
      var payload = Object.assign({},regionDocument ? wholeResult : result);
      delete payload.region_results;
      var panels=LofiPanelRegions.separatePanels(payload.config,LofiCNCShapes);
      if(panels)payload.region_panels=panels;
      payload.request_id = pendingCreation.id;
      send(action, payload);
    } catch (e) {
      creationFinished();
      status(e.message, true);
    }
  }
  $('insertPlace').onclick = function () {
    try {
      if(edgeDraft)throw Error('Xác nhận khoảng cách mép hoặc nhấn Esc trước khi đặt họa tiết.');
      editor.querySelectorAll('[data-layer="insert"][type="number"]').forEach(function (e) {
        if (!e.disabled && (e.value === '' || !e.checkValidity())) throw Error('Thông số họa tiết đang trống hoặc ngoài giới hạn.');
      });
      var item = P.normalize(cfg).items[selected.insert];
      if (!item) throw Error('Thêm hoặc chọn họa tiết trước.');
      var packet={item:item};
      if(regionDocument)packet.region_id=regionDocument.custom_regions[regionIndex].id;
      if (item.even_insert || item.inner_rim_mm!==undefined || item.outer_rim_mm!==undefined || item.inner_gap || item.rim_adjust || LofiPanelSmoothing.active(item.smoothing)) packet.preview_loops=P.itemParts(Object.assign({},item,{x:0,y:0}),LofiCNCShapes[item.id]).flatMap(function (p) {return [p.outer].concat(p.holes);});
      send('panel_place_insert', packet);
    } catch (e) { status(e.message, true); }
  };
  // Build from the actual selected panel's saved config, not another draft in
  // the dialog. Ruby binds the reply to that target, edit context and click.
  function buildPlacedInsert(reply) {
    var config = JSON.parse(JSON.stringify(reply.config));
    Promise.all(LofiPanelRegions.assets(config).map(asset)).then(function () {
      var built = P.build(config, LofiCNCShapes, true);
      built.config = config; built.token = reply.token;delete built.region_results;
      send('panel_place_commit', built);
    }).catch(function (e) {
      send('panel_place_failed', {token:reply.token, message:e.message});
      status(e.message, true);
    });
  }
  $('panelCreate').onclick = function (event) {
    if (event && event.detail > 1) return;
    return create('panel_create');
  };
  $('panelUpdate').onclick = function (event) {
    if (event && event.detail > 1) return;
    return create('panel_update');
  };
  $('panelLoad').onclick = function () {
    return send('panel_load_selected');
  };
  $('panelCustomEnabled').onchange = function () {
    if (this.checked) {
      if (!cfg.custom_outer) { this.checked = false; send('panel_capture_face'); return; }
      cfg.outline = 'custom';
    } else cfg.outline = 'rectangle';
    controls(); schedule();
  };
  function focusCustom() {
    LofiOriginalCNC.show(true); useMode('panel');
    var section = $('panelCapture').closest('details'); openPanelFeature(section);
    section.scrollIntoView({block:'nearest'}); $('panelCapture').focus();
  }
  $('panelCapture').onclick = function () {
    return send('panel_capture_face');
  };
  $('panelSvg').onclick = function () {
    return result && send('export', {
      format: 'svg',
      content: P.svg(regionDocument ? wholeResult : result)
    });
  };
  $('panelDxf').onclick = function () {
    return result && send('export', {
      format: 'dxf',
      content: P.dxf(regionDocument ? wholeResult : result)
    });
  };
  $('panelExportConfig').onclick = function () {
    try {
      send('panel_export_config', workConfig());
    } catch (e) {
      status(e.message, true);
    }
  };
  $('panelImportConfig').onclick = function () {
    return send('panel_import_config');
  };
  $('panelExportSkp').onclick = function () {
    return send('panel_export_skp');
  };
  function exportIndex(){
    return chosen.length===1 && cfg.items[chosen[0]] && cfg.items[chosen[0]].mode!=='cut' ? chosen[0] : -1;
  }
  function sheetEdgeValues(){
    var i=exportIndex(),item=cfg.items[i];
    if(!item || !result || multipleRegions() || !LofiCNCShapes[item.id])return null;
    var sheet=regionDocument || cfg,dx=0,dy=0;
    if(regionDocument){
      var region=wholeResult && wholeResult.region_results[regionIndex];
      if(!region)return null;
      dx=region.x;dy=region.y;
    }
    var effective=Object.assign({},item,{smoothing:cfg.smoothing});
    var box=LofiPanelSpacing.bounds(effective,LofiCNCShapes[item.id]);
    return {left:dx+box.x0,right:sheet.width-dx-box.x1,
      bottom:dy+box.y0,top:sheet.height-dy-box.y1};
  }
  function cancelEdgeDraft(){
    if(edgeDraft){edgeDraft.field.setCustomValidity('');edgeDraft=null;}
  }
  function refreshEdgeFields(){
    if(edgeDraft && (edgeDraft.cfg!==cfg || edgeDraft.item!==cfg.items[exportIndex()])){
      cancelEdgeDraft();blocked(!result);
    }
    var values=null;
    try{values=sheetEdgeValues();}catch(e){/* Incomplete shapes are reported by the preview. */}
    sheetEdges.forEach(function(side){
      var field=$('insertEdge_'+side.id);
      field.disabled=!values || !!pendingCreation || !!smoothPending;
      if(!edgeDraft || edgeDraft.field!==field)
        field.value=values?String(Math.round(values[side.id]*1000)/1000):'';
    });
  }
  function refreshCenterControls(){
    var unavailable=!!dragGesture || !!smoothPending || !!rimDraft || !!pendingCreation || multipleRegions();
    $('insertCenterX').disabled=$('insertCenterY').disabled=unavailable || exportIndex()<0;
    $('insertCenter').disabled=unavailable || !picked('insert').length;
  }
  async function commitInsertPositions(next,indices){
    LofiPanelSpacing.assertFits(next,indices,LofiCNCShapes);
    var built;
    if(!regionDocument){
      var task={stamp:revision,kind:'position'},owner=cfg,assets=smoothingAssets(next),edge=edgeDraft,edgeValue=edge&&edge.field.value;
      clearTimeout(timer);smoothPending=task;smoothCancel.hidden=false;blocked(true);
      try{
        var local=await smoothingJobs.run({kind:'panel',config:next,assets:assets,mesh:false},function(text){if(smoothPending===task)status(text);});
        if(smoothPending!==task||task.stamp!==revision||owner!==cfg||edgeDraft!==edge||(edge&&edge.field.value!==edgeValue))return false;
        acceptSmoothing(local,assets);built={local:local};
      }finally{if(smoothPending===task){smoothPending=null;smoothCancel.hidden=true;blocked(!result);}}
    }else built=buildWorkingCandidate(next);
    cancelEdgeDraft();clearTimeout(timer);revision++;cfg=next;
    if(built.whole){wholeResult=built.whole;commitRegion();}
    renderItems();publishResult(built.local);
    return true;
  }
  async function centerInsert(axis){
    var button=axis==='both'?'insertCenter':axis==='x'?'insertCenterX':'insertCenterY';
    if($(button).disabled)return;
    try{
      var indices=picked('insert'),next=P.normalize(cfg);
      var centres=G.bounds(indices.map(function(i){return [next.items[i].x,next.items[i].y];}));
      var midX=(centres.x0+centres.x1)/2,midY=(centres.y0+centres.y1)/2;
      if((axis==='y' || midX===next.width/2) && (axis==='x' || midY===next.height/2)){
        cancelEdgeDraft();refreshEdgeFields();blocked(!result);
        status('Họa tiết đã ở giữa theo hướng đã chọn.');return;
      }
      // This is the same local midpoint used when adding a new insert,
      // including an insert in a region of a larger drawing.
      indices.forEach(function(i){
        var item=next.items[i];
        if(axis!=='y')item.x=next.width/2+(item.x-midX);
        if(axis!=='x')item.y=next.height/2+(item.y-midY);
      });
      if(!await commitInsertPositions(next,indices))return;
      status(axis==='both'?'Đã căn giữa theo cả hai trục.':axis==='x'?'Đã căn giữa theo chiều ngang.':'Đã căn giữa theo chiều dọc.');
    }catch(e){if(!e.cancelled)status(e.message+' Vị trí cũ được giữ.',true);}
  }
  $('insertCenterX').onclick=function(){centerInsert('x');};
  $('insertCenterY').onclick=function(){centerInsert('y');};
  async function applyEdge(side,field){
    if(!edgeDraft || edgeDraft.field!==field)return;
    var i=exportIndex(),item=cfg.items[i];
    if(!item || edgeDraft.item!==item || edgeDraft.cfg!==cfg){refreshEdgeFields();return;}
    try{
      field.setCustomValidity('');
      var value=field.valueAsNumber,values=sheetEdgeValues();
      if(!Number.isFinite(value)||value<0)throw Error('Nhập khoảng cách từ mép ngoài của tấm, theo mm, lớn hơn hoặc bằng 0.');
      if(!values || dragGesture || smoothPending || rimDraft || pendingCreation)throw Error('Chờ hình xem trước cập nhật xong.');
      var next=P.normalize(cfg);
      next.items[i][side.axis]+=side.sign*(value-values[side.id]);
      if(!await commitInsertPositions(next,[i]))return;
      status(side.label+' của tấm '+value+' mm.');
    }catch(e){
      if(e.cancelled)return;
      field.setCustomValidity(e.message);blocked(true);status(e.message+' Vị trí cũ được giữ. Nhấn Esc để bỏ nhập.',true);
    }
  }
  sheetEdges.forEach(function(side){
    var field=$('insertEdge_'+side.id);
    field.oninput=function(){
      var replaced=edgeDraft && edgeDraft.field!==field;
      if(replaced)cancelEdgeDraft();
      field.setCustomValidity('');edgeDraft={field:field,cfg:cfg,item:cfg.items[exportIndex()]};blocked(true);
      if(replaced)refreshEdgeFields();
    };
    field.onchange=function(){applyEdge(side,field);};
    field.onkeydown=function(event){
      if(event.key==='Enter'){event.preventDefault();applyEdge(side,field);}
      if(event.key==='Escape' && edgeDraft && edgeDraft.field===field){
        event.preventDefault();event.stopPropagation();cancelEdgeDraft();refreshEdgeFields();blocked(!result);
        status('Đã bỏ nhập khoảng cách mép.');
      }
    };
  });
  function invalidItemDraft(){
    if(rimDraft || edgeDraft || smoothPending)return true;
    return Array.from(editor.querySelectorAll('[data-layer="insert"][type="number"],#insertGapMm,#insertBridgeMm,[data-panel="thickness"]')).some(function(e){return !e.disabled && (e.value==='' || !e.checkValidity());});
  }
  function exportControls(){
    var disabled=exportIndex()<0 || !!smoothPending || !!pendingCreation || multipleRegions() || (batchEditor && (batchEditor.dirty()||batchEditor.busy())) || invalidItemDraft();
    $('insertExportDxf').disabled=$('insertExportSkp').disabled=!!disabled;
    $('panelCreateItems').disabled=!!disabled;
    ['borderExportDxf','borderExportNative'].forEach(function(id){if($(id))$(id).disabled=!(cfg.border&&cfg.border.enabled)||!!smoothPending||!!pendingCreation||multipleRegions()||batchEditor.dirty()||batchEditor.busy();});
  }
  function bridgeControls(){
    var rim=$('insertGapScope').value==='rim';
    $('insertBridgeLabel').hidden=!rim;
    $('insertBridgeMm').disabled=$('insertGapOn').disabled || !$('insertGapOn').checked || !rim;
  }
  var rimDraft=null,rimTimer=0;
  function measuredItem(){
    var index=exportIndex(),item=cfg.items[index];
    if(index<0 || !item || multipleRegions() || !LofiCNCShapes[item.id])return null;
    return P.rimDimensions(item,LofiCNCShapes[item.id]);
  }
  function refreshRimFields(){
    var index=exportIndex(),item=cfg.items[index],size=null;
    if(rimDraft && rimDraft.item!==item){clearTimeout(rimTimer);rimDraft=null;blocked(!result);}
    try{size=measuredItem();}catch(e){/* The panel validation reports invalid geometry. */}
    [['insertInnerRim','inner'],['insertOuterRim','outer']].forEach(function(pair){
      var field=$(pair[0]);field.disabled=!size;
      if(rimDraft && rimDraft.id===field.id)return;
      field.setCustomValidity('');
      field.value=size?Number(size[pair[1]].toFixed(2)):'';
    });
    $('insertRimReset').disabled=!item || index<0 || (item.inner_rim_mm===undefined && item.outer_rim_mm===undefined && !rimDraft);
    if(!rimDraft)$('insertRimSize').textContent=size?'Kích thước ngoài thực: '+LofiPanelDimensions.size(size.width,size.height)+'. Viền trong đổi tỷ lệ cả hình ở tâm. Viền ngoài dịch mép ngoài.':item?'Mẫu này chưa có hai vành tròn để đo.':'Chọn một họa tiết tròn để xem kích thước viền.';
    return size;
  }
  function rimDrawing(box){
    var size;try{size=measuredItem();}catch(e){return '';}
    if(!size)return '';
    var item=cfg.items[exportIndex()];
    var localBox={width:item.width,height:item.height};
    function project(p){return itemPoint(item,localBox,[p[0]+item.width/2,p[1]+item.height/2]);}
    function draw(key,label){
      var ray=size[key+'Ray'];if(!ray)return '';
      var a=project(ray[0]),b=project(ray[1]),dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
      if(len<.001)return '';
      var nx=-dy/len,ny=dx/len,t=4.5,x=(a[0]+b[0])/2,y=(a[1]+b[1])/2;
      function line(p,q){return '<line vector-effect="non-scaling-stroke" x1="'+p[0]+'" y1="'+p[1]+'" x2="'+q[0]+'" y2="'+q[1]+'"/>';}
      function mark(p,content){return '<g transform="translate('+p.join(' ')+')"><g data-rim-screen>'+content+'</g></g>';}
      function tick(p){return mark(p,line([-nx*t,-ny*t],[nx*t,ny*t]));}
      var right=x>=project([0,0])[0];
      var labelText='<text x="'+(right?8:-8)+'" y="-3" text-anchor="'+(right?'start':'end')+'" font-size="14" fill="#163848" style="paint-order:stroke;stroke:white;stroke-width:3;stroke-linejoin:round">'+label+' '+LofiPanelDimensions.number(size[key])+' mm</text>';
      return '<g data-insert-rim="'+key+'"><g stroke="#16495c" stroke-width="1.2">'+line(a,b)+tick(a)+tick(b)+'</g>'+mark([x,y],labelText)+'</g>';
    }
    return '<g pointer-events="none" aria-hidden="true">'+draw('inner','Viền trong')+draw('outer','Viền ngoài')+'</g>';
  }
  function commitRim(){
    clearTimeout(rimTimer);
    var draft=rimDraft,index=exportIndex();if(!draft || cfg.items[index]!==draft.item)return;
    var field=$(draft.id),key=field.id==='insertInnerRim'?'inner_rim_mm':'outer_rim_mm';
    var next=Object.assign({},draft.item);
    try{
      field.setCustomValidity('');
      if(!field.checkValidity())throw Error('Nhập bề rộng viền lớn hơn 0 mm.');
      if(field.value==='')delete next[key];else next[key]=Number(field.value);
      if(key==='inner_rim_mm'){
        if(next[key]===undefined)delete next.inner_scale;
        else next.inner_scale=true;
      }
      if(next[key]!==undefined || next.inner_rim_mm!==undefined || next.outer_rim_mm!==undefined)
        P.rimDimensions(next,LofiCNCShapes[next.id]);
    }catch(e){
      field.setCustomValidity(e.message);$('insertRimSize').textContent=e.message;
      $('insertRimReset').disabled=false;blocked(true);return;
    }
    rimDraft=null;cfg.items[index]=next;schedule();
  }
  ['insertInnerRim','insertOuterRim'].forEach(function(id){
    var field=$(id);
    field.oninput=function(){
      var index=exportIndex();if(index<0)return;
      field.setCustomValidity('');rimDraft={id:id,item:cfg.items[index]};blocked(true);
      clearTimeout(rimTimer);rimTimer=setTimeout(commitRim,280);
    };
    field.onchange=commitRim;
    field.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();commitRim();}};
  });
  $('insertRimReset').onclick=function(){
    var index=exportIndex();if(index<0)return;
    clearTimeout(rimTimer);rimDraft=null;delete cfg.items[index].inner_rim_mm;delete cfg.items[index].outer_rim_mm;
    delete cfg.items[index].inner_scale;
    refreshRimFields();schedule();
  };
  function gapChange(){
    var index=exportIndex();if(index<0)return;
    var field=$('insertGapMm'),enabled=$('insertGapOn').checked;field.disabled=!enabled;
    bridgeControls();
    var bridge=$('insertBridgeMm'),invalidBridge=!bridge.disabled && (!bridge.value||!bridge.checkValidity());
    if(enabled && (!field.value || !field.checkValidity() || invalidBridge)){
      clearTimeout(timer);revision++;result=null;wholeResult=null;window.LofiPanelResult=null;blocked(true);
      var message=(invalidBridge?'Nhập bề rộng cầu nối lớn hơn 0 mm.':'Với dao 6 mm, nhập bề rộng sau nới từ 6,1 mm.')+' Hình đang hiển thị là kết quả hợp lệ trước đó.';
      $('panelValidation').textContent=message;$('panelValidation').classList.add('warning');
      status(message,true);return;
    }
    if(enabled){
      cfg.items[index].inner_gap=Number(field.value);
      cfg.items[index].inner_gap_scope=$('insertGapScope').value;
      if(!bridge.disabled)cfg.items[index].inner_gap_bridge=Number(bridge.value);
      else delete cfg.items[index].inner_gap_bridge;
    }else{
      delete cfg.items[index].inner_gap;delete cfg.items[index].inner_gap_scope;delete cfg.items[index].inner_gap_bridge;
    }
    schedule();
  }
  $('insertGapOn').onchange=gapChange;$('insertGapMm').oninput=gapChange;
  $('insertGapScope').onchange=function(){bridgeControls();if($('insertGapOn').checked)gapChange();};
  $('insertBridgeMm').oninput=gapChange;
  var exportSeq=0;
  function exportItem(format){
    try{
      var idx=exportIndex();if(idx<0 || multipleRegions() || pendingCreation || batchEditor.dirty() || batchEditor.busy() || invalidItemDraft())throw Error('Chọn đúng một họa tiết chèn và nhập thông số hợp lệ.');
      var item=cfg.items[idx],snapshot=JSON.stringify(item),stamp=revision,region=regionIndex,owner=cfg,seq=++exportSeq;
      var single={id:cfg.id,items:[JSON.parse(snapshot)],plane:cfg.plane,thickness:cfg.thickness,material:cfg.material};
      if(cfg.smoothing)single.smoothing=Object.assign({},cfg.smoothing);
      asset(item.id).then(function(){
        if(seq!==exportSeq || cfg!==owner || region!==regionIndex || stamp!==revision || exportIndex()!==idx || JSON.stringify(cfg.items[idx])!==snapshot || invalidItemDraft() || pendingCreation)return;
        var built=P.buildItem(single,0,LofiCNCShapes),name=byId[item.id].name;
        if(built.warnings.length){
          $('panelValidation').textContent=name+' · '+built.warnings.join(' ');
          $('panelValidation').classList.add('warning');
        }
        if(format==='dxf')send('panel_item_dxf',{name:name,content:P.dxf(built)});
        else send('panel_item_skp',{name:name,config:built.config,solids:built.solids,material:single.material,smoothing:single.smoothing||null});
      }).catch(function(e){if(seq===exportSeq)status(e.message,true);});
    }catch(e){status(e.message,true);}
  }
  $('insertExportDxf').onclick=function(){exportItem('dxf');};$('insertExportSkp').onclick=function(){exportItem('skp');};
  var borderExportButtons=document.createElement('div');
  borderExportButtons.className='actions';
  borderExportButtons.innerHTML='<button id="borderExportDxf" type="button">Xuất riêng diềm DXF</button><button id="borderExportNative" type="button">Xuất riêng diềm 3DM</button>';
  $('panelBorderLayout').parentNode.appendChild(borderExportButtons);
  var borderExportHelp=document.createElement('small');
  borderExportHelp.textContent='Chỉ xuất dải chạy viền còn bật, không kèm tấm, khung hoặc họa tiết chèn.';
  borderExportButtons.after(borderExportHelp);
  function exportBorder(format){
    try{
      if(!cfg.border||!cfg.border.enabled||multipleRegions()||pendingCreation||smoothPending||batchEditor.dirty()||batchEditor.busy())throw Error('Bật chạy viền và hoàn tất thông số trước khi xuất riêng.');
      var single=JSON.parse(JSON.stringify(cfg)),stamp=revision,owner=cfg,seq=++exportSeq;
      single.mode='frameless';single.items=[];
      delete single.custom_regions;delete single.region_basis;
      Promise.all(LofiPanelRegions.assets(single).map(asset)).then(function(){
        if(seq!==exportSeq||owner!==cfg||stamp!==revision||pendingCreation)return;
        var built=P.build(single,LofiCNCShapes,true),name='Diem_chay_vien';
        if(format==='dxf')send('panel_item_dxf',{name:name,content:P.dxf(built)});
        else send('panel_item_skp',{name:name,config:built.config,solids:built.solids,material:single.material,smoothing:single.smoothing||null});
      }).catch(function(e){if(seq===exportSeq)status(e.message,true);});
    }catch(e){status(e.message,true);}
  }
  $('borderExportDxf').onclick=function(){exportBorder('dxf');};
  $('borderExportNative').onclick=function(){exportBorder('skp');};
  var standaloneHelp=document.createElement('small');
  standaloneHelp.textContent='Bỏ khung: mỗi họa tiết giữ kích thước riêng, có thể vượt khổ tấm và không cắt hoặc hàn với chi tiết khác. Dùng Xuất riêng để lấy đúng họa tiết đã chọn.';
  $('insertExportSkp').parentNode.after(standaloneHelp);
  $('insertEven').onchange=function(){
    var index=exportIndex();if(index<0)return;
    if(this.checked)cfg.items[index].even_insert=true;else delete cfg.items[index].even_insert;
    schedule();
  };
  var cleanInsertButton=document.createElement('button');
  cleanInsertButton.id='insertWallCleanup';
  cleanInsertButton.textContent='Ẩn vạch thành họa tiết đã dựng';
  cleanInsertButton.title='Chọn Group họa tiết trong Rhino rồi bấm để ẩn vạch trên mặt đứng cong.';
  $('insertExportSkp').parentNode.after(cleanInsertButton);
  cleanInsertButton.onclick=function(){
    if(!pendingCreation && !smoothPending)send('insert_wall_cleanup');
  };
  $('panelCreateItems').onclick = function () {
    try {
      if (chosen.length !== 1) throw Error('Chọn một họa tiết để tạo riêng trong Rhino.');
      var index = selected[activeKind] >= 0 ? selected[activeKind] : selected.insert >= 0 ? selected.insert : selected.cut;
      if (index < 0) throw Error('Thêm hoặc chọn một họa tiết trước.');
      var item = cfg.items[index],
        e = byId[item.id];
      if(invalidItemDraft() || pendingCreation || smoothPending || multipleRegions())throw Error('Chọn một họa tiết và nhập thông số hợp lệ.');
      var single={id:cfg.id,items:[JSON.parse(JSON.stringify(item))],plane:cfg.plane,thickness:cfg.thickness,material:cfg.material};
      if(cfg.smoothing)single.smoothing=Object.assign({},cfg.smoothing);
      var built=P.buildItem(single,0,LofiCNCShapes);built.config.name=e.name;
      send('panel_item_create',built);
    } catch (e) {
      status(e.message, true);
    }
  };
  $('panel2d').onclick = function () {
    finishDrag(false);viewport.projection();is3d = false;
    renderPreview();
  };
  $('panel3d').onclick = function () {
    finishDrag(false);viewport.projection();is3d = true;
    renderPreview();
  };
  function fitLibraryPattern() {
    var entry=byId[cfg.id];
    if(!entry || entry.fit_panel_width_on_select!==true || multipleRegions())return false;
    var sides=P.frameInsets(cfg),available=cfg.width-sides.left-sides.right;
    if(!(available>0))return false;
    cfg.module=Math.max(20,Math.min(3000,available));
    cfg.angle=0;
    cfg.offset_x=sides.left-cfg.width/2;
    var pitch=cfg.module*entry.height/entry.width;
    cfg.offset_y=entry.center_pattern_y===true ? 0 : (cfg.height/2-sides.top)%pitch;
    return true;
  }
  window.addEventListener('lofi-rhino-catalog', function (event) {
    event.detail.forEach(function (entry) {
      byId[entry.id] = entry;
      var kind = entry.group === 'inserts' ? 'insert' : entry.group === 'cutout_patterns' ? 'cut' : null;
      if (!kind) return;
      var option = document.createElement('option');
      option.value = entry.id;
      option.textContent = entry.name;
      $(kind + 'Choice').appendChild(option);
    });
  });
  window.addEventListener('lofi-source-select', function (event) {
    if (mode !== 'panel' || event.detail.loaded) return;
    if(regionDocument && regionIndex<0){status('Bấm chọn một vùng trên hình trước khi chọn mẫu.',true);return;}
    var e = event.detail.item;
    if(multipleRegions()){
      if(e.group==='patterns'||LofiCNCBorder.isBorder(e.id))batchEditor.choose(e.id,LofiCNCBorder.isBorder(e.id));
      else status('Chọn riêng một vùng để thêm họa tiết chèn.',true);
      return;
    }
    if (LofiCNCBorder.isBorder(e.id)) { chooseBorder(e.id); return; }
    if (e.group === 'patterns') {
      var previousId=cfg.id;
      cfg.id = e.id;
      cfg.name = e.name + ' · LOFIHOME';
      if(fitLibraryPattern() || e.id==='patterns__capnhat_b-063' || previousId==='patterns__capnhat_b-063')controls();
      else if(editor.querySelector('[data-panel="angle"]').dataset.photo33Disabled)patternStatus();
      schedule();
    } else add(e.id, e.group === 'cutout_patterns');
  });
  window.addEventListener('lofi-cnc-reply', function (event) {
    var reply = event.detail;
    if (reply.type === 'panel_operation_done') {
      if (pendingCreation && reply.request_id === pendingCreation.id && reply.action === pendingCreation.action) {
        creationFinished();
        status(reply.message || (reply.ok ? 'Đã hoàn tất vách.' : 'Không tạo được vách.'), !reply.ok);
      }
      return;
    }
    try {
      if (reply.type === 'panel_place_build') buildPlacedInsert(reply);
      if (reply.type === 'open_custom_outline') focusCustom();
      if (reply.type === 'source_config') useMode('module');
      if (reply.type === 'panel_config') {
        finishDrag(false);viewport.reset();
        var loaded=P.normalize(reply.config);
        regionDocument=loaded.custom_regions ? loaded : null;regionIndex=-1;
        if(regionDocument && loaded.region_panel===true)regionIndex=0;
        if(regionDocument && reply.focus_region)regionIndex=loaded.custom_regions.findIndex(function(r){return r.id===reply.focus_region;});
        regionSelection=regionIndex>=0?[regionIndex]:[];resetRegionBatch();
        cfg=regionIndex<0 ? loaded : LofiPanelRegions.clone(loaded.custom_regions[regionIndex].config);
        var focus = reply.focus_insert ? cfg.items.findIndex(function (i) { return i.uid === reply.focus_insert; }) : cfg.items.length ? 0 : -1;
        chosen = focus >= 0 ? [focus] : [];
        if (focus>=0) activeKind = cfg.items[focus].mode==='cut' ? 'cut' : 'insert';
        LofiOriginalCNC.focus(cfg.id);
        LofiOriginalCNC.show(true);
        useMode('panel');
        controls();
        schedule();
      }
      if(reply.type==='panel_regions'){
        var captured=LofiPanelRegions.capture(reply,cfg);finishDrag(false);
        regionDocument=captured.config;regionIndex=-1;cfg=regionDocument;chosen=[];viewport.reset();is3d=false;
        regionSelection=[];resetRegionBatch();
        LofiOriginalCNC.show(true);useMode('panel');controls();schedule();
        status('Đã đọc '+cfg.custom_regions.length+' vùng kín.'+(captured.ignored_lines?' '+captured.ignored_lines+' đoạn không khép vùng được bỏ qua.':''));
      }
      if (reply.type === 'panel_outline') {
        finishDrag(false);viewport.reset();
        var next = Object.assign({}, cfg, {outline:'custom', custom_outer:reply.points, custom_holes:reply.holes || [],
          width:reply.width, height:reply.height, custom_lock:false, custom_source:reply.source || 'Biên dạng đã đọc',
          custom_placement:reply.placement, custom_place:!!reply.placement,
          custom_fill_inner:P.suggestDrawnFrame(reply.points, reply.holes || [])});
        delete next.custom_frame_adjust;
        delete next.custom_frame_sides;
        if (reply.thickness != null) next.thickness = reply.thickness;
        // Validate before replacing the previous usable outline.
        delete next.custom_regions;delete next.region_basis;
        next=P.normalize(next);keepCenteredItems(next,cfg.width,cfg.height);
        cfg = next;regionDocument=null;regionIndex=-1;
        regionSelection=[];resetRegionBatch();
        if (reply.message) status(reply.message);
        focusCustom();
        controls();
        schedule();
      }
    } catch (e) {
      status(e.message, true);
    }
  });
  $('originalTab').addEventListener('click', function () {
    if (mode === 'panel') schedule();
  });
  $('designerTab').addEventListener('click', function () {
    cancelSmoothing();
    finishDrag(false);viewport.leave();
    if(batchEditor.busy()){regionBatchEpoch++;batchEditor.error('Đã hủy áp dụng khi chuyển bảng; các vùng giữ nguyên.');}
    clearTimeout(timer);
    revision++;
  });
  window.LofiPanelUI = {
    getConfig: function getConfig() {
      return JSON.parse(JSON.stringify(regionDocument ? workConfig() : cfg));
    },
    fitLibraryPattern: function(){if(fitLibraryPattern()){controls();schedule();}},
    focusCustom: focusCustom,
    getRegionIndex:function(){return regionIndex;},
    getRegionSelection:function(){return regionSelection.slice();},
    getSelection: function () { return chosen.slice(); },
    useMode: useMode
  };
  controls();
  useMode('panel');
  send('panel_ready');
})();
