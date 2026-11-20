function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t.return || t.return(); } finally { if (u) throw o; } } }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
(function (root) {
  'use strict';

  var G = root.LofiCNCGeometry,
    C = root.ClipperLib,
    S = 10000;
  var defaults = {
    schema: 'LOFIHOME_PANEL_295_1',
    name: 'Vách CNC 295',
    id: 'patterns__vach_001',
    width: 650,
    height: 1500,
    thickness: 17.5,
    frame: 40,
    margin: 18,
    equal_margins: true,
    left: 18,
    right: 18,
    top: 18,
    bottom: 18,
    weld: true,
    module: 220,
    angle: 0,
    offset_x: 0,
    offset_y: 0,
    mirror: false,
    bar_adjust: 0,
    mode: 'pattern',
    outline: 'rectangle',
    plane: 'xz',
    material: '#ac7546',
    items: []
  };
  function number(v, min, max, label) {
    v = Number(v);
    if (!Number.isFinite(v)) throw Error(label + ' cần là số hữu hạn.');
    if (v < min || v > max) throw Error(label + (min===0 ? ' không được âm.' : ' ngoài phạm vi hợp lệ.'));
    return v;
  }
  function positive(v,label){v=number(v,0,Infinity,label);if(v<=0)throw Error(label+' phải lớn hơn 0.');return v;}
  function usesDrawnFrame(c) {
    return c.outline === 'custom' && c.custom_fill_inner === true && Array.isArray(c.custom_holes) && c.custom_holes.length > 0;
  }
  function ownBorderLayout(c){return c.mode==='frameless' && c.border && c.border.enabled!==false && c.border.layout && c.border.layout.enabled===true;}
  function independentContent(c){return c.mode==='frameless' && (!c.border || c.border.enabled===false || ownBorderLayout(c));}
  function supportsFrameSides(c) {
    if (c.outline === 'rectangle') return true;
    if (c.outline !== 'custom' || usesDrawnFrame(c) || !Array.isArray(c.custom_outer) || c.custom_outer.length < 4) return false;
    var p = c.custom_outer;
    if (!p.every(function (v) { return Array.isArray(v) && v.length === 2 && v.every(Number.isFinite); })) return false;
    var box = G.bounds(p), w = box.x1-box.x0, h = box.y1-box.y0;
    if (!(w > 0 && h > 0 && c.width > 0 && c.height > 0)) return false;
    // Test each segment, not only its vertices or bounding box. This excludes
    // chamfers, curves, notches and sheared quadrilaterals without changing them.
    var tx = .00001*w/c.width, ty = .00001*h/c.height;
    return Math.abs(Math.abs(G.area(p))/(w*h)-1) < 1e-8 && p.every(function (a,i) {
      var b = p[(i+1)%p.length];
      return [box.x0,box.x1].some(function (x) {return Math.abs(a[0]-x)<=tx && Math.abs(b[0]-x)<=tx;}) ||
        [box.y0,box.y1].some(function (y) {return Math.abs(a[1]-y)<=ty && Math.abs(b[1]-y)<=ty;});
    });
  }
  function usesFrameSides(c) {
    return c.frame_equal === false && supportsFrameSides(c) &&
      (c.outline === 'rectangle' || c.custom_frame_sides === true);
  }
  function frameInsets(c) {
    // A captured rectangle needs explicit opt-in. Old captures can carry unused
    // side settings from a preset; loading them must never change their geometry.
    var separate = usesFrameSides(c);
    var result = {};
    ['left','right','top','bottom'].forEach(function (side) {
      result[side] = separate && c['frame_' + side] !== undefined ? c['frame_' + side] : c.frame;
    });
    return result;
  }
  // Older presets retain their margin clipping until a frame edit opts in.
  function activateFrameFollow(c, key) {
    // An explicit manual margin edit (including a region batch) chooses the
    // original sheet-relative inset. Never silently ignore that entered value.
    if (key === 'margin' || /^(left|right|top|bottom)$/.test(key)) c.follow_frame = false;
    if (c.follow_frame === undefined && (key === 'frame' || /^frame_(equal|left|right|top|bottom)$/.test(key) || (key === 'weld' && c.weld))) c.follow_frame = true;
  }
  function suggestDrawnFrame(outer, holes) {
    // Only a single, dominant opening is unambiguously a frame on fresh capture.
    // Saved settings keep their explicit mode; smaller/multiple holes remain voids.
    return Array.isArray(holes) && holes.length === 1 && Math.abs(G.area(holes[0])) >= Math.abs(G.area(outer)) * .5;
  }
  function capturedFrameInsets(c) {
    // A rectangular frame has four physical widths. Measure them from the
    // immutable capture, rather than scaling those widths with the panel.
    // Reject chamfers, curves and multiple openings: bounding boxes alone
    // must never turn a different outline into a rectangular frame.
    if (!usesDrawnFrame(c) || c.custom_holes.length !== 1) return null;
    function rectangleLoop(loop) {
      var b = G.bounds(loop);
      return supportsFrameSides({outline:'custom',custom_fill_inner:false,
        custom_outer:loop,width:b.x1-b.x0,height:b.y1-b.y0});
    }
    if (!rectangleLoop(c.custom_outer) || !rectangleLoop(c.custom_holes[0])) return null;
    var outer=G.bounds(c.custom_outer),inner=G.bounds(c.custom_holes[0]);
    var widths={left:inner.x0-outer.x0,right:outer.x1-inner.x1,
      bottom:inner.y0-outer.y0,top:outer.y1-inner.y1};
    return Object.keys(widths).every(function(k){return widths[k] > 0;}) ? widths : null;
  }
  function normalize(value) {
    var c = Object.assign({}, defaults, value || {});
    c.schema = defaults.schema;
    for (var _i = 0, _arr = [['width', 0, Infinity, 'Rộng tấm'], ['height', 0, Infinity, 'Cao tấm'], ['thickness', 0, Infinity, 'Dày tấm'], ['frame', 0, Infinity, 'Rộng khung'], ['margin', 0, Infinity, 'Khoảng lùi'], ['left', 0, Infinity, 'Lùi trái'], ['right', 0, Infinity, 'Lùi phải'], ['top', 0, Infinity, 'Lùi trên'], ['bottom', 0, Infinity, 'Lùi dưới'], ['module', 0, Infinity, 'Cỡ mô-đun'], ['angle', -360, 360, 'Góc xoay'], ['offset_x', -Infinity, Infinity, 'Dịch X'], ['offset_y', -Infinity, Infinity, 'Dịch Y'], ['bar_adjust', -Infinity, Infinity, 'Bù nan']]; _i < _arr.length; _i++) {
      var _arr$_i = _slicedToArray(_arr[_i], 4),
        key = _arr$_i[0],
        min = _arr$_i[1],
        max = _arr$_i[2],
        label = _arr$_i[3];
      c[key] = number(c[key], min, max, label);
    }
    ['width','height','thickness','module'].forEach(function(k){c[k]=positive(c[k],k==='width'?'Rộng tấm':k==='height'?'Cao tấm':k==='thickness'?'Dày tấm':'Cỡ hoa văn');});
    if (c.frame_equal !== undefined && typeof c.frame_equal !== 'boolean') throw Error('Lựa chọn khung đều 4 cạnh không hợp lệ.');
    ['left','right','top','bottom'].forEach(function (side) {
      var key = 'frame_' + side;
      if (c[key] !== undefined || c.frame_equal === false) {
        if (c[key] === null || c[key] === '' || typeof c[key] === 'boolean') throw Error('Nhập bề rộng khung hợp lệ.');
        c[key] = number(c[key] === undefined ? c.frame : c[key], 0, Infinity, 'Rộng khung ' + ({left:'trái',right:'phải',top:'trên',bottom:'dưới'})[side]);
      }
    });
    if (c.follow_frame !== undefined && typeof c.follow_frame !== 'boolean') throw Error('Lựa chọn hoa văn bám viền không hợp lệ.');
    if (c.custom_frame_sides !== undefined && typeof c.custom_frame_sides !== 'boolean') throw Error('Lựa chọn khung hình đã đọc không hợp lệ.');
    var insets = frameInsets(c);
    if (!independentContent(c) && !usesDrawnFrame(c) && (insets.left + insets.right >= c.width || insets.top + insets.bottom >= c.height)) throw Error('Tổng khung trái + phải phải nhỏ hơn rộng tấm; trên + dưới phải nhỏ hơn cao tấm.');
    if (!['pattern', 'solid', 'hollow', 'frameless'].includes(c.mode) || !['rectangle', 'arch', 'custom'].includes(c.outline)) throw Error('Chế độ tấm không hợp lệ.');
    if (c.mode === 'hollow' && !Math.max(insets.left,insets.right,insets.top,insets.bottom) && !usesDrawnFrame(c)) throw Error('Khung rỗng cần bề rộng khung lớn hơn 0.');
    c.name = String(c.name || defaults.name).slice(0, 100);
    c.id = String(c.id);
    // Imported B91 keeps one complete panel by default; other presets are untouched.
    if(c.id==='patterns__dvd24_b091'){
      ['b91_single_panel','b91_lock_ratio'].forEach(function(key){
        if(c[key]!==undefined && typeof c[key]!=='boolean')throw Error('Lựa chọn bố cục/tỷ lệ B91 không hợp lệ.');
        c[key]=c[key]!==false;
      });
    }
    // B-063 is a complete panel; saved legacy tile layouts keep their behavior.
    if(c.id==='patterns__capnhat_b-063'){
      ['b063_single_panel','b063_lock_ratio'].forEach(function(key){
        if(c[key]!==undefined && typeof c[key]!=='boolean')throw Error('Lựa chọn bố cục/tỷ lệ B-063 không hợp lệ.');
      });
      c.b063_single_panel=c.b063_single_panel===true;
      c.b063_lock_ratio=c.b063_lock_ratio!==false;
    }
    c.plane = c.plane === 'xy' ? 'xy' : 'xz';
    c.material = /^#[\da-f]{6}$/i.test(c.material) ? c.material : defaults.material;
    ['equal_margins', 'weld', 'mirror'].forEach(function (k) {
      return c[k] = !!c[k];
    });
    c.custom_lock = c.custom_lock !== false;
    c.custom_place = !!c.custom_place;
    c.custom_fill_inner = c.custom_fill_inner === true;
    var frameAdjust = number(c.custom_frame_adjust === undefined ? 0 : c.custom_frame_adjust, -Infinity, Infinity, 'Bù dày/mỏng khung');
    if (frameAdjust) c.custom_frame_adjust = frameAdjust; else delete c.custom_frame_adjust;
    if (c.outline === 'custom') {
      c.custom_outer = G.validateLoop(c.custom_outer, 'Biên dạng đã đọc');
      c.custom_holes = c.custom_holes || [];
      if (c.custom_fill_inner && !c.custom_holes.length) throw Error('Đọc cả viền ngoài và viền trong của khung trước khi lồng hoa văn.');
      if (!Array.isArray(c.custom_holes) || c.custom_holes.length > 100) throw Error('Biên dạng có quá nhiều lỗ.');
      c.custom_holes = c.custom_holes.map(function (h) { return G.validateLoop(h, 'Lỗ trong biên dạng'); });
      c.custom_holes.forEach(function (h, i) {
        if (!G.fits(h, c.custom_outer, .01)) throw Error('Lỗ phải nằm hoàn toàn trong biên dạng, không chạm mép.');
        for (var j = 0; j < i; j++) if (!G.separated(h, c.custom_holes[j], .01)) throw Error('Các lỗ trong biên dạng chạm hoặc chồng nhau.');
      });
      if (c.custom_holes.reduce(function (n, h) { return n + h.length; }, c.custom_outer.length) > 5000) throw Error('Biên dạng quá nhiều điểm.');
    }
    if (!Array.isArray(c.items) || c.items.length > 24) throw Error('Tối đa 24 họa tiết chèn/đục.');
    if (c.smoothing !== undefined) c.smoothing = root.LofiPanelSmoothing.normalize(c.smoothing);
    c.items = c.items.map(function (v, i) {
      var normalized = {
        id: String(v.id),
        uid: String(v.uid || i),
        mode: ['inlay', 'union', 'cut', 'raised', 'background'].includes(v.mode) ? v.mode : 'union',
        x: number(v.x, -Infinity, Infinity, 'Tâm X'),
        y: number(v.y, -Infinity, Infinity, 'Tâm Y'),
        width: positive(v.width, 'Rộng họa tiết'),
        height: positive(v.height, 'Cao họa tiết'),
        angle: number(v.angle || 0, -360, 360, 'Xoay họa tiết'),
        mirror: !!v.mirror,
        lock: v.lock !== false,
        depth: positive(v.depth === undefined ? 5 : v.depth, 'Độ nổi')
      };
      var rim = number(v.rim_adjust === undefined ? 0 : v.rim_adjust, -Infinity, Infinity, 'Bù viền họa tiết');
      if (rim) normalized.rim_adjust = rim;
      if(v.even_insert!==undefined){
        if(v.even_insert!==true || normalized.mode==='cut')throw Error('Làm đều chỉ dùng cho họa tiết chèn.');
        normalized.even_insert=true;
      }
      ['inner_rim_mm','outer_rim_mm'].forEach(function(k){
        if(v[k]===undefined)return;
        if(normalized.mode==='cut' || typeof v[k]!=='number' || !Number.isFinite(v[k]))throw Error('Viền trong/ngoài chỉ dùng cho họa tiết chèn.');
        normalized[k]=positive(v[k],k==='inner_rim_mm'?'Viền trong (mm)':'Viền ngoài (mm)');
      });
      if(v.inner_scale !== undefined){
        if(v.inner_scale !== true || normalized.inner_rim_mm === undefined)throw Error('Cần có bề rộng viền trong để đổi tỷ lệ phần tâm.');
        normalized.inner_scale = true;
      }
      if(v.inner_gap!==undefined){
        if(normalized.mode==='cut' || typeof v.inner_gap!=='number')throw Error('Khe trong chỉ dùng cho họa tiết chèn.');
        normalized.inner_gap=number(v.inner_gap,6.1,Infinity,'Khe trong họa tiết (mm)');
        if(v.inner_gap_scope!==undefined){
          if(v.inner_gap_scope!=='rim' && v.inner_gap_scope!=='all')throw Error('Phạm vi chỉnh khe không hợp lệ.');
          normalized.inner_gap_scope=v.inner_gap_scope;
          if(v.inner_gap_bridge!==undefined){
            if(v.inner_gap_scope!=='rim' || typeof v.inner_gap_bridge!=='number')throw Error('Cầu nối chỉ dùng cho viền hồi văn.');
            normalized.inner_gap_bridge=positive(v.inner_gap_bridge,'Bề rộng cầu nối (mm)');
          }
        }
      }
      if (c.smoothing !== undefined) normalized.smoothing = Object.assign({},c.smoothing);
      return normalized;
    });
    if (c.border !== undefined) c.border = root.LofiCNCBorder.normalize(c.border);
    return c;
  }
  var toPaths = function toPaths(loops) {
    return loops.map(function (loop) {
      return loop.map(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
          x = _ref2[0],
          y = _ref2[1];
        return {
          X: Math.round(x * S),
          Y: Math.round(y * S)
        };
      });
    });
  };
  var fromPath = function fromPath(path) {
    return path.map(function (p) {
      return [p.X / S, p.Y / S];
    });
  };
  var partitionCache=new WeakMap();
  function bool(a, b, kind, keepParts) {
    if (!a.length) return kind === 'union' ? b : [];
    if (!b.length && kind !== 'union') return kind === 'difference' ? a : [];
    var e = new C.Clipper(C.Clipper.ioStrictlySimple),
      result = keepParts ? new C.PolyTree() : [];
    e.AddPaths(a, C.PolyType.ptSubject, true);
    if (b.length) e.AddPaths(b, C.PolyType.ptClip, true);
    if (!e.Execute(C.ClipType['ct' + kind[0].toUpperCase() + kind.slice(1)], result, C.PolyFillType.pftNonZero, C.PolyFillType.pftNonZero)) throw Error('Không xử lý được đường biên.');
    if(keepParts){var paths=C.Clipper.PolyTreeToPaths(result);partitionCache.set(paths,partsFromTree(result));return paths;}
    return result;
  }
  function offset(paths, mm) {
    if (!mm) return paths;
    var out = [],
      engine = new C.ClipperOffset(2, .01 * S);
    engine.AddPaths(paths, C.JoinType.jtMiter, C.EndType.etClosedPolygon);
    engine.Execute(out, mm * S);
    return out;
  }
  function adjustedFrameInner(c, inner, boundary) {
    var delta=c.custom_frame_adjust || 0;
    if (!delta || !usesDrawnFrame(c) || c.mode==='solid') return inner;
    // Work in physical millimetres after resizing; never overwrite the captured
    // outer/inner contours. Positive adds material into each existing opening.
    var adjusted=inner.map(function (path) {
      var next=offset([path],-delta);
      if (next.length!==1 || Math.abs(area(next))<.0001) throw Error('Khung quá dày làm mất hoặc tách ô bên trong. Giảm mức bù.');
      return next[0];
    });
    var safe=offset(boundary,-.05);
    if (!safe.length || Math.abs(area(bool(adjusted,safe,'difference')))>.000001) throw Error('Khung quá mỏng hoặc viền trong vượt mép ngoài. Giảm mức bù âm.');
    var expanded=adjusted.map(function (p) {return offset([p],.025);});
    for (var i=0;i<adjusted.length;i++) for (var j=0;j<i;j++) {
      if (Math.abs(area(bool(expanded[i],expanded[j],'intersection')))>.000001) throw Error('Khung giữa các ô quá mỏng hoặc các ô chạm nhau. Giảm mức bù âm.');
    }
    return adjusted;
  }
  function borderCenter(c, info, inner) {
    // Measure from the inward extent of the unchanged motif, replacing the
    // old radial padding rather than adding that padding to the requested rim.
    var f=c.border.inner_frame,center=[],rectangular=true,defaults=[];
    info.cores.forEach(function(core){
      var b=G.bounds(core.outer),w=b.x1-b.x0,h=b.y1-b.y0;
      var rectangularCore=supportsFrameSides({outline:'custom',custom_outer:core.outer,width:w,height:h});
      rectangular=rectangular && rectangularCore;defaults.push(c.border.width-core.depth);
      var next=core.inside;
      if(f){
        if(!f.equal && !rectangularCore)throw Error('Chỉnh riêng viền trong 4 cạnh cần ô chữ nhật. Bật Dùng chung viền trong cho biên cong hoặc xiên.');
        if(rectangularCore){
          var l=core.depth+(f.equal ? f.width : f.left),r=core.depth+(f.equal ? f.width : f.right),
              t=core.depth+(f.equal ? f.width : f.top),d=core.depth+(f.equal ? f.width : f.bottom);
          if(c.border.omit_left)l=0;if(c.border.omit_right)r=0;
          if(c.border.omit_top)t=0;if(c.border.omit_bottom)d=0;
          if(w-l-r<=.01 || h-t-d<=.01)throw Error('Viền trong quá dày làm hết lỗ rỗng. Giảm rộng viền trong.');
          next=rectangle(b.x0+l,b.y0+d,w-l-r,h-t-d);
        }else{
          next=root.LofiCNCBorder.hasOmissions(c.border) ? root.LofiCNCBorder.centerWithSides(core.outer,core.depth+f.width,c.border,{G:G,toPaths:toPaths,parts:parts,bool:bool,area:area}) : offset(toPaths([core.outer]),-(core.depth+f.width));
          if(parts(next).length!==1 || parts(next)[0].holes.length)throw Error('Viền trong quá dày làm mất hoặc tách ô giữa.');
        }
      }
      next=bool(next,toPaths([core.outer].concat(core.holes)),'intersection');
      if(!next.length || Math.abs(area(next))<.001)throw Error('Không còn vùng giữa sau khi chỉnh viền trong.');
      center=center.concat(next);
    });
    center=bool(bool(center,[],'union'),inner,'intersection');
    if(Math.abs(area(bool(center,info.cuts,'intersection')))>.001)throw Error('Viền trong quá mỏng tại góc. Tăng rộng viền trong.');
    return {paths:center,rectangular:rectangular,default_width:Math.min.apply(null,defaults)};
  }
  function rectangle(x, y, w, h) {
    return toPaths([[[x, y], [x + w, y], [x + w, y + h], [x, y + h]]]);
  }
  // Photo 33 only: four equal clear-height bays, independent of module size.
  function photo33PanelPattern(c, data, insets) {
    var grid=data.photo33_grid, bar=Number(grid.bar), finalBar=bar+c.bar_adjust;
    var width=c.width-insets.left-insets.right;
    var height=c.height-insets.top-insets.bottom;
    if(!(finalBar>0) || !(height>3*finalBar) || !(width>bar))
      throw Error('Vách 33: lòng khung phải đủ chỗ cho 3 thanh ngang.');
    var stepX=width/grid.columns, pitch=(height+finalBar)/4, stepY=pitch/grid.rows;
    var originY=insets.bottom-finalBar/2, paths=[];
    function line(x0,y0,x1,y1) {
      if(c.mirror){x0=grid.columns-x0;x1=grid.columns-x1;}
      var ax=insets.left+x0*stepX,bx=insets.left+x1*stepX;
      var ay=originY+y0*stepY,by=originY+y1*stepY;
      paths=paths.concat(rectangle(Math.min(ax,bx)-bar/2,Math.min(ay,by)-bar/2,
        Math.abs(bx-ax)+bar,Math.abs(by-ay)+bar));
    }
    for(var bay=0;bay<4;bay++) {
      grid.horizontal.forEach(function(spans,row){spans.forEach(function(span){
        var y=bay*grid.rows+grid.rows-row;line(span[0],y,span[1],y);
      });});
      grid.vertical.forEach(function(xs,row){xs.forEach(function(x){
        line(x,bay*grid.rows+grid.rows-row,x,bay*grid.rows+grid.rows-row-1);
      });});
    }
    return bool(paths,[],'union');
  }
  function template(data) {
    if (!data || !Array.isArray(data.parts)) throw Error('Thiếu dữ liệu mẫu.');
    var loops = [];
    var _iterator = _createForOfIteratorHelper(data.parts),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var p = _step.value;
        loops.push(G.area(p.outer) > 0 ? p.outer : p.outer.slice().reverse());
        var _iterator2 = _createForOfIteratorHelper(p.holes),
          _step2;
        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var h = _step2.value;
            loops.push(G.area(h) < 0 ? h : h.slice().reverse());
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    return loops;
  }
  function transform(loops, data, w, h, x, y, angle, mirror) {
    var a = angle * Math.PI / 180,
      cos = Math.cos(a),
      sin = Math.sin(a);
    return toPaths(loops.map(function (loop) {
      var result = loop.map(function (_ref3) {
        var _ref4 = _slicedToArray(_ref3, 2),
          u = _ref4[0],
          v = _ref4[1];
        u = (u / data.width - .5) * w * (mirror ? -1 : 1);
        v = (v / data.height - .5) * h;
        return [x + u * cos - v * sin, y + u * sin + v * cos];
      });
      return mirror ? result.reverse() : result;
    }));
  }
  function area(paths) {
    return paths.reduce(function (sum, p) {
      return sum + C.Clipper.Area(p) / (S * S);
    }, 0);
  }
  function parts(paths) {
    if(partitionCache.has(paths))return partitionCache.get(paths);
    var engine = new C.Clipper(C.Clipper.ioStrictlySimple),
      tree = new C.PolyTree();
    engine.AddPaths(paths, C.PolyType.ptSubject, true);
    engine.Execute(C.ClipType.ctUnion, tree, C.PolyFillType.pftNonZero, C.PolyFillType.pftNonZero);
    return partsFromTree(tree);
  }
  function partsFromTree(tree) {
    var out = [];
    function walk(node) {
      var _iterator3 = _createForOfIteratorHelper(node.Childs()),
        _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var child = _step3.value;
          if (!child.IsHole()) out.push({
            outer: fromPath(child.Contour()),
            holes: child.Childs().filter(function (n) {
              return n.IsHole();
            }).map(function (n) {
              return fromPath(n.Contour());
            })
          });
          walk(child);
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
    }
    walk(tree);
    return out;
  }
  // A hole tangent to a corner can survive both axis cuts: the contact is
  // then an extremum in X and Y. Split through the wedge between incident
  // walls. Only the solid construction is partitioned, not the cut contours.
  function splitCornerContact(loops,point,box) {
    var subject=toPaths(loops),origin=toPaths([[point]])[0][0];
    var reach=2*S*(1+Math.hypot(box.x1-box.x0,box.y1-box.y0));
    var directions=[];
    loops.slice(1).concat([loops[0]]).forEach(function(loop){
      loop.forEach(function(v,i){
        if(v[0]!==point[0] || v[1]!==point[1])return;
        var count=loop.length,prev=loop[(i+count-1)%count],next=loop[(i+1)%count];
        var a=[prev[0]-v[0],prev[1]-v[1]],b=[next[0]-v[0],next[1]-v[1]];
        var al=Math.hypot(a[0],a[1]),bl=Math.hypot(b[0],b[1]);
        if(!al || !bl)return;
        var x=a[0]/al+b[0]/bl,y=a[1]/al+b[1]/bl;
        if(Math.hypot(x,y)<1e-8){x=-a[1];y=a[0];}
        directions.push([x,y]);
      });
    });
    for(var direction of directions){
      var len=Math.hypot(direction[0],direction[1]);
      var dx=Math.round(reach*direction[0]/len),dy=Math.round(reach*direction[1]/len);
      var a={X:origin.X-dx,Y:origin.Y-dy},b={X:origin.X+dx,Y:origin.Y+dy};
      var halves=[1,-1].map(function(side){
        var nx=-dy*side,ny=dx*side;
        var clip=[a,b,{X:b.X+nx,Y:b.Y+ny},{X:a.X+nx,Y:a.Y+ny}];
        return parts(bool(subject,[clip],'intersection'));
      });
      if(!halves[0].length || !halves[1].length)continue;
      var children=halves[0].concat(halves[1]);
      var resolved=children.every(function(child){
        var occurrences=0;
        [child.outer].concat(child.holes).forEach(function(loop){
          loop.forEach(function(q){if(q[0]===point[0] && q[1]===point[1])occurrences++;});
        });
        return occurrences<=1;
      });
      if(resolved)return children;
    }
    throw Error('Không tách được điểm chạm của họa tiết thành khối kín.');
  }
  function solidParts(paths) {
    var pending = parts(paths).map(function (p) {
        return {
          p: p,
          depth: 0
        };
      }),
      result = [];
    var _loop = function _loop() {
      var _pending$pop = pending.pop(),
        p = _pending$pop.p,
        depth = _pending$pop.depth,
        loops = [p.outer].concat(_toConsumableArray(p.holes)),
        seen = new Map(),
        contacts = [];
      var _iterator4 = _createForOfIteratorHelper(loops.flat()),
        _step4;
      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          var point = _step4.value;
          var key = point.join(',');
          if (seen.has(key)) contacts.push(point);
          seen.set(key, true);
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
      if (!contacts.length) {
        result.push(p);
        return 1;
      }
      if (depth > 8) throw Error('Biên có nhiều điểm chạm. Chỉnh dịch X/Y hoặc bù nan để tách điểm chạm.');
      var b = G.bounds(p.outer),
        ranges = [[b.x0, b.x1], [b.y0, b.y1]],
        cuts = ranges.map(function (_ref5, axis) {
          var _ref6 = _slicedToArray(_ref5, 2),
            lo = _ref6[0],
            hi = _ref6[1];
          return [lo].concat(_toConsumableArray(new Set(contacts.map(function (q) {
            return q[axis];
          }).filter(function (v) {
            return v > lo + 1e-7 && v < hi - 1e-7;
          })))).concat(hi).sort(function (a, b) {
            return a - b;
          });
        });
      var axis = cuts[1].length > 2 && (cuts[0].length === 2 || cuts[1].length <= cuts[0].length) ? 1 : 0;
      if (cuts[axis].length === 2) {
        splitCornerContact(loops,contacts[0],b).forEach(function(child){pending.push({p:child,depth:depth+1});});
        if(pending.length+result.length>1024)throw Error('Quá nhiều điểm chạm; chỉnh cỡ mô-đun hoặc bù nan.');
        return;
      }
      for (var i = 0; i < cuts[axis].length - 1; i++) {
        var lo = cuts[axis][i],
          hi = cuts[axis][i + 1],
          rect = axis === 0 ? rectangle(lo, b.y0, hi - lo, b.y1 - b.y0) : rectangle(b.x0, lo, b.x1 - b.x0, hi - lo);
        var _iterator5 = _createForOfIteratorHelper(parts(bool(toPaths(loops), rect, 'intersection'))),
          _step5;
        try {
          for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
            var q = _step5.value;
            pending.push({
              p: q,
              depth: depth + 1
            });
          }
        } catch (err) {
          _iterator5.e(err);
        } finally {
          _iterator5.f();
        }
      }
      if (pending.length + result.length > 1024) throw Error('Quá nhiều điểm chạm; chỉnh cỡ mô-đun hoặc bù nan.');
    };
    while (pending.length) {
      if (_loop()) continue;
    }
    return result;
  }
  // Offset only the outermost rim. Interior hole contours and nested glyph
  // islands remain fixed, so lettering is not thickened along with the rim.
  function insertSource(item,source){
    if(!item.even_insert)return source;
    if(!source.even)throw Error('Chưa nạp được đường bao đã làm đều của họa tiết.');
    return source.even;
  }
  function itemPathsRaw(item, source) {
    source=insertSource(item,source);
    var delta = number(item.rim_adjust === undefined ? 0 : item.rim_adjust, -Infinity, Infinity, 'Bù viền họa tiết');
    if (!delta) return transform(template(source), source, item.width, item.height, item.x, item.y, item.angle, item.mirror);
    if (item.mode === 'cut') throw Error('Bù viền chỉ áp dụng cho họa tiết chèn.');
    var all = [], changed = 0;
    source.parts.forEach(function (part, index) {
      var loops = template({parts:[part]}), moved = transform(loops, source, item.width, item.height, item.x, item.y, item.angle, item.mirror);
      var nested = source.parts.some(function (other, otherIndex) {
        return otherIndex !== index && Math.abs(G.area(other.outer)) > Math.abs(G.area(part.outer)) && G.fits(part.outer, other.outer, .00001);
      });
      if (part.holes.length && !nested) {
        var edge = offset([moved[0]], delta);
        if (edge.length !== 1) throw Error('Viền quá mỏng hoặc bị tách. Giảm mức bù âm.');
        if (delta < 0) {
          var holes = moved.slice(1).map(function (h) {return h.slice().reverse();});
          var safe = offset(edge, -.05);
          if (!safe.length || Math.abs(area(bool(holes, safe, 'difference'))) > .00001) {
            throw Error('Viền quá mỏng, có thể đứt vào nét chữ. Giảm mức bù âm.');
          }
        }
        moved[0] = edge[0];changed++;
      }
      all = all.concat(moved);
    });
    if (!changed) throw Error('Mẫu này không có viền kín để chỉnh. Đặt Bù viền về 0.');
    return all;
  }
  function smoothActive(value) {return !!value && root.LofiPanelSmoothing.active(value);}
  function smoothPaths(paths,settings,protectedPaths) {
    if(!smoothActive(settings))return paths;
    return root.LofiPanelSmoothing.paths(paths,settings,protectedPaths,{parts:parts,toPaths:toPaths,bool:bool,area:area});
  }
  function protectFrame(changed,original,inner) {
    return bool(bool(changed,inner,'intersection'),bool(original,inner,'difference'),'union');
  }
  var slotCache=new WeakMap(),slotOrder=[];
  function rememberItem(source,hit){
    var entries=(slotCache.get(source)||[]).filter(function(e){return e.key!==hit.key;});
    entries.unshift(hit);entries=entries.slice(0,6);slotCache.set(source,entries);
    slotOrder=slotOrder.filter(function(e){return e.hit!==hit && !(e.source===source && (e.hit.key===hit.key || entries.indexOf(e.hit)<0));});
    var vertices=hit.paths.reduce(function(n,p){return n+p.length;},0);
    if(hit.display)vertices+=hit.display.parts.reduce(function(n,p){return n+p.outer.length+p.holes.reduce(function(n,h){return n+h.length;},0);},0);
    slotOrder.unshift({source:source,hit:hit,vertices:vertices});
    var total=slotOrder.reduce(function(n,e){return n+e.vertices;},0);
    while(slotOrder.length>24 || total>120000){
      var old=slotOrder.pop();total-=old.vertices;
      slotCache.set(old.source,(slotCache.get(old.source)||[]).filter(function(e){return e!==old.hit;}));
    }
  }
  function hasMargins(i){return i.inner_rim_mm!==undefined || i.outer_rim_mm!==undefined;}
  function localItem(item,source,needMeasure){
    var entries=slotCache.get(source)||[],key=JSON.stringify([item.width,item.height,item.rim_adjust||0,item.inner_gap,item.inner_gap_scope||'all',item.inner_gap_bridge,item.smoothing||null,item.inner_rim_mm,item.outer_rim_mm,!!item.inner_scale,!!item.even_insert]);
    var hit=entries.find(function(e){return e.key===key;}),kit={parts:parts,bool:bool,toPaths:toPaths,offset:offset};
    if(!hit){
      var local=Object.assign({},item,{x:0,y:0,angle:0,mirror:false});
      var original=smoothPaths(itemPathsRaw(local,source),item.smoothing,[]);
      if(item.inner_gap){
        var tool=item.inner_gap_scope==='rim'?root.LofiInsertRing:root.LofiItemClearance;
        hit=tool.apply(original,item.inner_gap,kit,item.inner_gap_bridge,!!item.even_insert);
      }else hit={paths:original,warnings:[]};
      hit.key=key;
      rememberItem(source,hit);
    }
    if((needMeasure || hasMargins(item)) && !Object.prototype.hasOwnProperty.call(hit,'dimensions')){
      var measured=root.LofiInsertRing.margins(hit.paths,item.inner_rim_mm,item.outer_rim_mm,kit,item.inner_scale);
      if(measured.centreFactor<1 && item.inner_gap && item.inner_gap_scope!=='rim'){
        var check=root.LofiItemClearance.apply(measured.paths,item.inner_gap,kit);
        if(check.changed || check.warnings.length)throw Error('Thu nhỏ phần tâm sẽ làm khe không đủ cho dao 6 mm. Giảm bề rộng viền trong.');
      }
      hit.paths=measured.paths;hit.dimensions=measured.dimensions;
    }
    rememberItem(source,hit);return hit;
  }
  function rimDimensions(item,source){return localItem(item,source,true).dimensions;}
  function itemPaths(item,source,warnings,notes) {
    if(!item.inner_gap && !hasMargins(item) && !smoothActive(item.smoothing))return itemPathsRaw(item,source);
    // Work in local physical millimetres; rotation/mirroring must not change
    // which vertices are extrema or how the smoothing tool treats a corner.
    var hit=localItem(item,source,false),paths=hit.paths;
    if(warnings)hit.warnings.forEach(function(message){warnings.push(message);});
    if(notes && hit.bridge)notes.push(hit.changed+' khe viền · Cầu nối chia đều ≈ '+hit.bridge.toFixed(2).replace('.',',')+' mm.');
    var angle=item.angle*Math.PI/180,cs=Math.cos(angle),sn=Math.sin(angle);
    return paths.map(function(path){
      var moved=path.map(function(p){var x=p.X/10000*(item.mirror?-1:1),y=p.Y/10000;return {X:Math.round((item.x+x*cs-y*sn)*10000),Y:Math.round((item.y+x*sn+y*cs)*10000)};});
      return item.mirror?moved.reverse():moved;
    });
  }
  function itemParts(item, source) { return parts(itemPaths(item,source)); }
  function itemDisplaySource(item, source) {
    if (!item.inner_gap && !hasMargins(item) && !item.rim_adjust && !smoothActive(item.smoothing)) return insertSource(item,source);
    var local=Object.assign({},item,{x:0,y:0,angle:0,mirror:false});
    var cached=localItem(local,source,false);
    if(cached.display)return cached.display;
    var shift=function (loop) {return loop.map(function (p) {return [p[0]+item.width/2,p[1]+item.height/2];});};
    cached.display={width:item.width,height:item.height,parts:itemParts(local,source).map(function (part) {
      return {outer:shift(part.outer),holes:part.holes.map(shift)};
    })};
    rememberItem(source,cached);return cached.display;
  }
  function buildItem(input,index,assets) {
    var config=normalize(input),item=Object.assign({},config.items[index]);
    if (!item.id || !assets[item.id]) throw Error('Chọn họa tiết đã nạp để tạo riêng.');
    item.x=item.width/2;item.y=item.height/2;
    var depth=item.mode==='raised' ? item.depth : config.thickness;
    var warnings=[],paths=bool(itemPaths(item,assets[item.id],warnings),[],'union');
    var contours=parts(paths).map(function(p){return {z:0,loops:[p.outer].concat(p.holes)};});
    var solids=solidParts(paths).map(function (p) {
      return {loops:[p.outer].concat(p.holes),mesh:G.triangulate(p.outer,p.holes),z:0,depth:depth,
        area:Math.abs(G.area(p.outer))-p.holes.reduce(function (n,h) {return n+Math.abs(G.area(h));},0)};
    });
    solids.forEach(function (s) {
      s.mesh.triangulate_sides=true;
      if(item.even_insert || item.inner_gap_scope==='rim' || hasMargins(item))s.mesh.contour_prism=true;
    });
    // A saved standalone item must rebuild as that same item, rather than
    // restoring the originating panel, running border or captured regions.
    if(item.mode==='cut')item.mode='union';
    config.items=[item];config.mode='frameless';config.outline='rectangle';
    config.width=item.width;config.height=item.height;
    config.frame=0;config.frame_equal=true;config.margin=0;config.equal_margins=true;
    ['left','right','top','bottom'].forEach(function(side){config[side]=0;delete config['frame_'+side];});
    Object.keys(config).forEach(function(k){if(/^custom_|^region_|^_region_local$/.test(k))delete config[k];});
    delete config.border;
    config.custom_place=false;
    return {config:config,solids:solids,contours:contours,warnings:warnings};
  }
  // Match the two real insert segments meeting at each final wall vertex.
  // Keep this transient index out of previews, DXF, configs and library data.
  function insertWallIndex() {
    var layers = new Map();
    function pointKey(x, y) { return Math.round(x) + ',' + Math.round(y); }
    function corner(keys, i) {
      var before = keys[(i + keys.length - 1) % keys.length];
      var after = keys[(i + 1) % keys.length];
      return keys[i] + '|' + (before < after ? before + '|' + after : after + '|' + before);
    }
    function record(paths, z, dx, dy) {
      var set = layers.get(z);
      if (!set) { set = new Set(); layers.set(z, set); }
      paths.forEach(function(path) {
        var keys = path.map(function(p) { return pointKey(p.X + dx*S, p.Y + dy*S); });
        keys.forEach(function(_, i) { set.add(corner(keys, i)); });
      });
    }
    function mark(mesh, z) {
      var set = layers.get(z);
      if (!set || !mesh) return;
      var indices = [], offset = 0;
      mesh.loops.forEach(function(loop) {
        var keys = loop.map(function(p) { return pointKey(p[0]*S, p[1]*S); });
        keys.forEach(function(_, i) { if (set.has(corner(keys, i))) indices.push(offset+i); });
        offset += loop.length;
      });
      if (indices.length) mesh.insert_wall_vertices = indices;
    }
    return {record:record, mark:mark};
  }
  // One bounded tiled-pattern cache. Item positioning, thickness and material
  // do not change this clipped pattern. Exact serialized geometry is the key.
  var patternCache=null;
  function copyPaths(paths){return paths.map(function(p){return p.map(function(q){return {X:q.X,Y:q.Y};});});}
  function build(input, assets, meshRequested, recordRegionInsert) {
    var meshRequired = meshRequested === undefined ? true : meshRequested;
    var c = normalize(input),
      data = assets[c.id];
    var wallIndex = meshRequired && !recordRegionInsert ? insertWallIndex() : null;
    if (!data) throw Error('Chưa nạp mẫu vách.');
    // The reviewed revision has 38,840 effective vertices. Keep every other
    // sample at the existing 35k 3D bound and keep the 200k 2D bound unchanged.
    var meshPointLimit=35000,sourceMeta=data.source_metadata;
    if(c.id==='patterns__capnhat_b-063' && data.id===c.id && data.revision===2 &&
       data.build_from_contours===true && sourceMeta &&
       sourceMeta.source_sample_id==='b-063' && sourceMeta.source_revision===2 &&
       sourceMeta.source_json_sha256==='1e41c874e93b78f9a7669684d723dfdb7c2a0ae1478c026b1efbba9ca80c602a')meshPointLimit=40000;
    var outer = [[0, 0], [c.width, 0], [c.width, c.height], [0, c.height]];
    if (c.outline === 'arch') {
      var rise = Math.min(c.width / 2, c.height * .35);
      outer = [[0, 0], [c.width, 0], [c.width, c.height - rise]].concat(Array.from({
        length: 33
      }, function (_, i) {
        return [c.width / 2 + c.width / 2 * Math.cos(i * Math.PI / 32), c.height - rise + rise * Math.sin(i * Math.PI / 32)];
      }));
    }
    var customHoles = [];
    if (c.outline === 'custom') {
      var _b = G.bounds(c.custom_outer);
      var scaleOutline = function (loop) { return loop.map(function (_ref7) {
        var _ref8 = _slicedToArray(_ref7, 2),
          x = _ref8[0],
          y = _ref8[1];
        return [(x - _b.x0) * c.width / (_b.x1 - _b.x0), (y - _b.y0) * c.height / (_b.y1 - _b.y0)];
      }); };
      outer = scaleOutline(c.custom_outer);
      customHoles = c.custom_holes.map(function (h) { return scaleOutline(h).reverse(); });
      var capturedWidths=capturedFrameInsets(c);
      if (capturedWidths && c.mode !== 'solid' && !independentContent(c)) {
        var left=capturedWidths.left,right=capturedWidths.right,
            top=capturedWidths.top,bottom=capturedWidths.bottom;
        if (c.width-left-right <= .05 || c.height-top-bottom <= .05)
          throw Error('Kích thước mới quá nhỏ để giữ bề rộng khung gốc. Tăng ngang/cao; không tự kéo mỏng khung.');
        customHoles=[[[left,bottom],[c.width-right,bottom],
          [c.width-right,c.height-top],[left,c.height-top]].reverse()];
      }
    }
    var insets = frameInsets(c);
    var drawnFrame = usesDrawnFrame(c),
      boundary = toPaths([G.validateLoop(outer, 'Biên tấm')].concat(drawnFrame ? [] : customHoles)),
      inner = independentContent(c) ? boundary : drawnFrame ? toPaths(customHoles.map(function (h) { return h.slice().reverse(); })) : usesFrameSides(c) ? rectangle(insets.left, insets.bottom, c.width-insets.left-insets.right, c.height-insets.top-insets.bottom) : offset(boundary, -c.frame),
      frame;
    if (usesFrameSides(c) && customHoles.length && !independentContent(c)) {
      // Side widths address the outer rectangle only. Keep void holes and the
      // existing uniform frame around those holes; never fill the source voids.
      inner = bool(inner, offset(toPaths(customHoles.map(function (h) { return h.slice().reverse(); })), c.frame), 'difference');
    }
    if (drawnFrame && !independentContent(c)) inner=adjustedFrameInner(c,inner,boundary);
    frame = drawnFrame || Math.max(insets.left,insets.right,insets.top,insets.bottom) ? bool(boundary, inner, 'difference') : [];
    var l = c.equal_margins ? c.margin : c.left,
      r = c.equal_margins ? c.margin : c.right,
      t = c.equal_margins ? c.margin : c.top,
      b = c.equal_margins ? c.margin : c.bottom;
    var followsFrame = c.weld && c.follow_frame === true;
    if (!independentContent(c) && !drawnFrame && !followsFrame && (l + r >= c.width || t + b >= c.height)) throw Error('Khoảng lùi chiếm hết vùng hoa văn.');
    // In drawn-frame mode the selected inner contour is the exact clipping
    // region, with only explicit custom_frame_adjust moving its inner edge.
    // Generic numeric frame/margin fields never replace the captured contours.
    // Overlap welded pattern ends 0.02 mm into the existing frame. This prevents
    // integer clipping round-off from leaving hairline gaps along curved edges;
    // the overlap is entirely within material already occupied by the frame.
    // Clip the same fixed-scale tiles against the actual opening. The 0.02 mm
    // overlap lies inside the existing frame, including curved/unequal sides.
    var region = independentContent(c) ? boundary : (drawnFrame || followsFrame) ? (c.weld ? bool(offset(inner, .02), boundary, 'intersection') : inner) : bool(offset(boundary, -Math.min(l, r, t, b)), rectangle(l, b, c.width - l - r, c.height - t - b), 'intersection');
    if (!c.weld) region = bool(region, inner, 'intersection');
    var pattern = [],
      tiles = 0;
    var frameless=c.mode==='frameless';
    var centerMode=frameless ? 'hollow' : c.border && c.border.enabled && c.border.center_mode && c.border.center_mode!=='inherit' ? c.border.center_mode : c.mode;
    // Reject a misplaced rim before spending time tiling a large background.
    if(!frameless&&!(c.border&&c.border.enabled))c.items.forEach(function(item,index){
      if(hasMargins(item)&&assets[item.id]&&bool(itemPaths(item,assets[item.id]),item.mode==='inlay'?inner:boundary,'difference').length)
        throw Error('Họa tiết '+(index+1)+' vượt khung hoặc mép tấm. Chọn họa tiết rồi bấm Căn giữa, hoặc chỉnh lại kích thước/vị trí.');
    });
    if (centerMode === 'pattern') {
      var patternKey=JSON.stringify([data,c.width,c.height,c.module,c.angle,c.mirror,c.offset_x,c.offset_y,c.bar_adjust,region]);
      if(c.id==='patterns__dvd24_b091')patternKey+='|b91single:'+(c.b91_single_panel!==false);
      if(c.id==='patterns__capnhat_b-063')patternKey+='|b063single:'+(c.b063_single_panel===true);
      if(patternCache&&patternCache.key===patternKey){pattern=copyPaths(patternCache.paths);tiles=patternCache.tiles;}
      else {
      if(c.id==='patterns__vach_anh_033' && data.photo33_grid && c.outline==='rectangle' && !drawnFrame) {
        pattern=photo33PanelPattern(c,data,insets);tiles=4;
      } else if((c.id==='patterns__vach_anh_kk' && data.photo335_single_panel) || (c.id==='patterns__dvd24_b091' && data.imported_single_panel===true && c.b91_single_panel!==false) || (c.id==='patterns__capnhat_b-063' && c.b063_single_panel===true)) {
        pattern=transform(template(data),data,c.width,c.height,c.width/2+c.offset_x,c.height/2+c.offset_y,c.angle,c.mirror);tiles=1;
      } else {
      var loops = template(data),
        mw = c.module,
        mh = mw * data.height / data.width,
        a = -c.angle * Math.PI / 180,
        cos = Math.cos(a),
        sin = Math.sin(a),
        cx = c.width / 2 + c.offset_x,
        cy = c.height / 2 + c.offset_y;
      var box = G.bounds([[0, 0], [c.width, 0], [c.width, c.height], [0, c.height]].map(function (_ref9) {
        var _ref0 = _slicedToArray(_ref9, 2),
          x = _ref0[0],
          y = _ref0[1];
        return [(x - cx) * cos - (y - cy) * sin, (x - cx) * sin + (y - cy) * cos];
      }));
      var x0 = Math.floor(box.x0 / mw),
        x1 = Math.ceil(box.x1 / mw),
        y0 = Math.floor(box.y0 / mh),
        y1 = Math.ceil(box.y1 / mh);
      tiles = (x1 - x0) * (y1 - y0);
      var vertices = loops.reduce(function (n, p) {
        return n + p.length;
      }, 0);
      // Process repetitions in bounded batches. Sheet size is not a tile limit:
      // trim batches to the real outline before merging, keeping original pitch.
      if (!Number.isSafeInteger(tiles) || tiles > 250000)
        throw Error('Số mẫu lặp quá lớn để tính một lần. Khung đã được đọc; tăng Cỡ hoa văn hoặc chia vùng gia công.');
      var ca = Math.cos(-a),
        sa = Math.sin(-a);
      var batch=[],batchTiles=0,levels=[],rawPoints=0,batchSize=Math.max(1,Math.min(32,Math.floor(12000/Math.max(1,vertices))));
      // Offsetting clipped polygon pieces can change a negative bar offset.
      // Keep the complete union for adjusted bars, then offset and clip once.
      // One union is faster for ordinary large CNC jobs. Keep bounded
      // merging for inputs beyond this raw-point memory budget.
      var wholeUnion=!!c.bar_adjust || vertices*tiles<=500000;
      var trimRegion=wholeUnion ? null : region;
      function flushBatch(){
        if(!batch.length)return;
        // Clipper's integer intersections are not associative before offsetting.
        // Retain one raw union for adjusted bars to match saved geometry exactly.
        if(wholeUnion){
          batch.forEach(function(p){pattern.push(p);rawPoints+=p.length;});batch=[];batchTiles=0;
          if(rawPoints>1000000)throw Error('Bù nét tạo quá nhiều đường để tính một lần. Khung đã được đọc; tăng Cỡ hoa văn hoặc chia vùng gia công.');
          return;
        }
        var merged=bool(batch,[],'union');if(trimRegion)merged=bool(merged,trimRegion,'intersection');batch=[];batchTiles=0;
        for(var level=0;merged.length;level++){
          if(!levels[level]){levels[level]=merged;break;}
          merged=bool(levels[level],merged,'union');levels[level]=null;
          if(merged.reduce(function(n,p){return n+p.length;},0)>1000000)
            throw Error('Hoa văn tạo quá nhiều đường để xử lý. Khung đã được đọc; tăng Cỡ hoa văn hoặc chia vùng gia công.');
        }
      }
      for (var row = y0; row < y1; row++) {
       for (var col = x0; col < x1; col++) {
        var x = (col + .5) * mw,
          y = (row + .5) * mh;
        transform(loops,data,mw,mh,cx+x*ca-y*sa,cy+x*sa+y*ca,c.angle,c.mirror).forEach(function(p){batch.push(p);});
        if(++batchTiles>=batchSize)flushBatch();
       }
       if(root.LofiGeometryProgress && (row-y0)%Math.max(1,Math.ceil((y1-y0)/20))===0)
         root.LofiGeometryProgress('Đang rải hoa văn '+Math.round((row-y0+1)/(y1-y0)*100)+'% · giữ nguyên kích thước mẫu…');
      }
      flushBatch();
      if(wholeUnion)pattern=bool(pattern,[],'union');
      else levels.forEach(function(level){if(level)pattern=bool(pattern,level,'union');});
      }
      if (c.bar_adjust) pattern = offset(pattern, c.bar_adjust / 2);
      pattern = bool(pattern, region, 'intersection');
      if(pattern.reduce(function(n,p){return n+p.length;},0)<=200000)patternCache={key:patternKey,paths:copyPaths(pattern),tiles:tiles};
      else patternCache=null;
      }
      if(smoothActive(c.smoothing))pattern=protectFrame(smoothPaths(pattern,c.smoothing,inner),pattern,inner);
    }
    var body = frameless ? [] : c.mode === 'solid' ? boundary : c.mode === 'hollow' ? frame : c.weld ? bool(frame, pattern, 'union',true) : pattern,
      separate = c.mode === 'pattern' && !c.weld ? frame : [],
      raised = [];
    var borderInfo=null,centerInfo=null,inlayRegion=inner;
    if(c.border && c.border.enabled){
      var borderRegion=inner,borderVoids=customHoles,ownLayout=frameless && c.border.layout && c.border.layout.enabled;
      if(ownLayout){
        var layout=c.border.layout,sourceBox=G.bounds(outer),sourceW=sourceBox.x1-sourceBox.x0,sourceH=sourceBox.y1-sourceBox.y0,
          edge=c.border.edge_frame || {enabled:true,outer:10,inner:10},netOffset=(edge.enabled?edge.outer:0)-(c.border.stroke_adjust||0)/2,
          pathW=layout.width-2*netOffset,pathH=layout.height-2*netOffset,mappedOuter,mappedHoles,measuredBox;
        function fitLayoutPoint(p){return [c.width/2+(p[0]-(sourceBox.x0+sourceBox.x1)/2)*pathW/sourceW,c.height/2+(p[1]-(sourceBox.y0+sourceBox.y1)/2)*pathH/sourceH];}
        // Solve on the guide contour, before repeats and strokes are built.
        // Offset bounds at a sloped corner need not grow by exactly 2*r.
        for(var fit=0;fit<16;fit++){
          if(!(pathW>0 && pathH>0))throw Error('Khổ diềm riêng không đủ chỗ cho viền bao. Tăng ngang/cao hoặc giảm viền ngoài.');
          mappedOuter=outer.map(fitLayoutPoint);
          var finished=offset(toPaths([mappedOuter]),netOffset);
          if(!finished.length)throw Error('Khổ diềm riêng không còn đường bao hợp lệ.');
          measuredBox=G.bounds(finished.flatMap(fromPath));
          var dw=layout.width-(measuredBox.x1-measuredBox.x0),dh=layout.height-(measuredBox.y1-measuredBox.y0);
          if(Math.abs(dw)<.0005 && Math.abs(dh)<.0005)break;
          pathW+=dw;pathH+=dh;
        }
        if(fit===16)throw Error('Chưa thể khớp khổ diềm tại góc nhọn. Tăng kích thước hoặc giảm viền ngoài.');
        // Keep the finished loop centred even for an asymmetric captured path.
        var shiftX=c.width/2-(measuredBox.x0+measuredBox.x1)/2,shiftY=c.height/2-(measuredBox.y0+measuredBox.y1)/2;
        function shifted(p){var q=fitLayoutPoint(p);return [q[0]+shiftX,q[1]+shiftY];}
        mappedOuter=outer.map(shifted);mappedHoles=drawnFrame ? [] : customHoles.map(function(h){return h.map(shifted);});
        borderRegion=toPaths([mappedOuter].concat(mappedHoles));borderVoids=mappedHoles;
      }
      borderInfo=root.LofiCNCBorder.build(c.border,borderRegion,assets[c.border.id],{G:G,toPaths:toPaths,parts:parts,bool:bool,area:area,template:template,frameless:frameless,offset:offset});
      if(smoothActive(c.smoothing))borderInfo.cuts=smoothPaths(borderInfo.cuts,c.smoothing,borderRegion);
      if(c.border.stroke_adjust){
        var hadBorderCuts=borderInfo.cuts.length>0;
        var keepPhotoContacts=borderInfo.whole_motifs && c.border.stroke_adjust<0 && (!frameless || !c.border.edge_frame || c.border.edge_frame.enabled);
        function contactCopy(paths){return paths.map(function(path){return path.map(function(p){return {X:p.X,Y:p.Y};});});}
        var contactMaterial=keepPhotoContacts?contactCopy(borderInfo.material):null,contactBand=keepPhotoContacts?contactCopy(borderInfo.band):null;
        if(frameless)root.LofiCNCBorder.adjustFootprint(borderInfo,c.border.stroke_adjust,{offset:offset});
        borderInfo.cuts=bool(offset(borderInfo.cuts,-c.border.stroke_adjust/2),borderInfo.band,'intersection');
        if(borderInfo.material_repeat && frameless && c.border.edge_frame && (!c.border.edge_frame.enabled || !c.border.edge_frame.outer || !c.border.edge_frame.inner)){
          // Offset cuts can kiss the bare support at hundreds of rounded grid
          // vertices. Open only this numerical contact (0.0002 mm), preventing
          // zero-area rail slivers and exponential closed-solid splitting.
          borderInfo.cuts=offset(borderInfo.cuts,.0002);
        }
        if(keepPhotoContacts){
          // A negative stroke thins the art, but must not detach every foot
          // from its physical wrapper. Protect only original boundary contacts,
          // allowing the interior contours to retain the requested thinning.
          var delta=-c.border.stroke_adjust/2,depth=3*delta+.001,
            boundaryContact=bool(contactBand,offset(contactBand,-.0003),'difference'),
            seeds=bool(contactMaterial,boundaryContact,'intersection'),
            zone=bool(borderInfo.band,offset(borderInfo.band,-depth),'difference');
          if(frameless){
            var contactRim=root.LofiCNCBorder.edgeFrame(borderInfo,c.border,{bool:bool,offset:offset,toPaths:toPaths});
            zone=bool(zone,offset(contactRim,depth),'intersection');
          }
          var anchors=bool(bool(offset(contactMaterial,delta),zone,'intersection'),offset(seeds,depth),'intersection');
          borderInfo.cuts=bool(borderInfo.cuts,anchors,'difference');
        }
        if(hadBorderCuts && !borderInfo.cuts.length)throw Error('Bù dày nét đã làm kín các khe diềm. Giảm mức bù dương.');
        if(Math.abs(area(bool(borderInfo.band,borderInfo.cuts,'difference')))<.0001 && borderInfo.band.length)
          throw Error('Bù mỏng nét đã làm mất diềm. Giảm mức bù âm.');
      }
      // A filled strip replaces the background pattern only in the border band.
      // Its cuts remain cut geometry; centre pattern and manually placed items
      // keep their existing roles. The overlap is inside existing sheet material.
      var borderBand=frameless ? borderInfo.band : c.weld ? bool(offset(borderInfo.band,.02),boundary,'intersection') : borderInfo.band;
      body=bool(body,borderBand,'difference');
      separate=bool(separate,borderInfo.band,'difference');
      // Photo-repeat material is already final; avoid a costly full-ring complement roundtrip.
      var borderMaterial=borderInfo.material_repeat && !c.border.stroke_adjust && !smoothActive(c.smoothing) ? borderInfo.material : bool(borderBand,borderInfo.cuts,'difference');
      body=bool(body,borderMaterial,'union');
      if(frameless){
        var rim=root.LofiCNCBorder.edgeFrame(borderInfo,c.border,{bool:bool,offset:offset,toPaths:toPaths});
        // A wrapper may extend outside the reference canvas, but must not
        // silently fill an explicit void in a custom outline. Drawn-frame
        // openings are the placement area, so they are intentionally exempt.
        if(!drawnFrame && borderVoids.length && Math.abs(area(bool(rim,toPaths(borderVoids),'intersection')))>.001)
          throw Error('Viền bao chạm lỗ biên dạng. Giảm bề rộng viền trong hoặc viền ngoài.');
        body=bool(body,rim,'union');
        if(borderInfo.material_repeat)body=root.LofiCNCBorder.cleanPhotoCornerFragments(borderInfo,body,rim,{parts:parts,toPaths:toPaths,bool:bool,area:area});
        if(body.length)borderInfo.visible_bounds=G.bounds(body.flatMap(fromPath));
      }
      if(!frameless)centerInfo=borderCenter(c,borderInfo,inner);
      if(!frameless && (c.border.inner_frame || (c.border.center_mode && c.border.center_mode!=='inherit'))){
        // Replace only the area inside the existing outer frame. The source
        // contours, holes, border cuts and outer dimensions stay authoritative.
        var middle=centerInfo.paths,trim=bool(bool(inner,middle,'difference'),borderInfo.cuts,'difference');
        var fill=centerMode==='solid' ? middle : centerMode==='pattern' ? bool(pattern,middle,'intersection') : [];
        body=bool(bool(body,inner,'difference'),bool(trim,fill,'union'),'union');
        separate=bool(separate,inner,'difference');
        inlayRegion=middle;
      }
    }
    var clearanceWarnings=[],rimNotes=[],_iterator6 = _createForOfIteratorHelper(c.items),
      _step6;
    try {
      for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
        var item = _step6.value;
        var source = assets[item.id];
        if (!source) throw Error('Chưa nạp họa tiết chèn.');
        var shape = itemPaths(item, source,clearanceWarnings,rimNotes);
        if(frameless){
          // The canvas is only a placement reference in this mode. Keep each
          // positive insert in its own layer, even outside the canvas or
          // overlapping another insert/border. A cut has no base to subtract.
          if(item.mode==='cut')continue;
          if(!shape.length)throw Error('Họa tiết không còn hình học. Kiểm tra kích thước hoặc bù nét.');
          raised.push({paths:shape,z:0,depth:item.mode==='raised'?item.depth:c.thickness,item_uid:item.uid,item_id:item.id});
          if(wallIndex)wallIndex.record(shape,0,0,0);
          if(recordRegionInsert)recordRegionInsert(shape,0);
          continue;
        }
        if(hasMargins(item) && bool(shape,item.mode==='inlay'?inlayRegion:boundary,'difference').length)
          throw Error('Mép họa tiết vượt khung hoặc mép tấm. Giảm viền ngoài, dời tâm hoặc xuất riêng.');
        if(item.inner_gap){
          var keep=(item.mode==='inlay'?inlayRegion:boundary);
          parts(shape).forEach(function(part){part.holes.forEach(function(h){
            if(bool(toPaths([G.area(h)>0?h:h.slice().reverse()]),keep,'difference').length)
              throw Error('Khung hoặc mép tấm cắt qua khe trong. Dời họa tiết vào trong, hoặc chọn Xuất riêng.');
          });});
        }
        if(smoothActive(c.smoothing))shape=protectFrame(shape,itemPathsRaw(item,source),inlayRegion);
        if (item.mode !== 'cut' && (recordRegionInsert || wallIndex)) {
          var wallLevel = item.mode === 'raised' ? c.thickness : 0;
          if (recordRegionInsert) recordRegionInsert(shape, wallLevel);
          else wallIndex.record(shape, wallLevel, 0, 0);
        }
        shape = bool(bool(shape, [], 'union'), boundary, 'intersection');
        if (!shape.length) throw Error('Có họa tiết nằm ngoài tấm. Chỉnh lại Tâm X/Y.');
        if (item.mode === 'inlay') {
          // Fill holes only in the clearing mask, never in the inserted motif.
          // Protect the existing frame, including its captured curved contour.
          var envelope = (item.inner_gap || hasMargins(item) || item.rim_adjust || smoothActive(item.smoothing)) ? toPaths(itemParts(item,source).map(function (p) { return p.outer; })) : transform(insertSource(item,source).parts.map(function (p) {
            return G.area(p.outer) > 0 ? p.outer : p.outer.slice().reverse();
          }), source, item.width, item.height, item.x, item.y, item.angle, item.mirror);
          // Keep a 0.02 mm overlap inside the motif's outer rim so integer
          // clipping cannot leave coincident slivers where pattern bars join it.
          envelope = bool(offset(bool(envelope, [], 'union'), -.02), inlayRegion, 'intersection');
          shape = bool(shape, inlayRegion, 'intersection');
          if (!shape.length) throw Error('Đặt họa tiết bên trong vùng hoa văn, tránh phần khung.');
          body = bool(body, envelope, 'difference');
          separate = bool(separate, envelope, 'difference');
          body = bool(body, shape, 'union');
        } else if (item.mode === 'cut') {
          body = bool(body, shape, 'difference');
          separate = bool(separate, shape, 'difference');
        } else if (item.mode === 'raised') raised.push({
          paths: shape,
          z: c.thickness,
          depth: item.depth
        });else {
          if (item.mode === 'background') {
            var _box = transform([[[0, 0], [source.width, 0], [source.width, source.height], [0, source.height]]], source, item.width, item.height, item.x, item.y, item.angle, item.mirror);
            body = bool(body, _box, 'difference');
          }
          body = bool(body, shape, 'union');
        }
      }
    } catch (err) {
      _iterator6.e(err);
    } finally {
      _iterator6.f();
    }
    var solids = [],
      contours = [];
    var totalPoints = 0,
      holes = 0,
      net = 0,regions=0;
    for (var _i2 = 0, _arr2 = [{
        paths: body,
        z: 0,
        depth: c.thickness
      }, {
        paths: separate,
        z: 0,
        depth: c.thickness
      }].concat(raised); _i2 < _arr2.length; _i2++) {
      var layer = _arr2[_i2];
      var layerParts=parts(layer.paths);
      if(_i2<2)regions+=layerParts.length;
      var _iterator7 = _createForOfIteratorHelper(layerParts),
        _step7;
      try {
        for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
          var p = _step7.value;
          contours.push({
            loops: [p.outer].concat(_toConsumableArray(p.holes)),
            z: layer.z,
            depth: layer.depth
          });
          if(layer.item_uid!==undefined){
            contours[contours.length-1].item_uid=layer.item_uid;
            contours[contours.length-1].item_id=layer.item_id;
          }
          holes += p.holes.length;
        }
      } catch (err) {
        _iterator7.e(err);
      } finally {
        _iterator7.f();
      }
      // Corel consumes planar contours, not triangulated SketchUp solids.
      // Avoid splitting thousands of holes merely to discard that mesh later.
      var _iterator8 = _createForOfIteratorHelper(meshRequired ? solidParts(layer.paths) : layerParts),
        _step8;
      try {
        for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
          var _p = _step8.value;
          var partArea = Math.abs(G.area(_p.outer)) - _p.holes.reduce(function (n, q) {
            return n + Math.abs(G.area(q));
          }, 0);
          if (partArea < .0001) continue;
          totalPoints += _p.outer.length + _p.holes.reduce(function (n, q) {
            return n + q.length;
          }, 0);
          if (totalPoints > (meshRequired ? meshPointLimit : 200000) || solids.length >= (meshRequired ? 1024 : 20000))
            throw Error(meshRequired ? 'Vách quá nhiều chi tiết cho lưới 3D.' : 'Hoa văn vượt 200.000 điểm của một lần tạo Corel. Khung đã được đọc; tăng Cỡ hoa văn hoặc chia vùng gia công.');
          net += partArea * layer.depth;
          solids.push({
            loops: [_p.outer].concat(_toConsumableArray(_p.holes)),
            mesh: meshRequired ? G.triangulate(_p.outer, _p.holes) : null,
            z: layer.z,
            depth: layer.depth,
            area: partArea
          });
          if(layer.item_uid!==undefined){
            solids[solids.length-1].item_uid=layer.item_uid;
            solids[solids.length-1].item_id=layer.item_id;
          }
        }
      } catch (err) {
        _iterator8.e(err);
      } finally {
        _iterator8.f();
      }
    }
    if (!solids.length) throw Error(frameless ? 'Bỏ khung: thêm họa tiết chèn hoặc bật ít nhất một cạnh riềm để lấy riêng.' : 'Thông số hiện tại không còn vật liệu để dựng.');
    if (wallIndex) solids.forEach(function(s) { wallIndex.mark(s.mesh, s.z); });
    if(meshRequired && c.items.some(function(i){return i.even_insert;}))solids.forEach(function(s){s.mesh.contour_prism=true;});
    // Traced photo curves can make SketchUp discard a valid side triangle.
    // Use the existing contour-prism constructor for this source family only;
    // it preserves the exact cut contours and all saved physical dimensions.
    if(meshRequired && borderInfo && borderInfo.material_repeat)solids.forEach(function(s){s.mesh.contour_prism=true;});
    if (meshRequired && (smoothActive(c.smoothing) || (c.border && c.border.enabled) || (drawnFrame && c.mode!=='solid' && c.custom_frame_adjust) || c.items.some(function (i) {return !!(i.inner_gap || i.rim_adjust || hasMargins(i));}))) {
      solids.forEach(function (s) {s.mesh.triangulate_sides=true;});
      if(c.items.some(function(i){return !!i.inner_gap;}))solids.forEach(function(s){s.mesh.alternate_short_sides=true;});
      if(c.items.some(function(i){return i.inner_gap_scope==='rim' || hasMargins(i);}))solids.forEach(function(s){s.mesh.contour_prism=true;});
    }
    var baseCount = solids.filter(function (s) {
        return s.z === 0;
      }).length;
    var result = {
      config: c,
      drawn_frame: drawnFrame,
      solids: solids,
      contours: contours,
      width: c.width,
      height: c.height,
      thickness: c.thickness,
      holes: holes,
      volume: net,
      tiles: tiles,
      points: totalPoints,
      base_count: baseCount,
      region_count: regions,
      warnings: regions > 1 ? [regions + ' vùng vật liệu rời; kiểm tra liên kết trước khi gia công.'] : baseCount > regions ? ['Đường biên có điểm chạm; đã tách khối kín. Kiểm tra bề rộng liên kết.'] : []
    };
    if(frameless){
      var standaloneRegions=contours.filter(function(p){return p.item_uid!==undefined;}).length;
      result.region_count+=standaloneRegions;
      // Separate inserts are intentional parts, not evidence of a failed weld.
      if(standaloneRegions)result.warnings=[];
    }
    result.warnings=result.warnings.concat(clearanceWarnings);
    if(clearanceWarnings.length)result.clearance_warnings=clearanceWarnings;
    if(rimNotes.length)result.rim_notes=rimNotes;
    if (borderInfo) {
      result.border_info = {count:borderInfo.count,runs:borderInfo.runs,placements:borderInfo.placements};
      if(borderInfo.visible_bounds)result.border_info.visible_bounds=borderInfo.visible_bounds;
      if(borderInfo.fit_info){result.border_info.fit_info=borderInfo.fit_info;result.border_info.whole_motifs=true;}
    }
    if(centerInfo) result.inner_frame_info={rectangular:centerInfo.rectangular,default_width:centerInfo.default_width,center_mode:centerMode,loops:centerInfo.paths.map(fromPath)};
    return result;
  }
  function svg(data) {
    var paths = data.contours.flatMap(function (s, i) {
      return s.loops.map(function (p, j) {
        return '<path data-layer="' + (s.z ? 'RELIEF' : j ? 'HOLE' : 'OUTLINE') + '" d="' + G.path(p) + '"/>';
      });
    }).join('');
    if(data.config && data.config.mode==='frameless'){
      var box=G.bounds(data.contours.flatMap(function(s){return s.loops.flatMap(function(p){return p;});})),pad=.05,
        width=box.x1-box.x0+2*pad,height=box.y1-box.y0+2*pad;
      return '<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'mm" height="'+height+'mm" viewBox="'+(box.x0-pad)+' '+(box.y0-pad)+' '+width+' '+height+'"><g transform="translate(0 '+(box.y0+box.y1)+') scale(1 -1)" fill="none" stroke="black" stroke-width="0.1">'+paths+'</g></svg>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + data.width + 'mm" height="' + data.height + 'mm" viewBox="0 0 ' + data.width + ' ' + data.height + '"><g transform="translate(0 ' + data.height + ') scale(1 -1)" fill="none" stroke="black" stroke-width="0.1">' + paths + '</g></svg>';
  }
  function dxf(data) {
    var cfg=data.config||{},setting=cfg.smoothing,bulge=null;
    if(setting && setting.mode==='arcs' && smoothActive(setting) && (!data.width || cfg.outline==='rectangle' && !cfg.border && !cfg.custom_regions)){
      var insets=data.width && frameInsets(cfg),pad=setting.tolerance;
      var inside=insets && function(p){return p[0]>insets.left+pad && p[0]<cfg.width-insets.right-pad && p[1]>insets.bottom+pad && p[1]<cfg.height-insets.top-pad;};
      bulge=root.LofiPanelSmoothing.dxfBulges(data.contours.flatMap(function(s){return s.loops;}),setting,inside);
    }
    var out = ['0', 'SECTION', '2', 'HEADER', '9', '$INSUNITS', '70', '4', '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES'];
    var _iterator9 = _createForOfIteratorHelper(data.contours),
      _step9;
    try {
      for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
        var s = _step9.value;
        for (var j = 0; j < s.loops.length; j++) {
          var p = s.loops[j];
          out.push('0', 'LWPOLYLINE', '100', 'AcDbEntity', '8', s.z ? 'RELIEF' : j ? 'HOLE' : 'OUTLINE', '100', 'AcDbPolyline', '90', String(p.length), '70', '1');
          p.forEach(function (_ref1,index) {
            var _ref10 = _slicedToArray(_ref1, 2),
              x = _ref10[0],
              y = _ref10[1];
            out.push('10', x.toFixed(4), '20', y.toFixed(4));
            var curve=bulge && bulge(p,index);
            if(curve)out.push('42',curve.toFixed(12));
          });
        }
      }
    } catch (err) {
      _iterator9.e(err);
    } finally {
      _iterator9.f();
    }
    var text=out.concat(['0', 'ENDSEC', '0', 'EOF']).join('\r\n') + '\r\n';
    if(cfg.id==='patterns__capnhat_b-063'){
      if(!root.LofiJdpDxf)throw Error('Thiếu bộ xuất DXF R12 của B-063. Cài lại gói bổ sung.');
      return root.LofiJdpDxf.toR12(text);
    }
    return text;
  }
  root.LofiCNCPanel = {
    defaults: defaults,
    normalize: normalize,
    usesDrawnFrame: usesDrawnFrame,
    frameInsets: frameInsets,
    activateFrameFollow: activateFrameFollow,
    supportsFrameSides: supportsFrameSides,
    usesFrameSides: usesFrameSides,
    suggestDrawnFrame: suggestDrawnFrame,
    capturedFrameInsets: capturedFrameInsets,
    build: build,
    itemPaths: itemPaths,
    rimDimensions: rimDimensions,
    itemParts: itemParts,
    itemDisplaySource: itemDisplaySource,
    insertWallIndex: insertWallIndex,
    // Internal worker handoff: these entries use local physical contours and
    // are keyed by the same complete settings as ordinary item calculations.
    workerItemCache: function(source){return slotCache.get(source)||[];},
    acceptWorkerItemCache: function(source,entries){entries.slice(0,6).reverse().forEach(function(hit){rememberItem(source,hit);});},
    workerCacheStats: function(){return {entries:slotOrder.length,vertices:slotOrder.reduce(function(n,e){return n+e.vertices;},0)};},
    buildItem: buildItem,
    svg: svg,
    dxf: dxf,
    parts: parts,
    solidParts: solidParts,
    area: area
  };
})(typeof window === 'undefined' ? globalThis : window);
