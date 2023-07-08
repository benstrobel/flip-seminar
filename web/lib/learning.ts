import * as tf from "@tensorflow/tfjs";

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
  baseColour: "Red" | "Blue" | "Green" | "Yellow" | "White" | "Black";
  season: "Summer" | "Fall" | "Winter" | "Spring";
  usage: "Casual" | "Sports" | "Ethnic" | "Formal";
}

export type Style = Categories & {
  id: number;
  productDisplayName: string;
  baseColour: string;
  season: string;
  usage: string;
};

export interface Sample {
  style: Style;
  pos: boolean;
}

export interface StatsData {
  colorStatData: number[];
  seasonStatData: number[];
  usageStatData: number[];
}

export const sampleThreshold = 5;

export function getModel() {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 20, inputShape: [34] }));
  model.add(tf.layers.dense({ units: 10, inputShape: [20] }));
  model.add(tf.layers.dense({ units: 2, inputShape: [10] }));
  model.compile({
    loss: tf.losses.sigmoidCrossEntropy,
    optimizer: new tf.SGDOptimizer(0.01),
  });
  return model;
}

export async function trainModel(model: tf.Sequential, samples: Sample[]) {
  const xs = tf.tensor2d(
    samples.map((x) => styleToModelInput(x.style)),
    [samples.length, 34]
  );
  const ys = tf.tensor2d(
    samples.map((x) => [Number(x.pos === true), Number(x.pos === false)]),
    [samples.length, 2]
  );
  return await model.fit(xs, ys, { batchSize: 5 }).then(() => {
    return model;
  });
}

export async function modelPredict(model: tf.Sequential, input: Style) {
  const prediction = model.predict(
    tf.tensor2d(styleToModelInput(input), [1, 34])
  ) as tf.Tensor<tf.Rank>;
  const data = await prediction.as1D().data();
  return data[0] > data[1];
}

export async function modelBulkPredict(
  model: tf.Sequential,
  bulkInput: Style[]
) {
  const predictions = model.predict(
    tf.tensor2d(
      bulkInput.map((x) => styleToModelInput(x)),
      [bulkInput.length, 34]
    )
  ) as tf.Tensor<tf.Rank>;
  return bulkPredictionToStatsData(bulkInput, predictions);
}

async function bulkPredictionToStatsData(
  bulkInput: Style[],
  bulkOutput: tf.Tensor<tf.Rank>
): Promise<StatsData> {
  const colorStatData = [0, 0, 0, 0, 0, 0];
  const totalColorSampleCount = [0, 0, 0, 0, 0, 0];

  const seasonStatData = [0, 0, 0, 0];
  const totalSeasonSampleCount = [0, 0, 0, 0];

  const usageStatData = [0, 0, 0, 0];
  const totalUsageSampleCount = [0, 0, 0, 0];

  const output = bulkOutput.as2D(bulkInput.length, 2);
  const data = await output.slice(0, bulkInput.length).data();

  for (let i = 0; i < bulkInput.length; i = i + 2) {
    const posClassProbability = data[i + 0];
    const negClassProbability = data[i + 1];
    const input = bulkInput[i];

    if (input.baseColour === "Red") {
      if (posClassProbability > negClassProbability) colorStatData[0] += 1;
      totalColorSampleCount[0] += 1;
    }
    if (input.baseColour === "Blue") {
      if (posClassProbability > negClassProbability) colorStatData[1] += 1;
      totalColorSampleCount[1] += 1;
    }
    if (input.baseColour === "Green") {
      if (posClassProbability > negClassProbability) colorStatData[2] += 1;
      totalColorSampleCount[2] += 1;
    }
    if (input.baseColour === "Yellow") {
      if (posClassProbability > negClassProbability) colorStatData[3] += 1;
      totalColorSampleCount[3] += 1;
    }
    if (input.baseColour === "White") {
      if (posClassProbability > negClassProbability) colorStatData[4] += 1;
      totalColorSampleCount[4] += 1;
    }
    if (input.baseColour === "Black") {
      if (posClassProbability > negClassProbability) colorStatData[5] += 1;
      totalColorSampleCount[5] += 1;
    }

    if (input.season === "Summer") {
      if (posClassProbability > negClassProbability) seasonStatData[0] += 1;
      totalSeasonSampleCount[0] += 1;
    }
    if (input.season === "Fall") {
      if (posClassProbability > negClassProbability) seasonStatData[1] += 1;
      totalSeasonSampleCount[1] += 1;
    }
    if (input.season === "Winter") {
      if (posClassProbability > negClassProbability) seasonStatData[2] += 1;
      totalSeasonSampleCount[2] += 1;
    }
    if (input.season === "Spring") {
      if (posClassProbability > negClassProbability) seasonStatData[3] += 1;
      totalSeasonSampleCount[3] += 1;
    }

    if (input.usage === "Casual") {
      if (posClassProbability > negClassProbability) usageStatData[0] += 1;
      totalUsageSampleCount[0] += 1;
    }
    if (input.usage === "Sports") {
      if (posClassProbability > negClassProbability) usageStatData[1] += 1;
      totalUsageSampleCount[1] += 1;
    }
    if (input.usage === "Ethnic") {
      if (posClassProbability > negClassProbability) usageStatData[2] += 1;
      totalUsageSampleCount[2] += 1;
    }
    if (input.usage === "Formal") {
      if (posClassProbability > negClassProbability) usageStatData[3] += 1;
      totalUsageSampleCount[3] += 1;
    }
  }

  return {
    colorStatData: colorStatData.map((x, i) =>
      Number.isNaN(totalColorSampleCount[i]) || totalColorSampleCount[i] === 0
        ? 0
        : (x * 1000) / totalColorSampleCount[i]
    ),
    seasonStatData: seasonStatData.map((x, i) =>
      Number.isNaN(totalSeasonSampleCount[i]) || totalSeasonSampleCount[i] === 0
        ? 0
        : (x * 1000) / totalSeasonSampleCount[i]
    ),
    usageStatData: usageStatData.map((x, i) =>
      Number.isNaN(totalUsageSampleCount[i]) || totalUsageSampleCount[i] === 0
        ? 0
        : (x * 1000) / totalUsageSampleCount[i]
    ),
  };
}

