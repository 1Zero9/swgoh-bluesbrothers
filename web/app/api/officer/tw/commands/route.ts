import { cookies } from "next/headers";
import { OFFICER_COOKIE_NAME, verifyOfficerSessionValue } from "@/lib/officer-auth";
import { getOfficerIdentity } from "@/lib/officer-identity";
import {
  createCommand,
  deleteCommand,
  ensureBuiltInCommands,
  getDefaultGuildId,
  listCommands,
  updateCommand,
} from "@/lib/tw-plans";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function isOfficerSession() {
  const store = await cookies();
  return verifyOfficerSessionValue(store.get(OFFICER_COOKIE_NAME)?.value);
}

export async function GET() {
  if (!(await isOfficerSession())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const guildId = await getDefaultGuildId();
    if (!guildId) return Response.json({ ok: true, commands: [] });
    await ensureBuiltInCommands(guildId);
    const commands = await listCommands(guildId);
    return Response.json({ ok: true, commands });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isOfficerSession())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as
    | { name?: string; squadKey?: string | null; kitNotes?: string | null }
    | null;
  if (!body?.name?.trim()) {
    return Response.json({ ok: false, error: "name is required" }, { status: 400 });
  }
  try {
    const guildId = await getDefaultGuildId();
    if (!guildId) return Response.json({ ok: false, error: "no guild on record" }, { status: 400 });
    const officer = await getOfficerIdentity();
    const command = await createCommand({
      guildId,
      name: body.name.trim(),
      squadKey: body.squadKey ?? null,
      kitNotes: body.kitNotes ?? null,
      createdBy: officer,
    });
    return Response.json({ ok: true, command });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isOfficerSession())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as
    | { id?: string; name?: string; squadKey?: string | null; kitNotes?: string | null }
    | null;
  if (!body?.id) {
    return Response.json({ ok: false, error: "id is required" }, { status: 400 });
  }
  try {
    const command = await updateCommand(body.id, {
      name: body.name,
      squadKey: body.squadKey,
      kitNotes: body.kitNotes,
    });
    return Response.json({ ok: true, command });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isOfficerSession())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id) {
    return Response.json({ ok: false, error: "id is required" }, { status: 400 });
  }
  try {
    await deleteCommand(body.id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}
