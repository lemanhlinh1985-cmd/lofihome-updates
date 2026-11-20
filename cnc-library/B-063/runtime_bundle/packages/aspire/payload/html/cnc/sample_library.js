(function () {
  'use strict';
  let dialog, status, url, automatic, trigger, loaded=false, working=false, lastAttempt=0, known={samples:[],url:'',automatic:false};
  const $=id=>document.getElementById(id);
  const send=(action,payload={})=>window.CorelHost.send('jdp_samples_'+action,payload);
  function receive(state,message) {
    known=state;
    if(url && document.activeElement!==url)url.value=state.url||'';
    if(automatic)automatic.checked=state.automatic;
    if(status)status.textContent=message || ('Đã lưu '+state.samples.length+' mẫu bổ sung trên máy.');
    const entries=window.LofiOriginalCNCCatalog;
    const shapes=window.LofiCNCShapes||(window.LofiCNCShapes={});
    const changed=[];
    for(const s of state.samples) {
      const id='patterns__capnhat_'+s.id;
      let e=entries.find(x=>x.id===id);
      if(e && e.revision>=s.revision)continue;
      const path=s.parts.map(part=>[part.outer,...part.holes].map(r=>'M'+r.map(v=>v.join(',')).join('L')+'Z').join('')).join('');
      // This SVG is derived from validated numeric loops only.
      const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+s.width+' '+s.height+'"><path transform="translate(0 '+s.height+') scale(1 -1)" fill="#a57047" fill-rule="evenodd" d="'+path+'"/></svg>';
      if(!e){e={id};entries.push(e);}
      Object.assign(e,{name:s.name,width:s.width,height:s.height,thickness:17.5,group:'patterns',category:'Mẫu cập nhật',
        revision:s.revision,parts:s.parts.length,model_status:'closed',updatedSample:true,
        vertices:s.parts.reduce((n,p)=>n+[p.outer,...p.holes].reduce((t,r)=>t+r.length,0),0),
        thumbnailUrl:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)});
      shapes[id]={id,width:s.width,height:s.height,parts:s.parts};
      changed.push(e);
    }
    if(changed.length)window.dispatchEvent(new CustomEvent('lofi-library-updated',{detail:changed}));
  }
  async function load(){
    if(loaded || !dialog || !window.lofiSamplesReady)return;
    loaded=true;
    try{await send('list');await checkOnOpen();}
    catch(e){status.textContent=e.message;trigger.title=e.message;}
  }
  async function checkOnOpen(){
    if(!loaded || !known.automatic || working || Date.now()-lastAttempt<60000)return;
    lastAttempt=Date.now();try{await send('auto');}catch(e){status.textContent=e.message;}
  }
  async function run(fn){
    if(working)return;
    working=true;
    const buttons=Array.from(dialog.querySelectorAll('button[data-work]'));
    buttons.forEach(e=>e.disabled=true);status.textContent='Đang kiểm tra thư viện…';
    try{await fn();}catch(e){status.textContent=e.message;}finally{working=false;buttons.forEach(e=>e.disabled=false);}
  }
  window.LofiLibrary={receive,load,checkOnOpen};
  document.addEventListener('DOMContentLoaded',()=>{
    trigger=document.createElement('button');trigger.id='jdpSampleUpdates';trigger.textContent='Cập nhật mẫu';
    const help=$('jdpHelp');document.querySelector('header').insertBefore(trigger,help||null);
    dialog=document.createElement('dialog');dialog.id='jdpSampleDialog';
    dialog.innerHTML='<form method="dialog"><button aria-label="Đóng" class="jdp-close">×</button></form><h2>Cập nhật mẫu</h2>'+
      '<p>Mẫu tải về sẽ có trong <b>Thư viện → Mẫu cập nhật</b> và dùng được khi ngoại tuyến.</p>'+
      '<label>Nguồn mẫu (link HTTPS đến gói JSON)<input id="lofiSampleUrl" type="url" placeholder="https://…" autocomplete="off"></label>'+
      '<label class="frequency"><input id="lofiSampleAuto" type="checkbox"> Kiểm tra mỗi ngày khi mở bảng</label>'+
      '<div class="actions"><button data-work id="lofiSampleCheck">Kiểm tra và tải</button><button data-work id="lofiSampleSave">Lưu nguồn</button></div>'+
      '<div class="actions"><button data-work id="lofiSampleLocal">Nhập gói JSON từ máy</button><button data-work id="lofiSampleDemo">Thêm 3 mẫu đi kèm</button></div>'+
      '<p role="status" aria-live="polite" id="lofiSampleStatus"></p><button id="lofiSampleBrowse">Xem mẫu đã lưu</button>';
    document.body.appendChild(dialog); url=$('lofiSampleUrl');automatic=$('lofiSampleAuto');status=$('lofiSampleStatus');
    const configure=()=>send('config',{url:url.value.trim(),automatic:automatic.checked});
    trigger.onclick=()=>{dialog.showModal();if(!status.textContent)status.textContent='Đã lưu '+known.samples.length+' mẫu bổ sung trên máy.';};
    $('lofiSampleSave').onclick=()=>run(configure);
    $('lofiSampleCheck').onclick=()=>run(async()=>{if(!url.value.trim())throw Error('Dán link gói JSON vào ô Nguồn mẫu hoặc chọn Nhập gói JSON từ máy.');await configure();await send('check');});
    $('lofiSampleDemo').onclick=()=>run(()=>send('demo'));
    const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.hidden=true;dialog.appendChild(input);
    $('lofiSampleLocal').onclick=()=>{input.value='';input.click();};
    input.onchange=()=>{const f=input.files[0];if(f)run(async()=>{if(f.size>8*1024*1024)throw Error('Gói mẫu lớn hơn 8 MB.');await send('import',{content:await f.text()});});};
    $('lofiSampleBrowse').onclick=()=>{dialog.close();$('originalTab').click();$('originalSearch').value='';$('originalGroup').value='updates';$('originalGroup').dispatchEvent(new Event('change'));};
    load();
  });
})();
