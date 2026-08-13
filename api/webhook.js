// ============================================================
// /api/webhook — Stripe nos avisa aquí cuando un pago se
// completó de verdad. SOLO aquí guardamos el pedido (en Google
// Sheets). Nunca confiamos en lo que pase en el navegador del
// cliente para dar por bueno un pago.
// ============================================================

const Stripe = require("stripe");
const { appendOrderRow } = require("./_googleSheets");
const { nextDeliverySunday } = require("./_deliveryDate");

// Necesitamos el body "crudo" (sin procesar) para poder verificar
// la firma que manda Stripe. Por eso apagamos el bodyParser normal.
module.exports.config = {
  api: {
    bodyParser: false
  }
};

function readRawBody(req) {
  return new Promise(function (resolve, reject) {
    var chunks = [];
    req.on("data", function (chunk) { chunks.push(chunk); });
    req.on("end", function () { resolve(Buffer.concat(chunks)); });
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Método no permitido");
    return;
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Faltan STRIPE_SECRET_KEY o STRIPE_WEBHOOK_SECRET en el servidor.");
    res.status(500).send("Servidor no configurado");
    return;
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const rawBody = await readRawBody(req);
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Firma de webhook inválida:", err.message);
    res.status(400).send("Firma inválida: " + err.message);
    return;
  }

  if (event.type !== "checkout.session.completed") {
    // No es el evento que nos interesa — le decimos a Stripe que todo bien
    // para que no lo siga reintentando.
    res.status(200).json({ received: true, ignored: event.type });
    return;
  }

  const session = event.data.object;

  if (session.payment_status !== "paid") {
    // Se creó la sesión pero el pago no se completó (raro en este evento,
    // pero por seguridad no guardamos nada si no está pagado).
    res.status(200).json({ received: true, skipped: "not paid" });
    return;
  }

  try {
    const m = session.metadata || {};
    const totalMXN = Number(m.total_mxn || (session.amount_total ? session.amount_total / 100 : 0));
    const paidAt = new Date(); // momento en que Stripe confirma el pago
    const fechaHora = new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Mexico_City",
      dateStyle: "short",
      timeStyle: "short"
    }).format(paidAt);

    const row = [
      fechaHora,                              // Fecha/hora
      m.order_name || "",                     // Nombre
      m.order_phone || "",                    // Teléfono/WhatsApp
      m.order_email || session.customer_email || "", // Correo
      m.order_address || "",                  // Dirección
      m.zone ? ("Zona " + m.zone) : "",        // Zona
      m.envio_mxn ? ("$" + m.envio_mxn + " MXN") : "", // Costo de envío
      (m.package_name || "") + (m.meals_count ? (" (" + m.meals_count + " meals)") : ""), // Paquete
      m.dishes || "",                         // Lista de meals con cantidades
      m.order_notes || "",                    // Notas/alergias
      "$" + totalMXN.toLocaleString("es-MX") + " MXN", // Total pagado
      nextDeliverySunday(paidAt)               // Entrega domingo
    ];

    await appendOrderRow(row);

    res.status(200).json({ received: true, saved: true });
  } catch (err) {
    console.error("Error guardando el pedido en Google Sheets:", err);
    // Le decimos a Stripe que falló (500) para que reintente el webhook
    // más tarde — así no perdemos el pedido si Sheets tuvo un problema momentáneo.
    res.status(500).json({ received: true, saved: false, error: "No se pudo guardar en Sheets" });
  }
};
