from langchain_community.document_loaders import TextLoader, PyPDFLoader, CSVLoader, Docx2txtLoader
from langchain_core.documents import Document
import os
import pandas as pd

def load_all_documents(directory: str = "File"):
    """加载所有文档 + 收集文件列表（供前端展示）"""
    documents = []
    loaded_files = []
    
    for root, _, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            try:
                ext = file.lower()
                docs = []
                if ext.endswith(('.txt', '.md')):
                    docs = TextLoader(file_path, encoding="utf-8").load()
                elif ext.endswith('.pdf'):
                    docs = PyPDFLoader(file_path).load()
                elif ext.endswith('.csv'):
                    docs = CSVLoader(file_path, encoding="utf-8").load()
                elif ext.endswith(('.docx', '.doc')):
                    docs = Docx2txtLoader(file_path).load()
                elif ext.endswith(('.xlsx', '.xls')):
                    xls = pd.ExcelFile(file_path, engine="openpyxl")
                    for sheet_name in xls.sheet_names:
                        df = pd.read_excel(xls, sheet_name=sheet_name)
                        for idx, row in df.iterrows():
                            content = "\n".join([f"{col}: {val}" for col, val in row.items() if pd.notna(val)])
                            docs.append(Document(page_content=content, metadata={"source": file, "row": idx, "sheet": sheet_name}))
                    xls.close()

                if docs:
                    documents.extend(docs)
                    loaded_files.append({
                        "name": file,
                        "path": file_path.replace("\\", "/"),
                        "chunks": len(docs),
                        "type": ext.split(".")[-1]
                    })
                    print(f"✅ 已加载: {file} ({len(docs)} 条)")
            except Exception as e:
                print(f"⚠️ 加载失败 {file}: {e}")
    return documents, loaded_files