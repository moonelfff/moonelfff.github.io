import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://ekaterinazhuk.ru/#website",
      url: "https://ekaterinazhuk.ru",
      name: "Екатерина Жук",
      inLanguage: "ru-RU",
    },
    {
      "@type": "Person",
      "@id": "https://ekaterinazhuk.ru/#person",
      name: "Екатерина Жук",
      alternateName: "Екатерина Жук | Клинический психолог",
      jobTitle: "Клинический психолог",
      description:
        "Клинический и практический психолог. Консультации в Москве и онлайн.",
      url: "https://ekaterinazhuk.ru",
      image: "https://ekaterinazhuk.ru/photo.webp",
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
      "@id": "https://ekaterinazhuk.ru/#service-psychologist-moscow",
      name: "Консультация психолога в Москве и онлайн",
      serviceType: "Психологическая консультация",
      areaServed: "Москва",
      provider: {
        "@id": "https://ekaterinazhuk.ru/#person",
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
      "@id": "https://ekaterinazhuk.ru/#webpage",
      url: "https://ekaterinazhuk.ru",
      name: "Екатерина Жук - клинический психолог",
      description:
        "Екатерина Жук — практический и клинический психолог в Москве и онлайн. Консультации, индивидуальная и парная психотерапия, клиническая диагностика.",
      inLanguage: "ru-RU",
      isPartOf: {
        "@id": "https://ekaterinazhuk.ru/#website",
      },
      about: {
        "@id": "https://ekaterinazhuk.ru/#person",
      },
      mentions: {
        "@id": "https://ekaterinazhuk.ru/#service-psychologist-moscow",
      },
      image: "https://ekaterinazhuk.ru/photo.webp",
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: "https://ekaterinazhuk.ru/photo.webp",
      },
    },
  ],
};

export const metadata: Metadata = {
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
    canonical: "https://ekaterinazhuk.ru",
    languages: {
      "ru-RU": "https://ekaterinazhuk.ru",
      "x-default": "https://ekaterinazhuk.ru",
    },
  },
  openGraph: {
    title: "Екатерина Жук | Клинический психолог в Москве и онлайн",
    description:
      "Приём в Москве и онлайн. Консультации, индивидуальная и парная психотерапия.",
    type: "website",
    locale: "ru_RU",
    url: "https://ekaterinazhuk.ru",
    siteName: "Екатерина Жук",
    images: [
      {
        url: "https://ekaterinazhuk.ru/photo.webp",
        alt: "Екатерина Жук, клинический психолог",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Екатерина Жук | Клинический психолог в Москве и онлайн",
    description:
      "Консультации, индивидуальная и парная психотерапия. Приём в Москве и онлайн.",
    images: ["https://ekaterinazhuk.ru/photo.webp"],
  },
  icons: {
    apple: [{ url: "/favicons/apple-touch-icon.png", sizes: "180x180" }],
    icon: [
      { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  other: {
    yandex: "all",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
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
