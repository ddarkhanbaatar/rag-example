import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { RunnableSequence } from "@langchain/core/runnables";
import path from "node:path";

export class LangChainService {
  private collectionName = "stack9-rag";
  private url = "http://localhost:8000";
  // Read PDF and JSON documents
  public loadDocuments = async ({
    path = "./public/data",
  }: {
    path?: string;
  }) => {
    const loader = new DirectoryLoader(path, {
      ".json": (p) => new JSONLoader(p),
      ".pdf": (p) => new PDFLoader(p),
    });
    const docs = await loader.load();
    return docs;
  };

  // Split Documents into small chunks
  public splitDocuments = async ({
    data,
    chunkSize = 64,
    chunkOverlap = 32,
  }: {
    data: Document<Record<string, any>>[];
    chunkSize?: number;
    chunkOverlap?: number;
  }) => {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
    });

    return await textSplitter.splitDocuments(data);
  };

  public getEmbeddngs = () => {
    return new GoogleGenerativeAIEmbeddings({
      modelName: "embedding-001", // 768 dimensions
      taskType: TaskType.RETRIEVAL_DOCUMENT,
      apiKey: "AIzaSyBIPrsCFHX4jzEbqC1j0NyU7fO4iUL9LLQ",
    });
  };

  private convertDocsToString = (documents: Document[]): string => {
    return documents
      .map((document) => {
        return `<doc>\n${document.pageContent}\n</doc>`;
      })
      .join("\n");
  };
  public documentRetrievalChain = ({ retriever }: { retriever: any }) => {
    return RunnableSequence.from([
      (input: any) => input.question,
      retriever,
      this.convertDocsToString,
    ]);
  };

  // Data chunks into vector data
  public convertToVector = async ({
    splittedData,
  }: {
    splittedData: Document<Record<string, any>>[];
  }) => {
    // store in the memory
    const vectorstore = new MemoryVectorStore(this.getEmbeddngs());
    await vectorstore.addDocuments(splittedData);
    return vectorstore;
  };

  // all togather
  public getVectorizedData = async () => {
    const documents = await this.loadDocuments({});
    const splittedDocuments = await this.splitDocuments({
      data: documents,
      chunkSize: 1536,
      chunkOverlap: 128,
    });
    const vectorstore = await this.convertToVector({
      splittedData: splittedDocuments,
    });
    return vectorstore;
  };

  // private getCollection = async () => {
  //   const client = new ChromaClient();
  //   const collections = await client.listCollections();
  //   return collections.find(
  //     (collection) => collection.name === this.collectionName
  //   );
  // };

  public getVectorStore = async () => {
    const embeddings = this.getEmbeddngs();
    // const collection = await this.getCollection();

    // if (collection) {
    //   return await Chroma.fromExistingCollection(embeddings, {
    //     collectionName: this.collectionName,
    //   });
    // }

    // If does not exist our data, generate and store
    const fullpath = path.resolve("public/data");
    console.log("--------------path:", fullpath);
    console.log("--------------path2:", process.cwd() + "/public/data");
    const documents = await this.loadDocuments({
      path: fullpath,
    });
    const splittedDocuments = await this.splitDocuments({
      data: documents,
      chunkSize: 1536,
      chunkOverlap: 128,
    });

    const vectorstore = new MemoryVectorStore(embeddings);
    await vectorstore.addDocuments(splittedDocuments);
    return vectorstore;
    // return await Chroma.fromDocuments(splittedDocuments, embeddings, {
    //   collectionName: this.collectionName,
    //   url: this.url, // Optional, will default to this value
    //   collectionMetadata: {
    //     "hnsw:space": "stack9",
    //   }, // Optional, can be used to specify the distance method of the embedding space https://docs.trychroma.com/usage-guide#changing-the-distance-function
    // });
  };
}
