import { cookies } from "next/headers";
import { OFFICER_COOKIE_NAME, verifyOfficerSessionValue } from "@/lib/officer-auth";
import {
  createTemplate,
  deleteTemplate,
  getDefaultGuildId,
  listTemplates,
  setPlanTemplate,
  updateTemplate,
} from "@/lib/tw-plans";
import { isStrategyTemplateRules } from "@/lib/tw-planning-engine";

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
    if (!guildId) return Response.json({ ok: true, templates: [] });
    const templates = await listTemplates(guildId);
    return Response.json({ ok: true, templates });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isOfficerSession())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as
    | { name?: string; description?: string | null; rules?: unknown }
    | null;
  if (!body?.name?.trim()) {
    return Response.json({ ok: false, error: "name is required" }, { status: 400 });
  }
  if (body.rules !== undefined && !isStrategyTemplateRules(body.rules)) {
    return Response.json({ ok: false, error: "invalid rules shape" }, { status: 400 });
  }
  try {
    const guildId = await getDefaultGuildId();
    if (!guildId) return Response.json({ ok: false, error: "no guild on record" }, { status: 400 });
    const template = await createTemplate({
      guildId,
      name: body.name.trim(),
      description: body.description ?? null,
      rules: body.rules ?? {},
    });
    return Response.json({ ok: true, template });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isOfficerSession())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as
    | { id?: string; name?: string; description?: string | null; rules?: unknown; planId?: string; templateId?: string | null }
    | null;
  if (!body) {
    return Response.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  if (body.planId !== undefined) {
    try {
      const plan = await setPlanTemplate(body.planId, body.templateId ?? null);
      return Response.json({ ok: true, plan });
    } catch (error) {
      return Response.json({ ok: false, error: error instanceof Error ? error.message : "failed" }, { status: 500 });
    }
  }

  if (!body.id) {
    return Response.json({ ok: false, error: "id is required" }, { status: 400 });
  }
  if (body.rules !== undefined && !isStrategyTemplateRules(body.rules)) {
    return Response.json({ ok: false, error: "invalid rules shape" }, { status: 400 });
  }
  try {
    const template = await updateTemplate(body.id, {
      name: body.name,
      description: body.description,
      rules: body.rules,
    });
    return Response.json({ ok: true, template });
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
    await deleteTemplate(body.id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}
