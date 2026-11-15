import { langFrom } from "@/i18n/route";
import { TourView, tourMetadata, tourSlugs } from "@/views/ToursView";

export const instant = false;
export const generateStaticParams = tourSlugs;

export async function generateMetadata(props: PageProps<"/[lang]/tours/[slug]">) {
  const [lang, { slug }] = await Promise.all([langFrom(props.params), props.params]);
  return tourMetadata(lang, slug);
}

export default async function TourPage(props: PageProps<"/[lang]/tours/[slug]">) {
  const [lang, { slug }] = await Promise.all([langFrom(props.params), props.params]);
  return <TourView lang={lang} slug={slug} />;
}
