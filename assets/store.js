/* ============================================================
   ALAIA CAMP — store.js
   Catálogo + carrito (localStorage) + cajón + bundles "arma la
   maleta" + checkout demo (entrega en el campamento).
   Cargar después de shell.js.
   ============================================================ */
(function(){
  'use strict';
  var MXN = new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0});
  function money(n){ return MXN.format(n); }
  var APPAREL_SIZES = ['4','6','8','10','12','14','CH','M','G'];

  var CATALOG = [
    {id:'pl-clasica', cat:'ropa', name:'Playera clásica Alaia', en:'Alaia classic tee', price:250, sizes:APPAREL_SIZES, tag:'Best seller', desc:'Algodón premium, estampado 3D del sello de la orden.', den:'Premium cotton, 3D order-seal print.'},
    {id:'pl-expedicion', cat:'ropa', name:'Playera Expedición', en:'Expedition tee', price:270, sizes:APPAREL_SIZES, desc:'Mapa topográfico al frente, ruta de tesoro en la espalda.', den:'Topographic map front, treasure route on the back.'},
    {id:'sudadera', cat:'ropa', name:'Sudadera La Forja', en:'La Forja hoodie', price:690, sizes:APPAREL_SIZES, tag:'Top calidad', desc:'Felpa pesada, bordado 3D. La que se roban en casa.', den:'Heavy fleece, 3D embroidery. The one they steal at home.'},
    {id:'short', cat:'ropa', name:'Short deportivo', en:'Sport shorts', price:290, sizes:APPAREL_SIZES, desc:'Secado rápido para clínicas y nocturnos.', den:'Quick-dry for clinics and night games.'},
    {id:'gorra', cat:'accesorios', name:'Gorra bordada 3D', en:'3D embroidered cap', price:300, tag:'Favorita', desc:'Bordado 3D de altísima calidad. Nada catimado.', den:'Top-tier 3D embroidery. No cutting corners.'},
    {id:'bucket', cat:'accesorios', name:'Bucket hat', en:'Bucket hat', price:280, desc:'Para el sol de Malinalco, con cordón ajustable.', den:'For the Malinalco sun, with adjustable cord.'},
    {id:'termo', cat:'accesorios', name:'Termo 750 ml', en:'Tumbler 750 ml', price:320, tag:'Must have', desc:'Acero inoxidable, mantiene frío 24 h. Indispensable.', den:'Stainless steel, keeps cold 24h. Essential.'},
    {id:'botella', cat:'accesorios', name:'Botella deportiva', en:'Sport bottle', price:180, desc:'Ligera, a prueba de fugas, con nombre grabable.', den:'Light, leak-proof, name-engravable.'},
    {id:'morral', cat:'accesorios', name:'Morral de campa', en:'Camp tote', price:260, desc:'Lona resistente para cargar todo el día.', den:'Tough canvas for all-day carry.'},
    {id:'llavero', cat:'accesorios', name:'Llavero brújula', en:'Compass keychain', price:90, desc:'Brújula real con el sello de Alaia.', den:'Real compass with the Alaia seal.'},
    {id:'calcetas', cat:'ropa', name:'Calcetas (3 pares)', en:'Socks (3 pairs)', price:160, sizes:['CH','M','G'], desc:'Acolchadas, para senderismo y deporte.', den:'Cushioned, for hiking and sport.'},
    {id:'piyama', cat:'ropa', name:'Pants de campa', en:'Camp sweatpants', price:420, sizes:APPAREL_SIZES, desc:'Calientitos para las fogatas y tertulias de noche.', den:'Cozy for campfires and night tertulias.'}
  ];

  var BUNDLES = [
    {id:'kit-esencial', name:'Kit Esencial', en:'Essential Kit', tagline:'Lo indispensable.', ten:'The essentials.', price:690, was:830, hot:false,
      items:['1 playera clásica','1 gorra bordada 3D','1 termo 750 ml'], iten:['1 classic tee','1 3D cap','1 tumbler 750 ml']},
    {id:'maleta-3', name:'Maleta de 3 días', en:'3-day Suitcase', tagline:'Para que ensucie a gusto.', ten:'So they can get gloriously dirty.', price:1190, was:1450, hot:true,
      items:['3 playeras','1 short deportivo','1 gorra 3D','1 termo','1 llavero brújula'], iten:['3 tees','1 sport shorts','1 3D cap','1 tumbler','1 compass keychain']},
    {id:'maleta-completa', name:'Maleta Completa', en:'Full Suitcase', tagline:'Yo te preparo todo. No gastes más.', ten:'We pack it all. Spend nothing else.', price:2290, was:2980, hot:false,
      items:['5 playeras','2 shorts','1 sudadera La Forja','1 pants de campa','1 gorra + 1 bucket','1 termo + 1 botella','3 pares de calcetas','1 morral'], iten:['5 tees','2 shorts','1 hoodie','1 sweatpants','1 cap + 1 bucket','1 tumbler + 1 bottle','3 pairs of socks','1 tote']}
  ];
  window.ALAIA_CATALOG = CATALOG; window.ALAIA_BUNDLES = BUNDLES;

  // ---------- cart state ----------
  var KEY='alaia-cart';
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY))||[]; }catch(e){ return []; } }
  function save(c){ try{ localStorage.setItem(KEY, JSON.stringify(c)); }catch(e){} }
  var cart = load();
  var checkoutMode = false;

  function findProduct(id){
    var p = CATALOG.find(function(x){return x.id===id;});
    if(p) return {id:p.id, name:p.name, en:p.en, price:p.price};
    var b = BUNDLES.find(function(x){return x.id===id;});
    if(b) return {id:b.id, name:b.name, en:b.en, price:b.price, bundle:true};
    return null;
  }
  function keyOf(id,opt){ return id+'|'+(opt||''); }
  function count(){ return cart.reduce(function(s,i){return s+i.qty;},0); }
  function total(){ return cart.reduce(function(s,i){return s+i.price*i.qty;},0); }

  function add(id,opt,qty){
    qty=qty||1; var p=findProduct(id); if(!p) return;
    var k=keyOf(id,opt);
    var ex=cart.find(function(i){return i.key===k;});
    if(ex){ ex.qty+=qty; } else {
      cart.push({key:k,id:id,opt:opt||'',name:p.name,en:p.en,price:p.price,qty:qty,bundle:!!p.bundle});
    }
    save(cart); checkoutMode=false; updateBadge(); toast(window.ALAIA_LANG==='en'?'Added to cart':'Agregado al carrito'); if(window.AlaiaShell) window.AlaiaShell.openCart();
  }
  function setQty(k,q){ var i=cart.find(function(x){return x.key===k;}); if(!i)return; i.qty=Math.max(1,q); save(cart); updateBadge(); render(); }
  function remove(k){ cart=cart.filter(function(x){return x.key!==k;}); save(cart); updateBadge(); render(); }
  function clear(){ cart=[]; save(cart); updateBadge(); }

  function updateBadge(){
    var b=document.getElementById('cartBadge'); if(!b) return;
    var c=count(); b.textContent=c; b.classList.toggle('show', c>0);
  }

  // ---------- drawer render ----------
  function render(){
    var box=document.getElementById('cartItems'), foot=document.getElementById('cartFoot'); if(!box||!foot) return;
    var en = window.ALAIA_LANG==='en';
    if(checkoutMode){ renderCheckout(box,foot,en); refreshI18n(); return; }
    if(!cart.length){
      box.innerHTML='<div class="cart-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2 3h3l2.4 12.5a1.5 1.5 0 0 0 1.5 1.2h8.2a1.5 1.5 0 0 0 1.5-1.2L21.5 7H6"/></svg><p data-en="Your cart is empty.">Tu carrito está vacío.</p><a class="btn btn-ghost sm" href="tienda.html" style="margin-top:14px" data-en="Browse the shop">Ir a la tienda</a></div>';
      foot.innerHTML=''; refreshI18n(); return;
    }
    box.innerHTML = cart.map(function(i){
      var nm = en ? i.en : i.name;
      var opt = i.opt ? '<div class="ci-opt">'+(en?'Size':'Talla')+': '+i.opt+'</div>' : (i.bundle?'<div class="ci-opt" data-en="Bundle">Paquete</div>':'');
      return '<div class="cart-item">'+
        '<div class="thumb ph dark"><span style="font-size:9px">'+(nm.split(' ')[0])+'</span></div>'+
        '<div><div class="ci-name">'+nm+'</div>'+opt+
          '<div class="qty"><button data-q="-" data-k="'+i.key+'">−</button><span>'+i.qty+'</span><button data-q="+" data-k="'+i.key+'">+</button></div></div>'+
        '<div style="text-align:right"><div class="ci-price">'+money(i.price*i.qty)+'</div>'+
          '<button class="ci-remove" data-rm="'+i.key+'" data-en="remove">quitar</button></div>'+
      '</div>';
    }).join('');
    foot.innerHTML =
      '<div class="cart-total"><span data-en="Total">Total</span><span class="mono">'+money(total())+'</span></div>'+
      '<button class="btn btn-primary block" id="goCheckout" data-en="Checkout">Finalizar compra</button>'+
      '<p class="note" data-en="Merch is delivered at camp — no shipping fees.">El merch se entrega en el campamento, sin costo de envío.</p>';
    refreshI18n();
  }

  function renderCheckout(box,foot,en){
    box.innerHTML =
      '<button class="ci-remove" id="backToCart" style="margin-bottom:6px" data-en="← back to cart">← volver al carrito</button>'+
      '<div class="summary" style="box-shadow:none;padding:0;border:0">'+
        cart.map(function(i){var nm=en?i.en:i.name;return '<div class="line"><span>'+i.qty+'× '+nm+(i.opt?' ('+i.opt+')':'')+'</span><span>'+money(i.price*i.qty)+'</span></div>';}).join('')+
        '<div class="line total"><span data-en="Total">Total</span><span>'+money(total())+'</span></div>'+
      '</div>'+
      '<div class="form" style="margin-top:18px">'+
        '<div class="field"><label data-en="Parent name">Nombre del papá/mamá</label><input id="coName" placeholder="Nombre completo" data-en-ph="Full name"></div>'+
        '<div class="field"><label data-en="WhatsApp or email">WhatsApp o correo</label><input id="coContact" placeholder="Para confirmarte" data-en-ph="To confirm with you"></div>'+
        '<div class="field"><label data-en="Camper name (optional)">Nombre del camper (opcional)</label><input id="coCamper" placeholder="¿Para quién es?" data-en-ph="Who is it for?"></div>'+
      '</div>';
    foot.innerHTML =
      '<div class="cart-total"><span data-en="Total">Total</span><span class="mono">'+money(total())+'</span></div>'+
      '<button class="btn btn-primary block" id="placeOrder" data-en="Place order">Confirmar pedido</button>'+
      '<p class="note" data-en="Demo: no real charge. We deliver at camp and confirm by WhatsApp.">Demo: sin cargo real. Entregamos en el campamento y confirmamos por WhatsApp.</p>';
  }

  // ---------- store page render ----------
  function renderStore(){
    var grid=document.getElementById('product-grid'); if(!grid) return;
    var filters=document.getElementById('store-filters'), bundles=document.getElementById('bundle-grid');
    var cats=[{k:'all',es:'Todo',en:'All'},{k:'ropa',es:'Ropa',en:'Apparel'},{k:'accesorios',es:'Accesorios',en:'Accessories'}];
    if(filters){
      filters.innerHTML=cats.map(function(c,i){return '<button class="'+(i===0?'on':'')+'" data-cat="'+c.k+'" data-en="'+c.en+'">'+c.es+'</button>';}).join('');
    }
    drawProducts('all');
    if(bundles){
      bundles.innerHTML=BUNDLES.map(function(b){
        return '<div class="bundle'+(b.hot?' hot':'')+'"><div class="topo-mini"></div>'+
          '<div class="name" data-en="'+b.en+'">'+b.name+'</div>'+
          '<div class="tagline" data-en="'+b.ten+'">'+b.tagline+'</div>'+
          '<ul>'+b.items.map(function(it,ix){return '<li data-en="'+b.iten[ix]+'">'+it+'</li>';}).join('')+'</ul>'+
          '<div class="b-price"><span class="now">'+money(b.price)+'</span><span class="was">'+money(b.was)+'</span></div>'+
          '<button class="btn btn-primary block" data-add="'+b.id+'" data-en="Add suitcase">Agregar maleta</button>'+
        '</div>';
      }).join('');
    }
    refreshI18n();
  }
  function drawProducts(cat){
    var grid=document.getElementById('product-grid'); if(!grid) return;
    var list = cat==='all'?CATALOG:CATALOG.filter(function(p){return p.cat===cat;});
    grid.innerHTML=list.map(function(p){
      var sizes = p.sizes ? '<div class="opts" data-pid="'+p.id+'">'+p.sizes.map(function(s,i){return '<button class="'+(i===0?'on':'')+'" data-size="'+s+'">'+s+'</button>';}).join('')+'</div>' : '';
      return '<div class="product"><div class="thumb ph dark">'+(p.tag?'<span class="tag" data-en="'+(p.den?'':'')+'">'+p.tag+'</span>':'')+'<span>'+p.name+'</span></div>'+
        '<div class="body"><div class="cat" data-en="'+(p.cat==='ropa'?'Apparel':'Accessories')+'">'+(p.cat==='ropa'?'Ropa':'Accesorios')+'</div>'+
          '<h3 data-en="'+p.en+'">'+p.name+'</h3>'+
          '<p class="desc" data-en="'+p.den+'">'+p.desc+'</p>'+ sizes +
          '<div class="price-row"><span class="price">'+money(p.price)+'</span>'+
            '<button class="btn btn-dark sm" data-add="'+p.id+'" data-en="Add">Agregar</button></div>'+
        '</div></div>';
    }).join('');
    refreshI18n();
  }

  function refreshI18n(){ if(window.AlaiaI18n) window.AlaiaI18n.translate(window.ALAIA_LANG||'es'); }

  // ---------- toast ----------
  function toast(msg){
    var w=document.getElementById('toastWrap');
    if(!w){ w=document.createElement('div'); w.className='toast-wrap'; w.id='toastWrap'; document.body.appendChild(w); }
    var t=document.createElement('div'); t.className='toast';
    t.innerHTML='<span class="tic">✓</span>'+msg; w.appendChild(t);
    setTimeout(function(){ t.style.opacity='0'; t.style.transition='opacity .3s'; setTimeout(function(){t.remove();},300); },2200);
  }

  // ---------- events (delegation) ----------
  document.addEventListener('click',function(e){
    var t=e.target;
    // size pick
    var sz=t.closest('.opts button');
    if(sz){ sz.parentNode.querySelectorAll('button').forEach(function(b){b.classList.remove('on');}); sz.classList.add('on'); return; }
    // category filter
    var cf=t.closest('#store-filters button');
    if(cf){ document.querySelectorAll('#store-filters button').forEach(function(b){b.classList.remove('on');}); cf.classList.add('on'); drawProducts(cf.getAttribute('data-cat')); return; }
    // add to cart
    var ab=t.closest('[data-add]');
    if(ab){
      var id=ab.getAttribute('data-add');
      var opts=document.querySelector('.opts[data-pid="'+id+'"]');
      var size=''; if(opts){ var on=opts.querySelector('button.on'); size=on?on.getAttribute('data-size'):''; }
      add(id,size,1); return;
    }
    // qty +/- and remove inside drawer
    var q=t.closest('.qty button');
    if(q){ var k=q.getAttribute('data-k'); var it=cart.find(function(x){return x.key===k;}); if(it){ setQty(k, it.qty + (q.getAttribute('data-q')==='+'?1:-1)); } return; }
    var rm=t.closest('[data-rm]'); if(rm){ remove(rm.getAttribute('data-rm')); return; }
    // checkout flow
    if(t.closest('#goCheckout')){ checkoutMode=true; render(); return; }
    if(t.closest('#backToCart')){ checkoutMode=false; render(); return; }
    if(t.closest('#placeOrder')){
      var nm=document.getElementById('coName'), ct=document.getElementById('coContact');
      if(!nm.value.trim()||!ct.value.trim()){ [nm,ct].forEach(function(f){ if(!f.value.trim()) f.classList.add('input-err'); }); return; }
      placeOrder(); return;
    }
  });

  function placeOrder(){
    var order='ALA-'+Math.floor(100000+Math.random()*900000);
    clear(); checkoutMode=false;
    var box=document.getElementById('cartItems'), foot=document.getElementById('cartFoot');
    var en=window.ALAIA_LANG==='en';
    box.innerHTML='<div class="cart-empty"><div style="width:64px;height:64px;border-radius:50%;background:var(--moss);color:var(--cream);display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 16px">✓</div>'+
      '<p style="font-size:19px;color:var(--ink);font-weight:700" data-en="Order placed!">¡Pedido confirmado!</p>'+
      '<p style="margin-top:8px" data-en="We will confirm by WhatsApp. Pick it up at camp.">Te confirmamos por WhatsApp. Lo recoges en el campamento.</p>'+
      '<p class="mono" style="margin-top:14px;font-size:13px;color:var(--moss)">'+(en?'Order':'Pedido')+' '+order+'</p></div>';
    foot.innerHTML='<button class="btn btn-ghost block" onclick="AlaiaShell.closeCart()" data-en="Done">Listo</button>';
    refreshI18n();
  }

  // ---------- public + init ----------
  window.AlaiaCart={add:add,remove:remove,setQty:setQty,count:count,total:total,clear:clear,render:render,items:function(){return cart.slice();}};
  updateBadge();
  renderStore();
  window.addEventListener('langchange',function(){ render(); if(document.getElementById('product-grid')){ var on=document.querySelector('#store-filters button.on'); drawProducts(on?on.getAttribute('data-cat'):'all'); } });
})();
