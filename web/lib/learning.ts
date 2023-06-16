import { Sample, SampleGameState } from "@/components/Pong";
import * as tf from "@tensorflow/tfjs";

export function test() {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [1] }));

  model.compile({ loss: "meanSquaredError", optimizer: "sgd" });

  const xs = tf.tensor2d([1, 2, 3, 4], [4, 1]);
  const ys = tf.tensor2d([1, 3, 5, 7], [4, 1]);

  model.fit(xs, ys).then(() => {
    console.log(model.predict(tf.tensor2d([5], [1, 1])).toString());
  });
}

export function getModel() {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 4, inputShape: [3] }));
  model.add(tf.layers.dense({ units: 3, inputShape: [4] }));
  model.compile({ loss: "meanSquaredError", optimizer: "sgd" });
  return model;
}

export async function trainModel(model: tf.Sequential, samples: Sample[]) {
  const xs = samples.map((x) => {
    return gameStateToInput(x.gameState);
  });
  const ys = samples.map((x) => {
    return [
      Number(x.resultInput === -1),
      Number(x.resultInput === 0),
      Number(x.resultInput === 1),
    ];
  });

  const xst = tf.tensor2d(xs, [samples.length, 3]);
  const yst = tf.tensor2d(ys, [samples.length, 3]);

  return await model.fit(xst, yst, { batchSize: 10 }).then(() => {
    return model;
  });
}

export async function modelPredict(
  model: tf.Sequential,
  gameState: SampleGameState,
  debug: boolean = false
) {
  const prediction = model.predict(
    tf.tensor2d(gameStateToInput(gameState), [1, 3])
  ) as tf.Tensor<tf.Rank>;
  return await predictionToInput(prediction);
}

function gameStateToInput(gameState: SampleGameState) {
  return [
    gameState.playerBallDistance,
    gameState.playerBallVec.x,
    gameState.playerBallVec.y,
  ];
}

async function predictionToInput(
  prediction: tf.Tensor<tf.Rank>,
  debug: boolean = false
) {
  const result = await prediction.as1D().data();
  let highestRankIndex = -1;
  for (let i = -1; i < 2; i++) {
    if (result[i + 1] > result[highestRankIndex + 1]) {
      highestRankIndex = i;
    }
  }
  if (debug) {
    console.log(result[0] + " " + result[1] + " " + result[2]);
  }
  return highestRankIndex;
}
