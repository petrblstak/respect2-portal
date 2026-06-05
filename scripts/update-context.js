#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script to update URL context across the Angular application
 * Usage: node scripts/update-context.js <new-context>
 * Example: node scripts/update-context.js /new-portal/
 */

// Get the new context from command line arguments
const newContext = process.argv[2];

if (!newContext) {
  console.error('❌ Error: Please provide a new context path');
  console.log('Usage: npm run update-context <new-context>');
  console.log('Example: npm run update-context /new-portal/');
  process.exit(1);
}

// Ensure context starts and ends with forward slash
let normalizedContext = newContext;
if (!normalizedContext.startsWith('/')) {
  normalizedContext = '/' + normalizedContext;
}
if (!normalizedContext.endsWith('/')) {
  normalizedContext = normalizedContext + '/';
}

console.log(`🔄 Updating URL context to: ${normalizedContext}`);

// Files to update with their specific patterns
const filesToUpdate = [
  {
    file: 'src/index.html',
    patterns: [
      {
        regex: /<base href="[^"]*" \/>/g,
        replacement: `<base href="${normalizedContext}" />`,
      },
      {
        regex: /href="\/(?:[^\/]*\/)?assets\//g,
        replacement: `href="${normalizedContext}assets/`,
      },
    ],
  },
  {
    file: 'angular.json',
    patterns: [
      {
        regex: /"baseHref": "[^"]*"/g,
        replacement: `"baseHref": "${normalizedContext}"`,
      },
    ],
  },
  {
    file: 'src/environments/environment.ts',
    patterns: [
      {
        regex: /portalBaseUrl: '[^']*'/g,
        replacement: `portalBaseUrl: '${normalizedContext}'`,
      },
    ],
  },
  {
    file: 'src/environments/environment.prod.ts',
    patterns: [
      {
        regex: /portalBaseUrl: '[^']*'/g,
        replacement: `portalBaseUrl: '${normalizedContext}'`,
      },
    ],
  },
  {
    file: 'src/app/shared/merged-translate-loader.ts',
    patterns: [
      {
        regex: /prefix: '[^']*assets\/i18n\/'/g,
        replacement: `prefix: '${normalizedContext}assets/i18n/'`,
      },
    ],
  },
];

let updatedFiles = 0;
let totalReplacements = 0;

// Process each file
filesToUpdate.forEach(({ file, patterns }) => {
  const filePath = path.join(process.cwd(), file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Warning: File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let fileModified = false;
  let fileReplacements = 0;

  patterns.forEach(({ regex, replacement }) => {
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, replacement);
      fileReplacements += matches.length;
      fileModified = true;
    }
  });

  if (fileModified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${file} (${fileReplacements} replacements)`);
    updatedFiles++;
    totalReplacements += fileReplacements;
  } else {
    console.log(`ℹ️  No changes needed: ${file}`);
  }
});

console.log('\n📊 Summary:');
console.log(`Files updated: ${updatedFiles}`);
console.log(`Total replacements: ${totalReplacements}`);
console.log(`New context: ${normalizedContext}`);

if (updatedFiles > 0) {
  console.log('\n✨ Context update completed successfully!');
  console.log("💡 Don't forget to rebuild your application if it's currently running.");
} else {
  console.log('\n🤔 No files were updated. Please check if the current context matches the expected pattern.');
}
