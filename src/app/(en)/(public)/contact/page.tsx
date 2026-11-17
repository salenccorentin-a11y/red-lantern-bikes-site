import { ContactView, contactMetadata } from "@/views/FaqContactViews";

export const metadata = contactMetadata("en");

export default function ContactPage(props: PageProps<"/contact">) {
  return <ContactView lang="en" searchParams={props.searchParams} />;
}
