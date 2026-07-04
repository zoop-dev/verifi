# verifi

bot protection — passive detection + progressive challenges. no captchas, no cookies, one script tag.

live at [verifi.zo0p.dev](https://verifi.zo0p.dev)

## quick start

1. register a site (name + domain) to get an id
2. drop in `<head>`:
   ```html
   <script src="https://verifi.zo0p.dev/v.js" data-site="YOUR_ID"></script>
   ```
3. verify server-side if you want:
   ```js
   fetch('https://verifi.zo0p.dev/verify', {
     method: 'POST',
     body: JSON.stringify({ token: verifi.getToken() }),
   }).then(r => r.json()) // { valid, probability, site_id, domain, expires_at }
   ```

full api reference (config, events, embed widget, manual triggers) is on the homepage.

## structure

```
html/        source for index.html / privacy.html
src/         client script source (builds -> v.js)
functions/   cloudflare pages functions (token, verify, pow, ip rep, register)
```

`v.js`, `index.html`, `privacy.html` at root are build output — edit `src/`/`html/` instead.

## build

```
npm install
npm run build        # everything
npm run build:html   # just the html
npm run watch        # rebuild v.js on change
```

## deploy

cloudflare pages. functions need `VERIFI_SECRET` (token signing) and `VERIFI_IP_SECRET` (ip hashing) as secrets. data lives in supabase.

## how it works

passively scores visitors from mouse tremor, scroll physics, keystroke timing, gpu/audio fingerprint — client-side, no network round trip needed just to look. low confidence escalates to a challenge. passing issues a signed, domain-bound token your backend can verify.

privacy details: [verifi.zo0p.dev/privacy](https://verifi.zo0p.dev/privacy)
