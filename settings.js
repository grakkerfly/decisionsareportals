// EDIT THESE VALUES: project links, contract address and music playlist.
window.SITE_CONFIG = {
  twitter: 'https://x.com/portaldecisions', // e.g. https://x.com/your_account
  pumpfun: 'https://pump.fun/coin/5dPKW7oEEynFRSH39U11Yes7Rjk9ENPb9iEgiM3Vpump', // paste the full Pump.fun coin URL
  contract: '5dPKW7oEEynFRSH39U11Yes7Rjk9ENPb9iEgiM3Vpump', // paste the contract address to copy
  tracks: ['assets/music.mp3'], // add more MP3 paths for the next button
  volume: 0.15
};

(()=>{
 const config=window.SITE_CONFIG;
 const localFile=location.protocol==='file:';
 if(localFile){const home=document.querySelector('.wordmark');if(home)home.href='index.html';const entry=document.querySelector('.portal-link');if(entry)entry.href='main.html';}
 let audio;
 const remote=window.parent!==window;
 if(remote){
  // file:// pages may isolate frames. Messages control the actual playing audio.
  const handlers={},state={volume:config.volume,paused:true,error:null};
  const send=(command,value)=>window.parent.postMessage({type:'portal-audio-command',command,value},'*');
  audio={get volume(){return state.volume},set volume(value){state.volume=value;send('volume',value)},get paused(){return state.paused},get error(){return state.error},play(){send('play');return Promise.resolve()},pause(){send('pause')},addEventListener(type,fn){(handlers[type]??=[]).push(fn)}};
  window.addEventListener('message',e=>{if(e.source!==window.parent||e.data?.type!=='portal-audio-state')return;Object.assign(state,e.data.state);for(const fn of handlers.volumechange||[])fn();for(const fn of handlers.loadeddata||[])fn()});
  send('state');
 }else{
  audio=new Audio();audio.preload='metadata';audio.volume=Math.max(0,Math.min(1,config.volume));audio.src=config.tracks[0]||'';audio.dataset.track='0';window.portalAudio=audio;
 }
 function next(){if(remote){window.parent.postMessage({type:'portal-audio-command',command:'next'},'*');return}if(!config.tracks.length)return;const index=(Number(audio.dataset.track||0)+1)%config.tracks.length;audio.dataset.track=String(index);audio.src=config.tracks[index];audio.load();return audio.play().catch(()=>{});}
 if(!remote)audio.addEventListener('ended',next);
 if(document.body.classList.contains('entrance')){
  const link=document.querySelector('.portal-link');
  for(const event of ['pointerenter','focus'])link.addEventListener(event,()=>window.portalHover=true);
  for(const event of ['pointerleave','blur'])link.addEventListener(event,()=>window.portalHover=false);
  link.addEventListener('click',e=>{
   if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();if(window.portalEntering)return;
   // Keep the user-activated audio in this shell while the interior loads.
   audio.play().catch(()=>{});window.portalEntering=true;document.body.classList.add('entering');
   const frame=document.createElement('iframe');frame.title='decisions are portals';frame.className='portal-interior';frame.allow='autoplay; fullscreen';frame.style.visibility='hidden';
   function syncAudio(){frame.contentWindow?.postMessage({type:'portal-audio-state',state:{volume:audio.volume,paused:audio.paused,error:audio.error?'unavailable':null}},'*')}
   window.addEventListener('message',e=>{if(e.source!==frame.contentWindow||e.data?.type!=='portal-audio-command')return;const {command,value}=e.data;if(command==='volume'&&typeof value==='number'&&Number.isFinite(value))audio.volume=Math.max(0,Math.min(1,value));else if(command==='play')audio.play().catch(syncAudio);else if(command==='pause')audio.pause();else if(command==='next')next();syncAudio()});
   for(const event of ['play','pause','error','volumechange','loadeddata'])audio.addEventListener(event,syncAudio);
   let ready=false,transitionDone=false;function reveal(){if(!ready||!transitionDone)return;window.portalSceneStop=true;frame.style.visibility='visible';document.querySelectorAll('body > :not(iframe)').forEach(el=>el.remove());document.body.className='portal-shell';document.title='decisions are portals';try{history.replaceState(null,'',localFile?'main.html':'/main')}catch{}frame.contentWindow.focus();}
   frame.addEventListener('load',()=>{ready=true;syncAudio();reveal()});frame.src='main.html';document.body.appendChild(frame);setTimeout(()=>{transitionDone=true;reveal()},matchMedia('(prefers-reduced-motion: reduce)').matches?0:1000);
  });return;
 }
 let resumeMusicAfterVideo=false;
 window.addEventListener('portal-media-change',e=>{
  if(e.detail.video){
   if(!audio.paused){resumeMusicAfterVideo=true;audio.pause();}
  }else if(resumeMusicAfterVideo){
   resumeMusicAfterVideo=false;audio.play().catch(()=>{});
  }
 });
 const twitter=document.querySelector('#twitter-link'),pumpfun=document.querySelector('#pumpfun-link'),copy=document.querySelector('#copy-contract');
 for(const [link,url] of [[twitter,config.twitter],[pumpfun,config.pumpfun]]){let valid=false;try{valid=['https:','http:'].includes(new URL(url).protocol)}catch{}if(valid){link.href=url;link.target='_blank';link.rel='noopener noreferrer'}else{link.setAttribute('aria-disabled','true');link.title='Configure this link in settings.js';link.addEventListener('click',e=>e.preventDefault())}}
 copy.title=config.contract?'Copy contract address':'Configure the contract in settings.js';let copyTimer;
 copy.addEventListener('click',async()=>{if(!config.contract){copy.textContent='not set';resetCopy();return}try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(config.contract);else{const input=document.createElement('textarea');input.value=config.contract;input.style.position='fixed';input.style.opacity='0';document.body.appendChild(input);input.select();const ok=document.execCommand('copy');input.remove();if(!ok)throw Error('copy unavailable')}copy.textContent='copied'}catch{copy.textContent='copy failed'}resetCopy()});
 function resetCopy(){clearTimeout(copyTimer);copyTimer=setTimeout(()=>copy.textContent='copy contract',1800)}
 const toggle=document.querySelector('#music-toggle'),skip=document.querySelector('#music-next'),volume=document.querySelector('#music-volume'),status=document.querySelector('#music-status');
 volume.value=String(audio.volume);const changeVolume=()=>{audio.volume=Math.max(0,Math.min(1,Number(volume.value)))};volume.addEventListener('input',changeVolume);volume.addEventListener('change',changeVolume);audio.addEventListener('volumechange',()=>{volume.value=String(audio.volume)});
 function update(){toggle.textContent=audio.paused?'play':'pause';toggle.setAttribute('aria-label',audio.paused?'Play music':'Pause music');status.textContent=audio.error?'music unavailable':'';}
 toggle.onclick=()=>{if(audio.paused)audio.play().catch(update);else audio.pause()};skip.onclick=next;for(const event of ['play','pause','error','loadeddata'])audio.addEventListener(event,update);update();
})();
