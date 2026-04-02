import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    let users;
    if (search && search.trim().length > 0) {
      users = await sql`
        SELECT p.id, p.user_id, p.username, p.avatar_url, p.status, p.last_seen
        FROM profiles p
        WHERE LOWER(p.username) LIKE LOWER(${"%" + search.trim() + "%"})
        ORDER BY p.username ASC
        LIMIT 50
      `;
    } else {
      users = await sql`
        SELECT p.id, p.user_id, p.username, p.avatar_url, p.status, p.last_seen
        FROM profiles p
        ORDER BY p.username ASC
        LIMIT 50
      `;
    }

    return Response.json({ users });
  } catch (err) {
    console.error("GET /api/users error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
