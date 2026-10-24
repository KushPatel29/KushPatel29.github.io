import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../analytics/live-tracking.js',import.meta.url),'utf8');
function run({hidden=false,focus=true,idle=false,optOut=false,dnt=false,qa=false}={}){
  let t=0;const intervals=[],events=[];const handlers={};
  const area={id:'p-growthops',getBoundingClientRect:()=>({width:500,height:700,top:0,bottom:700}),matches:()=>true};
  const parent={...area,id:'work',matches:()=>false};
  const window={addEventListener:(n,fn)=>handlers[n]=fn};
  const document={referrer:'https://example.com/private-path?q=secret',visibilityState:hidden?'hidden':'visible',hasFocus:()=>focus,querySelectorAll:selector=>selector==='video'?[]:[parent,area],addEventListener:()=>{}};
  const context={window,document,navigator:{webdriver:false,doNotTrack:dnt?'1':'0'},location:{hostname:'kushpatel29.github.io',pathname:'/',search:qa?'?analytics_test=1':''},localStorage:{getItem:()=>optOut?'1':null},URL,URLSearchParams,Date:{now:()=>t},performance:{now:()=>t},innerHeight:800,setInterval:fn=>(intervals.push(fn),intervals.length),clearInterval:()=>{},setTimeout:()=>{}};
  vm.runInNewContext(source,context);
  if(window.goatcounter) window.goatcounter.count=event=>events.push(event);
  const tick=()=>{ t+=1000;intervals.forEach(fn=>fn()); };
  for(let i=0;i<(idle?90:31);i++)tick();
  return {events,window};
}
test('one foreground project receives each full 15-second block, without parent double counting',()=>{
  const {events,window}=run();assert.equal(events.length,2);assert(events.every(x=>x.path==='pi-time-15s:p-growthops' && x.no_session));assert.equal(window.goatcounter.referrer,'https://example.com');
});
test('background, unfocused and privacy opt-out visits contribute no attention',()=>{
  for(const settings of [{hidden:true},{focus:false},{optOut:true},{dnt:true}])assert.equal(run(settings).events.length,0);
});
test('idle attention stops at the 60-second cutoff',()=>assert.equal(run({idle:true}).events.length,4));
test('QA paths stay outside real metric namespaces and suppress automatic page counting',()=>{
  const {events,window}=run({qa:true});assert.equal(window.goatcounter.no_onload,true);assert(events.every(x=>x.path.startsWith('qa:')));
});
