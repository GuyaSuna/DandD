import { prisma } from "@/lib/prisma";
import { forbidden, getCurrentUser, unauthorized } from "@/lib/session";

export const runtime = "nodejs";

async function getEditableNote(noteId, user) {
  const note = await prisma.characterDMNote.findUnique({
    where: { id: noteId },
    include: {
      campaign: { select: { id: true, dungeonMasterId: true } },
    },
  });

  if (!note) {
    return { error: Response.json({ error: "Nota no encontrada." }, { status: 404 }) };
  }

  if (note.campaign.dungeonMasterId !== user.id && user.role !== "ADMIN") {
    return { error: forbidden("Solo el DM dueno de la campana puede modificar esta nota.") };
  }

  return { note };
}

export async function PATCH(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;
  const body = await request.json();
  const content = body.content?.trim();

  if (!content) {
    return Response.json({ error: "El contenido de la nota es obligatorio." }, { status: 400 });
  }

  const { error } = await getEditableNote(id, user);

  if (error) {
    return error;
  }

  const note = await prisma.characterDMNote.update({
    where: { id },
    data: {
      title: body.title?.trim() || null,
      content,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return Response.json(note);
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;
  const { error } = await getEditableNote(id, user);

  if (error) {
    return error;
  }

  await prisma.characterDMNote.delete({
    where: { id },
  });

  return Response.json({ ok: true });
}
