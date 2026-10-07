const notes={
'2026-06-28':'John, Matt and Samantha ran from Island Heights to Stamford, passing through New York Harbor and stopping to look at the Statue of Liberty.',
'2026-06-29':'Kirsten joined in Stamford. Grey Expectations continued to Stonington; Mystic was never a stop.',
'2026-06-30':'The weather-window run to Nantucket. Two dense fog encounters forced major slowdowns before arrival.',
'2026-07-05':'Kirsten had left Nantucket Saturday. John departed Sunday with Tim and Charlie for Newport.',
'2026-07-06':'Newport to Branford, including the Newport mansions seen from the bow.',
'2026-07-07':'Branford to Jersey City through Long Island Sound and into New York Harbor.',
'2026-07-08':'Jersey City to Island Heights: the final run home.'};
const gallery=[['boat','Grey Expectations — grey Pursuit OS 355'],['engines','Triple Yamaha 300s'],['liberty','New York Harbor — voyage bookend'],['photos/photo-022','June 30 fog • 12:52 PM EDT'],['harbor','Harbor scene'],['croquet','Croquet in whites'],['croquet2','Tim’s birthday weekend'],['race','Firecracker 5K'],['beach','Beach + dunes dinner'],['house','The Nantucket house base'],['mansions','Newport mansions'],['crew','Friends on the trip']];
let map,layers={},chart,trip,chartDate=null,chartWindow=null;
let chartMap,chartMapLayers={},chartMapMarker,mainChartMarker,chartSelected=null;
Promise.all([fetch('data/trip.json').then(r=>r.json()),fetch('data/route.geojson').then(r=>r.json()),voyageWeather.ready]).then(([t,geo])=>{trip=t;document.querySelector('#totalNm').textContent=t.total_nm.toFixed(1);document.querySelector('#topSpeed').textContent=t.top_speed.toFixed(2);initMap(geo);initChartMap(geo);renderLegs();renderTable();initChartControls();renderChart('speed');document.dispatchEvent(new Event('tripready'))}).catch(e=>{document.querySelector('#legNote').textContent='Route data could not load. Refresh to try again.';console.error(e)});
function initMap(geo){map=L.map('map',{scrollWheelZoom:false});L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);const colors=['#e76f51','#2a9d8f','#264653','#f4a261','#457b9d','#6d597a','#e9c46a'];geo.features.forEach((f,i)=>{const l=L.geoJSON(f,{style:{color:colors[i],weight:5,opacity:.9}}).addTo(map);l.bindPopup(`<b>${f.properties.label}</b><br>${f.properties.date}`);l.on('click',()=>{selectLeg(f.properties.date);document.dispatchEvent(new CustomEvent('legselected',{detail:f.properties.date}))});layers[f.properties.date]=l});fitAll()}
function fitAll(){chartDate=null;chartWindow=null;if(trip)renderChart(document.querySelector('#metric').value);const g=L.featureGroup(Object.values(layers));map.fitBounds(g.getBounds(),{padding:[20,20]});Object.values(layers).forEach(l=>l.setStyle({opacity:.9,weight:5}));document.querySelectorAll('.leg-strip button').forEach(b=>b.classList.remove('active'));document.querySelector('#legTitle').textContent='Entire voyage';document.querySelector('#legNote').textContent='530.2 unique GPX nautical miles across seven travel days.';document.querySelector('#legStats').innerHTML=''}
function selectLeg(date){chartDate=date;chartWindow=null;renderChart(document.querySelector('#metric').value);Object.entries(layers).forEach(([d,l])=>l.setStyle({opacity:d===date?1:.12,weight:d===date?7:3}));map.fitBounds(layers[date].getBounds(),{padding:[35,35]});const l=trip.legs.find(x=>x.date===date);document.querySelector('#legTitle').textContent=`${l.from} → ${l.to}`;document.querySelector('#legNote').textContent=notes[date];document.querySelector('#legStats').innerHTML=`<p><b>${l.distance_nm.toFixed(1)} nm</b> GPX distance<br><b>${l.top_speed.toFixed(2)} kt</b> top speed<br><b>${l.moving_hours.toFixed(1)} hr</b> derived moving time</p>`;document.querySelectorAll('.leg-strip button').forEach(b=>b.classList.toggle('active',b.dataset.date===date))}
function renderLegs(){const el=document.querySelector('#legStrip');trip.legs.forEach(l=>{const b=document.createElement('button');b.dataset.date=l.date;b.innerHTML=`<b>${l.from} → ${l.to}</b><small>${new Date(l.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})} • ${l.distance_nm.toFixed(1)} nm</small>`;b.addEventListener('click',()=>{selectLeg(l.date);document.dispatchEvent(new CustomEvent('legselected',{detail:l.date}))});el.appendChild(b)});document.querySelector('#allLegs').addEventListener('click',fitAll)}
function renderTable(){document.querySelector('#legTable').innerHTML=trip.legs.map(l=>`<tr><td>${l.date.slice(5)}</td><td>${l.from} → ${l.to}</td><td>${l.distance_nm.toFixed(1)}</td><td>${l.top_speed.toFixed(2)}</td><td>${l.moving_hours.toFixed(1)}</td></tr>`).join('')}
function renderBoatChart(metric){const bounds=chartBounds();if(!chartWindow)chartWindow=bounds;syncChartControls();syncChartMap();renderFogNotes();renderPassageNotes();if(chart)chart.destroy();const s=trip.samples.filter(x=>x[metric]!=null&&x.speed<60&&(!chartDate||x.date===chartDate));const label={speed:'Speed (kt)',depth:'Depth (ft)',temp:'Water temp (°F)'}[metric];chart=new Chart(document.querySelector('#profileChart'),{type:'line',data:{datasets:[{label,data:s.map(x=>({x:x.distance_nm,y:x[metric]})),borderColor:'#f3d7a0',backgroundColor:'#f3d7a022',pointRadius:0,borderWidth:1.5,tension:.08}, {label:'Selected position',data:chartSelected&&chartSelected[metric]!=null?[{x:chartSelected.distance_nm,y:chartSelected[metric]}]:[],pointRadius:6,pointHoverRadius:7,pointBackgroundColor:'#f28c5b',pointBorderColor:'#ffffff',pointBorderWidth:2,showLine:false}]},plugins:[passageBands,fogBands,chartPositionLine],options:{responsive:true,maintainAspectRatio:false,animation:false,onClick:(event,_,c)=>handleChartClick(event,c,s),plugins:{legend:{labels:{color:'#fff',filter:item=>item.datasetIndex===0}}},scales:{x:{type:'linear',min:chartWindow[0],max:chartWindow[1],title:{display:true,text:'Cumulative trip distance (nm)',color:'#c3d1d7'},ticks:{color:'#c3d1d7'},grid:{color:'#ffffff12'}},y:{title:{display:true,text:label,color:'#c3d1d7'},ticks:{color:'#c3d1d7'},grid:{color:'#ffffff12'},reverse:metric==='depth'}}}})}
document.querySelector('#metric').addEventListener('change',e=>renderChart(e.target.value));
document.querySelector('#illustrated').addEventListener('click',()=>{document.body.classList.toggle('illustrated');document.querySelector('#illustrated').textContent=document.body.classList.contains('illustrated')?'Photo mode':'Illustrated mode'});
const grid=document.querySelector('#galleryGrid'),dlg=document.querySelector('#lightbox');gallery.forEach(([f,cap])=>{const fig=document.createElement('figure');fig.innerHTML=`<img loading="lazy" src="assets/${f}.jpg" alt="${cap}"><figcaption>${cap}</figcaption>`;fig.tabIndex=0;fig.setAttribute('role','button');fig.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fig.click()}});fig.addEventListener('click',()=>{openPhotoSlideshow(gallery.map(([name,caption])=>({src:'assets/'+name+'.jpg',caption,alt:caption})),gallery.findIndex(([name])=>name===f))});grid.appendChild(fig)});dlg.querySelector('#lightboxClose').addEventListener('click',()=>dlg.close());dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});

