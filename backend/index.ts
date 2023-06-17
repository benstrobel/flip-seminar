import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { WebSocket } from "ws";
import { applyDecodedWeights, getModel } from "../web/lib/learning";
import * as tf from "@tensorflow/tfjs-node";
import fileUpload from "express-fileupload";
import fs from "fs";
import cors from "cors";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;
const modelThreshold = 1;

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
let clientModels: tf.Sequential[] = [];

async function receiveModel(receivedModel: tf.Sequential) {
  console.log("received client model " + (clientModels.length + 1));
  clientModels.push(receivedModel);
  if (clientModels.length >= modelThreshold) {
    const currentWeights = model.getWeights();
    const clientWeights = clientModels.map((x) => x.getWeights());
    const newWeights: tf.Tensor<tf.Rank>[] = [];
    for (let i = 0; i < currentWeights.length; i++) {
      const clientWeightWithIndex = clientWeights.map((x) => x[i]);
      newWeights[i] = tf.addN([currentWeights[i], ...clientWeightWithIndex]);
    }
    model.setWeights(newWeights);
    clientModels = [];
    await pushModel(model);
  }
}

async function pushModel(model: tf.Sequential) {
  const serializedModel = await encodeWeights(model);

  wss.clients.forEach((client) => {
    client.send(serializedModel);
  });
}

wss.on("connection", function (ws) {
  ws.onmessage = (event) => {
    console.log("received model ");
    const receivedModel = getModel();
    applyDecodedWeights(event.data as string, receivedModel);
    receiveModel(receivedModel);
  };
});

const server = app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (socket) => {
    wss.emit("connection", socket, request);
  });
});

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
