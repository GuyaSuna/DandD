import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

export function unauthorized(message = "Tenes que iniciar sesion.") {
  return Response.json({ error: message }, { status: 401 });
}

export function forbidden(message = "No tenes permisos para esta accion.") {
  return Response.json({ error: message }, { status: 403 });
}
