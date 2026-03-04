// Lista de productos de la tienda. Los precios base se guardan en quetzales (GTQ).
const products = [
  { id: 1, name: "Audifonos Bluetooth", priceGTQ: 320, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80" },
  { id: 2, name: "Teclado Mecanico RGB", priceGTQ: 480, image: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=900&q=80" },
  { id: 3, name: "Mouse Inalambrico", priceGTQ: 195, image: "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=80" },
  { id: 4, name: "Monitor 24 pulgadas", priceGTQ: 1420, image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80" },
  { id: 5, name: "Webcam Full HD", priceGTQ: 330, image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80" },
  { id: 6, name: "Memoria USB 128GB", priceGTQ: 140, image: "https://images.unsplash.com/photo-1587033411391-5d9e51cce126?auto=format&fit=crop&w=900&q=80" },
  { id: 7, name: "Laptop 15 pulgadas", priceGTQ: 5890, image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80" },
  { id: 8, name: "Silla Ergonomica", priceGTQ: 1290, image: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=900&q=80" },
  { id: 9, name: "Disco SSD 1TB", priceGTQ: 760, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=900&q=80" },
  { id: 10, name: "Smartwatch", priceGTQ: 890, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80" },
  { id: 11, name: "Altavoz Portatil", priceGTQ: 275, image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=900&q=80" },
  { id: 12, name: "Hub USB-C", priceGTQ: 220, image: "https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?auto=format&fit=crop&w=900&q=80" }
];

// Tipo de cambio fijo para simulacion: 1 USD = 7.80 GTQ.
const USD_RATE = 7.8;

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

let cart = [];
let paymentValidated = false;
let currency = "GTQ";

// Convierte un monto guardado en quetzales al formato de moneda seleccionado.
function formatPrice(amountGTQ) {
  if (currency === "USD") {
    const valueUSD = amountGTQ / USD_RATE;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(valueUSD);
  }

  return new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" }).format(amountGTQ);
}

// Crea el grid de productos con imagen, nombre, precio y botones de acciones.
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

// Dibuja el carrito, total y estado del boton de recibo.
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

  const totalGTQ = cart.reduce((sum, item) => sum + item.priceGTQ, 0);
  totalAmount.textContent = formatPrice(totalGTQ);
  generatePdfBtn.disabled = !paymentValidated || cart.length === 0;
}

// Agrega un producto al carrito por id.
function addToCart(id) {
  const found = products.find((p) => p.id === id);
  if (!found) return;

  cart.push(found);
  paymentValidated = false;
  paymentMessage.textContent = "Se agrego un producto. Debes validar el pago nuevamente.";
  paymentMessage.className = "message";
  renderCart();
}

// Quita un producto del carrito usando su indice visual.
function removeFromCart(index) {
  cart.splice(index, 1);
  paymentValidated = false;
  paymentMessage.textContent = "El carrito cambio. Debes validar el pago nuevamente.";
  paymentMessage.className = "message";
  renderCart();
}

// Verifica datos de pago con reglas basicas para simulacion local.
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

// Construye y descarga un PDF de recibo con detalle de compra.
function generateReceiptPdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const totalGTQ = cart.reduce((sum, item) => sum + item.priceGTQ, 0);

  doc.setFontSize(18);
  doc.text("Recibo de Compra - Tienda Nova", 14, 18);

  doc.setFontSize(11);
  doc.text(`Fecha: ${new Date().toLocaleString("es-GT")}`, 14, 28);
  doc.text(`Moneda seleccionada: ${currency}`, 14, 36);
  doc.text("Productos:", 14, 46);

  let y = 54;
  cart.forEach((item, i) => {
    doc.text(`${i + 1}. ${item.name} - ${formatPrice(item.priceGTQ)}`, 14, y);
    y += 8;
  });

  doc.setFontSize(13);
  doc.text(`Total pagado: ${formatPrice(totalGTQ)}`, 14, y + 6);
  doc.save("recibo-tienda-nova.pdf");
}

// Abre modal para vista previa de imagen del producto.
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

// Cierra la vista previa si el modal esta abierto.
function closePreview() {
  if (previewModal.open) {
    previewModal.close();
  }
}

// Delegacion de eventos para botones dinamicos de productos y carrito.
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

// Limpia carrito completo y reinicia estado de pago.
clearCartBtn.addEventListener("click", () => {
  cart = [];
  paymentValidated = false;
  paymentMessage.textContent = "Carrito vaciado.";
  paymentMessage.className = "message";
  renderCart();
});

// Cambia la moneda visible y vuelve a pintar precios y total.
currencySelect.addEventListener("change", (event) => {
  currency = event.target.value;
  renderProducts();
  renderCart();
});

// Formatea automaticamente la tarjeta con espacios cada 4 digitos.
document.getElementById("cardNumber").addEventListener("input", (event) => {
  const digits = event.target.value.replace(/\D/g, "").slice(0, 16);
  event.target.value = digits.replace(/(.{4})/g, "$1 ").trim();
});

// Formatea automaticamente la fecha como MM/AA.
document.getElementById("cardExpiry").addEventListener("input", (event) => {
  const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) {
    event.target.value = `${digits.slice(0, 2)}/${digits.slice(2)}`;
  } else {
    event.target.value = digits;
  }
});

// Solo deja digitos en CVV.
document.getElementById("cardCvv").addEventListener("input", (event) => {
  event.target.value = event.target.value.replace(/\D/g, "").slice(0, 4);
});

// Ejecuta validacion de pago al enviar formulario.
paymentForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.getElementById("cardName").value;
  const number = document.getElementById("cardNumber").value;
  const expiry = document.getElementById("cardExpiry").value;
  const cvv = document.getElementById("cardCvv").value;

  const error = validatePayment(name, number, expiry, cvv);

  if (error) {
    paymentValidated = false;
    paymentMessage.textContent = error;
    paymentMessage.className = "message error";
  } else {
    paymentValidated = true;
    paymentMessage.textContent = "Pago validado correctamente (simulacion local).";
    paymentMessage.className = "message ok";
  }

  renderCart();
});

// Habilita descarga de recibo PDF solo si hay pago validado.
generatePdfBtn.addEventListener("click", () => {
  if (!paymentValidated || cart.length === 0) return;
  generateReceiptPdf();
});

// Alterna entre tema claro y oscuro.
themeToggleBtn.addEventListener("click", () => {
  const nextTheme = document.body.dataset.theme === "light" ? "dark" : "light";
  document.body.dataset.theme = nextTheme;
  themeToggleBtn.textContent = nextTheme === "light" ? "Modo Oscuro" : "Modo Claro";
});

// Cierre del modal de vista previa con boton o click en fondo.
closePreviewBtn.addEventListener("click", closePreview);
previewModal.addEventListener("click", (event) => {
  const rect = previewModal.getBoundingClientRect();
  const inside = rect.top <= event.clientY && event.clientY <= rect.bottom
    && rect.left <= event.clientX && event.clientX <= rect.right;

  if (!inside) {
    closePreview();
  }
});

// Render inicial de interfaz.
renderProducts();
renderCart();
