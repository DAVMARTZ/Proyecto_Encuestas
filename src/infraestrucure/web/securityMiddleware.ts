import type { Request, Response, NextFunction } from "express";

const VENTANA_MS = 60 * 1000;
const peticiones = new Map<string, { total: number; reinicio: number }>();

// Libera la memoria de las IP que ya no están haciendo peticiones
setInterval(() => {
    const ahora = Date.now();
    for (const [ip, registro] of peticiones) {
        if (registro.reinicio <= ahora) peticiones.delete(ip);
    }
}, VENTANA_MS).unref();

/**
 * Cabeceras de seguridad para las respuestas de la API.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.setHeader("Cache-Control", "no-store");
    next();
}

/**
 * Limita la cantidad de peticiones por IP en cada minuto.
 */
export function rateLimit(maximo: number) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const ahora = Date.now();
        const ip = req.ip ?? "desconocida";
        let registro = peticiones.get(ip);

        if (!registro || registro.reinicio <= ahora) {
            registro = { total: 0, reinicio: ahora + VENTANA_MS };
            peticiones.set(ip, registro);
        }

        registro.total++;
        if (registro.total > maximo) {
            res.setHeader("Retry-After", Math.ceil((registro.reinicio - ahora) / 1000));
            res.status(429).json({ error: "Demasiadas peticiones. Intenta de nuevo en un momento." });
            return;
        }

        next();
    };
}

/**
 * Rechaza cuerpos con bytes nulos, que PostgreSQL no puede almacenar.
 * Revisa el texto recibido antes de interpretarlo, por lo que sirve con cualquier estructura.
 */
export function rejectNullBytes(_req: Request, _res: Response, cuerpo: Buffer): void {
    if (cuerpo.includes("\\u0000")) {
        throw new Error("Cuerpo con bytes nulos");
    }
}
