/**
 * Strapi CMS News Integration Service for ShopWise
 */

export interface Article {
  id: string | number;
  title: string;
  description: string;
  content?: string;
  image: string;
  date: string;
  link: string;
  slug?: string;
  category?: string;
}

const DEFAULT_STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

// Fallback articles in case Strapi CMS backend is offline
export const FALLBACK_ARTICLES: Article[] = [
  {
    id: "art-1",
    title: "Huawei Pura 90s Pro và Pro Max ra mắt",
    description:
      "Camera tele 200MP cực khủng, màn hình LTPO, chip Kirin 9030S, giá từ 23.84 triệu đồng. Siêu phẩm mới hứa hẹn khuấy đảo thị trường smartphone cận cao cấp.",
    image: "/figma/article_1.png",
    date: "18 Tháng 7, 2026",
    link: "/news/huawei-pura-90s-pro",
    slug: "huawei-pura-90s-pro",
    category: "Điện thoại",
  },
  {
    id: "art-2",
    title: "ProArt P16 và ProArt PX13 tại Việt Nam",
    description:
      "ASUS mới đây vừa chính thức giới thiệu dải sản phẩm laptop đồ họa ProArt thế hệ mới thị trường Việt Nam. Được trang bị vi xử lý AMD Ryzen AI 9 HX 370 cực mạnh.",
    image: "/figma/article_2.png",
    date: "15 Tháng 7, 2026",
    link: "/news/asus-proart-p16-px13",
    slug: "asus-proart-p16-px13",
    category: "Máy tính",
  },
  {
    id: "art-3",
    title: "Có nên mua iPhone 14 Pro Max cũ?",
    description:
      "Có nên mua iPhone 14 Pro Max cũ? Chất lượng có tốt trong 3-4 năm tới? Phân tích chi tiết thiết kế, hiệu năng chip A16 Bionic và thời lượng pin.",
    image: "/figma/article_3.png",
    date: "10 Tháng 7, 2026",
    link: "/news/iphone-14-pro-max-review",
    slug: "iphone-14-pro-max-review",
    category: "Tư vấn",
  },
];

/**
 * Helper to construct full Strapi media URL
 */
function getStrapiMediaUrl(url: string | null | undefined): string {
  if (!url) return "/figma/article_1.png";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${DEFAULT_STRAPI_URL}${url}`;
}

/**
 * Fetch articles from Strapi CMS API
 * Endpoints: GET /api/articles?populate=* or GET /api/posts?populate=*
 */
export async function getStrapiArticles(): Promise<Article[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout for quick fallback

    const res = await fetch(`${DEFAULT_STRAPI_URL}/api/articles?populate=*`, {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      next: { revalidate: 60 },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      // Try fallback endpoint /api/posts
      const resPosts = await fetch(`${DEFAULT_STRAPI_URL}/api/posts?populate=*`, {
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 60 },
      });
      if (!resPosts.ok) return FALLBACK_ARTICLES;
      const dataPosts = await resPosts.json();
      return parseStrapiResponse(dataPosts);
    }

    const data = await res.json();
    const articles = parseStrapiResponse(data);

    return articles.length > 0 ? articles : FALLBACK_ARTICLES;
  } catch (error) {
    console.warn("Strapi CMS API not reachable. Using local news dataset fallback.");
    return FALLBACK_ARTICLES;
  }
}

/**
 * Helper to map Strapi v4/v5 API JSON structure to Article model
 */
function parseStrapiResponse(json: any): Article[] {
  if (!json || !json.data || !Array.isArray(json.data)) {
    return [];
  }

  return json.data.map((item: any) => {
    const attrs = item.attributes || item;
    const coverUrl =
      attrs.cover?.data?.attributes?.url ||
      attrs.image?.data?.attributes?.url ||
      attrs.cover?.url ||
      attrs.image?.url;

    const formattedDate = attrs.publishedAt
      ? new Date(attrs.publishedAt).toLocaleDateString("vi-VN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "Mới cập nhật";

    const slug = attrs.slug || `article-${item.id}`;

    return {
      id: item.id,
      title: attrs.title || "Bài viết tin tức ShopWise",
      description: attrs.description || attrs.excerpt || attrs.summary || "Thông tin công nghệ mới nhất từ ShopWise.",
      content: attrs.content || attrs.body || "",
      image: getStrapiMediaUrl(coverUrl),
      date: formattedDate,
      link: `/news/${slug}`,
      slug: slug,
      category: attrs.category?.data?.attributes?.name || attrs.category || "Tin tức",
    };
  });
}
