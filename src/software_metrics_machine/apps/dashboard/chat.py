import streamlit as st
from langchain.chat_models import ChatOllama
from langchain.memory import ConversationBufferMemory
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

st.set_page_config(layout="wide")
st.title("My Local Chatbot")

st.sidebar.header("Settings")

model_options = ["llama3", "deepseek-r1:1.5b"]
MODEL = st.sidebar.selectbox("Choose a Model", model_options, index=0)

MAX_HISTORY = st.sidebar.number_input("Max History", min_value=1, value=2, step=1)
CONTEXT_SIZE = st.sidebar.number_input(
    "Context Size", min_value=1024, max_value=16384, value=8192, step=1024
)


def clear_memory():
    st.session_state.chat_history = []
    st.session_state.memory = ConversationBufferMemory(
        return_messages=True
    )  # Reset memory


if (
    "prev_context_size" not in st.session_state
    or st.session_state.prev_context_size != CONTEXT_SIZE
):
    clear_memory()
    st.session_state.prev_context_size = CONTEXT_SIZE

if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

if "memory" not in st.session_state:
    st.session_state.memory = ConversationBufferMemory(return_messages=True)

llm = ChatOllama(model=MODEL, streaming=True)

prompt_template = PromptTemplate(
    input_variables=["history", "human_input"],
    template="{history}\nUser: {human_input}\nAssistant:",
)

chain = LLMChain(llm=llm, prompt=prompt_template, memory=st.session_state.memory)

for msg in st.session_state.chat_history:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])


def trim_memory():
    while len(st.session_state.chat_history) > MAX_HISTORY * 2:
        st.session_state.chat_history.pop(0)
        if st.session_state.chat_history:
            st.session_state.chat_history.pop(0)


if prompt := st.chat_input("Say something"):
    with st.chat_message("user"):
        st.markdown(prompt)

    st.session_state.chat_history.append({"role": "user", "content": prompt})

    trim_memory()

    with st.chat_message("assistant"):
        response_container = st.empty()
        full_response = ""

        for chunk in chain.stream({"human_input": prompt}):
            if isinstance(chunk, dict) and "text" in chunk:
                text_chunk = chunk["text"]
                full_response += text_chunk
                response_container.markdown(full_response)

    st.session_state.chat_history.append(
        {"role": "assistant", "content": full_response}
    )

    trim_memory()
