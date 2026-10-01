/**
 * Automated Web Pipeline Injector & Technical SEO Engine
 * Takes raw HTML from markdown-pdf and injects standalone web enhancements
 * (Technical SEO, Open Graph, Twitter Cards, Schema.org JSON-LD,
 * Semantic H1/Landmarks, Dark mode, Lens switcher, AI Copilot, Toast, Reading Progress)
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const TARGETS = [
  {
    lang: 'en',
    locale: 'en_US',
    altLocale: 'vi_VN',
    canonicalUrl: 'https://tuquet.github.io/',
    inputFile: path.join(ROOT_DIR, 'README.html'),
    outputFile: path.join(ROOT_DIR, 'index.html'),
    relPrefix: './',
    pdfFile: './README.pdf',
    otherLangText: 'Tiếng Việt',
    otherLangLink: './vi/',
    currentLangText: 'English',
    personName: 'Toby Nguyen (Nguyễn Đình Tú)',
    title: 'Toby Nguyen (Nguyễn Đình Tú) | Technical Project Lead & Senior Software Engineer',
    desc: 'Technical Lead & Senior Software Engineer specializing in distributed systems, real-time data streaming, high-scale web apps, and AI-augmented workflows.',
    keywords: 'Toby Nguyen, Nguyen Dinh Tu, Technical Lead, Senior Software Engineer, Distributed Systems, Rust, Tokio, Java, Spring Boot, Node.js, React, Next.js, AI Workflows, Digital Twin, Real-Time Telemetry, Tuquet',
    skipText: 'Skip to main content',
    downloadLabel: 'Download Resume',
    downloadHeader: 'Export Formats',
    pdfOptionLabel: 'PDF Document',
    printOptionLabel: 'Print / Save as PDF',
    copilotBtnText: "Ask Toby AI",
    copilotBadge: "AI",
    copilotHeaderTitle: "Toby AI Assistant",
    copilotSubtitle: "Distributed systems, architecture & role fit",
    welcomeMsg: "<span id=\"copilot-greeting-text\">Hello.</span> I am Toby's AI assistant. Ask any question regarding his 8+ years leading distributed systems, technical architecture, or role suitability.<br/><br/><strong>Topics you can explore:</strong><br/>• <strong>Executive Summary:</strong> Core strengths & leadership overview<br/>• <strong>Role Fit Check:</strong> Suitability for Tech Lead, Architect, or Senior Engineer<br/>• <strong>Real-Time Telemetry (EV):</strong> 15+ engineers, real-time telemetry streaming<br/>• <strong>High-Scale Web & Booking:</strong> High-traffic web & webview portals for premier theme park enterprise<br/>• <strong>Tuquet Engine:</strong> Zero-leakage process supervision in Rust<br/>• <strong>Tech Stack & Contact:</strong> Direct interview scheduling",
    themeBtnTitle: 'Toggle Dark / Light Mode',
    backToTopTitle: 'Back to top',
    lenses: [
      { key: 'all', text: 'All' },
      { key: 'frontend', text: 'Frontend' },
      { key: 'backend', text: 'Backend' },
      { key: 'leadership', text: 'Leadership' }
    ],
    chips: [
      { text: 'Executive Summary', q: 'summary' },
      { text: 'Role Fit & Scope', q: 'fit' },
      { text: 'Real-Time Telemetry (EV)', q: 'telemetry' },
      { text: 'High-Scale Web & Booking', q: 'portal' },
      { text: 'Rust Process Engine', q: 'tuquet' },
      { text: 'Core Tech Stack', q: 'stack' },
      { text: 'Contact & Availability', q: 'contact' }
    ]
  },
  {
    lang: 'vi',
    locale: 'vi_VN',
    altLocale: 'en_US',
    canonicalUrl: 'https://tuquet.github.io/vi/',
    inputFile: path.join(ROOT_DIR, 'vi', 'README.html'),
    outputFile: path.join(ROOT_DIR, 'vi', 'index.html'),
    relPrefix: '../',
    pdfFile: './README.pdf',
    otherLangText: 'English',
    otherLangLink: '../',
    currentLangText: 'Tiếng Việt',
    personName: 'Nguyễn Đình Tú (Toby Nguyen)',
    title: 'Nguyễn Đình Tú (Toby Nguyen) | Kỹ sư Trưởng & Kỹ sư Phần mềm Cao cấp',
    desc: 'Hồ sơ năng lực của Nguyễn Đình Tú (Toby Nguyen) - Kỹ sư Trưởng & Kỹ sư Phần mềm Cao cấp chuyên sâu về hệ thống phân tán, luồng dữ liệu thời gian thực và AI.',
    keywords: 'Nguyễn Đình Tú, Toby Nguyen, Kỹ sư Trưởng, Kỹ sư Phần mềm Cao cấp, Hệ thống phân tán, Rust, Tokio, Java, Spring Boot, Node.js, React, Next.js, Tuquet',
    skipText: 'Chuyển đến nội dung chính',
    downloadLabel: 'Tải CV / Hồ sơ',
    downloadHeader: 'Định dạng xuất',
    pdfOptionLabel: 'Bản PDF',
    printOptionLabel: 'In / Lưu PDF',
    copilotBtnText: "Hỏi Toby AI",
    copilotBadge: "AI",
    copilotHeaderTitle: "Trợ lý AI Toby",
    copilotSubtitle: "Kiến trúc hệ thống, kinh nghiệm lead & độ phù hợp",
    welcomeMsg: "<span id=\"copilot-greeting-text\">Xin chào.</span> Tôi là trợ lý AI của Toby Nguyen. Bạn có thể tra cứu nhanh về 8+ năm kinh nghiệm kiến trúc hệ thống phân tán, năng lực lãnh đạo kỹ thuật hoặc độ phù hợp vị trí.<br/><br/><strong>Các chủ đề gợi ý:</strong><br/>• <strong>Tóm tắt năng lực:</strong> Tổng quan thế mạnh và kinh nghiệm điều phối<br/>• <strong>Độ phù hợp vị trí:</strong> Đánh giá cho vai trò Tech Lead, Architect hoặc Senior Engineer<br/>• <strong>Telemetry thời gian thực (EV):</strong> Quản lý 15+ kỹ sư, streaming WebSockets<br/>• <strong>Nền tảng Web & Đặt vé Trực tuyến:</strong> Hệ thống Web Portal & WebView cho tập đoàn công viên giải trí quốc tế<br/>• <strong>Kiến trúc Tuquet:</strong> Giám sát tiến trình không rò rỉ bằng Rust & Win32<br/>• <strong>Kỹ năng & Liên hệ:</strong> Lên lịch phỏng vấn và trao đổi trực tiếp",
    themeBtnTitle: 'Chuyển đổi giao diện Sáng / Tối',
    backToTopTitle: 'Về đầu trang',
    lenses: [
      { key: 'all', text: 'Tất cả' },
      { key: 'frontend', text: 'Frontend' },
      { key: 'backend', text: 'Backend' },
      { key: 'leadership', text: 'Lãnh đạo' }
    ],
    chips: [
      { text: 'Tóm tắt năng lực', q: 'summary' },
      { text: 'Độ phù hợp vị trí', q: 'fit' },
      { text: 'Telemetry thời gian thực (EV)', q: 'telemetry' },
      { text: 'Nền tảng Web & Đặt vé', q: 'portal' },
      { text: 'Kiến trúc Tuquet & Rust', q: 'tuquet' },
      { text: 'Hệ thống công nghệ', q: 'stack' },
      { text: 'Liên hệ phỏng vấn', q: 'contact' }
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

  // Remove README redirect script if present in raw html
  html = html.replace(/<script>\s*if\s*\(window\.location\.protocol\.startsWith\('http'\)[\s\S]*?<\/script>\s*/i, '');

  // Remove unused Mermaid script if no diagram exists (prevents file:// iframe sandbox warnings and saves 2MB)
  if (!html.includes('class="mermaid"')) {
    html = html.replace(/<script src="https:\/\/unpkg\.com\/mermaid[^"]*"><\/script>\s*/i, '');
    html = html.replace(/<script>\s*mermaid\.initialize\(\{[\s\S]*?\}\);\s*<\/script>\s*/i, '');
  }

  // Clean form template artifact asterisks (* inside strong tags)
  html = html.replace(/\s*\*(\))<\/strong>/g, '$1</strong>');
  html = html.replace(/\s*\*<\/strong>/g, '</strong>');

  // Wrap all tables in a responsive 100% width container if not already wrapped
  html = html.replace(/<div class="table-container\b[^>]*>/gi, '<div class="table-container w-full my-4">');
  if (!html.includes('class="table-container"')) {
    html = html.replace(/<table\b([^>]*)>/gi, '<div class="table-container w-full my-4"><table$1>');
    html = html.replace(/<\/table>/gi, '</table></div>');
  }

  // Enhance project headings and wrap each project in <section class="project-section"> for container-bounded sticky behavior
  html = html.replace(/(<h3>\s*\[(.*?)\]\s*(.*?)<\/h3>)([\s\S]*?)(?=(?:<h3>|<hr\b|<h2>|$))/gi, (match, h3Tag, date, title, restOfContent) => {
    const cleanDate = date.trim();
    return `<section class="project-section">\n<h3 class="project-heading" data-timeline="${cleanDate}"><span class="project-date-badge">[${cleanDate}]</span> <span class="project-title">${title}</span></h3>${restOfContent}\n</section>\n`;
  });

  // 2. Head Enhancements (SEO, Social, Viewport, Meta, Schema, Tailwind CDN, Stylesheet, Dark Mode Anti-FOUC)
  const headInject = `
<!-- Technical SEO & Meta Tags -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="description" content="${target.desc}">
<meta name="keywords" content="${target.keywords}">
<meta name="author" content="Nguyen Dinh Tu (Toby Nguyen)">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">

<!-- Canonical URL & Multilingual Hreflang Alternates -->
<link rel="canonical" href="${target.canonicalUrl}">
<link rel="alternate" hreflang="en" href="https://tuquet.github.io/">
<link rel="alternate" hreflang="vi" href="https://tuquet.github.io/vi/">
<link rel="alternate" hreflang="x-default" href="https://tuquet.github.io/">

<!-- Favicon & Mobile Icons -->
<link rel="icon" type="image/svg+xml" href="${target.relPrefix}favicon.svg">
<link rel="alternate icon" href="${target.relPrefix}favicon.ico">
<link rel="apple-touch-icon" href="${target.relPrefix}favicon.svg">

<!-- Adaptive Theme Color & Color Scheme -->
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#fafafa">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#09090b">
<meta name="color-scheme" content="light dark">

<!-- Open Graph Protocol (Facebook, LinkedIn, Zalo, Discord) -->
<meta property="og:site_name" content="Toby Nguyen | Technical Lead & Senior Software Engineer">
<meta property="og:type" content="profile">
<meta property="og:title" content="${target.title}">
<meta property="og:description" content="${target.desc}">
<meta property="og:url" content="${target.canonicalUrl}">
<meta property="og:image" content="https://avatars.githubusercontent.com/u/20990824?v=4">
<meta property="og:image:secure_url" content="https://avatars.githubusercontent.com/u/20990824?v=4">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="460">
<meta property="og:image:height" content="460">
<meta property="og:image:alt" content="${target.personName} Profile Avatar">
<meta property="og:locale" content="${target.locale}">
<meta property="og:locale:alternate" content="${target.altLocale}">
<meta property="profile:first_name" content="Tu">
<meta property="profile:last_name" content="Nguyen">
<meta property="profile:username" content="tuquet">
<meta property="profile:gender" content="male">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary">
<meta name="twitter:site" content="@tuquet">
<meta name="twitter:creator" content="@tuquet">
<meta name="twitter:title" content="${target.title}">
<meta name="twitter:description" content="${target.desc}">
<meta name="twitter:image" content="https://avatars.githubusercontent.com/u/20990824?v=4">
<meta name="twitter:image:alt" content="${target.personName} Profile Avatar">

<!-- Resource Hints & Preconnect -->
<link rel="preconnect" href="https://avatars.githubusercontent.com">
<link rel="preconnect" href="https://cdn.tailwindcss.com">
<link rel="dns-prefetch" href="https://avatars.githubusercontent.com">
<link rel="dns-prefetch" href="https://cdn.tailwindcss.com">

<!-- Theme Detection Anti-FOUC -->
<script>
  (function() {
    try {
      var saved = localStorage.getItem('tuquet-theme');
      var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      var theme = saved || (prefersDark ? 'dark' : 'light');
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch(e) {}
  })();
</script>
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    corePlugins: {
      preflight: false,
    },
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          brand: {
            50: '#fafafa',
            100: '#f4f4f5',
            200: '#e4e4e7',
            300: '#d4d4d8',
            400: '#a1a1aa',
            500: '#71717a',
            600: '#52525b',
            700: '#3f3f46',
            800: '#27272a',
            900: '#18181b',
            950: '#09090b',
          }
        }
      }
    }
  }
</script>
<link rel="stylesheet" href="${target.relPrefix}web/web-enhancements.css">

<!-- Structured Data (Schema.org JSON-LD Rich Snippets) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://tuquet.github.io/#website",
      "url": "https://tuquet.github.io/",
      "name": "Toby Nguyen - Professional Profile & Engineering Portfolio",
      "description": "Technical Project Lead & Senior Software Engineer portfolio specializing in distributed systems, real-time telemetry streaming, and AI-augmented workflows.",
      "inLanguage": ["en", "vi"]
    },
    {
      "@type": "ProfilePage",
      "@id": "${target.canonicalUrl}#webpage",
      "url": "${target.canonicalUrl}",
      "name": ${JSON.stringify(target.title)},
      "description": ${JSON.stringify(target.desc)},
      "isPartOf": { "@id": "https://tuquet.github.io/#website" },
      "mainEntity": { "@id": "https://tuquet.github.io/#person" },
      "inLanguage": "${target.lang}"
    },
    {
      "@type": "Person",
      "@id": "https://tuquet.github.io/#person",
      "name": "Nguyen Dinh Tu",
      "alternateName": ["Toby Nguyen", "Nguyen Dinh Tu (Toby Nguyen)", "tuquet"],
      "givenName": "Tu",
      "familyName": "Nguyen",
      "jobTitle": "Technical Project Lead & Senior Software Engineer",
      "url": "https://tuquet.github.io/",
      "image": {
        "@type": "ImageObject",
        "url": "https://avatars.githubusercontent.com/u/20990824?v=4",
        "caption": "Toby Nguyen"
      },
      "email": "mailto:tunyk.93@gmail.com",
      "telephone": "+84936683088",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Ha Noi",
        "addressRegion": "Ha Dong",
        "addressCountry": "VN"
      },
      "sameAs": [
        "https://github.com/tuquet",
        "https://www.linkedin.com/in/tuquet",
        "https://www.npmjs.com/org/tuquet"
      ],
      "knowsAbout": [
        "Distributed Systems",
        "Rust Programming",
        "Tokio Async Concurrency",
        "Java",
        "Spring Boot Framework",
        "Node.js",
        "TypeScript",
        "React",
        "Next.js",
        "Micro-frontends",
        "Real-time Telemetry Streaming",
        "WebSockets",
        "Server-Sent Events",
        "AI-Augmented Engineering Workflows",
        "System Architecture",
        "Core Web Vitals Optimization"
      ]
    }
  ]
}
</script>
`;

  // Set HTML lang attribute and canvas background
  html = html.replace(/<html[^>]*>/i, `<html lang="${target.lang}" class="scroll-smooth bg-zinc-50 dark:bg-zinc-950">`);

  // Set standard Tailwind classes on <body> to ensure unified breakpoints across the layout
  const bodyClasses = "max-w-[900px] m-0 p-4 md:my-9 md:mx-auto md:py-[44px] md:px-[52px] rounded-[10px] md:rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm md:shadow-lg transition-colors duration-200 text-base leading-relaxed tracking-tight";
  html = html.replace(/<body[^>]*>/i, `<body class="${bodyClasses}">`);

  // Remove old charset meta if any
  html = html.replace(/<meta http-equiv=["']Content-type["'][^>]*>\s*/i, '');

  // Update Title
  html = html.replace(/<title>.*?<\/title>/i, `<title>${target.title}</title>`);

  // Inject into Head if not already injected
  if (!html.includes('web-enhancements.css')) {
    html = html.replace('</head>', `${headInject}\n</head>`);
  }

  // 3. Top Action Bar & Accessible Landmarks Component
  const lensButtonsHtml = target.lenses
    .map((l, idx) => `<button class="btn-lens inline-flex items-center px-2.5 py-1 rounded-full text-xs md:text-[13px] font-medium cursor-pointer transition-all whitespace-nowrap${idx === 0 ? ' active' : ''}" data-lens="${l.key}">${l.text}</button>`)
    .join('\n      ');

  const topBarHtml = `
<a href="#main-content" class="skip-to-content">${target.skipText}</a>
<div id="reading-progress"></div>
<header class="web-top-bar flex flex-wrap items-center justify-between gap-2.5 mb-6 text-xs transition-colors" role="banner">
  <nav class="nav-left order-1 flex items-center" aria-label="Language">
    <div class="lang-switch inline-flex items-center p-0.5 bg-zinc-200/70 dark:bg-zinc-800/80 border border-zinc-300/60 dark:border-zinc-700/60 rounded-lg text-xs md:text-[13px] font-medium shadow-xs">
      ${target.lang === 'en' 
        ? `<span class="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white font-semibold shadow-xs">EN</span>
           <a href="${target.otherLangLink}" class="px-2 py-0.5 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all duration-200 no-underline" title="Tiếng Việt">VI</a>`
        : `<a href="${target.otherLangLink}" class="px-2 py-0.5 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all duration-200 no-underline" title="English">EN</a>
           <span class="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white font-semibold shadow-xs">VI</span>`
      }
    </div>
  </nav>
  <nav class="nav-center order-3 md:order-2 w-full md:w-auto mt-2 md:mt-0 flex justify-center" aria-label="Lens Filter">
    <div class="lens-group flex flex-wrap items-center justify-center gap-1.5 md:gap-2" role="group">
      ${lensButtonsHtml}
    </div>
  </nav>
  <div class="nav-right order-2 md:order-3 flex items-center gap-2">
    <button id="theme-toggle" class="btn-theme w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg text-zinc-700 dark:text-zinc-300 bg-zinc-200/70 dark:bg-zinc-800/80 border border-zinc-300/60 dark:border-zinc-700/60 hover:bg-zinc-300/70 dark:hover:bg-zinc-700 hover:text-zinc-950 dark:hover:text-zinc-100 transition-all cursor-pointer shadow-xs" aria-label="${target.themeBtnTitle}" title="${target.themeBtnTitle}">
      <svg class="w-3.5 h-3.5 md:w-4 md:h-4 theme-icon-moon dark:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
      <svg class="w-3.5 h-3.5 md:w-4 md:h-4 theme-icon-sun hidden dark:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    </button>
    <div class="relative group inline-flex items-center" id="download-dropdown-container">
      <button id="download-toggle" class="btn-download w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg text-zinc-700 dark:text-zinc-300 bg-zinc-200/70 dark:bg-zinc-800/80 border border-zinc-300/60 dark:border-zinc-700/60 hover:bg-zinc-300/70 dark:hover:bg-zinc-700 hover:text-zinc-950 dark:hover:text-zinc-100 transition-all cursor-pointer shadow-xs" aria-label="${target.downloadLabel}" title="${target.downloadLabel}" aria-haspopup="true" aria-expanded="false">
        <svg class="w-3.5 h-3.5 md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </button>
      <div id="download-menu" class="download-menu absolute right-0 top-full mt-2 w-48 p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 opacity-0 pointer-events-none -translate-y-1.5 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 transition-all duration-200 ease-out">
        <div class="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800/80 mb-1">
          ${target.downloadHeader}
        </div>
        <a href="${target.pdfFile}" download class="dropdown-item flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-white transition-colors no-underline !no-underline">
          <span>${target.pdfOptionLabel}</span>
          <span class="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">.pdf</span>
        </a>
        <button type="button" onclick="window.print()" class="dropdown-item w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer text-left">
          <span>${target.printOptionLabel}</span>
          <span class="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">Ctrl+P</span>
        </button>
      </div>
    </div>
  </div>
</header>
<main id="main-content" role="main" class="main-content">
`;

  // Replace existing nav-bar or initial centered switcher
  const navRegex = /<div class="nav-bar no-print">[\s\S]*?<\/div>|<div align="center" class="no-print">[\s\S]*?<\/div>/i;
  if (navRegex.test(html)) {
    html = html.replace(navRegex, topBarHtml);
  } else if (html.includes('<header class="web-top-bar')) {
    html = html.replace(/(?:<a href="#main-content"[^>]*>.*?<\/a>\s*)?<div id="reading-progress"><\/div>\s*<header class="web-top-bar[\s\S]*?<\/header>(?:\s*<main id="main-content"[^>]*>)?/i, topBarHtml);
  }

  // 4. Inject Semantic H1 Heading and Profile Avatar (Core Web Vitals & SEO)
  // Convert strong name element into semantic H1
  html = html.replace(/<strong style="font-size:1\.35em">(.*?)<\/strong>/gi, '<h1 class="profile-name">$1</h1>');

  const avatarHtml = `<div class="avatar-container flex justify-center my-3 md:my-4"><img src="https://avatars.githubusercontent.com/u/20990824?v=4" alt="${target.personName} Profile Avatar" width="96" height="96" loading="eager" decoding="async" class="profile-avatar w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-zinc-200 dark:border-zinc-800 shadow-md object-cover hover:scale-105 transition-transform duration-200"></div>`;
  if (!html.includes('class="profile-avatar"')) {
    html = html.replace(/(<div align="center">\s*)(<h1 class="profile-name">|<strong style="font-size:1\.35em">)/i, `$1${avatarHtml}\n\t$2`);
  } else {
    // Ensure avatar has explicit dimensions and alt
    html = html.replace(/<img\s+src="([^"]*avatars\.githubusercontent[^"]*)"\s+alt="[^"]*"\s+class="profile-avatar\b([^>]*)>/gi,
      '<img src="$1" alt="' + target.personName + ' Profile Avatar" width="96" height="96" loading="eager" decoding="async" class="profile-avatar$2>');
  }

  // 5. AI Copilot Widget Component & Close Main Landmark
  const chipsHtml = target.chips
    .map(c => `<button class="copilot-chip px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-zinc-700/80 rounded-md transition-colors cursor-pointer" data-q="${c.q}">${c.text}</button>`)
    .join('\n');

  const copilotHtml = `
</main>

<!-- Back to Top Floating Button -->
<button id="back-to-top" class="back-to-top fixed bottom-5 left-5 md:bottom-6 md:left-6 z-40 w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer opacity-0 pointer-events-none translate-y-3" aria-label="${target.backToTopTitle}" title="${target.backToTopTitle}">
  <svg class="w-4 h-4 md:w-4.5 md:h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 19V5M5 12l7-7 7 7"/>
  </svg>
</button>

<!-- Ask Toby Copilot Widget -->
<div id="copilot-widget-container" class="copilot-widget-container fixed bottom-5 right-5 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-2 pointer-events-none">
  <!-- Trigger Button (shadcn button zinc) -->
  <button id="copilot-trigger" class="copilot-trigger inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 border border-zinc-900 dark:border-zinc-100 shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer pointer-events-auto" aria-label="${target.copilotBtnText}">
    <svg class="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
    <span>${target.copilotBtnText}</span>
    <span class="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 dark:bg-zinc-200 dark:text-zinc-800">${target.copilotBadge}</span>
  </button>
</div>

<div id="copilot-panel" class="copilot-panel fixed bottom-16 md:bottom-20 right-4 md:right-6 w-[calc(100vw-32px)] md:w-[390px] h-[520px] max-h-[calc(100vh-100px)] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 flex flex-col overflow-hidden opacity-0 pointer-events-none transition-all duration-150 scale-95 translate-y-2" role="dialog" aria-label="${target.copilotHeaderTitle}">
  <div class="copilot-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
    <div class="flex items-center gap-2">
      <svg class="w-4 h-4 text-zinc-700 dark:text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      </svg>
      <div>
        <div class="copilot-header-title text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          ${target.copilotHeaderTitle}
        </div>
        <div class="text-xs text-zinc-500 dark:text-zinc-400">
          ${target.copilotSubtitle}
        </div>
      </div>
    </div>
    <button id="copilot-close" class="p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer" aria-label="Close">
      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
  </div>
  <div id="copilot-body" class="copilot-body flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-3 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300">
    <div id="copilot-welcome-msg" class="copilot-msg bot self-start max-w-[92%] p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 text-[13px]">
      ${target.welcomeMsg}
    </div>
  </div>
  <div class="copilot-chips shrink-0 flex flex-wrap gap-1.5 p-3 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/30">
    ${chipsHtml}
  </div>
  <div class="copilot-footer shrink-0 flex items-center gap-2 p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
    <input id="copilot-input" class="copilot-input flex-1 px-3 py-1.5 text-[13px] bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-300 transition-colors placeholder:text-zinc-400" type="text" placeholder="${target.lang === 'en' ? 'Ask a question...' : 'Nhập câu hỏi...'}">
    <button id="copilot-send" class="copilot-send px-3 py-1.5 text-[13px] font-medium text-zinc-50 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-md transition-colors cursor-pointer shadow-xs">${target.lang === 'en' ? 'Send' : 'Gửi'}</button>
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
    html = html.replace(/(?:<\/main>\s*)?(?:<!-- Back to Top Floating Button -->[\s\S]*?<\/button>\s*)?(?:<!-- Sticky Floating Chat-Box Timeline Pill -->[\s\S]*?<\/div>\s*)?<!-- (?:Toby's AI Copilot|Ask Toby|Ask Toby Copilot) Widget -->[\s\S]*?<script src="[^"]*web-copilot\.js"[^>]*><\/script>/i, copilotHtml);
  }

  // Write out to index.html
  fs.writeFileSync(target.outputFile, html, 'utf-8');
  console.log(`[SUCCESS] Processed: ${path.relative(ROOT_DIR, target.inputFile)} -> ${path.relative(ROOT_DIR, target.outputFile)}`);
}

TARGETS.forEach(processTarget);
console.log('All targets successfully injected!');
