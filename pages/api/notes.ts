import { PrismaClient } from "@prisma/client";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req: any, res: any) {
  const prisma = new PrismaClient();
  const session = await unstable_getServerSession(req, res, authOptions);

  // if no session then return 401
  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    res.end();
  }

  // if get then return all notes
  if (req.method === "GET") {
    const notes = await prisma.notes.findMany({
      where: {
        email: session!.user!.email || "",
      },
    });
    res.status(200).json(notes);
    res.end();
  } else if (req.method === "POST") {
    // add new note, req body will have list of questions and transcript if we are adding audio file and title
    const { title, questions, transcription } = req.body;
    console.log(title, questions, transcription);
    if (transcription) {
      await prisma.notes.create({
        data: {
          title,
          questions,
          transcription,
          email: session!.user!.email || "",
        },
      });
    } else {
      await prisma.notes.create({
        data: {
          title,
          questions,
          email: session!.user!.email || "",
        },
      });
    }
  } else if (req.method === "DELETE") {
    // delete note, req body will have id of note
    const { id } = req.body;
    await prisma.notes.delete({
      where: {
        id,
      },
    });
  }

  res.status(200).json({ message: "success" });
}
