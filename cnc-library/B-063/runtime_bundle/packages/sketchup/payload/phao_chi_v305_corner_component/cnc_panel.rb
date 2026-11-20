# encoding: UTF-8
# Independent parametric panel host. Template and boolean processing lives in LOFIHOME JS.
module LVN
  module PhaoChiV305CornerLite
    CNC_PANEL_SCHEMA = 'LOFIHOME_PANEL_295_1'.freeze unless const_defined?(:CNC_PANEL_SCHEMA)
    def self.cnc_panel_selected
      group=Sketchup.active_model.selection.to_a.find { |e| (e.is_a?(Sketchup::Group) || e.is_a?(Sketchup::ComponentInstance)) && e.get_attribute(CNC_PANEL_SCHEMA,'config') }
      raise 'Chọn vách tạo bằng mục Vách có thông số của thư viện 295 mẫu.' unless group
      group
    end
    def self.cnc_panel_supports_frame_sides?(config)
      return true if config['outline']=='rectangle'
      return false unless config['outline']=='custom'
      return false if config['custom_fill_inner']==true && Array(config['custom_holes']).any?
      points=config['custom_outer']
      return false unless points.is_a?(Array) && points.length>=4 && points.all? { |p|p.is_a?(Array) && p.length==2 && p.all? { |v|v.is_a?(Numeric) && v.finite? } }
      x0,x1=points.map(&:first).minmax;y0,y1=points.map(&:last).minmax
      w=x1-x0;h=y1-y0
      return false unless w>0 && h>0 && config['width'].to_f>0 && config['height'].to_f>0
      tx=0.00001*w/config['width'].to_f;ty=0.00001*h/config['height'].to_f
      area=points.each_with_index.inject(0.0) { |sum,(a,i)|b=points[(i+1)%points.length];sum+a[0]*b[1]-b[0]*a[1] }.abs/2
      (area/(w*h)-1).abs<1e-8 && points.each_with_index.all? do |a,i|
        b=points[(i+1)%points.length]
        [x0,x1].any? { |x|(a[0]-x).abs<=tx && (b[0]-x).abs<=tx } || [y0,y1].any? { |y|(a[1]-y).abs<=ty && (b[1]-y).abs<=ty }
      end
    end
    def self.cnc_panel_smoothing_config(value)
      valid=value.is_a?(Hash) && [true,false].include?(value['enabled']) &&
        value['angle'].is_a?(Numeric) && value['angle'].finite? && value['angle'].between?(0,90) &&
        value['segments'].is_a?(Integer) && value['segments'].between?(2,12)
      raise 'Làm mịn: góc ngưỡng 0–90 độ, độ mịn nguyên 2–12 đoạn.' unless valid
      if value.key?('mode')
        valid=['curves','round','both','arcs'].include?(value['mode']) &&
          value['radius'].is_a?(Numeric) && value['radius'].finite? && value['radius'].between?(0.05,100) &&
          value['tolerance'].is_a?(Numeric) && value['tolerance'].finite? && value['tolerance'].between?(0.005,0.5)
        raise 'Làm mượt / bo góc: chế độ, R 0,05–100 mm hoặc độ chính xác 0,005–0,5 mm không hợp lệ.' unless valid
      elsif value.key?('radius') || value.key?('tolerance')
        raise 'Thiếu chế độ làm mượt / bo góc.'
      end
      value
    end
    def self.cnc_item_gap!(item)
      if item.key?('even_insert')
        raise 'Lựa chọn làm đều họa tiết không hợp lệ.' unless item['even_insert']==true && item['mode']!='cut' && cnc_uniform_insert?(cnc_source_item(item['id']))
      end
      if item.key?('inner_scale')
        raise 'Thông số tỷ lệ phần tâm không hợp lệ.' unless item['inner_scale']==true && item.key?('inner_rim_mm')
      end
      %w[inner_rim_mm outer_rim_mm].each do |key|
        next unless item.key?(key)
        value=item[key]
        raise 'Viền trong/ngoài phải là số từ 0,1 đến 5000 mm cho một họa tiết chèn.' unless %w[inlay union raised background].include?(item['mode']) && cnc_source_item(item['id'])['group']=='inserts' && value.is_a?(Numeric) && value.finite? && value.between?(0.1,5000)
      end
      return unless item.key?('inner_gap')
      gap=item['inner_gap']
      raise 'Phạm vi chỉnh khe không hợp lệ.' if item.key?('inner_gap_scope') && !%w[rim all].include?(item['inner_gap_scope'])
      if item.key?('inner_gap_bridge')
        bridge=item['inner_gap_bridge']
        raise 'Bề rộng cầu nối phải từ 0,1 đến 100 mm.' unless item['inner_gap_scope']=='rim' && bridge.is_a?(Numeric) && bridge.finite? && bridge.between?(0.1,100)
      end
      raise 'Khe trong họa tiết chèn phải từ 6,1 đến 100 mm.' unless %w[inlay union raised background].include?(item['mode']) && cnc_source_item(item['id'])['group']=='inserts' && gap.is_a?(Numeric) && gap.finite? && gap.between?(6.1,100)
    end
    def self.cnc_panel_smoothing_active?(value)
      value && value['enabled']==true && (value['angle']>0 || ['round','both'].include?(value['mode']))
    end
    def self.cnc_panel_config(config,region=false)
      raise 'Tệp thông số vách không hợp lệ.' unless config.is_a?(Hash) && config['schema']==CNC_PANEL_SCHEMA
      cnc_source_item(config['id'])
      cnc_panel_smoothing_config(config['smoothing']) if config.key?('smoothing')
      Array(config['items']).each do |item|
        cnc_item_gap!(item) if item.is_a?(Hash)
        next unless item.is_a?(Hash) && item.key?('smoothing')
        cnc_panel_smoothing_config(item['smoothing'])
        raise 'Làm mịn họa tiết không khớp thông số vách.' unless item['smoothing']==config['smoothing']
      end
      detached=config['region_panel']==true
      if config.key?('region_panel')
        raise 'Thông số tấm tách vùng không hợp lệ.' unless detached && config['_region_local']==true && config['custom_regions'].is_a?(Array) && config['custom_regions'].length==1
      end
      [['width',(region || detached || config['mode']=='frameless') ? 1 : 50,10000],['height',(region || detached || config['mode']=='frameless') ? 1 : 50,10000],['thickness',1,200]].each { |key,min,max| cnc_number(config[key],min,max,key) }
      raise 'Lựa chọn hoa văn bám viền không hợp lệ.' if config.key?('follow_frame') && ![true,false].include?(config['follow_frame'])
      raise 'Lựa chọn khung hình đã đọc không hợp lệ.' if config.key?('custom_frame_sides') && ![true,false].include?(config['custom_frame_sides'])
      if config.key?('frame_equal') || %w[left right top bottom].any? { |side|config.key?('frame_'+side) }
        raise 'Lựa chọn khung đều 4 cạnh không hợp lệ.' if config.key?('frame_equal') && ![true,false].include?(config['frame_equal'])
        sides=%w[left right top bottom].map do |side|
          key='frame_'+side
          if config.key?(key) || config['frame_equal']==false
            raise 'Nhập bề rộng khung hợp lệ.' if config[key].nil? || config[key]=='' || [true,false].include?(config[key])
            cnc_number(config[key],0,1000,'Rộng khung '+side)
          end
          config[key].to_f
        end
        own_border=config['mode']=='frameless' && (!config['border'].is_a?(Hash) || config['border']['enabled']!=true || (config['border']['layout'].is_a?(Hash) && config['border']['layout']['enabled']==true))
        if !own_border && config['frame_equal']==false && (config['outline']=='rectangle' || config['custom_frame_sides']==true) && cnc_panel_supports_frame_sides?(config)
          raise 'Khung chiếm hết kích thước tấm.' if sides[0]+sides[1]>=config['width'].to_f || sides[2]+sides[3]>=config['height'].to_f
          raise 'Khung rỗng cần bề rộng khung lớn hơn 0.' if config['mode']=='hollow' && sides.max==0
        end
      end
      cnc_number(config['custom_frame_adjust'],-1000,1000,'Bù dày/mỏng khung') if config.key?('custom_frame_adjust')
      if config.key?('border')
        border=config['border']
        ids=%w[duc_009 duc_010 duc_012 duc_011 duc_030 duc_029 duc_031].map { |id|'cutout_patterns__'+id }
        ids.concat(%w[borders__anh_trien_vuong borders__anh_dong_tien_trien_vuong borders__anh_may_cuon borders__anh_dong_tien_may_cuon borders__anh_thanh_gia_day_la borders__anh_la_cuon])
        raise 'Mẫu chạy viền không hợp lệ.' unless border.is_a?(Hash) && ids.include?(border['id']) && [true,false].include?(border['enabled'])
        cnc_source_item(border['id'])
        raise 'Lựa chọn nối bằng nan không hợp lệ.' if border.key?('join_equal') && ![true,false].include?(border['join_equal'])
        %w[top bottom left right].each do |side|
          key='omit_'+side
          raise 'Lựa chọn bỏ riềm không hợp lệ.' if border.key?(key) && ![true,false].include?(border[key])
        end
        [['width',8,1000],['module',10,2000],['gap',0.5,100]].each { |key,min,max|cnc_number(border[key],min,max,'Thông số chạy viền') }
        if border.key?('center_mode')
          raise 'Chế độ phần giữa không hợp lệ.' unless %w[inherit pattern hollow solid].include?(border['center_mode'])
        end
        if border.key?('edge_frame')
          f=border['edge_frame']
          valid=f.is_a?(Hash) && (!f.key?('enabled') || [true,false].include?(f['enabled']))
          valid &&= %w[outer inner].all? { |key|!f.key?(key) || (f[key].is_a?(Numeric) && f[key].finite? && f[key]>=0) }
          raise 'Viền bao diềm cần bề rộng không âm theo mm.' unless valid
        end
        if border.key?('layout')
          l=border['layout']
          valid=l.is_a?(Hash) && (!l.key?('enabled') || [true,false].include?(l['enabled']))
          valid &&= %w[width height].all? { |key|l[key].is_a?(Numeric) && l[key].finite? && l[key]>0 }
          raise 'Ngang và cao vòng diềm cần là số dương theo mm.' unless valid
        end
        if border.key?('stroke_adjust')
          value=border['stroke_adjust']
          raise 'Bù nét diềm phải là số hữu hạn theo mm.' unless value.is_a?(Numeric) && value.finite?
        end
        if border.key?('inner_frame')
          f=border['inner_frame']
          raise 'Thông số viền trong không hợp lệ.' unless f.is_a?(Hash) && [true,false].include?(f['equal'])
          %w[width left right top bottom].each do |key|
            raise 'Nhập rộng viền trong hợp lệ.' if f[key].nil? || f[key]=='' || [true,false].include?(f[key])
            cnc_number(f[key],0,1000,'Rộng viền trong')
          end
        end
        raise 'Khe viền quá lớn.' if border['gap'].to_f>border['width'].to_f-5 || border['gap'].to_f>border['module'].to_f-5
      end
      if config.key?('custom_regions')
        regions=config['custom_regions'];basis=config['region_basis']
        raise 'Bản chia vùng không hợp lệ.' unless config['outline']=='custom' && regions.is_a?(Array) && regions.length.between?(1,64)
        raise 'Kích thước gốc của vùng không hợp lệ.' unless basis.is_a?(Array) && basis.length==2 && basis.all? { |v|v.is_a?(Numeric) && v.finite? && v.between?(detached ? 1 : 50,10000) }
        ids={};points=0
        regions.each do |region|
          raise 'Mã vùng không hợp lệ.' unless region.is_a?(Hash) && region['id'].is_a?(String) && !region['id'].empty? && !ids[region['id']]
          ids[region['id']]=true
          raise 'Thông số vùng lồng nhau không hợp lệ.' unless region['config'].is_a?(Hash) && !region['config'].key?('custom_regions')
          raise 'Lỗ trong vùng không hợp lệ.' unless region['holes'].is_a?(Array) && region['holes'].length<=100
          ([region['outer']]+region['holes']).each do |loop|
            raise 'Biên vùng không hợp lệ.' unless loop.is_a?(Array) && loop.length.between?(3,500)
            points+=loop.length
            loop.each { |p|raise 'Điểm vùng không hợp lệ.' unless p.is_a?(Array) && p.length==2 && p.each_with_index.all? { |v,i|v.is_a?(Numeric) && v.finite? && v>=-0.001 && v<=basis[i]+0.001 } }
          end
          cnc_panel_config(region['config'],true)
        end
        raise 'Các vùng quá nhiều điểm.' if points>12000
      end
      raise 'Thông số vách quá lớn.' if JSON.generate(config).bytesize>(config.key?('custom_regions') ? 2_000_000 : 200_000)
      config
    end
    def self.cnc_panel_creation_rows(data,config,item_only)
      return [[data,0,0]] unless data.key?('region_panels')
      panels=data['region_panels'];regions=config['custom_regions']
      raise 'Danh sách tấm tách vùng không hợp lệ.' unless !item_only && regions.is_a?(Array) && !config['region_panel'] && panels.is_a?(Array) && panels.length==regions.length
      panels.each_with_index.map do |panel,index|
        r=regions[index];local=r['config']
        expected=Marshal.load(Marshal.dump(local))
        expected['region_panel']=true;expected['region_basis']=[local['width'],local['height']]
        expected['custom_regions']=[{'id'=>r['id'],'outer'=>local['custom_outer'],'holes'=>local['custom_holes'],'config'=>local}]
        raise 'Tấm tách không khớp vùng đã chọn.' unless panel.is_a?(Hash) && panel['region_id']==r['id'] && panel['config']==expected
        cnc_panel_config(panel['config'])
        x=r['outer'].map(&:first).min*config['width'].to_f/config['region_basis'][0]
        y=r['outer'].map(&:last).min*config['height'].to_f/config['region_basis'][1]
        [panel,x,y]
      end
    end
    def self.cnc_panel_create(data,update=false,target=nil,item_only=false)
      config=cnc_panel_config(data.fetch('config'))
      mesh_point_limit=cnc_panel_mesh_point_limit(config)
      rows=cnc_panel_creation_rows(data,config,item_only)
      total=0;count=0
      rows.each do |row,x,y|
        solids=row.fetch('solids')
        raise 'Số khối CNC không hợp lệ.' unless solids.is_a?(Array) && solids.length.between?(1,1024)
        count+=solids.length
        solids.each do |solid|
          cnc_validate_mesh(solid.fetch('mesh'),mesh_point_limit);total+=solid['mesh']['points'].length
          cnc_number(solid['depth'],0.1,200,'Độ dày chi tiết');cnc_number(solid['z'],0,200,'Cao độ chi tiết')
        end
      end
      raise 'Vách quá nhiều điểm hoặc chi tiết.' if total>mesh_point_limit || count>1024
      model=Sketchup.active_model;old=update ? (target || cnc_panel_selected) : nil
      raise 'Vách đang khóa; mở khóa trước khi cập nhật.' if old && old.locked?
      if old && data.key?('region_panels')
        saved=JSON.parse(old.get_attribute(CNC_PANEL_SCHEMA,'config') || '{}')
        raise 'Đây là một tấm đã tách. Bấm Lấy vách chọn để chỉnh riêng tấm này, rồi Cập nhật vách chọn.' if saved['region_panel']==true
      end
      transform=old ? old.transformation : ((item_only ? nil : cnc_custom_placement(config,model)) || (config['plane']=='xy' ? Geom::Transformation.new : Geom::Transformation.axes(ORIGIN,X_AXIS,Z_AXIS,Geom::Vector3d.new(0,-1,0))))
      original_selection=model.selection.to_a
      model.start_operation(item_only ? 'Tạo họa tiết riêng CNC' : update ? 'Cập nhật vách CNC 295' : 'Tạo vách CNC 295',true);started=true
      groups=rows.map do |row,x,y|
      panel_config=row['config']
      group=model.active_entities.add_group;group.name=panel_config['name'].to_s[0,100]
      row['solids'].each_with_index do |solid,index|
        piece=group.entities.add_group;piece.name="#{item_only ? 'Họa tiết' : solid['z'].to_f>0 ? 'Họa tiết nổi' : 'Vách CNC'} #{index+1}"
        # Boolean clipping may leave short edges. Build large enough for SketchUp's
        # vertex tolerance, then restore the exact millimetre dimensions by transform.
        cnc_mesh_solid(piece.entities,solid['mesh'],solid['depth'],solid['z'],1000.0,mesh_point_limit)
        cnc_smooth_walls(piece.entities,panel_config['smoothing'])
        CNCInsertEdges.apply_mesh(piece.entities,solid['mesh'],item_only && Array(panel_config['items']).first.to_h['mode'] != 'cut')
        piece.transformation=Geom::Transformation.scaling(0.001)
        raise "Chi tiết #{index+1} chưa thành khối kín. Tăng cỡ mô-đun hoặc chỉnh bù nan." unless Compat.manifold?(piece)
      end
      color=panel_config['material'].to_s
      group.material=Sketchup::Color.new(color) if color.match(/\A#[0-9a-f]{6}\z/i)
      schema=item_only ? 'LOFIHOME_CNC_ITEM_1' : CNC_PANEL_SCHEMA
      group.set_attribute(schema,'config',JSON.generate(panel_config))
      group.set_attribute(schema,'creation_request_id',data['request_id']) if data['request_id']
      group.set_attribute(schema,'origin','Mẫu Nguyễn Khánh CNC 1.9.8; bộ dựng vách LOFIHOME độc lập')
      group.transformation=(x==0 && y==0) ? transform : transform*Geom::Transformation.translation([x/25.4,y/25.4,0])
      group.layer=old.layer if old
      group
      end
      old.erase! if old
      model.selection.clear;groups.each { |g|model.selection.add(g) };model.commit_operation;started=false
      model.active_view.invalidate
      cnc_reply({'type'=>'status','message'=>item_only ? 'Đã tạo họa tiết riêng với viền đã chỉnh.' : rows.length>1 ? "Đã #{update ? 'cập nhật' : 'tạo'} #{rows.length} tấm độc lập, giữ đúng vị trí từng vùng." : "Đã #{update ? 'cập nhật' : 'tạo'} vách #{config['width']} × #{config['height']} × #{config['thickness']} mm."})
      groups.length==1 ? groups.first : groups
    rescue => error
      if started
        model.abort_operation
        model.selection.clear
        original_selection.each { |e|model.selection.add(e) if !e.respond_to?(:valid?) || e.valid? }
      end
      raise error
    end
    # Export a single editor selection in local XY. An SKP definition is built
    # temporarily, so the active panel, model entities and Undo stack stay intact.
    def self.cnc_export_selected_item(action,data)
      skp=action=='panel_item_skp'
      ext=skp ? 'skp' : 'dxf'
      title=data.fetch('name').to_s.gsub(/[[:cntrl:]\\\/:*?"<>|]/,'_')[0,64]
      if skp
        solids=data.fetch('solids');count=0
        raise 'Họa tiết rỗng hoặc quá nhiều khối.' unless solids.is_a?(Array) && solids.length.between?(1,1024)
        solids.each do |solid|
          cnc_validate_mesh(solid.fetch('mesh'));count+=solid['mesh']['points'].length
          cnc_number(solid['depth'],1,200,'Dày họa tiết')
          raise 'Khối xuất không nằm trên mặt phẳng họa tiết.' unless solid['z']==0
        end
        raise 'Họa tiết quá nhiều điểm để xuất.' if count>250000
        cnc_panel_smoothing_config(data['smoothing']) if data['smoothing']
      else
        content=data.fetch('content')
        raise 'DXF họa tiết không hợp lệ.' unless content.is_a?(String) && content.bytesize.between?(40,5_000_000) && content.include?("LWPOLYLINE")
      end
      model=Sketchup.active_model
      path=UI.savepanel("Xuất riêng họa tiết #{ext.upcase}",'', "Hoa_tiet_#{title}.#{ext}")
      return unless path
      unless File.extname(path).downcase=='.'+ext
        path += '.'+ext
        return if File.exist?(path) && UI.messagebox("Tệp đã tồn tại. Thay thế #{path}?",MB_YESNO)!=IDYES
      end
      if skp && model.respond_to?(:path) && !model.path.to_s.empty? && File.expand_path(path).casecmp(File.expand_path(model.path))==0
        raise 'Chọn tên tệp khác bản vẽ đang mở.'
      end
      temp=File.join(File.dirname(path),'.lofi-item-'+Compat.unique_key+'.'+ext)
      if skp
        raise 'Bản vẽ đã thay đổi; chọn lại họa tiết.' unless Sketchup.active_model.equal?(model)
        raise 'Không mở được thao tác xuất riêng.' if model.start_operation('LOFIHOME · Xuất riêng họa tiết',true)==false
        begin
          defn=model.definitions.add('LOFIHOME · '+title)
          solids.each do |solid|
            part=defn.entities.add_group
            cnc_mesh_solid(part.entities,solid['mesh'],solid['depth'],0,1000.0)
            cnc_smooth_walls(part.entities,data['smoothing'])
            CNCInsertEdges.apply(part.entities)
            part.transformation=Geom::Transformation.scaling(0.001)
            part.material=Sketchup::Color.new(data['material']) if data['material'].to_s.match?(/\A#[0-9a-f]{6}\z/i)
            raise 'Họa tiết chưa thành khối kín; chưa lưu tệp.' unless Compat.manifold?(part)
          end
          raise 'Không lưu được họa tiết thành SKP.' unless defn.save_as(temp)
        ensure
          model.abort_operation
        end
      else
        File.binwrite(temp,content)
      end
      raise 'Không tạo được tệp họa tiết.' unless File.file?(temp) && File.size(temp)>0
      File.rename(temp,path);temp=nil
      cnc_reply({'type'=>'status','message'=>"Đã xuất riêng họa tiết #{title} thành #{ext.upcase}, không kèm khung."})
    ensure
      File.delete(temp) if temp && File.file?(temp)
    end
    def self.cnc_panel_action(action,data)
      case action
      when 'panel_place_insert'
        cnc_panel_place_insert(data)
      when 'panel_place_commit'
        cnc_panel_place_commit(data)
      when 'panel_place_failed'
        cnc_panel_place_failed(data)
      when 'panel_item_dxf','panel_item_skp'
        cnc_export_selected_item(action,data)
      when 'panel_item_create'
        cnc_panel_create(data,false,nil,true)
      when 'panel_create','panel_update'
        cnc_panel_submit(action,data)
      when 'panel_load_selected'
        cnc_reply({'type'=>'panel_config','config'=>JSON.parse(cnc_panel_selected.get_attribute(CNC_PANEL_SCHEMA,'config'))})
      when 'panel_capture_regions'
        cnc_reply(CNCRegionCapture.read(Sketchup.active_model))
      when 'panel_capture_face'
        cnc_capture_face('panel_outline')
      when 'panel_export_config'
        config=cnc_panel_config(data)
        path=UI.savepanel('Lưu thông số vách CNC','','Vach_CNC_295.json')
        if path
          File.write(path,JSON.pretty_generate(config),:encoding=>'UTF-8')
          cnc_reply({'type'=>'status','message'=>'Đã lưu thông số vách JSON.'})
        end
      when 'panel_import_config'
        path=UI.openpanel('Mở thông số vách CNC','','JSON|*.json||')
        if path
          raise 'Tệp thông số quá lớn.' if File.size(path)>2_000_000
          config=cnc_panel_config(JSON.parse(File.read(path,:encoding=>'UTF-8')))
          cnc_reply({'type'=>'panel_config','config'=>config})
        end
      when 'panel_export_skp'
        group=cnc_panel_selected
        path=UI.savepanel('Lưu vách đang chọn thành SKP','','Vach_CNC_295.skp')
        if path
          raise 'Không lưu được vách SKP.' unless Compat.definition(group).save_as(path)
          cnc_reply({'type'=>'status','message'=>'Đã lưu vách SKP đang chọn.'})
        end
      else
        raise 'Lệnh vách CNC không hợp lệ.'
      end
    end
  end
end
require File.join(File.dirname(__FILE__),'cnc_insert_tool')
require File.join(File.dirname(__FILE__),'cnc_panel_submission')
