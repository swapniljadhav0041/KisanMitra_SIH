from fastapi import APIRouter, UploadFile, File, Depends
from ..core.deps import get_current_user
import os
import uuid

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

UPLOAD_DIR = "storage/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
async def upload_file(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    file_ext = file.filename.split(".")[-1]
    unique_name = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    url = f"/static/uploads/{unique_name}"
    return {"url": url}