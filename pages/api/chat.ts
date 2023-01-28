import { PrismaClient } from "@prisma/client";
import { Configuration, OpenAIApi } from "openai";
import { PineconeClient } from "pinecone-client";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);
const pinecone = new PineconeClient({
  apiKey: process.env.PINECONE_API_KEY,
  baseUrl: process.env.PINECONE_BASE_URL,
});
const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  const prevUserQuestion = req.body.prevUserQuestion;
  const prevBotAnswer = req.body.prevBotAnswer;
  const question = req.body.message;
  let prompt = "";

  if (question == "ask me") {
    // select random id from the questions table
    const random_id = await prisma.questions.aggregate({
      _count: {
        id: true,
      },
    });
    const random_id_int = Math.floor(Math.random() * random_id._count.id);
    const random_question = await prisma.questions.findFirst({
      skip: random_id_int,
    });
    res.status(200).json({ text: random_question?.data });
    return;
  } else if (prevUserQuestion == "ask me") {
    prompt =
      "Question:\n" +
      prevBotAnswer +
      "\nAnswer:\n" +
      prevUserQuestion +
      "\n\nGive constructive feedback and evaluate the answer.\n";
    // get embedding for the question
    const res_pinecone = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: prevBotAnswer,
    });
    const embedding = res_pinecone["data"]["data"][0]["embedding"];
    // get top 10 most relevant info from pinceone
    const relevant = await pinecone.query({
      topK: 10,
      vector: embedding,
      includeMetadata: true,
    });
    const matches = relevant["matches"];
    let context = "Context:\n";
    for (const match of matches) {
      const contextTokenLen = context.length / 4;
      const metadata = match["metadata"];
      const data = metadata["data"];
      // @ts-ignore
      const data_token_est = data.length / 4;
      if (contextTokenLen + data_token_est > 3500) {
        break;
      }
      context += data;
    }
    prompt = context + "\n" + prompt;
  } else {
    prompt = "Question:\n" + question + "\nAnswer:";
    // get embedding for the question
    const res_pinecone = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: question,
    });
    const embedding = res_pinecone["data"]["data"][0]["embedding"];
    // get top 10 most relevant info from pinceone
    const relevant = await pinecone.query({
      topK: 10,
      vector: embedding,
      includeMetadata: true,
    });
    const matches = relevant["matches"];
    let context = "Context:\n";
    for (const match of matches) {
      const contextTokenLen = context.length / 4;
      const metadata = match["metadata"];
      const data = metadata["data"];
      // @ts-ignore
      const data_token_est = data.length / 4;
      if (contextTokenLen + data_token_est > 3500) {
        break;
      }
      context += data;
    }
    prompt = context + "\n" + prompt;
  }

  let token_est = prompt.length / 4;
  // ask openai to generate an answer
  const res_openai = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt,
    max_tokens: Math.floor(4096 - token_est),
    temperature: 0.3,
  });
  res.status(200).json({ text: res_openai.data.choices[0].text });
}
