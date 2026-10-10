module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const action = typeof req.query.action === 'string' ? req.query.action : '';
  const paths = { address: '/api/mail/address', list: '/api/mail/list' };
  if (!Object.prototype.hasOwnProperty.call(paths, action)) {
    return res.status(400).json({ error: 'Action tidak valid.' });
  }

  const visitorId = String(req.headers['x-visitor-id'] || '');
  if (!visitorId || visitorId.length > 128) {
    return res.status(400).json({ error: 'Visitor ID tidak valid.' });
  }

  const upstreamUrl = new URL('https://temp-mail.app' + paths[action]);
  for (const [key, value] of Object.entries(req.query || {})) {
    if (key !== 'action' && ['refresh', 'expire', 'part'].includes(key) && typeof value === 'string') {
      upstreamUrl.searchParams.set(key, value);
    }
  }

  const headers = {
    'Accept': '*/*',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/139.0.0.0 Mobile Safari/537.36',
    'Cache-Control': 'no-cache',
    'Visitor-Id': visitorId
  };
  const suppliedCookie = req.headers['x-upstream-cookie'];
  if (typeof suppliedCookie === 'string' && suppliedCookie.length < 4096) {
    headers.Cookie = suppliedCookie;
  }

  try {
    const upstream = await fetch(upstreamUrl.toString(), { method: 'GET', headers });
    const bodyText = await upstream.text();

    let newCookiePairs = [];
    if (typeof upstream.headers.getSetCookie === 'function') {
      newCookiePairs = upstream.headers.getSetCookie()
        .map(v => v.split(';', 1)[0].trim()).filter(v => v.includes('='));
    } else {
      const setCookie = upstream.headers.get('set-cookie');
      if (setCookie) newCookiePairs = setCookie.split(/,(?=\s*[^;,]+=)/)
        .map(v => v.split(';', 1)[0].trim()).filter(v => v.includes('='));
    }
    const oldPairs = typeof suppliedCookie === 'string'
      ? suppliedCookie.split(';').map(v => v.trim()).filter(Boolean) : [];
    const cookieMap = new Map();
    for (const pair of [...oldPairs, ...newCookiePairs]) {
      const i = pair.indexOf('=');
      if (i > 0) cookieMap.set(pair.slice(0, i), pair);
    }
    if (cookieMap.size) res.setHeader('x-upstream-cookie', [...cookieMap.values()].join('; '));

    let data;
    try { data = JSON.parse(bodyText); }
    catch { return res.status(502).json({ error: 'Respons upstream bukan JSON yang valid.' }); }

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: 'temp-mail.app mengembalikan HTTP ' + upstream.status,
        upstream: data
      });
    }
    return res.status(200).json(data);
  } catch (error) {
    return res.status(502).json({
      error: 'Gagal menghubungi temp-mail.app dari server.',
      detail: String(error && error.message || error)
    });
  }
};
