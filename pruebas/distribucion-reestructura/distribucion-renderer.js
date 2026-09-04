const NS='http://www.w3.org/2000/svg';
const SCALE=70;

const svg=(name,attrs={})=>{
  const node=document.createElementNS(NS,name);
  for(const [key,value] of Object.entries(attrs)) node.setAttribute(key,String(value));
  return node;
};

function seatPositions(table){
  const count=table.capacity;
  const points=[];
  if(table.shape==='round'){
    const r=Math.max(table.tabletop.widthM,table.tabletop.heightM)*SCALE/2+28;
    for(let i=0;i<count;i++){
      const a=-Math.PI/2+Math.PI*2*i/count;
      points.push({x:Math.cos(a)*r,y:Math.sin(a)*r});
    }
    return points;
  }
  const w=table.tabletop.widthM*SCALE;
  const h=table.tabletop.heightM*SCALE;
  const perimeter=2*(w+h);
  for(let i=0;i<count;i++){
    let d=(i/count)*perimeter;
    if(d<w) points.push({x:-w/2+d,y:-h/2-28});
    else if((d-=w)<h) points.push({x:w/2+28,y:-h/2+d});
    else if((d-=h)<w) points.push({x:w/2-d,y:h/2+28});
    else {d-=w;points.push({x:-w/2-28,y:h/2-d});}
  }
  return points;
}

export function render(state,{planner,itemsLayer}){
  itemsLayer.replaceChildren();
  for(const table of state.tables){
    const g=svg('g',{transform:`translate(${table.x} ${table.y}) rotate(${table.rotation})`,'data-table-id':table.id});
    const w=table.tabletop.widthM*SCALE;
    const h=table.tabletop.heightM*SCALE;
    const top=table.shape==='round'
      ? svg('circle',{r:w/2,fill:'#d9b978',class:'tabletop'})
      : svg('rect',{x:-w/2,y:-h/2,width:w,height:h,rx:table.shape==='square'?10:6,fill:'#d9b978',class:'tabletop'});
    g.appendChild(top);

    seatPositions(table).forEach((p,index)=>{
      const chair=svg('g',{transform:`translate(${p.x} ${p.y})`});
      chair.appendChild(svg('circle',{r:12,class:'chair'}));
      const text=svg('text',{x:0,y:4,'text-anchor':'middle','font-size':9,'font-weight':800});
      text.textContent=String(index+1);
      chair.appendChild(text);
      g.appendChild(chair);
    });
    itemsLayer.appendChild(g);
  }
  planner.style.transform=`scale(${state.viewport.zoom})`;
}
