import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all rooms the user is a member of
    const rooms = await sql`
      SELECT r.id, r.name, r.description, r.avatar_url, r.created_at, r.created_by,
             (SELECT COUNT(*) FROM room_members WHERE room_id = r.id) as member_count
      FROM rooms r
      INNER JOIN room_members rm ON r.id = rm.room_id
      WHERE rm.user_id = ${userId}
      ORDER BY r.created_at DESC
    `;

    return Response.json({ rooms });
  } catch (err) {
    console.error("GET /api/rooms error", err);
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
    const { name, description, avatar_url } = body || {};

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return Response.json({ error: "Room name is required" }, { status: 400 });
    }

    // Create room
    const roomResult = await sql`
      INSERT INTO rooms (name, description, avatar_url, created_by)
      VALUES (${name.trim()}, ${description || null}, ${avatar_url || null}, ${userId})
      RETURNING id, name, description, avatar_url, created_at, created_by
    `;

    const room = roomResult[0];

    // Add creator as member
    await sql`
      INSERT INTO room_members (room_id, user_id)
      VALUES (${room.id}, ${userId})
    `;

    return Response.json({ room });
  } catch (err) {
    console.error("POST /api/rooms error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
