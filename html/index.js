async function register(){
  var name=document.getElementById('inp').value.trim();
  var domain=document.getElementById('inp-domain').value.trim();
  if(!name){document.getElementById('inp').focus();return;}
  if(!domain){document.getElementById('inp-domain').focus();return;}
  var btn=document.getElementById('btn'),result=document.getElementById('result'),err=document.getElementById('err');
  btn.disabled=true;btn.textContent='registering…';
  result.style.display='none';err.style.display='none';
  try{
    var res=await fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,domain})});
    var data=await res.json();
    if(data.error)throw new Error(data.error);
    document.getElementById('out-id').textContent=data.id;
    document.getElementById('snip-id').textContent=data.id;
    if (data.admin_key) {
      var adminLink = document.getElementById('admin-link');
      var adminAnchor = document.getElementById('admin-anchor');
      adminAnchor.href = '/admin?site_id=' + encodeURIComponent(data.id) + '&key=' + encodeURIComponent(data.admin_key);
      adminLink.style.display = 'block';
    }
    result.style.display='block';
  }catch(e){err.textContent='error: '+e.message;err.style.display='block';}
  finally{btn.disabled=false;btn.textContent='get site id';}
}
function copySnippet(){
  var id=document.getElementById('out-id').textContent;
  navigator.clipboard.writeText('<script src="https://verifi.zo0p.dev/v.js" data-site="'+id+'"><\/script>').then(function(){
    var h=document.getElementById('hint');h.textContent='copied!';h.style.color='var(--gn)';
    setTimeout(function(){h.textContent='click to copy';h.style.color='';},1500);
  });
}
document.getElementById('inp').addEventListener('keydown',function(e){if(e.key==='Enter')register();});
document.getElementById('inp-domain').addEventListener('keydown',function(e){if(e.key==='Enter')register();});
