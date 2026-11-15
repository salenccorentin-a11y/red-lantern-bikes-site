import { langFrom } from "@/i18n/route";
import { BookView, bookMetadata } from "@/views/BookView";

// In its own group, like the English booking pages, so the booking steps get
// no page transitions.

// The language is read from the address first (see the [lang] layout).
export const instant = false;

export async function generateMetadata(props: PageProps<"/[lang]/book">) {
  return bookMetadata(await langFrom(props.params));
}

export default async function BookPage(props: PageProps<"/[lang]/book">) {
  const lang = await langFrom(props.params);
  return <BookView lang={lang} searchParams={props.searchParams} />;
}
