<div align="center">

<img src="public/icons/logo.png" width="90" height="90" alt="ProxyLab Logo">

# ProxyLab — Auto Proxy Checker

### Free & Open-Source · Real-Time · Concurrent · Beautiful

[![GitHub Stars](https://img.shields.io/badge/★-Star_Repository-yellow?style=flat-square)](https://github.com/Erfangit23/proxy-checker)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-blueviolet?style=flat-square)](https://github.com/Erfangit23/proxy-checker/pulls)

**A fast, beautiful, and feature-packed proxy checker with a real-time dark UI.**
Load thousands of proxies from a file or paste them directly — watch them get tested live, row by row, with latency, anonymity, geo-location, and ISP data.

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| **Dual Input** | Drag-and-drop a `.txt` file or paste proxies directly into the textarea |
| **Format Support** | `ip:port`, `protocol://ip:port`, `ip:port:user:pass`, `socks5://user:pass@ip:port` |
| **Real-Time Results** | SSE streaming — all proxies load as "Pending" instantly, then update live as each is tested |
| **Concurrent Checking** | Configurable concurrency (1–200 simultaneous connections) with adjustable timeout |
| **Latency Measurement** | Per-proxy response time with color-coded visual bars (green / amber / red) |
| **Anonymity Detection** | Classifies proxies as Transparent, Anonymous, or Elite |
| **Geo-Location** | Automatic country lookup with flag, ISP name, and resolved IP address |
| **Smart Filtering** | Filter by All / Alive / Dead + full-text search (host, country, ISP, IP) |
| **Live Sorting** | Sort by order, latency ascending/descending, or alive-first — updates in real time |
| **Stats Dashboard** | Live counters for total / alive / dead / average latency + animated progress bar |
| **Export** | One-click export of all alive proxies to a `.txt` file |
| **Dark NOC Aesthetic** | Network operations center inspired UI — JetBrains Mono + Bricolage Grotesque, glass morphism, grid background, glow accents |

---

## 🖼️ Screenshot

<div align="center">

![ProxyLab UI](https://via.placeholder.com/900x550/08090d/22d3ee?text=ProxyLab+Auto+Proxy+Checker+UI)

*Real-time proxy checking with live results, stats, and filtering*

</div>

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) **v18 or higher** (uses native `fetch`)

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/Erfangit23/proxy-checker.git

# Navigate to project directory
cd proxy-checker

# Install dependencies
npm install

# Start the application
npm start
```

Then open your browser to **http://localhost:7277**

---

## 📖 Usage Guide

### 1. Input Your Proxies

**Option A — File Upload:**
- Drag and drop a `.txt`, `.csv`, or `.lst` file onto the drop zone
- Or click the drop zone to browse and select a file

**Option B — Paste Directly:**
- Paste proxies into the textarea (one per line)

### 2. Supported Proxy Formats

```
# Basic host:port
127.0.0.1:8080

# With protocol
http://127.0.0.1:8080
socks5://127.0.0.1:1080
https://127.0.0.1:443

# With authentication
127.0.0.1:8080:username:password
http://user:pass@127.0.0.1:8080
socks5://user:pass@127.0.0.1:1080
```

### 3. Configure & Start

- Set **Concurrency** (how many proxies to test simultaneously, default: 20)
- Set **Timeout** (per-proxy timeout in milliseconds, default: 8000)
- Click **▶ Start Check**

All proxies appear instantly as **Pending** (amber), then transition to **Alive** (green) or **Dead** (red) as they're tested.

### 4. Filter, Sort & Export

- Use the **All / Alive / Dead** chips to filter results
- Use the **search bar** to find proxies by host, country, ISP, or IP
- Use the **sort dropdown** to reorder by latency or status
- Click **↓ Export Alive** to save all working proxies to a `.txt` file

---

## ⚙️ How It Works

ProxyLab uses a Node.js backend with raw TCP sockets to test proxy connectivity:

1. **Parse** — All proxy lines are parsed and validated on input
2. **Connect** — Each proxy receives an HTTP `CONNECT` request to `httpbin.org:80`
3. **Classify** — Response is analyzed for:
   - **Alive/Dead** — based on HTTP 200 response
   - **Latency** — time from connect to first response
   - **Anonymity** — headers like `Via`, `X-Forwarded-For`, `Proxy-Connection` determine transparency level
4. **Geo-Lookup** — Alive proxies get IP geolocation via `ip-api.com`
5. **Stream** — Results are pushed to the frontend in real time via Server-Sent Events (SSE)

The frontend renders all proxies as "Pending" immediately on start, then updates each row in-place as its check completes — giving you instant visual feedback even with thousands of proxies.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js · Express · raw TCP sockets · SSE |
| **Frontend** | Vanilla HTML/CSS/JS (no framework, no build step) |
| **Fonts** | Bricolage Grotesque (UI) · JetBrains Mono (data) |
| **Geo API** | ip-api.com (free, no key required) |

---

## 📁 Project Structure

```
proxy-checker/
├── server.js           # Backend: proxy parsing, concurrent checking, SSE streaming
├── package.json        # Project manifest & dependencies
├── public/
│   ├── index.html      # Full single-page frontend (HTML + CSS + JS)
│   └── icons/
│       └── logo.png    # Brand logo
└── README.md           # You are here
```

---

## 🔧 Configuration

All settings are configurable from the UI. For advanced users, you can edit `server.js`:

| Setting | Default | Description |
|---|---|---|
| `PORT` | `7277` | Web server port |
| Concurrency | `20` | Simultaneous proxy connections |
| Timeout | `8000ms` | Per-proxy connection timeout |
| Geo API | `ip-api.com` | Free IP geolocation service |

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. Create a **feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. Open a **Pull Request**

### Ideas for contributions:
- SOCKS5 protocol support (handshake-based testing)
- HTTPS proxy testing via TLS
- Batch export with CSV format
- Proxy chain testing
- Dark/Light theme toggle
- Internationalization (i18n)

---

## 📜 License

This project is licensed under the **MIT License** — free for personal and commercial use.

```
MIT License

Copyright (c) 2026 Erfan Rahimi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND...
```

See [LICENSE](LICENSE) for the full text.

---

## 👤 Author

<div align="center">

**Erfan Rahimi**

[![GitHub](https://img.shields.io/badge/GitHub-Erfangit23-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/Erfangit23/)
[![GitHub Stars](https://img.shields.io/badge/⭐-Star_this_repo-yellow?style=flat-square)](https://github.com/Erfangit23/proxy-checker)

*Free and open-source — built for the community.*

</div>

---

## ⭐ Show Your Support

If this project helped you, please consider:

- ⭐ **Starring** the repository on GitHub
- 🐛 **Reporting** bugs or requesting features via [Issues](https://github.com/Erfangit23/proxy-checker/issues)
- 🔄 **Sharing** with others who might find it useful
- ☕ **Contributing** code or ideas via Pull Requests

---

<div align="center">

**ProxyLab** — Built with ❤️ by [Erfan Rahimi](https://github.com/Erfangit23/)

*© 2026 — Free & Open Source under MIT License*

</div>
