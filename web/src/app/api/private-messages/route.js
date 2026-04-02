import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get("other_user_id");

    if (!otherUserId) {
      return Response.json(
        { error: "other_user_id is required" },
        { status: 400 },
      );
    }

    // Get private messages between two users
    const messages = await sql`
      SELECT pm.id, pm.sender_id, pm.receiver_id, pm.content, pm.message_type,
             pm.file_url, pm.file_name, pm.is_read, pm.created_at,
             p.username as sender_username, p.avatar_url as sender_avatar
      FROM private_messages pm
      LEFT JOIN profiles p ON pm.sender_id = p.user_id
      WHERE (pm.sender_id = ${userId} AND pm.receiver_id = ${otherUserId})
         OR (pm.sender_id = ${otherUserId} AND pm.receiver_id = ${userId})
      ORDER BY pm.created_at ASC
    `;

    // Mark messages as read
    await sql`
      UPDATE private_messages 
      SET is_read = true 
      WHERE receiver_id = ${userId} AND sender_id = ${otherUserId} AND is_read = false
    `;

    return Response.json({ messages });
  } catch (err) {
    console.error("GET /api/private-messages error", err);
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
    const { receiver_id, content, message_type, file_url, file_name } =
      body || {};

    if (!receiver_id) {
      return Response.json(
        { error: "receiver_id is required" },
        { status: 400 },
      );
    }

    if (!content && !file_url) {
      return Response.json(
        { error: "content or file_url is required" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO private_messages (sender_id, receiver_id, content, message_type, file_url, file_name)
      VALUES (${userId}, ${receiver_id}, ${content || null}, ${message_type || "text"}, ${file_url || null}, ${file_name || null})
      RETURNING id, sender_id, receiver_id, content, message_type, file_url, file_name, is_read, created_at
    `;

    return Response.json({ message: result[0] });
  } catch (err) {
    console.error("POST /api/private-messages error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
