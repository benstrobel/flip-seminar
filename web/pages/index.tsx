import { Inter } from "next/font/google";
import {
  Center,
  Button,
  Group,
  Title,
  Stack,
  Overlay,
  Text,
} from "@mantine/core";
import Head from "next/head";
import { test } from "@/lib/learning";
import Pong from "@/components/Pong";
import { useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [remoteConnected, setRemoteConnected] = useState(false);

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
            <Group position="apart">
              <Center>
                <Stack align="center">
                  <Title order={2}>Live</Title>
                  <Pong
                    id="canvas-live"
                    width={500}
                    height={500}
                    inputEnabled
                  />
                </Stack>
              </Center>
              {/* <Center>
                <Stack align="center">
                  <Title order={2}>Local Learned</Title>
                  <Pong id="canvas-locallearned" width={500} height={500} />
                </Stack>
              </Center> */}
              {/* <Center>
                <Stack align="center">
                  <Title order={2}>Federated Learned</Title>
                  <div style={{ position: "relative" }}>
                    <Pong id="canvas-fedlearned" width={500} height={500} />
                    {!remoteConnected && (
                      <Overlay blur={10} center>
                        <Text size={"lg"}>Not connected</Text>
                      </Overlay>
                    )}
                  </div>
                </Stack>
              </Center> */}
            </Group>
          </Center>
        </Stack>
      </main>
    </div>
  );
}
