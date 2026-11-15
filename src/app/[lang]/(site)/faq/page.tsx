import { langFrom } from "@/i18n/route";
import { FaqView, faqMetadata } from "@/views/FaqContactViews";

// The language is read from the address first (see the [lang] layout).
export const instant = false;

export async function generateMetadata(props: PageProps<"/[lang]/faq">) {
  return faqMetadata(await langFrom(props.params));
}

export default async function FaqPage(props: PageProps<"/[lang]/faq">) {
  return <FaqView lang={await langFrom(props.params)} />;
}
