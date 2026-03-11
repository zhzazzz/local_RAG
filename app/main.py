from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from app.services.document_loader import load_all_documents
from app.services.rag_service import build_vectorstore, build_rag_chain
from app.routers.chat import router as chat_router
from app.routers.kb import router as kb_router

app = FastAPI(title="本地知识库 RAG 系统（主流架构版）")

# 全局状态
app.state.loaded_files = []
app.state.use_cloud_llm = True

@app.on_event("startup")
async def startup_event():
    print("🚀 正在构建知识库...")
    docs, loaded_files = load_all_documents("File")
    app.state.loaded_files = loaded_files
    vectorstore = build_vectorstore(docs)
    rag_chain, retriever = build_rag_chain(vectorstore)
    
    app.state.vectorstore = vectorstore
    app.state.rag_chain = rag_chain
    app.state.retriever = retriever
    print(f"✅ 知识库构建完成！共 {len(loaded_files)} 个文件，已就绪")

# 挂载静态文件 + 首页
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def serve_index():
    return FileResponse("static/index.html")

# 注册路由
app.include_router(chat_router)
app.include_router(kb_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7866)