function chartBounds(){const samples=trip.samples.filter(x=>!chartDate||x.date===chartDate);return [samples[0].distance_nm,samples.at(-1).distance_nm]}
function syncChartControls(){
 const bounds=chartBounds(),leg=trip.legs.find(l=>l.date===chartDate);
 document.querySelector('#chartLeg').value=chartDate||'all';
 document.querySelector('#chartTitle').textContent=leg?leg.from+' → '+leg.to:'Voyage profile by distance';
 for(const [i,id] of [[0,'chartStart'],[1,'chartEnd']]){const input=document.querySelector('#'+id);input.min=bounds[0];input.max=bounds[1];input.value=chartWindow[i];document.querySelector('#'+id+'Label').textContent=chartWindow[i].toFixed(1)+' nm';}
 document.querySelector('#chartRangeNote').textContent='Showing '+chartWindow[0].toFixed(1)+'–'+chartWindow[1].toFixed(1)+' nm of cumulative trip distance · '+(leg?leg.date+' · '+leg.distance_nm.toFixed(1)+' nm leg':'Entire voyage')+'. Drag either slider to narrow the view.';
 const span=chartWindow[1]-chartWindow[0],full=bounds[1]-bounds[0];
 document.querySelector('#chartZoomIn').disabled=span<=1.01;
 document.querySelector('#chartZoomOut').disabled=span>=full-.01;
 document.querySelector('#chartEarlier').disabled=chartWindow[0]<=bounds[0]+.01;
 document.querySelector('#chartLater').disabled=chartWindow[1]>=bounds[1]-.01;
}
function setChartLeg(date){if(date!=='all'&&!trip.legs.some(l=>l.date===date))throw Error('Unknown voyage leg');chartDate=date==='all'?null:date;chartWindow=null;renderChart(document.querySelector('#metric').value)}
function zoomChart(factor){const bounds=chartBounds(),full=bounds[1]-bounds[0],span=Math.min(full,Math.max(1,(chartWindow[1]-chartWindow[0])*factor)),center=(chartWindow[0]+chartWindow[1])/2;const start=Math.max(bounds[0],Math.min(bounds[1]-span,center-span/2));chartWindow=[start,start+span];renderChart(document.querySelector('#metric').value)}
function panChart(direction){const bounds=chartBounds(),span=chartWindow[1]-chartWindow[0];const start=Math.max(bounds[0],Math.min(bounds[1]-span,chartWindow[0]+direction*span*.5));chartWindow=[start,start+span];renderChart(document.querySelector('#metric').value)}
function initChartControls(){
 trip.legs.forEach(l=>{const o=document.createElement('option');o.value=l.date;o.textContent=l.date.slice(5)+' · '+l.from+' → '+l.to+' · '+l.distance_nm.toFixed(1)+' nm';document.querySelector('#chartLeg').appendChild(o)});
 document.querySelector('#chartLeg').addEventListener('change',e=>setChartLeg(e.target.value));
 document.querySelector('#chartZoomIn').addEventListener('click',()=>zoomChart(.5));document.querySelector('#chartZoomOut').addEventListener('click',()=>zoomChart(2));document.querySelector('#chartEarlier').addEventListener('click',()=>panChart(-1));document.querySelector('#chartLater').addEventListener('click',()=>panChart(1));document.querySelector('#chartReset').addEventListener('click',()=>{chartWindow=null;renderChart(document.querySelector('#metric').value)});
 document.querySelector('#chartStart').addEventListener('input',e=>{chartWindow[0]=Math.min(Number(e.target.value),chartWindow[1]-1);renderChart(document.querySelector('#metric').value)});
 document.querySelector('#chartEnd').addEventListener('input',e=>{chartWindow[1]=Math.max(Number(e.target.value),chartWindow[0]+1);renderChart(document.querySelector('#metric').value)});
}
document.querySelectorAll('.bookend-photo').forEach(b=>b.addEventListener('click',()=>{const buttons=[...document.querySelectorAll('.bookend-photo')];openPhotoSlideshow(buttons.map(x=>({src:x.dataset.image,caption:x.dataset.caption,alt:x.querySelector('img').alt})),buttons.indexOf(b))}));

