from langchain_openai import OpenAIEmbeddings
from app.config import settings

def get_embeddings():
    return OpenAIEmbeddings(
        model="text-embedding-v4",
        openai_api_key=settings.DASHSCOPE_API_KEY,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        dimensions=512,
        check_embedding_ctx_length=False,
        chunk_size=10,          # 阿里云百炼限制
    )