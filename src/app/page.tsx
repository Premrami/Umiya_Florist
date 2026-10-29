import { publicContent } from '@/lib/content';
import { Website } from '@/components/website';
import { HomeEntrance } from '@/components/home-entrance';
import { businessStructuredData, publicPageMetadata, serializeJsonLd } from '@/lib/seo';
export const revalidate = 60;
export const metadata = publicPageMetadata(
  'Umiya Florist | Bouquets & Pooja Flowers in Ahmedabad',
  'Explore thoughtful bouquets, daily pooja flowers and event decorations from Umiya Florist in Ahmedabad. Tell us what you would like to create.',
);
export default async function Page() {
  const content = await publicContent();
  const structuredData = businessStructuredData(content.settings);
  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
        />
      )}
      <HomeEntrance>
        <Website content={content} />
      </HomeEntrance>
    </>
  );
}
