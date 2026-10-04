let tripTracks={}, phoneDays=[], tripPhotos=[], selectedDay='2026-06-28', replayMarker, replayFrame, replayTime=0, replayIndex=0;
const shoreStories={
 '2026-07-01':['Nantucket • settling in','After the first night aboard, the house became the base for the Nantucket stay. The boat waited on the mooring while the trip moved ashore.'],
 '2026-07-02':['Nantucket • croquet in whites','The photographs capture croquet and time together at the house during Tim’s birthday weekend.'],
 '2026-07-03':['Nantucket • beach and dunes','A day ashore, followed by the beach and dunes dinner. The evening phone activity supports the timing of the shore outing.'],
 '2026-07-04':['Nantucket • the Fourth','Race morning, the Firecracker 5K and time with friends. Kirsten left Nantucket on Saturday.']
};
const dayFmt=d=>new Date(d+'T12:00:00-04:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'America/New_York'});
const clockFmt=t=>new Date(t).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/New_York'});
function escapeText(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function loadExplorer(){
 try {
  [tripTracks,phoneDays,tripPhotos]=await Promise.all(['tracks','timeline','photos'].map(n=>fetch('data/'+n+'.json').then(r=>{if(!r.ok)throw Error('Trip data could not load');return r.json();})));
  tripPhotos=tripPhotos.filter(p=>!p.excluded);
  if(!trip)await new Promise(resolve=>document.addEventListener('tripready',resolve,{once:true}));
  phoneDays.forEach(d=>{
   const b=document.createElement('button');b.type='button';b.dataset.day=d.date;b.innerHTML='<b>'+new Date(d.date+'T12:00:00-04:00').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'America/New_York'})+'</b><small>'+(tripTracks[d.date]?'On water':'Nantucket')+'</small>';b.addEventListener('click',()=>chooseDay(d.date));document.querySelector('#daySelector').appendChild(b);
   const o=document.createElement('option');o.value=d.date;o.textContent=dayFmt(d.date);document.querySelector('#photoFilter').appendChild(o);
  });
  const o=document.createElement('option');o.value='undated';o.textContent='Supporting photos • no trip date';document.querySelector('#photoFilter').appendChild(o);
  document.querySelector('#photoFilter').addEventListener('change',e=>renderArchive(e.target.value));
  document.querySelector('#playReplay').addEventListener('click',toggleReplay);
  document.querySelector('#replayRange').addEventListener('input',e=>{pauseReplay();const ps=tripTracks[selectedDay];replayIndex=Math.round(Number(e.target.value)/1000*(ps.length-1));replayTime=new Date(ps[replayIndex].time).getTime();renderReplay();});
  document.addEventListener('legselected',e=>chooseDay(e.detail,false));
  chooseDay(selectedDay);renderArchive('all');renderDateReview();registerTripTools();
 }catch(e){document.querySelector('#dayStory').textContent='The trip explorer could not load. Refresh to try again.';console.error(e);}
}
function pauseReplay(){cancelAnimationFrame(replayFrame);replayFrame=null;document.querySelector('#playReplay').textContent='Play route';}
function chooseDay(date,updateMap=true){
 const day=phoneDays.find(d=>d.date===date);if(!day)throw Error('Choose a date from June 28 through July 8, 2026.');
 pauseReplay();selectedDay=date;
 document.querySelectorAll('[data-day]').forEach(b=>{const active=b.dataset.day===date;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 const leg=trip.legs.find(l=>l.date===date),story=shoreStories[date];
 document.querySelector('#dayDate').textContent=dayFmt(date);
 document.querySelector('#dayTitle').textContent=leg?leg.from+' → '+leg.to:story[0];
 document.querySelector('#dayStory').textContent=leg?notes[date]:story[1];
 const ps=tripTracks[date];document.querySelector('#replayControls').hidden=!ps;
 document.querySelector('#dayMeasures').innerHTML=leg?'<div><b>'+leg.distance_nm.toFixed(1)+' nm</b><span>Unique GPX distance</span></div><div><b>'+leg.top_speed.toFixed(2)+' kt</b><span>Top recorded speed</span></div><div><b>'+clockFmt(ps[0].time)+'–'+clockFmt(ps.at(-1).time)+'</b><span>Garmin recording window</span></div>':'<div><b>'+day.stops+' stops</b><span>Phone Timeline records</span></div><div><b>'+day.walking_miles+' mi</b><span>Phone-estimated walking</span></div>';
 if(updateMap&&map){if(leg)selectLeg(date);else{fitAll();map.fitBounds([[41.22,-70.22],[41.34,-69.98]]);}}
 if(replayMarker&&map){map.removeLayer(replayMarker);replayMarker=null;}
 if(ps){replayIndex=0;replayTime=new Date(ps[0].time).getTime();document.querySelector('#replayRange').value=0;renderReplay();}
 document.querySelector('#timelineSummary').innerHTML='<b>'+day.stops+' stops · '+day.movements+' movements</b><p class="fine">'+day.path_records+' background path records support the day’s timing. Automatic transport classifications can include boat travel.</p>';
 const el=document.querySelector('#timelineEvents');el.replaceChildren();day.events.forEach(e=>{
  const row=document.createElement('div');row.className='timeline-event';row.innerHTML='<time>'+clockFmt(e.start)+'</time><div><b>'+escapeText(e.label)+'</b><small>'+clockFmt(e.end)+' · '+(e.minutes>=60?(e.minutes/60).toFixed(1)+' hr':e.minutes+' min')+(e.confidence<.5?' · uncertain classification':'')+'</small></div>';el.appendChild(row);
 });
 const photos=tripPhotos.filter(p=>p.date===date);const photoEl=document.querySelector('#dayPhotos');photoEl.replaceChildren();const h=document.createElement('h4');h.textContent=photos.length+' dated photographs';photoEl.appendChild(h);const grid=document.createElement('div');grid.className='photo-strip';photos.forEach(p=>grid.appendChild(photoButton(p,photos)));photoEl.appendChild(grid);
}
function photoCaption(p){const id=p.review_id?p.review_id+' · ':'';return id+(p.date?dayFmt(p.date)+(p.time?' · '+p.time:''):p.caption+' · date needed');}
function photoButton(p,album=tripPhotos){const b=document.createElement('button');b.type='button';b.className='photo-button';b.setAttribute('aria-label','Open '+photoCaption(p));b.innerHTML='<img loading="lazy" src="'+p.thumb+'" alt="'+escapeText(photoCaption(p))+'">';b.addEventListener('click',()=>openTripPhoto(p,album));return b;}
function openTripPhoto(p,album=tripPhotos){openPhotoSlideshow(album.map(x=>({src:x.src,caption:photoCaption(x),alt:x.caption})),album.indexOf(p));}

function renderArchive(filter){
 const photos=tripPhotos.filter(p=>filter==='all'||(filter==='undated'?!p.date:p.date===filter));const g=document.querySelector('#archiveGallery');g.replaceChildren();document.querySelector('#photoCount').textContent=photos.length+' photographs';
 photos.forEach(p=>{const f=document.createElement('figure');f.appendChild(photoButton(p,photos));const cap=document.createElement('figcaption');cap.textContent=photoCaption(p);f.appendChild(cap);g.appendChild(f);});
}
function renderReplay(){
 const ps=tripTracks[selectedDay];if(!ps?.length)return;const p=ps[replayIndex];
 if(map&&typeof L!=='undefined'){if(!replayMarker)replayMarker=L.circleMarker([p.lat,p.lon],{radius:9,color:'#102a3a',weight:3,fillColor:'#f28c5b',fillOpacity:1}).addTo(map);else replayMarker.setLatLng([p.lat,p.lon]);}
 document.querySelector('#replayRange').value=Math.round(replayIndex/(ps.length-1)*1000);
 document.querySelector('#replayReadout').textContent=clockFmt(p.time)+' EDT · '+p.speed.toFixed(1)+' kt'+(p.depth!=null?' · '+p.depth.toFixed(1)+' ft depth':'')+(p.temp!=null?' · '+p.temp.toFixed(1)+'°F water':'');
}
function toggleReplay(){
 if(replayFrame){pauseReplay();return;}const ps=tripTracks[selectedDay];if(!ps?.length)return;
 if(replayIndex>=ps.length-1){replayIndex=0;replayTime=new Date(ps[0].time).getTime();}
 document.querySelector('#playReplay').textContent='Pause route';document.querySelector('#voyage').scrollIntoView({behavior:'smooth',block:'start'});
 let last=performance.now();function tick(now){replayTime+=(now-last)*Number(document.querySelector('#replaySpeed').value);last=now;while(replayIndex<ps.length-1&&new Date(ps[replayIndex+1].time).getTime()<=replayTime)replayIndex++;renderReplay();if(replayIndex>=ps.length-1){pauseReplay();return;}replayFrame=requestAnimationFrame(tick);}replayFrame=requestAnimationFrame(tick);
}
function registerTripTools(){
 const context=document.modelContext;if(!context?.registerTool)return;const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
 try{Promise.resolve(context.registerTool({name:'select_trip_day',description:'Select a day of the Grey Expectations Nantucket voyage and show its route, photographs and Timeline.',inputSchema:{type:'object',properties:{date:{type:'string',enum:phoneDays.map(d=>d.date)}},required:['date'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input.date!=='string'||Object.keys(input).some(k=>k!=='date'))throw Error('Supply one supported date.');chooseDay(input.date);document.querySelector('#explorer').scrollIntoView({behavior:'smooth'});return {date:selectedDay,title:document.querySelector('#dayTitle').textContent,photos:tripPhotos.filter(p=>p.date===selectedDay).length};}},{signal:lifecycle.signal})).catch(console.error);}catch(e){console.error(e);}
}
loadExplorer();

function renderDateReview(){
 const grid=document.querySelector('#dateReviewGrid');grid.replaceChildren();const pending=tripPhotos.filter(p=>!p.date);document.querySelector('.date-review-intro').hidden=!pending.length;document.querySelector('.date-review-section').hidden=!pending.length;document.querySelector('.review-dates-link').hidden=!pending.length;document.querySelector('#photo-dates summary').textContent=pending.length?'Help date the '+pending.length+' remaining photographs':'All trip photographs have dates';pending.forEach(p=>{const figure=document.createElement('figure');figure.appendChild(photoButton(p,pending));const caption=document.createElement('figcaption');const id=document.createElement('b');id.textContent=p.review_id;const file=document.createElement('small');file.textContent=p.source;caption.append(id,file);figure.appendChild(caption);grid.appendChild(figure)});
 function openReview(){if(window.location?.hash==='#photo-dates')document.querySelector('#photo-dates').open=true;}window.addEventListener('hashchange',openReview);openReview();
}
