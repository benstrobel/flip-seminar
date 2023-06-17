import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { WebSocket } from "ws";
import { getModel } from "../web/lib/learning";
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

async function receiveModel(model: tf.Sequential) {
  tf.io.fromMemorySync;
  console.log("received client model " + (clientModels.length + 1));
  clientModels.push(model);
  if (clientModels.length >= modelThreshold) {
    const currentWeights = model.getWeights();
    const clientWeights = clientModels.map((x) => x.getWeights());
    const newWeights: tf.Tensor<tf.Rank>[] = [];
    for (let i = 0; i < currentWeights.length; i++) {
      const clientWeightWithIndex = clientWeights.map((x) => x[i]);
      newWeights[i] = tf.addN([currentWeights[i], ...clientWeightWithIndex]);
    }
    model.setWeights(newWeights);
    // tf.io.encodeWeights()
    clientModels = [];
  }
}

function pushModel(model: tf.Sequential) {
  const serializedModel = "test";

  wss.clients.forEach((client) => {
    client.send(serializedModel);
  });
}

wss.on("connection", function (ws) {
  ws.on("message", async function (msg) {
    await receiveModel(JSON.parse(msg.toString()));
  });
});

app.post("/model", async (req: Request, res: Response) => {
  const files = req.files;
  if (!files) return;
  const json = files["model.json"] as fileUpload.UploadedFile;
  const foldername = "./tmp/" + Math.random() * 1000000000;
  fs.mkdirSync(foldername);
  await json.mv("./" + foldername + "/" + "model.json");
  const bin = files["model.weights.bin"] as fileUpload.UploadedFile;
  await bin.mv("./" + foldername + "/" + "model.weights.bin");
  const model = await tf.loadLayersModel(
    tf.io.fileSystem("./" + foldername + "/" + "model.json")
  );
  fs.unlinkSync("./" + foldername + "/" + "model.json");
  fs.unlinkSync("./" + foldername + "/" + "model.weights.bin");
  receiveModel(model as tf.Sequential);
  res.send("");
});

const server = app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (socket) => {
    wss.emit("connection", socket, request);
  });
});
