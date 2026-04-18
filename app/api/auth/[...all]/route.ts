import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const dynamic = "force-dynamic";

const handlers = toNextJsHandler(auth);

export async function GET(request: NextRequest) {
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  return handlers.POST(request);
}

export async function PATCH(request: NextRequest) {
  return handlers.PATCH(request);
}

export async function PUT(request: NextRequest) {
  return handlers.PUT(request);
}

export async function DELETE(request: NextRequest) {
  return handlers.DELETE(request);
}
