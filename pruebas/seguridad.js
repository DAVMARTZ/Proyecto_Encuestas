/**
 * Pruebas de seguridad de la API (ataques reales por HTTP).
 *
 * Solo se ejecutan contra servicios locales de prueba: la API, el emulador de
 * Firebase y una base cuyo nombre contenga "prueba" o "test".
 * Cómo ejecutarlas: ver SEGURIDAD.md.
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const API = process.env.API_URL || "http://127.0.0.1:3000/api";
const EMULATOR = process.env.AUTH_EMULATOR_URL || "http://127.0.0.1:9099";
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "demo-encuestas";
const DB_NAME = process.env.TEST_DB_NAME || "";
const RATE_LIMIT = Number(process.env.RATE_LIMIT_MAX || 600);
const ORIGIN_OK = (process.env.FRONTEND_URL || "http://localhost:4200").split(",")[0].trim();

const esLocal = (url) => /^http:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(url);
if (!esLocal(API) || !esLocal(EMULATOR) || !/(prueba|test)/i.test(DB_NAME)) {
  console.error("Abortado: API y emulador deben ser locales, y TEST_DB_NAME debe contener 'prueba' o 'test'.");
  process.exit(2);
}

const db = new Client({
  host: process.env.TEST_DB_HOST || "127.0.0.1",
  port: Number(process.env.TEST_DB_PORT || 5432),
  user: process.env.TEST_DB_USER || "postgres",
  password: process.env.TEST_DB_PASSWORD || "",
  database: DB_NAME,
});

let ok = 0;
const fallos = [];
let seccion = "";
const titulo = (t) => { seccion = t; console.log(`\n--- ${t}`); };
const prueba = (nombre, cumple, detalle) => {
  if (cumple) { ok++; return; }
  fallos.push(`[${seccion}] ${nombre}`);
  console.log(`FALLA ${nombre}${detalle !== undefined ? " -> " + JSON.stringify(detalle).slice(0, 180) : ""}`);
};

async function http(method, ruta, opciones = {}) {
  const { token, body, raw, headers = {}, base = API } = opciones;
  const res = await fetch(base + ruta, {
    method,
    headers: {
      ...(body !== undefined || raw !== undefined ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = undefined; }
  return { s: res.status, json, text, headers: res.headers };
}

const unico = Date.now();
async function cuenta(alias, nombre) {
  const email = `${alias}.${unico}@prueba.co`;
  const r = await fetch(`${EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "PruebaLocal123", displayName: nombre, returnSecureToken: true }),
  });
  const j = await r.json();
  if (!j.idToken) throw new Error("No se pudo crear la cuenta de prueba: " + JSON.stringify(j));
  return { email, uid: j.localId, token: j.idToken };
}
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const sinFirma = (c) => `${b64({ alg: "none", typ: "JWT" })}.${b64(c)}.`;
const uno = async (sql, p) => (await db.query(sql, p)).rows[0];
const FUGAS = /node_modules|at .+\.(js|ts):\d+|QueryFailedError|typeorm|SELECT |INSERT |UPDATE .* SET|violates|constraint|postgres|TypeError|ReferenceError/i;
const sinFuga = (r) => !FUGAS.test(r.text);

const preguntas = (texto) => [
  { questionText: `Escala ${texto}`, questionType: "Escala", options: ["1", "2", "3", "4", "5"].map((optionText) => ({ optionText })) },
  { questionText: `Abierta ${texto}`, questionType: "Abierta", isRequired: false },
  { questionText: `Multiple ${texto}`, questionType: "Seleccion Multiple", isRequired: false, options: [{ optionText: "Alfa" }, { optionText: "Beta" }] },
];

async function main() {
  await db.connect();
  const existe = await uno("SELECT to_regclass('public.users') AS t");
  if (!existe.t) await db.query(fs.readFileSync(path.join(__dirname, "..", "init_database.sql"), "utf8"));

  // ---------- Preparación
  const admin = await cuenta("admin", "Admin Seguridad");
  await db.query("UPDATE users SET firebase_uid = $1 WHERE user_id = 1", [admin.uid]);
  const a = await cuenta("uno", "Estudiante Uno");
  const b = await cuenta("dos", "Estudiante Dos");
  const c = await cuenta("tres", "Estudiante Tres");
  const inactivo = await cuenta("inactivo", "Usuario Inactivo");
  const aId = (await http("GET", "/users/me", { token: a.token })).json.id;
  const bId = (await http("GET", "/users/me", { token: b.token })).json.id;
  await http("GET", "/users/me", { token: c.token });
  const inactivoId = (await http("GET", "/users/me", { token: inactivo.token })).json.id;
  await http("PATCH", `/users/${inactivoId}/deactivate`, { token: admin.token });

  const crear = async (titulo2, publicar) => {
    const r = await http("POST", "/surveys", { token: admin.token, body: { title: titulo2, questions: preguntas(titulo2) } });
    if (publicar) await http("PATCH", `/surveys/${r.json.surveyId}/publish`, { token: admin.token });
    return r.json.surveyId;
  };
  const pub = await crear("Publicada", true);
  const otra = await crear("Otra publicada", true);
  const borrador = await crear("Borrador", false);
  const inact = await crear("Inactiva", true);
  await http("PATCH", `/surveys/${inact}/deactivate`, { token: admin.token });
  const detalle = (await http("GET", `/surveys/${pub}`, { token: admin.token })).json;
  const detalleOtra = (await http("GET", `/surveys/${otra}`, { token: admin.token })).json;
  const [esc, abi, mul] = detalle.questions;
  const qBorrador = (await http("GET", `/surveys/${borrador}`, { token: admin.token })).json.questions[2];
  const opt = qBorrador.options[0].optionId;
  const buena = [{ questionId: esc.questionId, optionId: esc.options[3].optionId }];

  // ---------- A. Autenticación
  titulo("A. Autenticacion");
  const ahora = Math.floor(Date.now() / 1000);
  const claims = { iat: ahora - 10, auth_time: ahora - 10, exp: ahora + 3000, sub: a.uid, user_id: a.uid, email: a.email };
  const iss = `https://securetoken.google.com/${PROJECT_ID}`;
  const tokensMalos = {
    "sin token": undefined,
    "token basura": "abc.def.ghi",
    "token vacio": " ",
    "otro proyecto": sinFirma({ ...claims, aud: "otro", iss: "https://securetoken.google.com/otro" }),
    expirado: sinFirma({ ...claims, exp: ahora - 100, iat: ahora - 7200, auth_time: ahora - 7200, aud: PROJECT_ID, iss }),
    "sin sujeto": sinFirma({ ...claims, sub: "", user_id: "", aud: PROJECT_ID, iss }),
    "emitido a futuro": sinFirma({ ...claims, iat: ahora + 9000, aud: PROJECT_ID, iss }),
  };
  for (const [nombre, token] of Object.entries(tokensMalos)) {
    const r = await http("GET", "/users/me", { token });
    prueba(`${nombre} -> 401`, r.s === 401 && sinFuga(r), r.text);
  }
  prueba("esquema Basic -> 401", (await http("GET", "/users/me", { headers: { authorization: `Basic ${a.token}` } })).s === 401);
  prueba("token sin esquema -> 401", (await http("GET", "/users/me", { headers: { authorization: a.token } })).s === 401);
  prueba("token por query string -> 401", (await http("GET", `/users/me?token=${a.token}`)).s === 401);
  prueba("POST /users retirado", (await http("POST", "/users", { body: { name: "X", email: "x@x.co", password: "secreto123", roleId: 1 } })).s === 404);
  prueba("POST /users/login retirado", (await http("POST", "/users/login", { body: { email: "x@x.co", password: "x" } })).s === 404);
  const r0 = await http("GET", "/surveys", { token: inactivo.token });
  prueba("usuario inactivo no accede", r0.s === 403 && !Array.isArray(r0.json), r0.text);

  // Correo del admin registrado por otra persona
  const correoAdmin = (await uno("SELECT email FROM users WHERE user_id = 1")).email;
  const intruso = await fetch(`${EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: correoAdmin, password: "PruebaLocal123", returnSecureToken: true }),
  }).then((x) => x.json());
  if (intruso.idToken) {
    prueba("registrar el correo del admin no da acceso", (await http("GET", "/users", { token: intruso.idToken })).s === 409);
    prueba("el admin sigue enlazado a su UID", (await uno("SELECT firebase_uid FROM users WHERE user_id = 1")).firebase_uid === admin.uid);
  }

  // ---------- B. Matriz de autorización
  titulo("B. Matriz de autorizacion");
  const soloAdmin = [
    ["GET", "/roles"], ["GET", "/roles/2"], ["POST", "/roles"], ["PUT", "/roles/2"], ["PATCH", "/roles/2/deactivate"], ["PATCH", "/roles/2/activate"], ["DELETE", "/roles/2"],
    ["GET", "/users"], ["GET", `/users/email/${encodeURIComponent(b.email)}`], ["DELETE", `/users/${bId}`], ["PATCH", `/users/${bId}/deactivate`], ["PATCH", `/users/${bId}/activate`],
    ["GET", `/users/${bId}/surveys`], ["POST", "/surveys"], ["PUT", `/surveys/${borrador}`], ["PATCH", `/surveys/${borrador}/publish`], ["PATCH", `/surveys/${pub}/draft`],
    ["PATCH", `/surveys/${inact}/activate`], ["PATCH", `/surveys/${pub}/deactivate`], ["DELETE", `/surveys/${pub}`],
    ["GET", `/surveys/${pub}/questions`], ["GET", `/questions/${esc.questionId}`], ["POST", `/surveys/${borrador}/questions`], ["POST", "/questions"], ["PUT", `/questions/${qBorrador.questionId}`],
    ["PATCH", `/questions/${qBorrador.questionId}/deactivate`], ["PATCH", `/questions/${qBorrador.questionId}/activate`], ["DELETE", `/questions/${qBorrador.questionId}`],
    ["GET", `/questions/${esc.questionId}/options`], ["GET", `/options/${opt}`], ["POST", `/questions/${qBorrador.questionId}/options`], ["POST", "/options"], ["PUT", `/options/${opt}`],
    ["PATCH", `/options/${opt}/deactivate`], ["PATCH", `/options/${opt}/activate`], ["DELETE", `/options/${opt}`],
    ["GET", `/surveys/${pub}/responses`], ["GET", `/surveys/${pub}/statistics`],
  ];
  const conSesion = [
    ["GET", "/users/me"], ["GET", "/users/me/responses"], ["GET", `/users/${aId}`], ["PUT", `/users/${aId}`], ["PATCH", `/users/${aId}`],
    ["GET", "/surveys"], ["GET", `/surveys/${pub}`], ["POST", `/surveys/${pub}/responses`],
  ];
  for (const [m, ruta] of [...soloAdmin, ...conSesion]) {
    const r = await http(m, ruta, { body: m === "GET" || m === "DELETE" ? undefined : {} });
    prueba(`${m} ${ruta} sin token -> 401`, r.s === 401, r.s);
  }
  for (const [m, ruta] of soloAdmin) {
    const r = await http(m, ruta, { token: a.token, body: m === "GET" || m === "DELETE" ? undefined : {} });
    prueba(`${m} ${ruta} como estudiante -> 403`, r.s === 403, r.s);
  }
  prueba("el cambio de rol aplica de inmediato", await (async () => {
    await http("PUT", `/users/${bId}`, { token: admin.token, body: { roleId: 1 } });
    const promovido = (await http("GET", "/users", { token: b.token })).s === 200;
    await http("PUT", `/users/${bId}`, { token: admin.token, body: { roleId: 2 } });
    return promovido && (await http("GET", "/users", { token: b.token })).s === 403;
  })());

  // ---------- C. Acceso a datos de otros (IDOR)
  titulo("C. Acceso a datos de otros");
  prueba("ver otro usuario", (await http("GET", `/users/${bId}`, { token: a.token })).s === 403);
  prueba("PUT a otro usuario", (await http("PUT", `/users/${bId}`, { token: a.token, body: { name: "Alterado" } })).s === 403);
  prueba("PATCH a otro usuario", (await http("PATCH", `/users/${bId}`, { token: a.token, body: { name: "Alterado" } })).s === 403);
  prueba("PUT al admin", (await http("PUT", "/users/1", { token: a.token, body: { name: "Alterado" } })).s === 403);
  prueba("borrador oculto", (await http("GET", `/surveys/${borrador}`, { token: a.token })).s === 404);
  prueba("inactiva oculta", (await http("GET", `/surveys/${inact}`, { token: a.token })).s === 404);
  const lista = (await http("GET", "/surveys?includeInactive=true", { token: a.token })).json;
  prueba("includeInactive ignorado para estudiante", lista.every((s) => s.status === 1), lista.map((s) => s.status));

  // ---------- D. Asignación masiva
  titulo("D. Asignacion masiva");
  await http("PUT", `/users/${aId}`, { token: a.token, body: { name: "Nombre Valido", roleId: 1, status: 0, statusUser: 0, firebaseUid: "robado", firebase_uid: "robado", email: "otro@x.co", password: "x", userId: 1, createdAt: "2000-01-01" } });
  let fila = await uno("SELECT role_id, status_user, firebase_uid, email, name FROM users WHERE user_id = $1", [aId]);
  prueba("PUT propio solo cambia el nombre", fila.role_id === 2 && fila.status_user === 1 && fila.firebase_uid === a.uid && fila.email === a.email && fila.name === "Nombre Valido", fila);
  await http("PUT", `/users/${aId}`, { token: a.token, raw: '{"name":"Nombre Valido","__proto__":{"roleId":1},"constructor":{"prototype":{"roleId":1}}}' });
  fila = await uno("SELECT role_id FROM users WHERE user_id = $1", [aId]);
  prueba("__proto__ no altera el rol", fila.role_id === 2 && (await http("GET", "/users", { token: a.token })).s === 403);

  let r = await http("POST", "/surveys", { token: admin.token, body: { title: "Masiva", status: 1, userId: aId, surveyId: 9999, createdAt: "2000-01-01" } });
  fila = await uno("SELECT survey_id, status, user_id, created_at FROM surveys WHERE survey_id = $1", [r.json.surveyId]);
  prueba("crear encuesta ignora campos protegidos", fila.status === 2 && fila.user_id === 1 && fila.survey_id !== 9999 && fila.created_at.getFullYear() > 2000, fila);
  await http("PUT", `/surveys/${borrador}`, { token: admin.token, body: { title: "Borrador", status: 1, userId: aId, surveyId: 1 } });
  fila = await uno("SELECT status, user_id FROM surveys WHERE survey_id = $1", [borrador]);
  prueba("PUT encuesta no cambia estado ni dueno", fila.status === 2 && fila.user_id === 1, fila);
  r = await http("POST", `/surveys/${pub}/responses`, { token: c.token, body: { userId: 1, surveyId: otra, status: 0, surveyResponseId: 9999, details: buena } });
  fila = r.json?.surveyResponseId ? await uno("SELECT survey_id, user_id, status FROM survey_responses WHERE survey_response_id = $1", [r.json.surveyResponseId]) : null;
  prueba("responder ignora usuario, encuesta y estado del cuerpo", r.s === 201 && fila.survey_id === pub && fila.status === 1 && fila.user_id !== 1, r.text);

  // ---------- E. Inyección y entradas hostiles
  titulo("E. Inyeccion y entradas hostiles");
  const antes = await uno("SELECT (SELECT count(*) FROM users) u, (SELECT count(*) FROM surveys) s");
  for (const ataque of ["1 OR 1=1", "1;DROP TABLE users", "' OR '1'='1", "../../etc/passwd", "1%00", "0", "-1", "1e3", "0x10", "99999999999", "1.5", "NaN"]) {
    const r1 = await http("GET", `/surveys/${encodeURIComponent(ataque)}`, { token: admin.token });
    prueba(`ID hostil '${ataque}' -> 400`, r1.s === 400 && sinFuga(r1), r1.s);
  }
  for (const ataque of ["' OR 1=1 --", "a@x.co' OR '1'='1", "a\u0000@x.co"]) {
    const r1 = await http("GET", `/users/email/${encodeURIComponent(ataque)}`, { token: admin.token });
    prueba(`correo hostil -> 400`, r1.s === 400 && sinFuga(r1), r1.s);
  }
  r = await http("GET", `/surveys/${pub}/statistics?from=${encodeURIComponent("' OR 1=1")}`, { token: admin.token });
  prueba("fecha hostil -> 400", r.s === 400 && sinFuga(r), r.s);
  r = await http("GET", `/surveys/${pub}/statistics?from[$gt]=1`, { token: admin.token });
  prueba("objeto en query -> 400", r.s === 400 && sinFuga(r), r.s);
  r = await http("GET", `/surveys?includeInactive=${encodeURIComponent("true' OR '1'='1")}`, { token: a.token });
  prueba("query hostil no cambia el resultado", r.s === 200 && r.json.every((s) => s.status === 1));
  const sqli = "'; DROP TABLE users; --";
  r = await http("POST", "/surveys", { token: admin.token, body: { title: sqli, description: sqli } });
  fila = await uno("SELECT title FROM surveys WHERE survey_id = $1", [r.json.surveyId]);
  prueba("SQL en el cuerpo se guarda como texto", fila.title === sqli, fila);
  const despues = await uno("SELECT (SELECT count(*) FROM users) u, (SELECT count(*) FROM surveys) s");
  prueba("tablas intactas", Number(despues.u) === Number(antes.u) && Number(despues.s) === Number(antes.s) + 1, { antes, despues });
  for (const [nombre, cuerpo] of [
    ["objeto en title", { title: { $ne: 1 } }], ["arreglo en title", { title: ["a"] }], ["numero en title", { title: 1 }], ["null en title", { title: null }],
    ["questions como objeto", { title: "abcde", questions: {} }], ["tipo como objeto", { title: "abcde", questions: [{ questionText: "a", questionType: {} }] }],
  ]) {
    const r1 = await http("POST", "/surveys", { token: admin.token, body: cuerpo });
    prueba(`${nombre} -> 400`, r1.s === 400 && sinFuga(r1), r1.text);
  }
  for (const [nombre, details] of [
    ["details objeto", {}], ["details vacio", []], ["questionId texto", [{ questionId: "1 OR 1=1", responseText: "x" }]], ["questionId enorme", [{ questionId: 99999999999, responseText: "x" }]],
    ["optionId objeto", [{ questionId: esc.questionId, optionId: { $gt: 0 } }]], ["responseText objeto", [{ questionId: abi.questionId, responseText: { a: 1 } }]],
    ["campo extra en detalle", [{ questionId: abi.questionId, responseText: "x", userId: 1 }]],
  ]) {
    const r1 = await http("POST", `/surveys/${pub}/responses`, { token: b.token, body: { details } });
    prueba(`${nombre} -> 400`, r1.s === 400 && sinFuga(r1), r1.text);
  }
  r = await http("POST", "/surveys", { token: admin.token, body: { title: "Con\u0000nulo" } });
  prueba("byte nulo en texto no causa 500", r.s === 400 && sinFuga(r), r.text);
  r = await http("POST", `/surveys/${pub}/responses`, { token: b.token, body: { details: [...buena, { questionId: abi.questionId, responseText: "a\u0000b" }] } });
  prueba("byte nulo en respuesta no causa 500", r.s === 400 && sinFuga(r), r.text);
  const html = "<script>alert(1)</script><img src=x onerror=alert(1)>";
  r = await http("POST", "/surveys", { token: admin.token, body: { title: "Con html", description: html } });
  const leida = await http("GET", `/surveys/${r.json.surveyId}`, { token: admin.token });
  prueba("HTML vuelve como JSON, sin ejecutarse", leida.json.description === html && /application\/json/.test(leida.headers.get("content-type")) && leida.headers.get("x-content-type-options") === "nosniff", leida.headers.get("x-content-type-options"));

  const proto = (await http("POST", "/surveys", { token: admin.token, body: { title: "Prototipo", questions: [{ questionText: "Escala", questionType: "Seleccion Multiple", options: [{ optionText: "__proto__" }, { optionText: "constructor" }] }] } })).json.surveyId;
  await http("PATCH", `/surveys/${proto}/publish`, { token: admin.token });
  const qp = (await http("GET", `/surveys/${proto}`, { token: admin.token })).json.questions[0];
  await http("POST", `/surveys/${proto}/responses`, { token: b.token, body: { details: [{ questionId: qp.questionId, optionId: qp.options[0].optionId }] } });
  r = await http("GET", `/surveys/${proto}/statistics`, { token: admin.token });
  const conteo = JSON.parse(r.text.match(/"optionsCount":(\{.*?\})/)?.[1] ?? "{}");
  prueba("opcion llamada __proto__ se cuenta bien", r.s === 200 && Object.keys(conteo).includes("__proto__") && conteo["__proto__"] === 1 && conteo["constructor"] === 0, r.text.slice(0, 200));

  // ---------- F. Reglas de negocio
  titulo("F. Reglas de negocio");
  const envia = (id, details, token) => http("POST", `/surveys/${id}/responses`, { token, body: { details } });
  prueba("responder borrador", (await envia(borrador, buena, b.token)).s === 404);
  prueba("responder inactiva", (await envia(inact, buena, b.token)).s === 400);
  prueba("pregunta de otra encuesta", (await envia(pub, [...buena, { questionId: detalleOtra.questions[1].questionId, responseText: "x" }], b.token)).s === 400);
  prueba("opcion de otra pregunta", (await envia(pub, [{ questionId: esc.questionId, optionId: mul.options[0].optionId }], b.token)).s === 400);
  prueba("sin obligatorias", (await envia(pub, [{ questionId: abi.questionId, responseText: "x" }], b.token)).s === 400);
  const simultaneos = await Promise.all([1, 2, 3, 4, 5, 6].map(() => envia(pub, buena, b.token)));
  prueba("6 envios simultaneos: solo uno entra", simultaneos.filter((x) => x.s === 201).length === 1 && simultaneos.filter((x) => x.s === 409).length === 5, simultaneos.map((x) => x.s));
  prueba("no se responde dos veces", (await envia(pub, buena, b.token)).s === 409);
  prueba("publicada no se edita", (await http("PUT", `/surveys/${pub}`, { token: admin.token, body: { title: "Cambio" } })).s === 400);
  prueba("publicada no acepta preguntas", (await http("POST", `/surveys/${pub}/questions`, { token: admin.token, body: { questionText: "Nueva", questionType: "Abierta" } })).s === 400);
  prueba("con respuestas no vuelve a borrador", (await http("PATCH", `/surveys/${pub}/draft`, { token: admin.token })).s === 400);
  prueba("rol base no se inactiva", (await http("PATCH", "/roles/1/deactivate", { token: admin.token })).s === 400);
  prueba("admin no se inactiva a si mismo", (await http("DELETE", "/users/1", { token: admin.token })).s === 400);

  // ---------- G. Límites de recursos
  titulo("G. Limites de recursos");
  r = await http("POST", "/surveys", { token: admin.token, raw: JSON.stringify({ title: "a".repeat(6 * 1024 * 1024) }) });
  prueba("cuerpo de 6 MB -> 413", r.s === 413 && sinFuga(r), r.s);
  prueba("titulo de 201 caracteres", (await http("POST", "/surveys", { token: admin.token, body: { title: "a".repeat(201) } })).s === 400);
  prueba("descripcion de 100 KB", (await http("POST", "/surveys", { token: admin.token, body: { title: "abcde", description: "a".repeat(100000) } })).s === 400);
  const muchas = Array.from({ length: 1000 }, (_, i) => ({ questionText: `P${i}`, questionType: "Abierta" }));
  prueba("1000 preguntas", (await http("POST", "/surveys", { token: admin.token, body: { title: "abcde", questions: muchas } })).s === 400);
  prueba("enunciado de 100 KB", (await http("POST", "/surveys", { token: admin.token, body: { title: "abcde", questions: [{ questionText: "a".repeat(100000), questionType: "Abierta" }] } })).s === 400);
  const opciones = Array.from({ length: 1000 }, (_, i) => ({ optionText: `O${i}` }));
  prueba("1000 opciones", (await http("POST", "/surveys", { token: admin.token, body: { title: "abcde", questions: [{ questionText: "abcde", questionType: "Seleccion Multiple", options: opciones }] } })).s === 400);
  prueba("orden fuera de rango", (await http("POST", `/surveys/${borrador}/questions`, { token: admin.token, body: { questionText: "abcde", questionType: "Abierta", displayOrder: 2147483648 } })).s === 400);
  prueba("respuesta de 100 KB", (await envia(otra, [{ questionId: detalleOtra.questions[0].questionId, optionId: detalleOtra.questions[0].options[0].optionId }, { questionId: detalleOtra.questions[1].questionId, responseText: "a".repeat(100000) }], c.token)).s === 400);
  const detallesMuchos = Array.from({ length: 5000 }, () => ({ questionId: abi.questionId, responseText: "x" }));
  prueba("5000 detalles", (await envia(otra, detallesMuchos, c.token)).s === 400);
  prueba("nombre de 10 KB", (await http("PUT", `/users/${aId}`, { token: a.token, body: { name: "a".repeat(10000) } })).s === 400);
  prueba("avatar de otro tipo", (await http("PUT", `/users/${aId}`, { token: a.token, body: { avatarBase64: "data:image/svg+xml;base64,AAAA" } })).s === 400);
  prueba("avatar enorme", (await http("PUT", `/users/${aId}`, { token: a.token, body: { avatarBase64: "data:image/png;base64," + "A".repeat(4200000) } })).s === 400);
  const profundo = "[".repeat(50000) + "]".repeat(50000);
  r = await http("POST", "/surveys", { token: admin.token, raw: `{"title":${profundo}}` });
  prueba("JSON muy anidado no tumba la API", r.s === 400 && sinFuga(r), r.s);
  prueba("la API sigue viva", (await http("GET", "/health")).s === 200);

  // ---------- H. Fugas de información y cabeceras
  titulo("H. Fugas de informacion y cabeceras");
  r = await http("POST", "/surveys", { token: admin.token, raw: "{malformado" });
  prueba("JSON malformado sin stack", r.s === 400 && sinFuga(r) && /json/.test(r.headers.get("content-type")), r.text);
  r = await http("GET", "/no-existe");
  prueba("404 en JSON", r.s === 404 && /json/.test(r.headers.get("content-type")));
  r = await http("PUT", `/users/${aId}`, { token: admin.token, body: { roleId: 99 } });
  prueba("error de BD sin detalles", r.s === 400 && sinFuga(r), r.text);
  r = await http("GET", "/health");
  prueba("health no revela tecnologia", !/typeorm|postgres|express|node/i.test(r.text), r.text);
  prueba("sin X-Powered-By", r.headers.get("x-powered-by") === null, r.headers.get("x-powered-by"));
  for (const [cab, valor] of [["x-content-type-options", /nosniff/], ["x-frame-options", /DENY/i], ["referrer-policy", /no-referrer/], ["content-security-policy", /default-src 'none'/], ["strict-transport-security", /max-age=\d+/], ["cache-control", /no-store/]]) {
    prueba(`cabecera ${cab}`, valor.test(r.headers.get(cab) ?? ""), r.headers.get(cab));
  }
  const origen = async (o) => (await http("GET", "/health", { headers: { origin: o } })).headers.get("access-control-allow-origin");
  prueba("CORS permite el front", (await origen(ORIGIN_OK)) === ORIGIN_OK);
  prueba("CORS rechaza otro origen", (await origen("https://evil.example")) === null);
  prueba("CORS no acepta null", (await origen("null")) === null);
  prueba("metodo TRACE sin eco", ![200].includes((await http("TRACE", "/health").catch(() => ({ s: 405 }))).s));
  r = await http("GET", `/surveys/${pub}`, { token: a.token });
  prueba("detalle sin datos internos para estudiante", r.s === 200 && !("userId" in r.json), Object.keys(r.json));
  prueba("listado sin datos internos para estudiante", (await http("GET", "/surveys", { token: a.token })).json.every((s) => !("userId" in s)));
  r = await http("GET", "/users/me", { token: a.token });
  prueba("perfil sin secretos", !/firebase|password|hash/i.test(r.text), r.text);
  r = await http("GET", "/users", { token: admin.token });
  prueba("listado de usuarios sin secretos", !/firebase|password|hash/i.test(r.text));

  // ---------- I. Límite de peticiones (siempre al final)
  titulo("I. Limite de peticiones");
  let limitado = false;
  for (let i = 0; i < RATE_LIMIT + 50 && !limitado; i += 25) {
    const lote = await Promise.all(Array.from({ length: 25 }, () => http("GET", "/health")));
    limitado = lote.some((x) => x.s === 429);
    if (limitado) {
      const bloqueo = lote.find((x) => x.s === 429);
      prueba("429 en JSON con Retry-After", /json/.test(bloqueo.headers.get("content-type")) && Number(bloqueo.headers.get("retry-after")) > 0, bloqueo.text);
    }
  }
  prueba("rafaga de peticiones se limita", limitado);

  await db.end();
  console.log(`\nRESULTADO: ${ok} correctas, ${fallos.length} fallidas de ${ok + fallos.length}`);
  process.exit(fallos.length ? 1 : 0);
}

main().catch(async (e) => {
  console.error("ERROR EN LA EJECUCION", e);
  await db.end().catch(() => {});
  process.exit(2);
});
