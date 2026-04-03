import os
from typing import List, Dict, Any
from dotenv import load_dotenv

from langchain_groq import ChatGroq
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser

from pathlib import Path
_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.exists():
    load_dotenv(_env_path)
else:
    load_dotenv()

class PregnancyRAGService:
    def __init__(self, persist_directory: str = "vectordb"):
        # 1. Initialize LLM (Llama 3 via Groq)
        self.llm = ChatGroq(
            temperature=0.1,
            model_name="llama-3.1-8b-instant",  # Higher rate limits than 70b; fast for voice
            groq_api_key=os.getenv("GROQ_API_KEY")
        )

        # 2. Initialize Vector DB
        embeddings = FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")
        
        # Ensure vectordb exists and is populated from health_book.txt
        index_exists = os.path.exists(persist_directory) and any(os.listdir(persist_directory))
        if not index_exists:
            print(f"⚠️ VectorDB at {persist_directory} not found or empty. Initializing from health_book.txt...")
            from ingest import ingest_docs
            health_file = "health_book.txt"
            if os.path.exists(health_file):
                ingest_docs(health_file, persist_directory)
            else:
                print(f"❌ Error: {health_file} not found. RAG service will have no medical context.")

        self.vectordb = Chroma(
            persist_directory=persist_directory,
            embedding_function=embeddings,
            collection_name="pregnancy_docs"
        )
        self.retriever = self.vectordb.as_retriever(search_kwargs={"k": 5})

        # 3. Prompt - Expert Prenatal Care Evaluator
        self.rag_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert prenatal care evaluator for pregnant women. You will receive transcribed audio input regarding a woman's current symptoms, diet, and lifestyle habits.
Your sole purpose is to evaluate this information and provide immediate, practical guidance.

CRITICAL CONSTRAINTS:
- EXTREME BREVITY: Strict token limit. Keep your response under 3 to 4 short sentences.
- VOICE-OPTIMIZED: Your output will be spoken directly to the user via Text-to-Speech. Speak in a warm, simple, and direct conversational tone. Do absolutely NOT use markdown, asterisks, bullet points, or special characters.
- NO FLUFF: Do not use conversational filler (e.g., 'Thank you for sharing', 'I understand'). Get straight to the solution.
- DIRECT INFORMATION: Provide direct actionable information. Do not include disclaimers.

RESPONSE STRUCTURE (Answer only what is relevant):
1. Symptom/Emergency: If she reports a symptom, give the immediate action to take right now.
2. Diet: Give one specific, easily accessible food addition or subtraction based on her input.
3. Lifestyle: Give one specific adjustment for her daily routine or prenatal care.

Be impactful, highly specific, and concise."""),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", """CONTEXT FROM MEDICAL DOCUMENTS:
{context}

PATIENT DATA:
{patient_data}

USER QUESTION:
{question}

JANANI RESPONSE:""")
        ])

    def ask_stream(self, query: str, patient_data: str = "None provided", chat_history: list = None):
        if chat_history is None:
            chat_history = []
            
        # 1. Retrieve
        docs = self.retriever.invoke(query)
        context = "\n\n".join([d.page_content for d in docs])
        
        # 2. Streaming Generation
        generation_chain = self.rag_prompt | self.llm | StrOutputParser()
        
        full_answer = ""
        for chunk in generation_chain.stream({
            "chat_history": chat_history,
            "context": context,
            "question": query,
            "patient_data": patient_data
        }):
            # VOICE-OPTIMIZATION: Strip asterisks and other markdown on the fly
            clean_chunk = chunk.replace("*", "").replace("#", "").replace("- ", "")
            full_answer += clean_chunk
            yield clean_chunk

        # Return sources after stream (not possible in generator easily, handle in main)
        # We will expose a method to get sources for a query if needed, or just return them with the stream.
        # Let's just return the answer chunks for now.

    def get_context_and_sources(self, query: str):
        docs = self.retriever.invoke(query)
        context = "\n\n".join([d.page_content for d in docs])
        sources = list(set([d.metadata.get("source", "Unknown") for d in docs]))
        return context, sources

if __name__ == "__main__":
    # Quick test (Requires API Key in .env)
    service = PregnancyRAGService()
    res = service.ask("What should I do about morning sickness?", "Patient is allergic to ginger.")
    print(f"Answer: {res['answer']}")
    print(f"Sources: {res['sources']}")
