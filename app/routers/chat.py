from fastapi import APIRouter, Request
from app.dependencies import get_app_state

router = APIRouter(prefix="", tags=["聊天"])

@router.post("/chat")
async def chat(request: Request):
    data = await request.json()
    question = data.get("question")
    if not question:
        return {"answer": "请输入问题"}

    state = get_app_state(request)
    retrieved_docs = state["retriever"].invoke(question)

    if state["use_cloud_llm"]:
        result = state["rag_chain"].invoke({"input": question})
        answer = result["answer"]
    else:
        context = "\n\n" + "-"*50 + "\n\n".join([
            f"【来源：{d.metadata.get('source', '未知')}】\n{d.page_content}"
            for d in retrieved_docs
        ])
        answer = f"【纯本地模式】\n以下是知识库中检索到的相关原始片段（共 {len(retrieved_docs)} 个）：\n{context}"

    return {"answer": answer}