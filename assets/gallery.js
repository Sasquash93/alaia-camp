/* ============================================================
   ALAIA CAMP — gallery.js
   Galería filtrable + lightbox. Usa placeholders hasta que se
   carguen las fotos reales (basta con poner `src` en cada item).
   Renderiza en #gallery-grid / #gallery-filters. Cargar tras shell.js.
   ============================================================ */
(function(){
  'use strict';
  var grid=document.getElementById('gallery-grid'); if(!grid) return;
  var filters=document.getElementById('gallery-filters');
  function en(){return window.ALAIA_LANG==='en';}
  function refreshI18n(){ if(window.AlaiaI18n) window.AlaiaI18n.translate(window.ALAIA_LANG||'es'); }

  var CATS=[
    {k:'all',es:'Todo',en:'All'},
    {k:'aventura',es:'Aventura',en:'Adventure'},
    {k:'deportes',es:'Deportes',en:'Sports'},
    {k:'talleres',es:'Talleres',en:'Workshops'},
    {k:'nocturnos',es:'Nocturnos',en:'Night'},
    {k:'lugar',es:'Instalaciones',en:'Facilities'},
    {k:'amigos',es:'Amistades',en:'Friendships'}
  ];

  // src: null => placeholder. Para fotos reales: src:'images/gal/xxx.jpg'
  var ITEMS=[
    {c:'aventura', es:'Tirolesa sobre el cañón', en:'Zipline over the canyon', h:300},
    {c:'aventura', es:'Senderismo al amanecer', en:'Sunrise hike', h:210},
    {c:'deportes', es:'Clínica de futbol', en:'Football clinic', h:240},
    {c:'lugar', es:'Alberca climatizada', en:'Heated pool', h:200},
    {c:'talleres', es:'Taller de carpintería', en:'Carpentry workshop', h:280},
    {c:'nocturnos', es:'Fogata y tertulia', en:'Campfire & tertulia', h:230},
    {c:'amigos', es:'Equipo Sua', en:'Sua team', h:300},
    {c:'aventura', es:'Tiro con arco', en:'Archery', h:220},
    {c:'deportes', es:'Pádel al atardecer', en:'Padel at sunset', h:260},
    {c:'talleres', es:'Joyería y textil', en:'Jewelry & textile', h:200},
    {c:'nocturnos', es:'Rally nocturno', en:'Night rally', h:300},
    {c:'lugar', es:'Cabañas', en:'Cabins', h:210},
    {c:'amigos', es:'Amistades que perduran', en:'Lasting friendships', h:250},
    {c:'aventura', es:'Rappel', en:'Rappel', h:300},
    {c:'deportes', es:'Waterpolo', en:'Waterpolo', h:200},
    {c:'talleres', es:'Gastronomía', en:'Gastronomy', h:240},
    {c:'nocturnos', es:'Noche de estrellas', en:'Star night', h:220},
    {c:'lugar', es:'Comedor', en:'Dining hall', h:260},
    {c:'amigos', es:'La gran foto', en:'The big photo', h:200},
    {c:'aventura', es:'Bici de montaña', en:'Mountain bike', h:230},
    {c:'deportes', es:'Gaga ball', en:'Gaga ball', h:300},
    {c:'talleres', es:'Experimentos', en:'Experiments', h:210},
    {c:'nocturnos', es:'Teatro a la luz del fuego', en:'Firelight theater', h:250},
    {c:'amigos', es:'Despedida con abrazo', en:'Goodbye hug', h:230}
  ];
  var current='all', shown=[];

  function draw(cat){
    current=cat;
    shown = cat==='all' ? ITEMS.slice() : ITEMS.filter(function(i){return i.c===cat;});
    grid.innerHTML = shown.map(function(it,idx){
      var label = en()?it.en:it.es;
      var inner = it.src ? '<img src="'+it.src+'" alt="'+label+'">' : '<div class="ph" style="height:'+it.h+'px"><span>FOTO · '+(it.es.toUpperCase())+'</span></div>';
      return '<figure class="gal-item" data-i="'+idx+'">'+inner+'<figcaption class="gal-cap" data-en="'+it.en+'">'+it.es+'</figcaption></figure>';
    }).join('');
    refreshI18n();
  }

  if(filters){
    filters.innerHTML=CATS.map(function(c,i){return '<button class="'+(i===0?'on':'')+'" data-cat="'+c.k+'" data-en="'+c.en+'">'+c.es+'</button>';}).join('');
    filters.addEventListener('click',function(e){
      var b=e.target.closest('button'); if(!b) return;
      filters.querySelectorAll('button').forEach(function(x){x.classList.remove('on');}); b.classList.add('on');
      draw(b.getAttribute('data-cat'));
    });
  }

  // ---- lightbox ----
  var lb=document.createElement('div'); lb.className='lightbox'; lb.id='lightbox';
  lb.innerHTML='<button class="lb-close" id="lbClose" aria-label="Cerrar">×</button>'+
    '<button class="lb-nav lb-prev" id="lbPrev" aria-label="Anterior">‹</button>'+
    '<div class="lb-stage" id="lbStage"></div>'+
    '<button class="lb-nav lb-next" id="lbNext" aria-label="Siguiente">›</button>'+
    '<div class="lb-cap" id="lbCap"></div>';
  document.body.appendChild(lb);
  var pos=0;
  function openLb(i){ pos=i; paint(); lb.classList.add('open'); }
  function closeLb(){ lb.classList.remove('open'); }
  function paint(){
    var it=shown[pos]; if(!it) return;
    var label=en()?it.en:it.es;
    document.getElementById('lbStage').innerHTML = it.src ? '<img src="'+it.src+'" alt="'+label+'" style="width:min(80vw,1000px);height:auto;display:block">' : '<div class="ph"><span>FOTO · '+it.es.toUpperCase()+'</span></div>';
    document.getElementById('lbCap').textContent=label+'  ·  '+(pos+1)+'/'+shown.length;
  }
  function move(d){ pos=(pos+d+shown.length)%shown.length; paint(); }
  grid.addEventListener('click',function(e){ var f=e.target.closest('.gal-item'); if(f) openLb(parseInt(f.getAttribute('data-i'),10)); });
  document.getElementById('lbClose').addEventListener('click',closeLb);
  document.getElementById('lbPrev').addEventListener('click',function(){move(-1);});
  document.getElementById('lbNext').addEventListener('click',function(){move(1);});
  lb.addEventListener('click',function(e){ if(e.target===lb) closeLb(); });
  document.addEventListener('keydown',function(e){ if(!lb.classList.contains('open'))return; if(e.key==='Escape')closeLb(); if(e.key==='ArrowRight')move(1); if(e.key==='ArrowLeft')move(-1); });

  window.addEventListener('langchange',function(){ draw(current); });
  draw('all');
})();
