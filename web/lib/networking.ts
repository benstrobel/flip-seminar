import * as tf from "@tensorflow/tfjs";

const baseUrl = "localhost:1337";
const websocketUrl = "ws://" + baseUrl;
let ws: WebSocket | null = null;

export function connect(connectedCallback: () => void) {
  ws = new WebSocket(websocketUrl);
  ws.onopen = connectedCallback;
}

export function pushModel(model: tf.Sequential) {
  encodeWeights(model);
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

export default function stringToArrayBuffer(str: string): ArrayBuffer {
  const stringLength = str.length;
  const buffer = new ArrayBuffer(stringLength * 2);
  const bufferView = new Uint16Array(buffer);
  for (let i = 0; i < stringLength; i++) {
    bufferView[i] = str.charCodeAt(i);
  }
  return buffer;
}
