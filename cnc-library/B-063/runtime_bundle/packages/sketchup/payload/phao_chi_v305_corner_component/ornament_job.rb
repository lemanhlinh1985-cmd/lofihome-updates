# encoding: UTF-8
require 'json'
require 'tmpdir'
module LVN
  module PhaoChiV305CornerLite
    # Prepare the same ornament cuts without writing to the model. Timer slices
    # end before a transaction starts; attachment is one atomic undo operation.
    module OrnamentJob
      extend self
      API=PhaoChiV305CornerLite
      class Cancelled < StandardError;end
      if defined?(Sketchup::ModelObserver)
        class ChangeObserver < Sketchup::ModelObserver
          def initialize(job);@job=job;end
          def changed
            return if @job[:snapshot_operation] || @job[:committing]
            @job[:cancel]='Bản vẽ vừa được chỉnh sửa hoặc hoàn tác. Chọn lại phào rồi thử lại.'
          end
          def onTransactionStart(_model);changed;end
          def onTransactionCommit(_model);changed;end
          def onTransactionUndo(_model);changed;end
          def onTransactionRedo(_model);changed;end
        end
      end
      def pending?(dialog,token)
        @job && @job[:dialog].equal?(dialog) && @job[:token]==token
      end
      def attach(dialog)
        cancel_current('Bảng phào đã được thay thế.') if @dialog && !@dialog.equal?(dialog)
        @dialog=dialog
      end
      def cancel_current(message='Đã hủy. Phào và hoa văn đang có được giữ nguyên.')
        @job[:cancel]=message if @job
      end
      def cancel(dialog,payload)
        data=JSON.parse(payload.to_s)
        cancel_current if @job && @job[:dialog].equal?(dialog) && @job[:token]==data['request_id']
      rescue
        nil
      end
      def send_progress(job,text,done=nil,total=nil,cancellable=true)
        now=Process.clock_gettime(Process::CLOCK_MONOTONIC)
        return if done && job[:progress_time] && now-job[:progress_time]<0.08
        job[:progress_time]=now
        data={request_id:job[:token],message:text,done:done,total:total,cancellable:cancellable,editing:!!job[:editing]}
        job[:dialog].execute_script("savedLibraryOrnamentProgress(#{Compat.json_literal(data)})")
      rescue
        job[:cancel]='Bảng phào không còn nhận được tiến độ.'
      end
      def context!(job,completed=false)
        raise Cancelled,'Yêu cầu thêm hoa văn đã kết thúc.' unless @job.equal?(job)
        raise Cancelled,job[:cancel] if job[:cancel]
        dialog=job[:dialog];record=job[:record];model=record[:model];group=record[:group]
        expected=job[:fields].dup
        expected[LibraryFrameEdit::FIELDS.index('build_stage')]='complete' if completed
        valid=@dialog.equal?(dialog) && (!dialog.respond_to?(:visible?) || dialog.visible?) &&
          Sketchup.active_model.equal?(model) && model.active_entities.equal?(record[:entities]) &&
          (model.active_path || [])==record[:path] && model.edit_transform.to_a==record[:edit] &&
          group.valid? && model.selection.to_a==[group] && !group.locked? &&
          group.transformation.to_a==job[:transform] &&
          LibraryFrameEdit::FIELDS.map { |f|group.get_attribute('LOFIHOME',f) }==expected
        raise Cancelled,'Phào, lựa chọn hoặc cấp chỉnh sửa đã thay đổi. Chọn lại phào rồi thử lại.' unless valid
        raise Cancelled,'Mẫu gốc đã thay đổi. Chọn lại phào rồi thử lại.' unless stamp(job[:path])==job[:stamp]
      end
      def stamp(path)
        actual=API.v31720_light_source(path)
        [path,File.size(path),File.mtime(path).to_f,actual,File.size(actual),File.mtime(actual).to_f]
      end
      def start_edit(dialog,token,record,options,rows)
        start(dialog,token,{record:record,options:options,rows:rows})
      end
      def start(dialog,token,edit=nil)
        raise 'Đang chuẩn bị hoa văn. Hãy chờ hoặc bấm Hủy.' if @job
        raise 'Bảng phào đã đóng hoặc được thay thế.' unless @dialog.equal?(dialog) && (!dialog.respond_to?(:visible?) || dialog.visible?)
        model=Sketchup.active_model;group=LibraryFrameEdit.selected(model)
        expected_stage=edit ? 'complete' : 'body'
        raise 'Phào không còn ở trạng thái yêu cầu. Chọn lại phào rồi thử lại.' unless group.get_attribute('LOFIHOME','build_stage')==expected_stage
        path=group.get_attribute('LOFIHOME','source_skp')
        raw=JSON.parse(group.get_attribute('LOFIHOME','path_data'))
        unless raw.is_a?(Array) && !raw.empty? && raw.length<=10000 && raw.all? { |r|r.is_a?(Array) && r.length==2 && r.all? { |p|p.is_a?(Array) && p.length==3 && p.all? { |n|n.is_a?(Numeric) && n.finite? } } }
          raise 'Đường chạy phào đã lưu không hợp lệ.'
        end
        options={'_placement_limit'=>50000,'roll'=>group.get_attribute('LOFIHOME','roll',90),'source_axis'=>group.get_attribute('LOFIHOME','source_axis','auto'),
          'profile_anchor'=>group.get_attribute('LOFIHOME','profile_anchor','legacy')}.merge(LibraryFrameSettings.flip_values(group))
        if edit
          raise 'Thông số phào đã cũ.' unless LibraryFrameEdit.check(edit[:record]).equal?(group)
          options.merge!(edit[:options])
          calibrated=!!(File.basename(path,File.extname(path)) =~ /\ASU84[\s_-]*\(?\s*104\s*\)?\z/i)
          # Layout takes the effective angle; the body builder takes base + tilt.
          # Never apply roll_adjust twice to the ornaments.
          options['roll']=API.v317146_library_roll(edit[:options],calibrated)
          options['roll_adjust']=0
        end
        LibraryFrameSettings.anchor(options);LibraryFrameSettings.flips(options)
        API.v317146_library_roll(options)
        job={dialog:dialog,token:token,record:edit ? edit[:record] : LibraryFrameEdit.capture(model,group),path:path,stamp:stamp(path),
          transform:group.transformation.to_a,fields:LibraryFrameEdit::FIELDS.map { |f|group.get_attribute('LOFIHOME',f) },
          rows:raw.map { |r|r.map { |p|Geom::Point3d.new(p) } },options:options,slices:0,
          editing:!!edit,body_options:edit && edit[:options],
          render_mask:group.get_attribute('LOFIHOME','render_mask',false)}
        @job=job
        trace(job,'prepare')
        if defined?(ChangeObserver) && model.respond_to?(:add_observer)
          job[:observer]=ChangeObserver.new(job);model.add_observer(job[:observer])
        end
        job[:phase]=:snapshot
        send_progress(job,edit ? 'Đang chuẩn bị chỉnh thân phào và hoa văn cùng nhau…' : 'Đang đọc mẫu hoa văn của phào đang chọn…')
        schedule(job)
        true
      rescue
        begin;model.remove_observer(job[:observer]) if job && job[:observer] && model;rescue;end
        @job=nil if @job.equal?(job)
        raise
      end
      def schedule(job)
        UI.start_timer(0.01,false) { tick(job) }
      end
      def tick(job)
        return unless @job.equal?(job)
        return if job[:running] || job[:commit_queued]
        job[:running]=true
        owns_tick=true
        context!(job)
        job[:deadline]=Process.clock_gettime(Process::CLOCK_MONOTONIC)+0.025
        state=nil
        loop do
          state=advance(job)
          break if state==:ready || Process.clock_gettime(Process::CLOCK_MONOTONIC)>=job[:deadline]
        end
        job[:slices]+=1
        if state==:ready
          job[:commit_queued]=true
          send_progress(job,job[:editing] ? 'Đã tính xong. Đang cập nhật cả phào và hoa văn…' : 'Đã tính xong. Đang gắn hoa văn vào thân phào…',nil,nil,false)
          # One extra turn lets Chromium paint before the atomic native commit.
          UI.start_timer(0.01,false) do
            next if !@job.equal?(job) || job[:commit_started]
            job[:commit_started]=true
            begin
              context!(job);LibraryFrameEdit.check(job[:record])
              commit(job)
              finish(job,job[:editing] ? 'Đã chỉnh thân phào và hoa văn cùng nhau. Ctrl+Z để hoàn tác.' : 'Đã thêm hoa văn; giữ nguyên thân phào và hướng đã chỉnh. Ctrl+Z để hoàn tác.',job[:editing])
            rescue => error
              finish(job,error.message)
            end
          end
        else
          schedule(job)
        end
      rescue => error
        finish(job,error.message)
      ensure
        job[:running]=false if owns_tick
      end
      def advance(job)
        case job[:phase]
        when :snapshot
          snapshot(job)
        when :capture
          capture_step(job)
        when :prepare
          prepare_step(job)
        when :ready
          context!(job);LibraryFrameEdit.check(job[:record])
          return :ready
        else
          raise 'Trạng thái chuẩn bị hoa văn không hợp lệ.'
        end
        :working
      end
      def reference(item);item ? (item.respond_to?(:name) ? item.name.to_s : item.to_s) : nil;end
      def mesh_snapshot_state(original,tr,axis,box)
        matrix=tr.to_a;ends=[box.min.to_a[axis],box.max.to_a[axis]]
        on_end=lambda do |vertices|
          coords=vertices.map do |vertex|
            p=vertex.position.to_a
            p[0]*matrix[axis]+p[1]*matrix[4+axis]+p[2]*matrix[8+axis]+matrix[12+axis]
          end
          ends.any? { |cut|coords.all? { |v|(v-cut).abs<0.01/25.4 } }
        end
        gold=lambda do |material|
          next false unless material && material.respond_to?(:color)
          c=material.color;c.red>100 && c.green>70 && c.blue<c.green*0.85
        end
        decorator=lambda do |kind,item|
          case kind
          when :materials then [reference(item.material),reference(item.back_material),reference(item.layer)]
          when :hidden then item.hidden? || on_end.call(item.vertices)
          when :edge
            faces=item.faces;ornament=faces.any? { |f|gold.call(f.material || f.back_material) }
            internal=faces.length==2 && (ornament || faces[0].normal.dot(faces[1].normal).abs>0.9999)
            tiny=ornament && item.length<0.5.mm
            h=item.hidden? || internal || tiny;s=item.soft? || internal;m=item.smooth? || internal
            h=s=m=true if !h && on_end.call([item.start,item.end])
            [h,s,m]
          end
        end
        API.v317166_mesh_begin(original,decorator)
      end
      def snapshot(job)
        model=job[:record][:model];path=job[:path];cached=(API.instance_variable_get(:@v311_sources)||{})[path]
        actual=job[:stamp][3,3]
        warm=cached && cached[0].equal?(model) && cached[1]==actual && cached[2].valid?
        # Reopened files may need one temporary native load. Never leave its
        # operation open across a timer; all following clipping is numeric.
        unless warm
          job[:snapshot_operation]=true
          if model.start_operation('LOFIHOME - Đọc mẫu hoa văn',true)==false
            job[:snapshot_operation]=false
            raise 'Không mở được phiên đọc hoa văn.'
          end
          snapshot_started=true
        end
        source=API.v311_load_source(path,false)
        job[:source]=warm ? source : nil
        job[:source_signature]=LibraryFrameEdit.geometry(source.entities) if warm
        if job[:render_mask];job[:phase]=:ready;return;end
        axis,length,box,ordered,placements=API.v31788_layout(source,path,job[:rows],job[:options])
        records=API.v31788_ornament_records(source,axis,length)
        raise 'Quá nhiều đoạn hoa văn. Hãy chia đường chạy thành các phào ngắn hơn.' if placements.length*records.length>50000
        job[:axis]=axis;job[:box]=box;job[:placements]=placements;job[:ordered]=ordered
        job[:leaves]=[];job[:records]=records;job[:phase]=:capture
        # The temporary source is invalid after abort. Complete its value-only
        # capture now, then return normally; later cuts need no source entities.
        capture_step(job) while !warm && job[:phase]==:capture
      ensure
        model.abort_operation if snapshot_started
        job[:snapshot_operation]=false
      end
      def capture_step(job)
        if job[:leaves].length>=job[:records].length
          job.delete(:records);prepare_begin(job);return
        end
        unless job[:mesh_capture]
          i=job[:leaves].length;original,tr,material,layer=job[:records][i]
          send_progress(job,"Đọc chi tiết hoa văn #{i+1}/#{job[:records].length}…")
          job[:mesh_capture]=mesh_snapshot_state(original,tr,job[:axis],job[:box])
          job[:captured_leaf]={bounds:original.bounds,transform:tr,material:reference(material),layer:reference(layer)}
        end
        return unless API.v317166_mesh_step(job[:mesh_capture])
        leaf=job.delete(:captured_leaf);leaf[:mesh]=job.delete(:mesh_capture)[:data]
        job[:leaves]<<leaf
      end
      def prepare_begin(job)
        ordered=job[:ordered];jobs=Array.new(ordered.length) { [] }
        API.v317_joint_jobs(ordered).each do |index,plane,role|
          a,b=ordered[index];mid=Geom::Point3d.new(3.times.map { |i|(a.to_a[i]+b.to_a[i])*0.5 })
          jobs[index]<<[plane[0],plane[1],mid]
        end
        job[:planes]=jobs;job[:cuts]={};job[:instances]=[];job[:compiled]=[]
        job[:stats]={'clip_calls'=>0,'cut_cache_hits'=>0,'uncut_instances'=>0,'outside'=>0,'instances'=>0,'body_rebuilt'=>!!job[:editing]}
        job[:placement_index]=0;job[:leaf_index]=0;job[:phase]=:prepare
      end
      def prepare_step(job)
        if job[:pending_cut]
          compiler,entries,crossing,tr,index,leaf_index=job[:pending_cut]
          return unless API.v317166_cut_step(compiler)
          cut_id=job[:compiled].length;job[:compiled]<<compiler[:data];entries<<[cut_id,crossing]
          add_prepared(job,leaf_index,cut_id,tr,index) if compiler[:data]
          job.delete(:pending_cut)
          return
        end
        leaves=job[:leaves]
        if job[:placement_index]>=job[:placements].length || leaves.empty?
          raise 'Đường chạy này không còn hoa văn sau khi cắt góc.' if job[:instances].empty?
          leaves.each { |leaf|leaf.delete(:mesh) }
          job.delete(:cuts);job.delete(:planes);job.delete(:placements)
          job[:phase]=:ready
          return
        end
        index,placement=job[:placements][job[:placement_index]]
        leaf_index=job[:leaf_index];leaf=leaves[leaf_index]
        done=job[:placement_index]*leaves.length+leaf_index+1
        total=job[:placements].length*leaves.length
        job[:leaf_index]+=1
        if job[:leaf_index]>=leaves.length;job[:leaf_index]=0;job[:placement_index]+=1;end
        send_progress(job,"Chuẩn bị hoa văn #{done}/#{total} — giữ nguyên phào hiện tại đến khi tính xong…",done,total)
        tr=placement*leaf[:transform];box=leaf[:bounds]
        planes=job[:planes][index].map { |point,normal,keep|API.v31788_local_plane(tr,point,normal,keep) }
        crossing=[]
        planes.each do |plane|
          distances=API.v31788_box_distances(box,plane)
          if distances.max < -1e-7;job[:stats]['outside']+=1;return;end
          crossing<<plane if distances.min < -1e-9
        end
        if crossing.empty?
          job[:stats]['uncut_instances']+=1;add_prepared(job,leaf_index,nil,tr,index);return
        end
        key=[leaf_index,crossing.map { |p|p.map { |v|v.round(8) } }]
        entries=job[:cuts][key]||=[]
        cached=entries.find do |id,old|
          old.length==crossing.length && old.zip(crossing).all? do |a,b|
            8.times.all? { |i|(API.v31788_plane_value(box.corner(i),a)-API.v31788_plane_value(box.corner(i),b)).abs<=1e-9 }
          end
        end
        if cached
          cut_id=cached[0];job[:stats]['cut_cache_hits']+=1
          add_prepared(job,leaf_index,cut_id,tr,index) if job[:compiled][cut_id]
        else
          job[:pending_cut]=[API.v317166_cut_begin(leaf[:mesh],box.min.to_a,crossing),entries,crossing,tr,index,leaf_index]
        end
      end
      def add_prepared(job,leaf_index,cut_id,tr,index)
        job[:instances]<<[leaf_index,cut_id,tr,index];job[:stats]['instances']+=1
      end
      # Keep a small on-disk stage trace even when native construction prevents
      # Chromium from repainting. It contains no model geometry or full paths.
      def trace(job,stage,details={})
        now=Process.clock_gettime(Process::CLOCK_MONOTONIC)
        job[:trace_start] ||= now
        events=job[:trace_events] ||= []
        events<<details.merge(stage:stage,seconds:(now-job[:trace_start]).round(3))
        events.shift while events.length>48
        File.write(File.join(Dir.tmpdir,"LOFIHOME_ornament_#{Process.pid}.json"),JSON.generate(
          version:'317.198',sample:File.basename(job[:path]),editing:!!job[:editing],events:events))
      rescue
        nil
      end
      # Exploding a dense relief invokes SketchUp's merge/intersection work.
      # Native make_unique copies its existing topology without that operation.
      # Two temporary instances force a copy even for a source with no users.
      def private_definition(original)
        model=Sketchup.active_model
        # A real temporary Group makes both references count even when the
        # loaded source definition is otherwise unused. Removed in this same
        # atomic operation, before the selected body is touched.
        holder=model.active_entities.add_group
        guard=holder.entities.add_instance(original,Geom::Transformation.new)
        instance=holder.entities.add_instance(original,Geom::Transformation.new)
        instance.make_unique
        copy=Compat.definition(instance)
        raise 'Không tách được bản sao hoa văn.' if copy==original || !copy.valid?
        raise 'Bản sao hoa văn thiếu hình học.' if copy.entities.length==0 || copy.entities.length!=original.entities.length
        # Isolate descendants while the copy is still reachable through the
        # temporary Group. Unused definitions must not make unique a no-op.
        yield copy if block_given?
        holder.entities.erase_entities([guard,instance])
        holder.erase!
        copy.name='LOFIHOME - Hoa van dung chung'
        copy
      end
      def private_children(entities,stack=[])
        raise 'Hoa văn lồng quá 32 cấp.' if stack.length>32
        entities.each do |child|
          next unless child.is_a?(Sketchup::Group) || child.is_a?(Sketchup::ComponentInstance)
          original=Compat.definition(child)
          raise 'Hoa văn có cấu trúc lồng vòng.' if stack.include?(original)
          child.make_unique
          copy=Compat.definition(child)
          raise 'Không tách được chi tiết hoa văn.' if copy==original
          private_children(copy.entities,stack+[original])
        end
      end
      def clean_private_edges(entities)
        entities.grep(Sketchup::Edge).each do |edge|
          faces=edge.faces
          gold=faces.any? do |face|
            material=face.material || face.back_material
            if material
              c=material.color;c.red>100 && c.green>70 && c.blue<c.green*0.85
            end
          end
          internal=faces.length==2 && (gold || faces[0].normal.dot(faces[1].normal).abs>0.9999)
          next unless internal || (gold && edge.length<0.5.mm)
          edge.hidden=true unless edge.hidden?
          edge.soft=true if internal && !edge.soft?
          edge.smooth=true if internal && !edge.smooth?
        end
        entities.each do |child|
          clean_private_edges(Compat.definition(child).entities) if child.is_a?(Sketchup::Group) || child.is_a?(Sketchup::ComponentInstance)
        end
      end
      def private_leaf(source,record,axis,box)
        original,tr=record
        key=[:private_leaf_317167,source,original,axis,tr.to_a]
        cached=API.v31788_cache[key]
        return cached if cached && cached.valid?
        copy=private_definition(original) { |candidate|private_children(candidate.entities,[original]) }
        clean_private_edges(copy.entities)
        matrix=tr.to_a;ends=[box.min.to_a[axis],box.max.to_a[axis]]
        on_end=lambda do |vertices|
          coords=vertices.map do |vertex|
            p=vertex.position.to_a
            p[0]*matrix[axis]+p[1]*matrix[4+axis]+p[2]*matrix[8+axis]+matrix[12+axis]
          end
          ends.any? { |cut|coords.all? { |v|(v-cut).abs<0.01/25.4 } }
        end
        copy.entities.grep(Sketchup::Face).each do |face|
          face.hidden=true if !face.hidden? && on_end.call(face.vertices)
        end
        copy.entities.grep(Sketchup::Edge).each do |edge|
          next if edge.hidden? || !on_end.call([edge.start,edge.end])
          edge.hidden=true
          edge.soft=true unless edge.soft?
          edge.smooth=true unless edge.smooth?
        end
        copy.set_attribute('LOFIHOME','geometry_role','ornament')
        API.v31788_cache[key]=copy
      end
      def commit(job)
        model=job[:record][:model];group=job[:record][:group]
        job[:committing]=true
        trace(job,'validate')
        if job[:render_mask]
          result=API.v31786_finish_body!
          raise 'Chưa thêm được hoa văn; thân phào được giữ nguyên.' unless result
          return result
        end
        if job[:source]
          raise 'Mẫu gốc trong bản vẽ đã thay đổi.' unless job[:source].valid? && LibraryFrameEdit.geometry(job[:source].entities)==job[:source_signature]
        end
        started=false
        title=job[:editing] ? 'LOFIHOME - Chỉnh phào và hoa văn' : 'LOFIHOME - Thêm hoa văn theo phào'
        raise 'Không mở được thao tác phào và hoa văn.' if model.start_operation(title,true)==false
        started=true
        trace(job,'source_load')
        source=API.v311_load_source(job[:path],false)
        axis,length,box=API.v31788_layout(source,job[:path],job[:rows],job[:options])
        records=API.v31788_ornament_records(source,axis,length)
        raise 'Bộ hoa văn đã thay đổi. Hãy thử lại.' unless records.length==job[:leaves].length
        resolver=lambda do |names|
          names.each_with_index.map do |name,i|
            next nil if name.nil?
            object=(i==2 ? model.layers : model.materials)[name]
            raise 'Vật liệu hoặc Tag của hoa văn đã thay đổi.' unless object
            object
          end
        end
        # Fully clipped leaves do not need an additional uncut native copy.
        leaves={}
        job[:instances].select { |row|row[1].nil? }.map(&:first).uniq.each do |index|
          trace(job,'private_leaf',index:index,total:records.length)
          leaves[index]=private_leaf(source,records[index],axis,box)
        end
        cuts=job[:compiled].each_with_index.map do |data,index|
          trace(job,'native_cut',index:index,total:job[:compiled].length)
          API.v317164_build_compiled_cut(data,job[:stats],resolver)
        end
        job[:stats]['private_leaves']=leaves.length
        job[:stats]['explode_calls']=0
        trace(job,'place_instances',total:job[:instances].length)
        decor=model.definitions.add('LOFIHOME - Hoa van theo phao')
        job[:instances].each do |leaf_index,cut_id,tr,index|
          definition=cut_id.nil? ? leaves[leaf_index] : cuts[cut_id]
          instance=decor.entities.add_instance(definition,tr)
          instance.material=records[leaf_index][2];instance.layer=records[leaf_index][3] if records[leaf_index][3]
          instance.set_attribute('LOFIHOME','edge_index',index)
        end
        # Validate again after native construction and before attaching anything.
        context!(job);LibraryFrameEdit.check(job[:record])
        if job[:editing]
          trace(job,'replace_body')
          options=job[:body_options].merge('build_stage'=>'body','_external_operation'=>true,
            '_before_replace'=>lambda { context!(job);LibraryFrameEdit.check(job[:record]) },
            '_decorate_frame'=>lambda { |candidate|attach_decor(job,candidate,decor) })
          result=API.run_external_full3d_on_selected_edges(job[:path],options,job[:rows],group)
          raise 'Chưa dựng được cả phào và hoa văn.' unless result && result.valid? && result.get_attribute('LOFIHOME','build_stage')=='complete'
          raise 'Chưa thay thế được phào cũ.' if group.valid?
          model.selection.clear;model.selection.add(result)
        else
          trace(job,'attach')
          group.make_unique
          attach_decor(job,group,decor)
          context!(job,true)
          result=group
        end
        trace(job,'commit_operation')
        raise 'Không hoàn tất được thao tác phào và hoa văn.' if model.commit_operation==false
        started=false
        trace(job,'complete',stats:job[:stats])
        LibraryFrameEdit.forget(group) if job[:editing]
        model.active_view.invalidate
        result
      rescue => error
        trace(job,'failed',error:error.message)
        model.abort_operation if started
        if model && group && group.valid? && Sketchup.active_model.equal?(model) && model.active_entities.equal?(job[:record][:entities])
          model.selection.clear;model.selection.add(group)
        end
        raise
      end
      def attach_decor(job,group,decor)
        instance=group.entities.add_instance(decor,Geom::Transformation.new)
        instance.name='HOA VAN RIENG - GIU NGUYEN CHI TIET'
        instance.set_attribute('LOFIHOME','geometry_role','ornament')
        group.set_attribute('LOFIHOME','ornament_components',1)
        group.set_attribute('LOFIHOME','build_stage','complete')
        job[:stats]['preparation_slices']=job[:slices]
        group.set_attribute('LOFIHOME','fast_ornament_stats',JSON.generate(job[:stats]))
      end
      def finish(job,message,refresh=false)
        return unless @job.equal?(job)
        trace(job,'reply',message:message)
        @job=nil
        API.instance_variable_set(:@v31786_library_busy,false)
        begin;job[:record][:model].remove_observer(job[:observer]) if job[:observer];rescue;end
        # Let the normal selection probe refresh the replacement. Do not hash
        # all completed relief geometry again just to unlock this reply.
        extra=refresh ? ',{"edit_token":null,"control_refresh":true}' : ''
        job[:dialog].execute_script("savedLibraryRunFinished(#{Compat.json_literal(job[:token])},#{Compat.json_literal(message)}#{extra})")
      rescue
        nil
      end
    end
  end
end
