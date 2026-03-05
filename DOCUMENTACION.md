# Documentacion del Proyecto - Tienda Nova

## 1. Archivo `index.html`
Este archivo define la estructura principal de la tienda web.

### Estructura general
- `head`:
  - Configura idioma (`es`), codificacion UTF-8 y viewport responsive.
  - Carga la fuente `Manrope` desde Google Fonts.
  - Enlaza el archivo de estilos `styles.css`.
- `body`:
  - Incluye toda la interfaz visible: encabezado, catalogo, carrito, formulario de pago y modal de vista previa.

### Partes importantes
- `header.topbar`:
  - Muestra marca/titulo (`Tienda Nova`).
  - Selector de moneda (`GTQ` / `USD`).
  - Boton para cambiar tema claro/oscuro.
- `main.layout`:
  - `section.products-section`: contenedor donde JavaScript renderiza las tarjetas de productos (`#productList`).
  - `aside.cart-panel`: panel del carrito con lista, total, boton vaciar, formulario de pago, mensajes y boton para generar PDF.
- `dialog#previewModal`:
  - Modal para ver imagen ampliada del producto seleccionado.

### Scripts cargados
- `jsPDF` desde CDN principal (`cdnjs`).
- Script de respaldo para cargar `jsPDF` desde `unpkg` si falla el CDN principal.
- `script.js` con toda la logica de la aplicacion.

---

## 2. Archivo `styles.css`
Este archivo controla toda la apariencia visual de la tienda.

### Sistema de tema
- Variables CSS en `:root`:
  - Define colores de fondo, texto, tarjetas, bordes y botones para modo claro.
- `body[data-theme="dark"]`:
  - Sobrescribe variables para modo oscuro.

### Layout y componentes
- `body`:
  - Aplica tipografia, fondo con degradados y altura minima completa.
- `.topbar`:
  - Encabezado fijo (sticky) con desenfoque y estilo moderno.
- `.layout`:
  - Distribuye contenido en dos columnas: productos (izquierda) y carrito (derecha).
- `.products-section`, `.cart-panel`:
  - Tarjetas grandes con borde redondeado y sombra.
- `.product-grid` y `.product-card`:
  - Grid responsive de productos con imagen y acciones.
- `.product-image`:
  - Define proporcion fija y `object-fit: cover` para buen recorte visual.
- `.btn` y variantes (`.primary`, `.secondary`, `.danger`, `.success`):
  - Estilos de botones por tipo de accion.
- `.message`:
  - Mensajes de estado para validacion y PDF (`ok` y `error`).
- `.preview-modal`:
  - Estilo del modal de vista previa y su fondo (`::backdrop`).

### Responsive
- `@media (max-width: 950px)`:
  - Convierte la pagina a una sola columna en pantallas pequenas.

---

## 3. Archivo `script.js`
Este archivo contiene la logica funcional completa de la tienda.

## 3.1 Datos base y estado
- `products`:
  - Catalogo de productos con `id`, `name`, `priceGTQ` e `image`.
  - Las imagenes apuntan a `assets/productos/*.svg`.
- `USD_RATE`:
  - Tipo de cambio fijo para conversion GTQ a USD.
- Variables de estado:
  - `cart`: productos agregados al carrito.
  - `paymentValidated`: indica si pago fue validado.
  - `currency`: moneda visible seleccionada.
  - `lastPaymentData`: datos seguros de pago para imprimir en recibo.

## 3.2 Funciones de soporte
- `formatPrice(amountGTQ, selectedCurrency)`:
  - Convierte/formatea montos a GTQ o USD.
- `getCartTotalGTQ()`:
  - Calcula total del carrito en moneda base.
- `getCartSummary()`:
  - Agrupa productos repetidos por cantidad y subtotal.
- `maskCardNumber(number)`:
  - Enmascara la tarjeta dejando visibles solo los ultimos 4 digitos.

## 3.3 Render de interfaz
- `renderProducts()`:
  - Dibuja tarjetas de productos en el grid.
- `renderCart()`:
  - Dibuja el contenido del carrito, calcula total y habilita/deshabilita PDF.

## 3.4 Flujo de carrito
- `addToCart(id)`:
  - Agrega producto al carrito y obliga a revalidar pago.
- `removeFromCart(index)`:
  - Elimina producto por posicion y obliga a revalidar pago.
- Boton `Vaciar carrito`:
  - Limpia carrito y estado de pago.

## 3.5 Validacion de pago
- `validatePayment(name, number, expiry, cvv)` valida:
  - Nombre no vacio.
  - Tarjeta de 16 digitos.
  - Fecha en formato `MM/AA` y no vencida.
  - CVV de 3 o 4 digitos.
- En `paymentForm.submit`:
  - Si hay error: muestra mensaje rojo.
  - Si es correcto: guarda datos para recibo y muestra mensaje verde.

## 3.6 Generacion de PDF
### Opcion principal
- Si `window.jspdf` existe:
  - Usa `jsPDF` para crear recibo con:
    - Orden
    - Fecha/hora
    - Moneda/tipo de cambio
    - Datos de cliente/pago
    - Detalle de productos (cantidad, unitario, subtotal)
    - Totales GTQ/USD y total pagado

### Opcion de respaldo
- Si `jsPDF` no carga:
  - `generatePdfFallback()` crea un PDF basico manualmente (sin libreria externa).
  - Esto evita que falle la descarga del recibo.

## 3.7 Modal y tema
- `openPreview(productId)` y `closePreview()`:
  - Controlan la vista previa de imagen de producto.
- Boton de tema:
  - Alterna entre modo claro y oscuro actualizando `data-theme`.

## 3.8 Eventos principales
- `document.click` (delegacion):
  - Maneja botones dinamicos de agregar, quitar y vista previa.
- Eventos `input`:
  - Formatean tarjeta, fecha y CVV mientras se escribe.

## 3.9 Inicio de la app
- Al final se ejecuta:
  - `renderProducts();`
  - `renderCart();`
  - Con esto la UI inicia lista para usar.

---

## 4. Relacion entre archivos
- `index.html` define estructura y enlaza scripts/estilos.
- `styles.css` aplica diseno y adaptabilidad.
- `script.js` agrega la logica interactiva (carrito, pago, PDF, tema, modal).
- `assets/productos/` contiene imagenes locales de cada producto.

---

## 5. Flujo de uso resumido
1. El usuario ve productos y selecciona moneda.
2. Agrega productos al carrito.
3. Valida pago con formulario.
4. Genera recibo PDF (con `jsPDF` o modo respaldo).
5. Puede vaciar carrito y seguir comprando.
