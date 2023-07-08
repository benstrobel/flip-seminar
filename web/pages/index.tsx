import { Center, Group, MultiSelect, Stack, Title, Text, Space, MantineTransition } from "@mantine/core";
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
  applyDecodedWeights,
  getModel,
  modelBulkPredict,
  sampleThreshold,
  trainModel,
} from "@/lib/learning";
import {
  connect,
  pushModel,
  registerCallback,
  registerDisconnectCallback,
} from "@/lib/networking";
import * as tf from "@tensorflow/tfjs";
import Autoclicker from "@/components/AutoClicker";

const maxItemIndex = images.length;

export interface ApplicationState {
  currentIndex: number;
  samples: Sample[];
  nextImageLoading: boolean;
  localStatsData: StatsData;
  remoteStatsData: StatsData;
  model: tf.Sequential;
  federatedModel: tf.Sequential;
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
    federatedModel: getModel(),
    connected: false,
  });

  const updateRemoteModel = useCallback(
    async (msg: string) => {
      const model = appState.federatedModel;
      await applyDecodedWeights(msg, model);
      const newRemoteStats = await modelBulkPredict(
        appState.federatedModel,
        styles
      );
      console.log("Updated federated model");
      setAppState((state) => ({
        ...state,
        federatedModel: model,
        remoteStatsData: newRemoteStats,
      }));
    },
    [appState.federatedModel]
  );

  useEffect(() => {
    registerCallback(updateRemoteModel);
  }, [updateRemoteModel]);

  useEffect(() => {
    connect(() => {
      setAppState((state) => ({ ...state, connected: true }));
    });
    registerDisconnectCallback(() => {
      setAppState((state) => ({ ...state, connected: false }));
    });
    registerCallback(updateRemoteModel);
  }, []);

  const [transition, setTransition] = useState<MantineTransition>("slide-right");
  const [transitionMounted, setTransitionMounted] = useState(true);

  const sampleCallback = useCallback(
    async (style: Style, pos: boolean) => {
      setTransition(pos ? "slide-left" : "slide-right");
      setTransitionMounted(false);
      if (appState.samples.length >= sampleThreshold) {
        const samples = appState.samples; // TODO Split into training and validation set
        setAppState((state) => ({
          ...state,
          currentIndex: Math.round(Math.random() * maxItemIndex),
          nextImageLoading: true,
          samples: [{ style: style, pos: pos }],
        }));
        const newLocalModel = await trainModel(appState.model, samples);
        const newFederatedModel = await trainModel(
          appState.federatedModel,
          samples
        );
        setAppState((state) => ({ ...state, model: newLocalModel }));
        const newLocalStats = await modelBulkPredict(newLocalModel, styles);
        setAppState((state) => ({ ...state, localStatsData: newLocalStats }));
        console.log("Updated local model");
        await pushModel(newFederatedModel);
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
    <div style={{height: "100%"}}>
      <Head>
        <title>FLIP Seminar - Ben Strobel</title>
        <meta name="description" content="FLIP Seminar - Ben Strobel" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main style={{ backgroundColor: "#1f1f1f", minHeight: "100vh" }}>
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
              <Stack style={{width: "40vw"}}>
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
                    setTransition("fade");
                    setTransitionMounted(true);
                  }}
                  transition={transition}
                  transitionMounted={transitionMounted}
                />
                <Space h={"md"}/>
                <Autoclicker/>
              </Stack>
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