export async function encodeWeights(model: tf.Sequential) {
  const firstStep = await tf.io.encodeWeights(
    (model.getWeights() as tf.Variable[]).map((x) => ({
      tensor: x,
      name: x.name,
    }))
  );
  const secondStep = String.fromCharCode.apply(
    null,
    Array.from(new Uint16Array(firstStep.data))
  );
  return JSON.stringify({ data: secondStep, specs: firstStep.specs });
}

export function applyDecodedWeights(
  encodedWeights: string,
  model: tf.Sequential
) {
  const firstStep = JSON.parse(encodedWeights);
  const data: string = firstStep.data;
  const specs: tf.io.WeightsManifestEntry[] = firstStep.specs;
  const secondStep = stringToArrayBuffer(data);
  const thirdStep = tf.io.decodeWeights(secondStep, specs);
  const weights: tf.Variable[] = Object.entries(thirdStep).map(
    (x) => new tf.Variable(x[1], true, x[0], x[1].id)
  );
  model.setWeights(weights);
}

export function stringToArrayBuffer(str: string): ArrayBuffer {
  const stringLength = str.length;
  const buffer = new ArrayBuffer(stringLength * 2);
  const bufferView = new Uint16Array(buffer);
  for (let i = 0; i < stringLength; i++) {
    bufferView[i] = str.charCodeAt(i);
  }
  return buffer;
}

function styleToModelInput(style: Style): number[] {
  const input = new Array<number>(34);

  input[0] = Number(style.gender === "Men");
  input[1] = Number(style.gender === "Women");
  input[2] = Number(style.gender === "Unisex");
  input[3] = Number(style.gender === "Boys");
  input[4] = Number(style.gender === "Girls");

  input[5] = Number(style.masterCategory === "Apparel");
  input[6] = Number(style.masterCategory === "Accessories");
  input[7] = Number(style.masterCategory === "Footwear");
  input[8] = Number(style.masterCategory === "Personal Care");
  input[9] = Number(style.masterCategory === "Free Items");

  input[10] = Number(style.subCategory === "Topwear");
  input[11] = Number(style.subCategory === "Shoes");
  input[12] = Number(style.subCategory === "Bags");
  input[13] = Number(style.subCategory === "Bottomwear");
  input[14] = Number(style.subCategory === "Watches");

  input[15] = Number(style.articleType === "Tshirts");
  input[16] = Number(style.articleType === "Shirts");
  input[17] = Number(style.articleType === "Casual Shoes");
  input[18] = Number(style.articleType === "Watches");
  input[19] = Number(style.articleType === "Sports Shoes");

  input[20] = Number(style.baseColour === "Red");
  input[21] = Number(style.baseColour === "Blue");
  input[22] = Number(style.baseColour === "Green");
  input[23] = Number(style.baseColour === "Yellow");
  input[24] = Number(style.baseColour === "White");
  input[25] = Number(style.baseColour === "Black");

  input[26] = Number(style.season === "Summer");
  input[27] = Number(style.season === "Fall");
  input[28] = Number(style.season === "Winter");
  input[29] = Number(style.season === "Spring");

  input[30] = Number(style.usage === "Casual");
  input[31] = Number(style.usage === "Sports");
  input[32] = Number(style.usage === "Ethnic");
  input[33] = Number(style.usage === "Formal");

  return input;
}
