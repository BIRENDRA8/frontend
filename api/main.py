import base64
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel
import uvicorn
import io
import logging
import sys
import os


# Get the directory of the current script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Construct the full path to the model
MODEL_PATH = os.path.join(BASE_DIR, "../models", "1.h5")

# Load model using the full path

MODEL = tf.keras.models.load_model(MODEL_PATH, compile=False)
# Set UTF-8 encoding to handle international characters
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load your pre-trained model
try:
    # Use a more robust model loading approach
    MODEL = tf.keras.models.load_model("saved_models/1", compile=False)
except Exception as e:
    logging.error(f"Error loading model: {e}")
    MODEL = None

CLASS_NAMES = [
    "Anthracnose", "Bacterial Canker", "Cutting Weevil",
    "Die Back", "Gall Midge", "Healthy", "Powdery Mildew", "Sooty Mould"
]


@app.get("/ping")
async def ping():
    return {"message": "Server is alive"}


def read_image_from_base64(base64_str) -> np.ndarray:
    """
    Convert base64 string to image numpy array with robust error handling
    """
    try:
        # Ensure base64 string is clean
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]

        # Decode base64 string
        image_bytes = base64.b64decode(base64_str)

        # Convert to PIL Image
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Resize and normalize
        image = image.resize((224, 224))
        image_array = np.array(image) / 255.0

        return image_array
    except Exception as e:
        logging.error(f"Image processing error: {e}")
        raise

class ImageRequest(BaseModel):
    image: str

@app.post("/predict")
async def predict(body: ImageRequest):
    """
    Predict disease from base64 encoded image with comprehensive error handling
    """
    try:
        if MODEL is None:
            return {"error": "Machine learning model not loaded"}

        # Convert image to numpy array
        image = read_image_from_base64(body.image)

        # Prepare image batch for prediction
        img_batch = np.expand_dims(image, 0)

        # Make prediction
        predictions = MODEL.predict(img_batch)

        # Get predicted class and confidence
        predicted_class = CLASS_NAMES[np.argmax(predictions[0])]
        confidence = float(np.max(predictions[0]) * 100)

        return {
            'class': predicted_class,
            'Best Confidence': confidence
        }

    except Exception as e:
        logging.error(f"Prediction error: {e}")
        return {"error": str(e)}

@app.post("/predict-file")
async def predict_file(file: UploadFile = File(...)):
    try:
        if MODEL is None:
            return {"error": "Machine learning model not loaded"}

        # Read image from uploaded file
        image = Image.open(file.file).convert("RGB")

        # Resize and normalize
        image = image.resize((224, 224))
        image_array = np.array(image) / 255.0
        img_batch = np.expand_dims(image_array, 0)

        # Make prediction
        predictions = MODEL.predict(img_batch)

        # Get predicted class and confidence
        predicted_class = CLASS_NAMES[np.argmax(predictions[0])]
        confidence = float(np.max(predictions[0]) * 100)

        return {'class': predicted_class, 'Best Confidence': confidence}

    except Exception as e:
        logging.error(f"Prediction error: {e}")
        return {"error": str(e)}


if __name__ == "__main__":
    uvicorn.run(app, host='localhost', port=8000)


