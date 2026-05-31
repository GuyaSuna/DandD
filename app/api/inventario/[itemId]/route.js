import { getManageableCharacter } from "@/lib/dm";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/session";

export const runtime = "nodejs";

const itemTypes = ["WEAPON", "ARMOR", "POTION", "TOOL", "TREASURE", "DOCUMENT", "MAGIC", "OTHER"];
const itemRarities = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"];

function quantityPatch(value) {
  if (value === undefined) {
    return undefined;
  }

  const quantity = Number(value);
  return Number.isInteger(quantity) && quantity >= 1 ? quantity : null;
}

function nullableFloatPatch(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function nullableIntPatch(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

async function getItemWithPermission(itemId, user) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId },
    include: {
      character: {
        include: {
          campaign: { select: { id: true, dungeonMasterId: true } },
        },
      },
    },
  });

  if (!item) {
    return { error: Response.json({ error: "Objeto no encontrado." }, { status: 404 }) };
  }

  const { error } = await getManageableCharacter(item.characterId, user);

  if (error) {
    return { error };
  }

  return { item };
}

export async function PATCH(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const { itemId } = await params;
  const body = await request.json();
  const { error } = await getItemWithPermission(itemId, user);

  if (error) {
    return error;
  }

  const quantity = quantityPatch(body.quantity);
  const weight = nullableFloatPatch(body.weight);
  const value = nullableIntPatch(body.value);

  if (quantity === null) {
    return Response.json({ error: "La cantidad debe ser un numero entero mayor o igual a 1." }, { status: 400 });
  }

  if (weight === null && body.weight !== undefined && body.weight !== null && body.weight !== "") {
    return Response.json({ error: "El peso debe ser numerico." }, { status: 400 });
  }

  if (value === null && body.value !== undefined && body.value !== null && body.value !== "") {
    return Response.json({ error: "El valor debe ser un numero entero." }, { status: 400 });
  }

  const data = {
    ...(body.name !== undefined ? { name: body.name.trim() } : {}),
    ...(body.description !== undefined ? { description: body.description?.trim() || null } : {}),
    ...(quantity !== undefined ? { quantity } : {}),
    ...(itemTypes.includes(body.type) ? { type: body.type } : {}),
    ...(itemRarities.includes(body.rarity) ? { rarity: body.rarity } : {}),
    ...(body.isEquipped !== undefined ? { isEquipped: Boolean(body.isEquipped) } : {}),
    ...(weight !== undefined ? { weight } : {}),
    ...(value !== undefined ? { value } : {}),
  };

  if (data.name !== undefined && !data.name) {
    return Response.json({ error: "El nombre del objeto es obligatorio." }, { status: 400 });
  }

  const item = await prisma.inventoryItem.update({
    where: { id: itemId },
    data,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return Response.json(item);
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const { itemId } = await params;
  const { error } = await getItemWithPermission(itemId, user);

  if (error) {
    return error;
  }

  await prisma.inventoryItem.delete({
    where: { id: itemId },
  });

  return Response.json({ ok: true });
}
