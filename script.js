// ==============================
// Tienda Nova - Logica principal
// ==============================
// Este archivo controla:
// 1) Render de productos y carrito.
// 2) Cambio de moneda GTQ/USD.
// 3) Validacion de pago de la simulacion.
// 4) Vista previa de imagenes.
// 5) Generacion de recibo PDF completo con respaldo local.

// Catalogo de productos.
// NOTA: Los precios se guardan siempre en GTQ para evitar errores de conversion acumulada.
const products = [
  { id: 1, name: "Audifonos Bluetooth", priceGTQ: 320, image: "assets/productos/audifonos-bluetooth.svg" },
  { id: 2, name: "Teclado Mecanico RGB", priceGTQ: 480, image: "assets/productos/teclado-mecanico-rgb.svg" },
  { id: 3, name: "Mouse Inalambrico", priceGTQ: 195, image: "assets/productos/mouse-inalambrico.svg" },
  { id: 4, name: "Monitor 24 pulgadas", priceGTQ: 1420, image: "assets/productos/monitor-24.svg" },
  { id: 5, name: "Webcam Full HD", priceGTQ: 330, image: "assets/productos/webcam-full-hd.svg" },
  { id: 6, name: "Memoria USB 128GB", priceGTQ: 140, image: "assets/productos/usb-128gb.svg" },
  { id: 7, name: "Laptop 15 pulgadas", priceGTQ: 5890, image: "assets/productos/laptop-15.svg" },
  { id: 8, name: "Silla Ergonomica", priceGTQ: 1290, image: "assets/productos/silla-ergonomica.svg" },
  { id: 9, name: "Disco SSD 1TB", priceGTQ: 760, image: "assets/productos/ssd-1tb.svg" },
  { id: 10, name: "Smartwatch", priceGTQ: 890, image: "assets/productos/smartwatch.svg" },
  { id: 11, name: "Altavoz Portatil", priceGTQ: 275, image: "assets/productos/altavoz-portatil.svg" },
  { id: 12, name: "Hub USB-C", priceGTQ: 220, image: "assets/productos/hub-usbc.svg" }
];

// Tipo de cambio para simulacion.
// 1 USD = 7.80 GTQ.
const USD_RATE = 7.8;

// Referencias a elementos del DOM.
const productList = document.getElementById("productList");
const cartItems = document.getElementById("cartItems");
const totalAmount = document.getElementById("totalAmount");
const clearCartBtn = document.getElementById("clearCart");
const paymentForm = document.getElementById("paymentForm");
const paymentMessage = document.getElementById("paymentMessage");
const generatePdfBtn = document.getElementById("generatePdf");
const themeToggleBtn = document.getElementById("themeToggle");
const currencySelect = document.getElementById("currencySelect");
const previewModal = document.getElementById("previewModal");
const previewImage = document.getElementById("previewImage");
const previewTitle = document.getElementById("previewTitle");
const closePreviewBtn = document.getElementById("closePreview");

// Estado global de la interfaz.
let cart = [];
let paymentValidated = false;
let currency = "GTQ";
let lastPaymentData = null;

// Convierte un monto en GTQ a la moneda visible y lo devuelve formateado.
function formatPrice(amountGTQ, selectedCurrency = currency) {
  if (selectedCurrency === "USD") {
    const valueUSD = amountGTQ / USD_RATE;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(valueUSD);
  }

  return new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" }).format(amountGTQ);
}

// Calcula el total del carrito en GTQ (moneda base interna).
function getCartTotalGTQ() {
  return cart.reduce((sum, item) => sum + item.priceGTQ, 0);
}

// Agrupa productos repetidos para mostrar cantidad y subtotal.
function getCartSummary() {
  const map = new Map();

  cart.forEach((item) => {
    const current = map.get(item.id);

    if (current) {
      current.qty += 1;
      current.subtotalGTQ += item.priceGTQ;
    } else {
      map.set(item.id, {
        id: item.id,
        name: item.name,
        qty: 1,
        unitPriceGTQ: item.priceGTQ,
        subtotalGTQ: item.priceGTQ
      });
    }
  });

  return Array.from(map.values());
}

// Enmascara tarjeta para no exponer todos los digitos en el recibo.
function maskCardNumber(number) {
  const digits = number.replace(/\s+/g, "");
  const last4 = digits.slice(-4);
  return `**** **** **** ${last4}`;
}

// Escapa caracteres especiales para escribir texto seguro dentro de un PDF manual.
function escapePdfText(text) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

// Crea y descarga un archivo desde memoria.
function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Genera un PDF basico sin librerias externas.
// Este respaldo se usa cuando jsPDF no puede cargarse.
function generatePdfFallback(lines, filename) {
  const stream = [];
  let y = 800;

  stream.push("BT");
  stream.push("/F1 11 Tf");

  lines.forEach((line) => {
    if (y < 40) return;
    stream.push(`1 0 0 1 40 ${y} Tm (${escapePdfText(line)}) Tj`);
    y -= 16;
  });

  stream.push("ET");

  const contentStream = stream.join("\n");
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj",
    `4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj"
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((obj) => {
    offsets.push(pdf.length);
    pdf += `${obj}\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  downloadBlob(filename, blob);
}

