(function(){
 'use strict';
 var id='patterns__capnhat_b-063', sourceWidth=600, sourceHeight=1300;
 if(!window.LofiPanelUI||document.getElementById('b063PanelOptions'))return;
 var width=document.querySelector('[data-panel="width"]');
 var height=document.querySelector('[data-panel="height"]');
 var module=document.querySelector('[data-panel="module"]');
 if(!width||!height||!module||!width.closest('.fields'))return;
 var applying=false,editing=false;
 function canonical(){
  return {schema:'LOFIHOME_PANEL_295_1',name:'B-063',id:id,
   width:sourceWidth,height:sourceHeight,thickness:17.5,module:sourceWidth,
   offset_x:0,offset_y:0,frame:0,frame_equal:true,
   frame_left:0,frame_right:0,frame_top:0,frame_bottom:0,
   margin:0,equal_margins:true,left:0,right:0,top:0,bottom:0,
   weld:true,follow_frame:true,angle:0,mirror:false,bar_adjust:0,
   mode:'pattern',outline:'rectangle',plane:'xz',material:'#a87548',items:[],
   b063_single_panel:true,b063_lock_ratio:true};
 }
 // Resolve on demand: a persisted JSON import can add B-063 after startup.
 function entry(){
  return (window.LofiOriginalCNCCatalog||[]).find(function(e){return e.id===id;});
 }
 function enrich(){
  var e=entry();
  if(e){e.name='B-063';e.panel_preset=canonical();e.fit_panel_width_on_select=false;}
  return e;
 }
 function config(){return LofiPanelUI.getConfig();}
 function active(c){return c&&c.id===id;}
 function panelMode(){
  var button=document.getElementById('panelMode');
  return !!button&&button.classList.contains('active');
 }
 function regularPanel(c){
  return active(c)&&panelMode()&&!c.custom_regions&&
   !(c.outline==='custom'&&c.custom_outer);
 }
 function apply(c){
  if(applying||!regularPanel(config())||!active(c))return;
  c.name='B-063';applying=true;
  try{window.lofiCNCReply({type:'panel_config',config:c});}
  finally{applying=false;}
  show();
 }
 function preset(){
  if(!regularPanel(config())||!enrich())return;
  apply(canonical());
 }
 var box=document.createElement('div');box.id='b063PanelOptions';
 box.style.cssText='margin:8px 0;padding:9px;border:1px solid #bbdacf;border-radius:5px;background:#f2faf6';
 function checkbox(name,text){
  var label=document.createElement('label'),input=document.createElement('input');
  label.style.cssText='display:block;margin:5px 0';input.type='checkbox';input.id=name;
  label.appendChild(input);label.appendChild(document.createTextNode(' '+text));
  box.appendChild(label);return input;
 }
 var whole=checkbox('b063KeepLayout','Giữ nguyên bố cục B-063');
 var lock=checkbox('b063KeepRatio','Giữ tỷ lệ mẫu');
 var note=document.createElement('small');note.style.display='block';box.appendChild(note);
 width.closest('.fields').after(box);
 function normalModuleDisabled(c){
  var center=c.border&&c.border.enabled&&c.border.center_mode&&c.border.center_mode!=='inherit'?
   c.border.center_mode:c.mode;
  return c.mode==='frameless'||center!=='pattern'||
   (c.id==='patterns__vach_anh_033'&&c.outline==='rectangle');
 }
 function releaseModule(c){
  if(!module.dataset.b063PreviousDisabled)return;
  delete module.dataset.b063PreviousDisabled;
  // The panel controls may already have changed the disabled state while
  // switching patterns. Rebase the other owners on that pattern's normal state.
  if(c.custom_regions||(active(c)&&c.b063_single_panel===true))return;
  var disabled=normalModuleDisabled(c),other=false;
  ['kkPreviousDisabled','b91PreviousDisabled'].forEach(function(key){
   if(module.dataset[key]){module.dataset[key]=disabled?'yes':'no';other=true;}
  });
  module.disabled=other||disabled;
 }
 function show(){
  var c=config(),visible=regularPanel(c),full=visible&&c.b063_single_panel===true;
  box.hidden=!visible;whole.checked=c.b063_single_panel===true;lock.checked=c.b063_lock_ratio!==false;
  note.textContent=full?
   'Một vách nguyên mẫu. Đổi rộng/cao sẽ co giãn toàn bộ bố cục. Bỏ Giữ tỷ lệ mẫu để chỉnh riêng từng chiều. Khung gốc đã có trong mẫu.':
   'Đang lặp hoa văn theo Cỡ mô-đun. Bật Giữ nguyên bố cục B-063 để dùng một vách hoàn chỉnh.';
  if(full){
   module.dataset.b063PreviousDisabled=normalModuleDisabled(c)?'yes':'no';
   module.disabled=true;
  }else releaseModule(c);
 }
 whole.onchange=function(){
  var c=config();if(!regularPanel(c))return;
  c.b063_single_panel=whole.checked;
  if(whole.checked){c.offset_x=0;c.offset_y=0;}
  else{c.offset_x=-c.module/2;c.offset_y=-c.module*sourceHeight/sourceWidth/2;}
  apply(c);
 };
 lock.onchange=function(){
  var c=config();if(!regularPanel(c))return;
  c.b063_lock_ratio=lock.checked;
  if(lock.checked)c.width=+(c.height*sourceWidth/sourceHeight).toFixed(6);
  apply(c);
 };
 document.addEventListener('input',function(e){
  if(editing||applying||(e.target!==width&&e.target!==height))return;
  var c=config();if(!regularPanel(c)||c.b063_lock_ratio===false)return;
  var n=Number(e.target.value);if(!Number.isFinite(n)||!(n>0))return;
  var other=e.target===width?height:width;
  var value=e.target===width?n*sourceHeight/sourceWidth:n*sourceWidth/sourceHeight;
  editing=true;
  try{other.value=+value.toFixed(6);other.dispatchEvent(new Event('input',{bubbles:true}));}
  finally{editing=false;}
 },true);
 window.addEventListener('lofi-library-updated',function(){enrich();show();});
 window.addEventListener('lofi-source-select',function(e){
  if(e.detail&&e.detail.item&&e.detail.item.id===id&&!e.detail.loaded&&!applying&&regularPanel(config()))preset();
  show();
 });
 window.addEventListener('lofi-cnc-reply',function(e){
  if(e.detail&&e.detail.type==='panel_config')show();
 });
 ['panelMode','moduleMode'].forEach(function(name){
  var button=document.getElementById(name);if(button)button.addEventListener('click',show);
 });
 var reset=document.getElementById('panelReset');
 if(reset){var oldReset=reset.onclick;reset.onclick=function(e){
  if(regularPanel(config()))preset();else if(oldReset)oldReset.call(this,e);
 };}
 enrich();show();
})();
