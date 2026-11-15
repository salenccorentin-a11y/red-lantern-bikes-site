import { langFrom } from "@/i18n/route";
import { HomeView, homeMetadata } from "@/views/HomeView";

// The language is read from the address first (see the [lang] layout).
export const instant = false;

export async function generateMetadata(props: PageProps<"/[lang]">) {
  return homeMetadata(await langFrom(props.params));
}

export default async function Home(props: PageProps<"/[lang]">) {
  return <HomeView lang={await langFrom(props.params)} />;
}
