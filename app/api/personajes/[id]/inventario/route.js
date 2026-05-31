import { getManageableCharacter } from "@/lib/dm";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/session";

export const runtime = "nodejs";

const itemTypes = ["WEAPON", "ARMOR", "POTION", "TOOL", "TREASURE", "DOCUMENT", "MAGIC", "OTHER"];
const itemRarities = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"];

function toQuantity(value) {
  const quantity = Number(value);
  return Number.isInteger(quantity) && quantity >= 1 ? quantity : 1;
}

function nullableFloat(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function nullableInt(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

export async function GET(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;
  const { error } = await getManageableCharacter(id, user);

  if (error) {
    return error;
  }

  const items = await prisma.inventoryItem.findMany({
    where: { characterId: id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ isEquipped: "desc" }, { createdAt: "desc" }],
  });

  return Response.json(items);
}

export async function POST(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;
  const body = await request.json();
  const name = body.name?.trim();

  if (!name) {
    return Response.json({ error: "El nombre del objeto es obligatorio." }, { status: 400 });
  }

  const { error } = await getManageableCharacter(id, user);

  if (error) {
    return error;
  }

  const item = await prisma.inventoryItem.create({
    data: {
      characterId: id,
      name,
      description: body.description?.trim() || null,
      quantity: toQuantity(body.quantity),
      type: itemTypes.includes(body.type) ? body.type : "OTHER",
      rarity: itemRarities.includes(body.rarity) ? body.rarity : "COMMON",
      isEquipped: Boolean(body.isEquipped),
      weight: nullableFloat(body.weight),
      value: nullableInt(body.value),
      createdById: user.id,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return Response.json(item, { status: 201 });
}
