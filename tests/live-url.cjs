/** Explicit native workspace URL for native regressions; does not intercept requests or alter app behavior. */
function liveWorkspaceUrl(value) {
  const url = new URL(value);
  if (['http:', 'https:'].includes(url.protocol) && url.pathname === '/' && url.port !== '8771') {
    url.pathname = '/live.html';
  }
  return url.href;
}
module.exports = {liveWorkspaceUrl};
