// ============================================================
// /api/session-info?session_id=...
//
// Usado SOLO por success.html para mostrar un resumen bonito.
// No guarda nada — el guardado real del pedido pasa por el
// webhook (api/webhook.js), que es la única fuente confiable
// de "el pago sí se completó".
// ============================================================

const Stripe = require("stripe");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(500).json({ error: "Falta configurar STRIPE_SECRET_KEY." });
    return;
  }

  const sessionId = req.query && req.query.session_id;
  if (!sessionId || typeof sessionId !== "string") {
    res.status(400).json({ error: "Falta session_id." });
    return;
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.status(200).json({
      status: session.status,
      payment_status: session.payment_status,
      metadata: session.metadata || {}
    });
  } catch (err) {
    console.error("Error obteniendo session-info:", err);
    res.status(404).json({ error: "No se encontró esa sesión." });
  }
};
