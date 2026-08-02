(function () {
  "use strict";

  // Configuración del organizador.
  // WHATSAPP: tu número en formato internacional, sin "+", espacios ni guiones.
  const CONFIG = {
    WHATSAPP: "543515957014"
  };

  const TOTAL = 3000;
  const MAX_POR_PERSONA = 10;
  const PRECIO = 3000;
  const JSON_URL = "data/numbers.json";

  const $ = (sel) => document.querySelector(sel);

  const el = {
    heroVendidos: $("#heroVendidos"),
    heroDisponibles: $("#heroDisponibles"),
    eligeDisponibles: $("#eligeDisponibles"),
    eligeNote: $("#eligeNote"),
    folioTopo: $("#folioTopo"),
    progressFill: $("#progressFill"),
    fNumero: $("#fNumero"),
    btnAgregar: $("#btnAgregar"),
    btnAzar: $("#btnAzar"),
    numError: $("#numError"),
    chips: $("#chips"),
    fNombre: $("#fNombre"),
    fTelefono: $("#fTelefono"),
    resumenNums: $("#resumen .resumen__nums"),
    resumenTotal: $("#resumen .resumen__total"),
    form: $("#rifaForm"),
    resultado: $("#resultado"),
    msgFinal: $("#msgFinal"),
    waLink: $("#waLink"),
    btnCopiar: $("#btnCopiar")
  };

  const fmtCLP = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  });

  let vendidos = 0;
  let elegidos = [];
  let vendidoSet = {};

  function esVendido(n) {
    return Boolean(vendidoSet[n]);
  }

  function updateCounters() {
    const disponibles = TOTAL - vendidos;
    el.heroVendidos.textContent = String(vendidos);
    el.heroDisponibles.textContent = String(disponibles);
    el.eligeDisponibles.textContent = String(disponibles);
    el.folioTopo.textContent = String(vendidos);
    el.progressFill.style.width = Math.round((vendidos / TOTAL) * 100) + "%";
  }

  function renderChips() {
    el.chips.innerHTML = "";
    elegidos.forEach(function (n) {
      const li = document.createElement("li");
      li.className = "chip";
      const span = document.createElement("span");
      span.textContent = String(n);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip__remove";
      btn.setAttribute("aria-label", "Quitar número " + n);
      btn.textContent = "\u00D7";
      btn.addEventListener("click", function () {
        elegidos = elegidos.filter(function (x) {
          return x !== n;
        });
        renderChips();
        updateResumen();
      });
      li.appendChild(span);
      li.appendChild(btn);
      el.chips.appendChild(li);
    });
  }

  function updateResumen() {
    if (elegidos.length === 0) {
      el.resumenNums.textContent = "Ningún número elegido";
      el.resumenTotal.textContent = "Total: $0";
      return;
    }
    const lista = elegidos.slice().sort(function (a, b) {
      return a - b;
    });
    el.resumenNums.textContent = "Números: " + lista.join(", ");
    el.resumenTotal.textContent = "Total: " + fmtCLP.format(elegidos.length * PRECIO);
  }

  function setError(msg) {
    el.numError.textContent = msg;
  }

  function agregarNumero(n) {
    if (!Number.isInteger(n) || n < 1 || n > TOTAL) {
      setError("Escribe un número entre 1 y 3000.");
      return;
    }
    if (esVendido(n)) {
      setError("El número " + n + " ya está vendido.");
      return;
    }
    if (elegidos.indexOf(n) !== -1) {
      setError("Ya agregaste el número " + n + ".");
      return;
    }
    if (elegidos.length >= MAX_POR_PERSONA) {
      setError("Máximo " + MAX_POR_PERSONA + " números por persona.");
      return;
    }
    elegidos.push(n);
    setError("");
    renderChips();
    updateResumen();
    el.fNumero.value = "";
    el.fNumero.focus();
  }

  function numeroAlAzar() {
    const disponibles = [];
    for (let i = 1; i <= TOTAL; i++) {
      if (!esVendido(i) && elegidos.indexOf(i) === -1) {
        disponibles.push(i);
      }
    }
    if (disponibles.length === 0) {
      setError("No quedan números disponibles.");
      return;
    }
    const n = disponibles[Math.floor(Math.random() * disponibles.length)];
    agregarNumero(n);
  }

  function construirMensaje() {
    const lista = elegidos.slice().sort(function (a, b) {
      return a - b;
    });
    return [
      "Hola, quiero participar en la Gran rifa",
      "",
      "Nombre: " + el.fNombre.value.trim(),
      "Teléfono: " + el.fTelefono.value.trim(),
      "Números elegidos: " + lista.join(", "),
      "Cantidad: " + elegidos.length + (elegidos.length === 1 ? " número" : " números"),
      "Total a pagar: " + fmtCLP.format(elegidos.length * PRECIO)
    ].join("\n");
  }

  function mostrarResultado() {
    const msg = construirMensaje();
    el.msgFinal.textContent = msg;
    el.resultado.hidden = false;
    el.waLink.href =
      "https://wa.me/" +
      CONFIG.WHATSAPP +
      "?text=" +
      encodeURIComponent(msg);
    el.resultado.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function copiarMensaje() {
    const msg = el.msgFinal.textContent;
    const done = function () {
      const original = el.btnCopiar.textContent;
      el.btnCopiar.textContent = "Copiado";
      setTimeout(function () {
        el.btnCopiar.textContent = original;
      }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).then(done, function () {
        copiarFallback(msg, done);
      });
    } else {
      copiarFallback(msg, done);
    }
  }

  function copiarFallback(texto, done) {
    const ta = document.createElement("textarea");
    ta.value = texto;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch (e) {
      /* noop */
    }
    document.body.removeChild(ta);
    done();
  }

  function cargarDatos() {
    return fetch(JSON_URL)
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        const nums = data.numeros;
        Object.keys(nums).forEach(function (key) {
          if (nums[key]) vendidoSet[Number(key)] = true;
        });
        vendidos = Object.keys(vendidoSet).length;
        updateCounters();
      })
      .catch(function (err) {
        console.error("No se pudo cargar " + JSON_URL, err);
        el.heroVendidos.textContent = "0";
        updateCounters();
        mostrarBanner(
          "No se pudo leer data/numbers.json. Abre el proyecto con un servidor local (python3 -m http.server) o súbelo a un hosting."
        );
      });
  }

  function mostrarBanner(texto) {
    const div = document.createElement("div");
    div.className = "noscript";
    div.textContent = texto;
    document.body.appendChild(div);
  }

  el.btnAgregar.addEventListener("click", function () {
    const n = parseInt(el.fNumero.value, 10);
    agregarNumero(n);
  });

  el.fNumero.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const n = parseInt(el.fNumero.value, 10);
      agregarNumero(n);
    }
  });

  el.btnAzar.addEventListener("click", numeroAlAzar);

  el.form.addEventListener("submit", function (e) {
    e.preventDefault();
    setError("");

    if (elegidos.length === 0) {
      setError("Agrega al menos un número.");
      el.fNumero.focus();
      return;
    }
    if (!el.fNombre.value.trim()) {
      el.fNombre.focus();
      el.fNombre.style.borderColor = "var(--red)";
      return;
    }
    if (!el.fTelefono.value.trim()) {
      el.fTelefono.focus();
      el.fTelefono.style.borderColor = "var(--red)";
      return;
    }
    mostrarResultado();
  });

  el.fNombre.addEventListener("input", function () {
    el.fNombre.style.borderColor = "";
  });
  el.fTelefono.addEventListener("input", function () {
    el.fTelefono.style.borderColor = "";
  });

  el.btnCopiar.addEventListener("click", copiarMensaje);

  cargarDatos();
})();
