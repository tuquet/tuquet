/**
 * Comprehensive SEO & Web Standards Test Suite
 * Validates Technical SEO, Open Graph, Twitter Cards, Schema.org JSON-LD,
 * Semantic HTML Landmarks, Heading Hierarchy, Core Web Vitals, and Discovery Assets.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, message, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    failedTests++;
    failures.push({ message, details });
    console.error(`  ✗ FAIL: ${message} ${details ? '(' + details + ')' : ''}`);
  }
}

function testHtmlFile(filePath, expected) {
  console.log(`\n======================================================`);
  console.log(`Testing File: ${path.relative(ROOT_DIR, filePath)} (${expected.lang.toUpperCase()})`);
  console.log(`======================================================`);

  assert(fs.existsSync(filePath), `File exists: ${path.relative(ROOT_DIR, filePath)}`);
  if (!fs.existsSync(filePath)) return;

  const html = fs.readFileSync(filePath, 'utf8');

  // --- 1. Document Structure & Doctype ---
  console.log('\n[1. Document Structure & Core Meta]');
  assert(/^<!DOCTYPE html>/i.test(html.trim()), 'Has valid HTML5 DOCTYPE declaration');
  assert(new RegExp(`<html[^>]*lang=["']${expected.lang}["']`, 'i').test(html), `HTML tag has lang="${expected.lang}" attribute`);
  assert(/<meta\s+charset=["']UTF-8["']/i.test(html), 'Has UTF-8 character encoding declared');
  assert(/<meta\s+name=["']viewport["']\s+content=["'][^"']*width=device-width[^"']*["']/i.test(html), 'Has mobile-responsive viewport meta tag');

  // --- 2. Title & Description ---
  console.log('\n[2. Search Snippet & Basic SEO]');
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  assert(titleMatch && titleMatch[1].trim().length > 0, 'Page has non-empty <title> tag', titleMatch ? titleMatch[1] : 'missing');
  if (titleMatch) {
    const titleLen = titleMatch[1].trim().length;
    assert(titleLen >= 30 && titleLen <= 90, `Title length is within ideal SEO range (30-90 chars): got ${titleLen} chars`);
  }

  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  assert(descMatch && descMatch[1].trim().length > 0, 'Page has non-empty <meta name="description"> tag');
  if (descMatch) {
    const descLen = descMatch[1].trim().length;
    assert(descLen >= 80 && descLen <= 170, `Meta description length is in sweet spot (80-170 chars): got ${descLen} chars`);
  }

  assert(/<meta\s+name=["']author["']\s+content=["'][^"']+["']/i.test(html), 'Has author meta tag');
  assert(/<meta\s+name=["']keywords["']\s+content=["'][^"']+["']/i.test(html), 'Has keywords meta tag');
  assert(/<meta\s+name=["']robots["']\s+content=["'][^"']*index[^"']*follow[^"']*["']/i.test(html), 'Robots meta allows indexing and following');
  assert(/<meta\s+name=["']googlebot["']\s+content=["'][^"']*index[^"']*follow[^"']*["']/i.test(html), 'Googlebot meta allows indexing and snippets');

  // --- 3. Canonical & Hreflang Multi-language ---
  console.log('\n[3. Canonical URL & Hreflang Alternates]');
  const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i);
  assert(canonicalMatch && canonicalMatch[1] === expected.canonicalUrl, `Canonical link points to exact self-referential URL: ${expected.canonicalUrl}`, canonicalMatch ? canonicalMatch[1] : 'missing');

  assert(/<link\s+rel=["']alternate["']\s+hreflang=["']en["']\s+href=["']https:\/\/tuquet\.github\.io\/["']/i.test(html), 'Has hreflang="en" alternate link');
  assert(/<link\s+rel=["']alternate["']\s+hreflang=["']vi["']\s+href=["']https:\/\/tuquet\.github\.io\/vi\/["']/i.test(html), 'Has hreflang="vi" alternate link');
  assert(/<link\s+rel=["']alternate["']\s+hreflang=["']x-default["']\s+href=["']https:\/\/tuquet\.github\.io\/["']/i.test(html), 'Has hreflang="x-default" fallback alternate link');

  // --- 4. Open Graph & Social Cards ---
  console.log('\n[4. Open Graph & Social Media Tags]');
  assert(/<meta\s+property=["']og:site_name["']\s+content=["'][^"']+["']/i.test(html), 'Has og:site_name');
  assert(/<meta\s+property=["']og:type["']\s+content=["']profile["']/i.test(html), 'Has og:type="profile"');
  assert(/<meta\s+property=["']og:title["']\s+content=["'][^"']+["']/i.test(html), 'Has og:title');
  assert(/<meta\s+property=["']og:description["']\s+content=["'][^"']+["']/i.test(html), 'Has og:description');
  assert(new RegExp(`<meta\\s+property=["']og:url["']\\s+content=["']${expected.canonicalUrl}["']`, 'i').test(html), `Has og:url matching canonical (${expected.canonicalUrl})`);
  assert(/<meta\s+property=["']og:image["']\s+content=["'][^"']+["']/i.test(html), 'Has og:image');
  assert(/<meta\s+property=["']og:image:width["']\s+content=["']\d+["']/i.test(html), 'Has og:image:width for instant preview sizing');
  assert(/<meta\s+property=["']og:image:height["']\s+content=["']\d+["']/i.test(html), 'Has og:image:height for instant preview sizing');
  assert(/<meta\s+property=["']og:image:alt["']\s+content=["'][^"']+["']/i.test(html), 'Has og:image:alt for preview accessibility');
  assert(new RegExp(`<meta\\s+property=["']og:locale["']\\s+content=["']${expected.locale}["']`, 'i').test(html), `Has og:locale="${expected.locale}"`);
  assert(new RegExp(`<meta\\s+property=["']og:locale:alternate["']\\s+content=["']${expected.altLocale}["']`, 'i').test(html), `Has og:locale:alternate="${expected.altLocale}"`);
  assert(/<meta\s+property=["']profile:username["']\s+content=["']tuquet["']/i.test(html), 'Has profile:username="tuquet"');

  // --- 5. Twitter Card ---
  console.log('\n[5. Twitter Card Protocol]');
  assert(/<meta\s+name=["']twitter:card["']\s+content=["']summary["']/i.test(html), 'Has twitter:card');
  assert(/<meta\s+name=["']twitter:site["']\s+content=["']@tuquet["']/i.test(html), 'Has twitter:site');
  assert(/<meta\s+name=["']twitter:title["']\s+content=["'][^"']+["']/i.test(html), 'Has twitter:title');
  assert(/<meta\s+name=["']twitter:description["']\s+content=["'][^"']+["']/i.test(html), 'Has twitter:description');
  assert(/<meta\s+name=["']twitter:image["']\s+content=["'][^"']+["']/i.test(html), 'Has twitter:image');

  // --- 6. Schema.org Structured Data (JSON-LD) ---
  console.log('\n[6. Schema.org JSON-LD Structured Data]');
  const schemaMatch = html.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
  assert(schemaMatch !== null, 'Has <script type="application/ld+json"> tag');
  if (schemaMatch) {
    let schemaJson = null;
    try {
      schemaJson = JSON.parse(schemaMatch[1].trim());
      assert(true, 'Schema.org JSON-LD is valid, error-free JSON syntax');
    } catch (err) {
      assert(false, 'Schema.org JSON-LD is valid JSON syntax', err.message);
    }

    if (schemaJson) {
      assert(schemaJson['@context'] === 'https://schema.org', 'Schema @context is "https://schema.org"');
      const graph = schemaJson['@graph'] || [schemaJson];
      const website = graph.find(item => item['@type'] === 'WebSite');
      const profilePage = graph.find(item => item['@type'] === 'ProfilePage');
      const person = graph.find(item => item['@type'] === 'Person');

      assert(website !== undefined, 'Schema graph contains WebSite entity');
      assert(profilePage !== undefined, 'Schema graph contains ProfilePage entity');
      assert(person !== undefined, 'Schema graph contains Person entity');

      if (person) {
        assert(person.name && person.name.length > 0, 'Person has "name" defined');
        assert(person.jobTitle && person.jobTitle.length > 0, 'Person has "jobTitle" defined');
        assert(person.url && person.url.startsWith('https://'), 'Person has valid "url"');
        assert(Array.isArray(person.sameAs) && person.sameAs.length >= 2, 'Person has "sameAs" profiles (GitHub, LinkedIn)');
        assert(Array.isArray(person.knowsAbout) && person.knowsAbout.length >= 5, 'Person has "knowsAbout" skill list');
        assert(person.image !== undefined, 'Person has "image" defined');
      }
    }
  }

  // --- 7. Semantic HTML Landmarks & Heading Hierarchy ---
  console.log('\n[7. Semantic HTML Landmarks & Heading Architecture]');
  const h1Matches = [...html.matchAll(/<h1\b[^>]*>(.*?)<\/h1>/gi)];
  assert(h1Matches.length === 1, `Document has exactly ONE <h1> tag (found ${h1Matches.length})`);
  if (h1Matches.length > 0) {
    const h1Text = h1Matches[0][1].replace(/<[^>]+>/g, '').trim();
    assert(h1Text.length > 5, `<h1> tag contains descriptive subject name: "${h1Text}"`);
  }

  // Check heading hierarchy: no skipped levels
  const allHeadings = [...html.matchAll(/<(h[1-6])\b[^>]*>(.*?)<\/\1>/gi)].map(m => parseInt(m[1].charAt(1), 10));
  let hierarchyValid = true;
  for (let i = 1; i < allHeadings.length; i++) {
    const prev = allHeadings[i - 1];
    const curr = allHeadings[i];
    if (curr > prev + 1) {
      hierarchyValid = false;
      break;
    }
  }
  assert(hierarchyValid, 'Heading hierarchy has no skipped levels (e.g. h1 -> h2 -> h3)');

  // Landmark tags
  assert(/<header\b[^>]*role=["']banner["']|<header\b/i.test(html), 'Has semantic <header> landmark');
  assert(/<main\b[^>]*id=["']main-content["']/i.test(html), 'Has semantic <main id="main-content"> landmark');
  assert(/<a\b[^>]*href=["']#main-content["']/i.test(html), 'Has accessible "Skip to content" link targeting #main-content');
  assert(/<nav\b/i.test(html), 'Has semantic <nav> navigation landmark');

  // --- 8. Core Web Vitals & Image Optimization ---
  console.log('\n[8. Core Web Vitals & Image Dimensions]');
  const imgMatches = [...html.matchAll(/<img\b([^>]*)>/gi)];
  assert(imgMatches.length > 0, `Document contains image(s) (found ${imgMatches.length})`);
  imgMatches.forEach((img, idx) => {
    const attrs = img[1];
    const hasAlt = /alt=["'][^"']+["']/i.test(attrs);
    const hasWidth = /width=["']\d+["']/i.test(attrs);
    const hasHeight = /height=["']\d+["']/i.test(attrs);
    assert(hasAlt, `Image #${idx + 1} has non-empty alt attribute`);
    assert(hasWidth && hasHeight, `Image #${idx + 1} has explicit width & height to eliminate CLS (Cumulative Layout Shift)`);
  });

  // --- 9. Links & Security ---
  console.log('\n[9. Link Health & Security]');
  const externalLinks = [...html.matchAll(/<a\b[^>]*href=["'](https?:\/\/[^"']*)["'][^>]*>/gi)];
  assert(externalLinks.length > 0, `Document has outbound external links (found ${externalLinks.length})`);

  // --- 10. Favicons & Theme Integration ---
  console.log('\n[10. Favicon & Mobile Theme Integration]');
  assert(/<link\s+rel=["']icon["']\s+type=["']image\/svg\+xml["']/i.test(html), 'Has SVG vector favicon linked');
  assert(/<link\s+rel=["']alternate icon["']/i.test(html), 'Has fallback favicon linked');
  assert(/<link\s+rel=["']apple-touch-icon["']/i.test(html), 'Has apple-touch-icon linked');
  assert(/<meta\s+name=["']theme-color["']\s+media=["']\(prefers-color-scheme:\s*light\)["']/i.test(html), 'Has light theme-color meta tag');
  assert(/<meta\s+name=["']theme-color["']\s+media=["']\(prefers-color-scheme:\s*dark\)["']/i.test(html), 'Has dark theme-color meta tag');
}

function testDiscoveryAssets() {
  console.log(`\n======================================================`);
  console.log(`Testing Discovery Assets (robots.txt, sitemap.xml, favicon.svg)`);
  console.log(`======================================================`);

  // 1. robots.txt
  const robotsPath = path.join(ROOT_DIR, 'robots.txt');
  assert(fs.existsSync(robotsPath), 'robots.txt file exists in root');
  if (fs.existsSync(robotsPath)) {
    const robots = fs.readFileSync(robotsPath, 'utf8');
    assert(/User-agent:\s*\*/i.test(robots), 'robots.txt allows all user agents (User-agent: *)');
    assert(/Allow:\s*\//i.test(robots), 'robots.txt permits crawling (Allow: /)');
    assert(/Sitemap:\s*https:\/\/tuquet\.github\.io\/sitemap\.xml/i.test(robots), 'robots.txt specifies canonical sitemap.xml location');
  }

  // 2. sitemap.xml
  const sitemapPath = path.join(ROOT_DIR, 'sitemap.xml');
  assert(fs.existsSync(sitemapPath), 'sitemap.xml file exists in root');
  if (fs.existsSync(sitemapPath)) {
    const sitemap = fs.readFileSync(sitemapPath, 'utf8');
    assert(/<\?xml\b/i.test(sitemap), 'sitemap.xml has valid XML declaration');
    assert(/<urlset\b/i.test(sitemap), 'sitemap.xml has valid <urlset> root tag');
    assert(/xmlns:xhtml=["']http:\/\/www\.w3\.org\/1999\/xhtml["']/i.test(sitemap), 'sitemap.xml has xhtml namespace for multilingual hreflang');
    assert(/<loc>https:\/\/tuquet\.github\.io\/<\/loc>/i.test(sitemap), 'sitemap.xml indexes English root URL (https://tuquet.github.io/)');
    assert(/<loc>https:\/\/tuquet\.github\.io\/vi\/<\/loc>/i.test(sitemap), 'sitemap.xml indexes Vietnamese URL (https://tuquet.github.io/vi/)');
    assert(/<xhtml:link\s+rel=["']alternate["']\s+hreflang=["']en["']/i.test(sitemap), 'sitemap.xml declares hreflang="en" alternates');
    assert(/<xhtml:link\s+rel=["']alternate["']\s+hreflang=["']vi["']/i.test(sitemap), 'sitemap.xml declares hreflang="vi" alternates');
  }

  // 3. favicon.svg
  const faviconPath = path.join(ROOT_DIR, 'favicon.svg');
  assert(fs.existsSync(faviconPath), 'favicon.svg file exists in root');
  if (fs.existsSync(faviconPath)) {
    const svg = fs.readFileSync(faviconPath, 'utf8');
    assert(/<svg\b/i.test(svg), 'favicon.svg has valid <svg> root element');
    assert(/viewBox=/i.test(svg), 'favicon.svg defines viewBox');
    assert(/prefers-color-scheme:\s*dark/i.test(svg), 'favicon.svg dynamically adapts to light/dark system themes');
  }
}

// Run test suite
console.log('Starting Automated SEO & Web Quality Audit Suite...\n');

testDiscoveryAssets();

testHtmlFile(path.join(ROOT_DIR, 'index.html'), {
  lang: 'en',
  canonicalUrl: 'https://tuquet.github.io/',
  locale: 'en_US',
  altLocale: 'vi_VN'
});

testHtmlFile(path.join(ROOT_DIR, 'vi', 'index.html'), {
  lang: 'vi',
  canonicalUrl: 'https://tuquet.github.io/vi/',
  locale: 'vi_VN',
  altLocale: 'en_US'
});

console.log(`\n======================================================`);
console.log(`TEST SUITE SUMMARY REPORT:`);
console.log(`======================================================`);
console.log(`Total Checks Run: ${totalTests}`);
console.log(`Passed:           ${passedTests}`);
console.log(`Failed:           ${failedTests}`);

if (failedTests === 0) {
  console.log(`\n🎉 ALL TESTS PASSED! 100% SEO & WEB STANDARDS COMPLIANT! 🎉\n`);
  process.exit(0);
} else {
  console.error(`\n❌ ${failedTests} TEST(S) FAILED:\n`);
  failures.forEach((f, i) => console.error(`${i + 1}. ${f.message} ${f.details ? '[' + f.details + ']' : ''}`));
  process.exit(1);
}
