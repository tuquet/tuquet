import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT_DIR = process.cwd();

const LOCALE_DIRS = [
  'packages/locales/src/langs',
  'apps/workstation/src/locales/langs',
];

const SUPPORTED_LOCALES = ['en-US', 'vi-VN'];

const VN_DIACRITIC_REGEX =
  /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/;

function loadLocaleTree(locale) {
  const tree = {};
  for (const relDir of LOCALE_DIRS) {
    const absDir = path.join(ROOT_DIR, relDir, locale);
    if (!fs.existsSync(absDir)) continue;
    for (const file of fs.readdirSync(absDir)) {
      if (!file.endsWith('.json')) continue;
      const namespace = file.replace(/\.json$/, '');
      const content = JSON.parse(
        fs.readFileSync(path.join(absDir, file), 'utf8'),
      );
      tree[namespace] = {
        ...tree[namespace],
        ...content,
      };
    }
  }
  return tree;
}

function flattenObject(obj, prefix = '', result = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const nextPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenObject(value, nextPath, result);
    } else {
      result[nextPath] = value;
    }
  }
  return result;
}

function getByPath(obj, keyPath) {
  let acc = obj;
  for (const part of keyPath.split('.')) {
    acc = acc && acc[part] !== undefined ? acc[part] : undefined;
  }
  return acc;
}

