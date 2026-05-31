import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const validRoles = ["PLAYER", "DUNGEON_MASTER"];

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json();
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const role = validRoles.includes(body.role) ? body.role : "PLAYER";

  if (!name || !email || !password) {
    return Response.json({ error: "Nombre, email y password son obligatorios." }, { status: 400 });
  }

  if (password.length < 6) {
    return Response.json({ error: "El password debe tener al menos 6 caracteres." }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return Response.json({ error: "Ya existe un usuario con ese email." }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return Response.json(user, { status: 201 });
}
