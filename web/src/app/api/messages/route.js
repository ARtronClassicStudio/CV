import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("room_id");

    if (!roomId) {
      return Response.json({ error: "room_id is required" }, { status: 400 });
    }

    // Get messages with user profile info
    const messages = await sql`
      SELECT m.id, m.room_id, m.user_id, m.content, m.message_type, 
             m.file_url, m.file_name, m.created_at,
             p.username, p.avatar_url
      FROM messages m
      LEFT JOIN profiles p ON m.user_id = p.user_id
      WHERE m.room_id = ${roomId}
      ORDER BY m.created_at ASC
    `;

    return Response.json({ messages });
  } catch (err) {
    console.error("GET /api/messages error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { room_id, content, message_type, file_url, file_name } = body || {};

    if (!room_id) {
      return Response.json({ error: "room_id is required" }, { status: 400 });
    }

    if (!content && !file_url) {
      return Response.json(
        { error: "content or file_url is required" },
        { status: 400 },
      );
    }

    // Verify user is a member of the room
    const memberCheck = await sql`
      SELECT id FROM room_members 
      WHERE room_id = ${room_id} AND user_id = ${userId} 
      LIMIT 1
    `;

    if (memberCheck.length === 0) {
      return Response.json(
        { error: "Not a member of this room" },
        { status: 403 },
      );
    }

    const result = await sql`
      INSERT INTO messages (room_id, user_id, content, message_type, file_url, file_name)
      VALUES (${room_id}, ${userId}, ${content || null}, ${message_type || "text"}, ${file_url || null}, ${file_name || null})
      RETURNING id, room_id, user_id, content, message_type, file_url, file_name, created_at
    `;

    return Response.json({ message: result[0] });
  } catch (err) {
    console.error("POST /api/messages error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
