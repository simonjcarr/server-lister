'use server'
import { db } from "@/db";
import { notes, serverNotes, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/auth";

export async function getServerNotes(serverId: number) {
  try {
    const notesResult = await db
      .select({
        id: serverNotes.id,
        note: notes.note,
        createdAt: serverNotes.createdAt,
        updatedAt: serverNotes.updatedAt,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        serverId: serverNotes.serverId,
      })
      .from(serverNotes)
      .where(eq(serverNotes.serverId, serverId))
      .leftJoin(notes, eq(serverNotes.noteId, notes.id))
      .leftJoin(users, eq(notes.userId, users.id))
      .orderBy(desc(notes.createdAt));
    return notesResult;
  } catch (error) {
    console.error("Error getting server notes:", error);
    return [];
  }
}

export async function getNoteById(noteId: number) {
  try {
    const noteResult = await db
      .select({
        id: notes.id,
        note: notes.note,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        serverId: serverNotes.serverId,
      })
      .from(notes)
      .where(eq(notes.id, noteId))
      .leftJoin(users, eq(notes.userId, users.id))
      .leftJoin(serverNotes, eq(notes.id, serverNotes.noteId))
      .limit(1);
    return noteResult[0];
  } catch (error) {
    console.error("Error getting note by id:", error);
    return null;
  }
}

export async function addServerNote(
  note: string,
  serverId: number
) {
  try {
    const session = await auth();
    console.log(session)
    const userId = session?.user.id;
    if (!userId) {
      throw new Error("Unauthorized");
    }
    // Create the note
    const noteResult = await db
      .insert(notes)
      .values({
        userId,
        note,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Create the server note
    await db.insert(serverNotes).values({
      noteId: noteResult[0].id,
      serverId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Return the created note
    const createdNote = await getNoteById(noteResult[0].id);
    return createdNote;
  } catch (error) {
    console.error("Error adding server note:", error);
    throw new Error("Failed to create server note: " + error);
  }
}

export async function updateServerNote(noteId: number, note: string) {
  try {
    await db
      .update(notes)
      .set({
        note,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, noteId));
    return await getNoteById(noteId);
  } catch (error) {
    console.error("Error updating server note:", error);
    throw new Error("Failed to update server note: " + error);
  }
}

export async function deleteServerNote(noteId: number) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }
  const userId = session.user.id;
  if (!userId) {
    throw new Error("Unauthorized");
  }
  try {
    await db.delete(notes).where(and(eq(notes.id, noteId), eq(notes.userId, userId)));
    return { success: true };
  } catch (error) {
    console.error("Error deleting server note:", error);
    throw new Error("Failed to delete server note: " + error);
  }
}
