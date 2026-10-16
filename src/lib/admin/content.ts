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
  tip?: string;
};

export const MAIN_FIELDS: TextFieldConfig[] = [
  { key: "fullName", label: "Имя" },
  {
    key: "priceHeader",
    label: "Заголовок блока тарифов",
    tip: "Подпись над всеми карточками услуг на главной странице, а не название отдельной услуги.",
  },
  {
    key: "professionDescription",
    label: "Короткое описание профессии",
    wide: true,
    tip: "Сохранённая короткая подпись о специализации. В текущем оформлении сайта это поле не выводится; видимый подзаголовок задаётся в поле «Подзаголовок профиля».",
  },
];

export const LINK_FIELDS: TextFieldConfig[] = [
  {
    key: "telegramLink",
    label: "Ссылка Telegram",
    tip: "Полная ссылка на ваш Telegram, например https://t.me/username. Используется и в контактах, и при выборе способа записи.",
  },
  {
    key: "vkMessengerLink",
    label: "Ссылка VK мессенджер",
    tip: "Полная ссылка на диалог VK, например https://vk.me/username. На неё ведёт вариант «VK» в кнопке записи.",
  },
  {
    key: "b17Link",
    label: "Ссылка B17",
    tip: "Полный адрес вашего профиля специалиста на B17, начиная с https://.",
  },
  {
    key: "instagramLink",
    label: "Ссылка Instagram",
    tip: "Сохранённый адрес профиля. В текущем оформлении сайта ссылка Instagram не показывается; изменение этого поля не добавит новую кнопку.",
  },
  {
    key: "blogLink",
    label: "Ссылка блога",
    tip: "Адрес, который откроется по ссылке на блог в профиле. Вставьте полную ссылку, начиная с https://.",
  },
  {
    key: "blog",
    label: "Текст ссылки на блог",
    tip: "Видимая подпись ссылки в профиле, например «Мой блог». Сам адрес задаётся в поле «Ссылка блога».",
  },
  {
    key: "bookConsultation",
    label: "Кнопка записи",
    tip: "Текст основной кнопки записи. При нажатии посетитель выбирает Telegram или VK; адреса берутся из полей выше.",
  },
  {
    key: "priceCardBookLabel",
    label: "Кнопка записи в карточках услуг",
    tip: "Общая подпись кнопок во всех карточках услуг. Способы связи те же, что у основной кнопки записи.",
  },
];
