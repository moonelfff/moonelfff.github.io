import type { Metadata } from "next";
import Script from "next/script";
import { getPublicContentBundle } from "@/lib/contentStore";
import "./globals.css";

const SITE_URL = "https://ekaterinazhuk.ru";
const FALLBACK_IMAGE_URL = `${SITE_URL}/photo.webp`;

function toAbsoluteImageUrl(value: string | undefined): string {
  if (!value?.trim()) {
    return FALLBACK_IMAGE_URL;
  }

  try {
    return new URL(value).toString();
  } catch {
    return new URL(value, SITE_URL).toString();
  }
}

async function getSeoImageUrls(): Promise<{
  profileImageUrl: string;
  ogImageUrl: string;
}> {
  try {
    const bundle = await getPublicContentBundle();
    const profileImageUrl = toAbsoluteImageUrl(bundle.content.profileImageUrl);
    const ogImageUrl = toAbsoluteImageUrl(
      bundle.content.ogImageUrl || bundle.content.profileImageUrl,
    );

    return {
      profileImageUrl,
      ogImageUrl,
    };
  } catch {
    return {
      profileImageUrl: FALLBACK_IMAGE_URL,
      ogImageUrl: FALLBACK_IMAGE_URL,
    };
  }
}

function createStructuredData(profileImageUrl: string, ogImageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Екатерина Жук",
        inLanguage: "ru-RU",
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#person`,
        name: "Екатерина Жук",
        alternateName: "Екатерина Жук | Клинический психолог",
        jobTitle: "Клинический психолог",
        description:
          "Клинический и практический психолог. Консультации в Москве и онлайн.",
        url: SITE_URL,
        image: profileImageUrl,
        areaServed: ["Москва", "Онлайн"],
        knowsAbout: [
          "клиническая психология",
          "индивидуальная психотерапия",
          "парная терапия",
          "психологическая диагностика",
        ],
        sameAs: [
          "https://www.instagram.com/kate.zhuk.psy/",
          "https://t.me/moonelfff",
          "https://b17.ru/katezhuk/",
        ],
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}/#service-psychologist-moscow`,
        name: "Консультация психолога в Москве и онлайн",
        serviceType: "Психологическая консультация",
        areaServed: "Москва",
        provider: {
          "@id": `${SITE_URL}/#person`,
        },
        availableChannel: {
          "@type": "ServiceChannel",
          serviceLocation: {
            "@type": "Place",
            name: "Москва",
          },
        },
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: SITE_URL,
        name: "Екатерина Жук - клинический психолог",
        description:
          "Екатерина Жук — практический и клинический психолог в Москве и онлайн. Консультации, индивидуальная и парная психотерапия, клиническая диагностика.",
        inLanguage: "ru-RU",
        isPartOf: {
          "@id": `${SITE_URL}/#website`,
        },
        about: {
          "@id": `${SITE_URL}/#person`,
        },
        mentions: {
          "@id": `${SITE_URL}/#service-psychologist-moscow`,
        },
        image: ogImageUrl,
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: ogImageUrl,
        },
      },
    ],
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { ogImageUrl } = await getSeoImageUrls();

  return {
    title: "Екатерина Жук | Клинический психолог в Москве и онлайн",
    description:
      "Екатерина Жук — клинический психолог в Москве и онлайн. Консультации, индивидуальная и парная психотерапия, клиническая диагностика.",
    keywords: [
      "Екатерина Жук",
      "психолог",
      "клинический психолог",
      "практический психолог",
      "психотерапевт",
      "консультация психолога",
      "помощь психолога",
      "парная психотерапия",
      "психолог Москва",
      "психолог онлайн",
    ],
    authors: [{ name: "Екатерина Жук" }],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
      },
    },
    alternates: {
      canonical: SITE_URL,
      languages: {
        "ru-RU": SITE_URL,
        "x-default": SITE_URL,
      },
    },
    openGraph: {
      title: "Екатерина Жук | Клинический психолог в Москве и онлайн",
      description:
        "Приём в Москве и онлайн. Консультации, индивидуальная и парная психотерапия.",
      type: "website",
      locale: "ru_RU",
      url: SITE_URL,
      siteName: "Екатерина Жук",
      images: [
        {
          url: ogImageUrl,
          alt: "Екатерина Жук, клинический психолог",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Екатерина Жук | Клинический психолог в Москве и онлайн",
      description:
        "Консультации, индивидуальная и парная психотерапия. Приём в Москве и онлайн.",
      images: [ogImageUrl],
    },
    icons: {
      apple: [{ url: "/favicons/apple-touch-icon.png", sizes: "180x180" }],
      icon: [
        {
          url: "/favicons/favicon-32x32.png",
          sizes: "32x32",
          type: "image/png",
        },
        {
          url: "/favicons/favicon-16x16.png",
          sizes: "16x16",
          type: "image/png",
        },
      ],
    },
    manifest: "/site.webmanifest",
    other: {
      yandex: "all",
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { profileImageUrl, ogImageUrl } = await getSeoImageUrls();
  const structuredData = createStructuredData(profileImageUrl, ogImageUrl);

  return (
    <html lang="ru" className="h-full antialiased">
      <body suppressHydrationWarning className="flex min-h-full flex-col">
        <Script id="gtm" strategy="afterInteractive">
          {`(function (w, d, s, l, i) {
        w[l] = w[l] || [];
        w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
        var f = d.getElementsByTagName(s)[0],
          j = d.createElement(s),
          dl = l != "dataLayer" ? "&l=" + l : "";
        j.async = true;
        j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
        f.parentNode.insertBefore(j, f);
      })(window, document, "script", "dataLayer", "GTM-MB6C6PR5");`}
        </Script>
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`(function (m, e, t, r, i, k, a) {
        m[i] =
          m[i] ||
          function () {
            (m[i].a = m[i].a || []).push(arguments);
          };
        m[i].l = 1 * new Date();
        for (var j = 0; j < document.scripts.length; j++) {
          if (document.scripts[j].src === r) {
            return;
          }
        }
        ((k = e.createElement(t)),
          (a = e.getElementsByTagName(t)[0]),
          (k.async = 1),
          (k.src = r),
          a.parentNode.insertBefore(k, a));
      })(
        window,
        document,
        "script",
        "https://mc.yandex.ru/metrika/tag.js?id=109120558",
        "ym"
      );

      ym(109120558, "init", {
        ssr: true,
        webvisor: true,
        clickmap: true,
        ecommerce: "dataLayer",
        referrer: document.referrer,
        url: location.href,
        accurateTrackBounce: true,
        trackLinks: true,
      });`}
        </Script>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MB6C6PR5"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <noscript>
          <div>
            <img
              src="https://mc.yandex.ru/watch/109120558"
              style={{ position: "absolute", left: "-9999px" }}
              alt=""
            />
          </div>
        </noscript>
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
