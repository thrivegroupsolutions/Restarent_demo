// ===== Demo Online Ordering (Cart + Checkout) =====

const MENU = {
  mains: [
    { id: "fishchips", name: "Fish & Chips", desc: "Beer battered cod, chips, tartar sauce", price: 12.95 },
    { id: "burger", name: "Classic Burger", desc: "British beef, cheddar, fries", price: 11.95 },
    { id: "pizza", name: "Margherita Pizza", desc: "Mozzarella, basil, tomato", price: 10.50 },
    { id: "roast", name: "Sunday Roast (demo)", desc: "Roast beef, potatoes, veg & gravy", price: 14.50 },
    { id: "pasta", name: "Creamy Chicken Pasta", desc: "Parmesan, garlic, herbs", price: 12.50 },
    { id: "salad", name: "Halloumi Salad", desc: "Mixed leaves, sweet chilli drizzle", price: 9.95 }
  ],
  sides: [
    { id: "fries", name: "Skin-on Fries", desc: "Sea salt, house seasoning", price: 3.50 },
    { id: "garlicbread", name: "Garlic Bread", desc: "Toasted, herb butter", price: 3.95 },
    { id: "coleslaw", name: "Coleslaw", desc: "Creamy slaw", price: 2.95 },
    { id: "wings", name: "Chicken Wings", desc: "BBQ or hot sauce", price: 5.95 }
  ],
  drinks: [
    { id: "cola", name: "Cola", desc: "330ml", price: 1.95 },
    { id: "lemonade", name: "Lemonade", desc: "330ml", price: 1.95 },
    { id: "water", name: "Still Water", desc: "500ml", price: 1.50 },
    { id: "coffee", name: "Coffee", desc: "Americano / Latte (demo)", price: 2.50 }
  ]
};

const cart = new Map(); // id -> {item, qty}

// Elements
const menuGrid = document.getElementById("menuGrid");
const cartCount = document.getElementById("cartCount");

const drawer = document.getElementById("drawer");
const drawerOverlay = document.getElementById("drawerOverlay");
const openCartBtn = document.getElementById("openCartBtn");
const closeCartBtn = document.getElementById("closeCartBtn");
const drawerItems = document.getElementById("drawerItems");
const drawerSubtotal = document.getElementById("drawerSubtotal");
const goCheckoutBtn = document.getElementById("goCheckoutBtn");

const summaryItems = document.getElementById("summaryItems");
const subtotalEl = document.getElementById("subtotal");
const deliveryFeeEl = document.getElementById("deliveryFee");
const totalEl = document.getElementById("total");
const clearCartBtn = document.getElementById("clearCartBtn");

const checkoutForm = document.getElementById("checkoutForm");
const orderType = document.getElementById("orderType");
const addressField = document.getElementById("addressField");
const addressInput = document.getElementById("address");

const modal = document.getElementById("modal");
const modalOverlay = document.getElementById("modalOverlay");
const confirmText = document.getElementById("confirmText");
const newOrderBtn = document.getElementById("newOrderBtn");

document.getElementById("year").textContent = new Date().getFullYear();

// Tabs
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    renderMenu(btn.dataset.cat);
  });
});

// Render menu cards
function renderMenu(cat = "mains") {
  const items = MENU[cat] || [];
  menuGrid.innerHTML = items.map(item => menuCardHTML(item)).join("");
  // hook buttons
  items.forEach(item => {
    const addBtn = document.getElementById(`add-${item.id}`);
    const minusBtn = document.getElementById(`minus-${item.id}`);
    const plusBtn = document.getElementById(`plus-${item.id}`);
    addBtn.addEventListener("click", () => addToCart(item));
    minusBtn.addEventListener("click", () => changeQty(item.id, -1));
    plusBtn.addEventListener("click", () => changeQty(item.id, +1));
    updateQtyUI(item.id);
  });
}

function menuCardHTML(item){
  return `
    <div class="menuCard">
      <div class="menuCard__title">${escapeHtml(item.name)}</div>
      <div class="menuCard__desc">${escapeHtml(item.desc)}</div>
      <div class="menuCard__price">£${item.price.toFixed(2)}</div>

      <div class="menuCard__actions">
        <button class="btn btn--primary" id="add-${item.id}" type="button">Add to cart</button>
        <div class="qtyPill">
          <button class="qtyBtn" id="minus-${item.id}" type="button">–</button>
          <span class="qtyNum" id="qty-${item.id}">0</span>
          <button class="qtyBtn" id="plus-${item.id}" type="button">+</button>
        </div>
      </div>
    </div>
  `;
}

function addToCart(item){
  const current = cart.get(item.id);
  if(current){
    current.qty += 1;
  } else {
    cart.set(item.id, { item, qty: 1 });
  }
  refreshCartUI();
  pulseCartCount();
  updateQtyUI(item.id);
}

function changeQty(id, delta){
  const current = cart.get(id);
  if(!current) return;
  current.qty += delta;
  if(current.qty <= 0){
    cart.delete(id);
  }
  refreshCartUI();
  updateQtyUI(id);
}

function updateQtyUI(id){
  const el = document.getElementById(`qty-${id}`);
  if(!el) return;
  const current = cart.get(id);
  el.textContent = current ? String(current.qty) : "0";
}

function getCounts(){
  let count = 0;
  cart.forEach(v => count += v.qty);
  return count;
}

function calcSubtotal(){
  let s = 0;
  cart.forEach(v => s += v.qty * v.item.price);
  return s;
}

function calcDeliveryFee(type){
  if(getCounts() === 0) return 0;
  // Demo fee
  return type === "delivery" ? 2.50 : 0;
}

