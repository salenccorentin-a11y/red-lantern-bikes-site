import { langFrom } from "@/i18n/route";
import { ContactView, contactMetadata } from "@/views/FaqContactViews";

export async function generateMetadata(props: PageProps<"/[lang]/contact">) {
  return contactMetadata(await langFrom(props.params));
}

export default async function ContactPage(props: PageProps<"/[lang]/contact">) {
  return <ContactView lang={await langFrom(props.params)} searchParams={props.searchParams} />;
}
