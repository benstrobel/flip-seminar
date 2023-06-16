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
import { getModel, trainModel } from "@/lib/oldlearning";
import Pong, { GameState, Sample, initial_ball_speed } from "@/components/Pong";
import { useEffect, useState } from "react";

function getInitState(withModel: boolean = false): GameState {
  return {
    stop: false,
    timeAtLastMeasurement: 0,
    tick: 0,
    p0: { score: 0, x: 25, y: 250 },
    ball: {
      speedX: initial_ball_speed / 2,
      speedY: Math.random() * initial_ball_speed + 2,
      x: 250,
      y: 250,
    },
    wall: { x: 450, y: 0, w: 25, h: 500 },
    input: 0,
    model: withModel ? getModel() : undefined,
  };
}

export default function Home() {
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [groundTruthState, setGroundTruthState] = useState<GameState>(
    getInitState()
  );
  const [localPredictionState, setLocalPredictionState] = useState<GameState>(
    getInitState(true)
  );
  const [federatedPredictionState, setFederatedPredictionState] =
    useState<GameState>(getInitState());

  const [sampleList, setSampleList] = useState<Sample[]>([]);

  useEffect(() => {
    if (sampleList.length >= 30 && localPredictionState.model) {
      console.log("Training");
      const model = localPredictionState.model;
      trainModel(model, sampleList);
      setSampleList([]);
      setLocalPredictionState((state) => ({ ...state, model: model }));
    }
  }, [sampleList, localPredictionState.model]);

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
                  <Title order={2}>Ground Truth</Title>
                  <Pong
                    id="canvas-live"
                    width={500}
                    height={500}
                    inputEnabled
                    state={groundTruthState}
                    setState={setGroundTruthState}
                    sampleRate={10}
                    sampleProviderCallback={(sample) => {
                      setSampleList((state) => [...state, sample]);
                      // console.log(JSON.stringify(sample));
                    }}
                  />
                </Stack>
              </Center>
              {
                <Center>
                  <Stack align="center">
                    <Title order={2}>Local Prediction</Title>
                    <Pong
                      id="canvas-locallearned"
                      width={500}
                      height={500}
                      state={localPredictionState}
                      setState={setLocalPredictionState}
                    />
                  </Stack>
                </Center>
              }
              {
                <Center>
                  <Stack align="center">
                    <Title order={2}>Federated Prediction</Title>
                    <div style={{ position: "relative" }}>
                      <Pong
                        id="canvas-fedlearned"
                        width={500}
                        height={500}
                        state={federatedPredictionState}
                        setState={setFederatedPredictionState}
                      />
                      {!remoteConnected && (
                        <Overlay blur={10} center>
                          <Text size={"lg"}>Not connected</Text>
                        </Overlay>
                      )}
                    </div>
                  </Stack>
                </Center>
              }
            </Group>
          </Center>
        </Stack>
      </main>
    </div>
  );
}
