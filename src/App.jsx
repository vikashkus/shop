import { useState, useRef, useEffect } from "react";
import "./index.css";
import { db } from "./firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from "firebase/firestore";

const INITIAL_PRODUCTS = [
  { id: 1, category: "Atta & Grains", name: "Aashirvaad Atta", price: 280, unit: "5kg", emoji: "🌾", tag: "Best Seller", image: null },
  { id: 2, category: "Atta & Grains", name: "Basmati Rice", price: 120, unit: "1kg", emoji: "🍚", tag: "", image: null },
  { id: 3, category: "Dal & Pulses", name: "Toor Dal", price: 140, unit: "1kg", emoji: "🫘", tag: "Fresh Stock", image: null },
  { id: 4, category: "Dal & Pulses", name: "Moong Dal", price: 130, unit: "1kg", emoji: "🟡", tag: "", image: null },
  { id: 5, category: "Dairy", name: "Amul Butter", price: 55, unit: "100g", emoji: "🧈", tag: "Popular", image: null },
  { id: 6, category: "Dairy", name: "Amul Doodh", price: 28, unit: "500ml", emoji: "🥛", tag: "", image: null },
  { id: 7, category: "Snacks", name: "Haldiram Bhujia", price: 30, unit: "200g", emoji: "🍿", tag: "Popular", image: null },
  { id: 8, category: "Snacks", name: "Parle-G Biscuits", price: 10, unit: "Pack", emoji: "🍪", tag: "", image: null },
  { id: 9, category: "Beverages", name: "Tata Tea Gold", price: 95, unit: "250g", emoji: "🍵", tag: "Best Seller", image: null },
  { id: 10, category: "Beverages", name: "Bisleri Water", price: 20, unit: "1L", emoji: "💧", tag: "", image: null },
  { id: 11, category: "Soap & Care", name: "Lux Soap", price: 40, unit: "Pack of 3", emoji: "🧼", tag: "", image: null },
  { id: 12, category: "Soap & Care", name: "Colgate Toothpaste", price: 85, unit: "200g", emoji: "🦷", tag: "Popular", image: null },
];

const WHATSAPP = "916391845344";
const PHONE = "6391845344";
const ADMIN_USER = "bansi";
const ADMIN_PASS = "bansi123";
const EMOJIS = ["🌾", "🍚", "🫘", "🟡", "🧈", "🥛", "🍿", "🍪", "🍵", "💧", "🧼", "🦷", "🧃", "🥫", "🍬", "🧂", "🫙", "🛢️", "🧴", "🪥", "🧻", "🧹", "🥜", "🌽", "🧅", "🧄", "🍫", "☕", "🥚", "🍞", "🥩", "🐟", "🍋", "🍎", "🍌", "🍅", "🥕", "🧺", "📦", "🍊", "🍇"];

