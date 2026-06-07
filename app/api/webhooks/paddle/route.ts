import { createHmac, timingSafeEqual } from "crypto";
import { clerkClient } from "@clerk/nextjs/server";

function verifySignature(rawBody: string, signatureHeader: string | null, secret: string) {
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(";").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );
  const timestamp = parts.ts;
  const signature = parts.h1;
  if (!timestamp || !signature) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}:${rawBody}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}

export async function POST(request: Request) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  const rawBody = await request.text();

  if (secret) {
    const signatureHeader = request.headers.get("paddle-signature");
    if (!verifySignature(rawBody, signatureHeader, secret)) {
      return new Response("Invalid signature", { status: 401 });
    }
  }

  const event = JSON.parse(rawBody) as {
    event_type: string;
    data: {
      custom_data?: { clerkUserId?: string } | null;
      status?: string;
    };
  };

  const clerkUserId = event.data?.custom_data?.clerkUserId;
  if (!clerkUserId) {
    return new Response("ok", { status: 200 });
  }

  const client = await clerkClient();

  const activatingEvents = ["subscription.created", "subscription.activated", "subscription.updated"];
  const deactivatingEvents = ["subscription.canceled", "subscription.paused"];

  if (activatingEvents.includes(event.event_type) && event.data.status !== "canceled") {
    await client.users.updateUserMetadata(clerkUserId, {
      publicMetadata: { premium: true },
    });
  } else if (deactivatingEvents.includes(event.event_type)) {
    await client.users.updateUserMetadata(clerkUserId, {
      publicMetadata: { premium: false },
    });
  }

  return new Response("ok", { status: 200 });
}
