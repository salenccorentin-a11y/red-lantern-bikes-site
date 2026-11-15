import { Suspense } from "react";
import { langFrom } from "@/i18n/route";
import { BookingView, bookingMetadata } from "@/views/BookingView";

type Props = PageProps<"/[lang]/booking/[token]">;

export async function generateMetadata(props: Props) {
  return bookingMetadata(await langFrom(props.params));
}

// The booking code is only known when the page is opened, so the address is
// read inside the loading step (the header and footer show straight away).
export default function BookingPage(props: Props) {
  return (
    <Suspense fallback={null}>
      <Localized params={props.params} />
    </Suspense>
  );
}

async function Localized({ params }: { params: Props["params"] }) {
  const lang = await langFrom(params);
  return <BookingView lang={lang} token={params.then((p) => p.token)} />;
}