function refreshCartUI(){
  const count = getCounts();
  cartCount.textContent = String(count);

  // Drawer items
  drawerItems.innerHTML = count === 0
    ? `<div class="muted">Your cart is empty.</div>`
    : Array.from(cart.values()).map(v => drawerItemHTML(v)).join("");

  // Drawer hooks
  Array.from(cart.values()).forEach(v => {
    const rm = document.getElementById(`rm-${v.item.id}`);
    rm.addEventListener("click", () => { cart.delete(v.item.id); refreshCartUI(); updateQtyUI(v.item.id); });
  });

  const sub = calcSubtotal();
  drawerSubtotal.textContent = money(sub);

  // Checkout summary
  summaryItems.innerHTML = count === 0
    ? `<div class="muted">Add items from the menu to see your order here.</div>`
    : Array.from(cart.values()).map(v => summaryItemHTML(v)).join("");

  Array.from(cart.values()).forEach(v => {
    const rm2 = document.getElementById(`rm2-${v.item.id}`);
    rm2.addEventListener("click", () => { cart.delete(v.item.id); refreshCartUI(); updateQtyUI(v.item.id); });
  });

  const dFee = calcDeliveryFee(orderType.value);
  subtotalEl.textContent = money(sub);
  deliveryFeeEl.textContent = money(dFee);
  totalEl.textContent = money(sub + dFee);

  // Enable/disable checkout button
  goCheckoutBtn.classList.toggle("is-disabled", count === 0);
  goCheckoutBtn.setAttribute("aria-disabled", count === 0 ? "true" : "false");
}

function drawerItemHTML(v){
  return `
    <div class="summaryItem">
      <div>
        <div class="summaryItem__name">${escapeHtml(v.item.name)}</div>
        <div class="summaryItem__meta">Qty: ${v.qty} • £${v.item.price.toFixed(2)} each</div>
        <button class="summaryItem__remove" id="rm-${v.item.id}" type="button">Remove</button>
      </div>
      <div class="summaryItem__right">
        <strong>${money(v.qty * v.item.price)}</strong>
      </div>
    </div>
  `;
}

function summaryItemHTML(v){
  return `
    <div class="summaryItem">
      <div>
        <div class="summaryItem__name">${escapeHtml(v.item.name)}</div>
        <div class="summaryItem__meta">Qty: ${v.qty} • £${v.item.price.toFixed(2)} each</div>
        <button class="summaryItem__remove" id="rm2-${v.item.id}" type="button">Remove</button>
      </div>
      <div class="summaryItem__right">
        <strong>${money(v.qty * v.item.price)}</strong>
      </div>
    </div>
  `;
}

function money(n){
  return `£${n.toFixed(2)}`;
}

function pulseCartCount(){
  cartCount.animate(
    [{ transform:"scale(1)" }, { transform:"scale(1.18)" }, { transform:"scale(1)" }],
    { duration: 280, easing: "ease-out" }
  );
}

// Drawer open/close
function openDrawer(){
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
}
function closeDrawer(){
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
}
openCartBtn.addEventListener("click", openDrawer);
closeCartBtn.addEventListener("click", closeDrawer);
drawerOverlay.addEventListener("click", closeDrawer);

// Delivery address toggle
function updateAddressVisibility(){
  const isDelivery = orderType.value === "delivery";
  addressField.style.display = isDelivery ? "grid" : "none";
  addressInput.required = isDelivery;
}
orderType.addEventListener("change", () => {
  updateAddressVisibility();
  refreshCartUI();
});
updateAddressVisibility();

// Clear cart
clearCartBtn.addEventListener("click", () => {
  cart.clear();
  refreshCartUI();
  // update qty numbers currently visible
  ["mains","sides","drinks"].forEach(cat => (MENU[cat]||[]).forEach(i => updateQtyUI(i.id)));
});

// Checkout submit
checkoutForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if(getCounts() === 0){
    alert("Your cart is empty. Please add items from the menu.");
    return;
  }

  const fd = new FormData(checkoutForm);
  const type = fd.get("orderType");
  const name = String(fd.get("fullName") || "").trim();
  const phone = String(fd.get("phone") || "").trim();
  const time = String(fd.get("time") || "").trim();
  const address = String(fd.get("address") || "").trim();
  const notes = String(fd.get("notes") || "").trim();

  const lines = [];
  lines.push(`Thanks, ${name}! Your demo order is received.`);
  lines.push(`Type: ${type}`);
  if(type === "delivery") lines.push(`Address: ${address || "(not provided)"}`);
  lines.push(`Time: ${time}`);
  lines.push(`Phone: ${phone}`);
  lines.push(`Items:`);
  cart.forEach(v => lines.push(`- ${v.item.name} x${v.qty}`));
  lines.push(`Total: ${money(calcSubtotal() + calcDeliveryFee(type))}`);
  if(notes) lines.push(`Notes: ${notes}`);

  confirmText.textContent = lines.join("  ");

  openModal();

  // Demo: clear cart after placing order
  cart.clear();
  refreshCartUI();
  // reset quantities in visible menu
  ["mains","sides","drinks"].forEach(cat => (MENU[cat]||[]).forEach(i => updateQtyUI(i.id)));
  checkoutForm.reset();
  updateAddressVisibility();
});

function openModal(){
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden","false");
}
function closeModal(){
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden","true");
}
modalOverlay.addEventListener("click", closeModal);
newOrderBtn.addEventListener("click", () => {
  closeModal();
  window.location.hash = "#menu";
});

// Helper
function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// Init
renderMenu("mains");
refreshCartUI();
