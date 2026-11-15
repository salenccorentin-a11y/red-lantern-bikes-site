import { langFrom } from "@/i18n/route";
import { BikeView, bikeMetadata, bikeSlugs } from "@/views/BikeView";

export const instant = false;
export const generateStaticParams = bikeSlugs;

export async function generateMetadata(props: PageProps<"/[lang]/bikes/[slug]">) {
  const [lang, { slug }] = await Promise.all([langFrom(props.params), props.params]);
  return bikeMetadata(lang, slug);
}

export default async function BikePage(props: PageProps<"/[lang]/bikes/[slug]">) {
  const [lang, { slug }] = await Promise.all([langFrom(props.params), props.params]);
  return <BikeView lang={lang} slug={slug} />;
}