const chartPositionLine={id:'selectedPositionLine',afterDatasetsDraw(c){if(!chartSelected)return;const x=c.scales.x.getPixelForValue(chartSelected.distance_nm),a=c.chartArea;if(x<a.left||x>a.right)return;const ctx=c.ctx;ctx.save();ctx.strokeStyle='#f28c5b';ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(x,a.top);ctx.lineTo(x,a.bottom);ctx.stroke();ctx.restore();}};
function initChartMap(geo){
 chartMap=L.map('chartMap',{scrollWheelZoom:false});L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(chartMap);
 geo.features.forEach(f=>{chartMapLayers[f.properties.date]=L.geoJSON(f,{style:{color:'#3aa6a0',weight:3,opacity:.8}}).addTo(chartMap)});
 syncChartMap();
}
function syncChartMap(){
 if(!chartMap)return;
 if(chartSelected&&chartDate&&chartSelected.date!==chartDate){chartSelected=null;if(chartMapMarker)chartMap.removeLayer(chartMapMarker);if(mainChartMarker)map.removeLayer(mainChartMarker);chartMapMarker=null;mainChartMarker=null;document.querySelector('#chartLocationTitle').textContent='Where was this?';document.querySelector('#chartLocationReadout').innerHTML='<p>Click the graph to see the recorded position, time and boat measurements here.</p>';}
 Object.entries(chartMapLayers).forEach(([date,l])=>l.setStyle({opacity:(!chartDate||date===chartDate)?0.85:0.15,weight:date===chartDate?4:3}));
 if(!chartSelected){const ls=chartDate?[chartMapLayers[chartDate]]:Object.values(chartMapLayers);chartMap.fitBounds(L.featureGroup(ls).getBounds(),{padding:[14,14]});}
}
function handleChartClick(event,c,samples){
 const a=c.chartArea;if(event.x<a.left||event.x>a.right||event.y<a.top||event.y>a.bottom)return;
 const nm=c.scales.x.getValueForPixel(event.x);const visible=samples.filter(p=>p.distance_nm>=chartWindow[0]&&p.distance_nm<=chartWindow[1]);if(!visible.length)return;
 const p=visible.reduce((best,x)=>Math.abs(x.distance_nm-nm)<Math.abs(best.distance_nm-nm)?x:best);selectChartPoint(p);
}
function selectChartPoint(p){
 if(!p||!Number.isFinite(p.lat)||!Number.isFinite(p.lon))return;
 chartSelected=p;const leg=trip.legs.find(l=>l.date===p.date);const time=new Date(p.time).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit',timeZone:'America/New_York'});
 document.querySelector('#chartLocationTitle').textContent=leg.from+' → '+leg.to;
 document.querySelector('#chartLocationReadout').innerHTML='<b>'+time+' EDT</b><p>'+p.distance_nm.toFixed(2)+' nm into the voyage</p><dl><div><dt>Speed</dt><dd>'+p.speed.toFixed(2)+' kt</dd></div><div><dt>Depth</dt><dd>'+(p.depth==null?'Unavailable':p.depth.toFixed(1)+' ft')+'</dd></div><div><dt>Water</dt><dd>'+(p.temp==null?'Unavailable':p.temp.toFixed(1)+'°F')+'</dd></div><div><dt>GPS</dt><dd>'+p.lat.toFixed(5)+', '+p.lon.toFixed(5)+'</dd></div></dl>';
 const coords=[p.lat,p.lon],style={radius:8,color:'#ffffff',weight:2,fillColor:'#f28c5b',fillOpacity:1};
 if(!chartMapMarker)chartMapMarker=L.circleMarker(coords,style).addTo(chartMap);else chartMapMarker.setLatLng(coords);
 if(!mainChartMarker)mainChartMarker=L.circleMarker(coords,style).addTo(map);else mainChartMarker.setLatLng(coords);
 chartMap.setView(coords,11);map.setView(coords,11);renderChart(document.querySelector('#metric').value);
}

