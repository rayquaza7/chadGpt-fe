import { Configuration, OpenAIApi } from "openai";
import { PineconeClient } from "pinecone-client";
import { initialMessages } from "../../components/Chat";
import { type Message } from "../../components/ChatLine";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const pinecone = new PineconeClient({
  apiKey: process.env.PINECONE_API_KEY,
  baseUrl: process.env.PINECONE_BASE_URL,
});

export default async function handler(req: any, res: any) {
  const message = req.body.message;
  const question_token_est = message.length / 4;
  // check how long the question is throw error if too long, measured in tokens, da vinci limit is 4096 tokens, ideally we wouldnt wanna go above 3500 token questions
  if (question_token_est > 3500) {
    throw new Error(
      "Question is too long, in order to get better results try a shorter question"
    );
  }

  let prompt = "Context:\n";
  let token_est = question_token_est + 10;

  // for a question get the context
  const res_pinecone = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input: message,
  });
  const embedding = res_pinecone["data"]["data"][0]["embedding"];

  // get top 5 most relevant info from pinceone
  const context = await pinecone.query({
    topK: 5,
    vector: embedding,
    includeMetadata: true,
  });
  const matches = context["matches"];
  for (const match of matches) {
    const metadata = match["metadata"];
    const data = metadata["data"];
    // @ts-ignore
    const data_token_est = data.length / 4;
    if (token_est + data_token_est > 3500) {
      break;
    }
    prompt += data + "\n";
    token_est += data_token_est;
  }

  prompt += "\nQuestion:\n" + message + "\nAnswer:\n";
  // ask openai to generate an answer
  const res_openai = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt,
    max_tokens: Math.floor(4096 - token_est),
    temperature: 0.3,
  });
  res.status(200).json({ text: res_openai.data.choices[0].text });
}
