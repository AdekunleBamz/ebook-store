/**
 * Custom Document for Next.js
 * Adds favicon and meta tags
 */

import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <meta name="theme-color" content="#5546FF" />
        <meta name="description" content="Decentralized eBook marketplace on Bitcoin L2 (Stacks)" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
