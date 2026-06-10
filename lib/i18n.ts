"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "convertdesk:lang";
const EVENT_NAME = "convertdesk:lang-changed";

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
    "footer.tagline":
      "Dosyalarınızı tarayıcınızdan çıkmadan dönüştürün. Hiçbir dosya sunucuya yüklenmez.",
    "footer.toolsTitle": "Araçlar",
    "footer.companyTitle": "Kurumsal",
    "footer.about": "Hakkımızda",
    "footer.contact": "İletişim",
    "footer.terms": "Kullanım Koşulları",

    "home.trust.directions": "29+ dönüşüm yönü",
    "home.trust.browser": "%100 tarayıcıda çalışır",
    "home.trust.free": "Ücretsiz ve kayıt gerektirmez",

    "home.how.title": "Nasıl çalışır?",
    "home.how.step1.title": "1. Dosyanızı seçin",
    "home.how.step1.body":
      "Dönüştürmek istediğiniz dosyayı tıklayarak seçin veya sürükleyip bırakın. PDF, Word, Excel, resim ve daha birçok format desteklenir.",
    "home.how.step2.title": "2. Hedef formatı belirleyin",
    "home.how.step2.body":
      "Kaynak format otomatik algılanır. Tek yapmanız gereken dosyanızın hangi formata dönüşeceğini seçmek.",
    "home.how.step3.title": "3. Dönüştürün ve indirin",
    "home.how.step3.body":
      "Dönüşüm saniyeler içinde cihazınızda tamamlanır. Sonucu tek tek veya ZIP arşivi olarak indirebilirsiniz.",

    "home.faq.title": "Sık Sorulan Sorular",
    "home.faq.q1": "Dosyalarım sunucuya yükleniyor mu?",
    "home.faq.a1":
      "Hayır. ConvertDesk'i farklı kılan tam olarak bu: tüm dönüşümler tarayıcınızın içinde, kendi cihazınızda gerçekleşir. Dosyalarınız internet üzerinden hiçbir sunucuya gönderilmez, bizim tarafımızdan görülmez ve saklanmaz.",
    "home.faq.q2": "Hangi formatlar destekleniyor?",
    "home.faq.a2":
      "Belge tarafında PDF, Word (DOCX), TXT, Markdown ve HTML — her format diğer tüm formatlara dönüştürülebilir. Resim tarafında JPG, PNG, WEBP, BMP, ICO ve PDF. Tablo tarafında Excel (XLSX) ve CSV. Ayrıca PDF birleştirme ve bölme araçları da mevcut.",
    "home.faq.q3": "Gerçekten ücretsiz mi?",
    "home.faq.a3":
      "Evet. Temel kullanım tamamen ücretsizdir ve kayıt gerektirmez. Daha büyük dosyalar (200 MB'a kadar) ve aynı anda 10 dosyaya kadar toplu dönüşüm isteyenler için Premium plan sunuyoruz.",
    "home.faq.q4": "Dosya boyutu sınırı nedir?",
    "home.faq.a4":
      "Ücretsiz planda dosya başına 15 MB, Premium planda 200 MB sınırı vardır. Dönüşüm cihazınızda gerçekleştiği için hız, internet bağlantınızdan değil cihazınızın gücünden gelir.",
    "home.faq.q5": "İnternet bağlantısı kesilirse ne olur?",
    "home.faq.a5":
      "Sayfa yüklendikten sonra dönüşüm motoru tamamen tarayıcınızda çalıştığı için, dönüşüm sırasında bağlantınız kesilse bile işleminiz etkilenmez.",
    "home.faq.q6": "Dönüştürülen dosyaların kalitesi nasıl?",
    "home.faq.a6":
      "PDF çıktılarında seçilebilir gerçek metin üretiriz (görüntü değil). PDF'ten Word'e geçerken başlıklar, kalın/italik biçimler ve hizalamalar korunmaya çalışılır. Resimlerde JPG ve WEBP için kalite ayarı sunarız.",

    "about.title": "Hakkımızda",
    "about.intro":
      "ConvertDesk, dosya dönüştürmenin gizlilikten ödün vermeden de mümkün olduğunu kanıtlamak için kuruldu.",
    "about.p1":
      "Geleneksel online dönüştürücüler dosyalarınızı kendi sunucularına yükler, orada işler ve size geri gönderir. Bu süreçte dosyalarınızın kopyaları yabancı sunucularda dolaşır; ne kadar süre saklandığını, kimlerin erişebildiğini bilemezsiniz. Özel belgeler, sözleşmeler, kimlik fotokopileri için bu ciddi bir risktir.",
    "about.p2":
      "ConvertDesk bu sorunu kökünden çözer: dönüşüm motorumuz tamamen tarayıcınızın içinde çalışır. Dosyanız cihazınızdan asla çıkmaz. Biz dahil hiç kimse dosyalarınızı göremez — çünkü teknik olarak bize hiç ulaşmazlar.",
    "about.p3":
      "PDF, Word, Excel, Markdown, HTML ve resim formatları arasında dönüşüm; PDF birleştirme ve bölme; toplu dönüştürme ve ZIP indirme gibi araçların tamamını modern web teknolojileriyle, ücretsiz olarak sunuyoruz.",
    "about.whyTitle": "Neden ConvertDesk?",
    "about.why1": "Dosyalarınız asla sunucuya yüklenmez — %100 yerel işlem",
    "about.why2": "Kayıt zorunluluğu yok, temel kullanım tamamen ücretsiz",
    "about.why3": "Her belge formatı diğer tüm formatlara dönüşür",
    "about.why4": "Açık ve dürüst fiyatlandırma: tek Premium plan, gizli ücret yok",

    "contact.title": "İletişim",
    "contact.intro":
      "Soru, öneri veya geri bildirimleriniz için bize aşağıdaki kanallardan ulaşabilirsiniz. Genellikle 1-2 iş günü içinde yanıt veriyoruz.",
    "contact.emailTitle": "E-posta",
    "contact.emailBody": "Destek ve genel sorular için bize e-posta gönderin:",
    "contact.privacyNote":
      "Not: Dosyalarınız bize hiçbir zaman ulaşmadığı için, dosya içerikleriyle ilgili destek taleplerinde lütfen dosyanın kendisini değil, karşılaştığınız hatanın ekran görüntüsünü paylaşın.",

    "terms.title": "Kullanım Koşulları",
    "terms.updated": "Son güncelleme: 10 Haziran 2026",
    "terms.intro":
      "ConvertDesk'i kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız. Lütfen dikkatlice okuyun.",
    "terms.s1.title": "1. Hizmetin Kapsamı",
    "terms.s1.body":
      "ConvertDesk, dosya dönüştürme işlemlerini kullanıcının kendi tarayıcısında gerçekleştiren ücretsiz bir web uygulamasıdır. Dosyalarınız sunucularımıza yüklenmez; bu nedenle dosyalarınızın içeriğinden ve dönüşüm sonuçlarının doğruluğundan kaynaklanan sorumluluk kullanıcıya aittir.",
    "terms.s2.title": "2. Kabul Edilebilir Kullanım",
    "terms.s2.body":
      "Hizmeti yalnızca yasal amaçlarla kullanabilirsiniz. Telif hakkıyla korunan içerikleri izinsiz dönüştürmek, zararlı yazılım yaymak veya hizmetin altyapısına zarar vermeye çalışmak yasaktır.",
    "terms.s3.title": "3. Premium Üyelik",
    "terms.s3.body":
      "Premium üyelik, Resmi Satıcımız (Merchant of Record) Paddle aracılığıyla satın alınır. Ödeme, faturalandırma ve iade süreçleri Paddle'ın koşullarına tabidir. Aboneliğinizi istediğiniz zaman iptal edebilirsiniz; iptal, mevcut fatura döneminin sonunda geçerli olur.",
    "terms.s4.title": "4. Sorumluluk Reddi",
    "terms.s4.body":
      "Hizmet \"olduğu gibi\" sunulur. Dönüşüm sonuçlarının belirli bir amaca uygunluğu garanti edilmez. Önemli belgelerde dönüşüm sonucunu kontrol etmek kullanıcının sorumluluğundadır. ConvertDesk, dolaylı veya doğrudan veri kaybından sorumlu tutulamaz.",
    "terms.s5.title": "5. Değişiklikler",
    "terms.s5.body":
      "Bu koşullar zaman zaman güncellenebilir. Önemli değişiklikler bu sayfada duyurulur. Değişiklik sonrası hizmeti kullanmaya devam etmeniz, güncel koşulları kabul ettiğiniz anlamına gelir.",
    "terms.s6.title": "6. İletişim",
    "terms.s6.body":
      "Bu koşullarla ilgili sorularınız için İletişim sayfamızdan bize ulaşabilirsiniz.",

    "privacy.title": "Gizlilik Politikası",
    "privacy.updated": "Son güncelleme: 8 Haziran 2026",
    "privacy.intro":
      "ConvertDesk olarak gizliliğinize önem veriyoruz. Bu sayfa, sitemizi kullanırken hangi verilerin toplandığını ve nasıl kullanıldığını açıklar.",
    "privacy.section1.title": "1. Dosya Dönüştürme İşlemleri",
    "privacy.section1.body":
      "ConvertDesk'teki tüm dosya dönüştürme işlemleri tamamen tarayıcınızda gerçekleşir. Yüklediğiniz dosyalar hiçbir zaman sunucularımıza gönderilmez veya saklanmaz.",
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
    "footer.tagline":
      "Convert your files without them ever leaving your browser. Nothing is uploaded to any server.",
    "footer.toolsTitle": "Tools",
    "footer.companyTitle": "Company",
    "footer.about": "About",
    "footer.contact": "Contact",
    "footer.terms": "Terms of Use",

    "home.trust.directions": "29+ conversion directions",
    "home.trust.browser": "Runs 100% in your browser",
    "home.trust.free": "Free, no sign-up required",

    "home.how.title": "How does it work?",
    "home.how.step1.title": "1. Pick your file",
    "home.how.step1.body":
      "Click to select the file you want to convert, or drag and drop it. PDF, Word, Excel, images and many more formats are supported.",
    "home.how.step2.title": "2. Choose the target format",
    "home.how.step2.body":
      "The source format is detected automatically. All you have to do is choose which format your file should become.",
    "home.how.step3.title": "3. Convert and download",
    "home.how.step3.body":
      "The conversion finishes on your device within seconds. Download the results one by one or as a single ZIP archive.",

    "home.faq.title": "Frequently Asked Questions",
    "home.faq.q1": "Are my files uploaded to a server?",
    "home.faq.a1":
      "No. This is exactly what makes ConvertDesk different: every conversion runs inside your browser, on your own device. Your files are never sent over the internet, never seen by us, and never stored anywhere.",
    "home.faq.q2": "Which formats are supported?",
    "home.faq.a2":
      "On the document side: PDF, Word (DOCX), TXT, Markdown and HTML — every format converts to every other one. On the image side: JPG, PNG, WEBP, BMP, ICO and PDF. For tables: Excel (XLSX) and CSV. There are also PDF merge and split tools.",
    "home.faq.q3": "Is it really free?",
    "home.faq.a3":
      "Yes. Basic usage is completely free and requires no sign-up. For larger files (up to 200 MB) and bulk conversion of up to 10 files at once, we offer a Premium plan.",
    "home.faq.q4": "What is the file size limit?",
    "home.faq.a4":
      "The free plan allows 15 MB per file, Premium raises that to 200 MB. Since conversion happens on your device, speed depends on your hardware rather than your internet connection.",
    "home.faq.q5": "What happens if my connection drops?",
    "home.faq.a5":
      "Once the page has loaded, the conversion engine runs entirely in your browser — so even if your connection drops mid-conversion, your work is unaffected.",
    "home.faq.q6": "How good is the output quality?",
    "home.faq.a6":
      "PDF outputs contain real selectable text (not images). When going from PDF to Word we preserve headings, bold/italic styles and alignment where possible. For images we offer a quality slider for JPG and WEBP.",

    "about.title": "About Us",
    "about.intro":
      "ConvertDesk was built to prove that file conversion is possible without sacrificing privacy.",
    "about.p1":
      "Traditional online converters upload your files to their servers, process them there and send them back. Along the way, copies of your files travel through machines you don't control; you can't know how long they're kept or who can access them. For private documents, contracts or ID scans, that's a serious risk.",
    "about.p2":
      "ConvertDesk solves this at the root: our conversion engine runs entirely inside your browser. Your file never leaves your device. Nobody — including us — can see your files, because they technically never reach us.",
    "about.p3":
      "Conversion between PDF, Word, Excel, Markdown, HTML and image formats; PDF merging and splitting; bulk conversion with ZIP download — all of it built on modern web technology, free to use.",
    "about.whyTitle": "Why ConvertDesk?",
    "about.why1": "Your files are never uploaded — 100% local processing",
    "about.why2": "No forced sign-up, core features completely free",
    "about.why3": "Every document format converts to every other format",
    "about.why4": "Honest pricing: one Premium plan, no hidden fees",

    "contact.title": "Contact",
    "contact.intro":
      "Reach us through the channels below for questions, suggestions or feedback. We usually reply within 1-2 business days.",
    "contact.emailTitle": "Email",
    "contact.emailBody": "For support and general questions, send us an email:",
    "contact.privacyNote":
      "Note: since your files never reach us, for support requests about file contents please share a screenshot of the error rather than the file itself.",

    "terms.title": "Terms of Use",
    "terms.updated": "Last updated: June 10, 2026",
    "terms.intro":
      "By using ConvertDesk you agree to the terms below. Please read them carefully.",
    "terms.s1.title": "1. Scope of the Service",
    "terms.s1.body":
      "ConvertDesk is a free web application that performs file conversions inside the user's own browser. Your files are not uploaded to our servers; responsibility for file contents and for verifying conversion results therefore rests with the user.",
    "terms.s2.title": "2. Acceptable Use",
    "terms.s2.body":
      "You may only use the service for lawful purposes. Converting copyrighted content without permission, distributing malware, or attempting to damage the service's infrastructure is prohibited.",
    "terms.s3.title": "3. Premium Membership",
    "terms.s3.body":
      "Premium membership is purchased through our Merchant of Record, Paddle. Payment, billing and refunds are subject to Paddle's terms. You can cancel your subscription at any time; cancellation takes effect at the end of the current billing period.",
    "terms.s4.title": "4. Disclaimer",
    "terms.s4.body":
      "The service is provided \"as is\". Fitness of conversion results for any particular purpose is not guaranteed. Verifying the output of important documents is the user's responsibility. ConvertDesk cannot be held liable for direct or indirect data loss.",
    "terms.s5.title": "5. Changes",
    "terms.s5.body":
      "These terms may be updated from time to time. Significant changes will be announced on this page. Continuing to use the service after a change means you accept the updated terms.",
    "terms.s6.title": "6. Contact",
    "terms.s6.body":
      "For questions about these terms, you can reach us via our Contact page.",

    "privacy.title": "Privacy Policy",
    "privacy.updated": "Last updated: June 8, 2026",
    "privacy.intro":
      "At ConvertDesk, we care about your privacy. This page explains what data is collected when you use our site and how it is used.",
    "privacy.section1.title": "1. File Conversion",
    "privacy.section1.body":
      "All file conversions on ConvertDesk happen entirely in your browser. The files you upload are never sent to or stored on our servers.",
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
  // Fall back to the pre-rename key so existing users keep their preference.
  const stored =
    window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem("convertit:lang");
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
