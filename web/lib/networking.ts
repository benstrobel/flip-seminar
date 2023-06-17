import * as tf from "@tensorflow/tfjs";

const baseUrl = "localhost:1337";
const websocketUrl = "ws://" + baseUrl;
let ws: WebSocket | null = null;

export function connect(connectedCallback: () => void) {
  ws = new WebSocket(websocketUrl);
  ws.onopen = connectedCallback;
}

export function pushModel(model: tf.Sequential) {
  if (ws && ws.OPEN) {
    model.save("http://" + baseUrl + "/model").catch((ex) => {
      console.error(ex);
    });
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
