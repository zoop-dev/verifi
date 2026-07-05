var ADMIN_KEY = new URLSearchParams(window.location.search).get('key') || '';

if (!ADMIN_KEY) {
  document.getElementById('gate').innerHTML = '<p class="nokey">missing ?key= in the url.</p>';
} else {
  document.getElementById('lookup').style.display = 'flex';
}

async function lookupStats() {
  var siteId = document.getElementById('site-inp').value.trim();
  if (!siteId) { document.getElementById('site-inp').focus(); return; }
  var btn = document.getElementById('lookup-btn'), err = document.getElementById('err');
  var totals = document.getElementById('totals'), table = document.getElementById('days-table');
  btn.disabled = true; btn.textContent = 'loading…';
  err.style.display = 'none'; totals.style.display = 'none'; table.style.display = 'none';
  try {
    var res = await fetch('/stats?site_id=' + encodeURIComponent(siteId) + '&admin_key=' + encodeURIComponent(ADMIN_KEY));
    var data = await res.json();
    if (data.error) throw new Error(data.error);
    document.getElementById('total-passes').textContent = data.totals.passes;
    document.getElementById('total-fails').textContent = data.totals.fails;
    totals.style.display = 'grid';
    var tbody = document.getElementById('days-body');
    tbody.innerHTML = '';
    if (!data.days.length) {
      tbody.innerHTML = '<tr><td colspan="3" class="empty">no data yet</td></tr>';
    } else {
      data.days.forEach(function (row) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + row.day + '</td><td class="pass">' + row.passes + '</td><td class="fail">' + row.fails + '</td>';
        tbody.appendChild(tr);
      });
    }
    table.style.display = 'table';
  } catch (e) {
    err.textContent = 'error: ' + e.message;
    err.style.display = 'block';
  } finally {
    btn.disabled = false; btn.textContent = 'look up';
  }
}
document.getElementById('site-inp').addEventListener('keydown', function (e) { if (e.key === 'Enter') lookupStats(); });
