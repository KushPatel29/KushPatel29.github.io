import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../analytics/tracking.js',import.meta.url),'utf8');
function setup({dnt=false,blocked=false}={}){
  const events=[];let n=0;
  const window={navigator:{doNotTrack:dnt?'1':'0'},location:{pathname:'/'},crypto:{randomUUID:()=>`uuid-${++n}`},localStorage:{getItem:key=>{if(blocked)throw Error('blocked');return key==='analytics_consent'?'granted':key==='portfolio_session'?'{broken':null;},setItem:()=>{}},addEventListener:()=>{},dispatchEvent:event=>events.push(event.detail)};
  vm.runInNewContext(source,{window,document:{addEventListener:()=>{}},CustomEvent:class{constructor(name,options){this.detail=options.detail;}},Date,JSON,Set});
  return {api:window.portfolioAnalytics,events};
}
test('reference dispatcher refuses free-form PII and base-context overrides',()=>{
  const {api,events}=setup();assert.throws(()=>api.track('project_viewed',{email:'private@example.com'}),/Unregistered/);assert.throws(()=>api.track('project_viewed',{anonymous_user_id:'forged'}),/Unregistered/);assert.equal(events.length,0);
});
test('reference dispatcher respects privacy signals and unavailable storage',()=>{
  for(const config of [{dnt:true},{blocked:true}]){const {api,events}=setup(config);assert.equal(api.track('page_viewed'),false);assert.equal(events.length,0);}
});
test('registered safe properties survive corrupt stored session state',()=>{
  const {api,events}=setup();assert.equal(api.track('project_viewed',{project_id:'p-growthops'}),true);assert.equal(events[0].payload.project_id,'p-growthops');assert.equal(events[0].payload.consent_state,'granted');
});
