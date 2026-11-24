(() => {
  const root = document.documentElement;

  /* ---------- Mobile navigation ---------- */
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-links');

  if (toggle && nav) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('open', open);
    };

    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));

    document.addEventListener('click', (event) => {
      if (nav.classList.contains('open') && !nav.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* ---------- Active page ---------- */
  const currentPath = window.location.pathname.replace(/index\.html$/, '');
  document.querySelectorAll('[data-route]').forEach((link) => {
    const route = link.getAttribute('data-route');
    if (route === currentPath || (route !== '/' && currentPath.startsWith(route))) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  /* ---------- Theme (initial value is set by the inline script in <head>) ---------- */
  const themeBtn = document.querySelector('.theme-toggle');
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    if (themeBtn) themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  };
  applyTheme(root.dataset.theme || (media.matches ? 'dark' : 'light'));

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
    });
  }

  // Follow the system setting until the visitor picks a theme themselves.
  media.addEventListener('change', (event) => {
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch (e) { /* storage unavailable */ }
    if (!saved) applyTheme(event.matches ? 'dark' : 'light');
  });

  /* ---------- Scroll reveal ---------- */
  const targets = document.querySelectorAll(
    '.trust-inner>div, .section-heading, .service-card, .feature-visual, .feature-copy, .teaser-inner>div, ' +
    '.about-intro>div, .about-band-inner>*, .value-grid article, .service-row, .partner-inner>*, ' +
    '.project-card, .contact-band-inner>*, .contact-grid>*'
  );

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('in');
        observer.unobserve(el);
        // Hand transitions back to the element's own hover styles once revealed.
        el.addEventListener('transitionend', function done(e) {
          if (e.target !== el || e.propertyName !== 'opacity') return;
          el.classList.remove('reveal', 'in');
          el.style.removeProperty('--d');
          el.removeEventListener('transitionend', done);
        });
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    targets.forEach((el) => {
      const index = [...el.parentElement.children].indexOf(el);
      el.style.setProperty('--d', `${Math.min(index, 4) * 0.08}s`);
      if (el.matches('.feature-visual, .teaser-inner>div:first-child, .about-intro>div:first-child, .about-band-inner>div:first-child, .partner-inner>div:first-child, .contact-grid>.contact-intro')) el.classList.add('from-left');
      if (el.matches('.feature-copy, .teaser-inner>div:last-child, .about-intro>.prose, .about-band-inner>p, .partner-inner>p, .contact-grid>.contact-form')) el.classList.add('from-right');
      el.classList.add('reveal');
      observer.observe(el);
    });
  }

  /* ---------- Header: condensed on scroll + reading progress ---------- */
  const header = document.querySelector('.site-header');
  if (header) {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    header.appendChild(bar);

    let queued = false;
    const update = () => {
      queued = false;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      header.classList.toggle('is-scrolled', y > 24);
      bar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    };
    window.addEventListener('scroll', () => {
      if (!queued) { queued = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- Pointer effects (mouse users who have not asked for reduced motion) ---------- */
  if (window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) {
    const hero = document.querySelector('.hero');
    if (hero) {
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', `${e.clientX - r.left}px`);
        hero.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    }
    document.querySelectorAll('.service-card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- Start the project illustrations when they scroll into view ---------- */
  const liveTargets = document.querySelectorAll('.project-art');
  if ('IntersectionObserver' in window) {
    const liveObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('live');
        liveObserver.unobserve(entry.target);
      });
    }, { threshold: 0.35 });
    liveTargets.forEach((el) => liveObserver.observe(el));
  } else {
    liveTargets.forEach((el) => el.classList.add('live'));
  }

  /* ---------- Contact form (sent by /contact.php, which emails info@hicadsystemsltd.com) ---------- */
  const form = document.querySelector('.contact-form');
  if (form) {
    const status = form.querySelector('.form-status');
    const submit = form.querySelector('button[type="submit"]');
    const done = form.querySelector('.form-done');
    const again = form.querySelector('.form-again');
    const stamp = form.elements.ts;
    const GENERIC_ERROR = 'Sorry, your message could not be sent. Please try again or email info@hicadsystemsltd.com.';

    const setStatus = (message, type) => {
      status.textContent = message;
      status.className = 'form-status' + (type ? ` is-${type}` : '');
    };
    // The server rejects forms submitted within seconds of loading (a bot signal).
    const stampForm = () => { if (stamp) stamp.value = String(Date.now()); };
    stampForm();

    // Pre-select the topic when arriving from a service's "Enquire about this" link (/?topic=payroll#contact).
    const topics = {
      insurance: 'Insurance IT',
      payroll: 'Payroll & HR Systems',
      procurement: 'e-Procurement (abcProcure)',
      consulting: 'Computer & Communications Consulting',
    };
    const topicParam = new URLSearchParams(window.location.search).get('topic');
    if (topics[topicParam]) form.elements.topic.value = topics[topicParam];

    // Opened straight from a folder or a plain static server: there is no PHP, so preview the flow only.
    const isLocalPreview = ['', 'localhost', '127.0.0.1'].includes(window.location.hostname);

    const showDone = (firstName) => {
      const text = done.querySelector('.done-text');
      text.textContent = firstName
        ? `Thank you, ${firstName}. We will reply to the email address you gave.`
        : 'Thank you. We will reply to the email address you gave.';
      form.classList.add('is-done');
      done.hidden = false;
      done.focus();
    };

    again.addEventListener('click', () => {
      form.classList.remove('is-done');
      done.hidden = true;
      setStatus('');
      stampForm();
      form.elements.name.focus();
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      if (data.get('botcheck')) return;

      const firstName = String(data.get('name') || '').trim().split(/\s+/)[0];
      submit.disabled = true;
      submit.classList.add('is-sending');
      setStatus('Sending…');

      try {
        const response = await fetch(form.getAttribute('action'), { method: 'POST', headers: { Accept: 'application/json' }, body: data });
        const result = await response.json().catch(() => null);

        if (!result && isLocalPreview) {
          console.info('[Contact form] No PHP here, so this is a preview only. It would have sent:', Object.fromEntries(data));
          await new Promise((resolve) => setTimeout(resolve, 700));
        } else if (!response.ok || !result || !result.ok) {
          throw Object.assign(new Error('Send failed'), { userMessage: result && result.error });
        }

        form.reset();
        setStatus('');
        showDone(firstName);
      } catch (error) {
        setStatus(error.userMessage || GENERIC_ERROR, 'error');
      } finally {
        submit.disabled = false;
        submit.classList.remove('is-sending');
      }
    });
  }

  /* ---------- Footer year ---------- */
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
