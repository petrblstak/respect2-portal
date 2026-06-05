const fs = require('fs');
const path = require('path');

// Read the portalBaseUrl from environment.prod.ts
const envPath = path.join(__dirname, '../src/environments/environment.prod.ts');
const envContent = fs.readFileSync(envPath, 'utf8');
const baseUrlMatch = envContent.match(/portalBaseUrl:\s*['"`]([^'"`]*)['"`]/);
const portalBaseUrl = baseUrlMatch ? baseUrlMatch[1] : '/';

// Ensure portalBaseUrl ends with / but doesn't start with //
const normalizedBaseUrl = portalBaseUrl.endsWith('/') ? portalBaseUrl : portalBaseUrl + '/';
const finalBaseUrl = normalizedBaseUrl.startsWith('/') ? normalizedBaseUrl : '/' + normalizedBaseUrl;

console.log(`Using portalBaseUrl: ${finalBaseUrl}`);

// Read the index.html file from the configured flat Angular output path.
const indexPath = path.join(__dirname, '../dist/respect_portal/index.html');

if (!fs.existsSync(indexPath)) {
  throw new Error(`Could not find built index.html at expected path: ${indexPath}`);
}

console.log(`Patching built index: ${indexPath}`);
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Keep base href aligned with deploy base so relative asset URLs resolve correctly.
indexContent = indexContent.replace(/<base\s+href="[^"]*"\s*\/?\s*>/i, `<base href="${finalBaseUrl}">`);

// Convert relative preload and stylesheet links to absolute (using portalBaseUrl)
indexContent = indexContent.replace(/href="(?!https?:|\/|data:|#)([^"]*\.(css|js))"/g, `href="${finalBaseUrl}$1"`);

// Convert relative script src to absolute (using portalBaseUrl)
indexContent = indexContent.replace(/src="(?!https?:|\/|data:|#)([^"]*\.js)"/g, `src="${finalBaseUrl}$1"`);

// Write the updated content back
fs.writeFileSync(indexPath, indexContent, 'utf8');

console.log(`Fixed asset paths with base: ${finalBaseUrl}`);
