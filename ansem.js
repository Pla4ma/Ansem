/**
 * Ansem — Trading Stats Bookmarklet
 *
 * Drop the minified version of this into a browser bookmark URL.
 * When clicked on a trading page, it injects an overlay panel
 * that surfaces portfolio stats, price data, and position info.
 */
(function () {
  'use strict';

  // Prevent double-injection
  if (document.getElementById('ansem-panel')) return;

  // --- Inject styles ---
  const style = document.createElement('style');
  style.textContent = `
    #ansem-panel {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 340px;
      max-height: 80vh;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 12px;
      color: #e6edf3;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      z-index: 999999;
      box-shadow: 0 16px 48px rgba(0,0,0,0.6);
      overflow: hidden;
      resize: both;
    }
    #ansem-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #161b22;
      border-bottom: 1px solid #30363d;
      cursor: move;
      user-select: none;
    }
    #ansem-header h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    #ansem-header .ansem-badge {
      background: #238636;
      color: #fff;
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 600;
    }
    #ansem-close {
      background: none;
      border: none;
      color: #8b949e;
      font-size: 18px;
      cursor: pointer;
      line-height: 1;
      padding: 0 4px;
    }
    #ansem-close:hover { color: #e6edf3; }
    #ansem-body {
      padding: 12px 16px;
      overflow-y: auto;
      max-height: calc(80vh - 50px);
    }
    .ansem-section {
      margin-bottom: 14px;
    }
    .ansem-section-title {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #8b949e;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .ansem-stat-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px solid #21262d;
    }
    .ansem-stat-label { color: #8b949e; }
    .ansem-stat-value { font-weight: 600; font-variant-numeric: tabular-nums; }
    .ansem-positive { color: #3fb950; }
    .ansem-negative { color: #f85149; }
    .ansem-neutral { color: #e6edf3; }
    #ansem-footer {
      padding: 8px 16px;
      border-top: 1px solid #30363d;
      font-size: 10px;
      color: #484f58;
      text-align: center;
    }
  `;
  document.head.appendChild(style);

  // --- Create panel ---
  const panel = document.createElement('div');
  panel.id = 'ansem-panel';
  panel.innerHTML = `
    <div id="ansem-header">
      <div style="display:flex;align-items:center;gap:8px;">
        <h3>ANSEM</h3>
        <span class="ansem-badge">LIVE</span>
      </div>
      <button id="ansem-close" title="Close">&times;</button>
    </div>
    <div id="ansem-body">
      <div class="ansem-section">
        <div class="ansem-section-title">Market Overview</div>
        <div id="ansem-market"></div>
      </div>
      <div class="ansem-section">
        <div class="ansem-section-title">Your Positions</div>
        <div id="ansem-positions"></div>
      </div>
      <div class="ansem-section">
        <div class="ansem-section-title">Quick Stats</div>
        <div id="ansem-quickstats"></div>
      </div>
    </div>
    <div id="ansem-footer">Ansem Bookmarklet v1.0 — client-side only</div>
  `;
  document.body.appendChild(panel);

  // --- Close button ---
  document.getElementById('ansem-close').addEventListener('click', () => {
    panel.remove();
    style.remove();
  });

  // --- Drag support ---
  const header = document.getElementById('ansem-header');
  let isDragging = false, offsetX, offsetY;
  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - panel.getBoundingClientRect().left;
    offsetY = e.clientY - panel.getBoundingClientRect().top;
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    panel.style.right = 'auto';
    panel.style.left = (e.clientX - offsetX) + 'px';
    panel.style.top = (e.clientY - offsetY) + 'px';
  });
  document.addEventListener('mouseup', () => { isDragging = false; });

  // --- Scrape stats from the current page ---
  function scrapePrice() {
    // Generic selectors for common trading page price elements
    const selectors = [
      '[class*="price"]', '[class*="Price"]',
      '[data-field="price"]', '[data-field="last"]',
      '.ticker-price', '.last-price', '.mark-price'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return '—';
  }

  function scrapeChange() {
    const selectors = [
      '[class*="change"]', '[class*="Change"]',
      '[class*="24h"]', '[class*="percent"]'
    ];
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      for (const el of els) {
        const txt = el.textContent.trim();
        if (/^[+-]?[\d.]+%?$/.test(txt) || /^[+-]?[\d.]+\s*\([\d.]+%\)/.test(txt)) {
          return txt;
        }
      }
    }
    return '—';
  }

  function scrapePositions() {
    const rows = document.querySelectorAll('tr, [class*="position"], [class*="Position"], [class*="row"]');
    const positions = [];
    for (const row of rows) {
      const text = row.textContent;
      if (text.length < 5 || text.length > 300) continue;
      if (/\b(btc|eth|sol|usdt|usdc|xrp|ada|doge|bnb|avax|dot|matic|link)\b/i.test(text)) {
        positions.push(text.replace(/\s+/g, ' ').trim().substring(0, 100));
        if (positions.length >= 5) break;
      }
    }
    return positions;
  }

  function render() {
    const price = scrapePrice();
    const change = scrapeChange();
    const changeClass = change.startsWith('-') ? 'ansem-negative' : change.startsWith('+') ? 'ansem-positive' : 'ansem-neutral';

    document.getElementById('ansem-market').innerHTML = `
      <div class="ansem-stat-row">
        <span class="ansem-stat-label">Last Price</span>
        <span class="ansem-stat-value ansem-neutral">${price}</span>
      </div>
      <div class="ansem-stat-row">
        <span class="ansem-stat-label">24h Change</span>
        <span class="ansem-stat-value ${changeClass}">${change}</span>
      </div>
      <div class="ansem-stat-row">
        <span class="ansem-stat-label">Page</span>
        <span class="ansem-stat-value ansem-neutral">${document.title.substring(0, 40)}</span>
      </div>
    `;

    const positions = scrapePositions();
    const posContainer = document.getElementById('ansem-positions');
    if (positions.length === 0) {
      posContainer.innerHTML = '<div class="ansem-stat-row"><span class="ansem-stat-label">No positions detected on this page</span></div>';
    } else {
      posContainer.innerHTML = positions.map(p =>
        `<div class="ansem-stat-row"><span class="ansem-stat-value ansem-neutral" style="font-size:11px;word-break:break-all;">${p}</span></div>`
      ).join('');
    }

    document.getElementById('ansem-quickstats').innerHTML = `
      <div class="ansem-stat-row">
        <span class="ansem-stat-label">Session Time</span>
        <span class="ansem-stat-value ansem-neutral" id="ansem-time"></span>
      </div>
      <div class="ansem-stat-row">
        <span class="ansem-stat-label">Elements Scanned</span>
        <span class="ansem-stat-value ansem-neutral">${document.querySelectorAll('*').length.toLocaleString()}</span>
      </div>
    `;

    // Session timer
    const startTime = Date.now();
    function updateTime() {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const m = Math.floor(elapsed / 60);
      const s = elapsed % 60;
      const el = document.getElementById('ansem-time');
      if (el) el.textContent = `${m}m ${s}s`;
    }
    updateTime();
    setInterval(updateTime, 1000);
  }

  render();

  // Auto-refresh stats every 5 seconds
  setInterval(render, 5000);
})();
