# encoding: UTF-8
require 'json'
require 'fileutils'
module LVN
  module PhaoChiV305CornerLite
    CNC_SOURCE_SCHEMA = 'LOFIHOME_CNC_SOURCE_198'.freeze unless const_defined?(:CNC_SOURCE_SCHEMA)
    def self.cnc_source_root
      File.join(File.dirname(__FILE__), 'cnc_source_198')
    end
    def self.cnc_source_item(id)
      @cnc_source_catalog ||= JSON.parse(File.read(File.join(cnc_source_root,'catalog.json'),:encoding=>'UTF-8'))
      item=@cnc_source_catalog.find { |entry| entry['id']==id.to_s }
      raise 'Không tìm thấy mẫu trong bộ gốc 1.9.8.' unless item
      item
    end
    def self.cnc_uniform_insert?(item)
      return false unless item['group']=='inserts'
      @cnc_uniform_ids ||= begin
        index=File.read(File.join(__dir__,'html/cnc/uniform_index.js'),encoding:'UTF-8')
        JSON.parse(index[/\Awindow\.LofiUniformInsertIndex=(\{.*\});\s*\z/m,1] || '')
      end
      @cnc_uniform_ids.key?(item['id'])
    end
    def self.cnc_uniform_asset(item,extension)
      filename=File.join(__dir__,'html/cnc/uniform',item.fetch('id')+'.'+extension)
      raise 'Thiếu dữ liệu họa tiết đã làm đều. Kiểm tra bộ cài.' unless File.file?(filename)
      filename
    end
    def self.cnc_uniform_shape(item)
      text=File.read(cnc_uniform_asset(item,'js'),encoding:'UTF-8').strip
      prefix="window.LofiCNCShapes[#{JSON.generate(item.fetch('id'))}].even="
      raise 'Sai dữ liệu họa tiết đã làm đều.' unless text.start_with?(prefix) && text.end_with?(';')
      JSON.parse(text[prefix.length...-1])
    end
    def self.cnc_source_parameters(data)
      item=cnc_source_item(data['id'])
      params={'id'=>item['id']}
      [['width',1,10000],['height',1,10000],['thickness',0.1,200],['angle',-360,360],['columns',1,30],['rows',1,30],['gap_x',0,5000],['gap_y',0,5000]].each do |key,min,max|
        params[key]=cnc_number(data[key],min,max,key)
      end
      ['columns','rows'].each { |key| raise 'Số hàng/cột phải là số nguyên.' unless params[key]==params[key].to_i;params[key]=params[key].to_i }
      copies=params['columns']*params['rows']
      raise 'Tối đa 100 mô-đun mỗi lần.' if copies>100
      raise 'Mẫu quá nhiều chi tiết; giảm số hàng/cột.' if item['vertices']*copies>1_000_000
      raise 'Mẫu này có nhiều khối nhỏ; giảm số hàng/cột.' if item.fetch('assembly_parts',0)*copies>20_000
      params['mirror']=data['mirror']==true
      if item['group']=='inserts'
        choice=data.fetch('even_insert',cnc_uniform_insert?(item))
        raise 'Lựa chọn làm đều họa tiết không hợp lệ.' unless [true,false].include?(choice)
        raise 'Mẫu này chưa có đường bao đã làm đều.' if choice && !cnc_uniform_insert?(item)
        params['even_insert']=choice
      end
      params['plane']=data['plane']=='xy' ? 'xy' : 'xz'
      [item,params]
    end
    def self.cnc_source_selected
      item=Sketchup.active_model.selection.to_a.find { |entity| (entity.is_a?(Sketchup::Group) || entity.is_a?(Sketchup::ComponentInstance)) && entity.get_attribute(CNC_SOURCE_SCHEMA,'config') }
      raise 'Chọn nhóm mẫu được chèn từ thư viện CNC gốc của LOFIHOME.' unless item
      item
    end
    def self.cnc_source_insert(data,update=false)
      item,params=cnc_source_parameters(data)
      raise 'Mẫu này chưa có khối 3D hợp lệ.' unless item['model_status']=='closed'
      model=Sketchup.active_model;old=update ? cnc_source_selected : nil
      raise 'Nhóm đang khóa; mở khóa trước khi cập nhật.' if old && old.locked?
      transform=old ? old.transformation : (params['plane']=='xy' ? Geom::Transformation.new : Geom::Transformation.axes(ORIGIN,X_AXIS,Z_AXIS,Geom::Vector3d.new(0,-1,0)))
      model.start_operation(update ? 'Cập nhật mẫu CNC gốc' : 'Chèn mẫu CNC gốc',true);started=true
      if cnc_source_contour_item?(item)
        definition=cnc_source_contour_definition(model,item)
      else
        file=params['even_insert'] ? cnc_uniform_asset(item,'skp') : File.join(cnc_source_root,item.fetch('model'))
        definition=Compat.load_definition(model.definitions,Compat.model_file(file))
      end
      raise 'Không đọc được mẫu 3D.' unless definition
      group=model.active_entities.add_group;group.name="CNC · #{item['name']}"
      sx=params['width']/item['width'];sy=params['height']/item['height'];sz=params['thickness']/item['thickness']
      sx=-sx if params['mirror']
      shape=Geom::Transformation.rotation(ORIGIN,Z_AXIS,params['angle'].degrees)*Geom::Transformation.scaling(sx,sy,sz)*Geom::Transformation.translation([-item['width'].mm/2,-item['height'].mm/2,0])
      prepare_insert = item['group'] == 'inserts'
      params['rows'].times do |row|
        params['columns'].times do |column|
          center=[((column+0.5)*params['width']+column*params['gap_x']).mm,((row+0.5)*params['height']+row*params['gap_y']).mm,0]
          placement = Geom::Transformation.translation(center)*shape
          if prepare_insert
            definition = CNCInsertEdges.add_first(group.entities, definition, placement).definition
            prepare_insert = false
          else
            group.entities.add_instance(definition, placement)
          end
        end
      end
      group.set_attribute(CNC_SOURCE_SCHEMA,'config',JSON.generate(params))
      group.set_attribute(CNC_SOURCE_SCHEMA,'origin',item['origin'] || 'Nguyễn Khánh CNC 1.9.8 — dữ liệu từ RBZ người dùng cung cấp')
      group.transformation=transform
      if old
        group.layer=old.layer;group.material=old.material
        old.erase!
      end
      model.selection.clear;model.selection.add(group);model.commit_operation;started=false
      cnc_reply({'type'=>'status','message'=>"Đã #{update ? 'cập nhật' : 'chèn'} #{params['columns']*params['rows']} mô-đun #{item['name']}."})
      group
    rescue => e
      model.abort_operation if started
      raise e
    end
    def self.cnc_source_contours(item,params)
      prepared=params['even_insert'] ? cnc_uniform_shape(item) : JSON.parse(File.read(File.join(cnc_source_root,'prepared',item['id']+'.json'),:encoding=>'UTF-8'))
      angle=params['angle']*Math::PI/180;c=Math.cos(angle);s=Math.sin(angle)
      loops=[]
      params['rows'].times do |row|
        params['columns'].times do |column|
          cx=(column+0.5)*params['width']+column*params['gap_x'];cy=(row+0.5)*params['height']+row*params['gap_y']
          prepared['parts'].each do |part|
            ([part['outer']]+part['holes']).each_with_index do |loop,index|
              points=loop.map do |x,y|
                x=(x/item['width']-0.5)*params['width'];y=(y/item['height']-0.5)*params['height'];x=-x if params['mirror']
                [cx+x*c-y*s,cy+x*s+y*c]
              end
              loops<<{'layer'=>item['group']=='cutout_patterns' ? 'CUT_TEMPLATE' : (index==0 ? 'OUTLINE' : 'HOLE'),'points'=>points}
            end
          end
        end
      end
      loops
    end
    def self.cnc_source_vector(item,params,format)
      loops=cnc_source_contours(item,params)
      return cnc_source_contour_dxf(loops) if format=='dxf' && cnc_source_contour_item?(item)
      if format=='dxf'
        text=['0','SECTION','2','HEADER','9','$INSUNITS','70','4','0','ENDSEC','0','SECTION','2','ENTITIES']
        loops.each do |loop|
          text+=['0','LWPOLYLINE','100','AcDbEntity','8',loop['layer'],'100','AcDbPolyline','90',loop['points'].length.to_s,'70','1']
          loop['points'].each { |x,y| text+=['10',format('%.6f',x),'20',format('%.6f',y)] }
        end
        (text+['0','ENDSEC','0','EOF']).join("\r\n")+"\r\n"
      else
        points=loops.flat_map { |loop| loop['points'] };xs=points.map(&:first);ys=points.map(&:last)
        x0=xs.min;y0=ys.min;w=xs.max-x0;h=ys.max-y0
        paths=loops.map do |loop|
          path='M'+loop['points'].map { |x,y| "#{format('%.6f',x)},#{format('%.6f',y)}" }.join('L')+'Z'
          "<path d=\"#{path}\" data-layer=\"#{loop['layer']}\"/>"
        end.join
        "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"#{w}mm\" height=\"#{h}mm\" viewBox=\"#{x0} #{y0} #{w} #{h}\"><g transform=\"translate(0 #{2*y0+h}) scale(1 -1)\" fill=\"none\" stroke=\"black\" stroke-width=\"0.1\">#{paths}</g></svg>"
      end
    end
    def self.cnc_source_action(action,data)
      case action
      when 'source_layout_load'
        cnc_reply({'type'=>'source_layout','layout'=>cnc_library_layout})
      when 'source_layout_save'
        cnc_library_layout_save(data)
      when 'source_insert','source_update'
        cnc_source_insert(data,action=='source_update')
      when 'source_load_selected'
        cnc_reply({'type'=>'source_config','config'=>JSON.parse(cnc_source_selected.get_attribute(CNC_SOURCE_SCHEMA,'config'))})
      when 'source_native_insert'
        item=cnc_source_item(data['id']);raise 'Mẫu này không có SKP gốc đi kèm.' unless item['native_skp']
        definition=Compat.load_definition(Sketchup.active_model.definitions,Compat.model_file(File.join(cnc_source_root,item['native_skp_compatible'] || item['native_skp'])))
        Sketchup.active_model.place_component(definition)
        cnc_reply({'type'=>'status','message'=>'Bấm trong SketchUp để đặt file SKP gốc.'})
      when 'source_export'
        item=cnc_source_item(data['id']);kind=data['format']
        raise 'Định dạng xuất không hợp lệ.' unless ['json','skp','native_skp','svg','dxf'].include?(kind)
        suffix=kind=='native_skp' ? 'skp' : kind
        source=kind=='json' ? item['source'] : (kind=='native_skp' ? item['native_skp'] : item['model'])
        contour_skp=kind=='skp' && cnc_source_contour_item?(item)
        raise 'Không có file gốc tương ứng.' if ['json','skp','native_skp'].include?(kind) && !source && !contour_skp
        filename=cnc_source_contour_item?(item) ? item['name'] : item['id']
        path=UI.savepanel("Xuất mẫu CNC #{suffix.upcase}",'',"#{filename}.#{suffix}")
        if path
          if ['svg','dxf'].include?(kind)
            _,params=cnc_source_parameters(data)
            File.binwrite(path,cnc_source_vector(item,params,kind))
          elsif contour_skp
            cnc_source_parameters(data)
            cnc_source_export_contour_skp(item,path)
          else
            file=File.join(cnc_source_root,source)
            if kind=='skp'
              _,params=cnc_source_parameters(data)
              file=cnc_uniform_asset(item,'skp') if params['even_insert']
              file=Compat.model_file(file)
            end
            FileUtils.cp(file,path)
          end
          cnc_reply({'type'=>'status','message'=>['svg','dxf'].include?(kind) ? "Đã xuất #{suffix.upcase} theo kích thước và bố trí đang chọn (mm)." : "Đã xuất file #{suffix.upcase} theo kích thước gốc."})
        end
      else
        raise 'Lệnh thư viện gốc không hợp lệ.'
      end
    end
  end
end

require File.join(File.dirname(__FILE__),'cnc_source_contours_model')