const fogBands={id:'fogSlowdownBands',beforeDatasetsDraw(c){
 if(chartDate&&chartDate!=='2026-06-30')return;const a=c.chartArea,ctx=c.ctx;ctx.save();ctx.beginPath();ctx.rect(a.left,a.top,a.right-a.left,a.bottom-a.top);ctx.clip();
 (trip.fog_events||[]).forEach(e=>{const left=Math.max(a.left,c.scales.x.getPixelForValue(e.start_nm)),right=Math.min(a.right,c.scales.x.getPixelForValue(e.end_nm));if(right<=left)return;ctx.fillStyle='rgba(176,198,209,.2)';ctx.fillRect(left,a.top,right-left,a.bottom-a.top);ctx.strokeStyle='rgba(210,225,231,.55)';ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(left,a.top);ctx.lineTo(left,a.bottom);ctx.moveTo(right,a.top);ctx.lineTo(right,a.bottom);ctx.stroke();if(right-left>36){ctx.fillStyle='#dce7eb';ctx.font='600 12px sans-serif';ctx.fillText('Fog '+e.id,left+5,a.top+18);}});ctx.restore();
}};
function renderFogNotes(){
 const el=document.querySelector('#fogNotes');if(!el)return;el.hidden=Boolean(chartDate&&chartDate!=='2026-06-30');if(el.hidden)return;
 const clock=t=>new Date(t).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/New_York'});
 el.innerHTML='<h4>June 30 • Stonington → Nantucket • fog slowdowns</h4><p>Shaded bands mark the sustained speed reductions associated with your two reported fog encounters. Boundaries are approximate, based on GPS speeds below 15 kt; the boat continued moving through both passages.</p><div class="fog-events">'+(trip.fog_events||[]).map(e=>'<article><b>Fog '+e.id+' · '+clock(e.start)+'–'+clock(e.end)+' EDT</b><span>About '+e.minutes+' minutes · median '+e.median_speed.toFixed(1)+' kt</span><button type="button" data-fog="'+e.id+'">Focus on fog '+e.id+'</button></article>').join('')+'</div>';
 el.querySelectorAll('[data-fog]').forEach(b=>b.addEventListener('click',()=>focusFog(Number(b.dataset.fog))));
}
function focusFog(id){
 const e=trip.fog_events.find(e=>e.id===id);if(!e)return;setChartLeg(e.date);const bounds=chartBounds();chartWindow=[Math.max(bounds[0],e.start_nm-3),Math.min(bounds[1],e.end_nm+3)];
 const middle=(e.start_nm+e.end_nm)/2;const samples=trip.samples.filter(p=>p.date===e.date);const point=samples.reduce((best,p)=>Math.abs(p.distance_nm-middle)<Math.abs(best.distance_nm-middle)?p:best);selectChartPoint(point);document.querySelector('.profile-plot').scrollIntoView({behavior:'smooth',block:'center'});
}

