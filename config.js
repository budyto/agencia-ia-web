// Configuración de la web. Cambiá estos valores y listo.
window.SITE = {
  // Número de WhatsApp en formato internacional, sin + ni espacios (ej: 5491112345678)
  whatsapp: "5491170591714",
  whatsappText: "Hola! Quiero agendar un diagnóstico gratis.",

  // El server de MyM, donde corre el robot del WhatsApp de MyM Soluciones (ventas-sol.js de AppMyM).
  // El panel admin/whatsapp.html lee y contesta esas charlas desde acá.
  ventasApi: "https://mym-creditos-81440681742.southamerica-east1.run.app",

  // Cotización de respaldo para la calculadora (pesos por dólar). La web intenta
  // traer la cotización oficial del día desde dolarapi.com; si falla, usa esta.
  usdArs: 1500,

  // Supabase (opcional). Si queda vacío, el formulario manda el lead por WhatsApp.
  // Usá la "anon public key": es pública y la protege la política RLS de supabase-leads.sql.
  supabaseUrl: "",
  supabaseAnonKey: "",
};
