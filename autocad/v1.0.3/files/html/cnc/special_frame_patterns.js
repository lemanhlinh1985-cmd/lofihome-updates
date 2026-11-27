(function (root) {
  'use strict';

  const panel = root.LofiCNCPanel;
  const geometry = root.LofiCNCGeometry;
  const clipper = root.ClipperLib;
  const coordinatesPerMm = 10000;
  const defaultScale = panel.defaults.module;
  const singlePanel = new Set([
    'patterns__vach_anh_033', 'patterns__vach_anh_kk', 'patterns__dvd24_b091',
    'patterns__dvd24_b063', 'patterns__dvd24_zhongshi1'
  ]);
  const loading = new Map();
  const workers = new Map();
  const revisions = new Map();
  const preparedPanels = new WeakMap();

  function entryFor(key) {
    return (root.LofiOriginalCNCCatalog || []).find(entry => entry.id === key);
  }

  function supports(key) {
    if (!/^[\w-]+$/.test(key || '')) return false;
    const entry = entryFor(key);
    return !!entry && entry.group === 'patterns';
  }

  function isFullPanel(key) {
    return singlePanel.has(key) || entryFor(key)?.full_panel === true;
  }

  function supportsBorder(key) {
    return !!entryFor(key) && !!root.LofiCNCBorder?.isBorder(key);
  }

  function supportsInsert(key) {
    return entryFor(key)?.group === 'inserts';
  }

  function supportsEvenInsert(key) {
    return !!root.LofiUniformInsertIndex?.[key];
  }

  function insertSize(source, width, height) {
    const factor = Math.min(300 / Math.max(source.width, source.height),
      width * .5 / source.width, height * .5 / source.height);
    return { width: source.width * factor, height: source.height * factor };
  }

  function insertDefaults(id, width, height, evenInsert = supportsEvenInsert(id)) {
    const source = root.LofiCNCShapes?.[id];
    const normalized = evenInsert ? source?.even : source;
    return {
      x: width / 2, y: height / 2, ...insertSize(normalized || entryFor(id), width, height),
      angle: 0, mirror: false, lock: true, rim_adjust: 0, even_insert: evenInsert
    };
  }

  function supportsCut(key) {
    return entryFor(key)?.group === 'cutout_patterns' && !supportsBorder(key);
  }

  function cutDefaults(id, width, height) {
    const source = entryFor(id);
    const shortSide = Math.min(source.width, source.height);
    const longSide = Math.max(source.width, source.height);
    const preferred = Math.min(300 / longSide,
      width * .5 / source.width, height * .5 / source.height);
    const factor = Math.min(10000 / longSide, Math.max(5 / shortSide, preferred));
    return {
      x: width / 2, y: height / 2,
      width: Math.max(5, source.width * factor), height: Math.max(5, source.height * factor),
      angle: 0, mirror: false, lock: true
    };
  }

  function borderDefaults(id, width, height, hasPattern) {
    const smallestSide = Math.min(width, height);
    const photo = id.startsWith('borders__anh_');
    return {
      id, enabled: true, width: Math.min(photo ? 110 : 90, smallestSide * .12),
      module: photo ? 100 : 90, gap: Math.min(4, smallestSide * .03), join_equal: true,
      center_mode: hasPattern ? 'inherit' : 'hollow'
    };
  }

  function borderConfig(id, width, height, hasPattern, hasCut, frameless, settings) {
    const draft = { ...borderDefaults(id, width, height, hasPattern), ...settings, id };
    if (frameless) {
      const layout = draft.layout?.enabled ? draft.layout : { width, height };
      if (layout.width > width || layout.height > height) {
        throw Error('Khổ diềm riêng phải nằm trong kích thước lọt lòng của ô.');
      }
      draft.layout = { ...layout, enabled: true };
    } else if (!hasPattern) {
      if (draft.center_mode === 'pattern') throw Error('Chọn mẫu Hình học cho phần giữa trước.');
      if (!settings?.center_mode || draft.center_mode === 'inherit') draft.center_mode = hasCut ? 'solid' : 'hollow';
    }
    if (draft.inner_frame) {
      const rim = draft.inner_frame.width ?? draft.gap;
      draft.inner_frame = { equal: true, width: rim, left: rim, right: rim, top: rim, bottom: rim, ...draft.inner_frame };
    }
    return root.LofiCNCBorder.normalize(draft);
  }

  function activeArtwork(key, { insert = '', border = '', cut = '', borderSettings, mode = 'pattern', solidFill = false }) {
    if (mode === 'solid') return { primary: '', insert: '', border: '', cut, staticArt: '', fillSolid: solidFill === true };
    if (borderSettings?.enabled === false) border = '';
    const center = border ? borderSettings?.center_mode : undefined;
    const showArtwork = !(border && mode === 'frameless') &&
      (mode !== 'hollow' || center === 'pattern') && center !== 'hollow' && center !== 'solid';
    const repeat = showArtwork && supports(key);
    return { primary: repeat ? key : '', insert, border, cut: mode === 'pattern' ? cut : '',
      staticArt: showArtwork && !repeat ? key || '' : '' };
  }

  function loadAssetScript(key, folder) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = folder + '/' + key + '.js';
      script.onload = () => {
        script.remove();
        resolve();
      };
      script.onerror = () => {
        script.remove();
        reject(Error('Không nạp được hoa văn ' + entryFor(key).name + '.'));
      };
      document.head.appendChild(script);
    });
  }

  function loadAssetOnce(key, folder) {
    const path = folder + '/' + key;
    if (!loading.has(path)) loading.set(path, loadAssetScript(key, folder).finally(() => loading.delete(path)));
    return loading.get(path);
  }

  async function loadPattern(key, even = false) {
    if (!root.LofiCNCShapes?.[key]) await loadAssetOnce(key, 'source_shapes');
    const pattern = root.LofiCNCShapes?.[key];
    if (!pattern) throw Error('Không nạp được hoa văn ' + entryFor(key).name + '.');
    if (even && !pattern.even) await loadAssetOnce(key, 'uniform');
    return pattern;
  }

  function centeredOffset(span, pitch) {
    // Center the closest whole number of repeats. Even counts meet at a
    // seam; odd counts put the middle tile on the center of the opening.
    const repeats = Math.max(1, Math.round(span / pitch));
    return repeats % 2 ? -pitch / 2 : 0;
  }

  function checkLatest(slot, revision) {
    if (slot && revisions.get(slot) !== revision) {
      const cancelled = Error('Đã hủy phép tính hoa văn cũ.');
      cancelled.cancelled = true;
      throw cancelled;
    }
  }

  async function buildPanel(config, assets, mesh, slot, revision) {
    if (slot && root.Worker && root.LofiGeometryJobs) {
      if (!workers.has(slot)) workers.set(slot, root.LofiGeometryJobs.create());
      const worker = workers.get(slot);
      if (worker) {
        try {
          return await worker.run({kind: 'panel', config, assets, mesh});
        } catch (error) {
          checkLatest(slot, revision);
          const startupFailed = error.name === 'SecurityError' ||
            error.message.startsWith('Không khởi động được tính toán nền.');
          if (!startupFailed) throw error;
          workers.set(slot, null);
        }
      }
    }
    return panel.build(config, assets, mesh);
  }

  function slotGeometry(result, height, depth, scale, web) {
    // Preview and SketchUp use the same closed parts. Only preview
    // coordinates are flipped top-down. Panel contours do not depend on depth.
    const paths = result.solids.map(solid => solid.loops.map(loop =>
      geometry.path(loop.map(([x, y]) => [x, height - y]))).join(''));
    const solids = result.solids.map(solid => ({...solid, depth}));
    return { paths, solids, scale, web, borderInfo: result.border_info, innerFrameInfo: result.inner_frame_info };
  }

  async function build(key, options, mesh = false) {
    const {width, height, depth, scale = defaultScale, web = 0, angle = 0, offsetX = 0, offsetY = 0,
      equalMargins = true, margin = 0, left = 0, right = 0, top = 0, bottom = 0,
      weld = false, follow = true, borderSettings, cutSettings, insertSettings, mode = 'pattern'} = options;
    const { primary: patternKey, insert, border, cut, fillSolid } = activeArtwork(key, options);
    const framelessBorder = mode === 'frameless' && !!border;
    if (fillSolid && !cut) {
      const outer = [[0, 0], [width, 0], [width, height], [0, height]];
      const solid = { loops: [outer], mesh: mesh ? geometry.triangulate(outer, []) : null, z: 0, area: width * height };
      return slotGeometry({solids: [solid]}, height, depth, scale, web);
    }
    if (!patternKey && !border && !insert && !cut) return null;
    if (border && !supportsBorder(border)) throw Error('Mẫu chạy viền không có trong thư viện.');
    if (insert && !supportsInsert(insert)) throw Error('Họa tiết chèn không có trong thư viện.');
    if (cut && !supportsCut(cut)) throw Error('Mẫu đục tấm không có trong thư viện.');
    const slot = options.slot === 'upper' || options.slot === 'lower' ? options.slot : null;
    const revision = {};
    if (slot) revisions.set(slot, revision);
    const evenInsert = insert && (insertSettings?.even_insert ?? supportsEvenInsert(insert));
    if (evenInsert && !supportsEvenInsert(insert)) throw Error('Mẫu này chưa có đường bao đã làm đều.');
    const keys = [patternKey, border, insert, cut].filter(Boolean);
    const assets = Object.fromEntries(await Promise.all(keys.map(async id => [id, await loadPattern(id, id === insert && evenInsert)])));
    checkLatest(slot, revision);
    const panelMode = framelessBorder ? 'frameless' : patternKey || border ? 'pattern' : cut ? 'solid' : 'frameless';
    const config = {
      id: keys[0], width, height, thickness: 1, _region_local: true,
      mode: panelMode, outline: 'rectangle', frame: 0,
      equal_margins: false, left: 0, right: 0, top: 0, bottom: 0,
      weld: false, module: scale, bar_adjust: web, full_panel: false, items: []
    };

    if (patternKey) {
      const values = {width, height, scale, angle, offsetX, offsetY, equalMargins, margin,
        left, right, top, bottom, weld, follow};
      const source = assets[patternKey];
      if (isFullPanel(patternKey) || source.full_panel === true) {
        assets[patternKey] = fitCompletePanel(config, source, values);
      } else {
        Object.assign(config, patternPlacement(patternKey, source, values));
      }
    }
    if (border) config.border = borderConfig(border, width, height, !!patternKey, !!cut, framelessBorder, borderSettings);
    if (insert) {
      const source = evenInsert ? assets[insert].even : assets[insert];
      if (!source) throw Error('Không nạp được đường bao đã làm đều của họa tiết.');
      const defaults = insertSize(source, width, height);
      const { x = width / 2, y = height / 2, width: itemWidth = defaults.width, height: itemHeight = defaults.height,
        angle: turn = 0, mirror = false, lock = true, rim_adjust = 0 } = insertSettings || {};
      const item = {
        id: insert, mode: 'inlay', x, y, width: itemWidth, height: itemHeight, angle: turn, mirror, lock, rim_adjust
      };
      if (evenInsert) item.even_insert = true;
      config.items.push(item);
    }
    if (cut) config.items.push({
      ...cutDefaults(cut, width, height), ...cutSettings, id: cut, mode: 'cut'
    });
    const result = await buildPanel(config, assets, mesh, slot, revision);
    checkLatest(slot, revision);
    if (panelMode === 'frameless' && result.solids.some(solid => solid.loops.some(loop =>
      loop.some(([x, y]) => x < -.001 || y < -.001 || x > width + .001 || y > height + .001)))) {
      throw Error(insert ? 'Họa tiết hoặc viền vượt ô khung. Chỉnh lại vị trí và kích thước.' :
        'Khổ diềm vượt ô khung. Giảm khổ bố trí hoặc bề rộng viền bao.');
    }
    const geometryResult = slotGeometry(result, height, depth, scale, web);
    if (config.full_panel) geometryResult.allowDetached = true;
    return geometryResult;
  }

  function completePanelTemplate(source) {
    if (!source.photo33_grid) return source;
    if (preparedPanels.has(source)) return preparedPanels.get(source);
    // The source keeps the construction grid for all four bays of Vách 33.
    // Build its full preset once, then fit and transform those complete contours.
    const preset = entryFor(source.id).panel_preset;
    const draft = {...preset, frame: 0, offset_x: 0, weld: false};
    const complete = panel.build(draft, {[source.id]: source}, false);
    const template = {
      width: complete.width,
      height: complete.height,
      parts: complete.solids.map(({loops: [outer, ...holes]}) => ({outer, holes}))
    };
    preparedPanels.set(source, template);
    return template;
  }

  function openingInsets({equalMargins, margin, left, right, top, bottom, weld, follow}) {
    return [left, right, top, bottom].map(inset => weld && follow ? 0 : equalMargins ? margin : inset);
  }

  function fitCompletePanel(config, source, values) {
    const {width, height, scale, angle, offsetX, offsetY} = values;
    const [l, r, t, b] = openingInsets(values);
    if (l + r >= width || t + b >= height) throw Error('Khoảng lùi chiếm hết vùng hoa văn.');
    const template = completePanelTemplate(source);
    const factor = Math.min((width - l - r) / template.width, (height - t - b) / template.height) * scale / defaultScale;
    const fit = loop => loop.map(([x, y]) => [
      width / 2 + (x - template.width / 2) * factor,
      height / 2 + (y - template.height / 2) * factor
    ]);
    // An explicit clipping outline keeps the fit and every subsequent edit on
    // the standard panel clipping path, including scales larger than the opening.
    Object.assign(config, {
      full_panel: true, outline: 'custom',
      custom_outer: [[0, 0], [width, 0], [width, height], [0, height]],
      left: l, right: r, top: t, bottom: b, angle,
      offset_x: (l - r) / 2 + offsetX, offset_y: (b - t) / 2 + offsetY
    });
    return {
      width, height, full_panel: true,
      parts: template.parts.map(({outer, holes}) => ({outer: fit(outer), holes: holes.map(fit)}))
    };
  }

  function patternPlacement(key, pattern, {width, height, scale, angle, offsetX, offsetY,
    equalMargins, margin, left, right, top, bottom, weld, follow}) {
    const cell = pattern.repeat_cell || pattern;
    const [l, r, t, b] = openingInsets({equalMargins, margin, left, right, top, bottom, weld, follow});
    const availableWidth = width - l - r;
    const availableHeight = height - t - b;
    const radians = angle * Math.PI / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const calibrated = key === 'patterns__vach_032';
    const pitchY = scale * cell.height / cell.width;
    const spanX = availableWidth * Math.abs(cos) + availableHeight * Math.abs(sin);
    const spanY = availableWidth * Math.abs(sin) + availableHeight * Math.abs(cos);
    const phaseX = calibrated ? 0 : centeredOffset(spanX, scale);
    const phaseY = centeredOffset(spanY, pitchY);
    let x = (calibrated ? 0 : (l - r) / 2) + phaseX * cos - phaseY * sin + offsetX;
    let y = (calibrated ? 0 : (b - t) / 2) + phaseX * sin + phaseY * cos + offsetY;
    if (![offsetX, offsetY].every(value => Number.isFinite(value) && Math.abs(value) <= 10000)) {
      throw Error('Dịch X/Y phải từ −10.000 đến 10.000 mm.');
    }
    if (Math.max(Math.abs(x), Math.abs(y)) > 10000) {
      // Shifting a periodic pattern by whole rotated modules is equivalent.
      // Keep the internal phase within the shared engine's offset range.
      const u = x * cos + y * sin;
      const v = y * cos - x * sin;
      const localX = u - scale * Math.round(u / scale);
      const localY = v - pitchY * Math.round(v / pitchY);
      x = localX * cos - localY * sin;
      y = localX * sin + localY * cos;
    }
    // Vách 032 has an asymmetric aperture with its own centering in the
    // ordinary panel engine, which also centers it inside the actual insets.
    return {left: l, right: r, top: t, bottom: b, angle, offset_x: x, offset_y: y};
  }

  function grid(x, y) {
    return {X: Math.round(x * coordinatesPerMm), Y: Math.round(y * coordinatesPerMm)};
  }

  function rectangle([x, y, width, height]) {
    return [grid(x, y), grid(x + width, y), grid(x + width, y + height), grid(x, y + height)];
  }

  function union(left, right) {
    const engine = new clipper.Clipper(clipper.Clipper.ioStrictlySimple);
    const result = [];
    engine.AddPaths(left, clipper.PolyType.ptSubject, true);
    engine.AddPaths(right, clipper.PolyType.ptClip, true);
    if (!engine.Execute(clipper.ClipType.ctUnion, result, clipper.PolyFillType.pftNonZero, clipper.PolyFillType.pftNonZero)) {
      throw Error('Không hàn được đường biên hoa văn với khung.');
    }
    return result;
  }

  function patternPaths(result, [x, y, width, height]) {
    function placed(point, size, start) {
      // The source engine rounds to 0.0001 mm in each opening. Snap endpoints
      // back to their exact opening edges before combining with the frame.
      if (Math.abs(point) <= .0001) return start;
      if (Math.abs(point - size) <= .0001) return start + size;
      return start + point;
    }
    return result.solids.flatMap(solid => solid.loops.map((loop, index) => {
      const points = (geometry.area(loop) > 0) === (index === 0) ? loop : loop.slice().reverse();
      return points.map(([u, v]) => grid(placed(u, width, x), placed(v, height, y)));
    }));
  }

  function buildWelded({width, height, depth, openings, patterns, solid = false}) {
    const slots = ['upper', 'lower'].filter(slot => patterns[slot]);
    if (!slots.length) return null;
    const holes = solid ? slots : ['upper', 'lower'];
    let combined = [rectangle([0, 0, width, height]), ...holes.map(slot => rectangle(openings[slot]).reverse())];
    let regions = panel.parts(combined).length;
    for (const slot of slots) {
      const art = patternPaths(patterns[slot], openings[slot]);
      const detachedCount = panel.parts(art).length;
      const merged = union(combined, art);
      const mergedCount = panel.parts(merged).length;
      if (!solid && !patterns[slot].allowDetached && (!detachedCount || mergedCount >= regions + detachedCount)) {
        const side = slot === 'upper' ? 'trên' : 'dưới';
        throw Error('Hoa văn vùng ' + side + ' chưa chạm khung. Bật bám theo viền hoặc giảm khoảng lùi.');
      }
      combined = merged;
      regions = mergedCount;
    }

    let points = 0;
    const parts = panel.solidParts(combined);
    if (parts.length > 1024) throw Error('Khung hàn quá nhiều chi tiết. Tăng cỡ hoa văn.');
    const solids = parts.map(({outer, holes}) => {
      const loops = [outer, ...holes];
      points += loops.reduce((count, loop) => count + loop.length, 0);
      if (points > 35000) throw Error('Khung hàn quá nhiều điểm. Tăng cỡ hoa văn.');
      const area = Math.abs(geometry.area(outer)) - holes.reduce((sum, hole) => sum + Math.abs(geometry.area(hole)), 0);
      return {loops, mesh: geometry.triangulate(outer, holes), z: 0, depth, area};
    });
    const warnings = regions > 1 ? ['Vẫn còn nét rời bên trong ô. Kiểm tra liên kết trước khi gia công.'] : [];
    return {slots, solids, warnings};
  }

  root.LofiSpecialFramePatterns = {build, buildWelded, supports, isFullPanel, supportsBorder, supportsInsert, supportsEvenInsert,
    supportsCut, borderDefaults, cutDefaults, insertDefaults, activeArtwork, defaultScale};
})(window);