let slideshowItems=[],slideshowIndex=0;
function openPhotoSlideshow(items,index){if(!items.length)return;slideshowItems=items;slideshowIndex=Math.max(0,Math.min(items.length-1,index));renderSlideshow();if(!dlg.open)dlg.showModal();}
function renderSlideshow(){const p=slideshowItems[slideshowIndex];dlg.querySelector('img').src=p.src;dlg.querySelector('img').alt=p.alt||p.caption;dlg.querySelector('p').textContent=p.caption;document.querySelector('#photoPosition').textContent=(slideshowIndex+1)+' / '+slideshowItems.length;document.querySelector('#photoPrevious').disabled=slideshowIndex===0;document.querySelector('#photoNext').disabled=slideshowIndex===slideshowItems.length-1;}
function stepPhoto(direction){const next=slideshowIndex+direction;if(next<0||next>=slideshowItems.length)return;slideshowIndex=next;renderSlideshow();}
document.querySelector('#photoPrevious').addEventListener('click',()=>stepPhoto(-1));document.querySelector('#photoNext').addEventListener('click',()=>stepPhoto(1));dlg.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();stepPhoto(-1)}else if(e.key==='ArrowRight'){e.preventDefault();stepPhoto(1)}});
const passageBands={id:'passageBands',beforeDatasetsDraw(c){const a=c.chartArea,ctx=c.ctx;ctx.save();ctx.beginPath();ctx.rect(a.left,a.top,a.right-a.left,a.bottom-a.top);ctx.clip();(trip.passage_events||[]).filter(e=>!chartDate||chartDate===e.date).forEach(e=>{const left=Math.max(a.left,c.scales.x.getPixelForValue(e.start_nm)),right=Math.min(a.right,c.scales.x.getPixelForValue(e.end_nm));if(right<=left)return;const color=e.kind==='No-wake'?'#75cadf':e.kind==='Caution'?'#f28c5b':'#f3d7a0';ctx.fillStyle=color;ctx.globalAlpha=.18;ctx.fillRect(left,a.top,Math.max(2,right-left),a.bottom-a.top);ctx.globalAlpha=.85;ctx.fillRect(left,a.top,2,a.bottom-a.top);ctx.globalAlpha=1;if(right-left>65){ctx.fillStyle=color;ctx.font='600 12px sans-serif';ctx.fillText(e.short,left+5,a.top+18);}});ctx.restore();}};
function renderPassageNotes(){const el=document.querySelector('#passageNotes');const events=(trip.passage_events||[]).filter(e=>!chartDate||chartDate===e.date);el.hidden=!events.length;if(!events.length)return;const clock=t=>new Date(t).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/New_York'});el.innerHTML='<h4>No-wake passages and other slowdowns</h4><p>Approximate passage times from the Garmin tracks; labels come from your trip notes. Blue bands mark the Bay Head–Point Pleasant no-wake passages, gold marks harbor slowdowns, and orange marks the Hart Island caution.</p><div class="fog-events">'+events.map(e=>'<article class="passage-event"><b>'+e.label+'</b><span>'+e.date.slice(5)+' · '+clock(e.start)+'–'+clock(e.end)+' EDT · about '+Math.round(e.minutes)+' min</span><span>Median speed '+e.median_speed.toFixed(1)+' kt</span><button type="button" data-passage="'+e.id+'">Focus on chart</button></article>').join('')+'</div>';el.querySelectorAll('[data-passage]').forEach(b=>b.addEventListener('click',()=>focusPassage(b.dataset.passage)));}
function focusPassage(id){const e=trip.passage_events.find(e=>e.id===id);if(!e)return;setChartLeg(e.date);const bounds=chartBounds();chartWindow=[Math.max(bounds[0],e.start_nm-2),Math.min(bounds[1],e.end_nm+2)];selectChartPoint(e.focus_point);document.querySelector('.profile-plot').scrollIntoView({behavior:'smooth',block:'center'});}


function renderChart(metric){if(['weather','wind','waves'].includes(metric))renderWeatherChart(metric);else {document.querySelector('#weatherChartStatus').textContent='';renderBoatChart(metric);}renderWeatherNotes();renderWeatherPoint(chartSelected);}
