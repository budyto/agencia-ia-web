(() => {
  const cfg = window.SITE || {};
  // Las animaciones son parte de la experiencia: corren siempre, aunque Windows o el
  // celular tengan "reducir movimiento" activado. ?motion=0 las apaga (versión estática).
  const reduced = /[?&]motion=0/.test(location.search);
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  if (reduced || !hasGsap) document.documentElement.classList.add("reduced");

  /* ---------- Básicos ---------- */
  $("#year").textContent = new Date().getFullYear();
  const waUrl = (text) => `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(text)}`;
  $$("[data-wa]").forEach((a) => { a.href = waUrl(cfg.whatsappText || ""); a.target = "_blank"; a.rel = "noopener"; });

  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 20);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Brillo que sigue al mouse en las tarjetas de sistemas
  $$(".svc").forEach((c) => c.addEventListener("pointermove", (e) => {
    const r = c.getBoundingClientRect();
    c.style.setProperty("--mx", `${e.clientX - r.left}px`);
    c.style.setProperty("--my", `${e.clientY - r.top}px`);
  }));

  // Corre una función la primera vez que el elemento entra en pantalla
  const onView = (el, fn, threshold = 0.35) => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { io.disconnect(); fn(); } });
    }, { threshold });
    io.observe(el);
  };

  /* ---------- Hero: 4 variantes que rotan en cada visita ---------- */
  const hero = $("#hero");
  const animated = hasGsap && !reduced;
  function pickVariant() {
    const forced = +(location.search.match(/[?&]hero=([1-4])/) || [])[1];
    if (forced) return forced;
    if (!animated) return 4; // la 4 no depende del scroll
    let next = Math.floor(Math.random() * 4) + 1;
    try {
      const last = +localStorage.getItem("heroVariant") || 0;
      next = (last % 4) + 1;
      localStorage.setItem("heroVariant", next);
    } catch (e) {}
    return next;
  }
  const variant = pickVariant();
  hero.dataset.variant = variant;

  if (animated) {
    gsap.registerPlugin(ScrollTrigger);
    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom bottom", scrub: 0.8 },
    });
    if (variant !== 4) {
      tl.to(".hero-copy", { y: -80, opacity: 0, duration: 1 }, 0)
        .to(".scroll-hint", { opacity: 0, duration: 0.3 }, 0)
        .to(".hero-glow", { scale: 1.25, duration: 1 }, 0);
    }

    if (variant === 1) {
      // Un día en tu empresa: el reloj corre de 09:00 a 03:00 con el scroll
      const clock = $("#clock"), bar = $("#clock-bar");
      const START = 1.2, SPAN = 4.4, DAY = 18 * 60;
      const clockState = { m: 0 };
      tl.to(".v1-inner", { opacity: 1, duration: 0.6 }, 0.6)
        .to(clockState, { m: DAY, duration: SPAN, ease: "none", onUpdate: () => {
          const total = 9 * 60 + Math.round(clockState.m);
          const h = Math.floor(total / 60) % 24, mm = total % 60;
          clock.textContent = `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
          bar.style.width = `${(clockState.m / DAY) * 100}%`;
        } }, START);
      $$(".feed li").forEach((li) => {
        tl.to(li, { opacity: 1, y: 0, duration: 0.3 }, START + (li.dataset.m / DAY) * SPAN);
      });
      tl.to(".v1-inner", { opacity: 0, y: -30, duration: 0.6 }, START + SPAN + 0.2)
        .fromTo(".v1-end", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8 }, START + SPAN + 0.6)
        .to({}, { duration: 0.5 });
    }

    if (variant === 2) {
      // El caos que se ordena: las notificaciones vuelan desde posiciones al azar a su lugar en el tablero
      const tiles = $$(".tile");
      const rnd = (a, b) => a + Math.random() * (b - a);
      tiles.forEach((t) => {
        tl.fromTo(t,
          { x: () => rnd(-0.45, 0.45) * innerWidth, y: () => rnd(-0.38, 0.38) * innerHeight, rotation: rnd(-18, 18), scale: rnd(0.85, 1.1), opacity: 0.9 },
          { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, duration: 2.4, ease: "power3.inOut" }, 0.9 + rnd(0, 0.5));
      });
      tl.to(".board-head", { opacity: 1, duration: 0.5 }, 3.4);
      tiles.forEach((t, i) => tl.call(() => t.classList.toggle("done", tl.scrollTrigger.direction > 0), null, 3.6 + i * 0.08));
      tl.to(".board", { opacity: 0, scale: 0.94, duration: 0.6 }, 5)
        .fromTo(".v2-end", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8 }, 5.4)
        .to({}, { duration: 0.5 });
    }

    if (variant === 3) {
      // La voz: el orbe crece y "habla" la llamada línea por línea
      const lines = $$(".v3-lines p");
      tl.to(".orb-xl", { scale: 1, opacity: 1, duration: 1.2, ease: "power2.inOut" }, 0.3);
      lines.forEach((p, i) => {
        tl.to(p, { opacity: 1, y: 0, duration: 0.4 }, 1.5 + i * 0.6)
          .to(".orb-xl", { scale: p.classList.contains("ai") ? 1.06 : 0.96, duration: 0.3 }, 1.5 + i * 0.6);
      });
      tl.to(".v3-lines", { opacity: 0, duration: 0.5 }, 5.0)
        .to(".orb-xl", { scale: 1.6, opacity: 0.35, duration: 0.9 }, 5.0)
        .fromTo(".v3-end", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8 }, 5.3)
        .to({}, { duration: 0.5 });
    }

    if (variant === 4) {
      tl.scrollTrigger.kill();
    }

    addEventListener("resize", () => ScrollTrigger.refresh());

    // Reveals
    $$(".rv").forEach((el) => {
      gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
    });
    $$(".sec h2").forEach((el) => {
      gsap.from(el, { opacity: 0, y: 30, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
    });

    // Línea del proceso
    gsap.to("#steps-bar", { width: "100%", ease: "none", scrollTrigger: { trigger: "#steps", start: "top 75%", end: "bottom 55%", scrub: true,
      onUpdate: (st) => $$(".step").forEach((s, i) => s.classList.toggle("on", st.progress >= i / 4)) } });
  } else {
    $$(".step").forEach((s) => s.classList.add("on"));
  }

  /* ---------- Variante 4: "Escribí tu problema" ---------- */
  const SOLUTIONS = [
    { kw: ["whatsapp", "wsp", "mensaje", "respond", "contest", "ventas", "vender", "consulta", "instagram"],
      kind: "Bot de IA para WhatsApp", title: "Un vendedor que contesta en segundos, 24/7",
      desc: "Responde con tu catálogo, precios y stock, toma el pedido y manda el link de pago. Si la consulta es compleja, pasa el chat a tu equipo.",
      steps: ["Cargamos tu catálogo y preguntas frecuentes", "Lo conectamos a tu número de WhatsApp Business", "Cobra con Mercado Pago y avisa cada venta"] },
    { kw: ["cuota", "cobr", "deud", "atras", "venc", "mora", "pago"],
      kind: "Cobranza con agente de voz", title: "Llamadas y recordatorios que recuperan cuotas",
      desc: "Un agente llama con voz natural, consulta una fecha de pago dentro de reglas acordadas y manda el link por WhatsApp; los acuerdos especiales se derivan a tu equipo. Vos ves en un tablero quién prometió pagar y cuándo.",
      steps: ["Importamos tu cartera de cuotas", "Recordatorios escalonados por WhatsApp y llamada", "Conciliación automática de pagos"] },
    { kw: ["turno", "agenda", "reserv", "cita", "paciente", "seña"],
      kind: "Agente de turnos", title: "Reservas, confirmaciones y recordatorios conectados",
      desc: "El paciente o cliente reserva por WhatsApp o teléfono, paga la seña y recibe recordatorio. Tu equipo interviene en cambios y excepciones.",
      steps: ["Conectamos tu agenda (Google Calendar o la tuya)", "Seña por Mercado Pago al reservar", "Recordatorio y reprogramación automáticos"] },
    { kw: ["factura", "document", "pdf", "carg", "mano", "planilla", "excel", "dni", "papel"],
      kind: "Lectura de documentos con IA", title: "Que la IA cargue los papeles por vos",
      desc: "Facturas, DNI, recibos y comprobantes: la IA los lee, valida los datos y los carga en tu sistema o planilla.",
      steps: ["Definimos qué datos sacar de cada documento", "Los mandás por mail, WhatsApp o carpeta", "Quedan cargados y revisables en un panel"] },
    { kw: ["llam", "teléfono", "telefono", "atender"],
      kind: "Agente de voz", title: "Un agente que atiende el teléfono por vos",
      desc: "Atiende llamadas entrantes, responde dudas, toma pedidos o turnos y deja todo registrado con la transcripción.",
      steps: ["Entrenamos la voz con tu información", "Lo conectamos a tu número", "Resumen de cada llamada en tu CRM"] },
  ];
  const FALLBACK = { kind: "Sistema a medida", title: "Lo vemos juntos en 30 minutos",
    desc: "Tu caso no entra en una caja, y está bien: es justo lo que hacemos. En el diagnóstico te decimos si la IA lo resuelve, cuánto tarda y qué hace falta.",
    steps: ["Diagnóstico gratis de 30 minutos", "Alcance y plazo del prototipo acordados", "Implementación y pruebas según cronograma"] };
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const askForm = $("#ask"), askInput = $("#ask-input"), answer = $("#answer");

  function solve(text) {
    const t = norm(text);
    let best = null, score = 0;
    SOLUTIONS.forEach((s) => {
      const n = s.kw.filter((k) => t.includes(norm(k))).length;
      if (n > score) { best = s; score = n; }
    });
    const s = best || FALLBACK;
    answer.hidden = false;
    answer.innerHTML = `
      <span class="kind">Te armaríamos · ${s.kind}</span>
      <h3>${s.title}</h3>
      <p>${s.desc}</p>
      <ol>${s.steps.map((x) => `<li>${x}</li>`).join("")}</ol>
      <div class="meta"><a href="#contacto" class="btn btn-primary" id="ask-cta">Quiero esto · diagnóstico gratis <span class="arr">→</span></a><span class="live">PROTOTIPO EN 7 DÍAS</span></div>`;
    // Re-dispara la animación de entrada
    answer.style.animation = "none"; answer.offsetHeight; answer.style.animation = "";
    // En celular la respuesta queda abajo del pliegue: la acercamos
    if (innerWidth < 820) answer.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    $("#ask-cta").addEventListener("click", () => {
      const ta = $("#lead-form textarea[name=problema]");
      if (ta && !ta.value) ta.value = text;
    });
  }
  askForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (askInput.value.trim()) solve(askInput.value.trim());
    else askInput.focus();
  });
  askInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askForm.requestSubmit(); }
  });
  $$(".ask-chips button").forEach((b) => b.addEventListener("click", () => {
    askInput.value = b.textContent;
    solve(b.textContent);
  }));

  /* ---------- Demo WhatsApp ---------- */
  const chat = $("#chat");
  const waStatus = $("#wa-status");
  const script = [
    ["in", "Hola, tienen turno para limpieza dental esta semana?"],
    ["out", "¡Hola! Sí 😊 Tengo jueves 10:30 o viernes 16:00 con la Dra. Pérez. ¿Cuál te queda mejor?"],
    ["in", "el viernes"],
    ["out", "Listo, te reservo el viernes 16:00. Para confirmarlo hay una seña de $5.000."],
    ["pay", "<b>💳 Link de pago</b>Seña turno · $5.000 · Mercado Pago"],
    ["in", "pagado!"],
    ["sys", "✓ Pago verificado · turno confirmado · agenda actualizada"],
    ["out", "¡Perfecto! Te espero el viernes 16:00. Te recuerdo el día anterior por acá 👋"],
  ];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  async function runChat() {
    while (true) {
      chat.innerHTML = "";
      for (const [kind, text] of script) {
        if (kind === "out" || kind === "pay") {
          waStatus.textContent = "escribiendo…";
          const t = document.createElement("div");
          t.className = "typing"; t.innerHTML = "<span></span><span></span><span></span>";
          chat.appendChild(t);
          await wait(reduced ? 200 : 1100);
          t.remove();
          waStatus.textContent = "en línea";
        } else await wait(reduced ? 200 : 900);
        const m = document.createElement("div");
        m.className = `msg ${kind}`;
        m.innerHTML = text;
        chat.appendChild(m);
        while (chat.scrollHeight > chat.clientHeight && chat.children.length > 1) chat.firstElementChild.remove();
      }
      await wait(4500);
    }
  }
  onView(chat, runChat);

  /* ---------- Demo voz ---------- */
  const wave = $("#wave");
  wave.innerHTML = "<i></i>".repeat(32);
  const bars = $$("i", wave);
  const orb = $("#orb");
  const tr = $("#transcript");
  const callTime = $("#call-time");
  const lines = [
    ["ai", "Hola Martín, te llamo de Créditos Norte. ¿Tenés un minuto?"],
    ["hu", "Sí, decime."],
    ["ai", "Tu cuota 4 venció el lunes. ¿Te mando el link para pagarla hoy?"],
    ["hu", "Puedo el viernes, cobro ese día."],
    ["ai", "Perfecto, lo dejo agendado para el viernes y te mando el link por WhatsApp. ¡Gracias!"],
  ];
  let speaking = null;
  function animateWave() {
    bars.forEach((b, i) => {
      const amp = speaking ? (speaking === "ai" ? 30 : 18) : 4;
      b.style.height = `${4 + Math.abs(Math.sin(Date.now() / 140 + i * 0.6)) * amp * Math.random()}px`;
      b.style.background = speaking === "ai" ? "var(--accent)" : "var(--ink-3)";
    });
    orb.style.transform = `scale(${speaking === "ai" ? 1 + Math.random() * 0.08 : 0.94})`;
    if (!reduced) setTimeout(animateWave, 110);
  }
  async function runCall() {
    if (!reduced) animateWave();
    while (true) {
      tr.innerHTML = "";
      const t0 = Date.now();
      const timer = setInterval(() => {
        const s = Math.floor((Date.now() - t0) / 1000);
        callTime.textContent = `00:${String(s).padStart(2, "0")}`;
      }, 500);
      for (const [who, text] of lines) {
        speaking = who;
        const d = document.createElement("div");
        d.className = who;
        d.innerHTML = `<span class="who">${who === "ai" ? "Agente" : "Cliente"}</span>${text}`;
        tr.appendChild(d);
        while (tr.children.length > 3 || (tr.scrollHeight > tr.clientHeight && tr.children.length > 1)) tr.firstElementChild.remove();
        await wait(reduced ? 300 : 900 + text.length * 32);
        speaking = null;
        await wait(450);
      }
      clearInterval(timer);
      const d = document.createElement("div");
      d.innerHTML = `<span class="who" style="color:var(--ok)">CRM</span>Promesa de pago: viernes · recordatorio programado`;
      tr.appendChild(d);
      while (tr.children.length > 3) tr.firstElementChild.remove();
      await wait(4500);
    }
  }
  onView(tr, runCall);

  /* ---------- Dashboard en vivo ---------- */
  const fmt = (n, dec) => n.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const dash = $("#dash");
  let dashOn = false; // solo se actualiza mientras está en pantalla
  new IntersectionObserver(([en]) => { dashOn = en.isIntersecting; }, { threshold: 0.15 }).observe(dash);

  // Indicadores: cuentan hasta su valor y después siguen subiendo de a poco
  const kpis = $$(".kv").map((el) => ({
    el, val: 0, end: +el.dataset.count, dec: +(el.dataset.dec || 0),
    pre: el.dataset.prefix || "", suf: el.dataset.suffix || "",
    spark: Array.from({ length: 16 }, (_, i) => 8 + i * 1.1 + Math.random() * 6),
    path: el.parentElement.querySelector(".spark path"),
  }));
  const paintKpi = (k) => { k.el.textContent = k.pre + fmt(k.val, k.dec) + k.suf; };
  const paintSpark = (k) => {
    const max = Math.max(...k.spark), min = Math.min(...k.spark);
    k.path.setAttribute("d", k.spark.map((v, i) =>
      `${i ? "L" : "M"}${(i / (k.spark.length - 1)) * 100},${26 - ((v - min) / (max - min || 1)) * 22}`).join(" "));
  };
  kpis.forEach(paintSpark);

  // Gráfico: 24 puntos que se corren hacia la izquierda a medida que entran ventas nuevas
  const series = Array.from({ length: 24 }, (_, i) => 30 + i * 2.6 + Math.sin(i / 2) * 10 + Math.random() * 10);
  const ln = $("#chart-line"), ar = $("#chart-area"), dot = $("#chart-dot"), now = $("#chart-now");
  function paintChart() {
    const max = Math.max(...series) * 1.12;
    const pts = series.map((v, i) => [(i / (series.length - 1)) * 600, 160 - (v / max) * 150]);
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
    ln.setAttribute("d", d);
    ar.setAttribute("d", `${d} L600,160 L0,160 Z`);
    const last = pts.at(-1);
    dot.style.top = `${(last[1] / 160) * 100}%`;
    now.textContent = "$" + fmt(series.at(-1) * 1350, 0);
  }

  // Actividad: eventos que van entrando arriba
  const EVENTS = [
    ["wa", "Bot de WhatsApp", () => `Cerró una venta · $${fmt(18 + Math.random() * 90, 0)}.000`],
    ["voz", "Agente de voz", () => `Promesa de pago · cuota ${1 + Math.floor(Math.random() * 11)}/12`],
    ["turno", "Turnos", () => `Confirmó turno · ${["lun", "mar", "mié", "jue", "vie"][Math.floor(Math.random() * 5)]} ${9 + Math.floor(Math.random() * 9)}:${Math.random() < 0.5 ? "00" : "30"}`],
    ["doc", "Documentos", () => `Leyó ${2 + Math.floor(Math.random() * 9)} facturas`],
    ["crm", "CRM", () => `Lead calificado · ${["Instagram", "WhatsApp", "web"][Math.floor(Math.random() * 3)]}`],
    ["wa", "Bot de WhatsApp", () => `Respondió en ${2 + Math.floor(Math.random() * 7)} s`],
  ];
  const activity = $("#activity");
  function pushEvent(animate = true) {
    const [kind, who, text] = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    const li = document.createElement("li");
    li.className = `ev ev-${kind}${animate ? " in" : ""}`;
    li.innerHTML = `<i></i><div><b>${who}</b><span>${text()}</span></div><time>ahora</time>`;
    activity.prepend(li);
    $$("time", activity).forEach((t, i) => { if (i) t.textContent = `hace ${i * 3} s`; });
    while (activity.children.length > 7) activity.lastElementChild.remove();
  }

  function startDash() {
    // Entrada: cuenta los números y dibuja el gráfico
    const t0 = performance.now();
    const intro = (tNow) => {
      const p = Math.min(1, (tNow - t0) / 1600), e = 1 - Math.pow(1 - p, 3);
      kpis.forEach((k) => { k.val = k.end * e; paintKpi(k); });
      if (p < 1) requestAnimationFrame(intro);
    };
    requestAnimationFrame(intro);
    paintChart();
    const len = ln.getTotalLength();
    ln.style.strokeDasharray = len; ln.style.strokeDashoffset = len;
    ln.getBoundingClientRect();
    ln.style.transition = "stroke-dashoffset 1.6s cubic-bezier(.2,.8,.2,1)";
    ln.style.strokeDashoffset = 0;
    setTimeout(() => { ln.style.transition = ""; ln.style.strokeDasharray = ""; ln.style.strokeDashoffset = ""; }, 1700);
    for (let i = 0; i < 5; i++) pushEvent(false);

    // Después, en vivo
    setInterval(() => {
      if (!dashOn) return;
      pushEvent();
      const k = kpis[Math.floor(Math.random() * kpis.length)];
      k.val += k.dec ? 0.1 : 1 + Math.floor(Math.random() * 3);
      paintKpi(k);
      k.el.classList.remove("bump"); k.el.offsetWidth; k.el.classList.add("bump");
      k.spark.push(k.spark.at(-1) + Math.random() * 4 - 1); k.spark.shift(); paintSpark(k);
    }, 2200);
    setInterval(() => {
      if (!dashOn) return;
      series.push(Math.max(20, series.at(-1) + (Math.random() * 22 - 8))); series.shift();
      paintChart();
    }, 1400);
  }
  onView($(".kpis"), startDash);

  /* ---------- Calculadora ROI ---------- */
  const r = { people: $("#r-people"), hours: $("#r-hours"), cost: $("#r-cost"), auto: $("#r-auto") };
  const usd = (n) => "US$ " + Math.round(n).toLocaleString("es-AR");
  let lastSaving = "";
  function calc() {
    const p = +r.people.value, h = +r.hours.value, c = +r.cost.value, a = +r.auto.value / 100;
    $("#o-people").textContent = p;
    $("#o-hours").textContent = `${h} h`;
    $("#o-cost").textContent = `US$ ${c}`;
    $("#o-auto").textContent = `${Math.round(a * 100)}%`;
    const hoursMonth = p * h * 4.33 * a;
    const month = hoursMonth * c;
    $("#roi-hours").textContent = `${Math.round(hoursMonth).toLocaleString("es-AR")} h`;
    $("#roi-month").textContent = usd(month);
    $("#roi-year").textContent = usd(month * 12);
    lastSaving = `${usd(month * 12)}/año (${Math.round(hoursMonth)} h/mes)`;
  }
  Object.values(r).forEach((i) => i.addEventListener("input", calc));
  calc();

  /* ---------- Formulario ---------- */
  const form = $("#lead-form");
  const msg = $("#form-msg");
  const sb = cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (data.web) return; // honeypot anti-spam
    if (!data.nombre.trim() || !data.whatsapp.trim() || !data.problema.trim()) {
      msg.className = "form-msg err"; msg.textContent = "Completá nombre, WhatsApp y qué querés resolver.";
      return;
    }
    const btn = form.querySelector("button");
    btn.disabled = true;
    const lead = { nombre: data.nombre, whatsapp: data.whatsapp, empresa: data.empresa, rubro: data.rubro,
      problema: data.problema, ahorro_estimado: lastSaving, origen: location.href };

    if (sb) {
      const { error } = await sb.from("leads").insert(lead);
      btn.disabled = false;
      if (error) { msg.className = "form-msg err"; msg.textContent = "No pudimos enviarlo. Escribinos por WhatsApp."; return; }
      form.reset();
      msg.className = "form-msg ok"; msg.textContent = "¡Listo! Te escribimos por WhatsApp en menos de 24 h.";
    } else {
      // Sin Supabase configurado: abre WhatsApp con el pedido armado
      const text = `Hola! Soy ${lead.nombre}${lead.empresa ? ` de ${lead.empresa}` : ""} (${lead.rubro}).\nQuiero resolver: ${lead.problema}`;
      open(waUrl(text), "_blank", "noopener");
      btn.disabled = false;
      msg.className = "form-msg ok"; msg.textContent = "Te abrimos WhatsApp con tu consulta lista para enviar.";
    }
  });
})();

