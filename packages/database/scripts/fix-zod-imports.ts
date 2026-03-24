/**
 * Post-generate script to fix missing `import { z } from 'zod'` in
 * zod-prisma-types generated files (known bug with useMultipleFiles).
 */
import * as fs from 'fs';
import * as path from 'path';

const GENERATED_DIR = path.resolve(__dirname, '../src/generated/zod');
const IMPORT_LINE = "import { z } from 'zod';\n";

const fixDir = (dir: string) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fixDir(fullPath);
    } else if (entry.name.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      // If file uses `z.` but doesn't import z
      if (content.includes('z.') && !content.includes("from 'zod'")) {
        fs.writeFileSync(fullPath, IMPORT_LINE + content);
      }
    }
  }
};

if (fs.existsSync(GENERATED_DIR)) {
  fixDir(GENERATED_DIR);
  console.log('[fix-zod-imports] Added missing z imports to generated files');
} else {
  console.log('[fix-zod-imports] Generated directory not found, skipping');
}
