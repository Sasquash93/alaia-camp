/* ============ i18n ES / EN ============
   apply(lang)      → traduce todo el documento, fija idioma, avisa (langchange).
   translate(lang)  → solo traduce el DOM actual SIN avisar (para usar tras
                      re-renderizar contenido dinámico, evita bucles). */
(function(){
  const KEY='alaia-lang';

  function translate(lang, root){
    root = root || document;
    root.querySelectorAll('[data-en]').forEach(el=>{
      if(el.dataset.es===undefined) el.dataset.es=el.textContent;
      el.textContent = (lang==='en') ? el.dataset.en : el.dataset.es;
    });
    root.querySelectorAll('[data-en-ph]').forEach(el=>{
      if(el.dataset.esPh===undefined) el.dataset.esPh=el.getAttribute('placeholder')||'';
      el.setAttribute('placeholder', (lang==='en') ? el.dataset.enPh : el.dataset.esPh);
    });
  }

  function apply(lang){
    translate(lang, document);
    document.documentElement.lang = lang;
    document.querySelectorAll('#lang button').forEach(b=>b.classList.toggle('on', b.dataset.lang===lang));
    window.ALAIA_LANG = lang;
    try{ localStorage.setItem(KEY,lang); }catch(e){}
    window.dispatchEvent(new CustomEvent('langchange',{detail:lang}));
  }

  function bind(){
    document.querySelectorAll('#lang button').forEach(b=>{
      if(b.__bound) return; b.__bound=1;
      b.addEventListener('click',()=>apply(b.dataset.lang));
    });
  }

  let saved='es';
  try{ saved=localStorage.getItem(KEY)||'es'; }catch(e){}
  window.ALAIA_LANG=saved;
  window.AlaiaI18n={apply:apply, translate:translate, bind:bind, get current(){return window.ALAIA_LANG;}};
  bind();
  apply(saved);
})();
