/**
 * Toby Nguyen Portfolio - Web Enhancements & AI Copilot Script
 * Standalone client-side controller (Zero backend dependency)
 * Full Dual-Language Support (English & Vietnamese)
 */

(function () {
  'use strict';

  // Helper to detect current language
  const isVi = () => document.documentElement.lang === 'vi' || window.location.pathname.includes('/vi');

  // 1. Safe Storage Helper (handles file://, incognito, and Tracking Prevention)
  const SafeStorage = {
    mem: {},
    get(key) {
      try {
        return window.localStorage ? window.localStorage.getItem(key) : this.mem[key];
      } catch (e) {
        return this.mem[key] || null;
      }
    },
    set(key, val) {
      try {
        if (window.localStorage) window.localStorage.setItem(key, val);
      } catch (e) {
        this.mem[key] = val;
      }
    }
  };

  // 2. Theme Management (Dark / Light)
  const ThemeManager = {
    init() {
      const saved = SafeStorage.get('tuquet-theme');
      let prefersDark = false;
      try {
        prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      } catch (e) {}
      const theme = saved || (prefersDark ? 'dark' : 'light');
      this.set(theme);

      const toggleBtn = document.getElementById('theme-toggle');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          const current = document.documentElement.getAttribute('data-theme') || 'light';
          const next = current === 'dark' ? 'light' : 'dark';
          this.set(next);
        });
      }
    },
    set(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
      SafeStorage.set('tuquet-theme', theme);
      const toggleBtn = document.getElementById('theme-toggle');
      if (toggleBtn) {
        const vi = isVi();
        const label = theme === 'dark'
          ? (vi ? 'Chuyển sang giao diện Sáng' : 'Switch to Light Mode')
          : (vi ? 'Chuyển sang giao diện Tối' : 'Switch to Dark Mode');
        toggleBtn.title = label;
        toggleBtn.setAttribute('aria-label', label);
      }
    }
  };

  // 3. Reading Progress Indicator
  const ProgressIndicator = {
    init() {
      const bar = document.getElementById('reading-progress');
      if (!bar) return;
      window.addEventListener('scroll', () => {
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docH > 0 ? (window.scrollY / docH) * 100 : 0;
        bar.style.width = Math.min(100, Math.max(0, progress)) + '%';
      }, { passive: true });
    }
  };

  // 3b. Back to Top Controller (Clean & Sophisticated)
  const BackToTop = {
    init() {
      const btn = document.getElementById('back-to-top');
      if (!btn) return;

      const threshold = 350;
      let ticking = false;

      const update = () => {
        const scrolled = window.scrollY || document.documentElement.scrollTop || 0;
        if (scrolled > threshold) {
          btn.classList.add('visible');
        } else {
          btn.classList.remove('visible');
        }
        ticking = false;
      };

      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      }, { passive: true });

      btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const main = document.getElementById('main-content');
        if (main) {
          main.setAttribute('tabindex', '-1');
          main.focus({ preventScroll: true });
        }
      });

      update();
    }
  };

  // 3c. Sticky Top Bar Elevation Controller
  const StickyHeader = {
    init() {
      const header = document.querySelector('.web-top-bar');
      if (!header) return;

      let ticking = false;
      const update = () => {
        const scrolled = window.scrollY || document.documentElement.scrollTop || 0;
        if (scrolled > 15) {
          header.classList.add('is-scrolled');
        } else {
          header.classList.remove('is-scrolled');
        }
        ticking = false;
      };

      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      }, { passive: true });

      update();
    }
  };


  // 4. Toast Notifications & Quick Copy
  const Toast = {
    show(message) {
      let toast = document.getElementById('toast-container');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-container';
        toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 translate-y-24 opacity-0 pointer-events-none px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border border-zinc-800 dark:border-zinc-200 rounded-lg text-[13px] font-medium shadow-xl z-[100000] transition-all duration-200 [&.toast-visible]:translate-y-0 [&.toast-visible]:opacity-100';
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.classList.add('toast-visible');
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        toast.classList.remove('toast-visible');
      }, 2500);
    },
    init() {
      // Find email and phone in header to make click-to-copy
      const bodyText = document.body;
      const links = bodyText.querySelectorAll('a[href^="mailto:"], a[href^="tel:"]');
      links.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const text = link.textContent.trim();
          navigator.clipboard.writeText(text).then(() => {
            Toast.show(isVi() ? `Đã sao chép: ${text}` : `Copied to clipboard: ${text}`);
          });
        });
      });
    }
  };

  // 4b. Download Dropdown Menu Controller
  const DownloadDropdown = {
    init() {
      const container = document.getElementById('download-dropdown-container');
      const toggle = document.getElementById('download-toggle');
      const menu = document.getElementById('download-menu');
      if (!toggle || !menu) return;

      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menu.classList.contains('menu-open');
        if (isOpen) {
          menu.classList.remove('menu-open');
          toggle.setAttribute('aria-expanded', 'false');
        } else {
          menu.classList.add('menu-open');
          toggle.setAttribute('aria-expanded', 'true');
        }
      });

      menu.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('click', () => {
          menu.classList.remove('menu-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });

      document.addEventListener('click', (e) => {
        if (container && !container.contains(e.target)) {
          menu.classList.remove('menu-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.classList.contains('menu-open')) {
          menu.classList.remove('menu-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  };

  // 5. Lens Filter (All, Frontend, Backend, Leadership)
  const LensFilter = {
    init() {
      const buttons = document.querySelectorAll('.btn-lens');
      if (!buttons.length) return;

      const frontendKeywords = [
        'frontend', 'front-end', 'react', 'next.js', 'vue.js', 'vue', 'tailwind',
        'typescript', 'javascript', 'micro-frontends', 'module federation', 'vite',
        'core web vitals', 'webview', 'responsive', 'ui', 'ux', 'cro', 'fcp', 'lcp',
        'cls', 'design system', 'storybook', 'radix ui', 'css', 'html', 'giao diện',
        'tương tác', 'storefront', 'cross-browser'
      ];

      const backendKeywords = [
        'backend', 'back-end', 'rust', 'java', 'spring boot', 'spring data', 'spring security',
        'node.js', 'nestjs', 'express', 'win32 job objects', 'job object', 'supervision',
        'postgresql', 'supabase', 'redis', 'timescaledb', 'clickhouse', 'solr', 'mysql',
        'sqlite', 'websocket', 'sse', 'server-sent events', 'grpc', 'graphql', 'restful',
        'api', 'bff', 'real-time', 'realtime', 'telemetry', 'streaming', 'pub/sub',
        'concurrency', 'distributed', 'phân tán', 'hệ thống', 'crawler', 'pipeline',
        'tokio', 'ipc', 'microservices', 'caching', 'zombie'
      ];

      const leadershipKeywords = [
        'lead', 'leader', 'leading', 'leadership', 'squad', 'team', 'cpo', 'tech lead',
        'technical project lead', 'project leader', 'kỹ sư trưởng', 'quản lý', 'lãnh đạo',
        '15+', 'mentoring', 'mentored', 'rising star', 'chiến lược', 'plg', 'product-first',
        'competencies', 'năng lực', 'dẫn dắt', 'team of the year', 'outstanding employee',
        'cross-functional', 'điều phối', 'giao việc', 'định hướng', 'tổ chức', 'quy mô'
      ];

      const matchesKeyword = (text, keywords) => {
        return keywords.some(kw => {
          const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp('(^|[^a-zA-Z0-9_À-ỹ])' + escaped + '([^a-zA-Z0-9_À-ỹ]|$)', 'i');
          return regex.test(text);
        });
      };

      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          buttons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const mode = btn.getAttribute('data-lens');

          // Reset all lens classes
          document.querySelectorAll('.lens-dim, .lens-highlight').forEach(el => {
            el.classList.remove('lens-dim', 'lens-highlight');
          });

          if (mode === 'all') {
            return;
          }

          let kws = [];
          if (mode === 'frontend') kws = frontendKeywords;
          else if (mode === 'backend') kws = backendKeywords;
          else if (mode === 'leadership') kws = leadershipKeywords;

          // 1. Process leaf list items (bullet points)
          const allLis = document.querySelectorAll('li');
          allLis.forEach(li => {
            const hasSubList = li.querySelector('ul, ol');
            if (hasSubList) return; // Evaluated in step 2

            const text = li.textContent || '';
            if (matchesKeyword(text, kws)) {
              li.classList.add('lens-highlight');
            } else {
              li.classList.add('lens-dim');
            }
          });

          // 2. Process parent list items that have child lists (e.g. Responsibilities)
          allLis.forEach(li => {
            const hasSubList = li.querySelector('ul, ol');
            if (!hasSubList) return;

            const hasActiveChild = li.querySelector('li.lens-highlight');
            if (hasActiveChild) {
              li.classList.remove('lens-dim');
            } else {
              li.classList.add('lens-dim');
              // Prevent compounding opacity (double dimming) on nested li elements
              li.querySelectorAll('li').forEach(childLi => {
                childLi.classList.remove('lens-dim');
              });
            }
          });

          // 3. Process table rows in body
          const rows = document.querySelectorAll('tbody tr');
          rows.forEach(tr => {
            const text = tr.textContent || '';
            if (matchesKeyword(text, kws)) {
              tr.classList.add('lens-highlight');
            } else {
              tr.classList.add('lens-dim');
            }
          });

          // 4. Process career summary paragraphs (excluding centered bio headers)
          const paragraphs = document.querySelectorAll('p:not([align="center"])');
          paragraphs.forEach(p => {
            const text = p.textContent || '';
            if (matchesKeyword(text, kws)) {
              p.classList.add('lens-highlight');
            } else {
              p.classList.add('lens-dim');
            }
          });

          // 5. Process project headings (h3)
          const projectHeadings = document.querySelectorAll('h3');
          projectHeadings.forEach(h3 => {
            const text = h3.textContent || '';
            const nextEl = h3.nextElementSibling;
            const hasMatchingChild = nextEl && nextEl.tagName === 'UL' && nextEl.querySelector('li.lens-highlight');
            if (matchesKeyword(text, kws) || hasMatchingChild) {
              h3.classList.add('lens-highlight');
            } else {
              h3.classList.add('lens-dim');
            }
          });

          if (mode !== 'all') {
            KeywordMagic.triggerHighlighted();
          }
        });
      });
    }
  };

  // 6. Magic Keyword Scroll-Reveal & Ambient Gleam (Kiếm Phong Kim)
  const KeywordMagic = {
    init() {
      const candidates = document.querySelectorAll('p strong, li strong, td strong, blockquote strong');
      const keywords = [];

      const isLabel = (el) => {
        const text = el.textContent.trim();
        if (text.endsWith(':')) return true;

        const next = el.nextSibling;
        if (next && next.nodeType === Node.TEXT_NODE && next.textContent.trim().startsWith(':')) {
          return true;
        }

        const lower = text.toLowerCase().replace(/:$/, '').trim();
        const commonLabels = [
          'timeline', 'company', 'client', 'team size', 'project description',
          'responsibilities', 'programming language', 'framework',
          'platform, server and database', 'methodology', 'role', 'duration',
          'phone', 'email', 'location', 'date of birth', 'github', 'linkedin',
          'category', 'skill area', 'company name', 'position',
          'thời gian', 'công ty', 'khách hàng', 'quy mô team', 'mô tả dự án',
          'trách nhiệm chính', 'ngôn ngữ lập trình', 'nền tảng & cơ sở dữ liệu',
          'nền tảng, máy chủ và csdl', 'phương pháp phát triển', 'vai trò',
          'điện thoại', 'địa chỉ', 'ngày sinh', 'vị trí', 'kỹ năng'
        ];
        return commonLabels.includes(lower);
      };

      candidates.forEach(el => {
        if (!isLabel(el)) {
          el.classList.add('kw-magic');
          keywords.push(el);
        }
      });

      if (!keywords.length) return;

      // Intersection Observer with reading focus zone
      const observer = new IntersectionObserver((entries) => {
        const intersecting = entries.filter(e => e.isIntersecting && !e.target.dataset.kwTriggered);

        intersecting.forEach((entry, idx) => {
          const el = entry.target;
          el.dataset.kwTriggered = 'true';

          // Stagger animation across multiple keywords appearing together
          const delay = (idx % 5) * 140; // 0ms, 140ms, 280ms, 420ms, 560ms

          setTimeout(() => {
            el.classList.add('kw-active');

            const onEnd = () => {
              el.classList.remove('kw-active');
              el.removeEventListener('animationend', onEnd);
            };
            el.addEventListener('animationend', onEnd, { once: true });
          }, delay);
        });

        // Re-arm keywords when they leave the viewport for a short while
        entries.forEach(entry => {
          if (!entry.isIntersecting && entry.target.dataset.kwTriggered) {
            const el = entry.target;
            setTimeout(() => {
              delete el.dataset.kwTriggered;
            }, 1200);
          }
        });
      }, {
        root: null,
        rootMargin: '0px 0px -12% 0px', // Triggers when keyword reaches bottom 88% of screen
        threshold: 0.15
      });

      keywords.forEach(kw => observer.observe(kw));

      // Interactive hover gleam on mouse over
      keywords.forEach(kw => {
        kw.addEventListener('mouseenter', () => {
          if (!kw.classList.contains('kw-active') && !kw.closest('.lens-dim')) {
            kw.classList.add('kw-active');
            const onEnd = () => {
              kw.classList.remove('kw-active');
              kw.removeEventListener('animationend', onEnd);
            };
            kw.addEventListener('animationend', onEnd, { once: true });
          }
        });
      });
    },

    triggerHighlighted() {
      const highlighted = document.querySelectorAll('.lens-highlight .kw-magic, .lens-highlight.kw-magic');
      highlighted.forEach((el, idx) => {
        const delay = Math.min(idx * 60, 500);
        setTimeout(() => {
          el.classList.remove('kw-active');
          void el.offsetWidth; // Force reflow
          el.classList.add('kw-active');
          const onEnd = () => {
            el.classList.remove('kw-active');
            el.removeEventListener('animationend', onEnd);
          };
          el.addEventListener('animationend', onEnd, { once: true });
        }, delay);
      });
    }
  };

  // 7. Toby's AI Copilot Engine (Dual-Language Knowledge Base)
  const Copilot = {
    knowledgeEn: [
      {
        keys: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings', 'morning', 'afternoon', 'evening'],
        getAnswer: () => {
          const hour = new Date().getHours();
          const g = (hour >= 5 && hour < 12) ? 'Good morning!' : (hour >= 12 && hour < 18) ? 'Good afternoon!' : 'Good evening!';
          return `**${g}** Glad to connect with you. How can I help you explore Toby's engineering background, distributed architecture, or technical leadership today? Feel free to ask or pick a suggestion below!`;
        }
      },
      {
        keys: ['nda', 'confidential', 'client name', 'who is the client', 'automotive client', 'car brand', 'vinfast', 'hyundai', 'tesla', 'source code', 'proprietary', 'lotte'],
        answer: '**Confidentiality & Non-Disclosure (NDA) Notice:**\n- Specific enterprise client identities, proprietary source code, and internal corporate data are strictly protected under **Non-Disclosure Agreements (NDAs)**.\n- Toby welcomes technical deep-dives into **system architecture, WebSocket telemetry streaming, database optimizations, and high-concurrency solutions** he directly engineered, in full compliance with enterprise confidentiality standards.'
      },
      {
        keys: ['summary', 'recruiter', 'who', 'about', 'toby', 'achievements', 'overview', 'highlights', 'hire'],
        answer: '**Executive Summary for Recruiters & Hiring Managers:**\n- **Track Record:** 8+ years architecting high-scale distributed backend systems, real-time data streaming engines, and world-class web applications.\n- **Engineering Leadership:** Technical Project Lead at CMC Global leading 3 squads (15+ engineers) delivering enterprise real-time telemetry platforms; former CPO & Tech Lead at ICOMM Tech.\n- **Core Capabilities:** Systems programming in **Rust** (Win32 Job Objects, Tokio async) & **Java / Spring Boot**; modern web with **React / Next.js** (Core Web Vitals LCP < 2s, INP < 150ms); real-time telemetry streaming (WebSockets, SSE, Redis).\n- **Product & AI Mindset:** Deep PLG (Product-Led Growth) product discovery coupled with modern AI-augmented SDLC (MCP, LLM toolchains), boosting sprint feature velocity by 25%.'
      },
      {
        keys: ['fit', 'role', 'position', 'match', 'suitable', 'openings', 'lead', 'architect'],
        answer: '**Role Fit & Ideal Engagement:**\n- **Technical Project Lead / Tech Lead:** Proven capability managing 15+ engineers across multiple squads, driving architecture roadmaps, technical debt governance, and sprint delivery.\n- **Staff / Principal / Senior Software Engineer:** Deep hands-on mastery of distributed backend systems, Rust async runtimes, Java/Spring Boot services, and complex real-time WebSockets.\n- **Solutions Architect:** Designing resilient cloud and hybrid telemetry architectures, Medallion data pipelines, and enterprise micro-frontends.\n- **Working Culture:** Agile Scrum / Kanban, clean code advocate, mentor, and product-first innovator.'
      },
      {
        keys: ['telemetry', 'ev', 'websocket', 'sse', 'realtime', 'streaming', 'fleet'],
        answer: '**Real-Time Telemetry & EV Fleet Monitoring Architecture (CMC Global):**\n- Toby served as **Technical Project Lead** across 3 squads (15+ engineers) for a leading automotive tech platform.\n- Architected a resilient telemetry streaming pipeline (WebSocket/SSE fallback over Redis pub/sub) handling millions of daily EV operational events with sub-100ms latency.\n- Engineered **Virtual Scrolling, Canvas Data Charting, and Debounced State Updates** maintaining 60fps rendering without blocking the Main Thread.\n- Established route & component code splitting keeping INP < 150ms and LCP < 2.0s.'
      },
      {
        keys: ['tuquet', 'zombie', 'chromium', 'crawler', 'rust', 'medallion', 'job object', 'win32'],
        answer: '**Tuquet Distributed Automation & Crawler Pipeline:**\n- Toby engineered a zero-leakage process supervision core using **Windows Win32 Job Objects** with IO completion ports, completely eliminating zombie Chromium processes.\n- Designed a 3-tier **Medallion architecture** (Bronze raw BLOB gzip -> Silver Rust sanitizer & deduplicator -> Gold Supabase sync) with zero-cost local caching.\n- Authored the CLI (`tuquet`) in Rust with rustyline auto-completion, distributed via official Windows Scoop bucket.'
      },
      {
        keys: ['portal', 'theme park', 'booking', 'webview', 'hospitality', 'high-scale web', 'high-traffic'],
        answer: '**High-Scale Web & Booking Portals – Theme Park Enterprise (CMC Global):**\n- Toby served as **Lead Frontend Engineer**, building, refactoring, and delivering feature enhancements for high-traffic Visitor Web Portals and Partner Booking WebViews for a premier international theme park enterprise.\n- Engineered responsive, pixel-perfect mobile-embedded WebViews in React, Vite, and Tailwind CSS adhering strictly to client design specs.\n- Established seamless local developer workflows and mock data synchronization between Spring Boot backend services and React/React Native clients.'
      },
      {
        keys: ['team', 'squad', 'mentoring', 'management', 'culture', '15+'],
        answer: '**Leadership Experience & Team Scaling:**\n- Scaled and led cross-functional teams: **Technical Project Lead** (CMC Global, 15+ engineers across 3 squads), **Chief Product Officer & Tech Lead** (ICOMM Tech, scaling SaaS products to thousands of businesses), **Senior Software Engineer** (OpenCommerce Group).\n- Mentored 15+ engineers in Component-Driven Architecture, JavaScript Clean Code, and performance profiling.\n- Recognized with the prestigious **Rising Star Award** at CMC Global (2024).'
      },
      {
        keys: ['stack', 'tech', 'skill', 'skills', 'java', 'spring', 'react', 'rust', 'node', 'database'],
        answer: '**Core Tech Stack & Architecture:**\n- **Backend/Systems:** Rust (Tokio, Win32 Job Objects), Java / Spring Boot (Security, JPA), Node.js / NestJS, Event-Driven Architecture.\n- **Frontend:** React (Concurrent Features, Next.js, Server Components), Vue.js (Nuxt), TypeScript, Micro-frontends (Module Federation), Tailwind CSS.\n- **Data & Real-time:** Redis, WebSockets, SSE, PostgreSQL, Supabase, ClickHouse OLAP, Apache Solr.\n- **DevOps & Cloud:** Docker, Kubernetes fundamentals, Azure Cloud, Linux CLI, GitHub Actions CI/CD.\n- **AI & Productivity:** Model Context Protocol (MCP), LLM toolchains, Playwright, Vitest, Jest.'
      },
      {
        keys: ['contact', 'email', 'phone', 'location', 'interview', 'salary', 'connect'],
        answer: '**Contact Information & Availability:**\n- Toby is open to high-impact technical leadership and senior engineering opportunities.\n- **Phone:** +84 936 683 088\n- **Email:** tunyk.93@gmail.com\n- **Location:** Ha Dong, Ha Noi, Vietnam\n- **GitHub:** [github.com/tuquet](https://github.com/tuquet)\n- **LinkedIn:** [linkedin.com/in/tuquet](https://www.linkedin.com/in/tuquet)\n- **NPM Organization:** [npmjs.com/org/tuquet](https://www.npmjs.com/org/tuquet)'
      }
    ],

    knowledgeVi: [
      {
        keys: ['chào', 'xin chào', 'hello', 'hi', 'chào buổi sáng', 'chào buổi chiều', 'chào buổi tối', 'buổi sáng', 'buổi chiều', 'buổi tối', 'alo', 'bạn ơi', 'hey'],
        getAnswer: () => {
          const hour = new Date().getHours();
          const g = (hour >= 5 && hour < 12) ? 'Chào buổi sáng!' : (hour >= 12 && hour < 18) ? 'Chào buổi chiều!' : 'Chào buổi tối!';
          return `**${g}** Rất vui được hỗ trợ bạn. Bạn có thể tra cứu nhanh về **kiến trúc hệ thống phân tán**, **dự án telemetry thời gian thực**, **kinh nghiệm lead 15+ kỹ sư** hoặc **độ phù hợp vị trí** của Toby. Hãy chọn gợi ý bên dưới hoặc đặt câu hỏi trực tiếp!`;
        }
      },
      {
        keys: ['nda', 'bảo mật', 'khách hàng là ai', 'tên khách hàng', 'hãng xe nào', 'hãng xe', 'vinfast', 'hyundai', 'tesla', 'mã nguồn', 'source code', 'lotte', 'bí mật'],
        answer: '**Thông báo về Bảo mật Thông tin (NDA):**\n- Danh tính cụ thể của đối tác khách hàng, mã nguồn nội bộ và dữ liệu doanh nghiệp được bảo vệ nghiêm ngặt theo **Thỏa thuận Bảo mật Thông tin (NDA)**.\n- Toby luôn sẵn sàng trao đổi sâu về **mô hình kiến trúc kỹ thuật, giải pháp streaming WebSockets, thiết kế database và các bài toán tối ưu hiệu năng** đã trực tiếp giải quyết mà không vi phạm nguyên tắc bảo mật của đối tác.'
      },
      {
        keys: ['tóm tắt', 'recruiter', 'thành tựu', 'ai là', 'giới thiệu', 'thế mạnh', 'overview', 'toby'],
        answer: '**Tóm tắt Năng lực Cốt lõi (Dành cho Nhà tuyển dụng):**\n- **Kinh nghiệm thực chiến:** Hơn 8+ năm kiến trúc và phát triển hệ thống backend phân tán quy mô lớn, streaming dữ liệu đo xa (telemetry) thời gian thực và ứng dụng web chuẩn quốc tế.\n- **Năng lực Lãnh đạo:** Technical Project Lead tại CMC Global điều phối 3 squad (15+ kỹ sư) triển khai nền tảng đo xa xe điện thời gian thực; nguyên CPO & Tech Lead tại ICOMM Tech.\n- **Lập trình Hệ thống:** Nắm vững **Rust** (Win32 Job Objects, Tokio async) & **Java / Spring Boot**; tối ưu web hiện đại **React / Next.js / Vue** (Core Web Vitals LCP < 2s, INP < 150ms); luồng thời gian thực qua WebSockets, SSE, Redis.\n- **Tư duy Product & AI:** Kết hợp Product-Led Growth (PLG) với quy trình kỹ thuật tăng cường bởi AI (MCP, LLMs), gia tăng 25% tốc độ bàn giao tính năng.'
      },
      {
        keys: ['phù hợp', 'fit', 'vị trí', 'role', 'tuyển dụng', 'ứng tuyển', 'thích hợp', 'lead', 'architect'],
        answer: '**Độ phù hợp vị trí & Vai trò lý tưởng:**\n- **Technical Project Lead / Tech Lead:** Dày dặn kinh nghiệm dẫn dắt 15+ kỹ sư, thiết lập chuẩn mực kiến trúc, quản trị nợ kỹ thuật và điều phối sprint bàn giao đúng hạn.\n- **Senior / Staff Software Engineer:** Chuyên sâu backend phân tán, lập trình hệ thống Rust/Java, tối ưu hiệu năng web và streaming dữ liệu thời gian thực.\n- **Solutions Architect:** Thiết kế kiến trúc đám mây (Azure/Docker/K8s), pipeline dữ liệu Medallion và mô hình Micro-frontends quy mô doanh nghiệp.\n- **Văn hóa làm việc:** Agile Scrum/Kanban, tư duy Product-first, đào tạo và phát triển đội ngũ vững vàng.'
      },
      {
        keys: ['telemetry', 'đo xa', 'ev', 'thời gian thực', 'xe điện', 'websocket', 'streaming', 'fleet'],
        answer: '**Kiến trúc Giám sát Dữ liệu Đo xa (Telemetry) Xe điện Thời gian thực (CMC Global):**\n- Toby đảm nhiệm vai trò **Technical Project Lead** phụ trách 3 squad (15+ kỹ sư) cho nền tảng của tập đoàn sản xuất ô tô hàng đầu.\n- Kiến trúc pipeline streaming telemetry (WebSocket/SSE fallback trên Redis pub/sub), xử lý hàng triệu sự kiện vận hành xe điện mỗi ngày với độ trễ sub-100ms.\n- Áp dụng **Virtual Scrolling, Canvas Data Charting, và Debounced State Updates** duy trì tốc độ hiển thị 60fps mượt mà không nghẽn Main Thread.\n- Tối ưu Core Web Vitals toàn diện: dynamic code splitting, hạ INP xuống < 150ms và giữ vững LCP < 2.0s.'
      },
      {
        keys: ['tuquet', 'zombie', 'chromium', 'crawler', 'rust', 'medallion', 'job object', 'win32'],
        answer: '**Dự án Tuquet & Sửa lỗi Zombie Process:**\n- Toby thiết kế lõi giám sát tiến trình zero-leakage sử dụng **Windows Win32 Job Objects** và IO completion ports, loại bỏ triệt để hiện tượng Chromium zombie process.\n- Xây dựng kiến trúc **Medallion 3 tầng** (Bronze raw BLOB gzip -> Silver Rust sanitizer & deduplicator -> Gold Supabase sync) với bộ nhớ đệm cục bộ zero-cost.\n- Viết CLI chính (`tuquet`) bằng Rust với auto-completion thông minh, phân phối qua Scoop bucket chính thức trên Windows.'
      },
      {
        keys: ['nền tảng web', 'đặt vé', 'web & đặt vé', 'portal', 'công viên', 'giải trí', 'webview', 'lưu lượng cao', 'bán vé'],
        answer: '**Nền tảng Web & Đặt vé Trực tuyến – Công viên Giải trí Quốc tế (CMC Global):**\n- Toby đảm nhiệm vai trò **Lead Frontend Engineer**, phát triển, bảo trì và tối ưu Cổng dịch vụ Web Khách tham quan & WebView Đặt vé Đối tác cho tập đoàn công viên giải trí hàng đầu.\n- Xây dựng giao diện responsive và WebView nhúng di động bằng React, Vite, Tailwind CSS đạt chuẩn pixel-perfect.\n- Thiết lập quy trình phát triển và cơ chế mock data đồng bộ giữa backend Spring Boot và giao diện React / React Native.'
      },
      {
        keys: ['quản lý', 'team', 'squad', 'mentoring', 'lãnh đạo', 'kinh nghiệm', '15+', 'devs'],
        answer: '**Kinh nghiệm Lãnh đạo & Phát triển Đội ngũ:**\n- Bề dày dẫn dắt đội ngũ kỹ thuật: **Technical Project Lead** (CMC Global, 15+ kỹ sư trên 3 squads), **CPO & Tech Lead** (ICOMM Tech, mở rộng sản phẩm SaaS phục vụ hàng nghìn doanh nghiệp), **Senior Software Engineer** (OpenCommerce Group).\n- Đào tạo và mentor 15+ kỹ sư về Component-Driven Architecture, JavaScript Clean Code và phân tích hiệu năng render.\n- Được vinh danh với giải thưởng **Rising Star Award** tại CMC Global (2024).'
      },
      {
        keys: ['stack', 'tech', 'ngôn ngữ', 'skill', 'kỹ năng', 'công nghệ', 'java', 'spring', 'react', 'rust'],
        answer: '**Hệ sinh thái Công nghệ Cốt lõi:**\n- **Backend & Hệ thống:** Rust (Tokio, Win32 Job Objects), Java / Spring Boot (Security, JPA), Node.js / NestJS, Event-Driven Architecture.\n- **Frontend:** React (Next.js, Server Components), Vue.js (Nuxt), TypeScript, Micro-frontends (Module Federation), Tailwind CSS.\n- **Dữ liệu & Thời gian thực:** Redis, WebSockets, SSE, PostgreSQL, Supabase, ClickHouse OLAP, Apache Solr.\n- **Đám mây & DevOps:** Docker, Kubernetes fundamentals, Azure Cloud, Linux CLI, GitHub Actions CI/CD.\n- **AI & Năng suất:** Model Context Protocol (MCP), LLM toolchains, Playwright, Vitest, Jest.'
      },
      {
        keys: ['liên hệ', 'email', 'sđt', 'điện thoại', 'địa chỉ', 'ở đâu', 'phỏng vấn', 'lương', 'contact'],
        answer: '**Thông tin Liên hệ & Sẵn sàng Phỏng vấn:**\n- Toby sẵn sàng trao đổi các cơ hội nghề nghiệp kỹ thuật giá trị cao (Full-time, Cố vấn Kiến trúc / Advisory).\n- **Điện thoại:** +84 936 683 088\n- **Email:** tunyk.93@gmail.com\n- **Địa chỉ:** Hà Đông, Hà Nội, Việt Nam\n- **GitHub:** [github.com/tuquet](https://github.com/tuquet)\n- **LinkedIn:** [linkedin.com/in/tuquet](https://www.linkedin.com/in/tuquet)\n- **Tổ chức NPM:** [npmjs.com/org/tuquet](https://www.npmjs.com/org/tuquet)'
      }
    ],

    getTimeGreeting(isVi) {
      const hour = new Date().getHours();
      if (isVi) {
        if (hour >= 5 && hour < 12) return 'Chào buổi sáng!';
        if (hour >= 12 && hour < 18) return 'Chào buổi chiều!';
        return 'Chào buổi tối!';
      } else {
        if (hour >= 5 && hour < 12) return 'Good morning!';
        if (hour >= 12 && hour < 18) return 'Good afternoon!';
        return 'Good evening!';
      }
    },

    init() {
      const trigger = document.getElementById('copilot-trigger');
      const panel = document.getElementById('copilot-panel');
      const closeBtn = document.getElementById('copilot-close');
      const input = document.getElementById('copilot-input');
      const sendBtn = document.getElementById('copilot-send');
      const chips = document.querySelectorAll('.copilot-chip');

      if (!trigger || !panel) return;

      // Dynamic time-of-day greeting (morning / afternoon / evening) from browser time
      const vi = isVi();
      const currentGreeting = this.getTimeGreeting(vi);
      const greetingEl = document.getElementById('copilot-greeting-text');
      if (greetingEl) {
        greetingEl.textContent = currentGreeting;
      } else {
        const welcomeEl = document.getElementById('copilot-welcome-msg') || document.querySelector('.copilot-body .copilot-msg.bot');
        if (welcomeEl) {
          if (vi) {
            welcomeEl.innerHTML = welcomeEl.innerHTML.replace(/^(<span[^>]*>)?(Xin chào|Chào buổi sáng|Chào buổi chiều|Chào buổi tối)[!.]?(<\/span>)?/i, `$1${currentGreeting}$3`);
          } else {
            welcomeEl.innerHTML = welcomeEl.innerHTML.replace(/^(<span[^>]*>)?(Hello|Good morning|Good afternoon|Good evening)[!.]?(<\/span>)?/i, `$1${currentGreeting}$3`);
          }
        }
      }

      trigger.addEventListener('click', () => {
        const isOpen = panel.classList.toggle('open');
        if (isOpen) {
          const g = this.getTimeGreeting(isVi());
          const gEl = document.getElementById('copilot-greeting-text');
          if (gEl) gEl.textContent = g;
          if (input) setTimeout(() => input.focus(), 150);
        }
      });

      if (closeBtn) closeBtn.addEventListener('click', () => panel.classList.remove('open'));

      const handleSend = (text) => {
        const query = (text || (input ? input.value : '')).trim();
        if (!query) return;
        if (input) input.value = '';

        this.addMessage(query, 'user');
        setTimeout(() => {
          const reply = this.queryKnowledge(query);
          this.addBotMessage(reply);
        }, 200);
      };

      if (sendBtn) sendBtn.addEventListener('click', () => handleSend());
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') handleSend();
        });
      }

      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          handleSend(chip.getAttribute('data-q') || chip.textContent);
        });
      });
    },

    queryKnowledge(text) {
      const lower = text.toLowerCase();
      const viMode = isVi();
      const list = viMode ? this.knowledgeVi : this.knowledgeEn;

      let bestMatch = null;
      let maxScore = 0;

      list.forEach(k => {
        let score = 0;
        k.keys.forEach(key => {
          if (lower.includes(key.toLowerCase())) score += key.length > 3 ? 3 : 1;
        });
        if (score > maxScore) {
          maxScore = score;
          bestMatch = typeof k.answer === 'function' ? k.answer() : (k.getAnswer ? k.getAnswer(viMode) : k.answer);
        }
      });

      if (!bestMatch) {
        return viMode
          ? "Tôi có thể giải đáp các câu hỏi về **kiến trúc kỹ thuật**, **hệ thống phân tán**, **kinh nghiệm lead 15+ kỹ sư**, **độ phù hợp vị trí (Fit Check)** hoặc **thông tin liên hệ** của Toby. Bạn có thể chọn các gợi ý bên dưới!"
          : "I can answer questions regarding Toby's **technical architecture**, **distributed systems experience**, **leadership across 15+ engineers**, **role fit check**, or **contact info**. Feel free to pick a prompt below!";
      }
      return bestMatch;
    },

    addMessage(text, role) {
      const body = document.getElementById('copilot-body');
      if (!body) return;
      const msg = document.createElement('div');
      if (role === 'user') {
        msg.className = 'copilot-msg user self-end max-w-[92%] p-3 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-[13px] leading-relaxed break-words';
      } else {
        msg.className = 'copilot-msg bot self-start max-w-[92%] p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 text-[13px] leading-relaxed break-words';
      }
      msg.textContent = text;
      body.appendChild(msg);
      body.scrollTop = body.scrollHeight;
    },

    addBotMessage(markdownText) {
      const body = document.getElementById('copilot-body');
      if (!body) return;
      const msg = document.createElement('div');
      msg.className = 'copilot-msg bot self-start max-w-[92%] p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 text-[13px] leading-relaxed break-words [&_strong]:font-semibold [&_strong]:text-zinc-950 dark:[&_strong]:text-white [&_a]:underline [&_a]:underline-offset-2 [&_a]:font-medium';

      // Markdown formatting for bold, links, list items
      const formatted = markdownText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        .replace(/\n- /g, '<br/>• ')
        .replace(/\n\n/g, '<br/><br/>')
        .replace(/\n/g, '<br/>');

      msg.innerHTML = formatted;
      body.appendChild(msg);
      body.scrollTop = body.scrollHeight;
    }
  };

  // Run initializers when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    ProgressIndicator.init();
    StickyHeader.init();
    BackToTop.init();
    Toast.init();
    DownloadDropdown.init();
    LensFilter.init();
    KeywordMagic.init();
    Copilot.init();
  });
})();
