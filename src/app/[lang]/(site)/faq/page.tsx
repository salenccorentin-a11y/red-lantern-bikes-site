import { langFrom } from "@/i18n/route";
import { FaqView, faqMetadata } from "@/views/FaqContactViews";

export async function generateMetadata(props: PageProps<"/[lang]/faq">) {
  return faqMetadata(await langFrom(props.params));
}

export default async function FaqPage(props: PageProps<"/[lang]/faq">) {
  return <FaqView lang={await langFrom(props.params)} />;
}
