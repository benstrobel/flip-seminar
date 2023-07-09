import json
import matplotlib.pyplot as plt

with open('experiments/1/log.json') as f:
    entries = json.load(f)
    plt.plot([x["localErrorVal"] for x in entries], label="Local Validation Loss")
    plt.plot([x["federatedErrorVal"] for x in entries], label="Federated Validation Loss")
    plt.plot([x["localErrorTrain"] for x in entries], label="Local Train Loss")
    plt.plot([x["federatedErrorTrain"] for x in entries], label="Federated Train Loss")
    plt.legend()
    plt.xlabel("Epochs")
    plt.ylabel("Binary Cross Entropy Loss")
    plt.show()
