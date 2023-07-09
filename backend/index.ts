import express, { Express } from "express";
import dotenv from "dotenv";
import { WebSocket } from "ws";
import { applyDecodedWeights, getModel } from "../web/lib/learning";
import * as tf from "@tensorflow/tfjs-node";
import fileUpload from "express-fileupload";
import cors from "cors";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;
const clientThreshold = 1; // Set to 1 for demo purposes, increase for production

const wss = new WebSocket.Server({
  noServer: true,
});

app.use(
  fileUpload({
    useTempFiles: true,
    debug: true,
  })
);

app.use(cors());

let model = getModel();
let modelVersion = 1;
let clientModels: { [clientId: string]: {model: tf.Sequential, version: number, samplesUsed: number} } = {};

function stalenessFactor(serverModelVersion: number, clientModelVersion: number) {
  return (serverModelVersion-clientModelVersion) === 0 ? 1 : 1/(serverModelVersion-clientModelVersion);
}

async function receiveModel(receivedModel: tf.Sequential, clientId: number, clientModelVersion: number, samplesUsed: number) {
  console.log(
    "received client model " + (Object.keys(clientModels).length + 1 + " from version: " + clientModelVersion + " with sample count: " + samplesUsed)
  );
  clientModels[clientId] = {model: receivedModel, version: clientModelVersion, samplesUsed: samplesUsed};
  // Federated averaging, weighed by samplecount update is based on & staleness of update
  if (Object.keys(clientModels).length >= clientThreshold) {
    const currentWeights = model.getWeights();
    const newWeights: tf.Tensor<tf.Rank>[] = [];
    const sampleSum = Object.values(clientModels).reduce((prev, curr) => prev + curr.samplesUsed, 0)
    for (let i = 0; i < currentWeights.length; i++) {
      const clientWeightWithIndex = Object.values(clientModels).map((x) => tf.mul(x.model.getWeights()[i], x.samplesUsed * stalenessFactor(modelVersion, clientModelVersion)));
      newWeights[i] = tf.div(tf.div(tf.addN([
        ...Array(clientWeightWithIndex.length).fill(tf.mul(currentWeights[i], sampleSum)),
        ...clientWeightWithIndex,
      ]), clientWeightWithIndex.length + 1), sampleSum*2);
    }
    model.setWeights(newWeights);
    modelVersion += 1;
    clientModels = {};
    await pushModel(model);
  }
}

async function pushModel(model: tf.Sequential) {
  const serializedModel = await encodeWeights(model, modelVersion, wss.clients.size);
  wss.clients.forEach((client) => {
    client.send(serializedModel);
  });
}

wss.on("connection", function (ws) {
  const clientId = Math.floor(Math.random() * 10000000000000);
  ws.onmessage = (event) => {
    console.log("received model from " + clientId);
    const receivedModel = getModel();
    const decoded = applyDecodedWeights(event.data as string, receivedModel);
    const modelVersion: number = decoded.modelVersion;
    const samplesUsed: number = decoded.samplesUsed;
    receiveModel(receivedModel, clientId, modelVersion, samplesUsed);
  };
});

wss.on("close", () => {
  if(wss.clients.size === 0) {
    model = getModel();
    modelVersion = 1;
    clientModels = {};
  }
})

const server = app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (socket) => {
    wss.emit("connection", socket, request);
  });
});

export async function encodeWeights(model: tf.Sequential, modelVersion: number, clientsConnected: number) {
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
  return JSON.stringify({ data: secondStep, specs: firstStep.specs, modelVersion: modelVersion, latestClientCount: clientsConnected });
}
