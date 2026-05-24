"""
ai-lab/training/server.py
FastAPI WebSocket server for AI Lab Mode 2 backend training.

Install:
    pip install fastapi uvicorn websockets torch

Run:
    python ai-lab/training/server.py

Then in the AI Lab, set Training Mode → WebSocket and click Run.
The server streams loss / accuracy / weights / activations back to
the browser over ws://localhost:8765.
"""

import json
import asyncio
import math
import random
from typing import Any

import torch
import torch.nn as nn
import torch.optim as optim

try:
    import uvicorn
    from fastapi import FastAPI, WebSocket, WebSocketDisconnect
except ImportError:
    raise SystemExit("Install: pip install fastapi uvicorn websockets")

app = FastAPI()

# ─────────────────────────────────────────────
# Model builder
# ─────────────────────────────────────────────

def build_model(input_size: int, hidden_sizes: list[int], num_classes: int, act: str) -> nn.Module:
    ACT = {
        "relu":    nn.ReLU,
        "sigmoid": nn.Sigmoid,
        "tanh":    nn.Tanh,
    }
    act_cls = ACT.get(act, nn.ReLU)

    layers: list[nn.Module] = []
    prev = input_size
    for h in hidden_sizes:
        layers += [nn.Linear(prev, h), act_cls()]
        prev = h

    # Output layer
    if num_classes == 2:
        layers += [nn.Linear(prev, 1), nn.Sigmoid()]
    else:
        layers += [nn.Linear(prev, num_classes), nn.Softmax(dim=-1)]

    return nn.Sequential(*layers)


def extract_weights(model: nn.Module) -> list[dict]:
    """Return weight matrices as plain Python lists for JSON serialisation."""
    result = []
    for layer in model.modules():
        if isinstance(layer, nn.Linear):
            w = layer.weight.detach().cpu().tolist()   # [out, in]
            b = layer.bias.detach().cpu().tolist()
            result.append({"w": w, "shape": [layer.in_features, layer.out_features], "b": b})
    return result


def extract_activations(model: nn.Module, sample_x: list[float], input_size: int) -> list[list[float]]:
    """Forward pass collecting per-layer activations."""
    acts: list[list[float]] = [sample_x]  # input layer
    x = torch.tensor(sample_x, dtype=torch.float32).unsqueeze(0)
    with torch.no_grad():
        for layer in model.children():
            x = layer(x)
            flat = x.squeeze(0).tolist()
            if isinstance(flat, float):
                flat = [flat]
            # Clamp to [0, 1] for visualiser
            acts.append([max(0.0, min(1.0, float(v))) for v in flat])
    return acts


# ─────────────────────────────────────────────
# WebSocket endpoint
# ─────────────────────────────────────────────

