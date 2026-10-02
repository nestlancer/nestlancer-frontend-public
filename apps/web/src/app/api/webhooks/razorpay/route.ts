import { NextResponse } from 'next/server';

/**
 * Razorpay webhooks must hit the API gateway (HMAC-verified), not this Next.js app.
 * Never ACK success here — that would hide misconfigured webhook URLs.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Webhook receiver is the API gateway, not this app',
      hint: 'Configure Razorpay to POST to the gateway /api/v1/webhooks/razorpay endpoint',
    },
    { status: 501 }
  );
}

export async function GET() {
  return NextResponse.json(
    { error: 'Webhook receiver is the API gateway, not this app' },
    { status: 404 }
  );
}
