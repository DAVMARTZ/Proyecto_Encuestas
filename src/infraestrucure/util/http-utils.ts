import type { Response } from "express";

const MAX_INT = 2147483647; // Máximo de la columna INTEGER en PostgreSQL

const NOT_FOUND_MESSAGES = /no encontrad[ao]|no existe/;
const CONFLICT_MESSAGES = /ya está registrado|ya está en uso|ya se encuentra registrado|Ya existe|Ya respondiste/;

/**
 * Convierte un parámetro de la URL en ID. Devuelve null si no es un entero positivo válido.
 */
export function parseId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value) || Number(value) > MAX_INT) {
    return null;
  }
  return Number(value);
}

/**
 * Responde cualquier error en el formato único de la API: { error: "mensaje" }
 */
export function sendError(res: Response, error: unknown): Response {
  // Los errores de negocio y de validación se lanzan siempre con new Error(...)
  if (error instanceof Error && error.constructor === Error) {
    let status = 400;
    if (NOT_FOUND_MESSAGES.test(error.message)) status = 404;
    if (CONFLICT_MESSAGES.test(error.message)) status = 409;
    return res.status(status).json({ error: error.message });
  }

  // Errores de PostgreSQL: nunca se envía su mensaje original al cliente
  const dbCode = (error as any)?.driverError?.code ?? (error as any)?.code;
  if (dbCode === "23505") {
    return res.status(409).json({ error: "El registro ya existe" });
  }
  if (dbCode === "23503" || dbCode === "23514" || dbCode === "22003" || dbCode === "22001" || dbCode === "22021") {
    return res.status(400).json({ error: "Los datos enviados no son válidos" });
  }

  // Solo el mensaje: el error completo incluye los datos de la consulta
  console.error("Error interno:", (error as Error)?.message, dbCode ?? "");
  return res.status(500).json({ error: "Error interno del servidor" });
}
