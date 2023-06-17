"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const ws_1 = require("ws");
const learning_1 = require("../web/lib/learning");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
const modelThreshold = 3;
const wss = new ws_1.WebSocket.Server({
    noServer: true,
});
let model = (0, learning_1.getModel)();
let clientModels = [];
function pushSample(message) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("pushSample");
        clientModels.push(message.model);
        console.log(message.model);
        if (clientModels.length >= modelThreshold) {
            // TODO Federated Averaging
            clientModels = [];
        }
    });
}
wss.on("connection", function (ws) {
    ws.on("message", function (msg) {
        return __awaiter(this, void 0, void 0, function* () {
            yield pushSample(JSON.parse(msg.toString()));
        });
    });
});
app.get("/", (req, res) => {
    res.send("Express + TypeScript Server");
});
const server = app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (socket) => {
        wss.emit("connection", socket, request);
    });
});
