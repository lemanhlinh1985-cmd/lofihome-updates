function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t.return || t.return(); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
(function () {
  'use strict';

  var entries = window.LofiOriginalCNCCatalog || [],
    base = '../../cnc_source_198/',
    $ = function $(id) {
      return document.getElementById(id);
    };
  var groups = {patterns:'Hình học', inserts:'Họa tiết chèn', cutout_patterns:'Đục tấm',borders:'Chạy viền'};
  var menuGroups = [['geometry','Hình học'],['inserts','Họa tiết chèn'],['cutouts','Đục tấm'],['trims','Diềm'],['single_details','Mẫu đơn'],['leaves','Mẫu lá'],['borders','Chạy viền']];
  var menuDefaults = window.LofiCNCMenuDefaults, menuLayout = JSON.parse(JSON.stringify(menuDefaults));
  var arranging = false, orderSelected = null, layoutRevision = 0, layoutLoaded = false, dirtySize = false, dirtyGroups = {};
  function menuGroup(item) {
    if(item.group==='borders')return 'borders';
    var id = item.id.split('__')[1];
    if (id.indexOf('mau_don_') === 0) return 'single_details';
    if (id.indexOf('mau_la_') === 0) return 'leaves';
    if (item.group === 'patterns') return 'geometry';
    if (item.group === 'inserts') return id.indexOf('diem_') === 0 ? 'trims' : 'inserts';
    return ['duc_009','duc_010','duc_012','duc_011','duc_030','duc_029','duc_031'].includes(id) ? 'borders' : 'cutouts';
  }
  function ordered(group) {
    var list = entries.filter(function (e) { return menuGroup(e) === group; }), order = menuLayout.order[group] || [];
    return list.sort(function (a,b) {
      var x=order.indexOf(a.id), y=order.indexOf(b.id);
      return (x<0 ? order.length+entries.indexOf(a) : x) - (y<0 ? order.length+entries.indexOf(b) : y);
    });
  }
  var selected = entries[0];
  var view = document.createElement('section');
  view.id = 'originalLibrary';
  view.hidden = true;
  view.innerHTML = '<div class="original-heading"><strong>Thư viện 305 mẫu</strong><small>Chọn nhóm hoa văn · Cuộn để xem</small></div>' + '<div class="original-layout"><div><div class="library-head"><input id="originalSearch" type="search" placeholder="Tìm tên hoặc mã mẫu…" aria-label="Tìm mẫu gốc"><select hidden id="originalGroup" aria-label="Nhóm hoa văn"><option value="">Tất cả</option><option value="geometry">Hình học</option><option value="inserts">Họa tiết chèn</option><option value="cutouts">Đục tấm</option><option value="trims">Diềm</option><option value="single_details">Mẫu đơn</option><option value="leaves">Mẫu lá</option><option value="borders">Chạy viền</option></select></div><div id="originalFilters" class="original-filters" role="group" aria-label="Nhóm hoa văn"><button data-category="" class="active">Tất cả</button><button data-category="geometry">Hình học</button><button data-category="inserts">Họa tiết chèn</button><button data-category="cutouts">Đục tấm</button><button data-category="trims">Diềm</button><button data-category="single_details">Mẫu đơn</button><button data-category="leaves">Mẫu lá</button><button data-category="borders">Chạy viền</button></div><div class="original-sizes" role="group" aria-label="Cỡ hình"><span>Cỡ hình</span><button data-size="large">Lớn</button><button data-size="medium" class="active">Vừa</button><button data-size="small">Nhỏ</button></div><button id="originalArrange">Sắp xếp thư viện</button><div id="originalOrderTools" hidden><small>Chọn một nhóm và một mẫu, rồi dùng nút lên/xuống.</small><div class="row"><button id="originalMoveUp">↑ Lên</button><button id="originalMoveDown">↓ Xuống</button></div><button id="originalOrderReset">Thứ tự ban đầu của nhóm</button></div><div id="originalCards" class="original-cards" tabindex="0" aria-label="Danh sách mẫu CNC, cuộn để xem"></div><div id="originalCount" class="original-count" role="status"></div></div>' + '<div class="original-editor"><h2 id="originalName"></h2><div id="originalPreview" class="original-preview"></div><div id="originalInfo"></div><div class="fields">' + field('width', 'Rộng mô-đun (mm)', 1, 10000) + field('height', 'Cao mô-đun (mm)', 1, 10000) + field('thickness', 'Dày (mm)', .1, 200) + field('angle', 'Xoay (°)', -360, 360) + field('columns', 'Số cột', 1, 30) + field('rows', 'Số hàng', 1, 30) + field('gap_x', 'Khe ngang (mm)', 0, 5000) + field('gap_y', 'Khe dọc (mm)', 0, 5000) + '<label>Hướng đặt<select data-original="plane"><option value="xz">Đứng (XZ)</option><option value="xy">Nằm (XY)</option></select></label><label class="check"><input type="checkbox" data-original="mirror">Lật ngang</label></div>' + '<div class="row"><button id="originalReset">Kích thước gốc</button><button id="originalLoad">Lấy nhóm đang chọn</button></div><div class="actions"><button id="originalInsert" class="primary">Chèn mẫu / Xếp mẫu 3D</button><button id="originalUpdate" class="primary">Cập nhật nhóm chọn</button><button id="originalSvg">Xuất SVG (mm)</button><button id="originalDxf">Xuất DXF (mm)</button><button id="originalJson">Xuất JSON gốc</button><button id="originalSkp">Xuất 3DM mô-đun</button><button id="originalNative">Chèn 3DM gốc đi kèm</button></div>' + '<small id="originalKindNote"></small><small class="original-note">Các mô-đun và chi tiết rời được giữ thành nhóm riêng. SVG/DXF xuất đường biên theo bố trí hiện tại; chưa hợp khối hoặc tạo đường chạy dao. JSON và 3DM xuất theo kích thước gốc.</small></div></div>';
  $('cncDesigner').after(view);
  var layout = view.querySelector('.original-layout'),
    editor = view.querySelector('.original-editor');
  layout.firstElementChild.classList.add('original-browser');
  var design = document.createElement('div');
  design.className = 'original-design';
  editor.before(design);
  ['originalName', 'originalPreview', 'originalInfo'].forEach(function (id) {
    return design.appendChild($(id));
  });
  var createActions = document.createElement('div');
  createActions.className = 'actions';
  design.appendChild(createActions);
  ['originalInsert', 'originalUpdate'].forEach(function (id) {
    return createActions.appendChild($(id));
  });
  var title = document.createElement('h2');
  title.textContent = 'Kích thước & bố trí';
  editor.prepend(title);
  var credit = document.createElement('small');
  credit.className = 'original-note';
  credit.textContent = 'Nguồn mẫu: Nguyễn Khánh CNC 1.9.8. Chèn, bố trí và xuất file bằng bộ xử lý LOFIHOME.';
  editor.appendChild(credit);
  function field(key, label, min, max) {
    if (['columns','rows','angle'].indexOf(key)<0) return '<label>'+label+'<input data-original="'+key+'" type="number" step="any" min="0"></label>';
    return '<label>' + label + '<input data-original="' + key + '" type="number" min="' + min + '" max="' + max + '" step="' + (['rows', 'columns'].includes(key) ? '1' : 'any') + '"></label>';
  }
  function send(action) {
    var payload = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    if (window.sketchup && typeof window.sketchup.cnc_action === 'function') window.sketchup.cnc_action(JSON.stringify({
      action: action,
      payload: payload
    }));else status('Mở Vách CNC từ thanh công cụ LOFIHOME trong Rhino để dùng chức năng này.', true);
  }
  function show(original) {
    view.hidden = !original;
    $('cncDesigner').hidden = original;
    $('cncDesignerNav').hidden = original;
    $('reset').hidden = original;
    $('originalTab').classList.toggle('active', original);
    $('designerTab').classList.toggle('active', !original);
    status(original ? 'Thư viện mẫu gốc 1.9.8. Chọn mẫu để xem và chèn vào Rhino.' : 'Thiết kế CNC LOFIHOME.');
  }
  function normalizeText(s) {
    return LofiCompat.fold(s);
  }
  function filtered() {
    var q = normalizeText($('originalSearch').value), group = $('originalGroup').value;
    var list = group ? ordered(group) : [].concat.apply([],menuGroups.map(function (g) { return ordered(g[0]); }));
    return list.filter(function (e) { return normalizeText(e.name+' '+e.id+' '+(e.category||'')).includes(q); });
  }
  function menuControls() {
    view.querySelectorAll('[data-category]').forEach(function (b) { var on=b.dataset.category===$('originalGroup').value; b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on)); });
    view.querySelectorAll('[data-size]').forEach(function (b) { var on=b.dataset.size===menuLayout.size; b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on)); });
    $('originalCards').dataset.size=menuLayout.size;
    $('originalCards').classList.toggle('arranging',arranging);
    $('originalOrderTools').hidden=!arranging;
    $('originalArrange').textContent=arranging ? 'Xong sắp xếp' : 'Sắp xếp thư viện';
    var group=$('originalGroup').value, ids=group ? ordered(group).map(function (e) {return e.id;}) : [], index=ids.indexOf(orderSelected);
    $('originalMoveUp').disabled=!group || index<=0 || !!$('originalSearch').value;
    $('originalMoveDown').disabled=!group || index<0 || index>=ids.length-1 || !!$('originalSearch').value;
    $('originalOrderReset').disabled=!group || !ids.length;
  }
  function previewAddress(item, useUniform) {
    return useUniform ? 'uniform/'+item.id+'.svg' : item.rhinoPreview || base+item.preview;
  }
  function saveMenu() {
    layoutRevision++;
    if (layoutLoaded) send('source_layout_save',menuLayout);
  }
  function render(resetScroll) {
    var list=filtered(), fragment=document.createDocumentFragment(), cards=$('originalCards'), scroll=cards.scrollTop;
    list.forEach(function (item) {
      var button=document.createElement('button');button.className='original-card';button.dataset.id=item.id;
      var image=document.createElement('img');image.src=window.LofiUniformInsertIndex[item.id]?'uniform/'+item.id+'.webp':previewAddress(item,false);image.alt='';image.loading='lazy';
      var name=document.createElement('span');name.textContent=item.name;
      var small=document.createElement('small');small.textContent=item.category || groups[item.group];
      var tick=document.createElement('i');tick.className='original-tick';tick.textContent='✓';tick.setAttribute('aria-hidden','true');
      button.append(image,name,small,tick);
      button.onclick=function () { if(arranging){orderSelected=item.id;markSelection();menuControls();}else choose(item); };
      fragment.appendChild(button);
    });
    if(!list.length){var empty=document.createElement('p');empty.className='original-empty';empty.textContent=$('originalSearch').value ? 'Không tìm thấy mẫu.' : 'Nhóm này chưa có mẫu. Sẽ bổ sung file mẫu sau.';fragment.appendChild(empty);}
    cards.replaceChildren(fragment);cards.scrollTop=resetScroll===true ? 0 : scroll;
    menuControls();markSelection();
    $('originalCount').textContent=list.length+' mẫu · Cuộn để xem';
  }
  function moveItem(id,before) {
    var group=$('originalGroup').value;if(!group || id===before)return;
    var ids=ordered(group).map(function (e){return e.id;}),from=ids.indexOf(id),to=ids.indexOf(before);
    if(from<0 || to<0)return;ids.splice(from,1);ids.splice(to,0,id);menuLayout.order[group]=ids;dirtyGroups[group]=true;orderSelected=id;saveMenu();render();
  }
  function moveBy(delta) {
    var group=$('originalGroup').value,ids=group ? ordered(group).map(function (e){return e.id;}) : [],from=ids.indexOf(orderSelected);
    if(from<0 || from+delta<0 || from+delta>=ids.length || $('originalSearch').value)return;
    moveItem(orderSelected,ids[from+delta]);
  }
  function markSelection() {
    var _iterator = _createForOfIteratorHelper($('originalCards').children),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var card = _step.value;
        if (card.classList.contains('original-card')) {
          var active = arranging ? card.dataset.id === orderSelected : selected && card.dataset.id === selected.id;
          card.classList.toggle('selected', active);
          card.setAttribute('aria-pressed', String(!!active));
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }
  function revealSelection() {
    requestAnimationFrame(function () {
      var cards = $('originalCards'),
        card = cards.querySelector('.selected');
      if (!card) return;
      var box = cards.getBoundingClientRect(),
        item = card.getBoundingClientRect();
      if (item.top < box.top) cards.scrollTop += item.top - box.top;else if (item.bottom > box.bottom) cards.scrollTop += item.bottom - box.bottom;
    });
  }
  var evenLabel=document.createElement('label');
  evenLabel.id='originalEvenLabel';evenLabel.className='check';
  evenLabel.innerHTML='<input type="checkbox" id="originalEven" data-original="even_insert"> Làm đều vòng và hình lặp';
  $('originalKindNote').before(evenLabel);
  function write(params) {
    view.querySelectorAll('[data-original]').forEach(function (e) {
      var v = params[e.dataset.original];
      if (e.type === 'checkbox') e.checked = !!v;else e.value = v;
    });
  }
  function read() {
    var params = {
      id: selected.id
    };
    view.querySelectorAll('[data-original]').forEach(function (e) {
      params[e.dataset.original] = e.type === 'checkbox' ? e.checked : e.getAttribute('type') === 'number' ? Number(e.value) : e.value;
    });
    return params;
  }
  function choose(item, params) {
    selected = item;
    write(params || {
      width: item.width,
      height: window.LofiUniformInsertIndex[item.id]==='round' ? item.width : item.height,
      even_insert: !!window.LofiUniformInsertIndex[item.id],
      thickness: item.thickness,
      angle: 0,
      columns: 1,
      rows: 1,
      gap_x: 0,
      gap_y: 0,
      mirror: false,
      plane: 'xz'
    });
    $('originalEvenLabel').hidden=!window.LofiUniformInsertIndex[item.id];
    $('originalEven').disabled=!window.LofiUniformInsertIndex[item.id];
    $('originalName').textContent = item.name + ' · ' + menuGroups.find(function (g) {return g[0]===menuGroup(item);})[1];
    $('originalInfo').textContent = 'Gốc: ' + item.width + ' × ' + item.height + ' × ' + item.thickness + ' mm · ' + item.parts + ' phần';
    $('originalNative').hidden = !item.native_skp;
    $('originalKindNote').textContent = item.group === 'cutout_patterns' ? 'Mẫu đục được chèn thành khối khuôn theo đường biên đục; chưa thực hiện phép trừ trên tấm.' : '';
    markSelection();
    preview();
    window.dispatchEvent(new CustomEvent('lofi-source-select', {
      detail: {
        item: item,
        loaded: !!params
      }
    }));
  }
  function valid(params) {
    var _iterator2 = _createForOfIteratorHelper(view.querySelectorAll('input[type=number][data-original]')),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var e = _step2.value;
        if (!e.checkValidity() || !Number.isFinite(params[e.dataset.original])) throw Error('Thông số mẫu không hợp lệ.');
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
    ['width','height','thickness'].forEach(function(k){if(!(params[k]>0))throw Error('Kích thước mô-đun cần lớn hơn 0.');});
    if (!Number.isInteger(params.columns) || !Number.isInteger(params.rows)) throw Error('Số hàng/cột phải là số nguyên.');
    if (params.columns * params.rows > 100) throw Error('Tối đa 100 mô-đun mỗi lần.');
    if (params.columns * params.rows * selected.vertices > 1000000 || params.columns * params.rows * (selected.assembly_parts || 0) > 20000) throw Error('Mẫu nhiều chi tiết; giảm số hàng/cột.');
    return params;
  }
  function preview() {
    try {
      var p = valid(read()),
        ns = 'http://www.w3.org/2000/svg',
        svg = document.createElementNS(ns, 'svg'),
        a = p.angle * Math.PI / 180,
        spanX = Math.abs(p.width * Math.cos(a)) + Math.abs(p.height * Math.sin(a)),
        spanY = Math.abs(p.width * Math.sin(a)) + Math.abs(p.height * Math.cos(a)),
        w = p.columns * p.width + (p.columns - 1) * p.gap_x,
        h = p.rows * p.height + (p.rows - 1) * p.gap_y,
        extraX = Math.max(0, (spanX - p.width) / 2),
        extraY = Math.max(0, (spanY - p.height) / 2),
        pad = Math.max(w, h) * .04;
      svg.setAttribute('viewBox', [-extraX - pad, -extraY - pad, w + 2 * extraX + 2 * pad, h + 2 * extraY + 2 * pad].join(' '));
      for (var row = 0; row < p.rows; row++) for (var col = 0; col < p.columns; col++) {
        var g = document.createElementNS(ns, 'g');
        g.setAttribute('transform', 'translate(' + ((col + .5) * p.width + col * p.gap_x) + ' ' + ((row + .5) * p.height + row * p.gap_y) + ') rotate(' + -p.angle + ') scale(' + (p.mirror ? -1 : 1) + ' 1)');
        var image = document.createElementNS(ns, 'image');
        image.setAttribute('href', previewAddress(selected,p.even_insert && window.LofiUniformInsertIndex[selected.id]));
        image.setAttribute('x', -p.width / 2);
        image.setAttribute('y', -p.height / 2);
        image.setAttribute('width', p.width);
        image.setAttribute('height', p.height);
        image.setAttribute('preserveAspectRatio', 'none');
        g.appendChild(image);
        svg.appendChild(g);
      }
      $('originalPreview').replaceChildren(svg);
      ['originalInsert', 'originalUpdate', 'originalSkp'].forEach(function (id) {
        return $(id).disabled = selected.model_status !== 'closed';
      });
      ['originalSvg', 'originalDxf'].forEach(function (id) {
        return $(id).disabled = false;
      });
      status(selected.model_status === 'closed' ? 'Mẫu gốc sẵn sàng. Có thể chèn vector hoặc xuất đường biên.' : 'Mẫu gốc đọc được; đường bao chưa được xác nhận.', selected.model_status !== 'closed');
    } catch (e) {
      ['originalInsert', 'originalUpdate', 'originalSvg', 'originalDxf', 'originalSkp'].forEach(function (id) {
        return $(id).disabled = true;
      });
      status(e.message, true);
    }
  }
  function action(name) {
    var extra = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    try {
      send(name, Object.assign(valid(read()), extra));
    } catch (e) {
      status(e.message, true);
    }
  }
  $('originalTab').onclick = function () {
    return show(true);
  };
  $('designerTab').onclick = function () {
    return show(false);
  };
  $('originalSearch').oninput = $('originalGroup').onchange = function () { render(true); };
  view.querySelectorAll('[data-category]').forEach(function (b) {b.onclick=function () {$('originalGroup').value=b.dataset.category;orderSelected=null;render(true);};});
  view.querySelectorAll('[data-size]').forEach(function (b) {b.onclick=function () {menuLayout.size=b.dataset.size;dirtySize=true;saveMenu();menuControls();};});
  $('originalArrange').onclick=function () {arranging=!arranging;orderSelected=selected&&selected.id;render();};
  $('originalMoveUp').onclick=function () {moveBy(-1);};$('originalMoveDown').onclick=function () {moveBy(1);};
  $('originalOrderReset').onclick=function () {var group=$('originalGroup').value;if(!group)return;menuLayout.order[group]=(menuDefaults.order[group]||[]).slice();dirtyGroups[group]=true;saveMenu();render();};
  view.querySelectorAll('[data-original]').forEach(function (e) {
    return e.addEventListener('input', preview);
  });
  $('originalReset').onclick = function () {
    return choose(selected);
  };
  $('originalLoad').onclick = function () {
    return send('source_load_selected');
  };
  $('originalInsert').onclick = function () {
    return action('source_insert');
  };
  $('originalUpdate').onclick = function () {
    return action('source_update');
  };
  var _loop = function _loop() {
    var _arr$_i = _slicedToArray(_arr[_i], 2),
      id = _arr$_i[0],
      format = _arr$_i[1];
    $(id).onclick = function () {
      return action('source_export', {
        format: format
      });
    };
  };
  for (var _i = 0, _arr = [['originalSvg', 'svg'], ['originalDxf', 'dxf'], ['originalJson', 'json'], ['originalSkp', 'skp']]; _i < _arr.length; _i++) {
    _loop();
  }
  $('originalNative').onclick = function () {
    return send('source_native_insert', {
      id: selected.id
    });
  };
  window.addEventListener('lofi-cnc-reply', function (event) {
    var reply = event.detail;
    if (reply.type === 'source_layout') {
      if (!layoutLoaded) {
        var loaded=JSON.parse(JSON.stringify(reply.layout));
        if(dirtySize)loaded.size=menuLayout.size;
        Object.keys(dirtyGroups).forEach(function (group) {loaded.order[group]=menuLayout.order[group];});
        menuLayout=loaded;
      }
      var pending=!layoutLoaded && layoutRevision>0;layoutLoaded=true;render();
      if(pending)send('source_layout_save',menuLayout);
    }
    if (reply.type === 'source_layout_saved') status('Đã lưu cách sắp xếp thư viện.');
    if (reply.type === 'source_config') {
      var item = entries.find(function (e) {
        return e.id === reply.config.id;
      });
      if (item) {
        $('originalSearch').value = '';
        $('originalGroup').value = menuGroup(item);
        render();
        show(true);
        choose(item, reply.config);
        revealSelection();
      }
    }
  });
  function focus(id) {
    var item = entries.find(function (e) {
      return e.id === id;
    });
    if (!item) return;
    $('originalSearch').value = '';
    $('originalGroup').value = menuGroup(item);
    render();
    choose(item, {
      width: item.width,
      height: window.LofiUniformInsertIndex[item.id]==='round' ? item.width : item.height,
      even_insert: !!window.LofiUniformInsertIndex[item.id],
      thickness: item.thickness,
      angle: 0,
      columns: 1,
      rows: 1,
      gap_x: 0,
      gap_y: 0,
      mirror: false,
      plane: 'xz'
    });
    revealSelection();
  }
  window.LofiOriginalCNC = {
    choose: choose,
    show: show,
    focus: focus,
    getSelected: function getSelected() {
      return selected;
    }
  };
  window.addEventListener('lofi-rhino-catalog', function () { render(false); });
  if (selected) {
    render();
    choose(selected);
    show(true);
  } else $('originalTab').disabled = true;
  send('source_layout_load');
})();
