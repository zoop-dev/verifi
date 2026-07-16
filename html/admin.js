var params = new URLSearchParams(window.location.search);
var SITE_ID = params.get('site_id') || '';
var SITE_KEY = params.get('key') || '';
var GLOBAL_KEY = params.get('admin_key') || '';

var currentData = null;

function init() {
  if (SITE_ID && (SITE_KEY || GLOBAL_KEY)) {
    document.getElementById('auth').style.display = 'none';
    lookupStats();
  } else if (GLOBAL_KEY) {
    document.getElementById('page-title').textContent = 'global admin';
    document.getElementById('auth').style.display = 'none';
    loadSites();
  } else {
    document.getElementById('gate').innerHTML = '<p class="nokey">missing credentials. use <code>?site_id=...&key=...</code> or <code>?admin_key=...</code></p>';
    document.getElementById('auth').style.display = 'block';
  }
}
init();

async function loadSites() {
  var container = document.getElementById('sites-list');
  try {
    var res = await fetch('/stats?admin_key=' + encodeURIComponent(GLOBAL_KEY));
    var data = await res.json();
    if (data.error) throw new Error(data.error);
    if (!data.sites.length) {
      container.innerHTML = '<p class="empty">no sites yet.</p>';
      return;
    }
    var header = document.createElement('div');
    header.className = 'sites-header';
    header.textContent = 'registered sites (' + data.sites.length + ')';
    var grid = document.createElement('div');
    grid.className = 'sites';
    data.sites.forEach(function (site) {
      var card = document.createElement('div');
      card.className = 'sites__card';
      card.innerHTML = '<div class="site-name">' + escapeHtml(site.name) + '</div>' +
        '<div class="site-domain">' + escapeHtml(site.domain || '') + '</div>' +
        '<div class="site-id">' + escapeHtml(site.id) + '</div>' +
        '<div class="site-arrow">→</div>';
      card.addEventListener('click', function () {
        window.location.href = '?site_id=' + encodeURIComponent(site.id) + '&admin_key=' + encodeURIComponent(GLOBAL_KEY);
      });
      grid.appendChild(card);
    });
    container.innerHTML = '';
    container.appendChild(header);
    container.appendChild(grid);
  } catch (e) {
    container.innerHTML = '<p class="empty">couldnt load sites: ' + e.message + '</p>';
  }
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function lookupStats() {
  var siteId = SITE_ID || document.getElementById('site-inp').value.trim();
  var siteKey = SITE_KEY || document.getElementById('key-inp').value.trim();
  if (!siteId) { document.getElementById('site-inp').focus(); return; }
  if (!siteKey && !GLOBAL_KEY) { document.getElementById('key-inp').focus(); return; }

  var btn = document.getElementById('lookup-btn'), err = document.getElementById('err');
  var dashboard = document.getElementById('dashboard');
  btn.disabled = true; btn.textContent = 'loading…';
  err.style.display = 'none'; dashboard.style.display = 'none';

  try {
    var url = '/stats?site_id=' + encodeURIComponent(siteId);
    if (siteKey) {
      url += '&key=' + encodeURIComponent(siteKey);
    } else if (GLOBAL_KEY) {
      url += '&admin_key=' + encodeURIComponent(GLOBAL_KEY);
    }
    var res = await fetch(url);
    var data = await res.json();
    if (data.error) throw new Error(data.error);
    currentData = data;
    renderDashboard(data, siteId, siteKey);
  } catch (e) {
    err.textContent = 'error: ' + e.message;
    err.style.display = 'block';
  } finally {
    btn.disabled = false; btn.textContent = 'view dashboard';
  }
}

function renderDashboard(data, siteId, siteKey) {
  if (history.replaceState) {
    var url = '?site_id=' + encodeURIComponent(siteId);
    if (siteKey) {
      url += '&key=' + encodeURIComponent(siteKey);
    } else if (GLOBAL_KEY) {
      url += '&admin_key=' + encodeURIComponent(GLOBAL_KEY);
    }
    history.replaceState({}, '', url);
  }
  var dashboard = document.getElementById('dashboard');
  var site = data.site || {};
  document.getElementById('site-name').textContent = site.name || siteId;
  document.getElementById('site-domain').textContent = site.domain || '';

  var totals = data.totals || { passes: 0, fails: 0 };
  var total = totals.passes + totals.fails;
  var passRate = total > 0 ? Math.round((totals.passes / total) * 100) : 0;

  document.getElementById('total-verifications').textContent = formatNumber(total);
  document.getElementById('total-passes').textContent = formatNumber(totals.passes);
  document.getElementById('total-fails').textContent = formatNumber(totals.fails);
  document.getElementById('pass-rate').textContent = passRate + '%';

  var days = data.days || [];
  renderTable(days);

  dashboard.style.display = 'block';
  document.getElementById('totals').style.display = 'grid';
  requestAnimationFrame(function () {
    drawDailyChart(days);
    drawTrendChart(days);
    drawSplitChart(totals.passes, totals.fails);
  });
}

function formatNumber(n) {
  return Number(n || 0).toLocaleString();
}

function renderTable(days) {
  var tbody = document.getElementById('days-body');
  tbody.innerHTML = '';
  if (!days.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty">no data yet</td></tr>';
    return;
  }
  days.forEach(function (row) {
    var tr = document.createElement('tr');
    var dayTotal = (row.passes || 0) + (row.fails || 0);
    tr.innerHTML = '<td>' + row.day + '</td><td class="pass">' + (row.passes || 0) + '</td><td class="fail">' + (row.fails || 0) + '</td><td>' + dayTotal + '</td>';
    tbody.appendChild(tr);
  });
}

function setupCanvas(canvas, cssHeight) {
  var dpr = window.devicePixelRatio || 1;
  var rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor((cssHeight || rect.height) * dpr));
  var ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx: ctx, width: rect.width, height: cssHeight || rect.height };
}

