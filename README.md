# Ansem

A browser bookmarklet that overlays real-time statistics and analytics on any trading website. Connect to your favorite trading platform, and Ansem instantly surfaces the data you need — portfolio stats, price action, PnL tracking, and more — without leaving the page.

## What is Ansem?

Ansem is a lightweight bookmarklet designed for traders who want fast, contextual insights directly inside their trading interface. Drop it into your browser toolbar, navigate to any supported trading site, click the bookmarklet, and a clean overlay appears with the statistics that matter.

## Features

- **Portfolio Overview** — Total value, open positions, and allocation breakdown
- **Real-time Price Stats** — Current price, 24h change, volume, and volatility metrics
- **PnL Tracking** — Realized and unrealized profit/loss at a glance
- **Position Sizing Calculator** — Quick risk/reward assessment tools
- **Clean Overlay UI** — Non-intrusive panel that sits on top of the trading page
- **Zero Backend** — Runs entirely in your browser, no data sent to external servers

## Installation

1. Create a new bookmark in your browser
2. Set the bookmark name to **Ansem**
3. Paste the contents of `ansem.js` (minified) into the bookmark URL field
4. Navigate to any supported trading website
5. Click the Ansem bookmarklet to activate

## Usage

After clicking the bookmarklet on a supported trading page:

- An overlay panel will appear in the corner of the screen
- Drag the panel to reposition it
- Toggle individual stat modules on/off via the settings icon
- Click outside the panel to dismiss it

## Supported Platforms

Ansem is designed to work on any trading website. It hooks into common DOM patterns used by popular platforms:

- Binance
- Coinbase
- TradingView
- dYdX
- Any site with standard order book / portfolio DOM elements

## Privacy

Ansem runs entirely client-side. No data is transmitted, stored, or shared. Your portfolio data stays in your browser.

## Development

```bash
# Clone the repo
git clone https://github.com/Pla4ma/Ansem.git
cd Ansem

# Edit the bookmarklet source
# The core logic lives in ansem.js

# Open an HTML test page to preview the overlay
open test.html
```

## License

MIT
