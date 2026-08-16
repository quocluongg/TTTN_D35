export interface HomeLayoutSection {
  id: string;
  sectionKey: string;
  title?: string;
  subtitle?: string;
  displayOrder: number;
  enabled: boolean;
  layoutStyle?: string;
  configJson?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type SectionKey =
  | "HERO_BANNER"
  | "MARQUEE_TICKER"
  | "FEATURED_PRODUCTS"
  | "BUY_BY_NEED"
  | "FEATURED_CATEGORIES"
  | "BRAND_LOGOS"
  | "NEWS_JOURNAL"
  | "CUSTOM_PROMO_BANNER"
  | string;
