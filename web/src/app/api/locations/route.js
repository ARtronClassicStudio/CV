import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const locations = await sql`
      SELECT id, name, description, created_at
      FROM locations
      ORDER BY name ASC
    `;

    // Get user's current location
    const userId = session.user.id;
    const userLocation = await sql`
      SELECT location_id 
      FROM user_locations 
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    return Response.json({
      locations,
      currentLocation: userLocation[0]?.location_id || null,
    });
  } catch (err) {
    console.error("GET /api/locations error", err);
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
    const { location_id } = body || {};

    if (!location_id) {
      return Response.json(
        { error: "location_id is required" },
        { status: 400 },
      );
    }

    // Remove existing location
    await sql`DELETE FROM user_locations WHERE user_id = ${userId}`;

    // Add new location
    await sql`
      INSERT INTO user_locations (user_id, location_id)
      VALUES (${userId}, ${location_id})
    `;

    return Response.json({ message: "Location updated successfully" });
  } catch (err) {
    console.error("POST /api/locations error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
