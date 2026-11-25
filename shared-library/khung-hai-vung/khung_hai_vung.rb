# encoding: UTF-8
require 'sketchup.rb'
require 'json'
require 'securerandom'
require 'base64'

module LofiKhungHaiVung
  extend self
  DICT = 'LOFIHOME_KhungHaiVung_v1'.freeze unless const_defined?(:DICT)
  TITLE = 'Khung CNC hai vùng'.freeze unless const_defined?(:TITLE)
  DEFAULT = {'w'=>760, 'h'=>1471, 'depth'=>18, 'left'=>40, 'right'=>40, 'top'=>40,
             'bottom'=>40, 'lower'=>574, 'rail'=>40, 'upper_art'=>'', 'lower_art'=>''}.freeze unless const_defined?(:DEFAULT)
  @library=nil
  def library
    @library ||= begin
      @library_root = Sketchup.find_support_file('phao_chi_v305_corner_component/cnc_source_198','Plugins')
      entries = @library_root ? JSON.parse(File.read(File.join(@library_root,'catalog.json'), encoding:'UTF-8')) : []
      entries.each_with_object({}) do |entry,result|
        next unless entry['model_status']=='closed'
        file=File.join(@library_root,entry.fetch('model'))
        unless File.file?(file)
          backup=Sketchup.find_support_file('lofi_khung_hai_vung/models/'+File.basename(file),'Plugins')
          file=backup || File.join(File.dirname(@library_root),'compat_skp7','cnc_source_198',entry.fetch('model'))
        end
        result[entry['id']]=entry.merge('file'=>file) if File.file?(file)
      end
    end
  end

  def dimensions(data)
    c = DEFAULT.merge(data)
    (DEFAULT.keys - %w[upper_art lower_art]).each do |k|
      c[k] = Float(c[k])
      raise ArgumentError,'Mỗi kích thước phải nằm trong khoảng 0,5–10.000 mm.' unless c[k].finite? && c[k].between?(0.5,10000)
    end
    raise ArgumentError,'Hai viền bên chiếm hết chiều rộng khung.' if c['w']-c['left']-c['right'] < 0.5
    raise ArgumentError,'Ô trên phải còn ít nhất 0,5 mm. Hãy hạ đố hoặc giảm bản đố.' if c['h']-c['top']-c['bottom']-c['lower']-c['rail'] < 0.5
    c
  end

  def openings(c)
    x = c['left']
    w = c['w']-x-c['right']
    z = c['bottom']+c['lower']+c['rail']
    {'upper'=>[x,z,w,c['h']-c['top']-z], 'lower'=>[x,c['bottom'],w,c['lower']]}
  end

  def rect(x,z,w,h)
    [[x,z],[x+w,z],[x+w,z+h],[x,z+h]].map { |a,b| [a.mm,0,b.mm] }
  end

  def custom_id(definition)
    definition.get_attribute(DICT,'art_id','')
  end

  def art_for(model,key)
    return if key.empty?
    # Prefer the embedded model so a saved frame travels with its artwork.
    found = model.definitions.find { |d| !d.group? && custom_id(d)==key }
    return found if found
    entry = library[key]
    raise 'Không tìm thấy hình đã chọn trong mô hình hoặc thư viện.' unless entry
    definition = model.definitions.load(entry.fetch('file'))
    definition.set_attribute(DICT,'art_id',key)
    definition
  end

  def fit_art(entities,definition,area,depth)
    b = definition.bounds
    minimum = b.min
    sizes = [b.width,b.height,b.depth].map(&:to_f)
    flat_axis = sizes.each_with_index.min_by(&:first)[1]
    # CNC catalog geometry lies in XY. User SKPs can lie in XY, XZ or YZ.
    flat_axis = 2 if library.key?(custom_id(definition))
    axes = [[1,2,0],[0,2,1],[0,1,2]][flat_axis]
    sx,sz,sd = axes.map { |i| sizes[i] }
    raise 'Hình cần có chiều rộng và chiều cao.' unless sx>0.00001 && sz>0.00001
    x,z,w,h = area
    targets = [X_AXIS,Z_AXIS,Geom::Vector3d.new(0,-1,0)]
    # For planar XZ/YZ artwork preserve its elevation (and front orientation).
    targets[2]=Y_AXIS if flat_axis==1
    target_origin = [x.mm, (flat_axis==1 ? -depth.mm : 0), z.mm]
    target_origin[1] = -depth.mm if sd < 0.00001
    basis = Array.new(3)
    axes.each_with_index { |source,i| basis[source]=targets[i] }
    factors = Array.new(3)
    axes.each_with_index { |source,i| factors[source]=[w.mm/sx,h.mm/sz,sd>0.00001 ? depth.mm/sd : 1.0][i] }
    pose = Geom::Transformation.axes(target_origin,*basis) * Geom::Transformation.scaling(*factors) *
           Geom::Transformation.translation(minimum.vector_to(ORIGIN))
    entities.add_instance(definition,pose)
  end

  def build(model,entities,c,group=nil)
    c=dimensions(c)
    art={}
    %w[upper lower].each { |k| art[k]=art_for(model,c.fetch(k+'_art')) }
    group ||= entities.add_group
    group.make_unique if group.definition.instances.length>1
    content=group.entities
    parts=content.grep(Sketchup::Group).select { |g| g.get_attribute(DICT,'owned') }
    content.erase_entities(parts) unless parts.empty?
    body=content.add_group
    body.name='Viền và đố ngang'
    body.set_attribute(DICT,'owned',true)
    inside=body.entities
    inside.add_face(rect(0,0,c['w'],c['h']))
    areas=openings(c)
    areas.each_value { |a| hole=inside.add_face(rect(*a)); raise 'Không tạo được ô.' unless hole; hole.erase! }
    front=inside.grep(Sketchup::Face).find { |f| f.loops.length==3 }
    raise 'Không tạo được khung có hai ô.' unless front
    front.reverse! if front.normal.y>0
    front.pushpull(c['depth'].mm)
    raise 'Khung chưa thành khối kín.' unless body.manifold?
    areas.each do |key,area|
      next unless art[key]
      slot=content.add_group
      slot.name=key=='upper' ? 'Hình vùng trên' : 'Hình vùng dưới'
      slot.set_attribute(DICT,'owned',true)
      fit_art(slot.entities,art[key],area,c['depth'])
    end
    group.name=TITLE if group.name.empty?
    group.set_attribute(DICT,'config',JSON.generate(c))
    group
  end

  def reference_face(model)
    return unless File.basename(model.path,'.skp').upcase=='KHUNG TÙY CHỈNH'
    e=model.active_entities
    faces=e.grep(Sketchup::Face)
    return unless faces.length==1 && model.active_path.nil?
    f=faces.first
    return unless f.loops.length==3 && f.vertices.length==12 && f.edges.all? { |edge| edge.faces==[f] }
    actual=f.vertices.map { |v| v.position.to_a.map { |u| u.to_mm.round(2) } }.sort
    expected=(rect(0,0,760,1471)+rect(40,40,680,574.334)+rect(40,654.334,680,776.666)).map { |p| p.map { |u| u.to_f.to_mm.round(2) } }.sort
    f if actual==expected
  end

  EDITOR_HTML = <<'LOFI_EDITOR_HTML'
