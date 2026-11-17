import { BookView, bookMetadata } from "@/views/BookView";

export const metadata = bookMetadata("en");

export default function BookPage(props: PageProps<"/book">) {
  return <BookView lang="en" searchParams={props.searchParams} />;
}
