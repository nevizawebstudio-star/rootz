// ============================================================
// Calcula el domingo de entrega, respetando la regla del negocio:
// "cierre de pedidos los jueves, entrega los domingos".
//
// - Si el pedido se hizo de lunes a jueves -> se entrega el
//   domingo de ESA misma semana.
// - Si el pedido se hizo viernes, sábado o domingo -> ya se pasó
//   el cierre de esa semana, se entrega el domingo SIGUIENTE.
// ============================================================

function nextDeliverySunday(date) {
  // Obtenemos año/mes/día en la zona horaria de México, sin importar
  // en qué servidor/zona horaria corra Vercel.
  var parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  }).formatToParts(date);

  var y, m, d, weekdayShort;
  parts.forEach(function (p) {
    if (p.type === "year") y = parseInt(p.value, 10);
    if (p.type === "month") m = parseInt(p.value, 10);
    if (p.type === "day") d = parseInt(p.value, 10);
    if (p.type === "weekday") weekdayShort = p.value;
  });

  var WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  var weekday = WEEKDAY_INDEX[weekdayShort];

  // Trabajamos con un Date "neutro" a mediodía UTC para sumar días sin
  // líos de horario de verano.
  var base = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

  var daysUntilSunday = (7 - weekday) % 7;
  var needsPush = weekday === 0 || weekday === 5 || weekday === 6; // Dom, Vie, Sáb -> ya cerró la semana
  var totalDays = daysUntilSunday + (needsPush ? 7 : 0);

  var deliveryDate = new Date(base.getTime());
  deliveryDate.setUTCDate(deliveryDate.getUTCDate() + totalDays);

  var dd = String(deliveryDate.getUTCDate()).padStart(2, "0");
  var mm = String(deliveryDate.getUTCMonth() + 1).padStart(2, "0");
  var yyyy = deliveryDate.getUTCFullYear();

  return dd + "/" + mm + "/" + yyyy;
}

module.exports = { nextDeliverySunday };
