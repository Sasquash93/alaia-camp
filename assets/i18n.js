/* ============ i18n ES / EN ============ */
(function(){
  const KEY='alaia-lang';
  const buttons=document.querySelectorAll('#lang button');

  function apply(lang){
    document.querySelectorAll('[data-en]').forEach(el=>{
      if(el.dataset.es===undefined) el.dataset.es=el.textContent;
      el.textContent = (lang==='en') ? el.dataset.en : el.dataset.es;
    });
    document.documentElement.lang = lang;
    buttons.forEach(b=>b.classList.toggle('on', b.dataset.lang===lang));
    window.ALAIA_LANG = lang;
    window.dispatchEvent(new CustomEvent('langchange',{detail:lang}));
    try{ localStorage.setItem(KEY,lang); }catch(e){}
  }

  buttons.forEach(b=>b.addEventListener('click',()=>apply(b.dataset.lang)));

  let saved='es';
  try{ saved=localStorage.getItem(KEY)||'es'; }catch(e){}
  window.ALAIA_LANG=saved;
  apply(saved);
})();
