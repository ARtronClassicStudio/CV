import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const rows = await sql`
      SELECT id, user_id, username, avatar_url, bio, status, last_seen, created_at
      FROM profiles 
      WHERE user_id = ${userId} 
      LIMIT 1
    `;
    const profile = rows?.[0] || null;
    return Response.json({ profile });
  } catch (err) {
    console.error("GET /api/profile error", err);
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
    const { username, avatar_url, bio } = body || {};

    if (
      !username ||
      typeof username !== "string" ||
      username.trim().length === 0
    ) {
      return Response.json({ error: "Username is required" }, { status: 400 });
    }

    // Check if profile already exists
    const existing =
      await sql`SELECT id FROM profiles WHERE user_id = ${userId} LIMIT 1`;
    if (existing.length > 0) {
      return Response.json(
        { error: "Profile already exists" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO profiles (user_id, username, avatar_url, bio, status)
      VALUES (${userId}, ${username.trim()}, ${avatar_url || null}, ${bio || null}, 'online')
      RETURNING id, user_id, username, avatar_url, bio, status, last_seen, created_at
    `;

    return Response.json({ profile: result[0] });
  } catch (err) {
    console.error("POST /api/profile error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { username, avatar_url, bio, status } = body || {};

    const setClauses = [];
    const values = [];
    let paramCount = 1;

    if (typeof username === "string" && username.trim().length > 0) {
      setClauses.push(`username = $${paramCount++}`);
      values.push(username.trim());
    }

    if (avatar_url !== undefined) {
      setClauses.push(`avatar_url = $${paramCount++}`);
      values.push(avatar_url);
    }

    if (bio !== undefined) {
      setClauses.push(`bio = $${paramCount++}`);
      values.push(bio);
    }

    if (typeof status === "string") {
      setClauses.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (setClauses.length === 0) {
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const query = `
      UPDATE profiles 
      SET ${setClauses.join(", ")}, last_seen = NOW()
      WHERE user_id = $${paramCount}
      RETURNING id, user_id, username, avatar_url, bio, status, last_seen, created_at
    `;

    const result = await sql(query, [...values, userId]);
    const updated = result?.[0] || null;

    return Response.json({ profile: updated });
  } catch (err) {
    console.error("PUT /api/profile error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