function walkSourceFiles(dir, files = []) {
  const absDir = path.isAbsolute(dir) ? dir : path.join(ROOT_DIR, dir);
  if (!fs.existsSync(absDir)) return files;

  for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
    if (
      [
        '.git',
        '.turbo',
        '__tests__',
        'dist',
        'dist.bak',
        'langs',
        'locales',
        'node_modules',
      ].includes(entry.name)
    ) {
      continue;
    }
    const fullPath = path.join(absDir, entry.name);
    if (entry.isDirectory()) {
      walkSourceFiles(fullPath, files);
    } else if (
      /\.(?:vue|ts|tsx)$/.test(entry.name) &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.spec.ts') &&
      !entry.name.endsWith('.d.ts')
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

function main() {
  const trees = {};
  const flatMaps = {};

  for (const locale of SUPPORTED_LOCALES) {
    trees[locale] = loadLocaleTree(locale);
    flatMaps[locale] = flattenObject(trees[locale]);
  }

  const enKeys = new Set(Object.keys(flatMaps['en-US']));
  const viKeys = new Set(Object.keys(flatMaps['vi-VN']));

  const missingInVi = [...enKeys].filter((k) => !viKeys.has(k));
  const missingInEn = [...viKeys].filter((k) => !enKeys.has(k));

  // Extract used i18n keys across apps/workstation/src
  const appFiles = walkSourceFiles('apps/workstation/src');
  const keyPatterns = [
    /\$t\(\s*["'`]([a-zA-Z0-9_.-]+)["'`]/gs,
    /(?:labelKey|allLabelKey|titleKey|descKey|placeholderKey):\s*["'`]([a-zA-Z0-9_.-]+)["'`]/gs,
    /title:\s*["'`]((?:page|common|term|ui|preferences|authentication|profile)\.[a-zA-Z0-9_.-]+)["'`]/gs,
  ];

  const missingUsedKeys = [];
  let totalReferencedCount = 0;

  for (const file of appFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const relFile = path.relative(ROOT_DIR, file);

    for (const pattern of keyPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const key = match[1].trim();
        if (!key || key.includes('${')) continue;
        totalReferencedCount++;

        const enVal = getByPath(trees['en-US'], key);
        const viVal = getByPath(trees['vi-VN'], key);

        if (typeof enVal !== 'string' || typeof viVal !== 'string') {
          missingUsedKeys.push({
            enExists: typeof enVal === 'string',
            file: relFile,
            key,
            viExists: typeof viVal === 'string',
          });
        }
      }
    }
  }

  // Scan for hardcoded Vietnamese lines in apps/workstation/src
  const hardcodedVnLeaks = [];
  for (const file of appFiles) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    const relFile = path.relative(ROOT_DIR, file);
    let inBlockComment = false;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('/*') || trimmed.startsWith('/**')) {
        inBlockComment = true;
      }
      if (inBlockComment) {
        if (trimmed.includes('*/')) {
          inBlockComment = false;
        }
        return;
      }
      if (
        trimmed.startsWith('//') ||
        trimmed.startsWith('*') ||
        trimmed.startsWith('<!--')
      ) {
        return;
      }
      const codeOnly = line
        .replace(/\/\/.*$/, '')
        .replaceAll(/<!--.*?-->/g, '');
      if (VN_DIACRITIC_REGEX.test(codeOnly)) {
        hardcodedVnLeaks.push({
          file: relFile,
          line: index + 1,
          text: trimmed,
        });
      }
    });
  }

  // Scan locale messages for raw `{{ }}` — vue-i18n treats it as interpolation and
  // THROWS at render time, silently blanking the whole component (no console error,
  // no Sentry event). Escape as {'{'} or reword the message instead.
  const interpolationLeaks = [];
  for (const locale of SUPPORTED_LOCALES) {
    for (const [key, value] of Object.entries(flatMaps[locale])) {
      if (typeof value === 'string' && /\{\{|\}\}/.test(value)) {
        interpolationLeaks.push({ key, locale, value });
      }
    }
  }

  console.log('============================================================');
  console.log('  Admin i18n Integrity Report (en-US <-> vi-VN)');
  console.log('============================================================');
  console.log(`  - Total en-US dictionary keys : ${enKeys.size}`);
  console.log(`  - Total vi-VN dictionary keys : ${viKeys.size}`);
  console.log(`  - Referenced keys verified    : ${totalReferencedCount}`);
  console.log(`  - Missing keys in vi-VN       : ${missingInVi.length}`);
  console.log(`  - Missing keys in en-US       : ${missingInEn.length}`);
  console.log(`  - Unresolved $t(...) calls    : ${missingUsedKeys.length}`);
  console.log(`  - Hardcoded Vietnamese lines  : ${hardcodedVnLeaks.length}`);
  console.log(
    `  - Raw {{ }} interpolation leaks: ${interpolationLeaks.length}`,
  );
  console.log('============================================================');

  let hasError = false;

  if (missingInVi.length > 0) {
    hasError = true;
    console.error('\n[ERROR] Keys present in en-US but missing in vi-VN:');
    for (const k of missingInVi) console.error(`  - ${k}`);
  }

  if (missingInEn.length > 0) {
    hasError = true;
    console.error('\n[ERROR] Keys present in vi-VN but missing in en-US:');
    for (const k of missingInEn) console.error(`  - ${k}`);
  }

  if (missingUsedKeys.length > 0) {
    hasError = true;
    console.error('\n[ERROR] Referenced i18n keys missing from locale files:');
    for (const item of missingUsedKeys) {
      console.error(
        `  - ${item.key} in ${item.file} (en-US: ${item.enExists}, vi-VN: ${item.viExists})`,
      );
    }
  }

  if (hardcodedVnLeaks.length > 0) {
    hasError = true;
    console.error('\n[ERROR] Hardcoded Vietnamese text found in source files:');
    for (const leak of hardcodedVnLeaks) {
      console.error(`  - ${leak.file}:${leak.line}: ${leak.text}`);
    }
  }

  if (interpolationLeaks.length > 0) {
    hasError = true;
    console.error(
      '\n[ERROR] Locale messages contain raw `{{ }}` — vue-i18n will throw at render:',
    );
    for (const leak of interpolationLeaks) {
      console.error(`  - ${leak.locale} · ${leak.key}: ${leak.value}`);
    }
    console.error("  Fix: reword the message or escape with {'{'} / {'}'}.");
  }

  if (hasError) {
    process.exit(1);
  }

  console.log('  STATUS: PASS (100% i18n parity & zero missing keys)');
}

main();
