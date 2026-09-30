/**
 * Automated Web Pipeline Injector
 * Takes raw HTML from markdown-pdf and injects standalone web enhancements
 * (Dark mode, Lens switcher, AI Copilot, Toast, Reading Progress)
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const TARGETS = [
  {
    lang: 'en',
    inputFile: path.join(ROOT_DIR, 'README.html'),
    outputFile: path.join(ROOT_DIR, 'index.html'),
    relPrefix: './',
    pdfFile: './README.pdf',
    otherLangText: 'Tiếng Việt',
    otherLangLink: './vi/',
    currentLangText: 'English',
    title: 'Toby Nguyen (Nguyễn Đình Tú) | Technical Project Lead & Senior Software Engineer',
    desc: 'Technical Lead & Senior Software Engineer specializing in distributed systems, real-time data streaming, and AI-augmented workflows.',
    pdfBtnText: 'Download PDF',
    copilotBtnText: "Ask Toby",
    themeBtnText: 'Dark',
    lenses: [
      { key: 'all', text: 'All' },
      { key: 'frontend', text: 'Frontend' },
      { key: 'backend', text: 'Backend' },
      { key: 'leadership', text: 'Leadership' }
    ],
    chips: [
      { text: 'Top 3 Achievements', q: 'summary' },
      { text: 'Digital Twin Architecture', q: 'digital twin' },
      { text: 'Tuquet Zombie Process Fix', q: 'tuquet' },
      { text: '15+ Engineers Leadership', q: 'lead' },
      { text: 'Core Tech Stack', q: 'stack' }
    ]
  },
  {
    lang: 'vi',
    inputFile: path.join(ROOT_DIR, 'vi', 'README.html'),
    outputFile: path.join(ROOT_DIR, 'vi', 'index.html'),
    relPrefix: '../',
    pdfFile: './README.pdf',
    otherLangText: 'English',
    otherLangLink: '../',
    currentLangText: 'Tiếng Việt',
    title: 'Nguyễn Đình Tú (Toby Nguyen) | Kỹ sư Trưởng & Kỹ sư Phần mềm Cao cấp',
    desc: 'Technical Lead & Senior Software Engineer với tư duy Product-first, chuyên sâu về hệ thống phân tán và quy trình AI.',
    pdfBtnText: 'Tải CV (PDF)',
    copilotBtnText: "Hỏi Toby",
    themeBtnText: 'Tối',
    lenses: [
      { key: 'all', text: 'Tất cả' },
      { key: 'frontend', text: 'Frontend' },
      { key: 'backend', text: 'Backend' },
      { key: 'leadership', text: 'Kĩ năng lãnh đạo' }
    ],
    chips: [
      { text: 'Thế mạnh & Thành tựu', q: 'summary' },
      { text: 'Kiến trúc Digital Twin', q: 'digital twin' },
      { text: 'Xử lý Zombie Process Tuquet', q: 'tuquet' },
      { text: 'Quản lý team 15+ devs', q: 'lead' },
      { text: 'Kỹ năng công nghệ', q: 'stack' }
    ]
  }
];

function processTarget(target) {
  if (!fs.existsSync(target.inputFile)) {
    console.warn(`[WARN] Input file not found: ${target.inputFile}`);
    return;
  }

  let html = fs.readFileSync(target.inputFile, 'utf-8');

  // 1. Fix hardcoded file:// links if any
  html = html.replace(/href=["']file:\/\/[^"']*pdf-export\.css["']/gi, `href="${target.relPrefix}style/pdf-export.css"`);

  // Remove unused Mermaid script if no diagram exists (prevents file:// iframe sandbox warnings and saves 2MB)
  if (!html.includes('class="mermaid"')) {
    html = html.replace(/<script src="https:\/\/unpkg\.com\/mermaid[^"]*"><\/script>\s*/i, '');
    html = html.replace(/<script>\s*mermaid\.initialize\(\{[\s\S]*?\}\);\s*<\/script>\s*/i, '');
  }

  // 2. Head Enhancements (Viewport, Meta, Schema, Stylesheet)
  const headInject = `
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="${target.desc}">
<link rel="stylesheet" href="${target.relPrefix}web/web-enhancements.css">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Nguyen Dinh Tu (Toby Nguyen)",
  "jobTitle": "Technical Project Lead & Senior Software Engineer",
  "url": "https://tuquet.github.io/",
  "sameAs": [
    "https://github.com/tuquet",
    "https://www.linkedin.com/in/tuquet"
  ],
  "knowsAbout": ["Distributed Systems", "Rust", "Java", "Spring Boot", "Node.js", "React", "Next.js", "AI-Augmented Workflows", "Telemetry Streaming", "System Architecture"]
}
</script>
`;

  // Set HTML lang attribute
  html = html.replace(/<html[^>]*>/i, `<html lang="${target.lang}">`);

  // Update Title
  html = html.replace(/<title>.*?<\/title>/i, `<title>${target.title}</title>`);

  // Inject into Head if not already injected
  if (!html.includes('web-enhancements.css')) {
    html = html.replace('</head>', `${headInject}\n</head>`);
  }

  // 3. Top Action Bar Component
  const lensButtonsHtml = target.lenses
    .map((l, idx) => `<button class="btn-lens${idx === 0 ? ' active' : ''}" data-lens="${l.key}">${l.text}</button>`)
    .join('\n      ');

  const topBarHtml = `
<div id="reading-progress"></div>
<header class="web-top-bar">
  <div class="nav-left">
    <span class="lang-switch">
      ${target.lang === 'en' 
        ? `<strong>${target.currentLangText}</strong> &nbsp;|&nbsp; <a href="${target.otherLangLink}">${target.otherLangText}</a>`
        : `<a href="${target.otherLangLink}">${target.otherLangText}</a> &nbsp;|&nbsp; <strong>${target.currentLangText}</strong>`
      }
    </span>
  </div>
  <div class="nav-center">
    <div class="lens-group" role="group" aria-label="Lens Filter">
      ${lensButtonsHtml}
    </div>
  </div>
  <div class="nav-right">
    <button id="theme-toggle" class="btn-theme" aria-label="Toggle Dark/Light Mode" title="Toggle theme">${target.themeBtnText}</button>
    <a href="${target.pdfFile}" download class="btn-pdf">${target.pdfBtnText}</a>
  </div>
</header>
`;

  // Replace existing nav-bar or initial centered switcher
  const navRegex = /<div class="nav-bar no-print">[\s\S]*?<\/div>|<div align="center" class="no-print">[\s\S]*?<\/div>/i;
  if (navRegex.test(html)) {
    html = html.replace(navRegex, topBarHtml);
  } else if (html.includes('<header class="web-top-bar')) {
    html = html.replace(/<div id="reading-progress"><\/div>\s*<header class="web-top-bar[\s\S]*?<\/header>/i, topBarHtml);
  }

  // 4. AI Copilot Widget Component
  const chipsHtml = target.chips
    .map(c => `<button class="copilot-chip" data-q="${c.q}">${c.text}</button>`)
    .join('\n');

  const copilotHtml = `
<!-- Ask Toby Widget -->
<button id="copilot-trigger" class="copilot-trigger" aria-label="${target.copilotBtnText}">
  ${target.copilotBtnText}
</button>

<div id="copilot-panel" class="copilot-panel" role="dialog" aria-label="${target.copilotBtnText}">
  <div class="copilot-header">
    <div class="copilot-header-title">
      ${target.copilotBtnText}
    </div>
    <button id="copilot-close" class="copilot-close">${target.lang === 'en' ? 'Close' : 'Đóng'}</button>
  </div>
  <div id="copilot-body" class="copilot-body">
    <div class="copilot-msg bot">
      ${target.lang === 'en' 
        ? "Hello! I am Toby's AI. Ask me anything about his 8+ years leading distributed systems, PLG achievements, or system architecture!"
        : "Xin chào! Tôi là AI của Toby. Bạn có thể hỏi tôi bất cứ điều gì về năng lực kỹ thuật, kinh nghiệm lead 15+ kỹ sư hay kiến trúc hệ thống!"
      }
    </div>
  </div>
  <div class="copilot-chips">
    ${chipsHtml}
  </div>
  <div class="copilot-footer">
    <input id="copilot-input" class="copilot-input" type="text" placeholder="${target.lang === 'en' ? 'Ask a question...' : 'Nhập câu hỏi...'}">
    <button id="copilot-send" class="copilot-send">${target.lang === 'en' ? 'Send' : 'Gửi'}</button>
  </div>
</div>

<div id="toast-container"></div>
<script src="${target.relPrefix}web/web-copilot.js" defer></script>
`;

  // Inject before </body>
  if (!html.includes('id="copilot-trigger"')) {
    html = html.replace('</body>', `${copilotHtml}\n</body>`);
  } else {
    // Replace existing widget if already there
    html = html.replace(/<!-- Toby's AI Copilot Widget -->[\s\S]*?<script src="[^"]*web-copilot\.js"[^>]*><\/script>/i, copilotHtml);
  }

  // Write out to index.html
  fs.writeFileSync(target.outputFile, html, 'utf-8');
  console.log(`[SUCCESS] Processed: ${path.relative(ROOT_DIR, target.inputFile)} -> ${path.relative(ROOT_DIR, target.outputFile)}`);
}

TARGETS.forEach(processTarget);
console.log('All targets successfully injected!');
