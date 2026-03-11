from fastapi import APIRouter, Request
from app.dependencies import get_app_state

router = APIRouter(prefix="/kb", tags=["知识库"])

@router.get("/files")
async def get_files(request: Request):
    state = get_app_state(request)
    return {"files": state["loaded_files"]}

@router.post("/set_mode")
async def set_mode(request: Request):
    data = await request.json()
    request.app.state.use_cloud_llm = data.get("cloud", True)
    mode = "云端智能回答" if request.app.state.use_cloud_llm else "纯本地检索（零联网）"
    print(f"🔄 模式已切换 → {mode}")
    return {"status": "ok", "mode": mode}