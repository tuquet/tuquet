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
      SafeStorage.set('tuquet-theme', theme);
      const toggleBtn = document.getElementById('theme-toggle');
      if (toggleBtn) {
        const vi = isVi();
        toggleBtn.textContent = theme === 'dark' ? (vi ? 'Sáng' : 'Light') : (vi ? 'Tối' : 'Dark');
        toggleBtn.title = theme === 'dark'
          ? (vi ? 'Chuyển sang giao diện Sáng' : 'Switch to Light Mode')
          : (vi ? 'Chuyển sang giao diện Tối' : 'Switch to Dark Mode');
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

  // 4. Toast Notifications & Quick Copy
  const Toast = {
    show(message) {
      let toast = document.getElementById('toast-container');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-container';
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
            Toast.show(isVi() ? 'Hiển thị toàn bộ nội dung' : 'Showing All Details');
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

          // 2. Process parent list items that have child lists (e.g. Responsibilities *)
          allLis.forEach(li => {
            const hasSubList = li.querySelector('ul, ol');
            if (!hasSubList) return;

            const hasActiveChild = li.querySelector('li.lens-highlight');
            if (hasActiveChild) {
              li.classList.remove('lens-dim');
            } else {
              li.classList.add('lens-dim');
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
            const nextEl = h3.nextElementSibling;
            if (nextEl && nextEl.tagName === 'UL') {
              const hasMatchingItem = nextEl.querySelector('li.lens-highlight');
              if (hasMatchingItem) {
                h3.classList.add('lens-highlight');
              } else {
                h3.classList.add('lens-dim');
              }
            }
          });

          const label = btn.textContent.trim();
          const msg = isVi() ? `Đã lọc theo: ${label}` : `Filtered by: ${label}`;
          Toast.show(msg);
        });
      });
    }
  };

  // 6. Toby's AI Copilot Engine (Dual-Language Knowledge Base)
  const Copilot = {
    knowledgeEn: [
      {
        keys: ['hi', 'hello', 'toby', 'who', 'summary', 'about', 'achievements'],
        answer: 'Toby Nguyen (Nguyễn Đình Tú) is an accomplished **Technical Project Lead & Senior Software Engineer** with over 8+ years of experience engineering high-scale distributed systems, real-time data streaming architectures, and modern web platforms. He combines technical mastery (Rust, Java/Spring Boot, Node.js, React) with a **Product-first & AI-augmented mindset**.'
      },
      {
        keys: ['digital twin', 'ev', 'telemetry', 'websocket', 'sse', 'realtime'],
        answer: '**Digital Twin EV Platform (CMC Global):** Toby served as Technical Project Leader & Tech Lead across 3 squads (15+ engineers). He architected the telemetry streaming pipeline (WebSocket/SSE fallback over Redis pub/sub) handling millions of daily EV operational events with sub-100ms latency and high resilience.'
      },
      {
        keys: ['tuquet', 'zombie', 'chromium', 'crawler', 'rust', 'medallion', 'job object'],
        answer: '**Tuquet Crawler Pipeline:** Toby engineered a zero-leakage process supervision core using Windows Win32 Job Objects with IO completion ports, completely eliminating zombie Chromium processes. He designed a 3-tier Medallion architecture (Bronze raw BLOB -> Silver Rust sanitizer -> Gold Supabase sync) with zero-cost local caching.'
      },
      {
        keys: ['lead', 'team', 'squad', 'mentoring', 'experience', '15+'],
        answer: '**Leadership Experience:** Toby has proven leadership scaling cross-functional teams: Technical Project Lead (CMC Global, 15+ engineers), CPO / Tech Lead (ICOMM TECH, scaling SaaS products to thousands of businesses), Senior Software Engineer (Open Commerce Group). Recognized with the **Rising Star Award** at CMC Global (2024).'
      },
      {
        keys: ['stack', 'tech', 'skill', 'skills', 'java', 'spring', 'react', 'rust'],
        answer: '**Core Tech Stack:**\n- **Backend/Systems:** Rust, Java / Spring Boot, Node.js / TypeScript, Win32 Job Objects, Microservices.\n- **Frontend:** React, Next.js, Vue.js, Micro-frontends, Core Web Vitals.\n- **Data & Real-time:** Redis, WebSockets, SSE, PostgreSQL, Supabase, TimescaleDB.\n- **AI & Productivity:** MCP, LLM toolchains, prompt chains.'
      },
      {
        keys: ['contact', 'email', 'phone', 'location'],
        answer: '**Contact Information:**\n- **Phone:** +84 936 683 088\n- **Email:** tunyk.93@gmail.com\n- **Location:** Ha Dong, Ha Noi, Vietnam\n- **GitHub:** [github.com/tuquet](https://github.com/tuquet)\n- **LinkedIn:** [linkedin.com/in/tuquet](https://www.linkedin.com/in/tuquet)'
      }
    ],

    knowledgeVi: [
      {
        keys: ['chào', 'hi', 'hello', 'toby', 'ai là', 'giới thiệu', 'tóm tắt', 'thế mạnh', 'thành tựu'],
        answer: 'Toby Nguyen (Nguyễn Đình Tú) là **Technical Project Lead & Kỹ sư Phần mềm Cao cấp** với hơn 8+ năm kinh nghiệm thực chiến trong việc kiến trúc các hệ thống phân tán quy mô lớn, pipeline dữ liệu đo xa (telemetry) thời gian thực và nền tảng web hiện đại. Anh kết hợp năng lực kỹ thuật sâu rộng (Rust, Java/Spring Boot, Node.js, React) với **tư duy Product-first & quy trình tăng cường bởi AI (MCP, LLMs)**.'
      },
      {
        keys: ['digital twin', 'ev', 'telemetry', 'websocket', 'sse', 'realtime', 'xe điện', 'thời gian thực', 'kiến trúc'],
        answer: '**Nền tảng Digital Twin EV (CMC Global):** Toby đảm nhiệm vai trò Technical Project Leader & Tech Lead phụ trách 3 squad (15+ kỹ sư). Anh trực tiếp kiến trúc pipeline streaming telemetry (WebSocket/SSE fallback trên Redis pub/sub), xử lý hàng triệu sự kiện vận hành xe điện mỗi ngày với độ trễ sub-100ms và tính sẵn sàng cao.'
      },
      {
        keys: ['tuquet', 'zombie', 'chromium', 'crawler', 'rust', 'medallion', 'job object', 'xử lý'],
        answer: '**Tuquet Crawler Pipeline:** Toby thiết kế lõi giám sát tiến trình zero-leakage sử dụng Windows Win32 Job Objects và IO completion ports, loại bỏ triệt để hiện tượng zombie Chromium process. Đồng thời anh xây dựng kiến trúc Medallion 3 tầng (Bronze raw BLOB -> Silver Rust sanitizer -> Gold Supabase sync) với bộ nhớ đệm cục bộ zero-cost.'
      },
      {
        keys: ['lead', 'quản lý', 'team', 'squad', 'mentoring', 'lãnh đạo', 'kinh nghiệm', '15+', 'devs'],
        answer: '**Kinh nghiệm Lãnh đạo & Quản lý:** Toby có bề dày dẫn dắt các đội ngũ kỹ thuật liên chức năng: Technical Project Lead (CMC Global, 15+ kỹ sư), CPO / Tech Lead (ICOMM TECH, mở rộng sản phẩm SaaS phục vụ hàng nghìn doanh nghiệp), Senior Software Engineer (Open Commerce Group). Được vinh danh với giải thưởng **Rising Star Award** tại CMC Global (2024).'
      },
      {
        keys: ['stack', 'tech', 'ngôn ngữ', 'skill', 'kỹ năng', 'công nghệ', 'java', 'spring', 'react', 'rust'],
        answer: '**Hệ sinh thái Công nghệ Cốt lõi:**\n- **Backend & Hệ thống:** Rust, Java / Spring Boot, Node.js / TypeScript, Win32 Job Objects, Microservices.\n- **Frontend:** React, Next.js, Vue.js, Micro-frontends, Core Web Vitals.\n- **Dữ liệu & Thời gian thực:** Redis, WebSockets, SSE, PostgreSQL, Supabase, TimescaleDB.\n- **AI & Năng suất:** MCP, LLM toolchains, chuỗi prompt tự động.'
      },
      {
        keys: ['liên hệ', 'email', 'sđt', 'điện thoại', 'địa chỉ', 'ở đâu', 'contact'],
        answer: '**Thông tin Liên hệ:**\n- **Điện thoại:** +84 936 683 088\n- **Email:** tunyk.93@gmail.com\n- **Địa chỉ:** Hà Đông, Hà Nội, Việt Nam\n- **GitHub:** [github.com/tuquet](https://github.com/tuquet)\n- **LinkedIn:** [linkedin.com/in/tuquet](https://www.linkedin.com/in/tuquet)'
      }
    ],

    init() {
      const trigger = document.getElementById('copilot-trigger');
      const panel = document.getElementById('copilot-panel');
      const closeBtn = document.getElementById('copilot-close');
      const input = document.getElementById('copilot-input');
      const sendBtn = document.getElementById('copilot-send');
      const chips = document.querySelectorAll('.copilot-chip');

      if (!trigger || !panel) return;

      trigger.addEventListener('click', () => panel.classList.toggle('open'));
      if (closeBtn) closeBtn.addEventListener('click', () => panel.classList.remove('open'));

      const handleSend = (text) => {
        const query = (text || (input ? input.value : '')).trim();
        if (!query) return;
        if (input) input.value = '';

        this.addMessage(query, 'user');
        setTimeout(() => {
          const reply = this.queryKnowledge(query);
          this.addBotMessage(reply);
        }, 300);
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
          bestMatch = k.answer;
        }
      });

      if (!bestMatch) {
        return viMode
          ? "Tôi có thể giải đáp các câu hỏi về **kiến trúc kỹ thuật**, **hệ thống phân tán**, **kinh nghiệm lead 15+ kỹ sư** hoặc **thông tin liên hệ** của Toby. Bạn có thể chọn câu hỏi gợi ý bên dưới!"
          : "I can answer questions regarding Toby's **technical architecture**, **distributed systems experience**, **leadership across 15+ engineers**, or **contact info**. Feel free to pick a prompt below!";
      }
      return bestMatch;
    },

    addMessage(text, role) {
      const body = document.getElementById('copilot-body');
      if (!body) return;
      const msg = document.createElement('div');
      msg.className = `copilot-msg ${role}`;
      msg.textContent = text;
      body.appendChild(msg);
      body.scrollTop = body.scrollHeight;
    },

    addBotMessage(markdownText) {
      const body = document.getElementById('copilot-body');
      if (!body) return;
      const msg = document.createElement('div');
      msg.className = 'copilot-msg bot';
      body.appendChild(msg);

      // Markdown formatting for bold, links, list items
      const formatted = markdownText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        .replace(/\n- /g, '<br/>• ')
        .replace(/\n/g, '<br/>');

      let i = 0;
      const speed = 12;
      msg.innerHTML = '';
      
      const timer = setInterval(() => {
        i += 3;
        msg.innerHTML = formatted.substring(0, i);
        body.scrollTop = body.scrollHeight;
        if (i >= formatted.length) {
          msg.innerHTML = formatted;
          clearInterval(timer);
        }
      }, speed);
    }
  };

  // Run initializers when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    ProgressIndicator.init();
    Toast.init();
    LensFilter.init();
    Copilot.init();
  });
})();
