// Catalogo base de la tienda
const products = [
  { id: 1, name: "Audifonos", price: 39.99 },
  { id: 2, name: "Teclado Mecanico", price: 59.5 },
  { id: 3, name: "Mouse Inalambrico", price: 24.9 },
  { id: 4, name: "Monitor 24\"", price: 189.0 },
  { id: 5, name: "Webcam HD", price: 42.75 },
  { id: 6, name: "USB 64GB", price: 12.4 }
];

const productList = document.getElementById("productList");
const cartItems = document.getElementById("cartItems");
const totalAmount = document.getElementById("totalAmount");
const clearCartBtn = document.getElementById("clearCart");
const paymentForm = document.getElementById("paymentForm");
const paymentMessage = document.getElementById("paymentMessage");
const generatePdfBtn = document.getElementById("generatePdf");
const themeToggleBtn = document.getElementById("themeToggle");

let cart = [];
let paymentValidated = false;

// Renderiza las tarjetas de producto con su boton de agregar
function renderProducts() {
  productList.innerHTML = "";

  products.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";

    card.innerHTML = `
      <h3>${product.name}</h3>
      <p class="price">$${product.price.toFixed(2)}</p>
      <button class="btn primary" type="button" data-id="${product.id}">Agregar al carrito</button>
    `;

    productList.appendChild(card);
  });
}

// Muestra el contenido del carrito y calcula el total a pagar
function renderCart() {
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "Tu carrito esta vacio";
    cartItems.appendChild(empty);
  } else {
    cart.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "cart-item";
      li.innerHTML = `
        <span>${item.name} - $${item.price.toFixed(2)}</span>
        <button class="btn secondary" type="button" data-remove="${index}">Quitar</button>
      `;
      cartItems.appendChild(li);
    });
  }

  const total = cart.reduce((sum, item) => sum + item.price, 0);
  totalAmount.textContent = `$${total.toFixed(2)}`;

  // Solo permitimos PDF cuando ya se valido el pago y hay productos
  generatePdfBtn.disabled = !paymentValidated || cart.length === 0;
}

// Agrega producto al carrito por su id
function addToCart(id) {
  const found = products.find((p) => p.id === id);
  if (!found) return;

  cart.push(found);
  paymentValidated = false;
  paymentMessage.textContent = "Se agrego un producto. Debes validar el pago nuevamente.";
  paymentMessage.className = "message";
  renderCart();
}

// Elimina un producto especifico del carrito por indice
function removeFromCart(index) {
  cart.splice(index, 1);
  paymentValidated = false;
  paymentMessage.textContent = "El carrito cambio. Debes validar el pago nuevamente.";
  paymentMessage.className = "message";
  renderCart();
}

// Valida datos basicos de pago (demo local, no procesa cobros reales)
function validatePayment(name, number, expiry, cvv) {
  if (!name.trim() || cart.length === 0) {
    return "Ingresa nombre y agrega al menos un producto.";
  }

  // Limpiamos espacios para validar solo digitos de tarjeta
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

// Genera un recibo PDF simple con detalle de productos y total
function generateReceiptPdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const date = new Date().toLocaleString("es-GT");
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  doc.setFontSize(18);
  doc.text("Recibo de Compra", 14, 18);

  doc.setFontSize(11);
  doc.text(`Fecha: ${date}`, 14, 28);
  doc.text("Productos:", 14, 38);

  let y = 46;
  cart.forEach((item, i) => {
    doc.text(`${i + 1}. ${item.name} - $${item.price.toFixed(2)}`, 14, y);
    y += 8;
  });

  doc.setFontSize(13);
  doc.text(`Total pagado: $${total.toFixed(2)}`, 14, y + 6);
  doc.save("recibo-tienda.pdf");
}

// Evento delegado para agregar/quitar productos
document.addEventListener("click", (event) => {
  const addId = event.target.dataset.id;
  const removeIndex = event.target.dataset.remove;

  if (addId) {
    addToCart(Number(addId));
  }

  if (removeIndex !== undefined) {
    removeFromCart(Number(removeIndex));
  }
});

// Vacia todo el carrito y reinicia el estado de pago
clearCartBtn.addEventListener("click", () => {
  cart = [];
  paymentValidated = false;
  paymentMessage.textContent = "Carrito vaciado.";
  paymentMessage.className = "message";
  renderCart();
});

// Valida pago al enviar el formulario
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

// Genera PDF solo si el pago fue validado
generatePdfBtn.addEventListener("click", () => {
  if (!paymentValidated || cart.length === 0) return;
  generateReceiptPdf();
});

// Alterna tema claro/oscuro y cambia el texto del boton
themeToggleBtn.addEventListener("click", () => {
  const body = document.body;
  const nextTheme = body.dataset.theme === "light" ? "dark" : "light";
  body.dataset.theme = nextTheme;
  themeToggleBtn.textContent = nextTheme === "light" ? "Modo Oscuro" : "Modo Claro";
});

// Render inicial
renderProducts();
renderCart();
