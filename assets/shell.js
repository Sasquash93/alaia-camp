/* ============================================================
   ALAIA CAMP — shell.js
   Inyecta nav + menú móvil + cajón de carrito + footer en todas
   las páginas para mantener consistencia. Maneja nav-on-scroll,
   menú móvil y apertura/cierre del carrito.
   Cargar ANTES de store.js / account.js, y i18n.js de ÚLTIMO.
   ============================================================ */
/* ---- AlaiaAPI: cliente del backend (mismo origen) ----
   Si el backend no está disponible (p.ej. en GitHub Pages), available()
   devuelve false y los módulos caen a modo demo (localStorage). */
window.AlaiaAPI = (function(){
  var _avail = null;
  function tk(admin){ try{ return localStorage.getItem(admin?'alaia-admin-token':'alaia-token'); }catch(e){ return null; } }
  async function req(method, path, body, opts){
    opts = opts || {}; var headers = {}; var t = tk(opts.admin);
    if(t) headers['Authorization'] = 'Bearer ' + t;
    var payload;
    if(body instanceof FormData) payload = body;
    else if(body !== undefined){ headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
    var r = await fetch('/api' + path, { method: method, headers: headers, body: payload });
    var ct = r.headers.get('content-type') || '';
    var data = ct.indexOf('json') >= 0 ? await r.json() : await r.text();
    if(!r.ok) throw new Error((data && data.error) || ('HTTP ' + r.status));
    return data;
  }
  return {
    available: async function(){ if(_avail !== null) return _avail; try{ var r = await fetch('/api/health', { cache: 'no-store' }); _avail = r.ok; }catch(e){ _avail = false; } return _avail; },
    get: function(p,o){ return req('GET',p,undefined,o); },
    post: function(p,b,o){ return req('POST',p,b,o); },
    put: function(p,b,o){ return req('PUT',p,b,o); },
    del: function(p,o){ return req('DELETE',p,undefined,o); },
    setToken: function(t){ try{ localStorage.setItem('alaia-token',t); }catch(e){} },
    clearToken: function(){ try{ localStorage.removeItem('alaia-token'); }catch(e){} },
    token: function(){ return tk(false); }
  };
})();

(function(){
  'use strict';
  if(document.getElementById('nav')) return; // home aún con nav propio: no duplicar

  var path = location.pathname.split('/').pop() || 'index.html';
  var LINKS = [
    {href:'index.html',        es:'Inicio',     en:'Home'},
    {href:'nosotros.html',     es:'Nosotros',   en:'About'},
    {href:'galeria.html',      es:'Galería',    en:'Gallery'},
    {href:'tienda.html',       es:'Tienda',     en:'Shop'},
    {href:'tertulias.html',    es:'Tertulias',  en:'Tertulias'},
    {href:'precios.html',      es:'Precios',    en:'Pricing'}
  ];
  function active(href){
    if((path===''||path==='index.html') && href==='index.html') return ' style="opacity:1;font-weight:700;color:var(--coral)"';
    return path===href ? ' style="opacity:1;font-weight:700;color:var(--coral)"' : '';
  }
  var linksHTML = LINKS.map(function(l){
    return '<a href="'+l.href+'"'+active(l.href)+' data-en="'+l.en+'">'+l.es+'</a>';
  }).join('');

  var nav = document.createElement('nav');
  nav.className='nav'; nav.id='nav';
  nav.innerHTML =
    '<a class="brand" href="index.html"><b>ALAIA</b><i>CAMP</i></a>'+
    '<div class="links">'+linksHTML+'</div>'+
    '<div class="nav-right">'+
      '<div class="lang" id="lang"><button data-lang="es" class="on">ES</button><button data-lang="en">EN</button></div>'+
      '<button class="cart-btn" id="cartBtn" aria-label="Carrito">'+
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.4 12.5a1.5 1.5 0 0 0 1.5 1.2h8.2a1.5 1.5 0 0 0 1.5-1.2L21.5 7H6"/></svg>'+
        '<span class="cart-badge" id="cartBadge">0</span>'+
      '</button>'+
      '<a class="nav-cta" href="inscripciones.html" data-en="Enroll">Inscríbete</a>'+
      '<button class="burger" id="burger" aria-label="Menú"><span></span><span></span><span></span></button>'+
    '</div>';
  document.body.insertBefore(nav, document.body.firstChild);

  var menu = document.createElement('div');
  menu.className='mobile-menu'; menu.id='mobileMenu';
  menu.innerHTML =
    '<button class="close" id="closeMenu" aria-label="Cerrar">×</button>'+
    LINKS.map(function(l){return '<a href="'+l.href+'" data-en="'+l.en+'">'+l.es+'</a>';}).join('')+
    '<a href="inscripciones.html" data-en="Enroll">Inscríbete</a>';
  document.body.insertBefore(menu, nav.nextSibling);

  // cart drawer
  var dr = document.createElement('div');
  dr.innerHTML =
    '<div class="cart-backdrop" id="cartBackdrop"></div>'+
    '<aside class="cart-drawer" id="cartDrawer" aria-label="Carrito">'+
      '<div class="cart-head"><h3 data-en="Your cart">Tu carrito</h3><button class="x" id="cartClose" aria-label="Cerrar">×</button></div>'+
      '<div class="cart-items" id="cartItems"></div>'+
      '<div class="cart-foot" id="cartFoot"></div>'+
    '</aside>';
  while(dr.firstChild) document.body.appendChild(dr.firstChild);

  // footer
  var footer = document.createElement('footer');
  footer.innerHTML =
    '<div class="wrap">'+
      '<div>'+
        '<div class="brand"><b>ALAIA</b><i>CAMP</i></div>'+
        '<p style="margin-top:14px;max-width:30ch;font-size:14.5px" data-en="Adventure summer camp in Malinalco. July 19–25, 2026.">Campamento de verano de aventura en Malinalco. 19 al 25 de julio de 2026.</p>'+
      '</div>'+
      '<div class="cols">'+
        '<div><h5 data-en="Explore">Explora</h5>'+
          '<a href="nosotros.html" data-en="About us">Nosotros</a>'+
          '<a href="galeria.html" data-en="Gallery">Galería</a>'+
          '<a href="index.html#actividades" data-en="Activities">Actividades</a>'+
          '<a href="instalaciones.html" data-en="Facilities">Instalaciones</a>'+
        '</div>'+
        '<div><h5 data-en="Camp">Campamento</h5>'+
          '<a href="inscripciones.html" data-en="Enroll">Inscríbete</a>'+
          '<a href="tienda.html" data-en="Shop">Tienda</a>'+
          '<a href="precios.html" data-en="Pricing">Precios</a>'+
          '<a href="tertulias.html">Tertulias</a>'+
        '</div>'+
        '<div><h5 data-en="Contact">Contacto</h5>'+
          '<a href="https://instagram.com/alaiacamp" target="_blank" rel="noopener">@alaiacamp</a>'+
          '<a href="tel:5585699850">55 8569 9850</a>'+
          '<a href="#" data-en="Malinalco, State of México">Malinalco, Edo. de México</a>'+
        '</div>'+
      '</div>'+
      '<div class="legal">'+
        '<span>© 2026 Alaia Camp · <span data-en="All rights reserved.">Todos los derechos reservados.</span></span>'+
        '<span data-en="Carr. a Joquicingo, C.P. 52443 · Malinalco, Edo. Méx.">Carr. a Joquicingo, C.P. 52443 · Malinalco, Edo. Méx.</span>'+
      '</div>'+
    '</div>';
  document.body.appendChild(footer);

  // ---- behavior ----
  function navState(){ nav.classList.toggle('solid', window.scrollY > 40); }
  navState();
  window.addEventListener('scroll', navState, {passive:true});

  var burger=document.getElementById('burger'), closeMenu=document.getElementById('closeMenu');
  burger.addEventListener('click',function(){menu.classList.add('open');});
  closeMenu.addEventListener('click',function(){menu.classList.remove('open');});
  menu.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){menu.classList.remove('open');});});

  var backdrop=document.getElementById('cartBackdrop'),
      drawer=document.getElementById('cartDrawer'),
      cartClose=document.getElementById('cartClose'),
      cartBtn=document.getElementById('cartBtn');
  function openCart(){ if(window.AlaiaCart) window.AlaiaCart.render(); drawer.classList.add('open'); backdrop.classList.add('open'); }
  function closeCart(){ drawer.classList.remove('open'); backdrop.classList.remove('open'); }
  cartBtn.addEventListener('click',openCart);
  cartClose.addEventListener('click',closeCart);
  backdrop.addEventListener('click',closeCart);
  window.AlaiaShell={openCart:openCart,closeCart:closeCart};

  // re-aplicar idioma si i18n ya corrió
  if(window.AlaiaI18n) window.AlaiaI18n.apply(window.ALAIA_LANG||'es');
})();
