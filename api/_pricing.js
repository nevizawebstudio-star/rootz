// ============================================================
// Fuente de verdad de precios — SOLO el servidor confía en esto.
// Nunca se usa el precio que manda el navegador para cobrar.
//
// IMPORTANTE: si cambias un precio en index.html (paquetes o
// zonas de entrega), cambia también el número aquí para que
// coincidan. Los dos viven separados a propósito: index.html
// es lo que el cliente VE, este archivo es lo que el servidor
// REALMENTE COBRA.
// ============================================================

// Paquetes fijos: precio total en pesos (MXN) por el paquete completo.
// "meals" = cuántos meals trae cada paquete.
const PACKAGES = {
  "6": { name: "Paquete Starter", meals: 6, price: 749 },
  "12": { name: "Paquete Balance", meals: 12, price: 1399 },
  "15": { name: "Paquete Full Week", meals: 15, price: 1999 },
  // "custom": precio POR MEAL individual (no paquete fijo).
  "custom": { name: "Personaliza tu semana", meals: null, price: 145 }
};

// Costo de envío por zona, en pesos (MXN).
const ZONES = {
  A: { label: "Zona A", price: 39 },
  B: { label: "Zona B", price: 59 },
  C: { label: "Zona C", price: 79 }
};

// Límites de cantidad permitidos (deben coincidir con script.js)
const QTY_LIMITS = {
  fixed: { min: 1, max: 10 },
  custom: { min: 1, max: 20 }
};

// Los 9 platillos reales del menú de la semana (deben existir en index.html)
const DISHES = {
  "des-muffins": "Muffins de plátano con blueberry",
  "des-omelette": "Omelette de huitlacoche",
  "des-wrap": "Wrap de pollo",
  "com-teriyaki": "Teriyaki de res",
  "com-diabla": "Pollo a la diabla con arroz de brócoli",
  "com-arrozverde": "Arroz verde con pescado a limón",
  "chef-pasta": "Pasta con camarones",
  "chef-salmon": "Bowl de salmón teriyaki",
  "chef-camarones": "Bowl de camarones con aderezo de aguacate"
};

module.exports = { PACKAGES, ZONES, QTY_LIMITS, DISHES };
