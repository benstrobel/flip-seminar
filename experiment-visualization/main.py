import json
import matplotlib.pyplot as plt

with open('experiments/2/0.json') as f0:
    with open('experiments/2/1.json') as f1:
        entries0 = json.load(f0)
        entries1 = json.load(f1)
        plt.plot([x["localErrorVal"] for x in entries0[:40]], label="Local Train Loss 0", color="blue")
        plt.plot([x["localErrorTrain"] for x in entries0[:40]], label="Local Validation Loss 0", color="purple")
        plt.plot([x["localErrorVal"] for x in entries1[:40]], label="Local Validation Loss 1", color="orange")
        plt.plot([x["localErrorTrain"] for x in entries1[:40]], label="Local Train Loss 1", color="red")
        plt.legend()
        plt.xlabel("Epochs")
        plt.ylabel("Binary Cross Entropy Loss")
        plt.show()

with open('experiments/2/0.json') as f0:
    with open('experiments/2/1.json') as f1:
        entries0 = json.load(f0)
        entries1 = json.load(f1)
        plt.plot([x["federatedErrorVal"] for x in entries0[:40]], label="Federated Validation Loss 0", color="purple")
        plt.plot([x["federatedErrorTrain"] for x in entries0[:40]], label="Federated Train Loss 0", color="blue")
        plt.plot([x["federatedErrorVal"] for x in entries1[:40]], label="Federated Validation Loss 1", color="orange")
        plt.plot([x["federatedErrorTrain"] for x in entries1[:40]], label="Federated Train Loss 1", color="red")
        plt.legend()
        plt.xlabel("Epochs")
        plt.ylabel("Binary Cross Entropy Loss")
        plt.show()
