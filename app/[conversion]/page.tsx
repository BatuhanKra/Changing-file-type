import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CONVERSION_PAGES, getConversionPage } from "@/lib/conversion-pages";
import DocumentConverterTool from "@/components/DocumentConverterTool";

export const dynamicParams = false;

export function generateStaticParams() {
  return CONVERSION_PAGES.map((page) => ({ conversion: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ conversion: string }>;
}): Promise<Metadata> {
  const { conversion } = await params;
  const page = getConversionPage(conversion);
  if (!page) return {};
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: `/${page.slug}` },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      type: "website",
      locale: "tr_TR",
    },
  };
}

export default async function ConversionLandingPage({
  params,
}: {
  params: Promise<{ conversion: string }>;
}) {
  const { conversion } = await params;
  const page = getConversionPage(conversion);
  if (!page) notFound();

  // Cross-link a handful of related directions for internal SEO structure.
  const related = CONVERSION_PAGES.filter(
    (p) => p.slug !== page.slug && (p.source === page.source || p.target === page.target)
  ).slice(0, 6);

  return (
    <div className="flex flex-col flex-1 items-center bg-background">
      <main className="flex w-full max-w-xl flex-col gap-6 py-12 px-6">
        <Link href="/" className="text-sm text-foreground/50 transition-colors hover:text-accent">
          ← Ana sayfa
        </Link>

        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{page.title}</h1>
          <p className="text-sm leading-relaxed text-foreground/60">{page.metaDescription}</p>
        </div>

        <DocumentConverterTool initialSource={page.source} initialTarget={page.target} />

        <section className="flex flex-col gap-3 rounded-2xl border border-card-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Bu araç hakkında</h2>
          <p className="text-sm leading-relaxed text-foreground/70">{page.intro}</p>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-card-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Nasıl kullanılır?</h2>
          <ol className="flex flex-col gap-2">
            {page.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-foreground/70">
                <span className="mt-0.5 font-semibold text-accent">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-card-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Sık sorulan sorular</h2>
          <div className="flex flex-col gap-4">
            {page.faq.map((item, i) => (
              <div key={i} className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-foreground">{item.q}</h3>
                <p className="text-sm leading-relaxed text-foreground/70">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {related.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-foreground">İlgili dönüştürücüler</h2>
            <div className="flex flex-wrap gap-2">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/${p.slug}`}
                  className="rounded-full border border-card-border bg-card px-4 py-2 text-xs font-medium text-foreground/70 transition-colors hover:border-accent/40 hover:text-accent"
                >
                  {p.title}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