// Dibuja las tarjetas de productos en el grid principal.
function renderProducts() {
  productList.innerHTML = "";

  products.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";

    card.innerHTML = `
      <img class="product-image" src="${product.image}" alt="${product.name}" data-preview="${product.id}" loading="lazy" />
      <div class="product-body">
        <h3 class="product-name">${product.name}</h3>
        <p class="price">${formatPrice(product.priceGTQ)}</p>
        <button class="btn primary" type="button" data-id="${product.id}">Agregar al carrito</button>
      </div>
    `;

    productList.appendChild(card);
  });
}

// Actualiza la vista del carrito y el total.
function renderCart() {
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "Tu carrito esta vacio.";
    cartItems.appendChild(empty);
  } else {
    cart.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "cart-item";
      li.innerHTML = `
        <span>${item.name} - ${formatPrice(item.priceGTQ)}</span>
        <button class="btn secondary" type="button" data-remove="${index}">Quitar</button>
      `;
      cartItems.appendChild(li);
    });
  }

  totalAmount.textContent = formatPrice(getCartTotalGTQ());

  // El PDF solo se habilita si ya existe pago validado y carrito con productos.
  generatePdfBtn.disabled = !paymentValidated || cart.length === 0;
}

// Agrega un producto al carrito y fuerza nueva validacion de pago.
function addToCart(id) {
  const found = products.find((p) => p.id === id);
  if (!found) return;

  cart.push(found);
  paymentValidated = false;
  lastPaymentData = null;
  paymentMessage.textContent = "Se agrego un producto. Debes validar el pago nuevamente.";
  paymentMessage.className = "message";
  renderCart();
}

// Elimina un producto del carrito por posicion y reinicia validacion de pago.
function removeFromCart(index) {
  cart.splice(index, 1);
  paymentValidated = false;
  lastPaymentData = null;
  paymentMessage.textContent = "El carrito cambio. Debes validar el pago nuevamente.";
  paymentMessage.className = "message";
  renderCart();
}

// Valida los datos de pago con reglas minimas para simulacion.
function validatePayment(name, number, expiry, cvv) {
  if (!name.trim() || cart.length === 0) {
    return "Ingresa nombre y agrega al menos un producto.";
  }

  const digits = number.replace(/\s+/g, "");
  if (!/^\d{16}$/.test(digits)) {
    return "La tarjeta debe tener 16 digitos.";
  }

  if (!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(expiry)) {
    return "La fecha debe tener formato MM/AA.";
  }

  const [monthStr, yearStr] = expiry.split("/");
  const month = Number(monthStr);
  const year = Number(`20${yearStr}`);
  const now = new Date();
  const expiryDate = new Date(year, month);

  if (expiryDate <= now) {
    return "La tarjeta esta vencida.";
  }

  if (!/^\d{3,4}$/.test(cvv)) {
    return "El CVV debe tener 3 o 4 digitos.";
  }

  return null;
}

// Escribe una linea en el PDF y crea nueva pagina cuando no hay espacio.
function writePdfLine(doc, text, y, options = {}) {
  const left = options.left ?? 14;
  const step = options.step ?? 7;
  const limit = options.limit ?? 282;

  if (y > limit) {
    doc.addPage();
    y = 20;
  }

  doc.text(text, left, y);
  return y + step;
}

