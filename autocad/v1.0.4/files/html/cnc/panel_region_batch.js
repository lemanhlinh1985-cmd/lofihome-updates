(function(root){
  'use strict';
  var P=root.LofiCNCPanel,R=root.LofiPanelRegions;
  var fields=[
    ['id','Hoa văn nền','pattern'],['mode','Chế độ nền',['pattern','solid','hollow','frameless']],
    ['module','Cỡ hoa văn (mm)',20,3000],['bar_adjust','Bù rộng nét / nan (±mm)',-30,30],
    ['angle','Xoay hoa văn (°)',-360,360],['mirror','Lật hoa văn','boolean'],
    ['offset_x','Dịch X (mm)',-10000,10000],['offset_y','Dịch Y (mm)',-10000,10000],
    ['frame_equal','Khung 4 cạnh','boolean'],['frame','Rộng khung chung (mm)',0,1000],
    ['frame_top','Khung trên (mm)',0,1000],['frame_bottom','Khung dưới (mm)',0,1000],
    ['frame_left','Khung trái (mm)',0,1000],['frame_right','Khung phải (mm)',0,1000],
    ['weld','Hàn hoa văn với khung','boolean'],['margin','Khoảng lùi riêng (mm)',0,1000],
    ['border.id','Mẫu chạy viền','border'],['border.enabled','Hoa văn chạy viền','boolean'],
    ['border.width','Rộng dải viền (mm)',8,1000],['border.module','Cỡ mẫu viền (mm)',10,2000],
    ['border.gap','Khe / chừa mép trong (mm)',.5,100],['border.join_equal','Nối bằng nan của mẫu','boolean'],
    ['border.center_mode','Phần giữa',['inherit','pattern','hollow','solid']],
    ['border.omit_top','Bỏ riềm trên','boolean'],['border.omit_bottom','Bỏ riềm dưới','boolean'],
    ['border.omit_left','Bỏ riềm trái','boolean'],['border.omit_right','Bỏ riềm phải','boolean'],
    ['border.stroke_adjust','Bù dày/mỏng nét diềm (±mm)',-Infinity,Infinity],
    ['border.edge_frame.enabled','Viền bao diềm khi Bỏ khung','boolean'],
    ['border.edge_frame.outer','Viền ngoài diềm (mm)',0,Infinity],['border.edge_frame.inner','Viền trong diềm (mm)',0,Infinity],
    ['border.layout.enabled','Kích thước vòng diềm riêng','boolean'],['border.layout.width','Ngang vòng diềm (mm)',Number.MIN_VALUE,Infinity],['border.layout.height','Cao vòng diềm (mm)',Number.MIN_VALUE,Infinity]
  ];
  var byKey={};fields.forEach(function(f){byKey[f[0]]=f;});
  function read(c,key){
    if(key==='frame_equal')return !P.usesFrameSides(c);
    if(/^frame_(left|right|top|bottom)$/.test(key))return c[key]===undefined ? c.frame : c[key];
    if(key.indexOf('border.layout.')===0){if(!c.border)return undefined;var l=c.border.layout||{},name=key.slice(14);return name==='enabled'?l.enabled===true:l[name]===undefined?c[name]:l[name];}
    if(key.indexOf('border.edge_frame.')===0){if(!c.border)return undefined;var f=c.border.edge_frame||{},name=key.slice(18);return name==='enabled' ? f.enabled!==false : f[name]===undefined ? 10 : f[name];}
    if(key.indexOf('border.')===0){var name=key.slice(7);return c.border ? (name==='stroke_adjust' ? (c.border[name]===undefined ? 0 : c.border[name]) : name==='center_mode' ? c.border[name]||'inherit' : name==='join_equal'||name.indexOf('omit_')===0 ? !!c.border[name] : c.border[name]) : undefined;}
    return c[key];
  }
  function pairedSelection(configs,id){
    return id ? root.LofiCNCBorder.isPaired(id) : configs.length>0 && configs.every(function(c){return c.border && root.LofiCNCBorder.isPaired(c.border.id);});
  }
  function validate(patch,paired){
    if(!patch || typeof patch!=='object' || !Object.keys(patch).length)throw Error('Chưa sửa thông số chung.');
    Object.keys(patch).forEach(function(key){
      var f=byKey[key],v=patch[key];if(!f)throw Error('Thông số không được chỉnh chung: '+key);
      if(typeof f[2]==='number'){if(typeof v!=='number'||!Number.isFinite(v)||v<(key==='border.gap'&&paired?0:f[2])||v>f[3])throw Error(f[1]+' ngoài giới hạn.');}
      else if(f[2]==='boolean'){if(typeof v!=='boolean')throw Error(f[1]+' không hợp lệ.');}
      else if(Array.isArray(f[2])){if(f[2].indexOf(v)<0)throw Error(f[1]+' không hợp lệ.');}
      else if(typeof v!=='string'||!v)throw Error('Chọn '+f[1].toLowerCase()+'.');
    });
  }
  function draft(document,ids,patch){
    var configs=Array.isArray(ids) && document.custom_regions ? document.custom_regions.filter(function(r){return ids.indexOf(r.id)>=0;}).map(function(r){return r.config;}) : [];
    validate(patch,pairedSelection(configs,patch&&patch['border.id']));
    if(!Array.isArray(ids)||ids.length<2||new Set(ids).size!==ids.length)throw Error('Chọn ít nhất hai vùng khác nhau.');
    var next=R.clone(document),found=0;
    if(!next.custom_regions)throw Error('Chưa có bản vẽ chia vùng.');
    next.custom_regions.forEach(function(r,index){
      if(ids.indexOf(r.id)<0)return;found++;
      var c=r.config;
      try{
        if(Object.prototype.hasOwnProperty.call(patch,'frame'))c.frame=patch.frame;
        if(Object.prototype.hasOwnProperty.call(patch,'frame_equal')){
          if(!patch.frame_equal && !P.supportsFrameSides(c))throw Error('Khung 4 cạnh riêng chỉ áp dụng cho vùng chữ nhật.');
          var first=c.custom_frame_sides===undefined;
          c.frame_equal=patch.frame_equal;
          if(c.outline==='custom'&&P.supportsFrameSides(c))c.custom_frame_sides=!patch.frame_equal;
          if(!patch.frame_equal)['left','right','top','bottom'].forEach(function(s){if(c['frame_'+s]===undefined||first)c['frame_'+s]=c.frame;});
        }
        if(patch['border.id']){
          var borderId=patch['border.id'],oldBorder=c.border||{};
          var pair=root.LofiCNCBorder.pairedDefaults(borderId,c.width,c.height);
          var switched=oldBorder.id!==borderId,defaults={width:Math.min(90,Math.min(c.width,c.height)*.12),module:90,gap:4,join_equal:true};
          if(!pair && switched && oldBorder.gap===0 && root.LofiCNCBorder.isPaired(oldBorder.id))oldBorder.gap=4;
          c.border=Object.assign(defaults,oldBorder,switched&&pair||{},{id:borderId,enabled:true});
        }
        Object.keys(patch).forEach(function(key){
          if(key==='frame'||key==='frame_equal'||key==='border.id')return;
          if(key.indexOf('border.')===0){if(!c.border){if(key==='border.enabled'&&patch[key]===false)return;throw Error('Chọn mẫu chạy viền trước.');}if(key.indexOf('border.layout.')===0){c.border.layout=Object.assign({enabled:false,width:c.width,height:c.height},c.border.layout||{});c.border.layout[key.slice(14)]=patch[key];}else if(key.indexOf('border.edge_frame.')===0){c.border.edge_frame=Object.assign({enabled:true,outer:10,inner:10},c.border.edge_frame||{});c.border.edge_frame[key.slice(18)]=patch[key];}else c.border[key.slice(7)]=patch[key];}
          else c[key]=patch[key];
        });
        Object.keys(patch).forEach(function(key){P.activateFrameFollow(c,key);});
        if(Object.prototype.hasOwnProperty.call(patch,'margin'))c.equal_margins=true;
      }catch(e){throw Error('Vùng '+(index+1)+': '+e.message);}
    });
    if(found!==ids.length)throw Error('Vùng đã thay đổi; chọn lại các vùng.');
    return P.normalize(next);
  }
  function stage(document,ids,patch,assets){return P.build(draft(document,ids,patch),assets,false);}
  function create(catalog,hooks){
    var element=document.createElement('div');element.className='panel-editor';element.id='panelRegionBatch';element.hidden=true;
    element.innerHTML='<h2 id="regionBatchTitle">Chỉnh chung các vùng</h2><p>Chỉ những ô anh sửa mới áp dụng. Ô “Khác nhau” giữ thiết lập riêng cho tới khi anh nhập giá trị chung.</p>';
    var patch={},busy=false,controls={},sections={},lastConfig=null,lastIndices=[],labels={pattern:'Hoa văn',solid:'Đặc',hollow:'Rỗng',frameless:'Bỏ khung',inherit:'Theo chế độ tấm'};
    function effective(){
      var p=R.clone(patch),has=function(k){return Object.prototype.hasOwnProperty.call(p,k);};
      if(has('id')&&!has('mode'))p.mode='pattern';
      if(!has('frame_equal')){
        if(['frame_left','frame_right','frame_top','frame_bottom'].some(has))p.frame_equal=false;
        else if(has('frame'))p.frame_equal=true;
      }
      return p;
    }
    ['Hoa văn nền','Khung & khoảng lùi','Chạy viền trong'].forEach(function(name){var d=document.createElement('details');d.open=true;var s=document.createElement('summary');s.textContent=name;d.appendChild(s);var box=document.createElement('div');box.className='panel-section fields';d.appendChild(box);element.appendChild(d);sections[name]=box;});
    fields.forEach(function(f,i){
      var key=f[0],label=document.createElement('label'),input=document.createElement(typeof f[2]==='number'?'input':'select');
      label.textContent=f[1];label.appendChild(input);input.dataset.regionBatch=key;controls[key]=input;
      if(input.tagName==='INPUT'){input.type='number';input.min=f[2];input.max=f[3];input.step='any';}
      else{
        var empty=document.createElement('option');empty.value='';empty.textContent='Khác nhau / giữ nguyên';input.appendChild(empty);
        var choices=f[2]==='boolean' ? [['true',key==='frame_equal'?'Dùng chung 4 cạnh':'Bật'],['false',key==='frame_equal'?'Chỉnh riêng 4 cạnh':'Tắt']] : Array.isArray(f[2]) ? f[2].map(function(v){return [v,labels[v]];}) : catalog.filter(function(e){return f[2]==='border' ? root.LofiCNCBorder.isBorder(e.id) : e.group==='patterns';}).map(function(e){return [e.id,e.name];});
        choices.forEach(function(c){var option=document.createElement('option');option.value=c[0];option.textContent=c[1];input.appendChild(option);});
      }
      sections[i<8?'Hoa văn nền':i<16?'Khung & khoảng lùi':'Chạy viền trong'].appendChild(label);
      input.addEventListener(input.tagName==='INPUT'?'input':'change',function(){
        if(busy)return;
        if(input.value==='')delete patch[key];else patch[key]=input.tagName==='INPUT' ? Number(input.value) : f[2]==='boolean' ? input.value==='true' : input.value;
        changed();
      });
    });
    var note=document.createElement('small');note.textContent='Bù nét là ±mm so với mẫu gốc. Khung riêng 4 cạnh chỉ dùng khi các vùng đều là chữ nhật. Nhập khoảng lùi sẽ tắt bám viền cho các vùng chọn. Chọn một vùng để chỉnh họa tiết chèn.';element.appendChild(note);
    var actions=document.createElement('div');actions.className='actions';actions.innerHTML='<button id="regionBatchApply" class="primary">Áp dụng cho các vùng chọn</button><button id="regionBatchCancel">Bỏ thay đổi</button>';
    element.insertBefore(actions,element.querySelector('details'));var message=document.createElement('p');message.id='regionBatchMessage';message.setAttribute('role','status');actions.after(message);
    function dirty(){return Object.keys(patch).length>0;}
    function usesPairedBorder(values){
      return pairedSelection(lastConfig?lastIndices.map(function(i){return lastConfig.custom_regions[i].config;}):[],values['border.id']);
    }
    function changed(){
      var values=effective();controls['border.gap'].min=usesPairedBorder(values)?0:.5;Object.keys(controls).forEach(function(key){controls[key].style.borderColor=Object.prototype.hasOwnProperty.call(values,key)?'#d86b00':'';});
      ['mode','frame_equal'].forEach(function(key){if(Object.prototype.hasOwnProperty.call(values,key))controls[key].value=String(values[key]);else if(lastConfig&&lastIndices.length){var originals=lastIndices.map(function(i){return read(lastConfig.custom_regions[i].config,key);});controls[key].value=originals.every(function(v){return v===originals[0];})?String(originals[0]):'';}});
      actions.querySelector('#regionBatchApply').disabled=busy||!dirty();actions.querySelector('#regionBatchCancel').disabled=busy||!dirty();message.textContent=dirty()?'Có thông số chưa áp dụng. Bấm Áp dụng để cập nhật các vùng chọn.':'';hooks.changed();
    }
    function refresh(config,indices){
      lastConfig=config;lastIndices=indices.slice();
      element.querySelector('#regionBatchTitle').textContent='Chỉnh chung '+indices.length+' vùng';
      if(!indices.length)return;
      fields.forEach(function(f){var key=f[0],input=controls[key];input.disabled=busy;
        if(Object.prototype.hasOwnProperty.call(patch,key))return;
        var values=indices.map(function(i){return read(config.custom_regions[i].config,key);}),same=values.every(function(v){return v===values[0];});
        input.value=same&&values[0]!==undefined?String(values[0]):'';input.placeholder=same&&values[0]===undefined?'Chưa có':'Khác nhau';
      });changed();
    }
    function reset(){patch={};busy=false;Object.keys(controls).forEach(function(k){controls[k].disabled=false;});changed();}
    actions.querySelector('#regionBatchCancel').onclick=function(){reset();hooks.refresh();};
    actions.querySelector('#regionBatchApply').onclick=function(){
      try{element.querySelectorAll('input').forEach(function(e){if(Object.prototype.hasOwnProperty.call(patch,e.dataset.regionBatch)&&!e.checkValidity())throw Error('Thông số số học ngoài giới hạn.');});var values=effective();validate(values,usesPairedBorder(values));hooks.apply(values);}catch(e){message.textContent=e.message;}
    };
    return {element:element,dirty:dirty,busy:function(){return busy;},refresh:refresh,reset:reset,
      setBusy:function(value){busy=value;Object.keys(controls).forEach(function(k){controls[k].disabled=value;});changed();},
      error:function(text){busy=false;Object.keys(controls).forEach(function(k){controls[k].disabled=false;});changed();message.textContent=text;},
      choose:function(id,border){if(busy)return;var key=border?'border.id':'id';patch[key]=id;controls[key].value=id;changed();},
      getPatch:effective};
  }
  root.LofiRegionBatch={fields:fields,read:read,draft:draft,stage:stage,create:create};
})(typeof window==='undefined'?globalThis:window);
