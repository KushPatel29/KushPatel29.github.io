import { readAnalytics } from './live-model.js';
const $ = selector => document.querySelector(selector);
const KEY = 'portfolio_owner_read_key';
let token = '', timer, busy = false, lastData = null;
function status(text, error = false) { $('#live-status').textContent=text; $('#live-status').dataset.error=String(error); }
function duration(seconds) { return seconds >= 60 ? `${Math.floor(seconds/60)}m ${seconds%60}s` : `${seconds}s`; }
function rows(selector, values, valueKey, format, empty) {
  const list=$(selector); list.replaceChildren();
  if (!values.length) { const li=document.createElement('li'); li.className='empty'; li.textContent=empty; list.append(li); return; }
  const max=Math.max(...values.map(x=>x[valueKey]),1);
  values.forEach(item=>{
    const li=document.createElement('li'), label=document.createElement('span'), value=document.createElement('strong'), meter=document.createElement('meter');
    label.textContent=item.label; value.textContent=format(item[valueKey]);
    meter.min=0; meter.max=max; meter.value=item[valueKey]; meter.setAttribute('aria-label',`${item.label}: ${format(item[valueKey])}`);
    li.append(label,value,meter); list.append(li);
  });
}
function render(data) {
  document.body.classList.remove('locked');
  $('#visits').textContent=data.visits.toLocaleString();
  $('#attention-total').textContent=duration(data.engagedSeconds);
  $('#most-read').textContent=data.attention[0]?.label || 'No data yet';
  $('#resume-actions').textContent=data.actions.resume.toLocaleString();
  $('#live-window').textContent=`${data.start.slice(0,10)} – ${data.end.slice(0,10)} · UTC`;
  $('#updated').textContent=`Updated ${new Date(data.updatedAt).toLocaleTimeString()} · refreshes every 60 seconds`;
  rows('#attention-rows',data.attention,'seconds',duration,'No section-time events yet. New visits start contributing after 15 active seconds in a section.');
  rows('#country-rows',data.countries.map(x=>({label:x.name || 'Unknown',count:x.count})),'count',x=>x.toLocaleString(),'No location data in this period.');
  $('#location-note').textContent='Approximate network-derived countries for homepage visits. VPNs and proxies can change the result.'+(data.countriesMore?' Showing the top 100 countries.':'');
  rows('#page-rows',data.pages,'count',x=>x.toLocaleString(),'No recorded pages in this period.');
  rows('#project-rows-live',data.projects,'count',x=>x.toLocaleString(),'No project-link events yet. Collection begins with the tracking release.');
  const chart=$('#visit-chart'); chart.replaceChildren();
  const max=Math.max(...data.daily.map(x=>x.daily),1);
  data.daily.forEach(day=>{ const wrap=document.createElement('div'),bar=document.createElement('i'); wrap.className='day'; wrap.title=`${day.day}: ${day.daily} visits`; bar.style.height=`${100*day.daily/max}%`; wrap.append(bar); chart.append(wrap); });
  chart.setAttribute('aria-label',data.daily.length?data.daily.map(x=>`${x.day}: ${x.daily}`).join(', '):'No daily visits yet');
  $('#daily-start').textContent=data.start.slice(0,10); $('#daily-end').textContent=data.end.slice(0,10);
}
async function refresh() {
  if (busy || !token || document.visibilityState==='hidden') return;
  busy=true; $('#refresh').disabled=true; $('#range').disabled=true; status('Refreshing private GoatCounter statistics…');
  try {
    const data=await readAnalytics(token,Number($('#range').value)); lastData=data; render(data);
    $('#connection-form').hidden=true; $('#disconnect').hidden=false;
    status('Connected · real traffic · only visible in this connected browser');
  } catch (error) {
    status(error.message+' '+(lastData?'Last successful values remain visible; they are not current.':'No live values are being shown.'),true);
    if (!lastData) $('#connection-form').hidden=false;
    $('#updated').textContent=lastData?`Last successful update ${new Date(lastData.updatedAt).toLocaleString()}`:'Not connected';
  } finally { busy=false; $('#refresh').disabled=false; $('#range').disabled=false; }
}
$('#connection-form').addEventListener('submit',async event=>{
  event.preventDefault(); token=$('#api-key').value.trim();
  if (!token) return;
  $('#api-key').value=''; await refresh();
  try { if (lastData && $('#remember').checked) localStorage.setItem(KEY,token); else localStorage.removeItem(KEY); } catch { status('Connected without browser storage; this connection lasts until reload.'); }
  clearInterval(timer); timer=setInterval(refresh,60000);
});
$('#refresh').addEventListener('click',refresh);
$('#range').addEventListener('change',()=>{
  lastData=null; document.body.classList.add('locked');
  ['#visits','#attention-total','#most-read','#resume-actions'].forEach(id=>$(id).textContent='—');
  ['#attention-rows','#country-rows','#page-rows','#project-rows-live','#visit-chart'].forEach(id=>$(id).replaceChildren());
  refresh();
});
$('#disconnect').addEventListener('click',()=>{
  token=''; lastData=null; clearInterval(timer);
  try { localStorage.removeItem(KEY); } catch {}
  location.reload();
});
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') refresh(); });
$('#export').addEventListener('click',()=>{
  if (!lastData) { status('Connect to real analytics before exporting.',true); return; }
  const blob=new Blob([JSON.stringify(lastData,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='portfolio-analytics-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(url);
});
try { token=localStorage.getItem(KEY)||''; } catch {}
if (token) { refresh(); timer=setInterval(refresh,60000); }
