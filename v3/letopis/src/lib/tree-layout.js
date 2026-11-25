import {people} from '../data.js';

export const TREE={width:1280,height:816,pitch:160,top:26,photoWidth:84,photoHeight:104,nodeHeight:147};
export const treeRows=[
  [['petr',350],['maria',450],['ivan',890],['evdokia',990]],
  [['viktor',150],['nikolay',650],['anna',750],['zoya',1130]],
  [['aleksey',150],['sergey',500],['irina',600],['olga',850],['tatyana',1130]],
  [['maksim',150],['dmitry',450],['anya',650],['ekaterina',850]],
  [['misha',400],['kirill',500],['lev',650],['sonya',850]],
];
export const treePositions=Object.fromEntries(treeRows.flatMap((row,generation)=>row.map(([id,x])=>[id,{x,y:TREE.top+generation*TREE.pitch,generation}])));
export const couples=[['petr','maria'],['ivan','evdokia'],['nikolay','anna'],['sergey','irina']];
export const families=Object.values(Object.entries(people).reduce((groups,[child,person])=>{
  if(!person.parents?.length)return groups;
  const key=[...person.parents].sort().join(':');
  groups[key]??={parents:person.parents,children:[]};groups[key].children.push(child);return groups;
},{}));

export function treeEdges(){
  const out=[];
  couples.forEach(ids=>{
    const [a,b]=ids.map(id=>treePositions[id]);
    out.push({type:'couple',parents:ids,children:[],generation:a.generation,d:'M'+(a.x+42)+','+(a.y+52)+'H'+(b.x-42)});
  });
  families.forEach(({parents,children})=>{
    const points=parents.map(id=>treePositions[id]);
    const x=points.reduce((sum,p)=>sum+p.x,0)/points.length;
    const start=points[0].y+(points.length===2?52:TREE.nodeHeight);
    const generation=treePositions[children[0]].generation;
    const bar=treePositions[children[0]].y-10;
    out.push({type:'stem',parents,children,generation,d:'M'+x+','+start+'V'+bar});
    children.forEach(child=>{
      const p=treePositions[child],direction=Math.sign(p.x-x);
      const d=direction?'M'+x+','+bar+'H'+(p.x-direction*10)+'Q'+p.x+','+bar+' '+p.x+','+(bar+10)+'V'+p.y:'M'+x+','+bar+'V'+p.y;
      out.push({type:'branch',parents,children:[child],generation,d});
    });
  });
  return out;
}
export function lineage(id){
  const blood=new Set([id]);
  function ancestors(key){for(const parent of people[key]?.parents||[]){if(!blood.has(parent)){blood.add(parent);ancestors(parent);}}}
  function descendants(key){for(const [child,p] of Object.entries(people)){if(p.parents?.includes(key)&&!blood.has(child)){blood.add(child);descendants(child);}}}
  ancestors(id);descendants(id);
  const related=new Set(blood);
  for(const key of blood)if(people[key]?.spouse)related.add(people[key].spouse);
  return related;
}
