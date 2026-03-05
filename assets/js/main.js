/* ToolsIndia — Global JS */
'use strict';

// Mobile nav
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (!toggle.contains(e.target) && !nav.contains(e.target)) nav.classList.remove('open');
    });
  }

  // Highlight active nav link
  const links = document.querySelectorAll('nav a');
  links.forEach(l => {
    if (location.pathname.includes(l.getAttribute('href')?.split('/')[1])) {
      l.classList.add('active');
    }
  });

  // FAQ accordion
  document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const a = q.nextElementSibling;
      const icon = q.querySelector('.faq-icon');
      const isOpen = a.classList.contains('open');
      document.querySelectorAll('.faq-a.open').forEach(x => { x.classList.remove('open'); });
      document.querySelectorAll('.faq-icon').forEach(x => { x.textContent = '+'; });
      if (!isOpen) { a.classList.add('open'); if (icon) icon.textContent = '−'; }
    });
  });

  // Animate cards on scroll
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('fade-up'); observer.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.tool-card, .blog-card').forEach(el => observer.observe(el));
});

// Toast notification
window.showToast = function(msg = 'Copied!', type = 'success') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.background = type === 'error' ? '#EF4444' : '#10B981';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
};

// Copy text to clipboard
window.copyText = function(text) {
  navigator.clipboard.writeText(text).then(() => showToast('✓ Copied to clipboard!')).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    showToast('✓ Copied!');
  });
};

// Format numbers Indian style
window.formatINR = function(n) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);
};
window.formatINRCurrency = function(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
};

// Download canvas as image
window.downloadCanvas = function(canvas, filename = 'image.png', format = 'image/png', quality = 1) {
  const a = document.createElement('a');
  a.href = canvas.toDataURL(format, quality);
  a.download = filename; a.click();
};

// Read file as data URL
window.readFileAsDataURL = function(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
};

// Load image from src
window.loadImage = function(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
};

// Format bytes
window.formatBytes = function(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

// Debounce
window.debounce = function(fn, delay) {
  let t; return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); };
};
