// ============================================================
// /api/create-checkout-session
//
// El navegador NUNCA manda un precio final — solo manda QUÉ
// eligió el cliente (paquete, cantidad, zona, platillos, datos).
// Aquí, en el servidor, recalculamos el total con los precios
// reales de _pricing.js y creamos la sesión de pago de Stripe.
// ============================================================

const Stripe = require("stripe");
const { PACKAGES, ZONES, QTY_LIMITS, DISHES } = require("./_pricing");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(500).json({ error: "Falta configurar STRIPE_SECRET_KEY en el servidor." });
    return;
  }

  try {
    const body = req.body || {};
    const packageId = String(body.packageId || "");
    const qty = parseInt(body.qty, 10);
    const zone = String(body.zone || "");
    const dishes = body.dishes && typeof body.dishes === "object" ? body.dishes : {};
    const customer = body.customer && typeof body.customer === "object" ? body.customer : {};

    const name = String(customer.name || "").trim();
    const phone = String(customer.phone || "").trim();
    const email = String(customer.email || "").trim();
    const address = String(customer.address || "").trim();
    const notes = String(customer.notes || "").trim();

    // ---- Validaciones básicas ----
    const pkg = PACKAGES[packageId];
    if (!pkg) {
      res.status(400).json({ error: "Paquete no válido." });
      return;
    }
    const zoneInfo = ZONES[zone];
    if (!zoneInfo) {
      res.status(400).json({ error: "Zona de entrega no válida." });
      return;
    }
    const isCustom = packageId === "custom";
    const limits = isCustom ? QTY_LIMITS.custom : QTY_LIMITS.fixed;
    if (!Number.isInteger(qty) || qty < limits.min || qty > limits.max) {
      res.status(400).json({ error: "Cantidad no válida." });
      return;
    }
    if (!name || !phone || !email || !address) {
      res.status(400).json({ error: "Faltan datos del cliente (nombre, teléfono, correo o dirección)." });
      return;
    }
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      res.status(400).json({ error: "El correo no es válido." });
      return;
    }

    const requiredMeals = isCustom ? qty : pkg.meals * qty;
    let selectedMeals = 0;
    const dishParts = [];
    Object.keys(dishes).forEach(function (dishId) {
      const count = parseInt(dishes[dishId], 10);
      if (!DISHES[dishId] || !Number.isInteger(count) || count <= 0) return;
      selectedMeals += count;
      dishParts.push(count + "x " + DISHES[dishId]);
    });
    if (selectedMeals !== requiredMeals) {
      res.status(400).json({ error: "La cantidad de platillos elegidos no coincide con tus meals." });
      return;
    }

    // ---- Cálculo del total, 100% en el servidor ----
    const mealsCount = isCustom ? qty : pkg.meals;
    const subtotalMXN = pkg.price * qty; // paquete: precio x #paquetes | custom: precio x #meals
    const envioMXN = zoneInfo.price;
    const totalMXN = subtotalMXN + envioMXN;

    const packageLineName = isCustom
      ? "Rootz Kitchen — A tu gusto (" + qty + " meal" + (qty > 1 ? "s" : "") + ")"
      : "Rootz Kitchen — " + pkg.name + " (" + pkg.meals + " meals)";

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const origin = "https://" + req.headers.host;

    const dishesSummary = dishParts.join(", ").slice(0, 480);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: { name: packageLineName },
            unit_amount: Math.round(pkg.price * 100)
          },
          quantity: qty
        },
        {
          price_data: {
            currency: "mxn",
            product_data: { name: "Envío — " + zoneInfo.label },
            unit_amount: Math.round(envioMXN * 100)
          },
          quantity: 1
        }
      ],
      success_url: origin + "/success.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: origin + "/cancel.html",
      metadata: {
        order_name: name.slice(0, 480),
        order_phone: phone.slice(0, 480),
        order_email: email.slice(0, 480),
        order_address: address.slice(0, 480),
        order_notes: notes.slice(0, 480),
        zone: zone,
        envio_mxn: String(envioMXN),
        package_id: packageId,
        package_name: pkg.name,
        meals_count: String(mealsCount),
        qty: String(qty),
        dishes: dishesSummary,
        total_mxn: String(totalMXN)
      }
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Error creando checkout session:", err);
    res.status(500).json({ error: "No se pudo iniciar el pago. Intenta de nuevo." });
  }
};
