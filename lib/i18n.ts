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
    "home.tool.image.desc": "JPG, PNG, WEBP, BMP, ICO ve PDF formatları arasında çevirin",
    "home.tool.doc.title": "Belge Dönüştürücü",
    "home.tool.doc.desc": "PDF, Word, TXT, Markdown ve HTML — her format her formata dönüşür",
    "home.tool.split.title": "PDF Bölücü",
    "home.tool.split.desc": "PDF sayfalarını ayırın veya belirli sayfaları çıkarın",
    "home.tool.merge.title": "PDF Birleştirici",
    "home.tool.merge.desc": "Birden fazla PDF dosyasını tek bir dosyada birleştirin",
    "home.tool.table.title": "Excel/CSV Dönüştürücü",
    "home.tool.table.desc": "XLSX ve CSV formatları arasında çevirin",
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
    "common.dragHint": "veya dosyayı buraya sürükleyip bırakın",

    "footer.privacy": "Gizlilik Politikası",
    "footer.rights": "Tüm hakları saklıdır.",

    "privacy.title": "Gizlilik Politikası",
    "privacy.updated": "Son güncelleme: 8 Haziran 2026",
    "privacy.intro":
      "Convertit olarak gizliliğinize önem veriyoruz. Bu sayfa, sitemizi kullanırken hangi verilerin toplandığını ve nasıl kullanıldığını açıklar.",
    "privacy.section1.title": "1. Dosya Dönüştürme İşlemleri",
    "privacy.section1.body":
      "Convertit'teki tüm dosya dönüştürme işlemleri tamamen tarayıcınızda gerçekleşir. Yüklediğiniz dosyalar hiçbir zaman sunucularımıza gönderilmez veya saklanmaz.",
    "privacy.section2.title": "2. Hesap Bilgileri",
    "privacy.section2.body":
      "Kayıt olduğunuzda, kimlik doğrulama hizmeti sağlayıcımız Clerk aracılığıyla ad, e-posta adresi gibi temel hesap bilgileriniz işlenir. Bu bilgiler yalnızca hesabınızı yönetmek ve premium üyelik durumunuzu belirlemek için kullanılır.",
    "privacy.section3.title": "3. Ödeme Bilgileri",
    "privacy.section3.body":
      "Premium üyelik satın aldığınızda ödeme işlemleriniz, yetkili Resmi Satıcımız (Merchant of Record) Paddle.com tarafından güvenli şekilde işlenir. Kredi kartı bilgileriniz hiçbir zaman bizim sunucularımızdan geçmez veya tarafımızca saklanmaz.",
    "privacy.section4.title": "4. Çerezler ve Reklamlar",
    "privacy.section4.body":
      "Sitemizde Google AdSense aracılığıyla reklam gösterilebilir. Google ve iş ortakları, sitemize ve diğer sitelere yaptığınız ziyaretlere dayalı reklamlar sunmak için çerezler kullanabilir. Tarayıcı ayarlarınızdan çerezleri yönetebilir veya devre dışı bırakabilirsiniz.",
    "privacy.section5.title": "5. Veri Paylaşımı",
    "privacy.section5.body":
      "Kişisel verileriniz; Clerk (kimlik doğrulama), Paddle (ödeme işleme) ve Google (reklam) gibi yalnızca hizmetin çalışması için gerekli olan güvenilir hizmet sağlayıcılarla paylaşılır. Verileriniz hiçbir şekilde satılmaz.",
    "privacy.section6.title": "6. Haklarınız",
    "privacy.section6.body":
      "Hesabınızla ilişkili kişisel verilerinizin görüntülenmesini, güncellenmesini veya silinmesini istediğinizde bizimle iletişime geçebilirsiniz.",
    "privacy.contact.title": "7. İletişim",
    "privacy.contact.body":
      "Gizlilik politikamızla ilgili sorularınız için bizimle iletişime geçebilirsiniz.",

    "image.title": "Resim Dönüştürücü",
    "image.planFree": "Ücretsiz plan: tek seferde 1 dosya, dosya başına {limit} MB. Daha fazlası için sağ üstten Premium'a geçebilirsiniz.",
    "image.planPremium": "✦ Premium plan: aynı anda {files} dosyaya kadar, dosya başına {limit} MB.",
    "image.dropMulti": "Birden fazla dosya seçebilirsiniz",
    "image.dropSingle": "JPG, PNG veya WEBP",
    "image.selectedCount": "{count} dosya seçildi",
    "image.selectFile": "Dosya seçmek için tıklayın",
    "image.targetFormat": "Hedef format",
    "image.quality": "Kalite",
    "image.convert": "Dönüştür",
    "image.converting": "Dönüştürülüyor…",
    "image.progress": "{done}/{total} dönüştürülüyor…",
    "image.download": "⬇ {name} dosyasını indir",
    "image.downloadAll": "⬇ Tümünü ZIP olarak indir",
    "image.errFileCountPremium": "Premium planda aynı anda en fazla {limit} dosya yükleyebilirsiniz.",
    "image.errFileCountFree": "Ücretsiz planda tek seferde yalnızca 1 dosya yükleyebilirsiniz. Daha fazlası için Premium'a geçin.",
    "image.errTooLarge": "\"{name}\" dosyası {limit} MB sınırını aşıyor{extra}.",
    "image.errTooLargeExtra": " (Premium'da sınır 200 MB'a çıkar)",
    "image.errUnknown": "Bilinmeyen bir hata oluştu",
    "image.errCanvas": "Canvas oluşturulamadı",
    "image.errConvertFailed": "Dönüşüm başarısız oldu",
    "image.combineIntoPdf": "Tüm resimleri tek bir PDF dosyasında birleştir",
    "image.combinedFileName": "birlesik.pdf",

    "doc.title": "Belge Dönüştürücü",
    "doc.direction": "Yön",
    "doc.dropFile": "Dosya seçmek için tıklayın",
    "doc.fileType": "{ext} dosyası",
    "doc.planPremium": "✦ Premium plan: dosya başına {limit} MB sınırı.",
    "doc.planFree": "Ücretsiz plan: dosya başına {limit} MB sınırı. Daha fazlası için sağ üstten Premium'a geçebilirsiniz.",
    "doc.convert": "Dönüştür",
    "doc.converting": "Dönüştürülüyor…",
    "doc.download": "⬇ {name} dosyasını indir",
    "doc.errUnknown": "Bilinmeyen bir hata oluştu",
    "doc.errTooLarge": "\"{name}\" dosyası {limit} MB sınırını aşıyor{extra}.",
    "doc.errTooLargeExtra": " (Premium'da sınır 200 MB'a çıkar)",
    "doc.pdfImagePageName": "{base}-sayfa-{page}.png",
    "doc.sourceFormat": "Kaynak",
    "doc.autoDetectHint": "Dosya seçtiğinizde kaynak format otomatik algılanır. Her format diğer tüm formatlara dönüştürülebilir.",
    "doc.errUnsupported": "\"{name}\" desteklenmeyen bir dosya türü.",
    "doc.errMixedFormats": "\"{name}\" atlandı: aynı anda tek tür dosya dönüştürülebilir.",
    "doc.selectedCount": "{count} dosya seçildi",
    "doc.progress": "{done}/{total} dönüştürülüyor…",
    "doc.downloadAll": "⬇ Tümünü ZIP olarak indir",
    "doc.errFile": "\"{name}\": {msg}",

    "split.title": "PDF Bölücü",
    "split.dropFile": "Bölünecek PDF'i seçmek için tıklayın",
    "split.dropHint": "PDF dosyası",
    "split.fileInfo": "{name} · {pages} sayfa",
    "split.planFree": "Ücretsiz plan: dosya başına {limit} MB sınırı. Daha fazlası için sağ üstten Premium'a geçebilirsiniz.",
    "split.planPremium": "✦ Premium plan: dosya başına {limit} MB sınırı.",
    "split.modeAll": "Her sayfayı ayrı PDF olarak kaydet",
    "split.modeRange": "Belirli sayfaları çıkar (örn. 1-3, 5)",
    "split.rangePlaceholder": "örn. 1-3, 5, 8-10",
    "split.split": "Böl",
    "split.splitting": "Bölünüyor…",
    "split.download": "⬇ {name} dosyasını indir",
    "split.downloadAll": "⬇ Tümünü ZIP olarak indir",
    "split.pageFileName": "{base}-sayfa-{page}.pdf",
    "split.rangeFileName": "{base}-secili-sayfalar.pdf",
    "split.errTooLarge": "\"{name}\" dosyası {limit} MB sınırını aşıyor{extra}.",
    "split.errTooLargeExtra": " (Premium'da sınır 200 MB'a çıkar)",
    "split.errInvalidPdf": "Dosya geçerli bir PDF değil veya şifre korumalı.",
    "split.errBadRange": "Geçersiz sayfa aralığı. 1 ile {max} arasında sayfalar girin (örn. 1-3, 5).",
    "split.errUnknown": "Bilinmeyen bir hata oluştu",

    "merge.title": "PDF Birleştirici",
    "merge.planFree": "Ücretsiz plan: en fazla {files} PDF, dosya başına {limit} MB. Daha fazlası için sağ üstten Premium'a geçebilirsiniz.",
    "merge.planPremium": "✦ Premium plan: aynı anda {files} PDF'e kadar, dosya başına {limit} MB.",
    "merge.selectFiles": "Birleştirilecek PDF dosyalarını seçmek için tıklayın",
    "merge.selectedCount": "{count} PDF seçildi",
    "merge.dropHint": "Birden fazla PDF seçebilirsiniz",
    "merge.moveUp": "Yukarı taşı",
    "merge.moveDown": "Aşağı taşı",
    "merge.remove": "Kaldır",
    "merge.merge": "Birleştir",
    "merge.merging": "Birleştiriliyor…",
    "merge.needTwo": "Birleştirmek için en az 2 PDF dosyası seçin.",
    "merge.download": "⬇ {name} dosyasını indir",
    "merge.resultFileName": "birlesik.pdf",
    "merge.errFileCountFree": "Ücretsiz planda en fazla {limit} PDF birleştirebilirsiniz. Daha fazlası için Premium'a geçin.",
    "merge.errFileCountPremium": "Premium planda aynı anda en fazla {limit} PDF birleştirebilirsiniz.",
    "merge.errTooLarge": "\"{name}\" dosyası {limit} MB sınırını aşıyor{extra}.",
    "merge.errTooLargeExtra": " (Premium'da sınır 200 MB'a çıkar)",
    "merge.errInvalidPdf": "Dosyalardan biri geçerli bir PDF değil.",
    "merge.errUnknown": "Bilinmeyen bir hata oluştu",

    "table.title": "Excel/CSV Dönüştürücü",
    "table.direction": "Yön",
    "table.planFree": "Ücretsiz plan: dosya başına {limit} MB sınırı. Daha fazlası için sağ üstten Premium'a geçebilirsiniz.",
    "table.planPremium": "✦ Premium plan: dosya başına {limit} MB sınırı.",
    "table.dropFile": "Dosya seçmek için tıklayın",
    "table.convert": "Dönüştür",
    "table.converting": "Dönüştürülüyor…",
    "table.progress": "{done}/{total} dönüştürülüyor…",
    "table.download": "⬇ {name} dosyasını indir",
    "table.downloadAll": "⬇ Tümünü ZIP olarak indir",
    "table.selectedCount": "{count} dosya seçildi",
    "table.errFile": "\"{name}\": {msg}",
    "table.csvSheetName": "{base}-{sheet}.csv",
    "table.errTooLarge": "\"{name}\" dosyası {limit} MB sınırını aşıyor{extra}.",
    "table.errTooLargeExtra": " (Premium'da sınır 200 MB'a çıkar)",
    "table.errUnknown": "Bilinmeyen bir hata oluştu",
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
    "home.tool.image.desc": "Convert between JPG, PNG, WEBP, BMP, ICO and PDF formats",
    "home.tool.doc.title": "Document Converter",
    "home.tool.doc.desc": "PDF, Word, TXT, Markdown and HTML — every format converts to every other",
    "home.tool.split.title": "PDF Splitter",
    "home.tool.split.desc": "Split PDF pages apart or extract specific pages",
    "home.tool.merge.title": "PDF Merger",
    "home.tool.merge.desc": "Combine multiple PDF files into a single document",
    "home.tool.table.title": "Excel/CSV Converter",
    "home.tool.table.desc": "Convert between XLSX and CSV formats",
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
    "common.dragHint": "or drag and drop a file here",

    "image.title": "Image Converter",
    "image.planFree": "Free plan: 1 file at a time, {limit} MB per file. Switch to Premium from the top right for more.",
    "image.planPremium": "✦ Premium plan: up to {files} files at once, {limit} MB per file.",
    "image.dropMulti": "You can select multiple files",
    "image.dropSingle": "JPG, PNG or WEBP",
    "image.selectedCount": "{count} files selected",
    "image.selectFile": "Click to select a file",
    "image.targetFormat": "Target format",
    "image.quality": "Quality",
    "image.convert": "Convert",
    "image.converting": "Converting…",
    "image.progress": "Converting {done}/{total}…",
    "image.download": "⬇ Download {name}",
    "image.downloadAll": "⬇ Download all as ZIP",
    "image.errFileCountPremium": "On the Premium plan you can upload up to {limit} files at once.",
    "image.errFileCountFree": "On the Free plan you can only upload 1 file at a time. Switch to Premium for more.",
    "image.errTooLarge": "\"{name}\" exceeds the {limit} MB limit{extra}.",
    "image.errTooLargeExtra": " (Premium raises the limit to 200 MB)",
    "image.errUnknown": "An unknown error occurred",
    "image.errCanvas": "Could not create canvas",
    "image.errConvertFailed": "Conversion failed",
    "image.combineIntoPdf": "Combine all images into a single PDF file",
    "image.combinedFileName": "combined.pdf",

    "doc.title": "Document Converter",
    "doc.direction": "Direction",
    "doc.dropFile": "Click to select a file",
    "doc.fileType": "{ext} file",
    "doc.planPremium": "✦ Premium plan: {limit} MB limit per file.",
    "doc.planFree": "Free plan: {limit} MB limit per file. Switch to Premium from the top right for more.",
    "doc.convert": "Convert",
    "doc.converting": "Converting…",
    "doc.download": "⬇ Download {name}",
    "doc.errUnknown": "An unknown error occurred",
    "doc.errTooLarge": "\"{name}\" exceeds the {limit} MB limit{extra}.",
    "doc.errTooLargeExtra": " (Premium raises the limit to 200 MB)",
    "doc.pdfImagePageName": "{base}-page-{page}.png",
    "doc.sourceFormat": "From",
    "doc.autoDetectHint": "The source format is auto-detected when you pick files. Every format can be converted to every other format.",
    "doc.errUnsupported": "\"{name}\" is an unsupported file type.",
    "doc.errMixedFormats": "\"{name}\" skipped: only one file type can be converted at a time.",
    "doc.selectedCount": "{count} files selected",
    "doc.progress": "Converting {done}/{total}…",
    "doc.downloadAll": "⬇ Download all as ZIP",
    "doc.errFile": "\"{name}\": {msg}",

    "split.title": "PDF Splitter",
    "split.dropFile": "Click to select the PDF to split",
    "split.dropHint": "PDF file",
    "split.fileInfo": "{name} · {pages} pages",
    "split.planFree": "Free plan: {limit} MB limit per file. Switch to Premium from the top right for more.",
    "split.planPremium": "✦ Premium plan: {limit} MB limit per file.",
    "split.modeAll": "Save every page as a separate PDF",
    "split.modeRange": "Extract specific pages (e.g. 1-3, 5)",
    "split.rangePlaceholder": "e.g. 1-3, 5, 8-10",
    "split.split": "Split",
    "split.splitting": "Splitting…",
    "split.download": "⬇ Download {name}",
    "split.downloadAll": "⬇ Download all as ZIP",
    "split.pageFileName": "{base}-page-{page}.pdf",
    "split.rangeFileName": "{base}-selected-pages.pdf",
    "split.errTooLarge": "\"{name}\" exceeds the {limit} MB limit{extra}.",
    "split.errTooLargeExtra": " (Premium raises the limit to 200 MB)",
    "split.errInvalidPdf": "The file is not a valid PDF or is password-protected.",
    "split.errBadRange": "Invalid page range. Enter pages between 1 and {max} (e.g. 1-3, 5).",
    "split.errUnknown": "An unknown error occurred",

    "merge.title": "PDF Merger",
    "merge.planFree": "Free plan: up to {files} PDFs, {limit} MB per file. Switch to Premium from the top right for more.",
    "merge.planPremium": "✦ Premium plan: up to {files} PDFs at once, {limit} MB per file.",
    "merge.selectFiles": "Click to select the PDF files to merge",
    "merge.selectedCount": "{count} PDFs selected",
    "merge.dropHint": "You can select multiple PDFs",
    "merge.moveUp": "Move up",
    "merge.moveDown": "Move down",
    "merge.remove": "Remove",
    "merge.merge": "Merge",
    "merge.merging": "Merging…",
    "merge.needTwo": "Select at least 2 PDF files to merge.",
    "merge.download": "⬇ Download {name}",
    "merge.resultFileName": "combined.pdf",
    "merge.errFileCountFree": "On the Free plan you can merge up to {limit} PDFs. Switch to Premium for more.",
    "merge.errFileCountPremium": "On the Premium plan you can merge up to {limit} PDFs at once.",
    "merge.errTooLarge": "\"{name}\" exceeds the {limit} MB limit{extra}.",
    "merge.errTooLargeExtra": " (Premium raises the limit to 200 MB)",
    "merge.errInvalidPdf": "One of the files is not a valid PDF.",
    "merge.errUnknown": "An unknown error occurred",

    "table.title": "Excel/CSV Converter",
    "table.direction": "Direction",
    "table.planFree": "Free plan: {limit} MB limit per file. Switch to Premium from the top right for more.",
    "table.planPremium": "✦ Premium plan: {limit} MB limit per file.",
    "table.dropFile": "Click to select a file",
    "table.convert": "Convert",
    "table.converting": "Converting…",
    "table.progress": "Converting {done}/{total}…",
    "table.download": "⬇ Download {name}",
    "table.downloadAll": "⬇ Download all as ZIP",
    "table.selectedCount": "{count} files selected",
    "table.errFile": "\"{name}\": {msg}",
    "table.csvSheetName": "{base}-{sheet}.csv",
    "table.errTooLarge": "\"{name}\" exceeds the {limit} MB limit{extra}.",
    "table.errTooLargeExtra": " (Premium raises the limit to 200 MB)",
    "table.errUnknown": "An unknown error occurred",

    "footer.privacy": "Privacy Policy",
    "footer.rights": "All rights reserved.",

    "privacy.title": "Privacy Policy",
    "privacy.updated": "Last updated: June 8, 2026",
    "privacy.intro":
      "At Convertit, we care about your privacy. This page explains what data is collected when you use our site and how it is used.",
    "privacy.section1.title": "1. File Conversion",
    "privacy.section1.body":
      "All file conversions on Convertit happen entirely in your browser. The files you upload are never sent to or stored on our servers.",
    "privacy.section2.title": "2. Account Information",
    "privacy.section2.body":
      "When you sign up, basic account information such as your name and email address is processed through our authentication provider, Clerk. This information is used solely to manage your account and determine your premium membership status.",
    "privacy.section3.title": "3. Payment Information",
    "privacy.section3.body":
      "When you purchase a premium membership, your payment is securely processed by our authorized Merchant of Record, Paddle.com. Your card details never pass through or get stored on our servers.",
    "privacy.section4.title": "4. Cookies and Advertising",
    "privacy.section4.body":
      "Our site may display ads through Google AdSense. Google and its partners may use cookies to serve ads based on your visits to this and other sites. You can manage or disable cookies through your browser settings.",
    "privacy.section5.title": "5. Data Sharing",
    "privacy.section5.body":
      "Your personal data is shared only with trusted service providers necessary for the site to function, such as Clerk (authentication), Paddle (payment processing), and Google (advertising). We never sell your data.",
    "privacy.section6.title": "6. Your Rights",
    "privacy.section6.body":
      "You may contact us at any time to view, update, or request deletion of the personal data associated with your account.",
    "privacy.contact.title": "7. Contact",
    "privacy.contact.body":
      "If you have any questions about this privacy policy, feel free to reach out to us.",
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
