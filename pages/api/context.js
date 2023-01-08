export default function handler(req, res) {
  res.status(200).json({ text: "Hello" });
}

// const configuration = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY,
// });
// const openai = new OpenAIApi(configuration);
// const pinecone = new PineconeClient({
//   apiKey: process.env.PINECONE_API_KEY,
//   baseUrl: "ubc-b9ec628.svc.us-west1-gcp.pinecone.io",
// });

// @Injectable()
// export class AppService {
//   // given question get context
//   async getContext(
//     question: string
//   ): Promise<{ context: string, links: string[] }> {
//     const question_token_est = question.length / 4;
//     // check how long the question is throw error if too long, measured in tokens, da vinci limit is 4096 tokens, ideally we wouldnt wanna go above 3500 token questions
//     if (question_token_est > 3500) {
//       throw new Error(
//         "Question is too long, in order to get better results try a shorter question"
//       );
//     }

//     const links = [];

//     let prompt = "Context:\n";
//     let token_est = question_token_est + 10;

//     // for a question get the context
//     const res = await openai.createEmbedding({
//       model: "text-embedding-ada-002",
//       input: question,
//     });
//     const embedding = res["data"][0]["embedding"];

//     // get top 5 most relevant info from pinceone
//     const context = await pinecone.query({
//       topK: 5,
//       vector: embedding,
//       includeMetadata: true,
//     });
//     const matches = context["matches"];
//     for (const match of matches) {
//       const metadata = match["metadata"];
//       const link = metadata["link"];
//       const data = metadata["data"];
//       // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//       // @ts-ignore
//       const data_token_est = data.length / 4;
//       if (token_est + data_token_est > 3500) {
//         break;
//       }
//       prompt += data + "\n";
//       token_est += data_token_est;
//       links.push(link);
//     }

//     prompt += "\nQuestion:\n" + question + "\nAnswer:\n";
//     return { context: prompt, links };
//   }
// }
