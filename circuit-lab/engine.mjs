export const pins=['BAT.+','BAT.-','SL.COM','SL.A','SL.B','S1.COM','S1.NO','S1.NC','S2.COM','S2.NO','S2.NC','M1.A','M1.B','M2.A','M2.B'];
export function connect(wires,a,b){if(a===b||!pins.includes(a)||!pins.includes(b)||wires.some(w=>w.includes(a)&&w.includes(b)))return wires;return [...wires,[a,b]];}
export const examples={basic:[['BAT.+','SL.COM'],['SL.A','S1.COM'],['S1.NO','M1.A'],['M1.B','BAT.-']],advanced:[['BAT.+','SL.COM'],['SL.A','S2.COM'],['S2.NC','S1.COM'],['S1.NC','M1.A'],['S1.NO','M2.A'],['M1.B','BAT.-'],['M2.B','BAT.-']]};
export function solve(wires,state={slide:'A',s1:false,s2:false}){
 const parent=Object.fromEntries(pins.map(p=>[p,p]));const root=p=>parent[p]===p?p:parent[p]=root(parent[p]);
 const edges=[...wires.map(([a,b],i)=>({a,b,id:'w'+i})),{a:'SL.COM',b:'SL.'+state.slide,id:'SL'},{a:'S1.COM',b:'S1.'+(state.s1?'NO':'NC'),id:'S1'},{a:'S2.COM',b:'S2.'+(state.s2?'NO':'NC'),id:'S2'}];
 for(const {a,b} of edges)parent[root(a)]=root(b);
 const plus=root('BAT.+'),minus=root('BAT.-'),short=plus===minus;
 const groups=[...new Set(pins.map(root))],v=Object.fromEntries(groups.map(g=>[g,0]));
 const loads=['M1','M2'].map(id=>({id,a:root(id+'.A'),b:root(id+'.B')}));
 const adjacent=g=>loads.flatMap(l=>l.a===g?[l.b]:l.b===g?[l.a]:[]);
 const reachable=start=>{let s=new Set([start]),q=[start];for(const g of q)for(const n of adjacent(g))if(!s.has(n)){s.add(n);q.push(n);}return s;};
 const anchored=new Set([...reachable(plus),...reachable(minus)]);
 if(!short){v[plus]=3;const unknown=groups.filter(g=>g!==plus&&g!==minus&&anchored.has(g));const matrix=unknown.map(g=>{let row=unknown.map(()=>0),rhs=0;for(const l of loads){if(l.a===l.b)continue;let other=l.a===g?l.b:l.b===g?l.a:null;if(other===null)continue;row[unknown.indexOf(g)]++;let j=unknown.indexOf(other);if(j>=0)row[j]--;else rhs+=v[other];}return [...row,rhs];});
 for(let i=0;i<unknown.length;i++){let pivot=i;while(pivot<matrix.length&&Math.abs(matrix[pivot][i])<1e-9)pivot++;if(pivot===matrix.length)continue;[matrix[i],matrix[pivot]]=[matrix[pivot],matrix[i]];let d=matrix[i][i];matrix[i]=matrix[i].map(x=>x/d);for(let k=0;k<matrix.length;k++)if(k!==i){let f=matrix[k][i];matrix[k]=matrix[k].map((x,j)=>x-f*matrix[i][j]);}}
 unknown.forEach((g,i)=>v[g]=matrix[i][unknown.length]);}
 const motors=loads.map(l=>{const voltage=v[l.a]-v[l.b];return {id:l.id,voltage,direction:Math.abs(voltage)<1e-7?0:Math.sign(voltage),level:Math.abs(voltage)/3,bypass:l.a===l.b,floating:!anchored.has(l.a)&&!anchored.has(l.b)};});
 // Recover ideal-edge flow on a spanning tree. Loops may share current in reality;
 // highlight one valid equivalent path, never connect geometric crossings.
 const injection=Object.fromEntries(pins.map(p=>[p,0]));for(const m of motors){injection[m.id+'.A']-=m.voltage;injection[m.id+'.B']+=m.voltage;}
 injection['BAT.+']-=pins.filter(p=>root(p)===plus).reduce((s,p)=>s+injection[p],0);
 injection['BAT.-']-=pins.filter(p=>root(p)===minus).reduce((s,p)=>s+injection[p],0);
 const seen=new Set(),flow={};function visit(p,prev){seen.add(p);let sum=injection[p];for(const e of edges){let n=e.a===p?e.b:e.b===p?e.a:null;if(n===null||n===prev||seen.has(n))continue;let f=visit(n,p);flow[e.id]=e.a===p?-f:f;sum+=f;}return sum;}for(const p of pins)if(!seen.has(p))visit(p,null);
 return {short,motors,voltage:Object.fromEntries(pins.map(p=>[p,v[root(p)]])),flow,edges,contacts:edges.slice(wires.length),floating:groups.filter(g=>!anchored.has(g)).length};
}
