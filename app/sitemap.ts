import type { MetadataRoute } from "next";
import { getSitemapStamps, getYearsFromStamps } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site-config";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const stamps = await getSitemapStamps();
  const years = getYearsFromStamps(stamps);

  return [
    {
      url: SITE_URL,
    },
    {
      url: `${SITE_URL}/themes`,
    },
    ...years.map((year) => ({
      url: `${SITE_URL}/year/${year}`,
    })),
    ...stamps.map((stamp) => ({
      url: `${SITE_URL}/stamp/${stamp.id}`,
    })),
  ];
}
