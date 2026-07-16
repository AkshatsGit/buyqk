# buyQk — Universal Local Supply Network

buyQk is a premium, AI-powered Local Commerce Platform where every local retail store acts as a high-density dark store fulfillment node. 

Designed with Stripe, Linear, and Blinkit aesthetic values, it features a glassmorphic dashboard interface, interactive Leaflet maps, multi-merchant single-cart checkouts, a conversational RAG AI Shopping Assistant powered by Google Gemini, and a full-fledged HR Portal.

---

## 🏗️ Monorepo Architecture

The platform is managed as an NPM Workspace monorepo to maximize code sharing between web components and mobile frameworks:

```
buyqk/
├── apps/
│   ├── customer-web/        # Customer storefront portal (Vite + React + TS)
│   ├── seller-web/          # Merchant dark store console (Vite + React + TS)
│   ├── admin-web/           # Enterprise control panel (Vite + React + TS)
│   ├── hr-web/              # Candidate Offer & Employee Registry Portal (Vite + React + TS)
│   ├── customer-app/        # React Native (Expo) Customer App
│   └── seller-app/          # React Native (Expo) Seller App
├── packages/
│   ├── ui/                  # Shared Tailwind CSS design system, cards & maps
│   ├── firebase/            # Hybrid Firestore DB layer & Gemini RAG AI client
│   └── types/               # Common TypeScript interface definitions
│   └── shared/              # Common Zod verification schemas & constants
├── firestore/
│   ├── firestore.rules
│   └── firestore.indexes.json
├── package.json             # Root workspace scripting configs
└── README.md
```

---

## ⚡ Key Technical Innovations

### 1. Zero-Cost Image Compilation to Base64 Text
To evade high Firebase storage bills, buyQk includes a client-side **Canvas base64 compiler**. Uploaded images (logos, product cards, founder signatures) are dynamically compressed (e.g. down to `<15KB` WebP/PNG) on the client canvas and written directly to Firestore text fields. The database stores visual assets natively as text!

### 2. Multi-Shop Split Checkout Engine
Customers can add products from different dark stores into a single cart. Upon checkout, our backend splits the items, routes individual orders to their matching store consoles, handles platform commission splits, and computes independent delivery coordinates.

### 3. Spatial Geofencing & Zone Canvas
Admins can draw custom delivery zones directly on the Leaflet Map. Click a series of map points to paint a polygon. The polygon represents a geofence limit, and stores within that boundary are automatically assigned to service customer checkouts inside those coordinates.

### 4. Gemini RAG Shopping Assistant
The AI assistant takes natural queries ("I need coordinates for baking pasta") and retrieves active stock from nearby shops. The retrieved items are injected into the Gemini context to compare pricing, delivery times, and distances.

### 5. HR Portal (Offer Center & Employee Registry)
A secure HR Portal restricted to authorized administrators (`akshat.srivastava098@gmail.com`) featuring:
*   **Multi-Page A4 Offer Letter Generator**: Implements a modular page-splitting system using a custom divider (`⸻`). Each section is rendered on an independent standard A4 page card (`210mm x 297mm`), preventing orphan headings and page overflow.
*   **Equidistant Headers & Footers**: Uses CSS Flexbox (`flex-col justify-between`) to anchor repeating high-fidelity header and footer bands at identical, equidistant locations on every single page card, regardless of varying content height.
*   **Legal & Policy Templates**: Built-in professional templates including:
    *   *Founding Ownership Program* (Internal & Confidential)
    *   *Confidentiality Agreement (NDA)*
    *   *Intellectual Property & Work Product Agreement*
    *   *Code of Conduct*
    *   *Tech SDE (Standard Offer Letter)*
*   **Dynamic Variable Interpolation**: Automatically compiles parameters like `{name}`, `{position}`, `{joiningDate}`, `{ctc}`, `{expiryDate}`, `{date}`, and `{refNo}` throughout the documents.
*   **Realtime Employee Registry**: Tracks active employees with details including Employee Number/ID, Full Name, Affiliation Source (College/Previous Company/buyQk internal), Salary Details, Joining Date, and Email.
*   **Dual Signatures**: Standardized founder and co-founder Base64 electronic signature widgets with canvas uploads.
*   **Local Developer Bypass**: Includes local mock credential validation (master password `buyqk2026` for `akshat.srivastava098@gmail.com`) to bypass Google Auth captchas during development and automated testing runs.

---

## 🚀 Dev Launch Coordinates

### 1. Setup Symlinks & Dependencies
Install dependencies from the root directory:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in `apps/customer-web/`, `apps/seller-web/`, `apps/admin-web/`, and `apps/hr-web/`:
```env
# Optional: Set real Firebase config to bypass Simulation mode
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_PROJECT_ID=your_project

# Set your Gemini API Key to enable the live RAG assistant
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 3. Run Development Servers
* Run **Customer Web Portal** (Port 3000):
  ```bash
  npm run dev:customer
  ```
* Run **Seller Portal** (Port 3001):
  ```bash
  npm run dev:seller
  ```
* Run **Admin Control Panel** (Port 3002):
  ```bash
  npm run dev:admin
  ```
* Run **HR Web Portal** (Port 3004):
  ```bash
  npm run dev:hr
  ```
* Run **Expo Mobile Apps**:
  ```bash
  npm start -w apps/customer-app
  npm start -w apps/seller-app
  ```

---

## 🧪 Simulation / Prototyping Mode
If no live Firebase environment keys are supplied, the platform falls back to a custom **LocalStorage Reactive state machine**. It loads:
* **Preloaded Accounts**:
  * **Customer**: `customer@getitnow.com` (Loaded with ₹500 wallet credit)
  * **Seller A**: `sellerA@getitnow.com` (Blinkit Fast Mart)
  * **Seller B**: `sellerB@getitnow.com` (Zepto Electro Hub)
  * **Admin**: `admin@getitnow.com` (Console access)
  * *Password for all mock accounts is `password`*
* Realtime subscriptions are simulated using reactive event listeners. Orders status transitions instantly propagate between the Seller inbox and the Customer stepper tracking screen.
