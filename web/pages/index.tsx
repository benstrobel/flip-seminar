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
  validationSamples: Sample[];
  samplesSinceLastUpdate: number;
  nextImageLoading: boolean;
  localStatsData: StatsData;
  remoteStatsData: StatsData;
  model: tf.Sequential;
  federatedModel: tf.Sequential;
  federatedModelVersion: number;
  serverLatestClientCount: number;
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
    validationSamples: [],
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
    model: getModel(true),
    federatedModel: getModel(false),
    federatedModelVersion: 0,
    serverLatestClientCount: 0,
    connected: false,
  });

  const updateRemoteModel = useCallback(
    async (msg: string) => {
      const model = appState.federatedModel;
      const decoded = await applyDecodedWeights(msg, model);
      const modelVersion: number = decoded.modelVersion;
      const serverLatestClientCount: number = decoded.latestClientCount;
      const newRemoteStats = await modelBulkPredict(
        appState.federatedModel,
        stylesRaw as Style[]
      );
      setAppState((state) => ({
        ...state,
        federatedModel: model,
        remoteStatsData: newRemoteStats,
        federatedModelVersion: modelVersion,
        serverLatestClientCount: serverLatestClientCount
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
      setTimeout(() => {
        setTransitionState({transition: "fade", mounted: true});
      }, 750);
      if (appState.samplesSinceLastUpdate >= sampleThreshold) {
        const samples = appState.samples;
        const validationSamples = [...appState.validationSamples, { style: style, pos: pos }]
        setAppState((state) => ({
          ...state,
          currentIndex: getNewIndex(),
          nextImageLoading: true,
          samples: [...state.samples],
          validationSamples: validationSamples,
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
        const errorLocalTrain = await modelMetrics(newLocalModel, samples);
        const errorFederatedTrain = await modelMetrics(appState.federatedModel, samples);
        const errorLocalVal = await modelMetrics(newLocalModel, validationSamples);
        const errorFederatedVal = await modelMetrics(appState.federatedModel, validationSamples);
        console.log({
          localErrorVal: errorLocalVal, 
          samplesLocal: samples.length, 
          federatedErrorVal: errorFederatedVal,
          localErrorTrain: errorLocalTrain, 
          federatedErrorTrain: errorFederatedTrain,
          modelVersion: appState.federatedModelVersion
        })
        await pushModel(newFederatedModel, appState.federatedModelVersion, samples.length);
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
              <Stack>
                <Stats
                  statsData={appState.localStatsData}
                  name="Local Prediction"
                />
                {<Center><Text>{"Samples created: " + appState.samples.length}</Text></Center>}
              </Stack>
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
                  }}
                  transitionState={transitionState}
                />
                <Space h={"md"}/>
                <Autoclicker style={dataDict[appState.currentIndex].style} sampleCallback={sampleCallback} loading={!appState.nextImageLoading}/>
              </Stack>
              <Stack>
                <Stats
                  name="Federated Prediction"
                  statsData={appState.remoteStatsData}
                  disabled={!appState.connected}
                />
                {<Center><Text>{appState.connected && appState.serverLatestClientCount > 0 && ("Clients connected: " + appState.serverLatestClientCount)}</Text></Center>}
              </Stack>
            </Group>
          </Center>
        </Stack>
      </main>
    </div>
  );
}
