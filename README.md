# 🏔️ Nomiris Ads Downloader (V4.6)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome](https://img.shields.io/badge/Browser-Chrome-blue.svg)](https://www.google.com/chrome/)
[![Meta Ads](https://img.shields.io/badge/Target-Meta_Ads_Library-1877F2.svg)](https://www.facebook.com/ads/library/)

**Nomiris Ads Downloader** is a high-performance, stealth-optimized Chrome Extension designed for bulk downloading ad creatives and metadata from the Meta Ads Library. Built with a robust "Background-Led" architecture, it handles hundreds of high-quality video exports without breaking a sweat.

---

## 🌟 Key Features

### 📦 High-Volume Scaling
- **Background Engine**: Offloads heavy ZIP generation and media fetching to a service worker, preventing tab crashes and memory leaks.
- **Auto-Batching**: Downloads are split into manageable sets of 5 (customizable), ensuring stability during 300-500+ ad exports.
- **Rapid-Fire Mode**: Sets are pushed to the background instantly as they are ready—no waiting for the entire job to finish.

### 🥷 Stealth & Anti-Detection
- **Human Jitter**: Randomized delays between individual file fetches mimic human behavior.
- **Smart Cool-offs**: Randomized rest periods between batch deliveries to evade pattern-recognition algorithms.

### 🎨 Premium User Experience
- **Interactive UI**: A sleek, dark-mode inspired dashboard with live progress bars and status messages.
- **Floating Controls**: Smooth-scrolling navigation arrows and a "Minimized-to-Badge" global widget.
- **Bulk Actions**: `SELECT ALL`, `CLEAR ALL`, and specialized filters for "Videos Only" or "Ad-Copy Only".

---

## 🛠️ Installation

1.  **Download** this repository as a ZIP and extract it, or clone it using git:
    ```bash
    git clone https://github.com/yourusername/meta-ads-downloader.git
    ```
2.  Open **Google Chrome** and navigate to `chrome://extensions/`.
3.  Enable **Developer Mode** (toggle in the top-right corner).
4.  Click **Load unpacked** and select the folder where the files are located.
5.  **Refresh** the Facebook Ads Library page.

---

## 📖 Tutorial: How to Use

### 1. The Global Widget
Look for the **Normaris Icon** in the bottom-right corner of the Ads Library. This is your command center.
- **Click the Icon**: Expands the bulk action panel.
- **Click the Badge**: Minimizes the panel back into a discreet icon.

### 2. Batch Selection
- Use the `SELECT AD` checkbox on top of any ad card.
- Use the `SELECT ALL` button in the global panel to grab everything currently visible on your feed.

### 3. Bulk Downloading
1.  Once you have selected your ads (e.g., 50 or 300), open the panel.
2.  Choose **Download All ZIP** (or specific media types).
3.  The UI will transform into a **Live Dashboard**:
    - `📦 PACKING SET 1...`: The engine is gathering files.
    - `🚚 COURIERING TO BACKGROUND...`: Handing off to the background script for safety.
    - `✅ SET COMPLETE`: Your ZIP is ready and downloading.
4.  **Note**: Do not close the tab until the progress hits 100%.

---

## 🏗️ Technical Architecture (The "Triad" System)

This extension uses a specialized **Store-Driven Event Delegation** model to ensure high performance on virtualized pages like the Meta Ads Library.

- **`Store`**: Centralized state management for selections and download progress.
- **`Injector`**: A debounced observer that scans the DOM for new ad cards during scrolling.
- **`Background Pipeline`**: A binary-first service worker that handles `JSZip` generation, bypassing Chrome's IPC serialization limits.

---

## ⚖️ License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

*Built with ❤️ by Nomiris.*
