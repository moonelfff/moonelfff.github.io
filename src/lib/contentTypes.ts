type Price = { amount: number; currency: string };

export type SiteContent = {
  fullName: string;
  info: { title: string; contentPath: string };
  professionDescription: string;
  profileImageUrl: string;
  ogImageUrl: string;
  priceHeader: string;
  pricelist: Array<{
    descriptionPath: string;
    packages: Array<{
      name: string;
      price: { regular: Price; discounted?: Price };
    }>;
    title: string;
  }>;
  blogDescriptionPath: string;
  blog: string;
  blogLink: string;
  instagram: string;
  instagramLink: string;
  telegram: string;
  telegramLink: string;
  vkMessenger: string;
  vkMessengerLink: string;
  b17: string;
  b17Link: string;
  bookConsultation: string;
  priceCardBookLabel: string;
  testLink: string;
  testTitle: string;
};

export type MarkdownMap = Record<string, string>;
