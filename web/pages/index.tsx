import { Center, Group, MultiSelect, Stack, Title, Text, Space, MantineTransition } from "@mantine/core";
import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import imagesRaw from "@/data/images.json";
import stylesRaw from "@/data/styles.json";
import Swiper, { TransitionState } from "@/components/Swiper";
import Stats from "@/components/Stats";
import {
  Sample,
  StatsData,
  Style,
  applyDecodedWeights,
  getModel,
  modelBulkPredict,
  modelMetrics,
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

const dataDict: {[id: string]: {style: Style, img?: {id: number, link: string}}} = {}
stylesRaw.forEach((x) => {
  dataDict[x.id] = {style: x as any}
})
imagesRaw.forEach((x) => {
  dataDict[x.id] = {style: dataDict[x.id].style, img: x}
})

const maxDictIndex = stylesRaw.length;

export interface ApplicationState {
  currentIndex: number;
  samples: Sample[];
  samplesSinceLastUpdate: number;
  nextImageLoading: boolean;
  localStatsData: StatsData;
  remoteStatsData: StatsData;
  model: tf.Sequential;
  federatedModel: tf.Sequential;
  connected: boolean;
}

function getNewIndex(): number {
  try {
    return dataDict[Object.keys(dataDict)[Math.round(Math.random() * maxDictIndex)]].style.id;
  } catch(ex) {
    return getNewIndex();
  }
}

export default function Home() {
  const [appState, setAppState] = useState<ApplicationState>({
    currentIndex: getNewIndex(),
    samples: [],
    samplesSinceLastUpdate: 0,
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
        stylesRaw as Style[]
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

  const [transitionState, setTransitionState] = useState<TransitionState>({transition: "fade", mounted: true});

  const sampleCallback = useCallback(
    async (style: Style, pos: boolean) => {
      setTransitionState({mounted: false, transition: pos ? "slide-left" : "slide-right"})
      if (appState.samplesSinceLastUpdate >= sampleThreshold) {
        const samples = appState.samples; // TODO Split into training and validation set
        setAppState((state) => ({
          ...state,
          currentIndex: getNewIndex(),
          nextImageLoading: true,
          samples: [...state.samples, { style: style, pos: pos }],
          samplesSinceLastUpdate: 0
        }));
        const newLocalModel = await trainModel(appState.model, samples);
        const newFederatedModel = await trainModel(
          appState.federatedModel,
          samples
        );
        setAppState((state) => ({ ...state, model: newLocalModel }));
        const newLocalStats = await modelBulkPredict(newLocalModel, stylesRaw as Style[]);
        setAppState((state) => ({ ...state, localStatsData: newLocalStats }));
        const error = await modelMetrics(newLocalModel, samples);
        console.log("Error: " + error)
        console.log("Updated local model");
        await pushModel(newFederatedModel);
      } else {
        setAppState((state) => ({
          ...state,
          currentIndex: getNewIndex(),
          nextImageLoading: true,
          samples: [...state.samples, { style: style, pos: pos }],
          samplesSinceLastUpdate: state.samplesSinceLastUpdate +1 
        }));
      }
    },
    [appState.model, appState.samples, stylesRaw]
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
                    "/images/" + dataDict[appState.currentIndex].style.id + ".jpg"
                  }
                  style={dataDict[appState.currentIndex].style}
                  sampleCallback={sampleCallback}
                  loading={appState.nextImageLoading}
                  onLoad={() => {
                    setAppState((state) => ({
                      ...state,
                      nextImageLoading: false,
                    }));
                    setTransitionState({transition: "fade", mounted: true})
                  }}
                  transitionState={transitionState}
                />
                <Space h={"md"}/>
                <Autoclicker style={dataDict[appState.currentIndex].style} sampleCallback={sampleCallback} loading={!appState.nextImageLoading}/>
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
