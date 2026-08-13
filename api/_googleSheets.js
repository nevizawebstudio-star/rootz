// ============================================================
// Conexión a Google Sheets SIN librerías extra — usamos las
// herramientas que ya trae Node.js (crypto + fetch) para
// autenticarnos como la cuenta de servicio y agregar filas.
// ============================================================

const crypto = require("crypto");

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function getAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !rawKey) {
    throw new Error("Faltan GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY");
  }
  const privateKey = rawKey.replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  };

  const signingInput = base64url(JSON.stringify(header)) + "." + base64url(JSON.stringify(claims));
  const signature = crypto.createSign("RSA-SHA256").update(signingInput).sign(privateKey);
  const jwt = signingInput + "." + signature.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=" + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") + "&assertion=" + jwt
  });

  const tokenData = await tokenResp.json();
  if (!tokenResp.ok || !tokenData.access_token) {
    throw new Error("No se pudo autenticar con Google: " + JSON.stringify(tokenData));
  }
  return tokenData.access_token;
}

// rowValues: arreglo de valores, en el orden exacto de las columnas del Sheet.
async function appendOrderRow(rowValues) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    throw new Error("Falta GOOGLE_SHEET_ID");
  }
  const accessToken = await getAccessToken();

  const range = "Pedidos!A:L";
  const url = "https://sheets.googleapis.com/v4/spreadsheets/" + sheetId +
    "/values/" + encodeURIComponent(range) + ":append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS";

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + accessToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ values: [rowValues] })
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error("Error escribiendo en Google Sheets: " + JSON.stringify(data));
  }
  return data;
}

module.exports = { appendOrderRow };