@app.websocket("/")
async def train_endpoint(ws: WebSocket):
    await ws.accept()
    print("Client connected")

    try:
        # Wait for start message
        raw = await ws.receive_text()
        msg = json.loads(raw)

        if msg.get("type") != "start":
            await ws.send_text(json.dumps({"type": "error", "message": "Expected start message"}))
            return

        cfg = msg.get("config", {})
        layers      = int(cfg.get("layers",     2))
        act         = str(cfg.get("act",        "relu"))
        lr          = float(cfg.get("lr",       0.001))
        epochs      = int(cfg.get("epochs",     200))
        batch_size  = int(cfg.get("batchSize",  32))
        input_size  = int(cfg.get("inputSize",  2))
        num_classes = int(cfg.get("numClasses", 2))
        raw_data    = cfg.get("data", [])

        hidden_sizes = (
            [8]       if layers == 1 else
            [12, 8]   if layers == 2 else
            [16, 12, 8]
        )

        # Build model and optimizer
        model     = build_model(input_size, hidden_sizes, num_classes, act)
        optimizer = optim.Adam(model.parameters(), lr=lr)
        criterion = nn.BCELoss() if num_classes == 2 else nn.CrossEntropyLoss()

        # Prepare tensors
        if raw_data:
            xs = torch.tensor([[float(v) for v in d["x"]] for d in raw_data], dtype=torch.float32)
            if num_classes == 2:
                ys = torch.tensor([[float(d["label"])] for d in raw_data], dtype=torch.float32)
            else:
                ys = torch.tensor([int(d["label"]) for d in raw_data], dtype=torch.long)
        else:
            # Synthetic fallback: XOR-like dataset
            n = 200
            xs = torch.rand(n, input_size) * 4 - 2
            if num_classes == 2:
                ys = ((xs[:, 0] * xs[:, 1]) > 0).float().unsqueeze(1)
            else:
                ys = torch.randint(0, num_classes, (n,))

        n_samples = xs.shape[0]

        await ws.send_text(json.dumps({"type": "ready"}))
        print(f"Training: {epochs} epochs, lr={lr}, layers={hidden_sizes}, n={n_samples}")

        sample_x = xs[0].tolist()  # fixed sample for activation extraction

        for epoch in range(epochs):
            # Check for stop message (non-blocking)
            try:
                stop_raw = await asyncio.wait_for(ws.receive_text(), timeout=0.001)
                stop_msg = json.loads(stop_raw)
                if stop_msg.get("type") == "stop":
                    print("Stop received")
                    break
            except (asyncio.TimeoutError, Exception):
                pass

            model.train()
            # Shuffle indices
            perm   = torch.randperm(n_samples)
            xs_sh  = xs[perm]
            ys_sh  = ys[perm]

            epoch_loss = 0.0
            epoch_correct = 0
            num_batches = math.ceil(n_samples / batch_size)

            for b in range(num_batches):
                x_batch = xs_sh[b * batch_size:(b + 1) * batch_size]
                y_batch = ys_sh[b * batch_size:(b + 1) * batch_size]

                optimizer.zero_grad()
                pred = model(x_batch)

                loss = criterion(pred, y_batch)
                loss.backward()
                optimizer.step()

                epoch_loss += loss.item()
                if num_classes == 2:
                    correct = ((pred > 0.5).float() == y_batch).sum().item()
                else:
                    correct = (pred.argmax(1) == y_batch).sum().item()
                epoch_correct += correct

                # Stream batch metrics
                batch_acc = correct / x_batch.shape[0]
                await ws.send_text(json.dumps({
                    "type":         "metrics",
                    "loss":         round(loss.item(), 6),
                    "acc":          round(batch_acc, 4),
                    "epoch":        epoch,
                    "batch":        b,
                    "totalBatches": num_batches,
                }))
                await asyncio.sleep(0)   # yield for WebSocket sends

            # End-of-epoch: weights + activations
            model.eval()
            layer_weights = extract_weights(model)
            activations   = extract_activations(model, sample_x, input_size)

            await ws.send_text(json.dumps({"type": "weights",     "layerWeights": layer_weights}))
            await ws.send_text(json.dumps({"type": "activations", "acts": activations}))

            final_acc = epoch_correct / n_samples
            print(f"  Epoch {epoch:4d}  loss={epoch_loss/num_batches:.4f}  acc={final_acc:.3f}")

        final_loss = epoch_loss / max(num_batches, 1)
        final_acc  = epoch_correct / n_samples

        await ws.send_text(json.dumps({
            "type":      "done",
            "finalLoss": round(final_loss, 6),
            "finalAcc":  round(final_acc * 100, 2),
            "epochs":    epochs,
        }))
        print(f"Done — final loss={final_loss:.4f}  acc={final_acc:.3f}")

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")
        try:
            await ws.send_text(json.dumps({"type": "error", "message": str(e)}))
        except Exception:
            pass


# ─────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────
if __name__ == "__main__":
    print("AI Lab backend server starting on ws://localhost:8765")
    print("Press Ctrl+C to stop.\n")
    uvicorn.run(app, host="0.0.0.0", port=8765, log_level="warning")
