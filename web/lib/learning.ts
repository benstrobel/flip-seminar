import { Sample, StatsData, Style } from "@/pages";
import * as tf from "@tensorflow/tfjs";

export function getModel() {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 20, inputShape: [34] }));
  model.add(tf.layers.dense({ units: 10, inputShape: [20] }));
  model.add(tf.layers.dense({ units: 2, inputShape: [10] }));
  model.compile({
    loss: tf.losses.sigmoidCrossEntropy,
    optimizer: new tf.SGDOptimizer(0.4),
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
  console.log("counting");
  return bulkPredictionToStatsData(bulkInput, predictions);
}

async function bulkPredictionToStatsData(
  bulkInput: Style[],
  bulkOutput: tf.Tensor<tf.Rank>
): Promise<StatsData> {
  const colorStatData = [0, 0, 0, 0, 0];
  const seasonStatData = [0, 0, 0, 0];
  const usageStatData = [0, 0, 0, 0, 0];

  const output = bulkOutput.as2D(bulkInput.length, 2);

  for (let i = 0; i < bulkInput.length; i++) {
    const input = bulkInput[i];
    const data = await output.slice(i, 1).data();

    if (data[0] > data[1]) {
      if (input.baseColour === "Black") {
        colorStatData[0] += 1;
      }
      if (input.baseColour === "White") {
        colorStatData[1] += 1;
      }
      if (input.baseColour === "Blue") {
        colorStatData[2] += 1;
      }
      if (input.baseColour === "Brown") {
        colorStatData[3] += 1;
      }
      if (input.baseColour === "Grey") {
        colorStatData[4] += 1;
      }

      if (input.season === "Summer") {
        seasonStatData[0] += 1;
      }
      if (input.season === "Fall") {
        seasonStatData[1] += 1;
      }
      if (input.season === "Winter") {
        seasonStatData[2] += 1;
      }
      if (input.season === "Spring") {
        seasonStatData[3] += 1;
      }

      if (input.usage === "Casual") {
        usageStatData[0] += 1;
      }
      if (input.usage === "Sports") {
        usageStatData[1] += 1;
      }
      if (input.usage === "Ethnic") {
        usageStatData[2] += 1;
      }
      if (input.usage === "Formal") {
        usageStatData[3] += 1;
      }
      if (input.usage === "NA") {
        usageStatData[4] += 1;
      }
    }
  }

  return {
    colorStatData: colorStatData,
    seasonStatData: seasonStatData,
    usageStatData: usageStatData,
  };
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

  input[20] = Number(style.baseColour === "Black");
  input[21] = Number(style.baseColour === "White");
  input[22] = Number(style.baseColour === "Blue");
  input[23] = Number(style.baseColour === "Brown");
  input[24] = Number(style.baseColour === "Grey");

  input[25] = Number(style.season === "Summer");
  input[26] = Number(style.season === "Fall");
  input[27] = Number(style.season === "Winter");
  input[28] = Number(style.season === "Spring");

  input[29] = Number(style.usage === "Casual");
  input[30] = Number(style.usage === "Sports");
  input[31] = Number(style.usage === "Ethnic");
  input[32] = Number(style.usage === "Formal");
  input[33] = Number(style.usage === "NA");

  return input;
}
