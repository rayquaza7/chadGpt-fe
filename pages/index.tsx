import { Page, Text } from "@vercel/examples-ui";
import { Chat } from "../components/Chat";

function Home() {
  return (
    <Page className="flex flex-col gap-12">
      <section className="flex flex-col gap-6">
        <Text variant="h1">ChatGpt but it knows everything about UBC!</Text>
        <Text className="text-zinc-600">
          Ask it any question about UBC: courses, professors, clubs, etc.
        </Text>
        <div>
          <Chat />
        </div>
      </section>
    </Page>
  );
}

export default Home;
