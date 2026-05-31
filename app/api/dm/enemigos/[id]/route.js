import { prisma } from "@/lib/prisma";
import { forbidden, getCurrentUser, unauthorized } from "@/lib/session";

export const runtime = "nodejs";

function toInt(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

async function getEditableEnemy(enemyId, user) {
  const enemy = await prisma.enemy.findUnique({
    where: { id: enemyId },
    include: {
      campaign: { select: { id: true, dungeonMasterId: true } },
    },
  });

  if (!enemy) {
    return { error: Response.json({ error: "Enemigo no encontrado." }, { status: 404 }) };
  }

  if (enemy.campaign.dungeonMasterId !== user.id && user.role !== "ADMIN") {
    return { error: forbidden("Solo el DM dueno de la campana puede gestionar este enemigo.") };
  }

  return { enemy };
}

export async function GET(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;
  const { enemy, error } = await getEditableEnemy(id, user);

  if (error) {
    return error;
  }

  return Response.json(enemy);
}

export async function PATCH(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;
  const body = await request.json();
  const { enemy, error } = await getEditableEnemy(id, user);

  if (error) {
    return error;
  }

  const maxHp = body.maxHp === undefined ? enemy.maxHp : Math.max(1, toInt(body.maxHp, enemy.maxHp));
  const currentHp =
    body.currentHp === undefined
      ? Math.min(enemy.currentHp, maxHp)
      : Math.min(maxHp, Math.max(0, toInt(body.currentHp, enemy.currentHp)));

  const updatedEnemy = await prisma.enemy.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.description !== undefined ? { description: body.description?.trim() || null } : {}),
      maxHp,
      currentHp,
      ...(body.armorClass !== undefined ? { armorClass: Math.max(1, toInt(body.armorClass, enemy.armorClass)) } : {}),
      ...(body.strength !== undefined ? { strength: toInt(body.strength, enemy.strength) } : {}),
      ...(body.dexterity !== undefined ? { dexterity: toInt(body.dexterity, enemy.dexterity) } : {}),
      ...(body.constitution !== undefined ? { constitution: toInt(body.constitution, enemy.constitution) } : {}),
      ...(body.intelligence !== undefined ? { intelligence: toInt(body.intelligence, enemy.intelligence) } : {}),
      ...(body.wisdom !== undefined ? { wisdom: toInt(body.wisdom, enemy.wisdom) } : {}),
      ...(body.charisma !== undefined ? { charisma: toInt(body.charisma, enemy.charisma) } : {}),
      ...(body.attacks !== undefined ? { attacks: body.attacks || null } : {}),
      ...(body.notes !== undefined ? { notes: body.notes?.trim() || null } : {}),
    },
  });

  return Response.json(updatedEnemy);
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;
  const { error } = await getEditableEnemy(id, user);

  if (error) {
    return error;
  }

  await prisma.enemy.delete({
    where: { id },
  });

  return Response.json({ ok: true });
}