<!doctype html><html lang="vi"><meta charset="utf-8"><title>Khung CNC hai vùng</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#faf9f6;color:#272b27;font:14px "Segoe UI",Arial,sans-serif}header,footer{padding:14px 20px;background:#fff;border-bottom:1px solid #ddd}header h1{font-size:21px;margin:0}main{display:grid;grid-template-columns:minmax(190px,.9fr) minmax(272px,1.1fr);gap:18px;padding:16px 20px}figure{margin:0;align-self:start;position:sticky;top:12px}svg{width:100%;height:clamp(240px,51vh,480px);background:#eeeee9;border:1px solid #dddcd6;border-radius:7px;touch-action:none}figcaption,small{display:block;font-size:12px;color:#505950;margin:5px 0 12px}fieldset{border:0;border-top:1px solid #d8dbd3;margin:0 0 12px;padding:6px 0 0}legend{font-weight:650;padding-right:8px}label{display:flex;flex-direction:column;gap:3px;font-size:12px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:7px 10px}input,select,button{font:inherit;padding:6px;border:1px solid #adb4ab;border-radius:4px;min-width:0;background:white;color:inherit}input,select{width:100%}button{cursor:pointer}button:focus,input:focus,select:focus{outline:2px solid #36826c}footer{position:sticky;bottom:0;display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid #dedfd9;border-bottom:0}#apply{background:#215c4a;color:white;font-weight:650;min-width:138px;padding:9px}#apply:disabled{opacity:.5}#status{font-size:13px}#status.bad{color:#a12615}.art{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:5px;margin-bottom:8px;align-items:end}.art button{font-size:12px}.dim{font-size:13px;font-weight:600;color:#305448;line-height:1.6}#railShape{cursor:ns-resize;fill:#99734e}#railShape:hover{fill:#755231}#picture text{pointer-events:none;fill:#344b40;text-anchor:middle;dominant-baseline:middle;font-family:"Segoe UI",sans-serif}#picture image{pointer-events:none}
.art{grid-template-columns:minmax(0,1fr) auto auto}.art .pick-library{background:#e8f0eb;color:#204b3d;border-color:#799b89}
@media(max-width:680px){.art{grid-template-columns:1fr 1fr}.art label{grid-column:1/-1}}
</style>
<header><h1>Khung CNC hai vùng</h1></header>
<main><figure><svg id="picture" aria-label="Xem trước khung và hai vùng" preserveAspectRatio="xMidYMid meet"><rect id="outer" fill="#c5ab89"/><rect id="uBox" fill="#faf9f5"/><rect id="lBox" fill="#faf9f5"/><image id="uImage" preserveAspectRatio="none"/><image id="lImage" preserveAspectRatio="none"/><rect id="railShape"><title>Kéo để nâng hoặc hạ đố ngang</title></rect><text id="uText">Vùng trên</text><text id="lText">Vùng dưới</text></svg><figcaption>Kéo thanh ngang để chỉnh vị trí. Có thể nhập số đo chính xác ở mục Đố ngang.</figcaption><div class="dim" id="sizes"></div></figure>
<div><fieldset><legend>Kích thước phủ bì (mm)</legend><div class="grid" id="overall"></div></fieldset><fieldset><legend>Bề rộng viền (mm)</legend><div class="grid" id="edges"></div></fieldset>
<fieldset><legend>Đố ngang và hai ô (mm)</legend><div class="grid" id="divider"></div><small>Cao lọt lòng ô dưới được đo từ mặt trên viền đáy đến mặt dưới đố.</small></fieldset>
<fieldset><legend>Hình trong từng vùng</legend><div id="artwork"></div><small>Mỗi hình được co giãn vừa ô tương ứng. Có thể chọn mẫu LOFIHOME, mở tệp SKP riêng hoặc để trống.</small></fieldset></div></main>
<footer><span id="status" aria-live="polite"></span><button id="apply" disabled>Áp dụng vào khung</button></footer>
<script>
'use strict';
const by=id=>document.getElementById(id);
const inputs={}, ids=['w','h','depth','left','right','top','bottom','lower','rail'];
const slots=['upper','lower'], art={}, thumbs={}, fmt=n=>Number(n.toFixed(3));
let loaded=false, busy=false, dragging=false;
function addNumber(container,key,title){
  const label=document.createElement('label'),input=document.createElement('input');
  label.textContent=title; input.type='number';input.min='0.5';input.max='10000';input.step='any';inputs[key]=input;label.appendChild(input);by(container).appendChild(label);
  input.addEventListener('input',()=>{if(key==='upper'&&Number.isFinite(input.valueAsNumber))inputs.lower.value=fmt(value('h')-value('bottom')-value('top')-value('rail')-value('upper'));render(key==='upper');});
}
[['overall','w','Ngang'],['overall','h','Cao'],['overall','depth','Dày tấm'],['edges','left','Trái'],['edges','right','Phải'],['edges','top','Trên'],['edges','bottom','Dưới'],['divider','lower','Cao lọt lòng ô dưới'],['divider','upper','Cao lọt lòng ô trên'],['divider','rail','Bản rộng đố ngang']].forEach(row=>addNumber(...row));
slots.forEach(slot=>{
 const row=document.createElement('div');row.className='art';
 const label=document.createElement('label');label.textContent=slot==='upper'?'Hình vùng trên':'Hình vùng dưới';const select=document.createElement('select');select.setAttribute('aria-label',label.textContent);art[slot]=select;label.appendChild(select);
 const browse=document.createElement('button');browse.className='pick-library';browse.textContent='Chọn trong kho';browse.setAttribute('aria-label','Chọn trong kho cho '+(slot==='upper'?'vùng trên':'vùng dưới'));browse.onclick=()=>sketchup.browse_art(slot);
 const pick=document.createElement('button');pick.textContent='Mở SKP…';pick.onclick=()=>sketchup.pick(slot);select.onchange=()=>changeArt(slot);row.append(label,browse,pick);by('artwork').appendChild(row);
});
function value(key){return inputs[key].valueAsNumber;}
function showError(t){by('status').textContent=t;by('status').className='bad';busy=false;by('apply').disabled=false;}
function render(keepUpper=false){
 if(!loaded)return false;
 const w=value('w'),h=value('h'),b=value('bottom'),r=value('rail'),l=value('lower'),x=value('left'),t=value('top'),inner=w-x-value('right'),u=fmt(h-t-b-r-l);
 if(!keepUpper)inputs.upper.value=Number.isFinite(u)?u:'';
 let error='';
 if(ids.some(k=>!Number.isFinite(value(k))||value(k)<.5||value(k)>10000))error='Nhập kích thước từ 0,5 đến 10.000 mm.';
 else if(inner<.5||u<.5||!Number.isFinite(value('upper')))error='Kích thước đã chọn làm một ô mất khoảng lọt lòng.';
 by('status').className=error?'bad':'';by('status').textContent=error;by('apply').disabled=!!error||busy;
 if(error){by('sizes').textContent='';return false;}
 const margin=Math.max(w,h)*.045;
 by('picture').setAttribute('viewBox',[-margin,-margin,w+2*margin,h+2*margin].join(' '));
 function box(id,a,y,c,d){Object.entries({x:a,y,width:c,height:d}).forEach(([k,v])=>by(id).setAttribute(k,v));}
 box('outer',0,0,w,h);box('railShape',x,t+u,inner,r);
 [[x,t,inner,u,'u','upper'],[x,t+u+r,inner,l,'l','lower']].forEach(([a,y,c,d,p,s])=>{
   box(p+'Box',a,y,c,d);box(p+'Image',a,y,c,d);
   const label=by(p+'Text');label.setAttribute('x',a+c/2);label.setAttribute('y',y+d/2);label.setAttribute('font-size',Math.min(w*.065,d*.25,h*.045));
   const image=by(p+'Image');const uri=thumbs[art[s].value];image.setAttribute('href',uri||'');image.style.display=uri?'':'none';label.style.display=uri?'none':'';
   label.textContent=(s==='upper'?'Vùng trên':'Vùng dưới')+(art[s].value?' · SKP':'');
 });
 by('sizes').textContent='Ô trên '+fmt(inner)+' × '+u+' mm · Ô dưới '+fmt(inner)+' × '+fmt(l)+' mm';
 return true;
}
function changeArt(slot){const key=art[slot].value;if(key&&!thumbs[key])sketchup.thumb(slot,key);render();}
function setThumb([slot,key,uri]){thumbs[key]=uri;if(art[slot].value===key)render();}
function pickedArt([slot,key,name]){slots.forEach(s=>art[s].add(new Option(name,key)));art[slot].value=key;changeArt(slot);}
function setCatalogArt([slot,key]){art[slot].value=key;changeArt(slot);}
function initializeFrame(data){
 ids.forEach(k=>inputs[k].value=data.config[k]);
 slots.forEach(s=>{art[s].add(new Option('Để trống',''));data.options.forEach(([key,name])=>art[s].add(new Option(name,key)));art[s].value=data.config[s+'_art']||'';});
 loaded=true;by('apply').textContent=data.editing?'Cập nhật khung':'Tạo khung';slots.forEach(changeArt);render();
}
function savedFrame(){busy=false;render();by('apply').textContent='Cập nhật khung';by('status').textContent='Đã cập nhật khung trong SketchUp.';}
by('apply').onclick=()=>{if(busy||!render())return;const c={};ids.forEach(k=>c[k]=value(k));slots.forEach(s=>c[s+'_art']=art[s].value);busy=true;by('apply').disabled=true;by('status').textContent='Đang dựng khung…';sketchup.apply(JSON.stringify(c));};
const pic=by('picture');let dragOffset=0;
function svgY(e){const point=pic.createSVGPoint();point.x=e.clientX;point.y=e.clientY;return point.matrixTransform(pic.getScreenCTM().inverse()).y;}
by('railShape').onpointerdown=e=>{if(busy||!render())return;dragging=true;dragOffset=value('h')-value('bottom')-value('lower')-svgY(e);pic.setPointerCapture(e.pointerId);e.preventDefault();};
pic.onpointermove=e=>{if(!dragging)return;const max=value('h')-value('top')-value('bottom')-value('rail')-.5;inputs.lower.value=Math.max(.5,Math.min(max,Math.round(value('h')-value('bottom')-svgY(e)-dragOffset)));render();};
pic.onpointerup=pic.onpointercancel=()=>{dragging=false;};
window.addEventListener('DOMContentLoaded',()=>sketchup.ready());
</script></html>

LOFI_EDITOR_HTML

  def editor
    @dialog.close if @dialog && @dialog.visible?
    model=Sketchup.active_model
    parent=model.active_entities
    target=model.selection.grep(Sketchup::Group).find { |g| g.get_attribute(DICT,'config') }
    candidates=parent.grep(Sketchup::Group).select { |g| g.get_attribute(DICT,'config') }
    target=candidates.first if !target && model.selection.empty? && candidates.length==1
    source=reference_face(model) unless target
    config=target ? JSON.parse(target.get_attribute(DICT,'config')) : DEFAULT.dup
    dialog=UI::HtmlDialog.new(dialog_title:TITLE,preferences_key:'LofiKhungHaiVung1',width:780,height:740,min_width:540,min_height:530,resizable:true,style:UI::HtmlDialog::STYLE_DIALOG)
    @dialog=dialog
    picked={}
    current=-> { raise 'Hãy mở lại bảng trong đúng mô hình và cấp chỉnh sửa.' unless Sketchup.active_model==model && model.active_entities==parent }
    respond=->(method,value){ dialog.execute_script("window.#{method}(#{JSON.generate(value)})") }
    dialog.set_html(EDITOR_HTML)
    dialog.set_on_closed do
      end_pick if @pending_pick && @pending_pick[:dialog]==dialog
    end
    dialog.add_action_callback('browse_art') do |_,slot|
      begin
        current.call
        next unless %w[upper lower].include?(slot)
        raise 'Mở Thư viện 295 mẫu của LOFIHOME để chọn hình.' unless defined?(LVN::PhaoChiV305CornerLite) && LVN::PhaoChiV305CornerLite.respond_to?(:show_cnc_dialog)
        host=LVN::PhaoChiV305CornerLite
        @pending_pick={slot:slot,token:SecureRandom.uuid,dialog:dialog,model:model,parent:parent}
        host.show_cnc_dialog
        window=host.instance_variable_get(:@cnc_window)
        raise 'Không mở được thư viện LOFIHOME.' unless window
        add_cnc_button(window)
        display_pick(window)
      rescue => ex
        end_pick
        respond.call('showError',ex.message)
      end
    end
    dialog.add_action_callback('ready') do |_|
      options=library.values.map { |a| [a['id'],a['name']] }
      model.definitions.each do |d|
        key=custom_id(d)
        options << [key,d.name] unless key.empty? || library.key?(key)
      end
      respond.call('initializeFrame',{'config'=>config,'options'=>options.uniq,'editing'=>!!(source||target)})
    end
    dialog.add_action_callback('pick') do |_,slot|
      begin
        current.call
        next unless %w[upper lower].include?(slot)
        path=UI.openpanel('Chọn hình SketchUp cho vùng '+(slot=='upper' ? 'trên' : 'dưới'),'','SketchUp (*.skp)|*.skp||')
        next unless path
        key='user-'+SecureRandom.uuid
        picked[key]=path
        respond.call('pickedArt',[slot,key,File.basename(path,'.skp')])
      rescue => ex
        respond.call('showError',ex.message)
      end
    end
    dialog.add_action_callback('thumb') do |_,slot,key|
      entry=library[key]
      if entry && %w[upper lower].include?(slot)
        path=File.join(@library_root,entry.fetch('preview'))
        if File.file?(path)
          respond.call('setThumb',[slot,key,'data:image/svg+xml;base64,'+Base64.strict_encode64(File.binread(path))])
        end
      end
    end
    dialog.add_action_callback('apply') do |_,raw|
      started=false
      begin
        current.call
        end_pick if @pending_pick
        raise 'Khung đã bị xóa hoặc khóa. Hãy chọn lại khung.' if target && (!target.valid? || target.locked?)
        c=dimensions(JSON.parse(raw))
        raise 'Bản vẽ gốc đã thay đổi. Hãy mở lại bảng.' if source && (!source.valid? || source!=reference_face(model))
        model.start_operation(TITLE,true)
        started=true
        %w[upper_art lower_art].map { |k| c[k] }.uniq.each do |key|
          if picked.key?(key)
            d=model.definitions.load(picked[key])
            previous=custom_id(d)
            if previous.empty?
              d.set_attribute(DICT,'art_id',key)
            else
              %w[upper_art lower_art].each { |k| c[k]=previous if c[k]==key }
            end
          end
        end
        built=build(model,parent,c,target)
        if source
          edges=source.edges
          source.erase!
          orphaned=edges.select { |e| e.valid? && e.faces.empty? }
          parent.erase_entities(orphaned) unless orphaned.empty?
        end
        model.commit_operation
        started=false
        target=built
        source=nil
        model.selection.clear
        model.selection.add(target)
        respond.call('savedFrame',true)
      rescue => ex
        model.abort_operation if started
        respond.call('showError',ex.message)
      end
    end
    dialog.show
  end

  def self.display_pick(window)
    pick=@pending_pick
    return unless pick
    data={'slot'=>pick[:slot],'token'=>pick[:token]}
    window.execute_script("if(window.lofiFramePick) window.lofiFramePick(#{JSON.generate(data)})")
  end

  def self.end_pick
    @pending_pick=nil
    return unless defined?(LVN::PhaoChiV305CornerLite)
    window=LVN::PhaoChiV305CornerLite.instance_variable_get(:@cnc_window)
    window.execute_script('if(window.lofiFramePick) window.lofiFramePick(null)') if window && window.visible?
  end

  def self.take_art(data)
    p=@pending_pick
    return unless p && p[:token]==data['token']
    dialog=p[:dialog]
    key=data['art'].to_s
    end_pick
    return unless dialog==@dialog && dialog.visible?
    dialog.bring_to_front
    return if key.empty?
    unless Sketchup.active_model==p[:model] && p[:model].active_entities==p[:parent] && library.key?(key)
      dialog.execute_script("showError('Chưa gán hình. Hãy mở lại khung trong đúng mô hình và chọn lại mẫu.')")
      return
    end
    dialog.execute_script("setCatalogArt(#{JSON.generate([p[:slot],key])})")
  end

  LIBRARY_JS = <<'LOFI_LIBRARY_JS'
(function registerFrame() {
  'use strict';
  const catalog = window.LofiOriginalCNCCatalog;
  const group = document.getElementById('originalGroup');
  const cards = document.getElementById('originalCards');
  const geometry = document.querySelector('#originalFilters [data-category="geometry"]');
  if (!catalog || !cards || !group || !geometry || document.getElementById('lofiSpecialGeometry')) return;

  const id = 'patterns__khung_hai_vung';
  const special = 'lofi_special_geometry';
  const label = 'Hình học đặc biệt';
  const item = {id, name:'Khung hai vùng', group:'patterns', category:label,
    width:760, height:1471, thickness:18,
    preview:'../../lofi_khung_hai_vung/khung_hai_vung.svg'};
  const openFrame = () => window.sketchup.cnc_action(JSON.stringify({
    action:'source_layout_load', payload:{editor:'lofi_two_zone'}
  }));

  // The host owns search, sorting, card size and selection in its standard groups.
  if (!catalog.some(entry => entry.id === id)) catalog.push(item);
  const defaults = window.LofiCNCMenuDefaults.order.geometry;
  if (!defaults.includes(id)) defaults.unshift(id);
  group.add(new Option(label, special));
  const filter = document.createElement('button');
  filter.id = 'lofiSpecialGeometry';
  filter.dataset.category = special;
  filter.textContent = label;
  geometry.after(filter);

  const arrange = document.getElementById('originalArrange');
  const search = document.getElementById('originalSearch');
  const count = document.getElementById('originalCount');
  let pick = null;
  const banner = document.createElement('div');
  banner.className = 'row';
  banner.hidden = true;
  banner.setAttribute('role','status');
  const prompt = document.createElement('strong');
  const cancel = document.createElement('button');
  cancel.textContent = 'Quay lại khung';
  banner.append(prompt,cancel);
  document.querySelector('#originalLibrary .original-heading').after(banner);
  function returnToFrame(art) {
    if (!pick) return;
    const token = pick.token;
    window.lofiFramePick(null);
    window.sketchup.cnc_action(JSON.stringify({action:'source_layout_load',payload:{editor:'lofi_region_art',token,art}}));
  }
  cancel.onclick = () => returnToFrame('');
  const style = document.createElement('style');
  style.textContent = '#originalCards.lofi-select-art [data-id="patterns__khung_hai_vung"]{display:none}';
  document.head.appendChild(style);
  window.lofiFramePick = function (next) {
    if (next && pick && next.token === pick.token) return;
    pick = next;
    banner.hidden = !pick;
    filter.disabled = !!pick;
    arrange.disabled = !!pick;
    cards.classList.toggle('lofi-select-art',!!pick);
    if (!pick) return;
    if (cards.classList.contains('arranging')) {
      arrange.disabled=false;arrange.click();arrange.disabled=true;
    }
    window.LofiOriginalCNC.show(true);
    search.value='';
    document.querySelector('#originalFilters [data-category=""]').click();
    prompt.textContent = 'Chọn hình cho '+(pick.slot==='upper'?'vùng trên':'vùng dưới');
  };
  const fold = window.LofiCompat.fold;
  const keywords = fold([item.name, item.id, label].join(' '));
  filter.addEventListener('click', () => {
    if (cards.classList.contains('arranging')) arrange.click();
    group.value = special;
    group.dispatchEvent(new Event('change'));
  });
  cards.addEventListener('click', event => {
    const card = event.target.closest('.original-card');
    if (pick && card) {
      event.stopImmediatePropagation();
      if (card.dataset.id !== id) returnToFrame(card.dataset.id);
      return;
    }
    if (!card || card.dataset.id !== id || cards.classList.contains('arranging')) return;
    event.stopImmediatePropagation();
    openFrame();
  }, true);

  // Reuse the native card for the dedicated filter, including its thumbnail.
  // This category contains a single parametric model and needs no order controls.
  const template = document.createElement('button');
  template.type = 'button';
  template.className = 'original-card';
  template.dataset.id = id;
  template.title = 'Mở khung để chỉnh viền, đố ngang và hình của từng vùng';
  const thumbnail = document.createElement('img');
  thumbnail.src = new URL('../../cnc_source_198/' + item.preview, document.baseURI).href;
  thumbnail.alt = '';
  const name = document.createElement('span');
  name.textContent = item.name;
  const category = document.createElement('small');
  category.textContent = label;
  template.append(thumbnail, name, category);
  function syncSpecial() {
    const active = group.value === special;
    arrange.hidden = active;
    if (!active || !keywords.includes(fold(search.value))) return;
    if (!cards.querySelector('[data-id="' + id + '"]')) cards.replaceChildren(template.cloneNode(true));
    count.textContent = '1 mẫu';
  }
  new MutationObserver(syncSpecial).observe(cards, {childList:true});
  group.dispatchEvent(new Event('change'));
})();

LOFI_LIBRARY_JS

  def self.add_cnc_button(window)
    window.execute_script(LIBRARY_JS)
    window.execute_script(<<~JS)
      (function(){
        var nav=document.querySelector('.cnc-tabs');
        if(!nav)return;
        var b=document.getElementById('lofiKhungHaiVung');
        if(!b){
          b=document.createElement('button');b.id='lofiKhungHaiVung';
          b.textContent='Khung hai vùng';nav.appendChild(b);
        }
        b.onclick=function(){
          sketchup.cnc_action(JSON.stringify({action:'source_layout_load',payload:{editor:'lofi_two_zone'}}));
        };
      })();
    JS
  end

  module CncDialog
    def cnc_library_layout_default
      layout=super
      order=layout.fetch('order').fetch('geometry')
      id='patterns__khung_hai_vung'
      order.unshift(id) unless order.include?(id)
      layout
    end

    def cnc_library_layout_validate(data)
      layout=super
      order=layout.fetch('order').fetch('geometry')
      id='patterns__khung_hai_vung'
      unless data.fetch('order').fetch('geometry',[]).include?(id)
        order.delete(id)
        order.unshift(id)
      end
      layout
    end

    # Use the loaded library's bridge, including dialogs that predate the addon.
    def cnc_source_action(action,data)
      return LofiKhungHaiVung.editor if action=='source_layout_load' && data['editor']=='lofi_two_zone'
      return LofiKhungHaiVung.take_art(data) if action=='source_layout_load' && data['editor']=='lofi_region_art'
      super
    end
    def cnc_reply(packet)
      if %w[presets source_layout].include?(packet['type']) && @cnc_window && @cnc_window.visible?
        LofiKhungHaiVung.add_cnc_button(@cnc_window)
        LofiKhungHaiVung.display_pick(@cnc_window)
      end
      super
    end
  end

  def self.connect_library
    return unless defined?(LVN::PhaoChiV305CornerLite)
    host=LVN::PhaoChiV305CornerLite
    return unless host.respond_to?(:cnc_register_callbacks)
    host.singleton_class.prepend(CncDialog) unless host.singleton_class.ancestors.include?(CncDialog)
    window=host.instance_variable_get(:@cnc_window)
    if window && window.visible?
      add_cnc_button(window)
    end
  end
  UI.start_timer(0,false) { connect_library }

  unless file_loaded?('LofiKhungHaiVungMenu')
    UI.menu('Extensions').add_item(TITLE) { editor }
    UI.add_context_menu_handler do |menu|
      if Sketchup.active_model.selection.grep(Sketchup::Group).any? { |g| g.get_attribute(DICT,'config') }
        menu.add_item('Chỉnh khung CNC hai vùng…') { editor }
      end
    end
    file_loaded('LofiKhungHaiVungMenu')
  end
end
