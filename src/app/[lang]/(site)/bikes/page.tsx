import { langFrom } from "@/i18n/route";
import { BikesView, bikesMetadata } from "@/views/BikesView";

export async function generateMetadata(props: PageProps<"/[lang]/bikes">) {
  return bikesMetadata(await langFrom(props.params));
}

export default async function BikesPage(props: PageProps<"/[lang]/bikes">) {
  return <BikesView lang={await langFrom(props.params)} />;
}
