var TAG_LABELS = { sec: 'security', new: 'new', fix: 'fix', chg: 'changed' };
var container = document.getElementById('changes');
container.innerHTML = '';
if (!window.CHANGES || !CHANGES.length) {
  container.innerHTML = '<div class="empty">nothing here yet.</div>';
} else {
  CHANGES.forEach(function (entry) {
    var wrap = document.createElement('div');
    wrap.className = 'entry';
    var head = document.createElement('div');
    head.className = 'entry-head';
    head.innerHTML = '<span class="entry-ver">v' + entry.version + '</span><span class="entry-date">' + entry.date + '</span>';
    wrap.appendChild(head);
    var ul = document.createElement('ul');
    (entry.items || []).forEach(function (item) {
      var li = document.createElement('li');
      var label = TAG_LABELS[item.tag] || item.tag;
      li.innerHTML = '<span class="tag ' + item.tag + '">' + label + '</span>' + item.text;
      ul.appendChild(li);
    });
    wrap.appendChild(ul);
    container.appendChild(wrap);
  });
}
