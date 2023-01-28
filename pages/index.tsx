import { useSession, signOut, signIn } from "next-auth/react";
import { useState } from "react";

export type Message = {
  who: "bot" | "user";
  message: string;
};

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const { data: session, status } = useSession();

  // send message to API /api/chat endpoint
  const sendMessage = async (message: string) => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        prevBotAnswer: messages[messages.length - 1]?.message,
        prevUserQuestion: messages[messages.length - 2]?.message,
      }),
    });
    const data = await response.json();
    // strip out white spaces from the bot messge
    const botNewMessage = data.text.trim();

    setMessages([
      ...messages,
      { message: message, who: "user" } as Message,
      { message: botNewMessage, who: "bot" } as Message,
    ]);
    setInput("");
  };

  if (status === "authenticated") {
    return (
      <>
        <div>
          <ul>
            {messages.map(({ message, who }, index) => (
              <li key={index}>
                <p>
                  {who}: {message}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 flex clear-both">
          <input
            type="text"
            aria-label="chat input"
            required
            className="w-full border border-gray-300 rounded-md py-2 px-4"
            value={input}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage(input);
              }
            }}
            onChange={(e) => {
              setInput(e.target.value);
            }}
          />
          <button
            type="submit"
            onClick={() => {
              sendMessage(input);
            }}
          >
            Send
          </button>
        </div>
        <button onClick={() => signOut()}>Sign out</button>
      </>
    );
  }

  if (status === "loading") {
    return <p>Hang on there...</p>;
  }

  return (
    <>
      <button onClick={() => signIn()}>Sign in</button>
    </>
  );
}

export default Chat;
