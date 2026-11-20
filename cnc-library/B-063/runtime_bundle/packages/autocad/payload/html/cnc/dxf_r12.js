/*
 * LOFIHOME JDP DXF adapter, 1.1.0
 * Pure data conversion only: no filesystem, host, licence or update calls.
 *
 * toR12(text): converts supported planar LWPOLYLINE/POLYLINE geometry into
 * ASCII AutoCAD R12 POLYLINE/VERTEX records. Numeric coordinates are unchanged.
 * One drawing unit is one millimetre by convention. R12 has no $INSUNITS:
 * this writer deliberately does not pretend that adding it makes R12 metric.
 * An explicitly non-mm input $INSUNITS is rejected, never silently rescaled.
 *
 * closedLoops(text, toleranceMm): joins planar LINE/ARC/CIRCLE and polyline
 * endpoints into checked closed contours, then approximates circular arcs with
 * maximum chord deviation toleranceMm. It rejects open/branched/crossing or
 * overlapping geometry, and never repairs it or infers loop nesting.
 * Unsupported entity types or non-planar/wide geometry fail the entire read.
 *
 * Group-code references (Autodesk DXF Reference):
 * https://help.autodesk.com/cloudhelp/2024/ENU/AutoCAD-DXF/files/GUID-748FC305-F3F2-4F74-825A-61F04D757A50.htm
 * https://help.autodesk.com/cloudhelp/2023/ENU/AutoCAD-DXF/files/GUID-ABF6B778-BE20-4B49-9B58-A94E64CEFFF3.htm
 * https://help.autodesk.com/cloudhelp/2021/ENU/AutoCAD-DXF/files/GUID-0741E831-599E-4CBF-91E1-8ADBCFD6556D.htm
 * https://help.autodesk.com/cloudhelp/2023/ENU/AutoCAD-DXF/files/GUID-FCEF5726-53AE-4C43-B4EA-C84EB8686A66.htm
 * https://help.autodesk.com/cloudhelp/2020/ENU/AutoCAD-DXF/files/GUID-0B14D8F1-0EBA-44BF-9108-57D8CE614BC8.htm
 * https://help.autodesk.com/cloudhelp/2020/ENU/AutoCAD-DXF/files/GUID-8663262B-222C-414D-B133-4A8506A27C18.htm
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LofiJdpDxf = api;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var MAX_TEXT = 64 * 1024 * 1024, MAX_PAIRS = 2000000;
  var MAX_VERTICES = 500000, MAX_ENTITIES = 20000;
  var NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

  function fail(message) { throw new Error('DXF: ' + message); }
  function finite(n) { return typeof n === 'number' && isFinite(n); }
  function number(value, label) {
    var text = String(value).trim();
    if (!NUMBER.test(text)) fail(label + ' phải là số hữu hạn.');
    var n = Number(text);
    if (!finite(n)) fail(label + ' phải là số hữu hạn.');
    return n;
  }
  function integer(value, label) {
    var n = number(value, label);
    if (Math.floor(n) !== n || Math.abs(n) > 2147483647) fail(label + ' phải là số nguyên hợp lệ.');
    return n;
  }
  function hypot(x, y) {
    var scale = Math.max(Math.abs(x), Math.abs(y));
    return scale === 0 ? 0 : scale * Math.sqrt((x / scale) * (x / scale) + (y / scale) * (y / scale));
  }
  function same(a, b) { return a.x === b.x && a.y === b.y; }
  function numericText(n) {
    if (!finite(n)) fail('Tọa độ xuất không hữu hạn.');
    return n === 0 ? '0' : String(n);
  }
  function pairsFrom(text) {
    if (typeof text !== 'string' || !text.length) fail('Tệp trống hoặc không phải văn bản.');
    if (text.length > MAX_TEXT) fail('Tệp vượt giới hạn đọc 64 MB văn bản.');
    text = text.replace(/^\uFEFF/, '');
    if (text.indexOf('AutoCAD Binary DXF') === 0 || text.indexOf('\x00') !== -1) fail('Chỉ nhận DXF ASCII, không nhận DXF nhị phân.');
    var lines = text.split(/\r\n|\n|\r/), result = [], i;
    while (lines.length && /^\s*$/.test(lines[lines.length - 1])) lines.pop();
    if (lines.length % 2) fail('Thiếu một dòng mã nhóm hoặc giá trị.');
    if (lines.length / 2 > MAX_PAIRS) fail('Quá nhiều mã nhóm DXF.');
    for (i = 0; i < lines.length; i += 2) {
      var codeText = lines[i].trim();
      if (!/^\d+$/.test(codeText)) fail('Mã nhóm không hợp lệ ở dòng ' + (i + 1) + '.');
      var code = Number(codeText);
      if (code > 1071) fail('Mã nhóm vượt phạm vi hỗ trợ ở dòng ' + (i + 1) + '.');
      if (code !== 999) result.push({code: code, value: lines[i + 1].trim(), line: i + 1});
    }
    return result;
  }
  function sections(pairs) {
    var result = {entities: null, units: null}, i = 0, eof = false;
    while (i < pairs.length) {
      var p = pairs[i];
      if (p.code === 0 && p.value === 'EOF') {
        eof = true; i++;
        if (i !== pairs.length) fail('Có dữ liệu sau EOF.');
        break;
      }
      if (p.code !== 0 || p.value !== 'SECTION' || !pairs[i + 1] || pairs[i + 1].code !== 2) fail('Cấu trúc SECTION không hợp lệ.');
      var name = pairs[i + 1].value, start = i + 2, end = start;
      while (end < pairs.length && !(pairs[end].code === 0 && pairs[end].value === 'ENDSEC')) {
        if (pairs[end].code === 0 && (pairs[end].value === 'SECTION' || pairs[end].value === 'EOF')) fail('Thiếu ENDSEC.');
        end++;
      }
      if (end === pairs.length) fail('Thiếu ENDSEC.');
      if (name === 'ENTITIES') {
        if (result.entities !== null) fail('Có nhiều vùng ENTITIES.');
        result.entities = pairs.slice(start, end);
      }
      if (name === 'HEADER') {
        for (var j = start; j < end; j++) {
          if (pairs[j].code === 9 && pairs[j].value === '$INSUNITS') {
            if (result.units !== null || j + 1 >= end || pairs[j + 1].code !== 70) fail('$INSUNITS không hợp lệ hoặc bị lặp.');
            result.units = integer(pairs[j + 1].value, '$INSUNITS');
            if (result.units !== 0 && result.units !== 4) fail('Tệp khai báo đơn vị khác mm. Hãy xuất lại DXF theo mm trước khi nhập.');
          }
        }
      }
      i = end + 1;
    }
    if (!eof) fail('Thiếu dấu kết thúc EOF.');
    if (result.entities === null) fail('Không có vùng ENTITIES.');
    return result;
  }
  function records(pairs) {
    var list = [], current = null;
    for (var i = 0; i < pairs.length; i++) {
      var p = pairs[i];
      if (p.code === 0) {
        current = {type: p.value, fields: []};
        list.push(current);
      } else {
        if (!current) fail('Dữ liệu ENTITIES không bắt đầu bằng mã đối tượng.');
        current.fields.push(p);
      }
    }
    return list;
  }
  function once(fields, code, fallback, label) {
    var found = false, value = fallback;
    for (var i = 0; i < fields.length; i++) if (fields[i].code === code) {
      if (found) fail((label || ('Mã ' + code)) + ' bị lặp.');
      value = fields[i].value; found = true;
    }
    return value;
  }
  function nfield(fields, code, fallback, label) { return number(once(fields, code, fallback, label), label || ('Mã ' + code)); }
  function zero(fields, code, label) { if (nfield(fields, code, 0, label) !== 0) fail(label + ' phải bằng 0 cho biên dạng XY.'); }
  function flags(fields) {
    var value = integer(once(fields, 70, 0), 'Cờ polyline');
    if (value < 0 || (value & ~129) !== 0) fail('Chỉ hỗ trợ polyline 2D thường, không nhận mesh/spline/curve-fit.');
    return value;
  }
  function common(fields) {
    zero(fields, 39, 'Chiều dày DXF');
    zero(fields, 67, 'Paper space');
    if (nfield(fields, 210, 0, 'Pháp tuyến X') !== 0 || nfield(fields, 220, 0, 'Pháp tuyến Y') !== 0 || nfield(fields, 230, 1, 'Pháp tuyến Z') !== 1) fail('Chỉ hỗ trợ pháp tuyến (0, 0, 1).');
    var layout = once(fields, 410, 'Model');
    if (layout && layout.toUpperCase() !== 'MODEL') fail('Chỉ hỗ trợ hình học trong Model space.');
    var layer = once(fields, 8, '0');
    if (!layer) fail('Tên lớp rỗng.');
    return {layer: layer, flags: flags(fields), vertices: []};
  }
  // Metadata that does not alter the supported planar centreline geometry.
  function metadata(code) {
    return code === 5 || code === 6 || code === 8 || code === 48 || code === 60 || code === 62 || code === 67 || code === 100 || code === 102 || code === 210 || code === 220 || code === 230 || code === 330 || code === 347 || code === 370 || code === 390 || code === 410 || code === 420 || code === 430 || code === 440 || code >= 1000;
  }
  function verifyVertices(poly, budget) {
    if (poly.vertices.length < 2) fail('Polyline cần ít nhất hai đỉnh phân biệt.');
    budget.count += poly.vertices.length;
    if (budget.count > MAX_VERTICES) fail('Quá nhiều đỉnh DXF.');
    var distinct = false;
    for (var i = 0; i < poly.vertices.length; i++) {
      var p = poly.vertices[i];
      if (!finite(p.x) || !finite(p.y) || !finite(p.bulge)) fail('Tọa độ hoặc bulge không hữu hạn.');
      if (!same(p, poly.vertices[0])) distinct = true;
      if ((i + 1 < poly.vertices.length || (poly.flags & 1)) && p.bulge && same(p, poly.vertices[(i + 1) % poly.vertices.length])) fail('Cung bulge có hai đầu trùng nhau.');
    }
    if (!distinct) fail('Polyline không có chiều dài.');
  }
  function readLW(record, budget) {
    var f = record.fields, poly = common(f), count = integer(once(f, 90, '', 'Số đỉnh'), 'Số đỉnh');
    if (count < 2 || count > MAX_VERTICES) fail('Số đỉnh LWPOLYLINE không hợp lệ.');
    zero(f, 38, 'Cao độ'); zero(f, 43, 'Bề rộng polyline');
    var v = null;
    function finish() {
      if (!v) return;
      if (v.y === null) fail('Đỉnh LWPOLYLINE thiếu tọa độ Y.');
      poly.vertices.push(v);
    }
    for (var i = 0; i < f.length; i++) {
      var p = f[i], code = p.code;
      if (code === 10) {
        finish(); v = {x: number(p.value, 'Tọa độ X'), y: null, bulge: 0, hasBulge: false};
      } else if (code === 20) {
        if (!v || v.y !== null) fail('Tọa độ Y thiếu X hoặc bị lặp.');
        v.y = number(p.value, 'Tọa độ Y');
      } else if (code === 42) {
        if (!v || v.hasBulge) fail('Bulge thiếu đỉnh hoặc bị lặp.');
        v.bulge = number(p.value, 'Bulge'); v.hasBulge = true;
      } else if (code === 40 || code === 41) {
        if (!v || number(p.value, 'Bề rộng đỉnh') !== 0) fail('Không hỗ trợ polyline có bề rộng.');
      } else if (code === 91) {
        if (!v) fail('Mã định danh đỉnh thiếu tọa độ.');
        integer(p.value, 'Mã định danh đỉnh');
      } else if (code !== 70 && code !== 90 && code !== 38 && code !== 39 && code !== 43 && !metadata(code)) fail('Mã LWPOLYLINE chưa hỗ trợ: ' + code + '.');
    }
    finish();
    if (poly.vertices.length !== count) fail('Số đỉnh khai báo khác số tọa độ LWPOLYLINE.');
    verifyVertices(poly, budget);
    return poly;
  }
  function readOld(list, at, budget) {
    var f = list[at].fields, poly = common(f), i, code;
    [10, 20, 30, 40, 41, 71, 72, 73, 74, 75].forEach(function (c) { zero(f, c, 'Mã POLYLINE ' + c); });
    var follows = integer(once(f, 66, 1), 'Cờ chuỗi đỉnh');
    if (follows !== 0 && follows !== 1) fail('Cờ chuỗi đỉnh không hợp lệ.');
    for (i = 0; i < f.length; i++) {
      code = f[i].code;
      if ([10, 20, 30, 39, 40, 41, 66, 70, 71, 72, 73, 74, 75].indexOf(code) < 0 && !metadata(code)) fail('Mã POLYLINE chưa hỗ trợ: ' + code + '.');
    }
    for (i = at + 1; i < list.length && list[i].type === 'VERTEX'; i++) {
      var vf = list[i].fields;
      [30, 39, 40, 41, 70, 50, 71, 72, 73, 74].forEach(function (c) { zero(vf, c, 'Mã VERTEX ' + c); });
      var vertexLayer = once(vf, 8, poly.layer);
      if (vertexLayer !== poly.layer) fail('Lớp VERTEX khác lớp POLYLINE.');
      for (var j = 0; j < vf.length; j++) {
        code = vf[j].code;
        if ([10, 20, 30, 39, 40, 41, 42, 50, 70, 71, 72, 73, 74, 91].indexOf(code) < 0 && !metadata(code)) fail('Mã VERTEX chưa hỗ trợ: ' + code + '.');
      }
      poly.vertices.push({x: nfield(vf, 10, '', 'Tọa độ X'), y: nfield(vf, 20, '', 'Tọa độ Y'), bulge: nfield(vf, 42, 0, 'Bulge')});
    }
    if (i === list.length || list[i].type !== 'SEQEND') fail('Chuỗi POLYLINE thiếu SEQEND.');
    verifyVertices(poly, budget);
    return {poly: poly, last: i};
  }
  function parse(text) {
    var section = sections(pairsFrom(text)), list = records(section.entities), result = [], budget = {count: 0};
    for (var i = 0; i < list.length; i++) {
      if (result.length >= MAX_ENTITIES) fail('Quá nhiều đường polyline.');
      if (list[i].type === 'LWPOLYLINE') result.push(readLW(list[i], budget));
      else if (list[i].type === 'POLYLINE') {
        var old = readOld(list, i, budget); result.push(old.poly); i = old.last;
      } else fail('Đối tượng chưa hỗ trợ: ' + list[i].type + '. Hãy xuất các đường POLYLINE/LWPOLYLINE 2D.');
    }
    if (!result.length) fail('Không có đường polyline để xử lý.');
    return {polys: result, warnings: section.units === null || section.units === 0 ? ['DXF không khai báo đơn vị; tọa độ được hiểu theo quy ước 1 đơn vị = 1 mm.'] : []};
  }
  function r12Layer(name) {
    // R12 symbol names cannot represent arbitrary Unicode/extended names.
    // Reject instead of renaming or corrupting the user's layer names.
    if (!/^[A-Za-z0-9_$-]{1,31}$/.test(name)) fail('Tên lớp không tương thích ASCII R12: ' + name + '. Dùng tên tối đa 31 ký tự A-Z, 0-9, _, $, -.');
    return name;
  }
  function toR12(text) {
    var parsed = parse(text), layers = ['0'], seen = Object.create(null), out = [];
    seen['0'] = true;
    parsed.polys.forEach(function (poly) {
      r12Layer(poly.layer);
      // R12 symbol names compare without case; avoid ambiguous layer aliases.
      var key = poly.layer.toUpperCase();
      if (!seen[key]) { seen[key] = poly.layer; layers.push(poly.layer); }
      else if (seen[key] !== true && seen[key] !== poly.layer) fail('Hai tên lớp chỉ khác chữ hoa/thường.');
    });
    function put(code, value) { out.push(String(code), String(value)); }
    put(999, 'LOFIHOME JDP: 1 drawing unit = 1 mm; planar contours only.');
    put(0, 'SECTION'); put(2, 'HEADER'); put(9, '$ACADVER'); put(1, 'AC1009');
    put(9, '$LUNITS'); put(70, 2); put(9, '$LUPREC'); put(70, 4);
    put(9, '$INSBASE'); put(10, 0); put(20, 0); put(30, 0); put(0, 'ENDSEC');
    put(0, 'SECTION'); put(2, 'TABLES');
    put(0, 'TABLE'); put(2, 'LTYPE'); put(70, 1);
    put(0, 'LTYPE'); put(2, 'CONTINUOUS'); put(70, 0); put(3, 'Solid line'); put(72, 65); put(73, 0); put(40, 0); put(0, 'ENDTAB');
    put(0, 'TABLE'); put(2, 'LAYER'); put(70, layers.length);
    layers.forEach(function (name) { put(0, 'LAYER'); put(2, name); put(70, 0); put(62, 7); put(6, 'CONTINUOUS'); });
    put(0, 'ENDTAB'); put(0, 'ENDSEC');
    put(0, 'SECTION'); put(2, 'BLOCKS'); put(0, 'ENDSEC');
    put(0, 'SECTION'); put(2, 'ENTITIES');
    parsed.polys.forEach(function (poly) {
      put(0, 'POLYLINE'); put(8, poly.layer); put(66, 1); put(10, 0); put(20, 0); put(30, 0); put(70, poly.flags);
      poly.vertices.forEach(function (v) {
        put(0, 'VERTEX'); put(8, poly.layer); put(10, numericText(v.x)); put(20, numericText(v.y)); put(30, 0);
        if (v.bulge !== 0) put(42, numericText(v.bulge));
        put(70, 0);
      });
      put(0, 'SEQEND'); put(8, poly.layer);
    });
    put(0, 'ENDSEC'); put(0, 'EOF');
    return out.join('\r\n') + '\r\n';
  }
  // The outbound R12 conversion deliberately keeps its existing strict parser.
  // This inbound reader additionally joins explicit LINE/ARC/polyline endpoints.
  // It never bridges a visible gap: endpoint snapping is capped at 0.00001 mm.
  var TAU = Math.PI * 2, NUM_EPS = 2.220446049250313e-16;
  function distance(a, b) { return hypot(b.x - a.x, b.y - a.y); }
  function angle0(a) { var n = a % TAU; return n < 0 ? n + TAU : n; }
  function pointAt(edge, angle) {
    return {x: edge.cx + edge.radius * Math.cos(angle), y: edge.cy + edge.radius * Math.sin(angle)};
  }
  function onArc(edge, point, epsilon) {
    var a = Math.atan2(point.y - edge.cy, point.x - edge.cx);
    var start = edge.sweep >= 0 ? edge.start : edge.start + edge.sweep;
    var offset = angle0(a - start), margin = epsilon / edge.radius;
    return offset <= Math.abs(edge.sweep) + margin || offset >= TAU - margin;
  }
  function lineEdge(a, b) { return {kind: 'line', a: a, b: b}; }
  function arcEdge(cx, cy, radius, start, sweep, a, b) {
    if (!finite(cx) || !finite(cy) || !finite(radius) || !(radius > 0) || !finite(start) ||
        !finite(sweep) || sweep === 0 || Math.abs(sweep) >= TAU) fail('Cung có thông số không hợp lệ.');
    var edge = {kind: 'arc', cx: cx, cy: cy, radius: radius, start: start, sweep: sweep};
    edge.a = a || pointAt(edge, start); edge.b = b || pointAt(edge, start + sweep);
    return edge;
  }
  function bulgeEdge(a, b, bulge, roundoffTolerance) {
    if (!bulge) return lineEdge(a, b);
    var dx = b.x - a.x, dy = b.y - a.y, length = hypot(dx, dy), absb = Math.abs(bulge);
    if (!finite(length) || !length) fail('Cung bulge có hai đầu trùng nhau hoặc tọa độ quá lớn.');
    // Extremely shallow arcs have unrepresentably distant centres. The chord is
    // accurate well below the endpoint roundoff budget; retain its uncertainty
    // in the analytic intersection checks instead of overflowing the centre.
    var sagitta = length * (absb / 2);
    if (absb <= 1 && sagitta <= roundoffTolerance / 4) {
      var straight = lineEdge(a, b); straight.flatDeviation = sagitta; straight.flattenedArc = true; return straight;
    }
    var radius = length * (absb + 1 / absb) / 4;
    var offset = (1 / bulge - bulge) / 4;
    var cx = a.x + dx / 2 - dy * offset, cy = a.y + dy / 2 + dx * offset;
    return arcEdge(cx, cy, radius, Math.atan2(a.y - cy, a.x - cx), 4 * Math.atan(bulge), a, b);
  }
  function allowedFields(record, allowed) {
    for (var i = 0; i < record.fields.length; i++) {
      var code = record.fields[i].code;
      if (allowed.indexOf(code) < 0 && !metadata(code)) fail('Mã ' + record.type + ' chưa hỗ trợ: ' + code + '.');
    }
  }
  function readEdges(text, roundoffTolerance) {
    var section = sections(pairsFrom(text)), list = records(section.entities);
    var edges = [], budget = {count: 0}, entityCount = 0, repeated = false, curved = false;
    function add(edge) {
      if (edges.length >= MAX_VERTICES) fail('Quá nhiều cạnh DXF.');
      edges.push(edge); if (edge.kind === 'arc' || edge.flattenedArc) curved = true;
    }
    function polyEdges(poly) {
      var vertices = poly.vertices.slice(), closed = !!(poly.flags & 1), last = vertices[vertices.length - 1];
      if (same(vertices[0], last)) {
        if (last.bulge) fail('Đỉnh cuối trùng đỉnh đầu có bulge không hợp lệ.');
        vertices.pop(); closed = true; repeated = true;
      }
      if (vertices.length < 2) fail('Đường bao không đủ đỉnh.');
      if (!closed && vertices[vertices.length - 1].bulge) fail('Đỉnh cuối của polyline hở có bulge không xác định.');
      for (var j = 0, n = closed ? vertices.length : vertices.length - 1; j < n; j++) {
        var a = vertices[j], b = vertices[(j + 1) % vertices.length];
        add(bulgeEdge(a, b, a.bulge, roundoffTolerance));
      }
    }
    for (var i = 0; i < list.length; i++) {
      var record = list[i], f = record.fields;
      if (++entityCount > MAX_ENTITIES) fail('Quá nhiều đối tượng DXF.');
      if (record.type === 'LWPOLYLINE') polyEdges(readLW(record, budget));
      else if (record.type === 'POLYLINE') {
        var old = readOld(list, i, budget); polyEdges(old.poly); i = old.last;
      } else if (record.type === 'LINE') {
        common(f); allowedFields(record, [10, 20, 30, 11, 21, 31, 39]);
        zero(f, 30, 'Cao độ điểm đầu'); zero(f, 31, 'Cao độ điểm cuối');
        add(lineEdge({x: nfield(f, 10, '', 'X đầu LINE'), y: nfield(f, 20, '', 'Y đầu LINE')},
          {x: nfield(f, 11, '', 'X cuối LINE'), y: nfield(f, 21, '', 'Y cuối LINE')}));
      } else if (record.type === 'ARC' || record.type === 'CIRCLE') {
        common(f); allowedFields(record, record.type === 'ARC' ? [10, 20, 30, 39, 40, 50, 51] : [10, 20, 30, 39, 40]);
        zero(f, 30, 'Cao độ tâm cung');
        var cx = nfield(f, 10, '', 'Tâm X'), cy = nfield(f, 20, '', 'Tâm Y'), radius = nfield(f, 40, '', 'Bán kính');
        if (!(radius > 0)) fail('Bán kính phải lớn hơn 0.');
        if (record.type === 'CIRCLE') {
          // Four exact quarter arcs avoid treating a full circle as an open ARC.
          var cardinal = [{x: cx + radius, y: cy}, {x: cx, y: cy + radius},
            {x: cx - radius, y: cy}, {x: cx, y: cy - radius}];
          for (var k = 0; k < 4; k++) add(arcEdge(cx, cy, radius, k * Math.PI / 2,
            Math.PI / 2, cardinal[k], cardinal[(k + 1) % 4]));
        } else {
          var from = nfield(f, 50, '', 'Góc đầu ARC'), to = nfield(f, 51, '', 'Góc cuối ARC');
          // DXF angles are degrees and ARC always runs counterclockwise in its OCS.
          var sweepDegrees = ((to % 360) - (from % 360) + 360) % 360;
          if (sweepDegrees === 0) fail('ARC có góc đầu và cuối trùng nhau; dùng CIRCLE cho đường tròn kín.');
          add(arcEdge(cx, cy, radius, (from % 360) * Math.PI / 180, sweepDegrees * Math.PI / 180));
        }
      } else fail('Đối tượng chưa hỗ trợ: ' + record.type + '. Hãy xuất LINE, ARC, CIRCLE hoặc POLYLINE/LWPOLYLINE 2D.');
    }
    if (!edges.length) fail('Không có đường nét để xử lý.');
    return {edges: edges, curved: curved, repeated: repeated,
      warnings: section.units === null || section.units === 0 ?
        ['DXF không khai báo đơn vị; theo thiết lập nhập JDP, 1 đơn vị được đọc là 1 mm. Kiểm tra kích thước trước khi dùng.'] : []};
  }
  function joinEdges(edges, epsilon) {
    var nodes = [], grid = Object.create(null), snapped = 0;
    function cell(x, y) { return x + ':' + y; }
    function nodeFor(point) {
      if (!finite(point.x) || !finite(point.y)) fail('Tọa độ không hữu hạn.');
      if (Math.max(Math.abs(point.x), Math.abs(point.y)) * NUM_EPS * 32 > epsilon)
        fail('Tọa độ quá xa gốc để nối cạnh chính xác. Đưa hình về gần gốc rồi xuất lại.');
      var ix = Math.floor(point.x / epsilon), iy = Math.floor(point.y / epsilon), found = null;
      for (var x = ix - 1; x <= ix + 1; x++) for (var y = iy - 1; y <= iy + 1; y++) {
        var bucket = grid[cell(x, y)] || [];
        for (var b = 0; b < bucket.length; b++) {
          var candidate = nodes[bucket[b]];
          if (distance(candidate, point) <= epsilon) {
            if (found && found !== candidate) fail('Có nhiều đầu cạnh gần nhau; không xác định được cách nối đường bao.');
            found = candidate;
          }
        }
      }
      if (found) {
        for (var p = 0; p < found.originals.length; p++)
          if (distance(found.originals[p], point) > epsilon)
            fail('Cụm đầu cạnh không đồng nhất; hãy nối kín chính xác trong JDP.');
        if (!same(found, point)) snapped++;
        found.originals.push(point); return found.id;
      }
      var node = {x: point.x, y: point.y, id: nodes.length, edges: [], originals: [point]};
      nodes.push(node); var key = cell(ix, iy); if (!grid[key]) grid[key] = []; grid[key].push(node.id);
      return node.id;
    }
    edges.forEach(function (edge, i) {
      edge.index = i; edge.na = nodeFor(edge.a); edge.nb = nodeFor(edge.b);
      if (edge.na === edge.nb) fail('Có cạnh dài bằng 0 hoặc quá ngắn để nối chính xác.');
      nodes[edge.na].edges.push(i); nodes[edge.nb].edges.push(i);
      if (nodes[edge.na].edges.length > 2 || nodes[edge.nb].edges.length > 2)
        fail('Đường bao có nút nhiều nhánh, đường trùng hoặc hai vòng chạm nhau.');
    });
    nodes.forEach(function (node) {
      if (node.edges.length !== 2) fail('Đường bao chưa kín: có đầu cạnh hở. Nối kín các đoạn trong JDP rồi xuất lại.');
    });
    return {nodes: nodes, snapped: snapped};
  }
  function edgeBounds(edge) {
    var b = {xmin: Math.min(edge.a.x, edge.b.x), xmax: Math.max(edge.a.x, edge.b.x),
      ymin: Math.min(edge.a.y, edge.b.y), ymax: Math.max(edge.a.y, edge.b.y)};
    if (edge.kind === 'arc') for (var k = 0; k < 4; k++) {
      var p = pointAt(edge, k * Math.PI / 2);
      if (onArc(edge, p, 0)) { b.xmin = Math.min(b.xmin, p.x); b.xmax = Math.max(b.xmax, p.x);
        b.ymin = Math.min(b.ymin, p.y); b.ymax = Math.max(b.ymax, p.y); }
    }
    if (edge.flatDeviation) {
      b.xmin -= edge.flatDeviation; b.xmax += edge.flatDeviation;
      b.ymin -= edge.flatDeviation; b.ymax += edge.flatDeviation;
    }
    if (!finite(b.xmin) || !finite(b.xmax) || !finite(b.ymin) || !finite(b.ymax))
      fail('Phạm vi đường cong vượt khả năng biểu diễn số.');
    return b;
  }
  function cross(ax, ay, bx, by) { return ax * by - ay * bx; }
  function numericEpsilon(a, b) {
    return Math.max(1, Math.abs(a.a.x), Math.abs(a.a.y), Math.abs(a.b.x), Math.abs(a.b.y),
      Math.abs(b.a.x), Math.abs(b.a.y), Math.abs(b.b.x), Math.abs(b.b.y), a.radius || 0, b.radius || 0) * NUM_EPS * 32 +
      (a.flatDeviation || 0) + (b.flatDeviation || 0);
  }
  function verifyNoCrossings(edges, nodes, joinEpsilon) {
    var ordered = edges.slice(), checks = 0, active = [];
    function spendCheck() {
      if (++checks > 5000000) fail('Bản vẽ quá phức tạp để kiểm tra giao cắt; chia biên dạng thành các tệp nhỏ hơn.');
    }
    edges.forEach(function (edge) { edge.box = edgeBounds(edge); });
    ordered.sort(function (a, b) { return a.box.xmin - b.box.xmin || a.index - b.index; });
    function sharedPoint(a, b, point) {
      var ids = [a.na, a.nb];
      for (var j = 0; j < ids.length; j++) if ((ids[j] === b.na || ids[j] === b.nb) &&
          distance(nodes[ids[j]], point) <= joinEpsilon * 2) return true;
      return false;
    }
    function rejectIntersection(a, b, point) {
      if (!sharedPoint(a, b, point)) fail('Đường bao tự cắt, các vòng chạm/cắt nhau hoặc có nhánh chạm giữa cạnh.');
    }
    function lineLine(a, b, eps) {
      var ux = a.b.x - a.a.x, uy = a.b.y - a.a.y, vx = b.b.x - b.a.x, vy = b.b.y - b.a.y;
      var wx = b.a.x - a.a.x, wy = b.a.y - a.a.y, den = cross(ux, uy, vx, vy);
      var lu = hypot(ux, uy), lv = hypot(vx, vy), crossEps = eps * Math.max(lu, lv);
      if (Math.abs(den) <= crossEps) {
        if (Math.abs(cross(wx, wy, ux, uy)) > eps * lu) return;
        var len2 = ux * ux + uy * uy;
        var t0 = (wx * ux + wy * uy) / len2;
        var t1 = ((b.b.x - a.a.x) * ux + (b.b.y - a.a.y) * uy) / len2;
        var lo = Math.max(0, Math.min(t0, t1)), hi = Math.min(1, Math.max(t0, t1));
        if (hi < lo - eps / lu) return;
        if ((hi - lo) * lu > joinEpsilon) fail('Đường bao có các đoạn thẳng chồng/trùng nhau.');
        rejectIntersection(a, b, {x: a.a.x + (lo + hi) / 2 * ux, y: a.a.y + (lo + hi) / 2 * uy});
        return;
      }
      var t = cross(wx, wy, vx, vy) / den, s = cross(wx, wy, ux, uy) / den;
      if (t < -eps / lu || t > 1 + eps / lu || s < -eps / lv || s > 1 + eps / lv) return;
      rejectIntersection(a, b, {x: a.a.x + t * ux, y: a.a.y + t * uy});
    }
    function lineArc(line, arc, eps) {
      var dx = line.b.x - line.a.x, dy = line.b.y - line.a.y, len = hypot(dx, dy);
      var ux = dx / len, uy = dy / len, wx = arc.cx - line.a.x, wy = arc.cy - line.a.y;
      var along = wx * ux + wy * uy, normal = cross(wx, wy, ux, uy), r = arc.radius;
      if (Math.abs(normal) > r + eps) return;
      var radicand = (r - Math.abs(normal)) * (r + Math.abs(normal));
      if (radicand < -eps * Math.max(r, 1)) return;
      var offset = Math.sqrt(Math.max(0, radicand)), hits = offset <= eps ? [along] : [along - offset, along + offset];
      hits.forEach(function (t) {
        if (t < -eps || t > len + eps) return;
        var p = {x: line.a.x + t * ux, y: line.a.y + t * uy};
        if (onArc(arc, p, eps)) rejectIntersection(line, arc, p);
      });
    }
    function angularIntervals(edge) {
      var start = angle0(edge.sweep >= 0 ? edge.start : edge.start + edge.sweep), end = start + Math.abs(edge.sweep);
      return end <= TAU ? [[start, end]] : [[start, TAU], [0, end - TAU]];
    }
    function arcArc(a, b, eps) {
      var dx = b.cx - a.cx, dy = b.cy - a.cy, d = hypot(dx, dy), ra = a.radius, rb = b.radius;
      if (d <= eps && Math.abs(ra - rb) <= eps) {
        var ia = angularIntervals(a), ib = angularIntervals(b), margin = joinEpsilon / Math.min(ra, rb);
        for (var i = 0; i < ia.length; i++) for (var j = 0; j < ib.length; j++)
          if (Math.min(ia[i][1], ib[j][1]) - Math.max(ia[i][0], ib[j][0]) > margin)
            fail('Đường bao có các cung tròn chồng/trùng nhau.');
        [a.a, a.b].forEach(function (p) { if (onArc(b, p, eps)) rejectIntersection(a, b, p); });
        [b.a, b.b].forEach(function (p) { if (onArc(a, p, eps)) rejectIntersection(a, b, p); });
        return;
      }
      if (!d || d > ra + rb + eps || d < Math.abs(ra - rb) - eps) return;
      var along = (d * d + (ra - rb) * (ra + rb)) / (2 * d);
      var radicand = (ra - Math.abs(along)) * (ra + Math.abs(along));
      if (radicand < -eps * Math.max(ra, rb, 1)) return;
      var offset = Math.sqrt(Math.max(0, radicand)), ux = dx / d, uy = dy / d;
      var cx = a.cx + along * ux, cy = a.cy + along * uy;
      var hits = offset <= eps ? [{x: cx, y: cy}] : [{x: cx - offset * uy, y: cy + offset * ux}, {x: cx + offset * uy, y: cy - offset * ux}];
      hits.forEach(function (p) { if (onArc(a, p, eps) && onArc(b, p, eps)) rejectIntersection(a, b, p); });
    }
    ordered.forEach(function (edge) {
      active = active.filter(function (other) { spendCheck(); return other.box.xmax + joinEpsilon >= edge.box.xmin; });
      active.forEach(function (other) {
        spendCheck();
        if (other.box.ymax + joinEpsilon < edge.box.ymin || edge.box.ymax + joinEpsilon < other.box.ymin) return;
        var eps = numericEpsilon(edge, other);
        if (edge.kind === 'line' && other.kind === 'line') lineLine(edge, other, eps);
        else if (edge.kind === 'line') lineArc(edge, other, eps);
        else if (other.kind === 'line') lineArc(other, edge, eps);
        else arcArc(edge, other, eps);
      });
      active.push(edge);
    });
  }
  function closedLoops(text, toleranceMm) {
    if (toleranceMm === undefined) toleranceMm = 0.05;
    if (!finite(toleranceMm) || toleranceMm <= 0) fail('Sai số nội suy phải là số dương hữu hạn theo mm.');
    var joinEpsilon = Math.min(0.00001, toleranceMm / 1000), arcTolerance = toleranceMm - joinEpsilon * 2;
    if (!finite(joinEpsilon) || !(joinEpsilon > 0)) fail('Sai số quá nhỏ để nối đường bao.');
    var parsed = readEdges(text, joinEpsilon), joined = joinEdges(parsed.edges, joinEpsilon), nodes = joined.nodes;
    verifyNoCrossings(parsed.edges, nodes, joinEpsilon);
    var loops = [], visited = [], count = 0;
    function append(points, x, y) {
      if (!finite(x) || !finite(y)) fail('Nội suy cung tạo tọa độ không hữu hạn.');
      if (++count > MAX_VERTICES) fail('Nội suy vượt giới hạn đỉnh; tăng sai số hoặc chia bản vẽ.');
      points.push([x, y]);
    }
    parsed.edges.forEach(function (first, startEdge) {
      if (visited[startEdge]) return;
      var points = [], at = first.na, firstNode = at, edgeIndex = startEdge, traversed = 0;
      do {
        if (visited[edgeIndex] || ++traversed > parsed.edges.length) fail('Không xác định được một vòng kín đơn.');
        visited[edgeIndex] = true;
        var edge = parsed.edges[edgeIndex], forward = edge.na === at, next = forward ? edge.nb : edge.na;
        append(points, nodes[at].x, nodes[at].y);
        if (edge.kind === 'arc') {
          var step = 4 * Math.asin(Math.sqrt(Math.min(1, arcTolerance / (2 * edge.radius))));
          if (!finite(step) || !(step > 0)) fail('Sai số quá nhỏ để nội suy cung.');
          var segments = Math.max(1, Math.ceil(Math.abs(edge.sweep) / Math.min(Math.PI / 2, step)));
          if (segments > MAX_VERTICES - count + 1) fail('Cung cần quá nhiều đỉnh; tăng sai số nội suy.');
          var from = forward ? edge.start : edge.start + edge.sweep, sweep = forward ? edge.sweep : -edge.sweep;
          for (var j = 1; j < segments; j++) {
            var p = pointAt(edge, from + sweep * j / segments); append(points, p.x, p.y);
          }
        }
        at = next;
        edgeIndex = nodes[at].edges[0] === edgeIndex ? nodes[at].edges[1] : nodes[at].edges[0];
      } while (at !== firstNode);
      if (points.length < 3) fail('Đường bao cần ít nhất ba điểm sau nội suy.');
      var area2 = 0, origin = points[0], xmin = origin[0], xmax = origin[0], ymin = origin[1], ymax = origin[1];
      for (var k = 0; k < points.length; k++) {
        var p0 = points[k], p1 = points[(k + 1) % points.length];
        area2 += (p0[0] - origin[0]) * (p1[1] - origin[1]) - (p1[0] - origin[0]) * (p0[1] - origin[1]);
        xmin = Math.min(xmin, p0[0]); xmax = Math.max(xmax, p0[0]); ymin = Math.min(ymin, p0[1]); ymax = Math.max(ymax, p0[1]);
      }
      if (!finite(area2) || Math.abs(area2) <= Math.max(1, (xmax - xmin) * (ymax - ymin)) * 1e-12)
        fail('Đường bao có diện tích bằng 0 hoặc không xác định.');
      loops.push(points);
    });
    var warnings = parsed.warnings.slice();
    if (parsed.curved) warnings.push('Các cung tròn được nội suy thành đoạn thẳng với sai số tối đa ' + toleranceMm + ' mm.');
    if (parsed.repeated) warnings.push('Đã nhận đường bao có đỉnh cuối trùng đỉnh đầu.');
    if (joined.snapped) warnings.push('Đã khớp các đầu cạnh lệch do làm tròn, tối đa ' + joinEpsilon + ' mm.');
    return {loops: loops, warnings: warnings};
  }
  return {version: '1.1.0', toR12: toR12, closedLoops: closedLoops};
});
