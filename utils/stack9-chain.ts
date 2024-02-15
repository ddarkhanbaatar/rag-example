import { HumanMessage, AIMessage } from "@langchain/core/messages";

import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import {
  RunnablePassthrough,
  RunnableSequence,
  RunnableWithMessageHistory,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatMessageHistory } from "langchain/stores/message/in_memory";
import { LangChainService } from "@/services/LangChainService";

const ANSWER_CHAIN_SYSTEM_TEMPLATE = `You are an experienced researcher, 
expert at interpreting and answering questions based on provided sources.
Using the below provided context and chat history, 
answer the user's question to the best of 
your ability 
using only the resources provided. Be verbose!

<context>
{context}
</context>`;

const REPHRASE_QUESTION_SYSTEM_TEMPLATE = `Given the following conversation and a follow up question, 
rephrase the follow up question to be a standalone question.`;

async function initChain() {
  const llmService = new LangChainService();

  const vectorstore = await llmService.getVectorStore();
  const retriever = vectorstore.asRetriever();

  const answerGenerationChainPrompt = ChatPromptTemplate.fromMessages([
    ["system", ANSWER_CHAIN_SYSTEM_TEMPLATE],
    new MessagesPlaceholder("history"),
    [
      "human",
      "Now, answer this question using the previous context and chat history:\n{standalone_question}",
    ],
  ]);

  await answerGenerationChainPrompt.formatMessages({
    context: "fake retrieved content",
    standalone_question: "Why is the sky blue?",
    history: [
      new HumanMessage("How are you?"),
      new AIMessage("Fine, thank you!"),
    ],
  });

  const rephraseQuestionChainPrompt = ChatPromptTemplate.fromMessages([
    ["system", REPHRASE_QUESTION_SYSTEM_TEMPLATE],
    new MessagesPlaceholder("history"),
    [
      "human",
      "Rephrase the following question as a standalone question:\n{question}",
    ],
  ]);

  const rephraseQuestionChain = RunnableSequence.from([
    rephraseQuestionChainPrompt,
    new ChatOpenAI({
      temperature: 0.1,
      modelName: "gpt-3.5-turbo-1106",
      openAIApiKey: "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",
    }),
    new StringOutputParser(),
  ]);

  const conversationalRetrievalChain = RunnableSequence.from([
    RunnablePassthrough.assign({
      standalone_question: rephraseQuestionChain,
    }),
    RunnablePassthrough.assign({
      context: llmService.documentRetrievalChain({ retriever }),
    }),
    answerGenerationChainPrompt,
    new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      openAIApiKey: "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",
    }),
    new StringOutputParser(),
  ]);

  const messageHistory = new ChatMessageHistory();

  const finalRetrievalChain = new RunnableWithMessageHistory({
    runnable: conversationalRetrievalChain,
    getMessageHistory: (_sessionId) => messageHistory,
    historyMessagesKey: "history",
    inputMessagesKey: "question",
  });

  return finalRetrievalChain;
}

export const stack9Chain = await initChain();
