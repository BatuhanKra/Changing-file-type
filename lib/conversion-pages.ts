// Registry of SEO landing pages for every document conversion direction.
// Each entry drives a statically generated page at /<slug> with unique
// Turkish copy targeting "X to Y" search queries.

import type { DocFormat, TargetFormat } from "./document-convert";

type FormatMeta = {
  /** Slug fragment used in URLs, in the English form people actually search. */
  slug: string;
  /** Display name used in Turkish copy. */
  name: string;
  /** ". . . dosyaları" tail describing the format, used to vary page copy. */
  blurb: string;
};

const FORMAT_META: Record<TargetFormat, FormatMeta> = {
  pdf: {
    slug: "pdf",
    name: "PDF",
    blurb:
      "PDF, her cihazda aynı görünen, paylaşım ve arşivleme için en yaygın kullanılan belge formatıdır",
  },
  docx: {
    slug: "word",
    name: "Word",
    blurb:
      "Word (DOCX), üzerinde kolayca düzenleme yapabileceğiniz en yaygın ofis belgesi formatıdır",
  },
  txt: {
    slug: "txt",
    name: "TXT",
    blurb:
      "TXT, her metin düzenleyicide açılan, biçimlendirme içermeyen en sade ve evrensel metin formatıdır",
  },
  md: {
    slug: "markdown",
    name: "Markdown",
    blurb:
      "Markdown, geliştiriciler ve yazarlar arasında popüler olan, okunaklı ve hafif bir işaretleme formatıdır",
  },
  html: {
    slug: "html",
    name: "HTML",
    blurb: "HTML, web sayfalarının yapısını oluşturan standart işaretleme dilidir",
  },
  png: {
    slug: "png",
    name: "PNG",
    blurb:
      "PNG, kayıpsız sıkıştırma kullanan ve her platformda görüntülenebilen yaygın bir görsel formatıdır",
  },
};

export type ConversionPage = {
  slug: string;
  source: DocFormat;
  target: TargetFormat;
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  steps: string[];
  faq: { q: string; a: string }[];
};

const SOURCES: DocFormat[] = ["pdf", "docx", "txt", "md", "html"];
const TARGETS: TargetFormat[] = ["pdf", "docx", "txt", "md", "html", "png"];

function buildPage(source: DocFormat, target: TargetFormat): ConversionPage {
  const s = FORMAT_META[source];
  const t = FORMAT_META[target];
  const slug = `${s.slug}-to-${t.slug}`;

  return {
    slug,
    source,
    target,
    title: `${s.name} → ${t.name} Dönüştürücü`,
    metaTitle: `${s.name} to ${t.name} — Ücretsiz ${s.name} ${t.name} Dönüştürücü`,
    metaDescription: `${s.name} dosyalarınızı ücretsiz ve güvenli şekilde ${t.name} formatına çevirin. Yükleme yok: dönüşüm tamamen tarayıcınızda gerçekleşir, dosyanız cihazınızdan çıkmaz.`,
    intro: `${s.blurb}. ${t.blurb}. Bu araç, ${s.name} dosyanızı saniyeler içinde ${t.name} formatına dönüştürür — üstelik dosyanız hiçbir sunucuya yüklenmeden. Dönüşüm motoru tamamen tarayıcınızın içinde çalıştığı için belgeleriniz yalnızca sizin cihazınızda kalır.`,
    steps: [
      `${s.name} dosyanızı seçin veya sürükleyip bırakın (aynı anda birden fazla dosya seçebilirsiniz).`,
      `Hedef format olarak ${t.name} seçili olduğundan emin olun — kaynak format otomatik algılanır.`,
      `"Dönüştür" düğmesine basın ve ${t.name} dosyanızı indirin. Birden fazla sonuç varsa hepsini tek ZIP olarak alabilirsiniz.`,
    ],
    faq: [
      {
        q: `${s.name} dosyam sunucuya yükleniyor mu?`,
        a: `Hayır. Dönüşüm tamamen tarayıcınızda, kendi cihazınızda gerçekleşir. ${s.name} dosyanız internet üzerinden hiçbir yere gönderilmez ve bizim tarafımızdan görülmez.`,
      },
      {
        q: `${s.name}'den ${t.name}'e dönüşüm ücretsiz mi?`,
        a: `Evet, tamamen ücretsizdir ve kayıt gerektirmez. Ücretsiz planda dosya başına 15 MB sınırı vardır; Premium ile bu sınır 200 MB'a çıkar ve aynı anda 10 dosyaya kadar toplu dönüşüm yapabilirsiniz.`,
      },
      {
        q: `Aynı anda birden fazla ${s.name} dosyası dönüştürebilir miyim?`,
        a: `Evet. Birden fazla dosya seçtiğinizde hepsi sırayla dönüştürülür ve sonuçları tek tek ya da ZIP arşivi olarak indirebilirsiniz.`,
      },
    ],
  };
}

export const CONVERSION_PAGES: ConversionPage[] = SOURCES.flatMap((source) =>
  TARGETS.filter((target) => target !== source).map((target) => buildPage(source, target))
);

export function getConversionPage(slug: string): ConversionPage | undefined {
  return CONVERSION_PAGES.find((p) => p.slug === slug);
}
