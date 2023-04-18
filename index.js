import express from "express";
import { OpenAI } from "langchain/llms/openai";
import {RetrievalQAChain} from 'langchain/chains';
import {HNSWLib} from 'langchain/vectorstores';
import {OpenAIEmbeddings} from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter, TextSplitter } from "langchain/text_splitter";
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import cors from "cors";

const textFilePath = 'file.txt';
const fileContent = fs.readFileSync(textFilePath, 'utf-8');

const app = express();
dotenv.config();

app.use(express.json());


// Define route for receiving question data from frontend
app.use(cors());
app.post('/question', async (req, res) => {
  const question = req.body.question;  
  try {
    const answer = await generateAns(question); // Call the generateAns function with the question data
    res.send({ answer }); // Send the answer back to frontend
  } catch (error) {
    console.error('Failed to generate answer:', error);
    res.status(500).send({ error: 'Failed to generate answer' });
  }
});

const txtFileName = "file";
const txtPath = `./${txtFileName}.txt`;
const VECTOR_STORE_PATH = `${txtFileName}.index`;

export const generateAns = async (question)=>{
const model = new OpenAI({});
let vectorstore;
if(fs.existsSync(VECTOR_STORE_PATH)){
  console.log('Vector Exists');
  vectorstore =  await HNSWLib.load(VECTOR_STORE_PATH, new OpenAIEmbeddings());
}
else{
  const text = fs.readFileSync(txtPath,'utf-8');
  const text_splitter = new RecursiveCharacterTextSplitter({chunkSize: 1000});
  const docs = await text_splitter.createDocuments([text]);
  vectorstore = await HNSWLib.fromDocuments(docs,new OpenAIEmbeddings());
}
const chain = RetrievalQAChain.fromLLM(model,vectorstore.asRetriever());
const res = await chain.call({
    query : question,
})
return res.text;
}

app.listen(5000, () => {
    console.log('Server running on http://localhost:5000');
  });
