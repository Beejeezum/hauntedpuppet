// Preserve bookmarked native character/projector links while making film control the default.
const query = new URLSearchParams(location.search);
if (location.protocol === 'file:') {
  location.replace('http://127.0.0.1:8770/' + location.search + location.hash);
} else {
  const native = query.get('workspace') === 'live' ||
    ['projector', 'controller', 'character', 'testRealtime'].some(key => query.has(key));
  if (!native && !query.has('rehearsal')) query.set('rehearsal', 'expanded');
  const search = query.toString();
  location.replace((native ? '/live.html' : '/assets/wisp-showdesk/index.html') +
    (native ? location.search : search ? '?' + search : '') + location.hash);
}
