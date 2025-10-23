import { NextResponse } from "next/server";

const TOKEN_ENDPOINT = "https://www.figma.com/api/oauth/token";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.json(
      { error: "Missing `code` parameter from Figma OAuth redirect." },
      { status: 400 },
    );
  }

  const clientId = process.env.FIGMA_CLIENT_ID;
  const clientSecret = process.env.FIGMA_CLIENT_SECRET;
  const redirectUri = process.env.FIGMA_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      {
        error:
          "Missing env configuration. Set FIGMA_CLIENT_ID, FIGMA_CLIENT_SECRET, and FIGMA_REDIRECT_URI in .env.local.",
      },
      { status: 500 },
    );
  }

  try {
    const tokenResponse = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
        grant_type: "authorization_code",
      }),
    });

    const tokenPayload = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return NextResponse.json(
        {
          error: "Failed to exchange authorization code.",
          details: tokenPayload,
        },
        { status: tokenResponse.status },
      );
    }

    return NextResponse.json({
      receivedState: state,
      ...tokenPayload,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unexpected error while exchanging authorization code.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
