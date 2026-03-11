from fastapi import Request

def get_app_state(request: Request):
    """全局依赖：获取 vectorstore、loaded_files、模式开关"""
    return {
        "vectorstore": getattr(request.app.state, "vectorstore", None),
        "loaded_files": request.app.state.loaded_files,
        "use_cloud_llm": request.app.state.use_cloud_llm,
        "rag_chain": getattr(request.app.state, "rag_chain", None),
        "retriever": getattr(request.app.state, "retriever", None),
    }