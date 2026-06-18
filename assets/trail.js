/* ============================================================
   ALAIA CAMP — trail.js
   · Hero: mapa cartográfico que se dibuja solo al cargar
   · Journey: ruta que continúa con el scroll, con waypoints
     sticky (con iconos) y cruces que muestran fotos en movimiento
   ============================================================ */
(function(){
  'use strict';

  /* ---------- Hero map: trigger draw-in ---------- */
  const hero=document.getElementById('hero');
  function startHero(){ if(hero) hero.classList.add('go'); }
  if(document.readyState!=='loading') setTimeout(startHero,120);
  else document.addEventListener('DOMContentLoaded',()=>setTimeout(startHero,120));

  /* ---------- Tabs explorer ---------- */
  const tabs=document.querySelectorAll('#tabsExplorer .tab');
  const panels=document.querySelectorAll('#tabsExplorer .tab-panel');
  tabs.forEach(t=>t.addEventListener('click',()=>{
    tabs.forEach(x=>x.classList.remove('on'));
    panels.forEach(p=>p.classList.remove('on'));
    t.classList.add('on');
    const p=document.getElementById(t.dataset.tab);
    if(p) p.classList.add('on');
  }));

  /* ---------- Reveal on scroll ---------- */
  const revealEls=[...document.querySelectorAll('.reveal')];
  function revealCheck(){
    const trigger=window.innerHeight*0.90;
    for(let i=revealEls.length-1;i>=0;i--){
      const el=revealEls[i];
      const r=el.getBoundingClientRect();
      if(r.top < trigger && r.bottom > 0){ el.classList.add('in'); revealEls.splice(i,1); }
    }
  }

  /* ============ THE EXPEDITION TRAIL ============ */
  const journey=document.getElementById('journey');
  const rail=document.getElementById('trailRail');
  const svg=document.getElementById('trailSvg');
  const planned=document.getElementById('trailPlanned');
  const traveled=document.getElementById('trailTraveled');
  const marker=document.getElementById('trailMarker');

  // ordered nodes: stations + crossings, by DOM order
  const nodes=[...journey.querySelectorAll('.station, .crossing')];
  const waypoints=[...journey.querySelectorAll('.waypoint')].map(w=>({
    el:w, station:w.closest('.station')
  }));
  const crossings=[...journey.querySelectorAll('.crossing')].map(c=>({
    el:c, track:c.querySelector('.crossing-track')
  }));

  const CX=96;                 // spine x over stations (matches sticky disc center)
  let totalLen=0, H=0, W=1000;

  function buildAnchors(){
    W=journey.clientWidth;
    const swingX=Math.min(W-130, W*0.72);
    const pts=[{x:W*0.5, y:0}];           // bridge from hero (exits bottom-center)
    nodes.forEach(node=>{
      const top=node.offsetTop, h=node.offsetHeight;
      if(node.classList.contains('crossing')){
        pts.push({x:CX, y:top+12});
        pts.push({x:swingX, y:top+h*0.5});   // line swings across the moving photos,
                                              // next station pulls it smoothly back to the spine
      } else {
        pts.push({x:CX, y:top+90});
      }
    });
    pts.push({x:CX, y:journey.offsetHeight});
    return pts;
  }

  // Catmull-Rom -> cubic bezier
  function smoothPath(pts){
    if(pts.length<2) return '';
    let d=`M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for(let i=0;i<pts.length-1;i++){
      const p0=pts[i-1]||pts[i], p1=pts[i], p2=pts[i+1], p3=pts[i+2]||p2;
      const c1x=p1.x+(p2.x-p0.x)/6*1, c1y=p1.y+(p2.y-p0.y)/6*1;
      const c2x=p2.x-(p3.x-p1.x)/6*1, c2y=p2.y-(p3.y-p1.y)/6*1;
      d+=` C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  }

  function rebuild(){
    if(!journey||!traveled) return;
    const jh=journey.offsetHeight; H=jh;
    const d=smoothPath(buildAnchors());
    planned.setAttribute('d',d);
    traveled.setAttribute('d',d);
    svg.setAttribute('viewBox',`0 0 ${W} ${jh}`);
    svg.setAttribute('width',W);
    svg.setAttribute('height',jh);
    rail.style.height=jh+'px';
    totalLen=traveled.getTotalLength();
    traveled.style.strokeDasharray=totalLen;
    traveled.style.strokeDashoffset=totalLen;
    try{ update(); }catch(e){}
    try{ revealCheck(); }catch(e){}
  }

  function update(){
    // crossings: move photo tracks with scroll
    const vh=window.innerHeight;
    crossings.forEach(c=>{
      if(!c.track) return;
      const r=c.el.getBoundingClientRect();
      const p=Math.max(0,Math.min(1,(vh - r.top)/(vh + r.height)));
      const overflow=Math.max(0, c.track.scrollWidth - c.el.clientWidth + 80);
      c.track.style.transform=`translateX(${(-p*overflow).toFixed(1)}px)`;
    });

    if(!totalLen || !isFinite(totalLen)) return;
    const jt=journey.getBoundingClientRect().top + window.scrollY;
    const focus=window.scrollY + window.innerHeight*0.5;
    const rel=focus - jt;
    const progress=Math.max(0,Math.min(1, rel / H));
    traveled.style.strokeDashoffset = totalLen*(1-progress);
    const pt=traveled.getPointAtLength(totalLen*progress);
    marker.style.transform=`translate(${pt.x}px, ${pt.y}px)`;
    marker.style.opacity = progress>0.003 && progress<0.997 ? '1':'0';

    // waypoints reached
    waypoints.forEach(w=>{
      if(!w.station) return;
      const on = rel >= w.station.offsetTop + 60;
      w.el.classList.toggle('reached',on);
    });
  }

  function onScroll(){
    try{ update(); }catch(e){}
    try{ revealCheck(); }catch(e){}
  }
  window.addEventListener('scroll',onScroll,{passive:true});

  let rt;
  function onResize(){ clearTimeout(rt); rt=setTimeout(rebuild,180); }
  window.addEventListener('resize',onResize);
  window.addEventListener('langchange',()=>setTimeout(rebuild,60));

  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(()=>setTimeout(rebuild,40)); }
  window.addEventListener('load',()=>setTimeout(rebuild,140));
  setTimeout(rebuild,220);
})();
