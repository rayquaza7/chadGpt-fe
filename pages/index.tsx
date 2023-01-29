import { notes } from "@prisma/client";
import axios from "axios";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

export type Message = {
  who: "bot" | "user";
  message: string;
};

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<notes[]>([]);
  const inputFileRef = useRef<HTMLInputElement | null>(null);

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

  const deleteNoteById = async (id: number) => {
    const response = await fetch("/api/notes", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: id,
      }),
    });
    const data = await response.json();
    alert(data.message);
    getNotes();
  };

  const handleOnClick = async (e: React.MouseEvent<HTMLInputElement>) => {
    /* Prevent form from submitting by default */
    e.preventDefault();

    /* If file is not selected, then show alert message */
    if (!inputFileRef.current?.files?.length) {
      alert("Please, select file you want to upload");
      return;
    }

    setLoading(true);
    /* Add files to FormData */
    const formData = new FormData();
    formData.append("file", inputFileRef.current.files[0]);
    formData.append("email", session?.user!.email || "");

    /* Send request to our api route */
    let response = await axios.post("http://127.0.0.1:5000/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    const body = response.data;
    // data has questions, status and transcript if audio
    let res = await fetch("/api/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        questions: body.questions,
        transcription: body.transcription,
        title: inputFileRef.current.files[0].name,
      }),
    });
    inputFileRef.current.value = "";
    setLoading(false);
  };

  const getNotes = async () => {
    const response = await fetch("/api/notes", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    setNotes(data);
  };

  const getTranscription = async (note: notes) => {
    setMessages([
      ...messages,
      {
        message: "Transcription for " + note.title + ":\n" + note.transcription,
        who: "bot",
      } as Message,
    ]);
  };

  if (status === "authenticated") {
    return (
      <>
        <div>
          {messages.map(({ message, who }, index) => (
            <p key={index}>
              {who}: {message}
            </p>
          ))}
        </div>
        <div>
          <input
            type="text"
            placeholder="Type your question here..."
            required
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
        <div>
          <h2>Notes management:</h2>
          <form>
            <div>
              <input type="file" name="myfile" ref={inputFileRef} />
              <input
                type="submit"
                value="Upload"
                disabled={loading}
                onClick={handleOnClick}
                accept=".wav, .pdf, .mp3"
              />
              {loading && `Uploading...`}
            </div>
          </form>
          <button onClick={() => getNotes()}>Get notes</button>
          <div>
            {notes.map((note, index) => (
              <p key={index}>
                {note.title}
                <button onClick={() => deleteNoteById(note.id)}>Delete</button>
                {note.transcription && (
                  <button onClick={() => getTranscription(note)}>
                    Export transcription
                  </button>
                )}
              </p>
            ))}
          </div>
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
      <ul>
        <li>
          Upload a .wav, .mp3 or .pdf file to get started. The file will be
          converted to text and you will be able to ask questions about the
          content.
        </li>
        <li>
          The bot can also ask you questions about the content of the files and
          will evaluate your answer and give you feedback.
        </li>
      </ul>
      <button onClick={() => signIn()}>Sign in</button>
    </>
  );
}

export default Chat;
