import streamlit as st
import os
from langchain_community.chat_models import ChatOllama
from langchain_community.document_loaders import DirectoryLoader, JSONLoader
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage

st.set_page_config(layout="wide")
st.title("📄 My Local Metrics Agent")
st.markdown(
    "This chatbot uses local models and your JSON files to answer questions about your data."
)

st.sidebar.header("Settings")

model_options = ["llama3", "mistral", "gemma:2b"]
MODEL = st.sidebar.selectbox("Choose a Chat Model", model_options, index=0)

embed_model_options = ["nomic-embed-text", "mxbai-embed-large", "all-minilm"]
EMBED_MODEL = st.sidebar.selectbox(
    "Choose an Embedding Model", embed_model_options, index=0
)
st.sidebar.markdown(
    "_Note: Ensure you have pulled these models with `ollama pull <model_name>`._"
)

DATA_PATH = st.sidebar.text_input(
    "Path to your JSON files",
    value="",
)


@st.cache_resource(show_spinner="Setting up RAG pipeline...")
def setup_rag_pipeline(folder_path, embedding_model):
    if not os.path.isdir(folder_path):
        st.error(
            f"The provided path '{folder_path}' is not a valid directory. Please update the path."
        )
        return None

    loader = DirectoryLoader(
        path=folder_path,
        glob="**/*.json",
        loader_cls=JSONLoader,
        loader_kwargs={
            "jq_schema": ".[]",
            "content_key": None,
            "text_content": False,
        },  # <-- THE CHANGE
        show_progress=True,
    )
    documents = loader.load()

    if not documents:
        st.warning("No JSON documents found in the specified directory.")
        return None

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    texts = text_splitter.split_documents(documents)

    embeddings = OllamaEmbeddings(model=embedding_model)
    vector_store = FAISS.from_documents(texts, embeddings)

    return vector_store.as_retriever()


try:
    retriever = setup_rag_pipeline(DATA_PATH, EMBED_MODEL)

    if retriever:
        llm = ChatOllama(model=MODEL, temperature=0.3)

        prompt_template = ChatPromptTemplate.from_template(
            """Answer the user's question based ONLY on the following context.
            If the context doesn't contain the answer, say you don't know. Be concise.

            Context:
            {context}

            Chat History:
            {chat_history}

            Question:
            {input}
            """
        )

        document_chain = create_stuff_documents_chain(llm, prompt_template)
        retrieval_chain = create_retrieval_chain(retriever, document_chain)

        st.sidebar.success("RAG pipeline is ready!")
    else:
        retrieval_chain = None

except Exception as e:
    st.sidebar.error(f"An error occurred: {e}")
    retrieval_chain = None

if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

for message in st.session_state.chat_history:
    if isinstance(message, HumanMessage):
        with st.chat_message("user"):
            st.markdown(message.content)
    elif isinstance(message, AIMessage):
        with st.chat_message("assistant"):
            st.markdown(message.content)

if prompt := st.chat_input("Ask a question about your metrics..."):
    if not retrieval_chain:
        st.warning("Please provide a valid data path to initialize the agent.")
    else:
        with st.chat_message("user"):
            st.markdown(prompt)

        st.session_state.chat_history.append(HumanMessage(content=prompt))

        with st.chat_message("assistant"):
            response_container = st.empty()
            full_response = ""

            chain_input = {
                "input": prompt,
                "chat_history": st.session_state.chat_history,
            }

            try:
                for chunk in retrieval_chain.stream(chain_input):
                    if answer_chunk := chunk.get("answer"):
                        full_response += answer_chunk
                        response_container.markdown(full_response + "▌")
                response_container.markdown(full_response)
            except Exception as e:
                st.error(f"Error during response generation: {e}")

        st.session_state.chat_history.append(AIMessage(content=full_response))
