(function (root) {
  'use strict';

  const host = root.CorelHost;
  if (!host || typeof root.lofiCNCReply !== 'function' || root.LofiSpecialFrameHost) return;

  const kind = 'special_frame_config';
  const editor = 'lofi_two_zone';
  const name = 'Khung CNC hai vùng';
  const slots = ['upper', 'lower'];
  const modes = ['pattern', 'solid', 'hollow', 'frameless'];
  const dimensionKeys = ['w', 'h', 'depth', 'left', 'right', 'top', 'bottom', 'lower', 'rail'];
  const configReplyTypes = new Set([kind, 'panel_config', 'source_config', 'config']);
  let selectionRead = null;
  let loadedTarget = null;
  let selectionEpoch = 0;
  let sequence = 0;

  // The native load action replies with the stored object's kind and then
  // acknowledges its request. Don't load an ordinary panel into its editor
  // when the user asked for a special frame.
  const forwardReply = root.lofiCNCReply;
  root.lofiCNCReply = function (reply) {
    if (selectionRead && reply && configReplyTypes.has(reply.type)) {
      selectionRead.reply = reply;
      return;
    }
    return forwardReply.apply(this, arguments);
  };

  function openings(config) {
    if (!config || !modes.includes(config.frame_mode) || !dimensionKeys.every(key =>
      Number.isFinite(config[key]) && config[key] >= 0.5 && config[key] <= 10000
    )) throw new Error('Kích thước khung phải nằm trong khoảng 0,5–10.000 mm.');

    const x = config.left;
    const width = config.w - x - config.right;
    const y = config.bottom + config.lower + config.rail;
    const height = config.h - config.top - y;
    if (width < 0.5 || height < 0.5) {
      throw new Error('Khung cần còn ít nhất 0,5 mm lọt lòng mỗi chiều.');
    }
    return { upper: [x, y, width, height], lower: [x, config.bottom, width, config.lower] };
  }

  function rectangle(x, y, width, height) {
    return [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];
  }

  function appendSolids(contours, solids, area, depth) {
    if (!Array.isArray(solids) || !solids.length) {
      throw new Error('Không có đường bao hoa văn để tạo vector.');
    }
    const [x, y, width, height] = area;
    const tolerance = 0.001;
    for (const solid of solids) {
      const loops = solid?.mesh?.loops;
      if (!Array.isArray(loops) || !loops.length || solid.z !== 0 ||
          !Number.isFinite(solid.depth) || Math.abs(solid.depth - depth) > tolerance) {
        throw new Error('Thông số hoa văn không khớp khung.');
      }
      contours.push({ z: 0, loops: loops.map(loop => {
        if (!Array.isArray(loop) || loop.length < 3) throw new Error('Đường bao hoa văn chưa kín.');
        return loop.map(point => {
          if (!Array.isArray(point) || point.length !== 2) throw new Error('Tọa độ hoa văn không hợp lệ.');
          const [a, b] = point;
          if (!Number.isFinite(a) || !Number.isFinite(b) || a < -tolerance || b < -tolerance ||
              a > width + tolerance || b > height + tolerance) {
            throw new Error('Đường nét hoa văn vượt khỏi biên.');
          }
          return [a + x, b + y];
        });
      }) });
    }
  }

  function framePacket(frame) {
    const { config, patterns = {}, welded } = frame;
    const areas = openings(config);
    const contours = [];
    const { w: width, h: height, depth, frame_mode: mode } = config;

    if (welded) {
      const weldedSlots = welded.slots;
      if (mode === 'frameless' || !Array.isArray(weldedSlots) || !weldedSlots.length ||
          new Set(weldedSlots).size !== weldedSlots.length ||
          weldedSlots.some(slot => !slots.includes(slot) || patterns[slot])) {
        throw new Error('Dữ liệu hàn không khớp các vùng đã chọn.');
      }
      appendSolids(contours, welded.solids, [0, 0, width, height], depth);
    } else if (mode !== 'frameless') {
      const loops = [rectangle(0, 0, width, height)];
      if (mode !== 'solid') {
        for (const slot of slots) loops.push(rectangle(...areas[slot]).reverse());
      }
      contours.push({ loops, z: 0 });
    }

    for (const slot of slots) {
      if (patterns[slot]) appendSolids(contours, patterns[slot].solids, areas[slot], depth);
    }
    if (!contours.length) throw new Error('Chọn hoa văn hoặc họa tiết trước khi bỏ khung.');
    if (contours.length > 1024 ||
        contours.reduce((sum, contour) => sum + contour.loops.reduce((n, loop) => n + loop.length, 0), 0) > 35000) {
      throw new Error('Hai vùng có quá nhiều chi tiết. Hãy tăng cỡ hoa văn.');
    }

    return host.packet({ contours, config, name, width, height }, kind);
  }

  function useLoaded(config, selection) {
    if (!selection || typeof selection.document !== 'string' || !selection.document ||
        typeof selection.handle !== 'string' || !/^[0-9a-f]+$/i.test(selection.handle)) {
      throw new Error('AutoCAD chưa trả về đúng block đã chọn. Hãy chọn lại khung.');
    }
    openings(config);
    if (config.editor !== editor || typeof config.special_frame_id !== 'string' || !config.special_frame_id) {
      throw new Error('Hãy chọn một khung hai vùng LOFIHOME trong AutoCAD.');
    }
    loadedTarget = { id: config.special_frame_id,
      document: selection.document, handle: selection.handle };
    return config;
  }

  function readSelection() {
    if (selectionRead) return selectionRead.promise;
    const state = {};
    selectionRead = state;
    state.promise = (async () => {
      try {
        await host.send('panel_load_selected', {});
        if (state.reply?.type !== kind) throw new Error('Hãy chọn một khung hai vùng LOFIHOME trong AutoCAD.');
        return state.reply;
      } finally {
        selectionRead = null;
      }
    })();
    return state.promise;
  }

  async function read() {
    const epoch = selectionEpoch;
    const selected = await readSelection();
    if (epoch !== selectionEpoch) throw new Error('Đã đóng bảng khung trong khi đọc.');
    return useLoaded(selected.config, selected.selection);
  }

  function clearSelection() {
    loadedTarget = null;
    selectionEpoch++;
  }

  function newId() {
    return 'frame-' + Date.now().toString(36) + '-' + (++sequence).toString(36) +
      '-' + Math.random().toString(36).slice(2);
  }

  async function apply(frame) {
    if (!frame || !['create', 'update'].includes(frame.mode)) throw new Error('Lệnh tạo khung không hợp lệ.');
    const update = frame.mode === 'update';
    const epoch = selectionEpoch;
    // Keep the native selected-document guard and also refuse the other
    // LOFIHOME object types before taking the native update path.
    const target = loadedTarget;
    if (update && !target) throw new Error('Bấm Lấy khung chọn trước khi cập nhật.');
    const config = { ...frame.config, editor, special_frame_id: update ? target.id : newId(),
      material: frame.config?.material || '#b07c4b' };
    const packet = framePacket({ ...frame, config });
    if (update) {
      const selected = await readSelection();
      if (epoch !== selectionEpoch || selected.config.editor !== editor ||
          selected.config.special_frame_id !== target.id || selected.selection?.handle !== target.handle ||
          selected.selection?.document !== target.document) {
        throw new Error('Khung đang chọn đã đổi. Bấm Lấy khung chọn trước khi cập nhật.');
      }
      packet.expected_frame_selection = { handle: target.handle, document: target.document };
    }
    await host.send(update ? 'corel_update' : 'corel_create', packet);
    if (!update && epoch === selectionEpoch) loadedTarget = null;
    return { mode: frame.mode, config };
  }

  root.LofiSpecialFrameHost = { apply, read, useLoaded, clearSelection, framePacket };
})(window);
