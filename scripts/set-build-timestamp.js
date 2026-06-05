const fs = require('fs');
const path = require('path');

// Path to your environment.ts file
const envFilePath = path.resolve(__dirname, '../src/environments/environment.ts');

// Path to your environment.prod.ts file
const envProdFilePath = path.resolve(__dirname, '../src/environments/environment.prod.ts');

// Format date as "yyMMDD:hhmmss"
const now = new Date();
const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
const day = now.getDate().toString().padStart(2, '0');
const hours = now.getHours().toString().padStart(2, '0');
const minutes = now.getMinutes().toString().padStart(2, '0');
const seconds = now.getSeconds().toString().padStart(2, '0');

const newTimestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;

// Regex to find the buildTime line and replace its value.
// It looks for "buildTime: " followed by any characters (non-greedy) up to the next comma,
// and replaces the existing value (e.g., '' + new Date().getTime() or a previous string timestamp)
// with the new string timestamp.
const buildTimeRegex = /(buildTime:\s*)([^,]*)(,)/;

// Regex to find the version line and extract the x.y.z values
const versionRegex = /(version:\s*)'(\d+)\.(\d+)\.(\d+)'(,)/;

// Process environment file - updates both buildTime and version
function processEnvFile(filePath) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading file ${filePath}:`, err);
      process.exit(1); // Exit with error
    }

    let updatedContent = data;
    let hasChanges = false;

    // Update buildTime
    if (buildTimeRegex.test(data)) {
      updatedContent = updatedContent.replace(buildTimeRegex, `$1'${newTimestamp}'$3`);
      hasChanges = true;
    } else {
      console.warn(`buildTime pattern not found in ${filePath}.`);
    }

    // Update version number
    const versionMatch = versionRegex.exec(data);
    if (versionMatch) {
      const majorVersion = versionMatch[2]; // x
      const minorVersion = versionMatch[3]; // y
      const patchVersion = parseInt(versionMatch[4], 10); // z

      // Increment patch version by 1
      const newPatchVersion = patchVersion + 1;
      const newVersion = `${majorVersion}.${minorVersion}.${newPatchVersion}`;

      updatedContent = updatedContent.replace(versionRegex, `$1'${newVersion}'$5`);

      hasChanges = true;
    } else {
      console.warn(`version pattern not found in ${filePath}.`);
    }

    if (hasChanges) {
      fs.writeFile(filePath, updatedContent, 'utf8', (writeErr) => {
        if (writeErr) {
          console.error(`Error writing file ${filePath}:`, writeErr);
          process.exit(1); // Exit with error
        }
        console.log(`Successfully updated ${filePath}. Build time: ${newTimestamp}`);
      });
    } else {
      console.warn(`No patterns matched in ${filePath}. File not updated.`);
    }
  });
}

// Process both environment files
processEnvFile(envFilePath);
processEnvFile(envProdFilePath);
