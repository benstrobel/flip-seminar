"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelBulkPredict = exports.modelPredict = exports.trainModel = exports.getModel = exports.sampleThreshold = void 0;
const tf = __importStar(require("@tensorflow/tfjs"));
exports.sampleThreshold = 5;
function getModel() {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 20, inputShape: [36] }));
    model.add(tf.layers.dense({ units: 10, inputShape: [20] }));
    model.add(tf.layers.dense({ units: 2, inputShape: [10] }));
    model.compile({
        loss: tf.losses.sigmoidCrossEntropy,
        optimizer: new tf.SGDOptimizer(0.4),
    });
    return model;
}
exports.getModel = getModel;
function trainModel(model, samples) {
    return __awaiter(this, void 0, void 0, function* () {
        const xs = tf.tensor2d(samples.map((x) => styleToModelInput(x.style)), [samples.length, 36]);
        const ys = tf.tensor2d(samples.map((x) => [Number(x.pos === true), Number(x.pos === false)]), [samples.length, 2]);
        return yield model.fit(xs, ys, { batchSize: 5 }).then(() => {
            return model;
        });
    });
}
exports.trainModel = trainModel;
function modelPredict(model, input) {
    return __awaiter(this, void 0, void 0, function* () {
        const prediction = model.predict(tf.tensor2d(styleToModelInput(input), [1, 36]));
        const data = yield prediction.as1D().data();
        return data[0] > data[1];
    });
}
exports.modelPredict = modelPredict;
function modelBulkPredict(model, bulkInput) {
    return __awaiter(this, void 0, void 0, function* () {
        const predictions = model.predict(tf.tensor2d(bulkInput.map((x) => styleToModelInput(x)), [bulkInput.length, 36]));
        return bulkPredictionToStatsData(bulkInput, predictions);
    });
}
exports.modelBulkPredict = modelBulkPredict;
function bulkPredictionToStatsData(bulkInput, bulkOutput) {
    return __awaiter(this, void 0, void 0, function* () {
        const colorStatData = [0, 0, 0, 0, 0];
        const seasonStatData = [0, 0, 0, 0];
        const usageStatData = [0, 0, 0, 0, 0, 0, 0];
        const output = bulkOutput.as2D(bulkInput.length, 2);
        const data = yield output.slice(0, bulkInput.length).data();
        for (let i = 0; i < bulkInput.length; i = i + 2) {
            const posClassProbability = data[i + 0];
            const negClassProbability = data[i + 1];
            const input = bulkInput[i];
            if (posClassProbability > negClassProbability) {
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
                if (input.usage === "Party") {
                    usageStatData[5] += 1;
                }
                if (input.usage === "Smart Casual") {
                    usageStatData[6] += 1;
                }
            }
        }
        return {
            colorStatData: colorStatData,
            seasonStatData: seasonStatData,
            usageStatData: usageStatData,
        };
    });
}
function styleToModelInput(style) {
    const input = new Array(36);
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
    input[34] = Number(style.usage === "Party");
    input[35] = Number(style.usage === "Smart Casual");
    return input;
}
