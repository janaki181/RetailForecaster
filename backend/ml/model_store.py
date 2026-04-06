import os
import pickle

ARTIFACT_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
os.makedirs(ARTIFACT_DIR, exist_ok=True)


def model_path(product_id: int) -> str:
    return os.path.join(ARTIFACT_DIR, f"product_{product_id}.pkl")


def save_model(product_id: int, model_bundle: dict) -> None:
    with open(model_path(product_id), "wb") as f:
        pickle.dump(model_bundle, f)


def load_model(product_id: int):
    path = model_path(product_id)
    if not os.path.exists(path):
        return None
    with open(path, "rb") as f:
        return pickle.load(f)
