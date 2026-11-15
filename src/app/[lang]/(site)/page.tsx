import { langFrom } from "@/i18n/route";
import { HomeView, homeMetadata } from "@/views/HomeView";

export async function generateMetadata(props: PageProps<"/[lang]">) {
  return homeMetadata(await langFrom(props.params));
}

export default async function Home(props: PageProps<"/[lang]">) {
  return <HomeView lang={await langFrom(props.params)} />;
}
