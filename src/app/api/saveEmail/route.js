import { NextResponse } from "next/server";

export async function POST(request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json(
      { success: false, error: "Email is required" },
      { status: 400 }
    );
  }

  const baseId = process.env.AIRTABLE_BASE_ID;
  const accessToken = process.env.AIRTABLE_ACCESS_TOKEN;
  const userTable = process.env.AIRTABLE_USER_TABLE;

  if (!baseId || !accessToken || !userTable) {
    return NextResponse.json(
      { success: false, error: "Server configuration error" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/${userTable}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            Email: email,
          },
        }),
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(
        `Error: ${response.statusText} - ${JSON.stringify(responseData)}`
      );
    }

    return NextResponse.json({ success: true, data: responseData });
  } catch (error) {
    console.error("Error creating Airtable record:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
