# encoding: UTF-8
# B-063 is built from its approved contours, never from the obsolete source SKP.
require 'digest'

module LVN
  module PhaoChiV305CornerLite
    CNC_CONTOUR_SOURCE_ID = 'patterns__capnhat_b-063'.freeze unless const_defined?(:CNC_CONTOUR_SOURCE_ID)
    CNC_CONTOUR_POINT_LIMIT = 40_000 unless const_defined?(:CNC_CONTOUR_POINT_LIMIT)

    def self.cnc_source_contour_item?(item)
      item.is_a?(Hash) && item['id']==CNC_CONTOUR_SOURCE_ID &&
        item['build_from_contours']==true && item['revision'].to_i>=2 &&
        item['width']==600 && item['height']==1300 && item['model'].nil?
    end

    def self.cnc_panel_mesh_point_limit(config)
      return 35_000 unless config.is_a?(Hash) && config['id']==CNC_CONTOUR_SOURCE_ID
      item=cnc_source_item(config['id'])
      cnc_source_contour_item?(item) ? CNC_CONTOUR_POINT_LIMIT : 35_000
    end

    # Match the minimal ASCII R12 form confirmed in JDPaint for this drawing.
    def self.cnc_source_contour_dxf(loops)
      text=['999','LOFIHOME JDP: 1 drawing unit = 1 mm; planar contours only.',
        '0','SECTION','2','HEADER','9','$ACADVER','1','AC1009',
        '9','$LUNITS','70','2','9','$LUPREC','70','4',
        '9','$INSBASE','10','0','20','0','30','0','0','ENDSEC',
        '0','SECTION','2','TABLES','0','TABLE','2','LTYPE','70','1',
        '0','LTYPE','2','CONTINUOUS','70','0','3','Solid line','72','65','73','0','40','0','0','ENDTAB',
        '0','TABLE','2','LAYER','70','3']
      ['0','OUTLINE','HOLE'].each do |layer|
        text+=['0','LAYER','2',layer,'70','0','62','7','6','CONTINUOUS']
      end
      text+=['0','ENDTAB','0','ENDSEC','0','SECTION','2','BLOCKS','0','ENDSEC','0','SECTION','2','ENTITIES']
      loops.each do |loop|
        layer=loop.fetch('layer')
        raise 'Lớp đường bao B-063 không hợp lệ.' unless ['OUTLINE','HOLE'].include?(layer)
        text+=['0','POLYLINE','8',layer,'66','1','10','0','20','0','30','0','70','1']
        loop.fetch('points').each do |x,y|
          text+=['0','VERTEX','8',layer,'10',format('%.6f',x),'20',format('%.6f',y),'30','0','70','0']
        end
        text+=['0','SEQEND','8',layer]
      end
      (text+['0','ENDSEC','0','EOF']).join("\r\n")+"\r\n"
    end

    def self.cnc_source_contour_mesh(item)
      raise 'Mẫu không có bộ dựng từ đường bao.' unless cnc_source_contour_item?(item)
      source=File.join(cnc_source_root,'prepared',CNC_CONTOUR_SOURCE_ID+'.json')
      cache=File.join(cnc_source_root,'prepared',CNC_CONTOUR_SOURCE_ID+'_mesh.json')
      raise 'Thiếu dữ liệu dựng B-063. Cài lại gói cập nhật.' unless File.file?(source) && File.file?(cache)
      raise 'Dữ liệu dựng B-063 quá lớn.' if File.size(source)>2_000_000 || File.size(cache)>5_000_000
      data=JSON.parse(File.read(cache,encoding:'UTF-8'))
      valid=data.is_a?(Hash) && data['format']=='LOFIHOME_CONTOUR_MESH_1' &&
        data['id']==CNC_CONTOUR_SOURCE_ID && data['revision']==item['revision'] &&
        data['width']==item['width'] && data['height']==item['height'] &&
        data['thickness']==item['thickness'] &&
        data['source_sha256']==Digest::SHA256.file(source).hexdigest
      raise 'Dữ liệu dựng B-063 không khớp đường bao đã cập nhật.' unless valid
      mesh=data.fetch('mesh')
      cnc_validate_mesh(mesh,CNC_CONTOUR_POINT_LIMIT)
      raise 'B-063 phải có đủ viền ngoài và 290 lỗ khoét.' unless mesh['loops'].length==291
      xs=mesh['points'].map(&:first);ys=mesh['points'].map(&:last)
      raise 'Kích thước đường bao B-063 không hợp lệ.' unless xs.min==0 && ys.min==0 && xs.max==600 && ys.max==1300
      mesh['contour_prism']=true
      mesh
    end

    # The caller owns the SketchUp operation, so failed construction is rolled back.
    def self.cnc_source_contour_definition(model,item)
      mesh=cnc_source_contour_mesh(item)
      definition=model.definitions.add(item['name'])
      piece=definition.entities.add_group
      piece.name=item['name']
      cnc_mesh_solid(piece.entities,mesh,item['thickness'],0,1000.0,CNC_CONTOUR_POINT_LIMIT)
      piece.transformation=Geom::Transformation.scaling(0.001)
      raise 'B-063 chưa thành khối kín; chưa chèn hoặc lưu tệp.' unless Compat.manifold?(piece)
      definition
    end

    # Export a temporary definition; the active drawing and Undo history stay intact.
    def self.cnc_source_export_contour_skp(item,path)
      raise 'Mẫu không có bộ dựng từ đường bao.' unless cnc_source_contour_item?(item)
      model=Sketchup.active_model
      if model.respond_to?(:path) && !model.path.to_s.empty? && File.expand_path(path).casecmp(File.expand_path(model.path))==0
        raise 'Chọn tên tệp khác bản vẽ đang mở.'
      end
      temp=File.join(File.dirname(path),'.lofi-b063-'+Compat.unique_key+'.skp')
      started=model.start_operation('LOFIHOME · Xuất B-063',true)
      raise 'Không mở được thao tác xuất B-063.' if started==false
      begin
        definition=cnc_source_contour_definition(model,item)
        raise 'Không lưu được B-063 thành SKP.' unless definition.save_as(temp)
      ensure
        model.abort_operation
      end
      raise 'Không tạo được tệp B-063.' unless File.file?(temp) && File.size(temp)>0
      File.rename(temp,path)
      temp=nil
      true
    ensure
      File.delete(temp) if temp && File.file?(temp)
    end
  end
end
