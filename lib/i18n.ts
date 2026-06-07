"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "convertit:lang";
const EVENT_NAME = "convertit:lang-changed";

export type Lang = "tr" | "en";

const DICT = {
  tr: {
    "nav.signIn": "Giriş yap",
    "nav.signUp": "Kayıt ol",
    "nav.premiumOn": "Premium'dan çık",
    "nav.premiumOff": "✦ Premium'a geç",
    "nav.premiumBadge": "✦ Premium",

    "home.badge": "%100 tarayıcıda çalışır · gizliliğiniz korunur",
    "home.titleA": "Dosyalarınızı ",
    "home.titleHighlight": "saniyeler içinde",
    "home.titleB": " dönüştürün",
    "home.subtitle":
      "Dosyalarınız hiçbir sunucuya gönderilmez, dönüşüm tamamen tarayıcınızda gerçekleşir.",
    "home.tool.image.title": "Resim Dönüştürücü",
    "home.tool.image.desc": "JPG, PNG, WEBP ve PDF formatları arasında çevirin",
    "home.tool.doc.title": "Belge Dönüştürücü",
    "home.tool.doc.desc": "DOCX, TXT, PDF ve Markdown formatları arasında çevirin",
    "home.open": "Aç →",
    "home.plan.free.title": "Ücretsiz Plan",
    "home.plan.free.item1": "Tek seferde 1 dosya",
    "home.plan.free.item2": "Dosya başına 15 MB sınırı",
    "home.plan.free.item3": "Tüm dönüşüm araçlarına erişim",
    "home.plan.premium.title": "Premium Plan",
    "home.plan.premium.badge": "Yeni",
    "home.plan.premium.item1": "Aynı anda 10 dosyaya kadar toplu dönüşüm",
    "home.plan.premium.item2": "Dosya başına 200 MB sınırı",
    "home.plan.premium.item3": "Öncelikli yeni özellik erişimi",
    "home.plan.premium.note": "Sağ üstteki \"Premium'a geç\" düğmesiyle deneyebilirsiniz.",

    "back.home": "← Ana sayfa",

    "image.title": "Resim Dönüştürücü",
    "image.planFree": "Ücretsiz plan: tek seferde 1 dosya, dosya başına {limit} MB. Daha fazlası için sağ üstten Premium'a geçebilirsiniz.",
    "image.planPremium": "✦ Premium plan: aynı anda {files} dosyaya kadar, dosya başına {limit} MB.",
    "image.dropMulti": "Birden fazla dosya seçebilirsiniz",
    "image.dropSingle": "JPG, PNG veya WEBP",
    "image.selectedCount": "{count} dosya seçildi",
    "image.selectFile": "Dosya seçmek için tıklayın",
    "image.targetFormat": "Hedef format",
    "image.convert": "Dönüştür",
    "image.converting": "Dönüştürülüyor…",
    "image.download": "⬇ {name} dosyasını indir",
    "image.errFileCountPremium": "Premium planda aynı anda en fazla {limit} dosya yükleyebilirsiniz.",
    "image.errFileCountFree": "Ücretsiz planda tek seferde yalnızca 1 dosya yükleyebilirsiniz. Daha fazlası için Premium'a geçin.",
    "image.errTooLarge": "\"{name}\" dosyası {limit} MB sınırını aşıyor{extra}.",
    "image.errTooLargeExtra": " (Premium'da sınır 200 MB'a çıkar)",
    "image.errUnknown": "Bilinmeyen bir hata oluştu",

    "doc.title": "Belge Dönüştürücü",
    "doc.direction": "Yön",
    "doc.dropFile": "Dosya seçmek için tıklayın",
  },
  en: {
    "nav.signIn": "Sign in",
    "nav.signUp": "Sign up",
    "nav.premiumOn": "Exit Premium",
    "nav.premiumOff": "✦ Go Premium",
    "nav.premiumBadge": "✦ Premium",

    "home.badge": "Runs 100% in your browser · your privacy is protected",
    "home.titleA": "Convert your files ",
    "home.titleHighlight": "in seconds",
    "home.titleB": "",
    "home.subtitle":
      "Your files are never uploaded to a server — the conversion happens entirely in your browser.",
    "home.tool.image.title": "Image Converter",
    "home.tool.image.desc": "Convert between JPG, PNG, WEBP and PDF formats",
    "home.tool.doc.title": "Document Converter",
    "home.tool.doc.desc": "Convert between DOCX, TXT, PDF and Markdown formats",
    "home.open": "Open →",
    "home.plan.free.title": "Free Plan",
    "home.plan.free.item1": "1 file at a time",
    "home.plan.free.item2": "15 MB limit per file",
    "home.plan.free.item3": "Access to all conversion tools",
    "home.plan.premium.title": "Premium Plan",
    "home.plan.premium.badge": "New",
    "home.plan.premium.item1": "Batch convert up to 10 files at once",
    "home.plan.premium.item2": "200 MB limit per file",
    "home.plan.premium.item3": "Priority access to new features",
    "home.plan.premium.note": "Try it out with the \"Go Premium\" button in the top right.",

    "back.home": "← Home",

    "image.title": "Image Converter",
    "image.planFree": "Free plan: 1 file at a time, {limit} MB per file. Switch to Premium from the top right for more.",
    "image.planPremium": "✦ Premium plan: up to {files} files at once, {limit} MB per file.",
    "image.dropMulti": "You can select multiple files",
    "image.dropSingle": "JPG, PNG or WEBP",
    "image.selectedCount": "{count} files selected",
    "image.selectFile": "Click to select a file",
    "image.targetFormat": "Target format",
    "image.convert": "Convert",
    "image.converting": "Converting…",
    "image.download": "⬇ Download {name}",
    "image.errFileCountPremium": "On the Premium plan you can upload up to {limit} files at once.",
    "image.errFileCountFree": "On the Free plan you can only upload 1 file at a time. Switch to Premium for more.",
    "image.errTooLarge": "\"{name}\" exceeds the {limit} MB limit{extra}.",
    "image.errTooLargeExtra": " (Premium raises the limit to 200 MB)",
    "image.errUnknown": "An unknown error occurred",

    "doc.title": "Document Converter",
    "doc.direction": "Direction",
    "doc.dropFile": "Click to select a file",
  },
} as const;

export type TKey = keyof typeof DICT["tr"];

export function getLang(): Lang {
  if (typeof window === "undefined") return "tr";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "en" ? "en" : "tr";
}

export function setLang(lang: Lang) {
  window.localStorage.setItem(STORAGE_KEY, lang);
  window.dispatchEvent(new Event(EVENT_NAME));
}

function format(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    key in vars ? String(vars[key]) : `{${key}}`
  );
}

export function useLanguage() {
  const [lang, setLangState] = useState<Lang>("tr");

  useEffect(() => {
    setLangState(getLang());
    const onChange = () => setLangState(getLang());
    window.addEventListener(EVENT_NAME, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT_NAME, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  function t(key: TKey, vars?: Record<string, string | number>) {
    return format(DICT[lang][key], vars);
  }

  return {
    lang,
    toggle: () => setLang(lang === "tr" ? "en" : "tr"),
    t,
  };
}
