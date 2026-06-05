const fs = require('fs');
const path = require('path');
const cspConfig = require('./csp-packs.config.js');

const envPath = path.join(__dirname, '../src/environments/environment.prod.ts');
const envContent = fs.readFileSync(envPath, 'utf8');

const indexPath = path.join(__dirname, '../dist/respect_portal/index.html');
if (!fs.existsSync(indexPath)) {
  throw new Error(`Could not find built index.html at expected path: ${indexPath}`);
}

function parseBoolean(key, fallback) {
  const match = envContent.match(new RegExp(`${key}\\s*:\\s*(true|false)`));
  return match ? match[1] === 'true' : fallback;
}

function parseStringArray(key) {
  const match = envContent.match(new RegExp(`${key}\\s*:\\s*\\[([^\\]]*)\\]`, 's'));
  if (!match) {
    return [];
  }

  return match[1]
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => item.replace(/^['"`]|['"`]$/g, ''));
}

function mergeSources(targetMap, directive, sources) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return;
  }

  if (!targetMap.has(directive)) {
    targetMap.set(directive, new Set());
  }

  const directiveSet = targetMap.get(directive);
  sources.forEach(source => directiveSet.add(source));
}

function parseCspDirectives(csp) {
  const map = new Map();
  csp
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .forEach(part => {
      const tokens = part.split(/\s+/).filter(Boolean);
      if (tokens.length === 0) {
        return;
      }
      const [directive, ...sources] = tokens;
      map.set(directive, new Set(sources));
    });
  return map;
}

function stringifyCsp(map) {
  return (
    Array.from(map.entries())
      .map(([directive, sources]) => {
        const sourceList = Array.from(sources);
        return sourceList.length > 0 ? `${directive} ${sourceList.join(' ')}` : directive;
      })
      .join('; ') + ';'
  );
}

const cspEnabled = parseBoolean('cspEnabled', true);
const cspStrictMode = parseBoolean('cspStrictMode', true);
const selectedPacks = parseStringArray('cspPacks');

const extraDirectiveMap = {
  'script-src': parseStringArray('cspScriptSrc'),
  'connect-src': parseStringArray('cspConnectSrc'),
  'img-src': parseStringArray('cspImgSrc'),
  'frame-src': parseStringArray('cspFrameSrc'),
  'style-src': parseStringArray('cspStyleSrc'),
  'font-src': parseStringArray('cspFontSrc'),
};

let indexContent = fs.readFileSync(indexPath, 'utf8');
const cspMetaRegex = /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)"\s*\/?\s*>/i;

if (!cspEnabled) {
  indexContent = indexContent.replace(/\s*<meta\s+http-equiv="Content-Security-Policy"\s+content="[^"]*"\s*\/?\s*>/gi, '');
  fs.writeFileSync(indexPath, indexContent, 'utf8');
  console.log('CSP disabled by environment.cspEnabled=false.');
  process.exit(0);
}

const cspMatch = indexContent.match(cspMetaRegex);
if (!cspMatch) {
  throw new Error('Could not find auto-generated CSP meta tag. Ensure angular security.autoCsp is enabled.');
}

const directivesMap = parseCspDirectives(cspMatch[1]);

Object.entries(cspConfig.baseline).forEach(([directive, sources]) => {
  mergeSources(directivesMap, directive, sources);
});

const unknownPacks = selectedPacks.filter(pack => !cspConfig.packs[pack]);
if (unknownPacks.length > 0) {
  const message = `Unknown CSP packs: ${unknownPacks.join(', ')}`;
  if (cspStrictMode) {
    throw new Error(message);
  }
  console.warn(message);
}

selectedPacks
  .filter(pack => cspConfig.packs[pack])
  .forEach(pack => {
    const packDirectives = cspConfig.packs[pack];
    Object.entries(packDirectives).forEach(([directive, sources]) => {
      mergeSources(directivesMap, directive, sources);
    });
  });

Object.entries(extraDirectiveMap).forEach(([directive, sources]) => {
  mergeSources(directivesMap, directive, sources);
});

const mergedCsp = stringifyCsp(directivesMap);
indexContent = indexContent.replace(cspMetaRegex, `<meta http-equiv="Content-Security-Policy" content="${mergedCsp}">`);

fs.writeFileSync(indexPath, indexContent, 'utf8');

console.log(`Applied CSP packs: ${selectedPacks.join(', ') || '(none)'}`);
console.log(`CSP strict mode: ${cspStrictMode}`);
console.log('Applied per-directive extra sources from environment where provided.');
