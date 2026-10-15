import type { SiteContent } from "@/lib/contentTypes";
import type { Tariff } from "@/lib/tariffStore";

export type ContentDraft = {
  content: SiteContent;
  markdown: Record<string, string>;
};

export type ContentBundle = ContentDraft & { source: "supabase" | "mysql" };
export type TariffBundle = { tariffs: Tariff[]; source: "supabase" | "mysql" };
export type ImageKind = "profile" | "og";

export const MARKDOWN_LABELS: Record<string, string> = {
  "profile.md": "Профиль: основной текст",
  "blog.md": "Блог: вводный текст",
};

export const IMAGE_FIELDS = {
  profile: "profileImageUrl",
  og: "ogImageUrl",
} as const satisfies Record<ImageKind, keyof SiteContent>;

export const IMAGE_UPLOADED_MESSAGES: Record<ImageKind, string> = {
  profile: "Фото профиля загружено",
  og: "OG-изображение загружено",
};

export type TextFieldKey = {
  [K in keyof SiteContent]: SiteContent[K] extends string ? K : never;
}[keyof SiteContent];

export type TextFieldConfig = {
  key: TextFieldKey;
  label: string;
  wide?: boolean;
};

export const MAIN_FIELDS: TextFieldConfig[] = [
  { key: "fullName", label: "Имя" },
  { key: "priceHeader", label: "Заголовок блока тарифов" },
  {
    key: "professionDescription",
    label: "Короткое описание профессии",
    wide: true,
  },
];

export const LINK_FIELDS: TextFieldConfig[] = [
  { key: "telegramLink", label: "Ссылка Telegram" },
  { key: "vkMessengerLink", label: "Ссылка VK мессенджер" },
  { key: "b17Link", label: "Ссылка B17" },
  { key: "instagramLink", label: "Ссылка Instagram" },
  { key: "blogLink", label: "Ссылка блога" },
  { key: "blog", label: "Текст ссылки на блог" },
  { key: "bookConsultation", label: "Кнопка записи" },
  { key: "priceCardBookLabel", label: "Кнопка записи в карточках услуг" },
];
