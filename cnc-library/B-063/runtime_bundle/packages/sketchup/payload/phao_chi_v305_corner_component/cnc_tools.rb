# encoding: UTF-8
require 'json'
require 'fileutils'
require File.join(File.dirname(__FILE__),'geometry_builder')
require File.join(File.dirname(__FILE__),'cnc_custom_outline')
require File.join(File.dirname(__FILE__),'cnc_region_capture')
require_relative 'cnc_insert_edges'

module LVN
  module PhaoChiV305CornerLite
    CNC_SCHEMA = 'LOFIHOME_CNC_1'.freeze unless const_defined?(:CNC_SCHEMA)
    def self.cnc_reply(data)
      window = @cnc_window
      window.execute_script("lofiCNCReply(#{JSON.generate(data)})") if window && window.visible?
    end
    def self.cnc_store
      File.join(ENV['APPDATA'] || Dir.home, 'LVNTools', 'LOFIHOME_CNC', 'presets.json')
    end
    def self.cnc_presets
      portable_initialize
      return [] unless File.file?(cnc_store)
      JSON.parse(File.read(cnc_store, :encoding=>'UTF-8')).fetch('items', [])
    end
    def self.cnc_write_presets(items)
      raise 'Thư viện tối đa 500 mẫu.' if items.length > 500
      FileUtils.mkdir_p(File.dirname(cnc_store))
      temporary = cnc_store + '.tmp-' + Compat.unique_key(4)
      File.write(temporary, JSON.pretty_generate({'format'=>CNC_SCHEMA, 'items'=>items}), :encoding=>'UTF-8')
      File.rename(temporary, cnc_store)
    ensure
      File.delete(temporary) if temporary && File.file?(temporary)
    end
    def self.cnc_number(value, min, max, label)
      n = Float(value)
      raise "#{label} không hợp lệ." unless n.finite? && n >= min && n <= max
      n
    end
    def self.cnc_validate_mesh(mesh,point_limit=35_000)
      points = mesh.fetch('points')
      triangles = mesh.fetch('triangles')
      loops = mesh.fetch('loops')
      raise 'Giới hạn điểm CNC không hợp lệ.' unless [35_000,40_000].include?(point_limit)
      raise 'Số điểm CNC không hợp lệ.' unless points.is_a?(Array) && points.length.between?(3, point_limit)
      raise 'Số tam giác CNC không hợp lệ.' unless triangles.is_a?(Array) && triangles.length.between?(3, 210_000) && triangles.length % 3 == 0
      points.each do |p|
        raise 'Tọa độ CNC không hợp lệ.' unless p.is_a?(Array) && p.length == 2
        p.each { |v| cnc_number(v, -10_001, 10_001, 'Tọa độ') }
      end
      raise 'Chỉ số tam giác không hợp lệ.' unless triangles.all? { |i| i.is_a?(Integer) && i >= 0 && i < points.length }
      raise 'Biên CNC không hợp lệ.' unless loops.is_a?(Array) && loops.length.between?(1, 11_666) && loops.all? { |p| p.is_a?(Array) && p.length >= 3 } && loops.flatten(1) == points
      true
    end
    def self.cnc_mesh_solid(entities, data, depth, z = 0, build_scale = 1.0, point_limit = 35_000)
      cnc_validate_mesh(data,point_limit)
      if data['contour_prism']
        # On detailed fretwork SUEntitiesFill can discard otherwise valid
        # side triangles. Build the extrusion directly from its cut contours.
        levels=[z,z+depth].map do |level|
          data['loops'].map { |loop| loop.map { |x,y| Geom::Point3d.new(x.mm*build_scale,y.mm*build_scale,level.mm*build_scale) } }
        end
        lower,upper=levels
        GeometryBuilder.build(entities) do |builder|
          builder.add_face(lower.first.reverse,holes:lower.drop(1).map(&:reverse))
          builder.add_face(upper.first,holes:upper.drop(1))
          lower.each_with_index do |loop,index|
            loop.each_index do |i|
              j=(i+1)%loop.length
              builder.add_face([loop[i],loop[j],upper[index][j],upper[index][i]])
            end
          end
        end
        return
      end
      points = data['points']; count = points.length
      mesh = Geom::PolygonMesh.new(count * 2, data['triangles'].length / 3 * 2 + count)
      [z, z + depth].each { |level| points.each { |x,y| mesh.add_point(Geom::Point3d.new(x.mm*build_scale, y.mm*build_scale, level.mm*build_scale)) } }
      data['triangles'].each_slice(3) do |a,b,c|
        p = points[a]; q = points[b]; r = points[c]
        cross = (q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0])
        raise 'Tam giác CNC suy biến.' if cross.abs < 1.0e-9
        b,c = c,b if cross < 0
        mesh.add_polygon(a+1,c+1,b+1)
        mesh.add_polygon(a+count+1,b+count+1,c+count+1)
      end
      offset = 0
      data['loops'].each do |loop|
        loop.length.times do |i|
          a = offset+i+1; b = offset+(i+1)%loop.length+1
          if data['triangulate_sides']
            # Split side quads for rim joins that SketchUp may otherwise drop.
            p,q=loop[i],loop[(i+1)%loop.length]
            if data['alternate_short_sides'] && (p[0]-q[0])**2+(p[1]-q[1])**2 < 0.05**2
              # SUEntitiesFill loses the other diagonal on some short side
              # walls where the cutter opening joins the panel pattern.
              mesh.add_polygon(a,b,a+count)
              mesh.add_polygon(b,b+count,a+count)
            else
              mesh.add_polygon(a,b,b+count)
              mesh.add_polygon(a,b+count,a+count)
            end
          else
            mesh.add_polygon(a,b,b+count,a+count)
          end
        end
        offset += loop.length
      end
      entities.fill_from_mesh(mesh, true, 0)
      entities.grep(Sketchup::Edge).each do |edge|
        faces=edge.faces
        edge.hidden=true if faces.length==2 && faces[0].normal.dot(faces[1].normal)>0.99999
      end
    end
    def self.cnc_smooth_walls(entities,settings)
      return unless settings && settings['enabled']==true && settings['mode']=='arcs' && settings['angle'].to_f>0
      threshold=Math.cos([settings['angle'].to_f,89.9].min*Math::PI/180)
      entities.grep(Sketchup::Edge).each do |edge|
        a,b=edge.faces;next unless edge.faces.length==2 && a.normal.z.abs<1e-7 && b.normal.z.abs<1e-7
        next unless a.material==b.material && a.back_material==b.back_material && a.normal.dot(b.normal)>threshold
        edge.soft=true;edge.smooth=true
      end
    end
    def self.cnc_selected
      item=Sketchup.active_model.selection.to_a.find { |e| (e.is_a?(Sketchup::Group) || e.is_a?(Sketchup::ComponentInstance)) && e.get_attribute(CNC_SCHEMA,'config') }
      raise 'Chọn một vách do LOFIHOME CNC tạo.' unless item
      item
    end
    def self.cnc_create(data, update=false)
      model=Sketchup.active_model
      config=data.fetch('config')
      width=cnc_number(config['width'],50,10_000,'Rộng')
      height=cnc_number(config['height'],50,10_000,'Cao')
      thickness=cnc_number(config['thickness'],1,200,'Độ dày')
      cnc_validate_mesh(data.fetch('mesh'))
      old=update ? cnc_selected : nil
      raise 'Vách đang khóa; mở khóa trước khi cập nhật.' if old && old.locked?
      transform=old ? old.transformation : (cnc_custom_placement(config,model) || (config['plane']=='xy' ? Geom::Transformation.new : Geom::Transformation.axes(ORIGIN,X_AXIS,Z_AXIS,Geom::Vector3d.new(0,-1,0))))
      model.start_operation(update ? 'Cập nhật vách LOFIHOME CNC' : 'Tạo vách LOFIHOME CNC',true)
      started=true
      group=model.active_entities.add_group
      group.name=config['name'].to_s[0,100]
      base=group.entities.add_group; base.name='Tấm CNC'
      cnc_mesh_solid(base.entities,data['mesh'],thickness)
      raise 'Không dựng được tấm CNC kín. Vui lòng kiểm tra biên dạng.' unless Compat.manifold?(base)
      raised=Array(data['raised'])
      raise 'Tối đa 12 họa tiết chèn.' if raised.length>12
      raised.each_with_index do |item,i|
        detail=group.entities.add_group;detail.name="Họa tiết nổi #{i+1}"
        cnc_mesh_solid(detail.entities,item.fetch('mesh'),cnc_number(item['depth'],1,100,'Độ nổi'),thickness)
        CNCInsertEdges.apply(detail.entities)
        raise 'Họa tiết chèn chưa kín.' unless Compat.manifold?(detail)
      end
      color=config['material'].to_s
      if color.match(/\A#[0-9a-fA-F]{6}\z/)
        material=model.materials["LOFIHOME CNC #{color}"] || model.materials.add("LOFIHOME CNC #{color}")
        material.color=Sketchup::Color.new(color)
        group.material=material
      end
      group.set_attribute(CNC_SCHEMA,'config',JSON.generate(config))
      group.set_attribute(CNC_SCHEMA,'version','1')
      group.transformation=transform
      group.layer=old.layer if old
      old.erase! if old
      model.selection.clear;model.selection.add(group)
      model.commit_operation;started=false
      model.active_view.invalidate
      cnc_reply({'type'=>'status','message'=>"Đã #{update ? 'cập nhật' : 'tạo'} vách #{width.to_i} × #{height.to_i} × #{thickness} mm · #{data['holes']} lỗ đục."})
      group
    rescue => e
      model.abort_operation if started
      raise e
    end
    def self.cnc_register_callbacks(dialog)
      dialog.add_action_callback('cnc_action') do |context, raw|
        begin
          raise 'Dữ liệu CNC quá lớn.' if raw.to_s.bytesize>8_000_000
          request=JSON.parse(raw.to_s);payload=request['payload'] || {}
          case request['action']
          when 'split_plate'
            show_split_plate
          when 'line_cleanup'
            show_line_cleanup
          when 'insert_wall_cleanup'
            cnc_reply({'type'=>'status','message'=>CNCInsertEdges.repair(Sketchup.active_model)})
          when 'panel_item_dxf','panel_item_skp','panel_item_create','panel_place_insert','panel_place_commit','panel_place_failed','panel_create','panel_update','panel_load_selected','panel_capture_face','panel_capture_regions','panel_export_config','panel_import_config','panel_export_skp'
            cnc_panel_action(request['action'],payload)
          when 'source_layout_load','source_layout_save','source_insert','source_update','source_load_selected','source_native_insert','source_export'
            cnc_source_action(request['action'],payload)
          when 'panel_ready'
            @cnc_panel_ready = true
            if @cnc_custom_pending
              cnc_reply({'type'=>'open_custom_outline'})
              @cnc_custom_pending = false
            end
          when 'ready'
            cnc_reply({'type'=>'presets','items'=>cnc_presets})
          when 'create','update'
            cnc_create(payload,request['action']=='update')
          when 'load_selected'
            cnc_reply({'type'=>'config','config'=>JSON.parse(cnc_selected.get_attribute(CNC_SCHEMA,'config'))})
          when 'capture_face'
            cnc_capture_face
          when 'save_preset'
            items=cnc_presets
            items << {'id'=>SecureRandom.uuid,'name'=>payload.fetch('name').to_s[0,100],'config'=>payload.fetch('config')}
            cnc_write_presets(items);cnc_reply({'type'=>'presets','items'=>items,'message'=>'Đã lưu mẫu CNC.'})
          when 'delete_preset'
            items=cnc_presets.reject { |item| item['id']==payload['id'] }
            cnc_write_presets(items);cnc_reply({'type'=>'presets','items'=>items,'message'=>'Đã xóa mẫu đã chọn.'})
          when 'export_presets'
            path=UI.savepanel('Xuất thư viện LOFIHOME CNC','','LOFIHOME_CNC.json')
            if path
              File.write(path,JSON.pretty_generate({'format'=>CNC_SCHEMA,'items'=>cnc_presets}),:encoding=>'UTF-8')
              cnc_reply({'type'=>'status','message'=>'Đã xuất thư viện CNC.'})
            end
          when 'import_presets'
            path=UI.openpanel('Nhập thư viện LOFIHOME CNC','','JSON|*.json||')
            if path
              raise 'Tệp thư viện quá lớn.' if File.size(path)>5_000_000
              bundle=JSON.parse(File.read(path,:encoding=>'UTF-8'))
              raise 'Không phải thư viện LOFIHOME CNC.' unless bundle['format']==CNC_SCHEMA && bundle['items'].is_a?(Array)
              items=cnc_presets
              bundle['items'].each do |item|
                raise 'Mẫu nhập không hợp lệ.' unless item.is_a?(Hash) && item['config'].is_a?(Hash)
                items<<{'id'=>SecureRandom.uuid,'name'=>item['name'].to_s[0,100],'config'=>item['config']}
              end
              cnc_write_presets(items);cnc_reply({'type'=>'presets','items'=>items,'message'=>'Đã nhập thư viện CNC.'})
            end
          when 'export'
            format=payload['format'];raise 'Định dạng xuất không hợp lệ.' unless ['svg','dxf'].include?(format)
            content=payload.fetch('content').to_s
            raise 'Dữ liệu xuất không hợp lệ.' if content.bytesize>5_000_000
            path=UI.savepanel("Xuất CNC #{format.upcase} (mm)",'',"LOFIHOME_CNC.#{format}")
            if path
              File.binwrite(path,content)
              cnc_reply({'type'=>'status','message'=>"Đã xuất #{format.upcase} theo đơn vị mm."})
            end
          when 'export_skp'
            group=cnc_selected
            path=UI.savepanel('Lưu mẫu CNC thành SKP','','LOFIHOME_CNC.skp')
            if path
              ok=Compat.definition(group).save_as(path)
              raise 'Không lưu được SKP.' unless ok
              cnc_reply({'type'=>'status','message'=>'Đã lưu mẫu CNC thành SKP.'})
            end
          else
            raise 'Lệnh CNC không hợp lệ.'
          end
        rescue => e
          cnc_reply({'type'=>'error','message'=>e.message})
        end
      end
    end
  end
end
