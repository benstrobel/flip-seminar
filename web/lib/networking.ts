import * as tf from "@tensorflow/tfjs";
import { encodeWeights } from "./learning";

const baseUrl = "localhost:1337";
const websocketUrl = "ws://" + baseUrl;
let ws: WebSocket | null = null;

export function connect(connectedCallback: () => void) {
  ws = new WebSocket(websocketUrl);
  ws.onopen = connectedCallback;
}

export async function pushModel(model: tf.Sequential) {
  // TODO Implement differential privacy perturbation
  if (ws && ws.OPEN) {
    ws.send(await encodeWeights(model));
  }
}

export function registerDisconnectCallback(callback: () => void) {
  if (ws && ws.OPEN) {
    ws.onclose = callback;
  }
}

export function registerCallback(callback: (msg: string) => void) {
  if (ws) {
    ws.onmessage = (msg) => {
      callback(msg.data);
    };
  }
}