function drawDailyChart(days) {
  var canvas = document.getElementById('daily-chart');
  if (!canvas || !canvas.getContext) return;
  var labels = days.slice().reverse();
  var dims = setupCanvas(canvas, 220);
  var ctx = dims.ctx, width = dims.width, height = dims.height;
  var pad = { top: 20, right: 16, bottom: 44, left: 36 };
  var chartW = width - pad.left - pad.right;
  var chartH = height - pad.top - pad.bottom;

  ctx.clearRect(0, 0, width, height);
  if (!labels.length) return;

  var max = Math.max(1, ...labels.map(function (d) { return (d.passes || 0) + (d.fails || 0); }));

  // grid
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (var i = 0; i <= 4; i++) {
    var y = pad.top + chartH - (i / 4) * chartH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y); ctx.stroke();
  }

  var step = chartW / labels.length;
  var barW = step * 0.55;

  labels.forEach(function (row, i) {
    var x = pad.left + i * step + step / 2;
    var p = (row.passes || 0) / max * chartH;
    var f = (row.fails || 0) / max * chartH;

    ctx.fillStyle = '#10b981';
    ctx.fillRect(x - barW / 2, pad.top + chartH - p, barW, p);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x - barW / 2, pad.top + chartH - p - f, barW, f);

    // date label
    ctx.fillStyle = '#3d4f63';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(x, height - pad.bottom + 12);
    ctx.rotate(-Math.PI / 4);
    ctx.fillText(row.day.slice(5), 0, 0);
    ctx.restore();
  });
}

