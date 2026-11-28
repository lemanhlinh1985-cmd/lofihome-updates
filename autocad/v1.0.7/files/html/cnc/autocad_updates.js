(function(){
 'use strict';
 const key='lofihome.autocad.update.resume.v1',version='1.0.7';
 window.lofiSaveBeforeUpdate=function(){
  try{if(window.LofiPanelUI)localStorage.setItem(key,JSON.stringify({version,time:Date.now(),config:LofiPanelUI.getConfig()}));return true;}catch(e){return false;}
 };
 document.addEventListener('DOMContentLoaded',()=>{
  const button=document.createElement('button');button.id='corelCheckUpdates';button.textContent='Cập nhật LOFIHOME';button.title='Kiểm tra bản mới của chương trình và thư viện CNC';document.querySelector('header').appendChild(button);
  button.onclick=async()=>{button.disabled=true;try{await CorelHost.send('lofi_check_updates',{});}catch(e){if(window.lofiCNCReply)lofiCNCReply({type:'error',message:e.message});}finally{button.disabled=false;}};
  let saved;try{saved=JSON.parse(localStorage.getItem(key));}catch(e){}
  if(saved&&saved.config&&Date.now()-saved.time>=0&&Date.now()-saved.time<86400000){
   let tries=0;const timer=setInterval(()=>{
    if(++tries>100){clearInterval(timer);return;}
    if(!window.LofiPanelUI||!window.LofiPanelResult)return;
    clearInterval(timer);try{lofiCNCReply({type:'panel_config',config:saved.config});localStorage.removeItem(key);}catch(e){}
   },100);
  }
 });
})();
