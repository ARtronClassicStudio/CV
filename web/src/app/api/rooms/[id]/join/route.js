import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const roomId = params.id;

    // Check if room exists
    const roomCheck =
      await sql`SELECT id FROM rooms WHERE id = ${roomId} LIMIT 1`;
    if (roomCheck.length === 0) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if already a member
    const memberCheck = await sql`
      SELECT id FROM room_members 
      WHERE room_id = ${roomId} AND user_id = ${userId} 
      LIMIT 1
    `;

    if (memberCheck.length > 0) {
      return Response.json({ message: "Already a member" });
    }

    // Add user as member
    await sql`
      INSERT INTO room_members (room_id, user_id)
      VALUES (${roomId}, ${userId})
    `;

    return Response.json({ message: "Joined room successfully" });
  } catch (err) {
    console.error("POST /api/rooms/[id]/join error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
