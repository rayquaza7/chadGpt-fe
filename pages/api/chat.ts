import { PrismaClient } from "@prisma/client";
import { unstable_getServerSession } from "next-auth";
import { Configuration, OpenAIApi } from "openai";
import { PineconeClient } from "pinecone-client";
import { authOptions } from "./auth/[...nextauth]";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

export const openai = new OpenAIApi(configuration);

export const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  const session = await unstable_getServerSession(req, res, authOptions);

  // if no session then return 401
  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    res.end();
  }
  const pinecone = new PineconeClient({
    apiKey: process.env.PINECONE_API_KEY,
    baseUrl: process.env.PINECONE_BASE_URL,
    namespace: session!.user!.email || "",
  });

  const prevUserQuestion = req.body.prevUserQuestion;
  const prevBotAnswer = req.body.prevBotAnswer;
  const question = req.body.message;
  let prompt = "";

  if (question == "ask me") {
    // get all notes for a user
    const notes = await prisma.notes.findMany({
      where: {
        email: session!.user!.email || "",
      },
    });
    // get all questions from all notes
    let questions: string[] = [];
    for (const note of notes) {
      questions = questions.concat(note.questions);
    }
    // get random question
    const random_id = Math.floor(Math.random() * questions.length);
    const random_question = questions[random_id];
    res.status(200).json({ text: random_question });
    res.end();
  } else if (prevUserQuestion == "ask me") {
    prompt =
      "Question:\n" +
      prevBotAnswer +
      "\nAnswer:\n" +
      prevUserQuestion +
      "\n\nevaluate the answer based on the context. Give the correct answer in your feedback. Feedback:\n";
    // get embedding for the question
    const openaiembedding = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: prevBotAnswer,
    });
    const embedding = openaiembedding["data"]["data"][0]["embedding"];
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
