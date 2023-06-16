import { Sample, SampleGameState } from "@/components/Pong";
import * as tf from "@tensorflow/tfjs";

export function getModel() {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 4, inputShape: [3] }));
  model.add(tf.layers.dense({ units: 3, inputShape: [4] }));
  model.compile({ loss: tf.losses.sigmoidCrossEntropy, optimizer: "sgd" });
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
  return await predictionToInput(prediction, debug);
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
