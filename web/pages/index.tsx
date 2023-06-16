import { Center, Stack, Title } from "@mantine/core";
import Head from "next/head";
import { useEffect } from "react";
import images from "@/data/images.json";
import styles from "@/data/styles.json";

export default function Home() {
  useEffect(() => {
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("click", onClick);
    };
  }, []);

  function onClick(ev: MouseEvent) {}

  return (
    <div>
      <Head>
        <title>FLIP Seminar - Ben Strobel</title>
        <meta name="description" content="FLIP Seminar - Ben Strobel" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main style={{ backgroundColor: "#1f1f1f", height: "100vh" }}>
        <Stack>
          <Center style={{ height: "15vh" }}>
            <Title>Demo of asynchronous federated learning in websites</Title>
          </Center>
          <Center style={{ height: "80vh" }}>
            <></>
          </Center>
        </Stack>
      </main>
    </div>
  );
}
