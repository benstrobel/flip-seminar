import { Center, Group, Stack, Title } from "@mantine/core";
import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import images from "@/data/images.json";
import importedStyles from "@/data/styles.json";
import categories from "@/data/categories.json";
import Swiper from "@/components/Swiper";
import Stats from "@/components/Stats";

export interface Categories {
  gender: "Men" | "Women" | "Unisex" | "Boys" | "Girls";
  masterCategory:
    | "Apparel"
    | "Accessories"
    | "Footwear"
    | "Personal Care"
    | "Free Items";
  subCategory: "Topwear" | "Shoes" | "Bags" | "Bottomwear" | "Watches";
  articleType:
    | "Tshirts"
    | "Shirts"
    | "Casual Shoes"
    | "Watches"
    | "Sports Shoes";
  baseColour: "Black" | "White" | "Blue" | "Brown" | "Grey";
  season: "Summer" | "Fall" | "Winter" | "Spring";
  usage: "Casual" | "Sports" | "Ethnic" | "Formal" | "NA";
}

export type Style = Categories & {
  id: number;
  year: number;
  productDisplayName: string;
};

export interface Sample {
  style: Style;
  pos: boolean;
}

export interface StatsData {
  colorStatData: number[];
  seasonStatData: number[];
  usageStatDat: number[];
}

export interface ApplicationState {
  currentIndex: number;
  samples: Sample[];
  nextImageLoading: boolean;
  localStatsData: StatsData;
  remoteStatsData: StatsData;
}

const maxItemIndex = images.length;

export default function Home() {
  const styles = importedStyles as Style[];
  const [appState, setAppState] = useState<ApplicationState>({
    currentIndex: Math.round(Math.random() * maxItemIndex),
    samples: [],
    nextImageLoading: true,
    localStatsData: {
      colorStatData: [0, 0, 0, 0, 0],
      seasonStatData: [0, 0, 0, 0],
      usageStatDat: [0, 0, 0, 0, 0],
    },
    remoteStatsData: {
      colorStatData: [0, 0, 0, 0, 0],
      seasonStatData: [0, 0, 0, 0],
      usageStatDat: [0, 0, 0, 0, 0],
    },
  });
  const sampleCallback = useCallback(() => {
    setAppState((state) => ({
      ...state,
      currentIndex: Math.round(Math.random() * maxItemIndex),
      nextImageLoading: true,
    }));
  }, []);

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
            <Group>
              <Stats
                statsData={appState.localStatsData}
                name="Local Prediction"
              />
              <Swiper
                imageUrl={images[appState.currentIndex].link}
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
                disabled
              />
            </Group>
          </Center>
        </Stack>
      </main>
    </div>
  );
}