// Prepara todas las lineas informativas del recibo.
function buildReceiptLines(orderNumber, issuedAtText, summary, totalGTQ) {
  const lines = [];
  lines.push("Recibo de Compra - Tienda Nova");
  lines.push(`No. de orden: ${orderNumber}`);
  lines.push(`Fecha y hora: ${issuedAtText}`);
  lines.push(`Moneda visual seleccionada: ${currency}`);
  lines.push(`Tipo de cambio usado: 1 USD = ${USD_RATE.toFixed(2)} GTQ`);

  if (lastPaymentData) {
    lines.push("Datos del cliente y pago:");
    lines.push(`Titular: ${lastPaymentData.name}`);
    lines.push(`Tarjeta: ${lastPaymentData.maskedCard}`);
    lines.push(`Vencimiento: ${lastPaymentData.expiry}`);
  }

  lines.push("Detalle de productos:");

  summary.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.name} | Cantidad: ${item.qty} | Unitario: ${formatPrice(item.unitPriceGTQ)} | Subtotal: ${formatPrice(item.subtotalGTQ)}`);
  });

  lines.push(`Total en GTQ: ${formatPrice(totalGTQ, "GTQ")}`);
  lines.push(`Total en USD: ${formatPrice(totalGTQ, "USD")}`);
  lines.push(`Total pagado (${currency}): ${formatPrice(totalGTQ, currency)}`);

  return lines;
}

// Genera un PDF completo con detalle de compra, pago y totales.
// Si jsPDF no esta disponible, utiliza un generador PDF de respaldo.
function generateReceiptPdf() {
  const orderNumber = `NV-${Date.now()}`;
  const issuedAt = new Date();
  const issuedAtText = issuedAt.toLocaleString("es-GT");
  const summary = getCartSummary();
  const totalGTQ = getCartTotalGTQ();
  const lines = buildReceiptLines(orderNumber, issuedAtText, summary, totalGTQ);

  if (window.jspdf && window.jspdf.jsPDF) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Recibo de Compra - Tienda Nova", 14, 18);

    doc.setFontSize(11);
    let y = 30;

    lines.slice(1).forEach((line) => {
      y = writePdfLine(doc, line, y);
    });

    doc.save(`recibo-${orderNumber}.pdf`);
    paymentMessage.textContent = "Recibo PDF generado correctamente.";
    paymentMessage.className = "message ok";
    return;
  }

  // Respaldo: genera un PDF basico aun si jsPDF no cargo.
  generatePdfFallback(lines, `recibo-${orderNumber}.pdf`);
  paymentMessage.textContent = "Recibo PDF generado con el modo de respaldo local.";
  paymentMessage.className = "message ok";
}

// Abre el modal de vista previa para la imagen del producto seleccionado.
function openPreview(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;

  previewImage.src = product.image;
  previewImage.alt = `Vista previa de ${product.name}`;
  previewTitle.textContent = product.name;

  if (typeof previewModal.showModal === "function") {
    previewModal.showModal();
  }
}

// Cierra el modal de vista previa.
function closePreview() {
  if (previewModal.open) {
    previewModal.close();
  }
}

// Delegacion de eventos para botones creados dinamicamente.
document.addEventListener("click", (event) => {
  const addId = event.target.dataset.id;
  const removeIndex = event.target.dataset.remove;
  const previewId = event.target.dataset.preview;

  if (addId) {
    addToCart(Number(addId));
  }

  if (removeIndex !== undefined) {
    removeFromCart(Number(removeIndex));
  }

  if (previewId) {
    openPreview(Number(previewId));
  }
});

// Vacia carrito completo y limpia estado de validacion.
clearCartBtn.addEventListener("click", () => {
  cart = [];
  paymentValidated = false;
  lastPaymentData = null;
  paymentMessage.textContent = "Carrito vaciado.";
  paymentMessage.className = "message";
  renderCart();
});

// Cambia moneda visible y vuelve a pintar productos + carrito.
currencySelect.addEventListener("change", (event) => {
  currency = event.target.value;
  renderProducts();
  renderCart();
});

// Formatea entrada de tarjeta: 1234 5678 9012 3456.
document.getElementById("cardNumber").addEventListener("input", (event) => {
  const digits = event.target.value.replace(/\D/g, "").slice(0, 16);
  event.target.value = digits.replace(/(.{4})/g, "$1 ").trim();
});

// Formatea vencimiento: MM/AA.
document.getElementById("cardExpiry").addEventListener("input", (event) => {
  const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) {
    event.target.value = `${digits.slice(0, 2)}/${digits.slice(2)}`;
  } else {
    event.target.value = digits;
  }
});

// CVV solo numerico de 3 a 4 digitos.
document.getElementById("cardCvv").addEventListener("input", (event) => {
  event.target.value = event.target.value.replace(/\D/g, "").slice(0, 4);
});

// Valida el pago y guarda datos necesarios para el recibo PDF.
paymentForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.getElementById("cardName").value;
  const number = document.getElementById("cardNumber").value;
  const expiry = document.getElementById("cardExpiry").value;
  const cvv = document.getElementById("cardCvv").value;

  const error = validatePayment(name, number, expiry, cvv);

  if (error) {
    paymentValidated = false;
    lastPaymentData = null;
    paymentMessage.textContent = error;
    paymentMessage.className = "message error";
  } else {
    paymentValidated = true;

    // Guardamos un resumen seguro de pago para usarlo en el PDF.
    lastPaymentData = {
      name: name.trim(),
      maskedCard: maskCardNumber(number),
      expiry
    };

    paymentMessage.textContent = "Pago validado correctamente (simulacion local).";
    paymentMessage.className = "message ok";
  }

  renderCart();
});

// Genera recibo solo cuando existe pago validado.
generatePdfBtn.addEventListener("click", () => {
  if (!paymentValidated || cart.length === 0) return;
  generateReceiptPdf();
});

// Cambia entre tema claro y oscuro.
themeToggleBtn.addEventListener("click", () => {
  const nextTheme = document.body.dataset.theme === "light" ? "dark" : "light";
  document.body.dataset.theme = nextTheme;
  themeToggleBtn.textContent = nextTheme === "light" ? "Modo Oscuro" : "Modo Claro";
});

// Cierra el modal con boton o haciendo clic fuera del contenido.
closePreviewBtn.addEventListener("click", closePreview);
previewModal.addEventListener("click", (event) => {
  const rect = previewModal.getBoundingClientRect();
  const inside = rect.top <= event.clientY && event.clientY <= rect.bottom
    && rect.left <= event.clientX && event.clientX <= rect.right;

  if (!inside) {
    closePreview();
  }
});

// Render inicial de la aplicacion.
renderProducts();
renderCart();
