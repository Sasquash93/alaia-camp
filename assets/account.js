/* ============================================================
   ALAIA CAMP — account.js  ·  "Camper Control" (prototipo)
   Login/registro de papás (demo), dashboard, alta de camper con
   ficha médica, selección de campamento + merch, pago demo,
   pulsera NFC y bandeja de notificaciones. Persiste en localStorage.
   Renderiza dentro de #cc-app. Cargar después de shell.js.
   ============================================================ */
(function(){
  'use strict';
  var root = document.getElementById('cc-app'); if(!root) return;
  var MXN=new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0});
  function money(n){return MXN.format(n);}
  function en(){return window.ALAIA_LANG==='en';}
  function refreshI18n(){ if(window.AlaiaI18n) window.AlaiaI18n.translate(window.ALAIA_LANG||'es'); }
  function esc(s){return (s||'').replace(/[<>&"]/g,function(c){return({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]);});}

  var TRIBUS=[
    {min:6,max:7,name:'Txori',es:'pájaros',enm:'birds',ic:'🐦'},
    {min:8,max:9,name:'Ibai',es:'ríos',enm:'rivers',ic:'🌊'},
    {min:10,max:11,name:'Haitz',es:'rocas',enm:'rocks',ic:'🪨'},
    {min:12,max:13,name:'Basoa',es:'bosque',enm:'forest',ic:'🌲'},
    {min:14,max:14,name:'Sua',es:'fuego',enm:'fire',ic:'🔥'},
    {min:15,max:16,name:'Izar',es:'estrellas',enm:'stars',ic:'⭐'},
    {min:17,max:17,name:'Gailur',es:'cumbre',enm:'summit',ic:'⛰️'}
  ];
  function tribuFor(age){ age=parseInt(age,10)||10; return TRIBUS.find(function(t){return age>=t.min&&age<=t.max;})||TRIBUS[2]; }

  var CAMPS=[
    {id:'verano-semana', es:'Verano · Semana completa', enm:'Summer · Full week', dates:'19–25 jul 2026', price:14900},
    {id:'verano-media',  es:'Verano · Media semana',    enm:'Summer · Half week',  dates:'19–22 jul 2026', price:8900}
  ];

  // ---------- persistence ----------
  function getSession(){ try{return JSON.parse(localStorage.getItem('alaia-session'));}catch(e){return null;} }
  function setSession(s){ try{localStorage.setItem('alaia-session',JSON.stringify(s));}catch(e){} }
  function getCampers(){ try{return JSON.parse(localStorage.getItem('alaia-campers'))||[];}catch(e){return[];} }
  function setCampers(c){ try{localStorage.setItem('alaia-campers',JSON.stringify(c));}catch(e){} }
  function getNotifs(){
    try{ var n=JSON.parse(localStorage.getItem('alaia-notifs')); if(n) return n; }catch(e){}
    var seed=[
      {ic:'📣',es_t:'Bienvenidos a Camper Control',en_t:'Welcome to Camper Control',es_b:'Aquí podrás inscribir a tus hijos, llenar su ficha médica, pagar y recibir avisos del campamento.',en_b:'Here you can enroll your kids, fill their medical form, pay and receive camp updates.',when:'Hoy'},
      {ic:'🌞',es_t:'Abierto el verano 2026',en_t:'Summer 2026 is open',es_b:'Del 19 al 25 de julio en Malinalco. Cupos limitados por tribu.',en_b:'July 19–25 in Malinalco. Limited spots per tribe.',when:'Hace 2 días'}
    ];
    setNotifs(seed); return seed;
  }
  function setNotifs(n){ try{localStorage.setItem('alaia-notifs',JSON.stringify(n));}catch(e){} }

  // ---------- state ----------
  var view='campers';
  var draft=null, step=0;

  // ---------- toast ----------
  function toast(msg){
    var w=document.getElementById('toastWrap');
    if(!w){w=document.createElement('div');w.className='toast-wrap';w.id='toastWrap';document.body.appendChild(w);}
    var t=document.createElement('div');t.className='toast';t.innerHTML='<span class="tic">✓</span>'+msg;w.appendChild(t);
    setTimeout(function(){t.style.opacity='0';t.style.transition='opacity .3s';setTimeout(function(){t.remove();},300);},2400);
  }

  // ========== render ==========
  function render(){ getSession()?renderApp():renderAuth(); refreshI18n(); }

  function renderAuth(){
    root.innerHTML=
      '<section class="cc-hero"><div class="topo"></div><div class="wrap">'+
        '<div class="crumbs"><a href="index.html" data-en="Home">Inicio</a><span class="sep">/</span><span>Camper Control</span></div>'+
        '<h1 class="disp"><span data-en="Camper Control">Camper Control</span> <em data-en="">Alaia</em></h1>'+
        '<p class="lead" data-en="One account to enroll your kids, keep their medical form, pay and stay informed — all in one place.">Una cuenta para inscribir a tus hijos, tener su ficha médica, pagar y mantenerte informado. Todo centralizado.</p>'+
      '</div></section>'+
      '<div class="wrap"><div class="auth-card">'+
        '<div class="auth-tabs"><button class="on" data-auth="login" data-en="Sign in">Entrar</button><button data-auth="reg" data-en="Create account">Crear cuenta</button></div>'+
        '<div class="auth-body" id="authBody"></div>'+
      '</div>'+
      '<p class="demo-note" style="margin:22px auto 70px"><span class="tag">demo</span> <span data-en="Prototype: any email and password work; your data stays only in this browser.">Prototipo: cualquier correo y contraseña funcionan; tus datos quedan solo en este navegador.</span></p>'+
      '</div>';
    authForm('login');
    root.querySelectorAll('[data-auth]').forEach(function(b){ b.addEventListener('click',function(){
      root.querySelectorAll('[data-auth]').forEach(function(x){x.classList.remove('on');}); b.classList.add('on'); authForm(b.getAttribute('data-auth'));
    });});
  }
  function authForm(kind){
    var box=document.getElementById('authBody');
    if(kind==='login'){
      box.innerHTML='<div class="form">'+
        '<div class="field"><label data-en="Email">Correo</label><input id="auEmail" type="email" placeholder="tu@correo.com"></div>'+
        '<div class="field"><label data-en="Password">Contraseña</label><input id="auPass" type="password" placeholder="••••••••"></div>'+
        '<button class="btn btn-primary block" id="auGo" data-en="Sign in">Entrar</button></div>';
    } else {
      box.innerHTML='<div class="form">'+
        '<div class="field"><label data-en="Your name">Tu nombre</label><input id="auName" placeholder="Nombre y apellido"></div>'+
        '<div class="field"><label data-en="Email">Correo</label><input id="auEmail" type="email" placeholder="tu@correo.com"></div>'+
        '<div class="field"><label data-en="Password">Contraseña</label><input id="auPass" type="password" placeholder="Mínimo 6 caracteres"></div>'+
        '<button class="btn btn-primary block" id="auGo" data-en="Create account">Crear cuenta</button></div>';
    }
    refreshI18n();
    document.getElementById('auGo').addEventListener('click',function(){
      var email=(document.getElementById('auEmail').value||'').trim();
      var name=kind==='reg'?(document.getElementById('auName').value||'').trim():email.split('@')[0];
      if(!email){ document.getElementById('auEmail').classList.add('input-err'); return; }
      setSession({email:email,name:name||'Familia'}); view='campers'; render();
      toast(en()?'Welcome!':'¡Bienvenido!');
    });
  }

  function renderApp(){
    var s=getSession(), campers=getCampers();
    var pend=campers.filter(function(c){return c.pago!=='paid';}).length;
    var nav=[
      {k:'campers',es:'Mis campers',en:'My campers'},
      {k:'inscripcion',es:'Inscripción',en:'Enroll'},
      {k:'pagos',es:'Pagos',en:'Payments',pip:pend||0},
      {k:'notificaciones',es:'Notificaciones',en:'Notifications'}
    ];
    root.innerHTML=
      '<section class="cc-hero"><div class="topo"></div><div class="wrap">'+
        '<div class="crumbs"><a href="index.html" data-en="Home">Inicio</a><span class="sep">/</span><span>Camper Control</span></div>'+
        '<h1 class="disp" style="font-size:clamp(28px,4vw,46px)">'+(en()?'Hi, ':'Hola, ')+esc(s.name)+' 👋</h1>'+
        '<p class="lead" data-en="Your family camp panel.">Tu panel familiar del campamento.</p>'+
        '<div class="cc-feat"><span>🧒 '+campers.length+' '+(en()?'campers':'campers')+'</span><span>🩺 '+(en()?'Medical forms':'Fichas médicas')+'</span><span>📿 '+(en()?'NFC wristband':'Pulsera NFC')+'</span><button class="cc-feat" style="cursor:pointer;background:oklch(0.62 0.16 35 / .5);border-color:transparent" id="logout" data-en="Sign out">Cerrar sesión</button></div>'+
      '</div></section>'+
      '<div class="wrap" style="padding-top:36px;padding-bottom:80px">'+
        '<div class="cc-nav" id="ccNav">'+nav.map(function(n){return '<button class="'+(view===n.k?'on':'')+'" data-view="'+n.k+'" data-en="'+n.en+'">'+n.es+(n.pip?' <span class="pip">'+n.pip+'</span>':'')+'</button>';}).join('')+
          '<a href="tienda.html" style="padding:11px 18px;border-radius:100px;font-weight:700;font-size:14px;color:var(--ink-soft)" data-en="Shop →">Tienda →</a></div>'+
        '<div id="cc-view"></div>'+
      '</div>';
    document.getElementById('logout').addEventListener('click',function(){ localStorage.removeItem('alaia-session'); render(); });
    document.getElementById('ccNav').querySelectorAll('[data-view]').forEach(function(b){ b.addEventListener('click',function(){ view=b.getAttribute('data-view'); if(view==='inscripcion'){startDraft();} renderView(); });});
    renderView();
  }

  function renderView(){
    var box=document.getElementById('cc-view'); if(!box) return;
    if(view==='campers') renderCampers(box);
    else if(view==='inscripcion') renderInscripcion(box);
    else if(view==='pagos') renderPagos(box);
    else if(view==='notificaciones') renderNotificaciones(box);
    refreshI18n();
  }

  // ----- campers -----
  function renderCampers(box){
    var campers=getCampers();
    var dash='<div class="dash-stats">'+
      '<div class="dash-stat"><div class="n">'+campers.length+'</div><p data-en="Registered campers">Campers registrados</p></div>'+
      '<div class="dash-stat"><div class="n">'+campers.filter(function(c){return c.ficha;}).length+'</div><p data-en="Medical forms done">Fichas médicas listas</p></div>'+
      '<div class="dash-stat"><div class="n">'+campers.filter(function(c){return c.pago==='paid';}).length+'</div><p data-en="Paid enrollments">Inscripciones pagadas</p></div>'+
      '<div class="dash-stat"><div class="n">'+campers.filter(function(c){return c.pago==='paid';}).length+'</div><p data-en="NFC wristbands ready">Pulseras NFC listas</p></div>'+
    '</div>';
    var grid;
    if(!campers.length){
      grid='<div class="empty-state"><svg class="em-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>'+
        '<p style="font-size:18px;color:var(--ink);font-weight:700" data-en="No campers yet">Aún no hay campers</p>'+
        '<p data-en="Enroll your first child to generate their medical form and NFC wristband.">Inscribe a tu primer hijo para generar su ficha médica y su pulsera NFC.</p>'+
        '<button class="btn btn-primary" style="margin-top:18px" data-go="inscripcion" data-en="Enroll a camper">Inscribir un camper</button></div>';
    } else {
      grid='<div class="camper-grid">'+campers.map(function(c){
        var t=tribuFor(c.edad);
        var st = c.pago==='paid'?'<span class="status paid" data-en="Paid">Pagado</span>':'<span class="status pend" data-en="Payment pending">Pago pendiente</span>';
        return '<div class="camper"><div class="top"><div class="avatar">'+esc((c.nombre||'?')[0]+(c.apellido||'')[0]||'')+'</div>'+
          '<div><b>'+esc(c.nombre)+' '+esc(c.apellido)+'</b><div class="sub">'+t.ic+' '+t.name+' · '+c.edad+' '+(en()?'yrs':'años')+'</div></div></div>'+
          '<div class="rows"><div class="r"><span data-en="Camp">Campamento</span><b>'+campLabel(c.campamento)+'</b></div>'+
          '<div class="r"><span data-en="Medical form">Ficha médica</span><span class="status ok" data-en="Complete">Completa</span></div>'+
          '<div class="r"><span data-en="Status">Estatus</span>'+st+'</div></div>'+
          (c.pago==='paid'?wristband(c):'<button class="btn btn-ghost sm block" data-pay="'+c.id+'" data-en="Complete payment">Completar pago</button>')+
        '</div>';
      }).join('')+
      '<button class="add-camper" data-go="inscripcion"><span class="plus">+</span><span data-en="Enroll another camper">Inscribir otro camper</span></button></div>';
    }
    box.innerHTML='<div class="dash-welcome"><h2 data-en="My campers">Mis campers</h2></div>'+dash+grid;
    box.querySelectorAll('[data-go]').forEach(function(b){b.addEventListener('click',function(){view=b.getAttribute('data-go');startDraft();renderView();document.getElementById('ccNav')&&syncNav();});});
    box.querySelectorAll('[data-pay]').forEach(function(b){b.addEventListener('click',function(){ payCamper(b.getAttribute('data-pay')); });});
  }
  function syncNav(){ document.querySelectorAll('#ccNav [data-view]').forEach(function(x){x.classList.toggle('on',x.getAttribute('data-view')===view);}); }
  function campLabel(id){ var c=CAMPS.find(function(x){return x.id===id;}); return c?(en()?c.enm:c.es):'—'; }
  function wristband(c){
    var t=tribuFor(c.edad);
    return '<div class="wristband" style="margin-top:4px"><div class="topo-mini"></div>'+
      '<svg class="nfc" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 8c4 3 4 5 0 8"/><path d="M10 6c6 4 6 8 0 12"/><path d="M14 4c8 5 8 11 0 16"/></svg>'+
      '<div class="wb-top"><span>ALAIA CAMP · '+t.name.toUpperCase()+'</span></div>'+
      '<div class="wb-name">'+esc(c.nombre)+' '+esc((c.apellido||'')[0]||'')+'.</div>'+
      '<div class="wb-meta">'+(en()?'Blood':'Sangre')+' '+esc(c.sangre||'—')+' · '+(c.alergias?(en()?'Allergies ⚠':'Alergias ⚠'):(en()?'No allergies':'Sin alergias'))+'</div>'+
      '<div class="barcode"></div><div class="barcode-n">'+esc(c.wristband)+'</div>'+
      '<div class="wb-meta" style="margin-top:8px;opacity:.7">'+(en()?'Tap for check-in / out & medication log':'Registro de entrada/salida y medicación por NFC')+'</div>'+
    '</div>';
  }

  // ----- inscripción (stepper) -----
  function startDraft(){ draft={nombre:'',apellido:'',edad:'',genero:'',escuela:'',talla:'',sangre:'',alergias:'',medicamentos:'',padecimientos:'',seguro:'',emergencia:'',emtel:'',publicidad:true,campamento:CAMPS[0].id,merch:0}; step=0; }
  var STEPS=[{es:'Datos',en:'Details'},{es:'Ficha médica',en:'Medical'},{es:'Campamento',en:'Camp'},{es:'Pago',en:'Payment'}];

  function renderInscripcion(box){
    if(!draft) startDraft();
    var head='<div class="dash-welcome"><h2 data-en="Enroll a camper">Inscribir un camper</h2></div>'+
      '<div class="steps">'+STEPS.map(function(s,i){return '<div class="step '+(i<step?'done':'')+(i===step?'active':'')+'"><div class="dot">'+(i<step?'✓':(i+1))+'</div><div class="lbl" data-en="'+s.en+'">'+s.es+'</div></div>';}).join('')+'</div>';
    var body=document.createElement('div'); body.className='stepper';
    body.innerHTML='<div class="panel" id="stepBody">'+stepHTML(step)+'</div>'+
      '<div class="step-actions">'+
        (step>0?'<button class="btn btn-ghost" id="stepBack" data-en="Back">Atrás</button>':'<span></span>')+
        (step<3?'<button class="btn btn-primary" id="stepNext" data-en="Continue">Continuar</button>':'<button class="btn btn-primary" id="stepPay" data-en="Pay & enroll">Pagar e inscribir</button>')+
      '</div>';
    box.innerHTML=head; box.appendChild(body);
    var back=document.getElementById('stepBack'); if(back) back.addEventListener('click',function(){ readStep(); step--; renderView(); });
    var next=document.getElementById('stepNext'); if(next) next.addEventListener('click',function(){ if(validStep()){ readStep(); step++; renderView(); } });
    var pay=document.getElementById('stepPay'); if(pay) pay.addEventListener('click',function(){ readStep(); finishEnroll(); });
    refreshI18n();
  }
  function stepHTML(n){
    if(n===0){
      return '<div class="form"><div class="form-row">'+
        '<div class="field"><label>'+L('First name','Nombre')+' <span class="req">*</span></label><input id="f_nombre" value="'+esc(draft.nombre)+'"></div>'+
        '<div class="field"><label>'+L('Last name','Apellidos')+' <span class="req">*</span></label><input id="f_apellido" value="'+esc(draft.apellido)+'"></div></div>'+
        '<div class="form-row thirds">'+
          '<div class="field"><label>'+L('Age','Edad')+' <span class="req">*</span></label><input id="f_edad" type="number" min="6" max="17" value="'+esc(draft.edad)+'"></div>'+
          '<div class="field"><label>'+L('Gender','Género')+'</label><select id="f_genero"><option value="">—</option><option '+sel(draft.genero,'Niña')+'>'+L('Girl','Niña')+'</option><option '+sel(draft.genero,'Niño')+'>'+L('Boy','Niño')+'</option><option '+sel(draft.genero,'Otro')+'>'+L('Other','Otro')+'</option></select></div>'+
          '<div class="field"><label>'+L('Tee size','Talla playera')+'</label><select id="f_talla"><option value="">—</option>'+['4','6','8','10','12','14','CH','M','G'].map(function(s){return '<option '+sel(draft.talla,s)+'>'+s+'</option>';}).join('')+'</select></div>'+
        '</div>'+
        '<div class="field"><label>'+L('School','Escuela')+'</label><input id="f_escuela" value="'+esc(draft.escuela)+'"></div>'+
        '<div id="tribuHint" style="margin-top:4px"></div></div>';
    }
    if(n===1){
      return '<div class="form"><div class="form-row">'+
        '<div class="field"><label>'+L('Blood type','Tipo de sangre')+'</label><select id="f_sangre"><option value="">—</option>'+['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(function(s){return '<option '+sel(draft.sangre,s)+'>'+s+'</option>';}).join('')+'</select></div>'+
        '<div class="field"><label>'+L('Insurance (optional)','Seguro (opcional)')+'</label><input id="f_seguro" value="'+esc(draft.seguro)+'"></div></div>'+
        '<div class="field"><label>'+L('Allergies','Alergias')+'</label><input id="f_alergias" value="'+esc(draft.alergias)+'" placeholder="'+L('e.g. penicillin, nuts...','ej. penicilina, nueces...')+'"><span class="help">'+L('Leave empty if none.','Déjalo vacío si no tiene.')+'</span></div>'+
        '<div class="field"><label>'+L('Medication & schedule','Medicamentos y horarios')+'</label><textarea id="f_medicamentos" placeholder="'+L('Medication, dose and time (we log it via the NFC wristband)','Medicamento, dosis y hora — lo registramos con la pulsera NFC')+'">'+esc(draft.medicamentos)+'</textarea></div>'+
        '<div class="field"><label>'+L('Medical conditions','Padecimientos')+'</label><textarea id="f_padecimientos" placeholder="'+L('Asthma, dietary needs, etc.','Asma, dieta especial, etc.')+'">'+esc(draft.padecimientos)+'</textarea></div>'+
        '<div class="form-row"><div class="field"><label>'+L('Emergency contact','Contacto de emergencia')+' <span class="req">*</span></label><input id="f_emergencia" value="'+esc(draft.emergencia)+'"></div>'+
        '<div class="field"><label>'+L('Emergency phone','Teléfono de emergencia')+' <span class="req">*</span></label><input id="f_emtel" value="'+esc(draft.emtel)+'"></div></div>'+
        '<label class="check"><input type="checkbox" id="f_publicidad" '+(draft.publicidad?'checked':'')+'><span>'+L('I authorize the use of photos/video for camp publicity.','Autorizo el uso de fotos/video para la publicidad del campamento.')+'</span></label></div>';
    }
    if(n===2){
      return '<div class="form"><label style="font-size:13px;font-weight:700;font-family:Space Mono;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-soft)">'+L('Choose the camp','Elige el campamento')+'</label>'+
        '<div class="radio-cards" id="campPick">'+CAMPS.map(function(c){return '<div class="rcard '+(draft.campamento===c.id?'on':'')+'" data-camp="'+c.id+'"><b>'+(en()?c.enm:c.es)+'</b><div class="meta">'+c.dates+' · Malinalco</div><div class="price">'+money(c.price)+'</div></div>';}).join('')+'</div>'+
        '<div class="panel" style="margin-top:6px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap"><div><b>'+L('Add a merch suitcase?','¿Agregar maleta de merch?')+'</b><div class="help" style="margin-top:4px">'+L('Tees, cap, tumbler... delivered at camp.','Playeras, gorra, termo... entregado en la campa.')+'</div></div>'+
          '<label class="check" style="align-items:center"><input type="checkbox" id="f_merch" '+(draft.merch?'checked':'')+'><span><b>'+L('3-day Suitcase','Maleta de 3 días')+' · '+money(1190)+'</b></span></label></div>'+
        '<p class="demo-note"><span class="tag">demo</span> '+L('You can also build a full kit in the Shop.','También puedes armar el kit completo en la Tienda.')+'</p></div>';
    }
    // step 3: pago
    var c=CAMPS.find(function(x){return x.id===draft.campamento;})||CAMPS[0];
    var merch=draft.merch?1190:0; var tot=c.price+merch;
    return '<div class="form"><div class="summary">'+
      '<div class="line"><span>'+(en()?c.enm:c.es)+' · '+c.dates+'</span><span>'+money(c.price)+'</span></div>'+
      (merch?'<div class="line"><span>'+L('3-day merch Suitcase','Maleta de merch (3 días)')+'</span><span>'+money(merch)+'</span></div>':'')+
      '<div class="line total"><span>Total</span><span>'+money(tot)+'</span></div></div>'+
      '<label style="font-size:13px;font-weight:700;font-family:Space Mono;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-soft);margin-top:6px">'+L('Payment method','Método de pago')+'</label>'+
      '<div class="radio-cards" id="payPick"><div class="rcard on" data-pm="tarjeta"><b>'+L('Card','Tarjeta')+'</b><div class="meta">Visa · Mastercard · Amex</div></div>'+
        '<div class="rcard" data-pm="transferencia"><b>'+L('Bank transfer','Transferencia')+'</b><div class="meta">SPEI</div></div>'+
        '<div class="rcard" data-pm="campa"><b>'+L('Cash at camp','Efectivo en campa')+'</b><div class="meta">'+L('Pay on arrival','Al llegar')+'</div></div></div>'+
      '<p class="demo-note"><span class="tag">demo</span> '+L('No real charge is made in this prototype.','En este prototipo no se hace ningún cargo real.')+'</p></div>';
  }
  function L(enT,esT){ return en()?enT:esT; }
  function sel(v,o){ return v===o?'selected':''; }

  function readStep(){
    function v(id){var e=document.getElementById(id);return e?e.value:undefined;}
    if(step===0){ draft.nombre=v('f_nombre')||''; draft.apellido=v('f_apellido')||''; draft.edad=v('f_edad')||''; draft.genero=v('f_genero')||''; draft.talla=v('f_talla')||''; draft.escuela=v('f_escuela')||''; }
    else if(step===1){ draft.sangre=v('f_sangre')||''; draft.seguro=v('f_seguro')||''; draft.alergias=v('f_alergias')||''; draft.medicamentos=v('f_medicamentos')||''; draft.padecimientos=v('f_padecimientos')||''; draft.emergencia=v('f_emergencia')||''; draft.emtel=v('f_emtel')||''; var p=document.getElementById('f_publicidad'); draft.publicidad=p?p.checked:true; }
    else if(step===2){ var m=document.getElementById('f_merch'); draft.merch=m&&m.checked?1190:0; }
  }
  function validStep(){
    var ok=true;
    if(step===0){ ['f_nombre','f_apellido','f_edad'].forEach(function(id){var e=document.getElementById(id); if(e&&!e.value.trim()){e.classList.add('input-err');ok=false;}}); }
    else if(step===1){ ['f_emergencia','f_emtel'].forEach(function(id){var e=document.getElementById(id); if(e&&!e.value.trim()){e.classList.add('input-err');ok=false;}}); }
    if(!ok) toast(en()?'Please fill the required fields':'Completa los campos obligatorios');
    return ok;
  }

  function finishEnroll(){
    var c=CAMPS.find(function(x){return x.id===draft.campamento;})||CAMPS[0];
    var camper={ id:'c'+Date.now(), nombre:draft.nombre, apellido:draft.apellido, edad:draft.edad, genero:draft.genero,
      talla:draft.talla, escuela:draft.escuela, sangre:draft.sangre, alergias:draft.alergias, medicamentos:draft.medicamentos,
      padecimientos:draft.padecimientos, seguro:draft.seguro, emergencia:draft.emergencia, emtel:draft.emtel, publicidad:draft.publicidad,
      campamento:draft.campamento, ficha:true, pago:'paid', merch:draft.merch,
      wristband:'AC-'+Math.floor(100000+Math.random()*900000) };
    var campers=getCampers(); campers.push(camper); setCampers(campers);
    // notificación
    var n=getNotifs(); n.unshift({ic:'🎟️',es_t:'Inscripción confirmada',en_t:'Enrollment confirmed',es_b:camper.nombre+' quedó inscrito en '+(en()?c.enm:c.es)+'. Su pulsera NFC '+camper.wristband+' está lista.',en_b:camper.nombre+' is enrolled in '+(en()?c.enm:c.es)+'. NFC wristband '+camper.wristband+' is ready.',when:'Ahora'}); setNotifs(n);
    draft=null; view='campers'; renderApp();
    toast(en()?'Camper enrolled! 🎉':'¡Camper inscrito! 🎉');
  }

  function payCamper(id){
    var campers=getCampers(); var c=campers.find(function(x){return x.id===id;}); if(!c) return;
    c.pago='paid'; setCampers(campers); renderView(); toast(en()?'Payment completed':'Pago completado');
  }

  // ----- pagos -----
  function renderPagos(box){
    var campers=getCampers();
    if(!campers.length){ box.innerHTML='<div class="empty-state"><p data-en="No charges yet. Enroll a camper first.">Aún no hay cargos. Inscribe a un camper primero.</p></div>'; return; }
    box.innerHTML='<div class="dash-welcome"><h2 data-en="Payments">Pagos</h2></div>'+
      '<div style="display:flex;flex-direction:column;gap:14px">'+campers.map(function(c){
        var camp=CAMPS.find(function(x){return x.id===c.campamento;})||CAMPS[0]; var tot=camp.price+(c.merch||0);
        var st=c.pago==='paid'?'<span class="status paid" data-en="Paid">Pagado</span>':'<span class="status pend" data-en="Pending">Pendiente</span>';
        return '<div class="panel" style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap">'+
          '<div><b style="font-size:17px">'+esc(c.nombre)+' '+esc(c.apellido)+'</b><div class="help" style="margin-top:4px">'+(en()?camp.enm:camp.es)+(c.merch?' + '+L('merch suitcase','maleta de merch'):'')+'</div></div>'+
          '<div style="display:flex;align-items:center;gap:16px"><div style="font-family:Bricolage Grotesque;font-weight:800;font-size:22px;color:var(--pine)">'+money(tot)+'</div>'+st+
          (c.pago!=='paid'?'<button class="btn btn-primary sm" data-pay="'+c.id+'" data-en="Pay now">Pagar ahora</button>':'')+'</div></div>';
      }).join('')+'</div>'+
      '<p class="demo-note" style="margin-top:24px"><span class="tag">demo</span> '+L('Real payments (Stripe/SPEI) can be wired here.','Aquí se puede conectar el cobro real (Stripe/SPEI).')+'</p>';
    box.querySelectorAll('[data-pay]').forEach(function(b){b.addEventListener('click',function(){payCamper(b.getAttribute('data-pay'));});});
  }

  // ----- notificaciones -----
  function renderNotificaciones(box){
    var n=getNotifs();
    box.innerHTML='<div class="dash-welcome"><h2 data-en="Notifications">Notificaciones</h2></div>'+
      '<div class="compose"><b data-en="Camp broadcast (demo)">Aviso del campamento (demo)</b><div class="help" style="margin:6px 0 12px">'+L('Simulate the message all parents receive (the camp can broadcast by email/app).','Simula el mensaje que reciben todos los papás (la campa puede avisar por correo/app).')+'</div>'+
        '<div class="form"><input id="ntext" placeholder="'+L('e.g. It rained but everyone is safe and warm ❤','ej. Llovió pero todos están bien y calientitos ❤')+'"><button class="btn btn-dark sm" id="nsend" data-en="Broadcast">Enviar a todos</button></div></div>'+
      '<div class="notif-list">'+n.map(function(x){return '<div class="notif"><div class="nic">'+x.ic+'</div><div class="nb"><b data-en="'+esc(x.en_t)+'">'+esc(x.es_t)+'</b><p data-en="'+esc(x.en_b)+'">'+esc(x.es_b)+'</p><div class="when">'+esc(x.when)+'</div></div></div>';}).join('')+'</div>';
    document.getElementById('nsend').addEventListener('click',function(){
      var i=document.getElementById('ntext'); var txt=(i.value||'').trim(); if(!txt) return;
      var list=getNotifs(); list.unshift({ic:'📣',es_t:'Aviso del campamento',en_t:'Camp update',es_b:txt,en_b:txt,when:'Ahora'}); setNotifs(list); renderView(); toast(en()?'Sent to all parents':'Enviado a todos los papás');
    });
  }

  // live tribu hint on age input
  document.addEventListener('input',function(e){
    if(e.target&&e.target.id==='f_edad'){
      var h=document.getElementById('tribuHint'); if(!h) return; var t=tribuFor(e.target.value);
      h.innerHTML=e.target.value?'<span class="tagchip">'+t.ic+' '+L('Tribe','Tribu')+': <b style="color:var(--coral);margin-left:4px">'+t.name+'</b> ('+t.min+(t.max!==t.min?'–'+t.max:'')+' '+L('yrs','años')+')</span>':'';
    }
  });
  document.addEventListener('click',function(e){
    var rc=e.target.closest('#campPick .rcard'); if(rc){ document.querySelectorAll('#campPick .rcard').forEach(function(x){x.classList.remove('on');}); rc.classList.add('on'); draft.campamento=rc.getAttribute('data-camp'); }
    var pm=e.target.closest('#payPick .rcard'); if(pm){ document.querySelectorAll('#payPick .rcard').forEach(function(x){x.classList.remove('on');}); pm.classList.add('on'); }
  });

  window.addEventListener('langchange',function(){ if(document.getElementById('cc-app')) render(); });
  render();
})();
