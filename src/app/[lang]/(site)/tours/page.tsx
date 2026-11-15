import { langFrom } from "@/i18n/route";
import { ToursView, toursMetadata } from "@/views/ToursView";

// The language is read from the address first (see the [lang] layout).
export const instant = false;

export async function generateMetadata(props: PageProps<"/[lang]/tours">) {
  return toursMetadata(await langFrom(props.params));
}

export default async function ToursPage(props: PageProps<"/[lang]/tours">) {
  return <ToursView lang={await langFrom(props.params)} />;
}
