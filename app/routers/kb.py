import os
from fastapi import UploadFile, File, HTTPException
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

@router.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    """上传文件 → 自动分类 → 保存 → 重新构建知识库（不重启服务）"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="没有选择文件")

    filename = file.filename.lower()
    
    # 自动判断结构化 / 非结构化
    if filename.endswith(('.csv', '.xlsx', '.xls')):
        target_dir = "File/Structured"
        file_type = "结构化文件"
    else:
        target_dir = "File/Unstructured"
        file_type = "非结构化文件"

    os.makedirs(target_dir, exist_ok=True)
    file_path = os.path.join(target_dir, file.filename)

    # 保存文件
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # 重新构建知识库（自动解析进大模型）
    from app.services.document_loader import load_all_documents
    from app.services.rag_service import build_vectorstore, build_rag_chain
    
    docs, loaded_files = load_all_documents("File")
    vectorstore = build_vectorstore(docs)
    rag_chain, retriever = build_rag_chain(vectorstore)

    # 更新全局状态
    request.app.state.loaded_files = loaded_files
    request.app.state.vectorstore = vectorstore
    request.app.state.rag_chain = rag_chain
    request.app.state.retriever = retriever

    return {
        "status": "success",
        "message": f"✅ {file.filename} 已上传并解析成功（{file_type}）",
        "path": file_path
    }