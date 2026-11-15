import { BookingView, bookingMetadata } from "@/views/BookingView";

export const metadata = bookingMetadata("en");

export default function BookingPage(props: PageProps<"/booking/[token]">) {
  return <BookingView lang="en" token={props.params.then((p) => p.token)} />;
}
