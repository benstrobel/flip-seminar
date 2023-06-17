import { Center, Group, Stack, Title } from "@mantine/core";
import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import images from "@/data/images.json";
import importedStyles from "@/data/styles.json";
import Swiper from "@/components/Swiper";
import Stats from "@/components/Stats";
import {
  Sample,
  StatsData,
  Style,
  getModel,
  modelBulkPredict,
  sampleThreshold,
  trainModel,
} from "@/lib/learning";
import {
  connect,
  pushModel,
  registerDisconnectCallback,
} from "@/lib/networking";
import * as tf from "@tensorflow/tfjs";

const maxItemIndex = images.length;

export interface ApplicationState {
  currentIndex: number;
  samples: Sample[];
  nextImageLoading: boolean;
  localStatsData: StatsData;
  remoteStatsData: StatsData;
  model: tf.Sequential;
  connected: boolean;
}

export default function Home() {
  const styles = importedStyles as Style[];
  const [appState, setAppState] = useState<ApplicationState>({
    currentIndex: Math.round(Math.random() * maxItemIndex),
    samples: [],
    nextImageLoading: false,
    localStatsData: {
      colorStatData: [0, 0, 0, 0, 0],
      seasonStatData: [0, 0, 0, 0],
      usageStatData: [0, 0, 0, 0, 0],
    },
    remoteStatsData: {
      colorStatData: [0, 0, 0, 0, 0],
      seasonStatData: [0, 0, 0, 0],
      usageStatData: [0, 0, 0, 0, 0, 0, 0],
    },
    model: getModel(),
    connected: false,
  });

  useEffect(() => {
    connect(() => {
      setAppState((state) => ({ ...state, connected: true }));
    });
    registerDisconnectCallback(() => {
      setAppState((state) => ({ ...state, connected: false }));
    });
  }, []);

  const sampleCallback = useCallback(
    async (style: Style, pos: boolean) => {
      if (appState.samples.length >= sampleThreshold) {
        const samples = appState.samples;
        setAppState((state) => ({
          ...state,
          currentIndex: Math.round(Math.random() * maxItemIndex),
          nextImageLoading: true,
          samples: [{ style: style, pos: pos }],
        }));
        const newModel = await trainModel(appState.model, samples);
        setAppState((state) => ({ ...state, model: newModel }));
        const newLocalStats = await modelBulkPredict(newModel, styles);
        setAppState((state) => ({ ...state, localStatsData: newLocalStats }));
        console.log("Updated local model");
        pushModel(newModel);
      } else {
        setAppState((state) => ({
          ...state,
          currentIndex: Math.round(Math.random() * maxItemIndex),
          nextImageLoading: true,
          samples: [...state.samples, { style: style, pos: pos }],
        }));
      }
    },
    [appState.model, appState.samples, styles]
  );

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
            <Title>Demo of asynchronous federated learning for websites</Title>
          </Center>
          <Center style={{ height: "80vh" }}>
            <Group>
              <Stats
                statsData={appState.localStatsData}
                name="Local Prediction"
              />
              <Swiper
                imageUrl={
                  "/images/" + images[appState.currentIndex].id + ".jpg"
                }
                style={styles[appState.currentIndex]}
                sampleCallback={sampleCallback}
                loading={appState.nextImageLoading}
                onLoad={() => {
                  setAppState((state) => ({
                    ...state,
                    nextImageLoading: false,
                  }));
                }}
              />
              <Stats
                name="Federated Prediction"
                statsData={appState.remoteStatsData}
                disabled={!appState.connected}
              />
            </Group>
          </Center>
        </Stack>
      </main>
    </div>
  );
}
