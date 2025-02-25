# Strapi 5 - AI-Powered Document Entry Wizard

![Strapi 5](https://img.shields.io/badge/Strapi-5.x-blue.svg?style=flat-square)
![License](https://img.shields.io/github/license/your-repo/your-project.svg?style=flat-square)

## 🚀 Introduction

The **AI-Powered Document Entry Wizard** is a **Strapi 5 plugin** that allows users to upload **.docx files**,
automatically analyze their contents using **AI**, and generate structured entries in Strapi's **Content Manager**.

This plugin is designed to streamline content creation by converting **documents** into **dynamic structured data**. It
extracts text, images, headings, lists, and SEO metadata, ensuring full compliance with **Strapi 5 Marketplace
submission rules**.

## ✨ Features

- 📂 **Drag & Drop Multi-File Upload** – Upload multiple `.docx` files asynchronously.
- 🤖 **AI-Powered Content Structuring** – OpenAI automatically converts documents into structured Strapi entries.
- 🔄 **Real-time Progress Tracking** – Displays an individual progress bar for each file upload.
- 📝 **Dynamic Schema Parsing** – Auto-maps content to **Dynamic Zones, Components, and Relations**.
- 🔍 **SEO Optimization** – Automatically fills in metadata, including **meta titles, descriptions, and keywords**.
- ✅ **Strapi 5 Compatible** – Fully built using **Strapi 5 Document Service**, ensuring compatibility.

## 🚧 Roadmap

- 🖼️ **Image Extraction** – Extracts and embeds document images.

## 👏 Support My Work

Hey there! I'm actively maintaining this project on my free time, and if you've found it useful, I'd greatly appreciate
your support. Donations will help cover hosting costs, tools, and allow me to dedicate additional time for updates,
features, and bug fixes.

You can contribute by donating through this link:

[![Donate via PayPal](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://www.paypal.com/donate/?business=DFMEGWFQUZHCQ&no_recurring=0&currency_code=EUR)

I’d be forever grateful for your generosity. Thank you for helping keep this project alive and growing! ❤️

---

## 📦 Installation

### **1. Install via npm**

```bash
npm install strapi-plugin-entry-wizard
```

### **2. Enable the Plugin**

Modify your `config/plugins.js` file:

```js
module.exports = {
  'entry-wizard': {
    enabled: true,
  },
};
```

### **3. Restart Strapi**

```bash
npm run develop
```

## 🚀 Usage

1. **Go to Content Manager** in Strapi Admin.
2. Click the **"Generate Entry"** button.
3. Upload `.docx` files and start the AI processing.
4. Strapi will create structured entries with extracted content.

## 🔧 Configuration

The plugin supports additional customization in `config/plugins.js`:

```js
module.exports = {
  'entry-wizard': {
    enabled: true,
    config: {
      openaiApiKey: process.env.OPENAI_API_KEY, // Optional API Key
      maxUploadSize: 5, // Limit file size (in MB)
    },
  },
};
```

## 📜 License

This project is **MIT Licensed** – you're free to use, modify, and distribute it!

Made with ❤️ for **Strapi 5 Developers**.

