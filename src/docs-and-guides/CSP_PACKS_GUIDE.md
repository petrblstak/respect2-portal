# CSP Packs Guide

This project uses a strict-hybrid CSP model:

- Angular autoCsp builds strict `script-src` hashes.
- Post-build script `scripts/apply-csp.js` merges:
  - a baseline policy,
  - selected CSP packs,
  - per-customer extra directive arrays from `environment.prod.ts`.

Pack definitions live in:

- `scripts/csp-packs.config.js`

## How to configure per customer

In `src/environments/environment.prod.ts`:

- `cspEnabled`: enable/disable CSP meta in built `index.html`
- `cspStrictMode`: fail build on unknown `cspPacks`
- `cspPacks`: list of reusable service packs
- `cspScriptSrc`, `cspConnectSrc`, `cspImgSrc`, `cspFrameSrc`, `cspStyleSrc`, `cspFontSrc`: per-customer escape hatch arrays

## Initial pack source references

These packs were seeded from vendor documentation and common integration practice.
Always validate with Report-Only first for each customer deployment.

- Google Tag Manager + GA4 CSP guide:
  - https://developers.google.com/tag-platform/security/guides/csp
- reCAPTCHA CSP FAQ:
  - https://developers.google.com/recaptcha/docs/faq
- Microsoft Clarity CSP guidance:
  - https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-csp
- Sentry Angular docs (network endpoint pattern depends on DSN / org):
  - https://docs.sentry.io/platforms/javascript/guides/angular/

## Notes

- Keep GTM (`gtm`) separate from GA4 (`ga4`) because customers may require one without the other.
- Avoid broad `https:` additions in extras unless there is a documented and approved reason.
- If an extra domain appears repeatedly across customers, move it into a named pack.