const TAG_COLORS = {
  "Best Seller": { bg: "#fff0e0", color: "#c45000", border: "#fcd9b0" },
  "Popular": { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  "Fresh Stock": { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  "New": { bg: "#fdf4ff", color: "#7e22ce", border: "#e9d5ff" },
};

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [page, setPage] = useState("home");
  const [orderSent, setOrderSent] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState("delivery");
  const [formError, setFormError] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [adminTab, setAdminTab] = useState("products");
  const [newProduct, setNewProduct] = useState({ name: "", category: "", price: "", unit: "", emoji: "🌾", tag: "", image: null });
  const [emojiLoading, setEmojiLoading] = useState(false);
  const [addedId, setAddedId] = useState(null);
  const newImgRef = useRef(null);
  const editImgRef = useRef(null);


  // Real-time Firestore listener — products sync for all users
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      if (snap.empty) {
        // First time: seed Firestore with initial products
        INITIAL_PRODUCTS.forEach(p => addDoc(collection(db, "products"), p));
      } else {
        const data = snap.docs.map(d => ({ ...d.data(), firestoreId: d.id }));
        setProducts(data);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const allCategories = ["All", ...new Set(products.map(p => p.category))];
  const filtered = activeCategory === "All" ? products : products.filter(p => p.category === activeCategory);
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const addToCart = (product) => {
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 600);
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const decreaseCart = (id) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === id);
      if (ex.qty === 1) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
    });
  };

  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => setCart([]);

  const placeOrder = () => {
    if (!customerName.trim()) { setFormError("Apna naam likhein"); return; }
    if (!customerPhone.trim() || customerPhone.length < 10) { setFormError("Sahi phone number likhein"); return; }
    if (deliveryType === "delivery" && !customerAddress.trim()) { setFormError("Delivery address likhein"); return; }
    setFormError("");
    const itemList = cart.map(i => `  • ${i.name} (${i.unit}) × ${i.qty} = ₹${i.price * i.qty}`).join("\n");
    const deliveryLine = deliveryType === "delivery" ? `🚚 *Delivery:* ${customerAddress}` : `🏪 *Pickup:* Dukan se le jaayenge`;
    const msg = `🛒 *BANSI GENERAL STORE — NAYA ORDER*\n━━━━━━━━━━━━━━━━━━━━\n👤 *Naam:* ${customerName}\n📞 *Phone:* ${customerPhone}\n${deliveryLine}\n━━━━━━━━━━━━━━━━━━━━\n📦 *ORDER:*\n${itemList}\n━━━━━━━━━━━━━━━━━━━━\n💰 *TOTAL: ₹${totalPrice}*\n━━━━━━━━━━━━━━━━━━━━\nPlease confirm my order! 🙏`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
    setOrderSent(true);
    clearCart();
    setShowCheckout(false);
    setCartOpen(false);
    setCustomerName(""); setCustomerPhone(""); setCustomerAddress("");
    setTimeout(() => setOrderSent(false), 5000);
  };

  const handleAdminLogin = () => {
    if (adminUser === ADMIN_USER && adminPass === ADMIN_PASS) {
      setIsAdmin(true); setShowAdminLogin(false); setLoginError("");
      setAdminUser(""); setAdminPass(""); setPage("admin");
    } else setLoginError("Galat username ya password!");
  };

  const saveEdit = async () => {
    try {
      if (editingProduct.firestoreId) {
        const ref = doc(db, "products", editingProduct.firestoreId);
        const { firestoreId, ...data } = editingProduct;
        await updateDoc(ref, { ...data });
      }
      setEditingProduct(null);
    } catch (e) { alert("Save error: " + e.message); }
  };

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.category || !newProduct.price || !newProduct.unit) { alert("Saari fields bharein!"); return; }
    try {
      await addDoc(collection(db, "products"), { ...newProduct, image: null, price: Number(newProduct.price) });
      setNewProduct({ name: "", category: "", price: "", unit: "", emoji: "🌾", tag: "", image: null });
      setAdminTab("products");
    } catch (e) { alert("Add error: " + e.message); }
  };

  const deleteProduct = async (firestoreId) => {
    if (window.confirm("Delete karein?"))
      try { await deleteDoc(doc(db, "products", firestoreId)); }
      catch (e) { alert("Delete error: " + e.message); }
  };

  const handleImg = (file, mode) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => mode === "new" ? setNewProduct(p => ({ ...p, image: e.target.result })) : setEditingProduct(p => ({ ...p, image: e.target.result }));
    reader.readAsDataURL(file);
  };

  const suggestEmoji = async () => {
    if (!newProduct.name) return;
    setEmojiLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 20, messages: [{ role: "user", content: `Reply with ONE emoji for: "${newProduct.name}". Only emoji.` }] }) });
      const d = await res.json();
      const e = d.content?.[0]?.text?.trim();
      if (e) setNewProduct(p => ({ ...p, emoji: e }));
    } catch (_) { }
    setEmojiLoading(false);
  };

  const Thumb = ({ p, size = 56 }) => p.image
    ? <img src={p.image} alt={p.name} style={{ width: size, height: size, objectFit: "cover", borderRadius: size * 0.22, flexShrink: 0 }} />
    : <div style={{ fontSize: size * 0.68, lineHeight: 1, flexShrink: 0 }}>{p.emoji}</div>;

  const QtyControl = ({ item, small = false }) => {
    const s = small ? 28 : 32;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: small ? 5 : 7 }}>
        <button onClick={() => decreaseCart(item.id)} style={{ width: s, height: s, borderRadius: "50%", border: "2.5px solid #d4500a", background: "white", color: "#d4500a", fontWeight: 900, cursor: "pointer", fontSize: small ? 13 : 15, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 1px 4px rgba(212,80,10,.15)" }}>−</button>
        <span style={{ fontWeight: 800, fontSize: small ? 13 : 15, minWidth: small ? 14 : 18, textAlign: "center", color: "#1a1a1a" }}>{item.qty}</span>
        <button onClick={() => addToCart(item)} style={{ width: s, height: s, borderRadius: "50%", background: "linear-gradient(135deg,#d4500a,#f59e0b)", border: "none", color: "white", fontWeight: 900, cursor: "pointer", fontSize: small ? 13 : 15, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(212,80,10,.35)" }}>+</button>
      </div>
    );
  };

  const TagBadge = ({ tag }) => {
    if (!tag) return null;
    const c = TAG_COLORS[tag] || TAG_COLORS["New"];
    return <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 20, letterSpacing: .3, textTransform: "uppercase" }}>{tag}</span>;
  };

  return (
    <div className="app-wrap">


      {/* ─── TOP BAR ─── */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(253,248,243,.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #f0e4d6", padding: "11px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div onClick={() => setPage("home")} style={{ display: "flex", alignItems: "center", gap: 11, cursor: "pointer" }}>
          <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,#d4500a,#f59e0b)", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, boxShadow: "0 3px 12px rgba(212,80,10,.35)" }}>🛒</div>
          <div>
            <div className="brand" style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.1, color: "#1c1008", letterSpacing: -.2 }}>Bansi General Store</div>
            <div style={{ fontSize: 10.5, color: "#a07850", display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
              <span>📍</span><span>Shekhpur, UP</span>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block", marginLeft: 3 }} />
              <span style={{ color: "#22c55e", fontWeight: 700 }}>Open</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {!isAdmin && <button onClick={() => setShowAdminLogin(true)} style={{ background: "#f5ede4", border: "none", width: 36, height: 36, borderRadius: 11, cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center" }}>🔐</button>}
          {isAdmin && <span onClick={() => setPage("admin")} style={{ fontSize: 11, background: "linear-gradient(135deg,#d4500a,#f59e0b)", color: "white", padding: "5px 11px", borderRadius: 20, fontWeight: 800, cursor: "pointer" }}>⚙️ Admin</span>}
          <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setCartOpen(true)}>
            <div style={{ background: "#f5ede4", width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🛒</div>
            {totalItems > 0 && <div className="badge">{totalItems}</div>}
          </div>
        </div>
      </div>

      {/* ─── SUCCESS TOAST ─── */}
      {orderSent && (
        <div className="toast" style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)", color: "white", padding: "13px 18px", display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 13 }}>
          <span style={{ fontSize: 22 }}>✅</span>
          <div>
            <div>Order WhatsApp pe bhej diya!</div>
            <div style={{ fontSize: 11, opacity: .85, marginTop: 1 }}>Jaldi confirm hoga 🎉</div>
          </div>
        </div>
      )}

      {/* ════════════════════ HOME ════════════════════ */}
      {page === "home" && (
        <div className="pg">
          {/* Hero */}
          <div style={{ background: "linear-gradient(150deg,#fff8ef 0%,#fde8c8 60%,#fbd4a0 100%)", padding: "26px 16px 22px", position: "relative", overflow: "hidden" }}>
            {/* Decorative circles */}
            <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(245,158,11,.12)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -20, left: -20, width: 90, height: 90, borderRadius: "50%", background: "rgba(212,80,10,.08)", pointerEvents: "none" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
              <div style={{ flex: 1, paddingRight: 10 }}>
                <div className="fade-up" style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "white", borderRadius: 50, padding: "5px 13px", marginBottom: 13, fontSize: 11.5, fontWeight: 700, color: "#a07850", boxShadow: "0 2px 8px rgba(0,0,0,.07)", animationDelay: ".05s" }}>
                  ⭐ 4.8 &nbsp;·&nbsp; Aapki Apni Dukan
                </div>
                <h1 className="fade-up brand hero-title" style={{ fontWeight: 900, lineHeight: 1.1, marginBottom: 10, color: "#1c1008", animationDelay: ".1s", fontSize: "clamp(32px, 8vw, 42px)" }}>
                  Sab Kuch<br /><span style={{ background: "linear-gradient(135deg,#d4500a,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Ek Jagah!</span>
                </h1>
                <p className="fade-up" style={{ fontSize: 13, color: "#8a5c38", lineHeight: 1.55, marginBottom: 18, animationDelay: ".15s" }}>
                  Ration, snacks, dairy — seedha WhatsApp pe order karein!
                </p>
                <div className="fade-up" style={{ display: "flex", gap: 10, animationDelay: ".2s" }}>
                  <button className="btn-fire" style={{ flex: 1, padding: "11px 10px", fontSize: 13, borderRadius: 13 }} onClick={() => setPage("products")}>🛍️ Order Karein</button>
                  <button onClick={() => window.open(`https://wa.me/${WHATSAPP}`, "_blank")} className="btn-green" style={{ flex: 1, padding: "11px 10px", fontSize: 13, borderRadius: 13 }}>💬 WhatsApp</button>
                </div>
              </div>
              <div className="fade-up hero-emoji" style={{ filter: "drop-shadow(0 6px 16px rgba(212,80,10,.2))", animationDelay: ".1s" }}>🏪</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ padding: "14px 16px 0" }}>
            <div className="grid-2">
              {[
                { icon: "📞", title: "Call Karein", sub: `+91 ${PHONE}`, fn: () => window.open(`tel:${PHONE}`), color: "#fff3e8" },
                { icon: "💬", title: "WhatsApp", sub: "Direct order bhejein", fn: () => window.open(`https://wa.me/${WHATSAPP}`, "_blank"), color: "#f0fdf4" },
                { icon: "🗺️", title: "Location", sub: "Shekhpur, UP 233300", fn: () => window.open("https://www.google.com/maps?q=25.670984,83.547116", "_blank"), color: "#eff6ff" },
                { icon: "⏰", title: "Timing", sub: "7am–10pm · 7 din", fn: null, color: "#fdf4ff" },
              ].map((x, i) => (
                <div key={x.title} className="card card-lift fade-up" onClick={x.fn} style={{ display: "flex", alignItems: "center", gap: 11, cursor: x.fn ? "pointer" : "default", background: x.color, animationDelay: `${.1 + i * .05}s`, border: "1px solid rgba(0,0,0,.04)" }}>
                  <div style={{ fontSize: 26 }}>{x.icon}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: "#1c1008" }}>{x.title}</div>
                    <div style={{ fontSize: 10.5, color: "#a07850", marginTop: 1 }}>{x.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Products */}
          <div style={{ padding: "18px 16px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 13 }}>
              <div className="syne" style={{ fontSize: 18, fontWeight: 800, color: "#1c1008" }}>🔥 Popular Items</div>
              <span onClick={() => setPage("products")} style={{ fontSize: 13, background: "linear-gradient(135deg,#d4500a,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 800, cursor: "pointer" }}>Sab dekho →</span>
            </div>
            <div className="grid-products">
              {products.filter(p => p.tag).slice(0, 4).map((p, i) => {
                const ci = cart.find(x => x.id === p.id);
                return (
                  <div key={p.id} className="card fade-up" style={{ animationDelay: `${.1 + i * .06}s` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 9 }}>
                      <Thumb p={p} size={52} />
                      <TagBadge tag={p.tag} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 13, lineHeight: 1.3, marginBottom: 2, color: "#1c1008" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "#c4a98a", marginBottom: 9, fontWeight: 600 }}>{p.unit}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="syne" style={{ fontSize: 18, fontWeight: 800, background: "linear-gradient(135deg,#d4500a,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>₹{p.price}</span>
                      {!ci
                        ? <button onClick={() => addToCart(p)} className={addedId === p.id ? "pop" : ""} style={{ background: "linear-gradient(135deg,#d4500a,#f59e0b)", color: "white", border: "none", borderRadius: 9, padding: "6px 13px", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(212,80,10,.3)" }}>+ Add</button>
                        : <QtyControl item={ci} small />
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats banner */}
          <div style={{ padding: "14px 16px 0" }}>
            <div style={{ background: "linear-gradient(135deg,#d4500a 0%,#f59e0b 100%)", borderRadius: 22, padding: "20px 16px", position: "relative", overflow: "hidden", boxShadow: "0 6px 24px rgba(212,80,10,.3)" }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,.1)" }} />
              <div style={{ position: "absolute", bottom: -30, left: 60, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
              <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center", position: "relative" }}>
                {[["500+", "Products"], ["10+", "Saal"], ["1000+", "Customers"]].map(([n, l]) => (
                  <div key={l}>
                    <div className="syne" style={{ fontSize: 22, fontWeight: 800, color: "white" }}>{n}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.8)", marginTop: 2, fontWeight: 600 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ PRODUCTS ════════════════════ */}
      {page === "products" && (
        <div className="pg">
          <div style={{ padding: "14px 16px 10px" }}>
            <div className="syne" style={{ fontSize: 21, fontWeight: 800, marginBottom: 3, color: "#1c1008" }}>🛍️ Hamare Products</div>
            <p style={{ fontSize: 13, color: "#c4a98a", marginBottom: 13, fontWeight: 600 }}>{products.length} products available</p>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              {allCategories.map(cat => (
                <button key={cat} className={`pill ${activeCategory === cat ? "on" : ""}`} onClick={() => setActiveCategory(cat)}>{cat}</button>
              ))}
            </div>
          </div>

          <div style={{ padding: "4px 16px" }}>
            <div className="grid-products">
              {filtered.map((p, i) => {
                const ci = cart.find(x => x.id === p.id);
                return (
                  <div key={p.id} className="card fade-up" style={{ animationDelay: `${i * .04}s` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 9 }}>
                      <Thumb p={p} size={58} />
                      <TagBadge tag={p.tag} />
                    </div>
                    <div style={{ fontSize: 9.5, color: "#c4a98a", textTransform: "uppercase", letterSpacing: .8, marginBottom: 2, fontWeight: 700 }}>{p.category}</div>
                    <div style={{ fontWeight: 800, fontSize: 13.5, lineHeight: 1.3, marginBottom: 2, color: "#1c1008" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "#c4a98a", marginBottom: 11, fontWeight: 600 }}>{p.unit}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="syne" style={{ fontSize: 19, fontWeight: 800, background: "linear-gradient(135deg,#d4500a,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>₹{p.price}</span>
                      {!ci
                        ? <button onClick={() => addToCart(p)} className={addedId === p.id ? "pop" : ""} style={{ background: "linear-gradient(135deg,#d4500a,#f59e0b)", color: "white", border: "none", borderRadius: 10, padding: "7px 14px", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 3px 10px rgba(212,80,10,.3)" }}>+ Add</button>
                        : <QtyControl item={ci} />
                      }
                    </div>
                  </div>
                );
              })}
            </div>

            {totalItems > 0 && (
              <div style={{ position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 28px)", maxWidth: 452, zIndex: 25 }}>
                <button className="btn-fire slide-in" onClick={() => setCartOpen(true)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderRadius: 18, fontSize: 14, boxShadow: "0 8px 28px rgba(212,80,10,.5)" }}>
                  <span style={{ background: "rgba(255,255,255,.22)", borderRadius: 9, padding: "3px 11px", fontWeight: 800 }}>{totalItems} item</span>
                  <span style={{ fontWeight: 800 }}>Cart Dekhein 🛒</span>
                  <span className="syne" style={{ fontWeight: 800, fontSize: 16 }}>₹{totalPrice}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════ CONTACT ════════════════════ */}
      {page === "contact" && (
        <div className="pg" style={{ padding: "16px" }}>
          <div className="syne" style={{ fontSize: 21, fontWeight: 800, marginBottom: 16, color: "#1c1008" }}>📞 Sampark Karein</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <button onClick={() => window.open(`tel:${PHONE}`)} style={{ background: "linear-gradient(135deg,#d4500a,#f59e0b)", color: "white", border: "none", borderRadius: 18, padding: "18px 10px", cursor: "pointer", textAlign: "center", fontFamily: "inherit", boxShadow: "0 6px 20px rgba(212,80,10,.35)" }}>
              <div style={{ fontSize: 30, marginBottom: 6 }}>📞</div>
              <div style={{ fontWeight: 800, fontSize: 13 }}>Call Karein</div>
              <div style={{ fontSize: 10.5, opacity: .85, marginTop: 2 }}>+91 {PHONE}</div>
            </button>
            <button onClick={() => window.open(`https://wa.me/${WHATSAPP}`, "_blank")} style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)", color: "white", border: "none", borderRadius: 18, padding: "18px 10px", cursor: "pointer", textAlign: "center", fontFamily: "inherit", boxShadow: "0 6px 20px rgba(22,163,74,.3)" }}>
              <div style={{ fontSize: 30, marginBottom: 6 }}>💬</div>
              <div style={{ fontWeight: 800, fontSize: 13 }}>WhatsApp</div>
              <div style={{ fontSize: 10.5, opacity: .85, marginTop: 2 }}>Order bhejein</div>
            </button>
          </div>
          <div className="card" style={{ marginBottom: 14 }}>
            {[
              { icon: "📍", t: "Hamara Pata", s: "Shekhpur, Uttar Pradesh · PIN 233300" },
              { icon: "⏰", t: "Kholne ka Samay", s: "Mon–Sat 7am–10pm · Sun 8am–9pm" },
              { icon: "🚚", t: "Home Delivery", s: "Nearby area mein available" },
            ].map((x, i) => (
              <div key={x.t} style={{ display: "flex", gap: 13, alignItems: "flex-start", paddingBottom: i < 2 ? 13 : 0, marginBottom: i < 2 ? 13 : 0, borderBottom: i < 2 ? "1px solid #f0e4d6" : "none" }}>
                <div style={{ fontSize: 24 }}>{x.icon}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 2, color: "#1c1008" }}>{x.t}</div>
                  <div style={{ fontSize: 12.5, color: "#a07850" }}>{x.s}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderRadius: 20, overflow: "hidden", marginBottom: 12, boxShadow: "0 6px 20px rgba(28,16,8,.12)" }}>
            <iframe title="Location" src="https://www.google.com/maps?q=25.670984,83.547116&z=16&output=embed" width="100%" height="215" style={{ border: 0, display: "block" }} allowFullScreen loading="lazy" />
          </div>
          <button className="btn-out" onClick={() => window.open("https://www.google.com/maps?q=25.670984,83.547116", "_blank")}>🗺️ Google Maps pe Dekho</button>
        </div>
      )}

      {/* ════════════════════ ADMIN ════════════════════ */}
      {page === "admin" && isAdmin && (
        <div className="pg" style={{ padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div className="syne" style={{ fontSize: 20, fontWeight: 800, color: "#1c1008" }}>⚙️ Admin Panel</div>
            <button className="btn-ghost" style={{ background: "#fee2e2", color: "#dc2626", fontWeight: 800 }} onClick={() => { setIsAdmin(false); setPage("home"); }}>🚪 Logout</button>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button className={`pill ${adminTab === "products" ? "on" : ""}`} onClick={() => setAdminTab("products")}>📦 Products ({products.length})</button>
            <button className={`pill ${adminTab === "add" ? "on" : ""}`} onClick={() => setAdminTab("add")}>➕ Add New</button>
          </div>

          {adminTab === "add" && (
            <div className="card slide-in" style={{ marginBottom: 16 }}>
              <div className="syne" style={{ fontSize: 16, fontWeight: 800, marginBottom: 14, color: "#1c1008" }}>➕ Naya Product</div>
              <input type="file" accept="image/*" ref={newImgRef} style={{ display: "none" }} onChange={e => handleImg(e.target.files[0], "new")} />
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#a07850", marginBottom: 6, display: "block" }}>📷 Product Photo (optional)</label>
                {newProduct.image ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img src={newProduct.image} alt="" style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 14, border: "3px solid #d4500a" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      <button className="btn-ghost" onClick={() => newImgRef.current.click()}>📷 Badlo</button>
                      <button className="btn-ghost" style={{ background: "#fee2e2", color: "#dc2626" }} onClick={() => setNewProduct(p => ({ ...p, image: null }))}>🗑 Hatao</button>
                    </div>
                  </div>
                ) : (
                  <div className="dz" onClick={() => newImgRef.current.click()}>
                    <div style={{ fontSize: 30, marginBottom: 5 }}>📷</div>
                    <div style={{ fontSize: 13, color: "#a07850", fontWeight: 700 }}>Photo Upload Karein</div>
                    <div style={{ fontSize: 11, color: "#c4a98a", marginTop: 2 }}>Tap karo select karne ke liye</div>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input placeholder="Product ka Naam *" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} />
                <input placeholder="Category * (e.g. Dairy)" value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input type="number" inputMode="numeric" placeholder="Price ₹ *" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} />
                  <input placeholder="Unit * (e.g. 1kg)" value={newProduct.unit} onChange={e => setNewProduct(p => ({ ...p, unit: e.target.value }))} />
                </div>
                <select value={newProduct.tag} onChange={e => setNewProduct(p => ({ ...p, tag: e.target.value }))}>
                  <option value="">Tag (optional)</option>
                  <option value="Best Seller">Best Seller</option>
                  <option value="Popular">Popular</option>
                  <option value="Fresh Stock">Fresh Stock</option>
                  <option value="New">New</option>
                </select>
                {!newProduct.image && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#a07850" }}>Emoji — {newProduct.emoji}</label>
                      <button className="btn-ghost" style={{ background: emojiLoading ? "#f5ede4" : "#fff3e8", color: "#d4500a" }} onClick={suggestEmoji} disabled={!newProduct.name || emojiLoading}>
                        {emojiLoading ? "⏳ Soch raha..." : "✨ AI Suggest"}
                      </button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 5 }}>
                      {EMOJIS.map(e => <button key={e} className={`ebtn ${newProduct.emoji === e ? "on" : ""}`} onClick={() => setNewProduct(p => ({ ...p, emoji: e }))}>{e}</button>)}
                    </div>
                  </div>
                )}
                <button className="btn-fire" onClick={addProduct}>✅ Product Add Karein</button>
              </div>
            </div>
          )}

          {adminTab === "products" && products.map(p => (
            <div key={p.id}>
              {editingProduct?.id === p.id ? (
                <div className="card slide-in" style={{ marginBottom: 10, background: "#fff8f0", border: "2px solid #f0d4b0" }}>
                  <input type="file" accept="image/*" ref={editImgRef} style={{ display: "none" }} onChange={e => handleImg(e.target.files[0], "edit")} />
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#a07850", marginBottom: 6, display: "block" }}>Photo</label>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      {editingProduct.image
                        ? <img src={editingProduct.image} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 12, border: "3px solid #d4500a" }} />
                        : <div style={{ width: 64, height: 64, background: "#f5ede4", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>{editingProduct.emoji}</div>
                      }
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <button className="btn-ghost" onClick={() => editImgRef.current.click()}>📷 Badlo</button>
                        {editingProduct.image && <button className="btn-ghost" style={{ background: "#fee2e2", color: "#dc2626" }} onClick={() => setEditingProduct(p => ({ ...p, image: null }))}>🗑 Hatao</button>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                    <input value={editingProduct.name} onChange={e => setEditingProduct(p => ({ ...p, name: e.target.value }))} placeholder="Naam" />
                    <input value={editingProduct.category} onChange={e => setEditingProduct(p => ({ ...p, category: e.target.value }))} placeholder="Category" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <input type="number" inputMode="numeric" value={editingProduct.price} onChange={e => setEditingProduct(p => ({ ...p, price: Number(e.target.value) }))} placeholder="Price" />
                      <input value={editingProduct.unit} onChange={e => setEditingProduct(p => ({ ...p, unit: e.target.value }))} placeholder="Unit" />
                    </div>
                    <select value={editingProduct.tag} onChange={e => setEditingProduct(p => ({ ...p, tag: e.target.value }))}>
                      <option value="">Koi tag nahi</option>
                      <option value="Best Seller">Best Seller</option>
                      <option value="Popular">Popular</option>
                      <option value="Fresh Stock">Fresh Stock</option>
                      <option value="New">New</option>
                    </select>
                    {!editingProduct.image && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 4 }}>
                        {EMOJIS.map(e => <button key={e} className={`ebtn ${editingProduct.emoji === e ? "on" : ""}`} onClick={() => setEditingProduct(p => ({ ...p, emoji: e }))}>{e}</button>)}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button className="btn-fire" style={{ padding: "10px", fontSize: 13, borderRadius: 11 }} onClick={saveEdit}>💾 Save</button>
                    <button className="btn-out" style={{ padding: "10px", fontSize: 13, borderRadius: 11 }} onClick={() => setEditingProduct(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="arow">
                  <Thumb p={p} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#1c1008" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "#c4a98a", fontWeight: 600 }}>{p.category} · {p.unit}</div>
                  </div>
                  <div className="syne" style={{ fontSize: 15, fontWeight: 800, background: "linear-gradient(135deg,#d4500a,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", flexShrink: 0 }}>₹{p.price}</div>
                  <button className="btn-ghost" style={{ background: "#fff3e8", color: "#d4500a", padding: "7px 11px" }} onClick={() => setEditingProduct(p)}>✏️</button>
                  <button className="btn-ghost" style={{ background: "#fee2e2", color: "#dc2626", padding: "7px 11px" }} onClick={() => deleteProduct(p.firestoreId)}>🗑️</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════ CART DRAWER ════════════════════ */}
      {cartOpen && (
        <>
          <div className="overlay" onClick={() => setCartOpen(false)} />
          <div className="drawer slide-in">

            {/* Header */}
            <div style={{ padding: "16px 16px 14px", borderBottom: "1px solid #f0e4d6", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, background: "white" }}>
              <div>
                <div className="syne" style={{ fontSize: 19, fontWeight: 800, color: "#1c1008" }}>🛒 Mera Cart</div>
                {totalItems > 0 && <div style={{ fontSize: 12, color: "#a07850", fontWeight: 600, marginTop: 1 }}>{totalItems} item · ₹{totalPrice} total</div>}
              </div>
              <button onClick={() => setCartOpen(false)} style={{ background: "#f5ede4", border: "none", width: 38, height: 38, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b3a1f", flexShrink: 0 }}>✕</button>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", background: "#fdf8f3" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", paddingTop: 80, color: "#c4a98a" }}>
                  <div style={{ fontSize: 60 }}>🛒</div>
                  <div style={{ fontWeight: 800, fontSize: 17, marginTop: 14, color: "#6b3a1f" }}>Cart khali hai</div>
                  <div style={{ fontSize: 13, marginTop: 6, color: "#c4a98a", marginBottom: 22 }}>Products add karein</div>
                  <button className="btn-fire" style={{ width: "auto", padding: "12px 28px", borderRadius: 13, fontSize: 14 }} onClick={() => { setCartOpen(false); setPage("products"); }}>🛍️ Products Dekhein</button>
                </div>
              ) : (
                <>
                  {cart.map(item => (
                    <div key={item.id} style={{ background: "white", borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, marginBottom: 10, boxShadow: "0 2px 10px rgba(28,16,8,.06)" }}>
                      <Thumb p={item} size={48} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#1c1008", marginBottom: 2 }}>{item.name}</div>
                        <div style={{ fontSize: 11.5, color: "#c4a98a", fontWeight: 600 }}>{item.unit} · ₹{item.price} each</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
                        <div className="syne" style={{ fontWeight: 800, fontSize: 15, background: "linear-gradient(135deg,#d4500a,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>₹{item.price * item.qty}</div>
                        <QtyControl item={item} small />
                        <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: "#dc2626", fontSize: 11, cursor: "pointer", padding: 0, fontWeight: 700 }}>Hatao ✕</button>
                      </div>
                    </div>
                  ))}

                  {/* Bill Summary */}
                  <div style={{ background: "white", borderRadius: 16, padding: "14px 16px", marginTop: 6, boxShadow: "0 2px 10px rgba(28,16,8,.06)" }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: "#a07850", marginBottom: 10, textTransform: "uppercase", letterSpacing: .5 }}>Bill Summary</div>
                    {[["Items", `₹${totalPrice}`, false], ["Delivery", "FREE ✓", true]].map(([l, v, g]) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 8, fontWeight: 600 }}>
                        <span style={{ color: "#a07850" }}>{l}</span>
                        <span style={{ color: g ? "#22c55e" : "#1c1008", fontWeight: 700 }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: "2px solid #f0e4d6", marginTop: 10, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 800, fontSize: 15, color: "#1c1008" }}>Kul Total</span>
                      <span className="syne" style={{ fontSize: 24, fontWeight: 800, background: "linear-gradient(135deg,#d4500a,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>₹{totalPrice}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Order Button */}
            {cart.length > 0 && (
              <div style={{ padding: "14px 16px", paddingBottom: "max(18px, env(safe-area-inset-bottom, 18px))", borderTop: "1px solid #f0e4d6", background: "white", flexShrink: 0 }}>
                <button className="btn-green" style={{ fontSize: 15, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => { setCartOpen(false); setShowCheckout(true); }}>
                  📲 WhatsApp pe Order Karein
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ════════════════════ CHECKOUT ════════════════════ */}
      {showCheckout && (
        <>
          <div className="overlay" onClick={() => setShowCheckout(false)} />
          <div className="sheet slide-in">
            <div style={{ width: 40, height: 4, background: "#e8d9cb", borderRadius: 2, margin: "16px auto 18px" }} />
            <div className="syne" style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: "#1c1008" }}>📋 Order Details</div>
            <div style={{ fontSize: 13, color: "#a07850", marginBottom: 18, fontWeight: 600 }}>Details bharein, phir WhatsApp pe order jaayega</div>

            {/* Summary */}
            <div style={{ background: "#fff8f0", border: "1px solid #f0d4b0", borderRadius: 16, padding: "13px 15px", marginBottom: 18 }}>
              {cart.map(i => (
                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5, fontWeight: 600 }}>
                  <span style={{ color: "#6b3a1f" }}>{i.name} × {i.qty}</span>
                  <span style={{ color: "#1c1008", fontWeight: 800 }}>₹{i.price * i.qty}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #f0d4b0", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 15 }}>
                <span style={{ color: "#1c1008" }}>Total</span>
                <span className="syne" style={{ background: "linear-gradient(135deg,#d4500a,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>₹{totalPrice}</span>
              </div>
            </div>

            {/* Delivery type */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#a07850", marginBottom: 9, display: "block" }}>Kaise chahiye?</label>
              {[{ id: "delivery", icon: "🚚", t: "Home Delivery", s: "Ghar pe deliver karenge" }, { id: "pickup", icon: "🏪", t: "Store Pickup", s: "Dukan se khud le jaayenge" }].map(opt => (
                <div key={opt.id} className={`radio-opt ${deliveryType === opt.id ? "on" : ""}`} onClick={() => setDeliveryType(opt.id)}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2.5px solid ${deliveryType === opt.id ? "#d4500a" : "#e8d9cb"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {deliveryType === opt.id && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "linear-gradient(135deg,#d4500a,#f59e0b)" }} />}
                  </div>
                  <div style={{ fontSize: 20 }}>{opt.icon}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#1c1008" }}>{opt.t}</div>
                    <div style={{ fontSize: 12, color: "#a07850" }}>{opt.s}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#a07850", marginBottom: 5, display: "block" }}>Aapka Naam *</label>
                <input placeholder="e.g. Ramesh Kumar" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#a07850", marginBottom: 5, display: "block" }}>Phone Number *</label>
                <input type="tel" inputMode="numeric" placeholder="e.g. 9876543210" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
              </div>
              {deliveryType === "delivery" && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#a07850", marginBottom: 5, display: "block" }}>Delivery Address *</label>
                  <textarea placeholder="Ghar ka pura pata likhein..." value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} rows={3} style={{ resize: "none" }} />
                </div>
              )}
            </div>

            {formError && (
              <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 12, padding: "11px 15px", fontSize: 13, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                ⚠️ {formError}
              </div>
            )}

            <button className="btn-green" style={{ fontSize: 15, padding: "15px", borderRadius: 16, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={placeOrder}>
              💬 WhatsApp pe Order Bhejein
            </button>
            <button className="btn-ghost" style={{ width: "100%", padding: "12px", fontSize: 14, borderRadius: 13, textAlign: "center" }} onClick={() => setShowCheckout(false)}>← Wapas Jaao</button>
          </div>
        </>
      )}

      {/* ════════════════════ ADMIN LOGIN ════════════════════ */}
      {showAdminLogin && (
        <>
          <div className="overlay" onClick={() => setShowAdminLogin(false)} />

          {/* Full-screen drawer — no keyboard cut-off issues */}
          <div className="drawer slide-in" style={{ background: "#fdf8f3", overflowY: "auto" }}>

            {/* Top bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid #f0e4d6", background: "white", flexShrink: 0 }}>
              <div className="syne" style={{ fontSize: 17, fontWeight: 800, color: "#1c1008" }}>🔐 Admin Login</div>
              <button onClick={() => setShowAdminLogin(false)} style={{ background: "#f5ede4", border: "none", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b3a1f" }}>✕</button>
            </div>

            {/* Content — scrollable */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "32px 22px", maxWidth: 400, width: "100%", margin: "0 auto" }}>

              {/* Icon */}
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{
                  width: 88, height: 88, borderRadius: "50%", margin: "0 auto 16px",
                  background: "linear-gradient(135deg, #d4500a, #f59e0b)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 38, boxShadow: "0 10px 28px rgba(212,80,10,.32)"
                }}>🔐</div>
                <div className="syne" style={{ fontSize: 26, fontWeight: 800, color: "#1c1008" }}>Admin Login</div>
                <div style={{ fontSize: 13, color: "#a07850", marginTop: 6, fontWeight: 600 }}>Sirf store owner ke liye</div>
              </div>

              {/* Username */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#6b3a1f", marginBottom: 8, display: "block" }}>👤 Username</label>
                <input
                  placeholder="Username daalen"
                  value={adminUser}
                  onChange={e => setAdminUser(e.target.value)}
                  autoComplete="username"
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#6b3a1f", marginBottom: 8, display: "block" }}>🔒 Password</label>
                <input
                  type="password"
                  placeholder="Password daalen"
                  value={adminPass}
                  onChange={e => setAdminPass(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAdminLogin()}
                  autoComplete="current-password"
                />
              </div>

              {/* Error */}
              {loginError && (
                <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 13, padding: "13px 15px", fontSize: 14, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  ❌ {loginError}
                </div>
              )}

              {/* Login */}
              <button className="btn-fire" style={{ fontSize: 16, padding: "16px", borderRadius: 16, marginBottom: 12 }} onClick={handleAdminLogin}>
                🔓 Login Karein
              </button>

              {/* Cancel */}
              <button className="btn-ghost" onClick={() => setShowAdminLogin(false)} style={{ width: "100%", padding: "13px", fontSize: 14, borderRadius: 14, textAlign: "center" }}>
                ← Wapas Jaao
              </button>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════ BOTTOM NAV ════════════════════ */}
      <div className="bnav">
        {[
          { id: "home", icon: "🏠", label: "Home" },
          { id: "products", icon: "🛍️", label: "Products" },
          { id: "contact", icon: "📞", label: "Contact" },
          ...(isAdmin ? [{ id: "admin", icon: "⚙️", label: "Admin" }] : []),
        ].map(x => (
          <div key={x.id} className="bni" onClick={() => setPage(x.id)}>
            <span style={{ fontSize: 23, transition: "transform .15s", transform: page === x.id ? "scale(1.15)" : "scale(1)" }}>{x.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: page === x.id ? "#d4500a" : "#c4a98a", transition: "color .15s" }}>{x.label}</span>
            {page === x.id && <div className="bni-dot" />}
          </div>
        ))}
        <div className="bni" onClick={() => setCartOpen(true)} style={{ position: "relative" }}>
          <span style={{ fontSize: 23 }}>🛒</span>
          {totalItems > 0 && <div className="badge" style={{ top: 4, right: 12 }}>{totalItems}</div>}
          <span style={{ fontSize: 10, fontWeight: 800, color: "#c4a98a" }}>Cart</span>
        </div>
      </div>
    </div>
  );
}