function drawTrendChart(days) {
  var canvas = document.getElementById('trend-chart');
  if (!canvas || !canvas.getContext) return;
  var labels = days.slice().reverse();
  var dims = setupCanvas(canvas, 220);
  var ctx = dims.ctx, width = dims.width, height = dims.height;
  var pad = { top: 20, right: 16, bottom: 44, left: 36 };
  var chartW = width - pad.left - pad.right;
  var chartH = height - pad.top - pad.bottom;

  ctx.clearRect(0, 0, width, height);
  if (labels.length < 2) return;

  var rates = labels.map(function (d) {
    var total = (d.passes || 0) + (d.fails || 0);
    return total > 0 ? (d.passes || 0) / total : 0;
  });

  // grid
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (var i = 0; i <= 4; i++) {
    var y = pad.top + chartH - (i / 4) * chartH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y); ctx.stroke();
  }

  // line
  ctx.strokeStyle = '#00c8ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  labels.forEach(function (d, i) {
    var x = pad.left + (i / (labels.length - 1)) * chartW;
    var y = pad.top + chartH - rates[i] * chartH;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // area under line
  ctx.fillStyle = 'rgba(0,200,255,0.08)';
  ctx.beginPath();
  labels.forEach(function (d, i) {
    var x = pad.left + (i / (labels.length - 1)) * chartW;
    var y = pad.top + chartH - rates[i] * chartH;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  var lastX = pad.left + chartW;
  var firstX = pad.left;
  ctx.lineTo(lastX, pad.top + chartH);
  ctx.lineTo(firstX, pad.top + chartH);
  ctx.closePath();
  ctx.fill();

  // points
  labels.forEach(function (d, i) {
    var x = pad.left + (i / (labels.length - 1)) * chartW;
    var y = pad.top + chartH - rates[i] * chartH;
    ctx.fillStyle = '#070a0e';
    ctx.strokeStyle = '#00c8ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  // labels
  ctx.fillStyle = '#3d4f63';
  ctx.font = '10px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  labels.forEach(function (d, i) {
    if (i % Math.ceil(labels.length / 6) !== 0) return;
    var x = pad.left + (i / (labels.length - 1)) * chartW;
    ctx.save();
    ctx.translate(x, height - pad.bottom + 12);
    ctx.rotate(-Math.PI / 4);
    ctx.fillText(d.day.slice(5), 0, 0);
    ctx.restore();
  });
}

function drawSplitChart(passes, fails) {
  var canvas = document.getElementById('split-chart');
  var centerLabel = document.getElementById('donut-center');
  if (!canvas || !canvas.getContext) return;
  var total = (passes || 0) + (fails || 0);
  var passRate = total > 0 ? Math.round((passes / total) * 100) : 0;
  centerLabel.textContent = passRate + '%';

  var dims = setupCanvas(canvas, 220);
  var ctx = dims.ctx, width = dims.width, height = dims.height;
  ctx.clearRect(0, 0, width, height);

  var cx = width / 2, cy = height / 2;
  var radius = Math.min(width, height) / 2 - 20;
  var thickness = 24;

  if (total === 0) {
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  var startAngle = -Math.PI / 2;
  var passAngle = (passes / total) * Math.PI * 2;

  // pass arc
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, startAngle + passAngle);
  ctx.stroke();

  // fail arc — picks up exactly where the pass arc ends, no gap or overlap
  ctx.strokeStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle + passAngle, startAngle + Math.PI * 2);
  ctx.stroke();
}

function exportCSV() {
  if (!currentData || !currentData.days) return;
  var rows = currentData.days.slice().reverse();
  var csv = 'day,passed,blocked,total\n';
  rows.forEach(function (row) {
    var total = (row.passes || 0) + (row.fails || 0);
    csv += [row.day, row.passes || 0, row.fails || 0, total].join(',') + '\n';
  });
  var blob = new Blob([csv], { type: 'text/csv' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'verifi-stats.csv';
  a.click();
  URL.revokeObjectURL(url);
}


document.getElementById('site-inp').addEventListener('keydown', function (e) { if (e.key === 'Enter') lookupStats(); });
document.getElementById('key-inp').addEventListener('keydown', function (e) { if (e.key === 'Enter') lookupStats(); });
