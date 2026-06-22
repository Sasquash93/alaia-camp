/* ============================================================
   Alaia Camp — Panel de administrador
   Login de admin + CRUD de productos (con foto), inscripciones/
   fichas médicas, pedidos, campamentos y avisos. Habla con la API.
   ============================================================ */
(function(){
  'use strict';
  var root=document.getElementById('admin-app');
  var MXN=new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0});
  var money=function(n){return MXN.format(n||0);};
  function esc(s){return (s==null?'':String(s)).replace(/[<>&"]/g,function(c){return({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]);});}
  var TK='alaia-admin-token';
  var tab='productos', cache={};

  async function api(method, path, body, isForm){
    var headers={}; var t=localStorage.getItem(TK); if(t) headers.Authorization='Bearer '+t;
    var payload;
    if(isForm) payload=body; else if(body!==undefined){ headers['Content-Type']='application/json'; payload=JSON.stringify(body); }
    var r=await fetch('/api'+path,{method:method,headers:headers,body:payload});
    var d={}; try{ d=await r.json(); }catch(e){}
    if(!r.ok) throw new Error(d.error||('HTTP '+r.status));
    return d;
  }
  function toast(msg){
    var w=document.getElementById('toastWrap'); if(!w){w=document.createElement('div');w.className='toast-wrap';w.id='toastWrap';document.body.appendChild(w);}
    var t=document.createElement('div'); t.className='toast'; t.innerHTML='<span class="tic">✓</span>'+esc(msg); w.appendChild(t);
    setTimeout(function(){t.style.opacity='0';t.style.transition='opacity .3s';setTimeout(function(){t.remove();},300);},2200);
  }

  // ---------- boot ----------
  async function boot(){
    var t=localStorage.getItem(TK);
    if(t){ try{ var me=await api('GET','/auth/me'); if(me.user&&me.user.role==='admin'){ return shell(); } }catch(e){} localStorage.removeItem(TK); }
    login();
  }

  function login(err){
    root.innerHTML='<div class="login-card"><div class="brand" style="display:flex;align-items:baseline;gap:8px;margin-bottom:18px"><b style="font-family:Bricolage Grotesque;font-weight:800;font-size:24px">ALAIA</b><i style="font-style:normal;font-family:Space Mono;font-size:10px;letter-spacing:.3em;opacity:.7">CAMP</i><span style="font-family:Space Mono;font-size:10px;background:var(--coral);color:var(--cream);padding:3px 8px;border-radius:6px;letter-spacing:.1em">ADMIN</span></div>'+
      '<h1>Panel de control</h1><p style="color:var(--ink-soft);margin-bottom:20px">Entra para gestionar productos, inscripciones y avisos.</p>'+
      '<div class="form">'+
        '<div class="field"><label>Correo</label><input id="aEmail" type="email" placeholder="admin@alaiacamp.mx"></div>'+
        '<div class="field"><label>Contraseña</label><input id="aPass" type="password" placeholder="••••••••"></div>'+
        (err?'<p class="err">'+esc(err)+'</p>':'')+
        '<button class="btn btn-primary block" id="aGo">Entrar</button>'+
      '</div></div>';
    document.getElementById('aGo').addEventListener('click',doLogin);
    document.getElementById('aPass').addEventListener('keydown',function(e){if(e.key==='Enter')doLogin();});
  }
  async function doLogin(){
    var email=document.getElementById('aEmail').value.trim(), pass=document.getElementById('aPass').value;
    try{
      var r=await api('POST','/auth/login',{email:email,password:pass});
      if(r.user.role!=='admin'){ return login('Esa cuenta no es de administrador.'); }
      localStorage.setItem(TK,r.token); shell();
    }catch(e){ login(e.message); }
  }

  // ---------- shell ----------
  async function shell(){
    var stats={}; try{ stats=await api('GET','/admin/stats'); }catch(e){}
    var tabs=[['productos','Productos'],['inscripciones','Inscripciones'],['pedidos','Pedidos'],['campamentos','Campamentos'],['avisos','Avisos']];
    root.innerHTML=
      '<div class="adm-top"><div class="brand"><b>ALAIA</b><i>CAMP</i><span class="pill">ADMIN</span></div>'+
        '<div style="display:flex;gap:10px;align-items:center"><a href="index.html" target="_blank" style="color:oklch(1 0 0 / .8);font-size:13px">Ver sitio ↗</a><button class="btn btn-ghost sm" id="aOut" style="border-color:oklch(1 0 0 / .3);color:var(--cream)">Salir</button></div></div>'+
      '<div class="adm-wrap">'+
        '<div class="dash-stats" style="margin-bottom:8px">'+
          stat(stats.products,'Productos')+stat(stats.parents,'Cuentas de papás')+stat(stats.campers,'Campers inscritos')+stat(stats.paid,'Pagados')+stat(stats.orders,'Pedidos de tienda')+
        '</div>'+
        '<div class="adm-tabs">'+tabs.map(function(t){return '<button data-tab="'+t[0]+'" class="'+(tab===t[0]?'on':'')+'">'+t[1]+'</button>';}).join('')+'</div>'+
        '<div id="adm-view"></div>'+
      '</div>'+
      '<div class="modal-bg" id="modalBg"><div class="modal" id="modal"></div></div>';
    document.getElementById('aOut').addEventListener('click',function(){localStorage.removeItem(TK);login();});
    root.querySelectorAll('[data-tab]').forEach(function(b){b.addEventListener('click',function(){tab=b.getAttribute('data-tab');shell();});});
    document.getElementById('modalBg').addEventListener('click',function(e){if(e.target.id==='modalBg')closeModal();});
    view();
  }
  function stat(n,label){ return '<div class="dash-stat"><div class="n">'+(n||0)+'</div><p>'+label+'</p></div>'; }

  function closeModal(){ document.getElementById('modalBg').classList.remove('open'); }
  function openModal(html){ document.getElementById('modal').innerHTML=html; document.getElementById('modalBg').classList.add('open'); }

  async function view(){
    var box=document.getElementById('adm-view'); box.innerHTML='<p style="color:var(--ink-soft)">Cargando…</p>';
    try{
      if(tab==='productos') return prods(box);
      if(tab==='inscripciones') return inscr(box);
      if(tab==='pedidos') return pedidos(box);
      if(tab==='campamentos') return camps(box);
      if(tab==='avisos') return avisos(box);
    }catch(e){ box.innerHTML='<p class="err">'+esc(e.message)+'</p>'; }
  }

  // ---------- productos ----------
  async function prods(box){
    var list=await api('GET','/products'); cache.products=list;
    box.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px"><h2 style="font-size:24px">Productos ('+list.length+')</h2><button class="btn btn-primary" id="newProd">+ Nuevo producto</button></div>'+
      '<div class="adm-grid">'+list.map(function(p){
        return '<div class="adm-card"><div class="thumb">'+(p.image?'<img src="'+esc(p.image)+'" alt="">':'<div class="noimg">SIN FOTO<br>'+esc(p.name)+'</div>')+'</div>'+
          '<div class="b"><div class="cat">'+esc(p.cat)+(p.active===false?' · oculto':'')+'</div><h4>'+esc(p.name)+'</h4><div class="pr">'+money(p.price)+'</div></div>'+
          '<div class="acts"><button class="btn btn-ghost sm" data-edit="'+p._id+'">Editar</button><button class="btn btn-ghost sm" data-del="'+p._id+'" style="color:var(--coral-deep)">Eliminar</button></div></div>';
      }).join('')+'</div>';
    document.getElementById('newProd').addEventListener('click',function(){prodForm(null);});
    box.querySelectorAll('[data-edit]').forEach(function(b){b.addEventListener('click',function(){prodForm(list.find(function(x){return x._id===b.getAttribute('data-edit');}));});});
    box.querySelectorAll('[data-del]').forEach(function(b){b.addEventListener('click',async function(){
      if(!confirm('¿Eliminar este producto?'))return;
      try{ await api('DELETE','/products/'+b.getAttribute('data-del')); toast('Producto eliminado'); view(); }catch(e){alert(e.message);}
    });});
  }
  function prodForm(p){
    var e=p||{};
    openModal('<h3 style="font-size:22px;margin-bottom:16px">'+(p?'Editar producto':'Nuevo producto')+'</h3>'+
      '<div class="form">'+
        '<div class="form-row"><div class="field"><label>Nombre (ES) <span class="req">*</span></label><input id="pf_name" value="'+esc(e.name)+'"></div>'+
        '<div class="field"><label>Nombre (EN)</label><input id="pf_en" value="'+esc(e.en)+'"></div></div>'+
        '<div class="form-row"><div class="field"><label>Categoría</label><select id="pf_cat"><option value="ropa"'+(e.cat==='ropa'?' selected':'')+'>Ropa</option><option value="accesorios"'+(e.cat!=='ropa'?' selected':'')+'>Accesorios</option></select></div>'+
        '<div class="field"><label>Precio (MXN) <span class="req">*</span></label><input id="pf_price" type="number" value="'+esc(e.price)+'"></div></div>'+
        '<div class="form-row"><div class="field"><label>Tallas (separadas por coma)</label><input id="pf_sizes" value="'+esc((e.sizes||[]).join(', '))+'" placeholder="CH, M, G"></div>'+
        '<div class="field"><label>Etiqueta</label><input id="pf_tag" value="'+esc(e.tag)+'" placeholder="Best seller"></div></div>'+
        '<div class="field"><label>Descripción (ES)</label><textarea id="pf_desc">'+esc(e.desc)+'</textarea></div>'+
        '<div class="field"><label>Descripción (EN)</label><textarea id="pf_den">'+esc(e.den)+'</textarea></div>'+
        '<div class="field"><label>Foto</label><input id="pf_img" type="file" accept="image/*">'+(e.image?'<span class="help">Hay una foto cargada. Sube otra para reemplazarla.</span>':'')+'</div>'+
        '<label class="check"><input type="checkbox" id="pf_active" '+(e.active!==false?'checked':'')+'><span>Visible en la tienda</span></label>'+
        '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:6px"><button class="btn btn-ghost" id="pf_cancel">Cancelar</button><button class="btn btn-primary" id="pf_save">Guardar</button></div>'+
      '</div>');
    document.getElementById('pf_cancel').addEventListener('click',closeModal);
    document.getElementById('pf_save').addEventListener('click',async function(){
      var fd=new FormData();
      fd.append('name',val('pf_name')); fd.append('en',val('pf_en')); fd.append('cat',val('pf_cat'));
      fd.append('price',val('pf_price')); fd.append('sizes',val('pf_sizes')); fd.append('tag',val('pf_tag'));
      fd.append('desc',val('pf_desc')); fd.append('den',val('pf_den')); fd.append('active', document.getElementById('pf_active').checked?'true':'false');
      var f=document.getElementById('pf_img'); if(f.files[0]) fd.append('image',f.files[0]);
      if(!val('pf_name')||!val('pf_price')){ alert('Nombre y precio son obligatorios'); return; }
      try{ await api(p?'PUT':'POST','/products'+(p?'/'+p._id:''),fd,true); closeModal(); toast(p?'Producto actualizado':'Producto creado'); view(); }
      catch(err){ alert(err.message); }
    });
  }
  function val(id){ var e=document.getElementById(id); return e?e.value.trim():''; }

  // ---------- inscripciones ----------
  async function inscr(box){
    var list=await api('GET','/admin/campers');
    if(!list.length){ box.innerHTML='<h2 style="font-size:24px;margin-bottom:16px">Inscripciones</h2><p style="color:var(--ink-soft)">Aún no hay campers inscritos.</p>'; return; }
    box.innerHTML='<h2 style="font-size:24px;margin-bottom:16px">Inscripciones ('+list.length+')</h2>'+list.map(function(c){
      return '<div class="adm-row"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;align-items:center">'+
        '<div><b style="font-size:18px">'+esc(c.nombre)+' '+esc(c.apellido)+'</b> <span style="color:var(--ink-soft);font-size:14px">· '+esc(c.edad)+' años</span>'+
          '<div style="font-family:Space Mono;font-size:12px;color:var(--moss);margin-top:3px">'+esc(c.wristband||'—')+(c.parent?' · '+esc(c.parent.email):'')+'</div></div>'+
        '<span class="status '+(c.pago==='paid'?'paid':'pend')+'">'+(c.pago==='paid'?'Pagado':'Pago pendiente')+'</span></div>'+
        '<div style="margin-top:12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;font-size:14px">'+
          row('Campamento',c.campamento)+row('Tipo de sangre',c.sangre)+row('Alergias',c.alergias||'Ninguna')+row('Medicamentos',c.medicamentos||'—')+row('Padecimientos',c.padecimientos||'—')+row('Emergencia',(c.emergencia||'—')+' '+(c.emtel||''))+row('Escuela',c.escuela)+row('Publicidad',c.publicidad?'Autorizada':'No autorizada')+
        '</div></div>';
    }).join('');
  }
  function row(k,v){ return '<div style="background:var(--cream-2);border-radius:10px;padding:8px 12px"><div style="font-family:Space Mono;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--moss)">'+esc(k)+'</div><div>'+esc(v||'—')+'</div></div>'; }

  // ---------- pedidos ----------
  async function pedidos(box){
    var list=await api('GET','/admin/orders');
    if(!list.length){ box.innerHTML='<h2 style="font-size:24px;margin-bottom:16px">Pedidos de tienda</h2><p style="color:var(--ink-soft)">Aún no hay pedidos.</p>'; return; }
    box.innerHTML='<h2 style="font-size:24px;margin-bottom:16px">Pedidos de tienda ('+list.length+')</h2>'+list.map(function(o){
      return '<div class="adm-row"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px"><b>'+esc(o.code)+'</b><b style="color:var(--pine);font-family:Bricolage Grotesque">'+money(o.total)+'</b></div>'+
        '<div style="color:var(--ink-soft);font-size:14px;margin-top:4px">'+esc(o.name||'—')+' · '+esc(o.contact||'—')+(o.camper?' · para '+esc(o.camper):'')+'</div>'+
        '<div style="margin-top:8px;font-size:14px">'+(o.items||[]).map(function(i){return esc(i.qty+'× '+(i.name||i.en||'')+(i.opt?' ('+i.opt+')':''));}).join(' &nbsp;·&nbsp; ')+'</div></div>';
    }).join('');
  }

  // ---------- campamentos ----------
  async function camps(box){
    var list=await api('GET','/camps');
    box.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h2 style="font-size:24px">Campamentos</h2><button class="btn btn-primary" id="newCamp">+ Nuevo</button></div>'+
      list.map(function(c){
      return '<div class="adm-row" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div><b style="font-size:17px">'+esc(c.es)+'</b><div style="color:var(--ink-soft);font-size:14px">'+esc(c.dates)+'</div></div>'+
        '<div style="display:flex;align-items:center;gap:14px"><b style="font-family:Bricolage Grotesque;color:var(--pine);font-size:20px">'+money(c.price)+'</b><button class="btn btn-ghost sm" data-cedit="'+c._id+'">Editar</button></div></div>';
    }).join('');
    document.getElementById('newCamp').addEventListener('click',function(){campForm(null);});
    box.querySelectorAll('[data-cedit]').forEach(function(b){b.addEventListener('click',function(){campForm(list.find(function(x){return x._id===b.getAttribute('data-cedit');}));});});
  }
  function campForm(c){
    var e=c||{};
    openModal('<h3 style="font-size:22px;margin-bottom:16px">'+(c?'Editar campamento':'Nuevo campamento')+'</h3><div class="form">'+
      '<div class="field"><label>Nombre (ES)</label><input id="cf_es" value="'+esc(e.es)+'"></div>'+
      '<div class="field"><label>Nombre (EN)</label><input id="cf_en" value="'+esc(e.en)+'"></div>'+
      '<div class="form-row"><div class="field"><label>Fechas</label><input id="cf_dates" value="'+esc(e.dates)+'"></div>'+
      '<div class="field"><label>Precio (MXN)</label><input id="cf_price" type="number" value="'+esc(e.price)+'"></div></div>'+
      '<div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn btn-ghost" id="cf_cancel">Cancelar</button><button class="btn btn-primary" id="cf_save">Guardar</button></div></div>');
    document.getElementById('cf_cancel').addEventListener('click',closeModal);
    document.getElementById('cf_save').addEventListener('click',async function(){
      var body={es:val('cf_es'),en:val('cf_en'),dates:val('cf_dates'),price:Number(val('cf_price'))};
      try{ await api(c?'PUT':'POST','/camps'+(c?'/'+c._id:''),body); closeModal(); toast('Guardado'); view(); }catch(err){alert(err.message);}
    });
  }

  // ---------- avisos ----------
  async function avisos(box){
    var list=await api('GET','/notifications');
    box.innerHTML='<h2 style="font-size:24px;margin-bottom:16px">Avisos a los papás</h2>'+
      '<div class="compose"><b>Nuevo aviso (se manda a todas las cuentas)</b><div class="form" style="margin-top:12px">'+
        '<div class="field"><label>Título</label><input id="nv_t" placeholder="Ej. Todo bien en el campamento"></div>'+
        '<div class="field"><label>Mensaje</label><textarea id="nv_b" placeholder="Escribe el aviso..."></textarea></div>'+
        '<button class="btn btn-dark" id="nv_send" style="align-self:flex-start">Enviar a todos</button></div></div>'+
      '<div class="notif-list">'+list.map(function(n){return '<div class="notif"><div class="nic">'+(n.icon||'📣')+'</div><div class="nb"><b>'+esc(n.title)+'</b><p>'+esc(n.body)+'</p><div class="when">'+esc(n.when||'')+'</div></div></div>';}).join('')+'</div>';
    document.getElementById('nv_send').addEventListener('click',async function(){
      var t=val('nv_t'), b=val('nv_b'); if(!b){alert('Escribe el mensaje');return;}
      try{ await api('POST','/notifications',{title:t||'Aviso del campamento',body:b,ben:b}); toast('Aviso enviado'); view(); }catch(e){alert(e.message);}
    });
  }

  boot();
})();
