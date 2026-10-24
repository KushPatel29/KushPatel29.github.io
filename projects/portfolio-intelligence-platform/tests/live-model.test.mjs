import {test} from 'node:test';
import assert from 'node:assert/strict';
import {modelHits,readAnalytics} from '../dist/live-model.js';
test('heartbeats convert to seconds while QA and unknown areas never inflate attention',()=>{
  const data=modelHits([{path:'/',count:8},{path:'pi-time-15s:intro',count:3,event:true},{path:'pi-time-15s:p-growthops',count:5,event:true},{path:'qa:pi-time-15s:intro',count:100,event:true},{path:'pi-time-15s:unregistered',count:100,event:true},{path:'pi-action:resume',count:2,event:true}]);
  assert.equal(data.engagedSeconds,120);assert.equal(data.attention[0].id,'p-growthops');assert.equal(data.pages[0].count,8);assert.equal(data.actions.resume,2);
});
test('malformed counts fail closed',()=>assert.throws(()=>modelHits([{path:'/',count:-1}]),/Invalid count/));
test('API paginates all paths, filters root geography and never places the key in a URL',async()=>{
  const calls=[];
  const fetcher=async(url,options)=>{
    calls.push(url);assert.equal(options.headers.Authorization,'Bearer fixture-secret');assert(!url.includes('fixture-secret'));
    const u=new URL(url);
    let body;
    if(u.pathname.endsWith('/hits')) body=u.searchParams.has('exclude_paths')?{hits:[{path:'pi-time-15s:intro',path_id:2,count:2,event:true}],more:false}:{hits:[{path:'/',path_id:1,count:4}],more:true};
    else if(u.pathname.endsWith('/total')){assert.equal(u.searchParams.get('include_paths'),'/');body={total:4,total_events:0,stats:[]};}
    else {assert.equal(u.searchParams.get('include_paths'),'/');body={stats:[{name:'Canada',count:4}],more:false};}
    return {ok:true,status:200,json:async()=>body};
  };
  const data=await readAnalytics('fixture-secret',7,fetcher,new Date('2026-10-24T12:30:00Z'));
  assert.equal(data.visits,4);assert.equal(data.engagedSeconds,30);assert.equal(calls.length,4);assert.equal(data.start,'2026-10-18T00:00:00.000Z');
});
test('authentication failure is explicit',async()=>{
  await assert.rejects(readAnalytics('invalid',1,async()=>({ok:false,status:403})),/Access denied/);
});
