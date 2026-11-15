import { langFrom } from "@/i18n/route";
import { OneWayView, oneWayMetadata } from "@/views/OneWayView";

export async function generateMetadata(props: PageProps<"/[lang]/one-way">) {
  return oneWayMetadata(await langFrom(props.params));
}

export default async function OneWayPage(props: PageProps<"/[lang]/one-way">) {
  return <OneWayView lang={await langFrom(props.params)} />;
}
