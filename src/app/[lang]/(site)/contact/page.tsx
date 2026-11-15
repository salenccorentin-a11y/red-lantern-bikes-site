import { langFrom } from "@/i18n/route";
import { ContactView, contactMetadata } from "@/views/FaqContactViews";

// The language is read from the address first (see the [lang] layout).
export const instant = false;

export async function generateMetadata(props: PageProps<"/[lang]/contact">) {
  return contactMetadata(await langFrom(props.params));
}

export default async function ContactPage(props: PageProps<"/[lang]/contact">) {
  return <ContactView lang={await langFrom(props.params)} searchParams={props.searchParams} />;
}
