import { Analytics } from "@vercel/analytics/react";
import type { AppProps } from "next/app";
import "@vercel/examples-ui/globals.css";

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}

export default App;
