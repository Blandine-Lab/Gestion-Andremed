import InventoryDetail from './components/InventoryDetail';
import { useState, useEffect, useRef, useCallback } from "react";
import api from './services/api';
import "./App.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { QRCodeCanvas } from "qrcode.react";
import { Html5QrcodeScanner } from "html5-qrcode";
import InventoryByProduct from './components/InventoryByProduct';

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Tous");

  // Panier et QR
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [salesHistory, setSalesHistory] = useState([]);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [selectedProductForQR, setSelectedProductForQR] = useState(null);

  // Produit
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [promo, setPromo] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [usage, setUsage] = useState("");
  const [storageTemp, setStorageTemp] = useState("");
  const [seuilAlerte, setSeuilAlerte] = useState("");
  const [expirationDate, setExpirationDate] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editPromo, setEditPromo] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editSeuilAlerte, setEditSeuilAlerte] = useState("");
  const [editExpirationDate, setEditExpirationDate] = useState("");

  const [search, setSearch] = useState("");

  // Alertes stock
  const [alertSettings, setAlertSettings] = useState({
    enabled: true,
    emailNotifications: false,
    smsNotifications: false,
    autoReorder: false
  });
  const [movementHistory, setMovementHistory] = useState([]);

  // Login
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Gestion utilisateurs et boutiques
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [newUser, setNewUser] = useState({ email: "", password: "", name: "", role: "user", phone: "" });
  const [editingShopId, setEditingShopId] = useState(null);
  const [shopForm, setShopForm] = useState({ name: "", address: "", phone: "" });

  // Gestion vendeurs (sellers)
  const [sellers, setSellers] = useState([]);
  const [newSellerName, setNewSellerName] = useState("");
  const [editingSellerId, setEditingSellerId] = useState(null);
  const [editSellerName, setEditSellerName] = useState("");

  // Paiement mobile money
  const [paymentSettings, setPaymentSettings] = useState({
    airtel: "+243123456789",
    mpesa: "+254712345678",
    orange: "+243987654321",
    bankDetails: { iban: "", swift: "", accountHolder: "" },
    smsVerification: {
      enabled: false,
      provider: "twilio",
      accountSid: "",
      authToken: "",
      fromNumber: ""
    }
  });
  const [paymentModal, setPaymentModal] = useState({ show: false, total: 0, saleData: null });
  const [showMobileMoneyForm, setShowMobileMoneyForm] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [saleComment, setSaleComment] = useState("");

  // Seller confirmation
  const [sellerConfirmation, setSellerConfirmation] = useState({ show: false, pendingSaleData: null });
  const [selectedSellerId, setSelectedSellerId] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeError, setCodeError] = useState("");

  // Inventaires
  const [inventories, setInventories] = useState([]);

  // Logo
  const [logoUrl, setLogoUrl] = useState("");

  // Filtre vendeur
  const [filterSeller, setFilterSeller] = useState("");

  // Calculs
  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);
  const lowStockProducts = products.filter(p => p.quantity <= (p.seuilAlerte || 10));
  const criticalStock = products.filter(p => p.quantity <= (p.seuilAlerte || 10) / 2);

  const today = new Date();
  const threeMonthsLater = new Date();
  threeMonthsLater.setMonth(today.getMonth() + 3);
  const expiringSoonProducts = products.filter(p => {
    if (!p.expirationDate) return false;
    const expDate = new Date(p.expirationDate);
    return expDate <= threeMonthsLater && expDate >= today;
  });

  const expiredProducts = products.filter(p => {
    if (!p.expirationDate) return false;
    const expDate = new Date(p.expirationDate);
    return expDate < today;
  });

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.cartQuantity, 0);
  const categories = ["Tous", ...new Set(products.map(p => p.category))];

  const scannerRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = currentUser.role === "admin";

  // ================= FONCTIONS =================
  const getExpiryStatus = (expirationDate) => {
    if (!expirationDate) return null;
    const today = new Date();
    const expDate = new Date(expirationDate);
    if (expDate < today) return 'expired';
    const threeMonths = new Date();
    threeMonths.setMonth(today.getMonth() + 3);
    if (expDate <= threeMonths) return 'expiring-soon';
    return null;
  };

  const generateQRCode = (product) => {
    setSelectedProductForQR(product);
    setShowQRCodeModal(true);
  };

  // Impression du QR code avec nom et prix (améliorée)
  const printQRCode = (product) => {
    const printWindow = window.open('', '_blank');
    const qrValue = product.qrCode || product._id;
    const productName = product.name;
    const productPrice = `${product.price.toFixed(2)} $ / ${product.unit}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>QR Code - ${productName}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          margin-top: 50px;
          padding: 20px;
        }
        .qr-container {
          margin: 20px auto;
          display: flex;
          justify-content: center;
          align-items: center;
          background: white;
          padding: 20px;
          border: 1px solid #eee;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .product-name {
          font-size: 24px;
          font-weight: bold;
          margin: 15px 0 5px;
        }
        .product-price {
          font-size: 20px;
          color: #4CAF50;
          margin-bottom: 20px;
        }
        .instructions {
          margin-top: 30px;
          font-size: 12px;
          color: #666;
        }
        canvas {
          width: 250px;
          height: 250px;
        }
      </style>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
      </head>
      <body>
        <div class="qr-container">
          <div id="qrcode"></div>
        </div>
        <div class="product-name">${productName}</div>
        <div class="product-price">${productPrice}</div>
        <div class="instructions">Scannez ce code pour ajouter le produit au panier</div>
        <script>
          new QRCode(document.getElementById("qrcode"), {
            text: "${qrValue}",
            width: 250,
            height: 250,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
          });
          window.onload = () => {
            setTimeout(() => window.print(), 500);
          };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // ================= FONCTIONS DE VENTE =================
  const addToCart = useCallback((product) => {
    const status = getExpiryStatus(product.expirationDate);
    if (status === 'expired') {
      alert("Ce produit est expiré, vente impossible.");
      return;
    }
    if (status === 'expiring-soon') {
      if (!window.confirm("Ce produit expire bientôt. Voulez-vous continuer ?")) return;
    }

    const existingItem = cart.find(item => item.productId === product._id);
    if (existingItem) {
      if (existingItem.cartQuantity + 1 > product.quantity) {
        alert(`Stock insuffisant! Il reste ${product.quantity} ${product.unit}`);
        return;
      }
      setCart(cart.map(item =>
        item.productId === product._id
          ? { ...item, cartQuantity: item.cartQuantity + 1 }
          : item
      ));
    } else {
      if (1 > product.quantity) {
        alert(`Stock insuffisant! Il reste ${product.quantity} ${product.unit}`);
        return;
      }
      setCart([...cart, {
        productId: product._id,
        name: product.name,
        price: product.price,
        cartQuantity: 1,
        unit: product.unit
      }]);
    }
  }, [cart]);

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateCartQuantity = (productId, newQuantity) => {
    const product = products.find(p => p._id === productId);
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    if (newQuantity > product.quantity) {
      alert(`Stock insuffisant! Il reste ${product.quantity} ${product.unit}`);
      return;
    }
    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, cartQuantity: newQuantity }
        : item
    ));
  };

  // Seller confirmation step
  const validateSale = () => {
    if (cart.length === 0) {
      alert("Panier vide!");
      return;
    }
    for (const item of cart) {
      const product = products.find(p => p._id === item.productId);
      if (item.cartQuantity > product.quantity) {
        alert(`Stock insuffisant pour ${item.name}! Il reste ${product.quantity} ${product.unit}`);
        return;
      }
    }
    // Show seller confirmation modal
    setSellerConfirmation({
      show: true,
      pendingSaleData: {
        items: cart.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          cartQuantity: item.cartQuantity,
          unit: item.unit
        })),
        itemsCount: cartItemsCount,
        total: cartTotal,
        date: new Date().toISOString()
      }
    });
    setSelectedSellerId("");
    setBuyerName("");
    setVerificationCode("");
    setShowCodeInput(false);
    setCodeError("");
  };

  // Send SMS code (optional)
  const sendSmsCode = async () => {
    const selectedSeller = sellers.find(s => s._id === selectedSellerId);
    if (!selectedSeller || !selectedSeller.phone) {
      alert("Ce vendeur n'a pas de numéro de téléphone enregistré.");
      return;
    }
    setIsSendingCode(true);
    try {
      const res = await api.post('/sales/send-code', { phone: selectedSeller.phone });
      if (res.data.success) {
        setSentCode(res.data.code); // For simulation; in real app code is stored server-side
        setShowCodeInput(true);
        alert(`Code envoyé à ${selectedSeller.phone}`);
      } else {
        alert("Erreur lors de l'envoi du code");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Erreur d'envoi du code");
    } finally {
      setIsSendingCode(false);
    }
  };

  // Verify code and proceed to payment
  const verifyCodeAndProceed = async () => {
    if (!verificationCode.trim()) {
      setCodeError("Veuillez entrer le code reçu");
      return;
    }
    const selectedSeller = sellers.find(s => s._id === selectedSellerId);
    if (!selectedSeller) {
      setCodeError("Vendeur non trouvé");
      return;
    }
    try {
      const res = await api.post('/sales/verify-code', {
        phone: selectedSeller.phone,
        code: verificationCode
      });
      if (res.data.success) {
        setSellerConfirmation({ show: false, pendingSaleData: null });
        setPaymentModal({
          show: true,
          total: cartTotal,
          saleData: sellerConfirmation.pendingSaleData
        });
      } else {
        setCodeError("Code incorrect");
      }
    } catch (err) {
      setCodeError(err.response?.data?.message || "Erreur de vérification");
    }
  };

  // Confirm seller and proceed (without SMS or after SMS success)
  const confirmSellerAndProceed = () => {
    if (!selectedSellerId) {
      alert("Veuillez sélectionner votre nom dans la liste des vendeurs");
      return;
    }
    const selectedSeller = sellers.find(s => s._id === selectedSellerId);
    if (!selectedSeller) {
      alert("Vendeur invalide");
      return;
    }
    if (!buyerName.trim()) {
      alert("Veuillez saisir le nom de l'acheteur / destinataire");
      return;
    }
    if (paymentSettings.smsVerification.enabled) {
      sendSmsCode();
    } else {
      setSellerConfirmation({ show: false, pendingSaleData: null });
      setPaymentModal({
        show: true,
        total: cartTotal,
        saleData: sellerConfirmation.pendingSaleData
      });
    }
  };

  const cancelSale = () => {
    if (cart.length > 0 && window.confirm("Vider le panier?")) {
      setCart([]);
      setSellerConfirmation({ show: false, pendingSaleData: null });
    } else {
      setSellerConfirmation({ show: false, pendingSaleData: null });
    }
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      cash: "Espèces",
      bank_transfer: "Virement bancaire",
      credit: "Crédit",
      contract: "Contrat",
      mobile_money: "Mobile Money"
    };
    return labels[method] || method;
  };

  const processSale = async (paymentMethod) => {
    const { saleData } = paymentModal;
    if (!saleData) return;
    const selectedSeller = sellers.find(s => s._id === selectedSellerId);
    try {
      const res = await api.post('/sales', {
        ...saleData,
        paymentMethod,
        paymentDetails: null,
        comment: saleComment,
        buyerName: buyerName,
        sellerId: selectedSellerId,
        sellerName: selectedSeller.name // pour faciliter l'affichage
      });
      await loadSales();
      await loadProducts();
      setCart([]);
      setShowCart(false);
      setPaymentModal({ show: false, total: 0, saleData: null });
      setShowMobileMoneyForm(false);
      setSelectedOperator("");
      setPhoneNumber("");
      setSaleComment("");
      loadDashboard();
      alert(`✅ Vente effectuée avec succès! Total: ${saleData.total.toFixed(2)} $ (${getPaymentMethodLabel(paymentMethod)})`);
      if (res.data) printInvoice(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la vente');
    }
  };

  const processMobileMoneyPayment = async () => {
    if (!selectedOperator) {
      alert("Veuillez choisir un opérateur");
      return;
    }
    if (!phoneNumber.trim()) {
      alert("Veuillez entrer un numéro de téléphone");
      return;
    }
    const { saleData } = paymentModal;
    if (!saleData) return;
    const selectedSeller = sellers.find(s => s._id === selectedSellerId);
    try {
      const res = await api.post('/payments/mobile-money', {
        operator: selectedOperator,
        phone: phoneNumber,
        amount: saleData.total,
        saleData: { ...saleData, comment: saleComment, buyerName, sellerId: selectedSellerId, sellerName: selectedSeller.name }
      });
      if (res.data.success) {
        await loadSales();
        await loadProducts();
        setCart([]);
        setShowCart(false);
        setPaymentModal({ show: false, total: 0, saleData: null });
        setShowMobileMoneyForm(false);
        setSelectedOperator("");
        setPhoneNumber("");
        setSaleComment("");
        loadDashboard();
        alert(`✅ Paiement mobile money confirmé! ${selectedOperator.toUpperCase()} - ${phoneNumber}. Total: ${saleData.total.toFixed(2)} $`);
        if (res.data.sale) printInvoice(res.data.sale);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur de paiement');
    }
  };

  const printInvoice = (sale) => {
    const printWindow = window.open('', '_blank');
    const itemsHtml = sale.items.map(item => `
      <tr>
        <td>${item.name}${item.name}
          <td>${item.cartQuantity}${item.cartQuantity}
          <td>${item.price.toFixed(2)} $${item.price.toFixed(2)} $
          <td>${(item.cartQuantity * item.price).toFixed(2)} $${(item.cartQuantity * item.price).toFixed(2)} $
        </tr>
    `).join('');
    const paymentMethod = getPaymentMethodLabel(sale.paymentMethod);
    const paymentDetailsHtml = sale.paymentDetails ? `
      <p><strong>Opérateur :</strong> ${sale.paymentDetails.operator}</p>
      <p><strong>Téléphone :</strong> ${sale.paymentDetails.phone}</p>
    ` : '';
    const commentHtml = sale.comment ? `<p><strong>Commentaire :</strong> ${sale.comment}</p>` : '';
    const buyerHtml = sale.buyerName ? `<p><strong>Acheteur :</strong> ${sale.buyerName}</p>` : '';
    const sellerHtml = `<p><strong>Vendeur :</strong> ${sale.sellerName || "—"}</p>`;

    const logoHtml = logoUrl ? `<img src="${logoUrl}" style="height: 60px; margin-bottom: 10px;" />` : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>Facture Andremed</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 2rem; }
        h1 { color: #764ba2; }
        .header { text-align: center; margin-bottom: 2rem; }
        .info { margin-bottom: 1rem; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total { font-size: 1.2rem; font-weight: bold; text-align: right; }
        .footer { margin-top: 2rem; text-align: center; font-size: 0.8rem; color: #666; }
      </style>
      </head>
      <body>
        <div class="header">
          ${logoHtml}
          <h1>🏥 Andremed Prosperity</h1>
          <p>Facture de vente</p>
        </div>
        <div class="info">
          <p><strong>Date :</strong> ${new Date(sale.date).toLocaleString()}</p>
          <p><strong>Mode de paiement :</strong> ${paymentMethod}</p>
          ${sellerHtml}
          ${buyerHtml}
          ${paymentDetailsHtml}
          ${commentHtml}
        </div>
        <table>
          <thead>
            <tr><th>Produit</th><th>Qté</th><th>Prix unitaire</th><th>Total</th></tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="total">Total : ${sale.total.toFixed(2)} $</div>
        <div class="footer">Merci de votre confiance !</div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const addMovement = (productName, type, quantity, reason) => {
    const newMovement = {
      id: Date.now(),
      date: new Date().toISOString(),
      productName,
      type,
      quantity,
      reason,
      user: currentUser.name
    };
    setMovementHistory([newMovement, ...movementHistory].slice(0, 100));
  };

  // ================= CHARGEMENT =================
  const loadProducts = async () => {
    try { const res = await api.get('/products'); setProducts(res.data); } catch (err) { console.error(err); }
  };
  const loadSales = async () => {
    try { const res = await api.get('/sales'); setSalesHistory(res.data); } catch (err) { console.error(err); }
  };
  const loadUsers = async () => {
    try { const res = await api.get('/users'); setUsers(res.data); } catch (err) { console.error(err); }
  };
  const loadShops = async () => {
    try { const res = await api.get('/shops'); setShops(res.data); } catch (err) { console.error(err); }
  };
  const loadSellers = async () => {
    try { const res = await api.get('/sellers'); setSellers(res.data); } catch (err) { console.error(err); }
  };
  const loadMovements = async () => {
    try { const res = await api.get('/movements'); setMovementHistory(res.data); } catch (err) { console.error(err); }
  };
  const loadPaymentSettings = async () => {
    try {
      const res = await api.get('/payments/settings');
      setPaymentSettings(prev => ({
        ...prev,
        ...res.data,
        bankDetails: {
          ...prev.bankDetails,
          ...(res.data.bankDetails || {})
        },
        smsVerification: {
          ...prev.smsVerification,
          ...(res.data.smsVerification || {})
        }
      }));
    } catch (err) { console.error(err); }
  };
  const loadInventories = async () => {
    try { const res = await api.get('/inventories/monthly'); setInventories(res.data); } catch (err) { console.error(err); }
  };
  const loadLogo = async () => {
    try { const res = await api.get('/settings/logo'); setLogoUrl(res.data.logoUrl || ""); } catch (err) { console.error(err); }
  };
  const saveLogo = async () => {
    try { await api.put('/settings/logo', { logoUrl }); alert("Logo sauvegardé"); } catch (err) { alert("Erreur"); }
  };

  // Export CSV
  const exportData = async (type) => {
    try {
      const res = await api.get(`/reports/export/${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Erreur lors de l\'export');
    }
  };

  // ================= LOGIN =================
  const login = async () => {
    setLoginError('');
    if (!email.trim() || !password.trim()) { setLoginError('Email et mot de passe requis'); return; }
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(token);
      await Promise.all([
        loadProducts(), loadSales(), loadUsers(), loadShops(),
        loadSellers(), loadMovements(), loadPaymentSettings(), loadInventories(), loadLogo()
      ]);
      loadDashboard();
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Erreur de connexion');
    } finally { setIsLoading(false); }
  };

  const logout = () => {
    setToken("");
    setDashboard(null);
    setCart([]);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // ================= DASHBOARD =================
  const loadDashboard = () => {
    const totalSales = salesHistory.reduce((sum, sale) => sum + sale.total, 0);
    setDashboard({
      total_products: products.length,
      total_stock: totalStock,
      total_value: totalValue,
      alerts: lowStockProducts.length,
      critical: criticalStock.length,
      today_sales: salesHistory.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).reduce((sum, s) => sum + s.total, 0),
      monthly_turnover: totalSales,
      total_sales: salesHistory.length
    });
  };

  // ================= PRODUITS =================
  const createProduct = async () => {
    if (!productName || !quantity || !price) {
      alert("Nom, Quantité et Prix sont obligatoires");
      return;
    }
    const newProduct = {
      name: productName,
      category: category || "Autre",
      quantity: Number(quantity),
      price: Number(price),
      unit: unit || "pièce",
      storageTemp: storageTemp || "",
      usage: usage || "",
      seuilAlerte: Number(seuilAlerte) || 10,
      qrCode: `prod_${Date.now()}`,
      expirationDate: expirationDate ? new Date(expirationDate) : null
    };
    try {
      const res = await api.post('/products', newProduct);
      setProducts([...products, res.data]);
      addMovement(productName, 'entrée', Number(quantity), 'Ajout manuel');
      setProductName(""); setQuantity(""); setPrice(""); setPromo("");
      setCategory(""); setUnit(""); setUsage(""); setStorageTemp(""); setSeuilAlerte("");
      setExpirationDate("");
    } catch (err) { alert("Erreur lors de l'ajout"); }
  };

  const deleteProduct = async (id) => {
    if (window.confirm("Supprimer ?")) {
      const product = products.find(p => p._id === id);
      if (product) addMovement(product.name, 'sortie', product.quantity, 'Suppression produit');
      try {
        await api.delete(`/products/${id}`);
        setProducts(products.filter(p => p._id !== id));
      } catch (err) { alert("Erreur"); }
    }
  };

  const updateProduct = async () => {
    const oldProduct = products.find(p => p._id === editingId);
    const updatedData = {
      name: editName || oldProduct.name,
      quantity: editQuantity !== "" ? Number(editQuantity) : oldProduct.quantity,
      price: editPrice !== "" ? Number(editPrice) : oldProduct.price,
      category: editCategory || oldProduct.category,
      unit: editUnit || oldProduct.unit,
      seuilAlerte: editSeuilAlerte !== "" ? Number(editSeuilAlerte) : oldProduct.seuilAlerte,
      expirationDate: editExpirationDate ? new Date(editExpirationDate) : oldProduct.expirationDate
    };
    try {
      const res = await api.patch(`/products/${editingId}`, updatedData);
      setProducts(products.map(p => p._id === editingId ? res.data : p));
      const diff = res.data.quantity - oldProduct.quantity;
      if (diff !== 0) addMovement(res.data.name, diff > 0 ? 'entrée' : 'sortie', Math.abs(diff), 'Modification');
      setEditingId(null);
    } catch (err) { alert("Erreur"); }
  };

  const adjustStock = async (id, adjustment, reason) => {
    const product = products.find(p => p._id === id);
    if (!product) return;
    const newQuantity = product.quantity + adjustment;
    if (newQuantity < 0) { alert("Quantité insuffisante!"); return; }
    try {
      const res = await api.patch(`/products/${id}`, { quantity: newQuantity });
      setProducts(products.map(p => p._id === id ? res.data : p));
      addMovement(product.name, adjustment > 0 ? 'entrée' : 'sortie', Math.abs(adjustment), reason);
    } catch (err) { alert("Erreur"); }
  };

  // ================= GESTION DES VENDEURS =================
  const createSeller = async () => {
    if (!newSellerName.trim()) {
      alert("Le nom du vendeur est obligatoire");
      return;
    }
    try {
      const res = await api.post('/sellers', { name: newSellerName });
      setSellers([...sellers, res.data]);
      setNewSellerName("");
    } catch (err) {
      alert("Erreur lors de la création du vendeur");
    }
  };

  const updateSeller = async () => {
    if (!editSellerName.trim()) {
      alert("Le nom est obligatoire");
      return;
    }
    try {
      const res = await api.patch(`/sellers/${editingSellerId}`, { name: editSellerName });
      setSellers(sellers.map(s => s._id === editingSellerId ? res.data : s));
      setEditingSellerId(null);
      setEditSellerName("");
    } catch (err) {
      alert("Erreur lors de la modification");
    }
  };

  const deleteSeller = async (id) => {
    if (window.confirm("Supprimer ce vendeur ?")) {
      try {
        await api.delete(`/sellers/${id}`);
        setSellers(sellers.filter(s => s._id !== id));
      } catch (err) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  const filteredProducts = products
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter(p => selectedCategory === "Tous" || p.category === selectedCategory);

  // ================= GRAPHIQUES =================
  const chartData = dashboard ? [
    { name: "Produits", value: dashboard.total_products },
    { name: "Stock Total", value: dashboard.total_stock },
    { name: "Valeur (k$)", value: dashboard.total_value / 1000 }
  ] : [];

  const categoryData = products.reduce((acc, p) => {
    const existing = acc.find(c => c.name === p.category);
    if (existing) existing.value += p.quantity;
    else acc.push({ name: p.category, value: p.quantity });
    return acc;
  }, []).slice(0, 10);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'];
  const monthlyData = [
    { month: 'Jan', ventes: 12500, achats: 8000 },
    { month: 'Fév', ventes: 15200, achats: 9500 },
    { month: 'Mar', ventes: 14800, achats: 8800 },
    { month: 'Avr', ventes: 16800, achats: 10200 },
    { month: 'Mai', ventes: 18500, achats: 11500 },
    { month: 'Juin', ventes: 19200, achats: 12800 }
  ];

  // ================= UI =================
  useEffect(() => {
    loadLogo();
  }, []);

  useEffect(() => {
    if (token && !isAdmin && !["ventes", "historique", "inventories"].includes(activeTab)) {
      setActiveTab("ventes");
    }
  }, [token, isAdmin, activeTab]);

  // Scanner QR
  useEffect(() => {
    if (showQRScanner) {
      const timer = setTimeout(() => {
        const container = document.getElementById("qr-reader");
        if (!container) return;
        const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
        scanner.render(
          (decodedText) => {
            console.log('QR scanné:', decodedText);
            const cleanText = decodedText.trim();
            const product = products.find(p => p.qrCode === cleanText || p._id === cleanText);
            if (product) {
              addToCart(product);
              setShowQRScanner(false);
              alert(`✅ Produit scanné: ${product.name}`);
            } else {
              alert(`❌ Produit non trouvé! Code: ${cleanText}\nVérifiez que ce code correspond à un produit.`);
            }
            scanner.clear();
          },
          (error) => console.warn(error)
        );
        scannerRef.current = scanner;
      }, 100);
      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear();
          scannerRef.current = null;
        }
      };
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    }
  }, [showQRScanner, products, addToCart]);

  if (token) {
    return (
      <div style={dashboardContainer}>
        {/* HEADER */}
        <div style={topBar}>
          <div>
            {logoUrl ? <img src={logoUrl} alt="Logo" style={{ height: 50 }} /> : <><h1 style={{ margin: 0 }}>🏥 Andremed Prosperity</h1><p style={{ margin: 0, opacity: 0.8 }}>Gestion de Stock Médical</p></>}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={() => setShowCart(!showCart)} style={cartButton}>🛒 Panier {cartItemsCount > 0 && <span style={cartBadge}>{cartItemsCount}</span>}</button>
            {isAdmin ? (
              <>
                <button onClick={() => setActiveTab("dashboard")} style={{ ...tabBtn, background: activeTab === "dashboard" ? "white" : "rgba(255,255,255,0.2)", color: activeTab === "dashboard" ? "#764ba2" : "white" }}>📊 Dashboard</button>
                <button onClick={() => setActiveTab("stock")} style={{ ...tabBtn, background: activeTab === "stock" ? "white" : "rgba(255,255,255,0.2)", color: activeTab === "stock" ? "#764ba2" : "white" }}>📦 Stock</button>
                <button onClick={() => setActiveTab("ventes")} style={{ ...tabBtn, background: activeTab === "ventes" ? "white" : "rgba(255,255,255,0.2)", color: activeTab === "ventes" ? "#764ba2" : "white" }}>💰 Ventes</button>
                <button onClick={() => setActiveTab("historique")} style={{ ...tabBtn, background: activeTab === "historique" ? "white" : "rgba(255,255,255,0.2)", color: activeTab === "historique" ? "#764ba2" : "white" }}>📜 Historique</button>
                <button onClick={() => setActiveTab("alertes")} style={{ ...tabBtn, background: activeTab === "alertes" ? "white" : "rgba(255,255,255,0.2)", color: activeTab === "alertes" ? "#764ba2" : "white" }}>⚙️ Alertes</button>
                <button onClick={() => setActiveTab("users")} style={{ ...tabBtn, background: activeTab === "users" ? "white" : "rgba(255,255,255,0.2)", color: activeTab === "users" ? "#764ba2" : "white" }}>👥 Utilisateurs</button>
                <button onClick={() => setActiveTab("sellers")} style={{ ...tabBtn, background: activeTab === "sellers" ? "white" : "rgba(255,255,255,0.2)", color: activeTab === "sellers" ? "#764ba2" : "white" }}>👤 Vendeurs</button>
                <button onClick={() => setActiveTab("shops")} style={{ ...tabBtn, background: activeTab === "shops" ? "white" : "rgba(255,255,255,0.2)", color: activeTab === "shops" ? "#764ba2" : "white" }}>🏪 Boutiques</button>
                <button onClick={() => setActiveTab("payment")} style={{ ...tabBtn, background: activeTab === "payment" ? "white" : "rgba(255,255,255,0.2)", color: activeTab === "payment" ? "#764ba2" : "white" }}>💳 Paiement</button>
                <button onClick={() => setActiveTab("inventories")} style={{ ...tabBtn, background: activeTab === "inventories" ? "white" : "rgba(255,255,255,0.2)", color: activeTab === "inventories" ? "#764ba2" : "white" }}>📊 Inventaires</button>
                <button onClick={() => setActiveTab("inventoryDetail")} style={{ ...tabBtn, background: activeTab === "inventoryDetail" ? "white" : "rgba(255,255,255,0.2)", color: activeTab === "inventoryDetail" ? "#764ba2" : "white" }}>📋 Inventaire détaillé</button>
              </>
            ) : (
              <>
                <button onClick={() => setActiveTab("ventes")} style={{ ...tabBtn, background: activeTab === "ventes" ? "white" : "rgba(255,255,255,0.2)", color: activeTab === "ventes" ? "#764ba2" : "white" }}>💰 Ventes</button>
                <button onClick={() => setActiveTab("historique")} style={{ ...tabBtn, background: activeTab === "historique" ? "white" : "rgba(255,255,255,0.2)", color: activeTab === "historique" ? "#764ba2" : "white" }}>📜 Historique</button>
                <button onClick={() => setActiveTab("inventories")} style={{ ...tabBtn, background: activeTab === "inventories" ? "white" : "rgba(255,255,255,0.2)", color: activeTab === "inventories" ? "#764ba2" : "white" }}>📊 Inventaires</button>
                <button onClick={() => setActiveTab("inventoryDetail")} style={{ ...tabBtn, background: activeTab === "inventoryDetail" ? "white" : "rgba(255,255,255,0.2)", color: activeTab === "inventoryDetail" ? "#764ba2" : "white" }}>📋 Inventaire détaillé</button>
              </>
            )}
            <button onClick={logout} style={logoutBtn}>🔐 Déconnexion</button>
          </div>
        </div>

        {/* MODAL SCAN QR (identique) */}
        {showQRScanner && (
          <div style={modalOverlay} onClick={() => setShowQRScanner(false)}>
            <div style={{ ...modalContent, maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3>📷 Scanner un QR Code</h3>
                <button onClick={() => setShowQRScanner(false)} style={closeBtn}>✖</button>
              </div>
              <p>Placez le QR code du produit devant la caméra :</p>
              <div id="qr-reader" style={{ width: "100%", background: "#000", borderRadius: 12, overflow: "hidden" }}></div>
              <div style={{ marginTop: 15, textAlign: "center" }}>
                <p>Ou entrez manuellement le code :</p>
                <input type="text" placeholder="Code produit ou ID" style={inputStyle} onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const product = products.find(p => p.qrCode === e.target.value || p._id === e.target.value);
                    if (product) { addToCart(product); setShowQRScanner(false); alert(`✅ Produit ajouté: ${product.name}`); }
                    else alert("❌ Produit non trouvé!");
                  }
                }} />
              </div>
            </div>
          </div>
        )}

        {/* MODAL QR CODE (identique) */}
        {showQRCodeModal && selectedProductForQR && (
          <div style={modalOverlay} onClick={() => setShowQRCodeModal(false)}>
            <div style={{ ...modalContent, maxWidth: "400px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h3>📱 QR Code Produit</h3>
                <button onClick={() => setShowQRCodeModal(false)} style={closeBtn}>✖</button>
              </div>
              <QRCodeCanvas value={selectedProductForQR.qrCode || selectedProductForQR._id} size={250} level="H" includeMargin />
              <p><strong>{selectedProductForQR.name}</strong></p>
              <p>Prix: {selectedProductForQR.price} $ / {selectedProductForQR.unit}</p>
              <p>Code: {selectedProductForQR.qrCode || selectedProductForQR._id}</p>
              <div style={{ display: "flex", gap: 10, marginTop: 15, justifyContent: "center" }}>
                <button onClick={() => { navigator.clipboard.writeText(selectedProductForQR.qrCode || selectedProductForQR._id); alert("Code copié!"); }} style={{ ...saveBtn, width: "auto" }}>📋 Copier</button>
                <button onClick={() => printQRCode(selectedProductForQR)} style={{ ...saveBtn, background: "#2196F3", width: "auto" }}>🖨️ Imprimer QR</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL PANIER (identique) */}
        {showCart && (
          <div style={modalOverlay} onClick={() => setShowCart(false)}>
            <div style={{ ...modalContent, maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h3>🛒 Panier d'achat</h3>
                <button onClick={() => setShowCart(false)} style={closeBtn}>✖</button>
              </div>
              {cart.length === 0 ? <p style={{ textAlign: "center", padding: 40 }}>Panier vide</p> : (
                <>
                  <div style={{ maxHeight: 400, overflowY: "auto" }}>
                    {cart.map(item => (
                      <div key={item.productId} style={cartItemStyle}>
                        <div style={{ flex: 2 }}><strong>{item.name}</strong><div style={{ fontSize: 12 }}>{item.price} $ / {item.unit}</div></div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <button onClick={() => updateCartQuantity(item.productId, item.cartQuantity - 1)} style={qtyBtn}>-</button>
                          <span style={{ minWidth: 40, textAlign: "center" }}>{item.cartQuantity}</span>
                          <button onClick={() => updateCartQuantity(item.productId, item.cartQuantity + 1)} style={qtyBtn}>+</button>
                          <span style={{ minWidth: 80, textAlign: "right" }}>{(item.price * item.cartQuantity).toFixed(2)} $</span>
                          <button onClick={() => removeFromCart(item.productId)} style={deleteBtn}>✖</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={cartTotalStyle}><strong>Total:</strong> {cartTotal.toFixed(2)} $</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
                    <button onClick={validateSale} style={validateBtn}>✅ Valider la vente</button>
                    <button onClick={cancelSale} style={cancelBtn}>🗑️ Vider le panier</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* MODAL CONFIRMATION VENDEUR (avec sélection dans liste) */}
        {sellerConfirmation.show && (
          <div style={modalOverlay} onClick={() => setSellerConfirmation({ show: false, pendingSaleData: null })}>
            <div style={{ ...modalContent, maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <h3>🔐 Confirmation vendeur</h3>
                <button onClick={() => setSellerConfirmation({ show: false, pendingSaleData: null })} style={closeBtn}>✖</button>
              </div>
              <div>
                <label>Nom du vendeur (caissier) :</label>
                <select value={selectedSellerId} onChange={(e) => setSelectedSellerId(e.target.value)} style={inputStyle}>
                  <option value="">-- Sélectionnez votre nom --</option>
                  {sellers.map(seller => (
                    <option key={seller._id} value={seller._id}>{seller.name}</option>
                  ))}
                </select>

                <label style={{ marginTop: 10, display: "block" }}>Nom de l'acheteur / destinataire :</label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  style={inputStyle}
                  placeholder="Ex: Clinique Saint-Joseph, Patient X"
                  autoComplete="off"
                />

                {paymentSettings.smsVerification.enabled && (
                  <div style={{ marginTop: 15 }}>
                    {!showCodeInput ? (
                      <button
                        onClick={confirmSellerAndProceed}
                        style={saveBtn}
                        disabled={isSendingCode}
                      >
                        {isSendingCode ? "Envoi en cours..." : "📱 Recevoir un code SMS"}
                      </button>
                    ) : (
                      <>
                        <label>Code de vérification reçu par SMS :</label>
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          style={inputStyle}
                          placeholder="Code à 6 chiffres"
                        />
                        {codeError && <div style={{ color: "red", fontSize: 12, marginBottom: 10 }}>{codeError}</div>}
                        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                          <button onClick={verifyCodeAndProceed} style={validateBtn}>Vérifier et continuer</button>
                          <button onClick={() => setShowCodeInput(false)} style={cancelBtn}>Annuler</button>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {!paymentSettings.smsVerification.enabled && (
                  <button onClick={confirmSellerAndProceed} style={validateBtn} style={{ marginTop: 20 }}>
                    Continuer vers le paiement
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL PAIEMENT (identique) */}
        {paymentModal.show && (
          <div style={modalOverlay} onClick={() => setPaymentModal({ show: false, total: 0, saleData: null })}>
            <div style={{ ...modalContent, maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
              <h3>💰 Choisir le mode de paiement</h3>
              <p>Total : <strong>{paymentModal.total.toFixed(2)} $</strong></p>
              <input type="text" placeholder="Commentaire / destination (ex: Service pédiatrie)" 
                     value={saleComment} onChange={(e) => setSaleComment(e.target.value)} 
                     style={{ ...inputStyle, width: '100%', marginBottom: 10 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "20px 0" }}>
                <button onClick={() => processSale("cash")} style={paymentOptionBtn}>💵 Espèces</button>
                <button onClick={() => processSale("bank_transfer")} style={paymentOptionBtn}>🏦 Virement bancaire</button>
                <button onClick={() => processSale("credit")} style={paymentOptionBtn}>💳 Crédit</button>
                <button onClick={() => processSale("contract")} style={paymentOptionBtn}>📄 Contrat</button>
                <button onClick={() => setShowMobileMoneyForm(true)} style={paymentOptionBtn}>📱 Mobile Money</button>
              </div>
              {showMobileMoneyForm && (
                <div style={{ marginTop: 20, borderTop: "1px solid #ddd", paddingTop: 20 }}>
                  <h4>Paiement Mobile Money</h4>
                  <select value={selectedOperator} onChange={(e) => setSelectedOperator(e.target.value)} style={inputStyle}>
                    <option value="">-- Opérateur --</option>
                    <option value="airtel">Airtel Money</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="orange">Orange Money</option>
                  </select>
                  <input type="tel" placeholder="Numéro de téléphone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} style={inputStyle} />
                  <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                    <button onClick={() => processMobileMoneyPayment()} style={validateBtn}>Confirmer paiement</button>
                    <button onClick={() => setShowMobileMoneyForm(false)} style={cancelBtn}>Annuler</button>
                  </div>
                  <p style={{ fontSize: 12, color: "#666", marginTop: 10 }}>
                    Numéros marchands :<br />Airtel: {paymentSettings.airtel}<br />M-Pesa: {paymentSettings.mpesa}<br />Orange: {paymentSettings.orange}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DASHBOARD TAB (identique) */}
        {activeTab === "dashboard" && isAdmin && (
          <>
            <button onClick={loadDashboard} style={btnStyle}>🔄 Actualiser</button>
            {dashboard && (
              <>
                <div style={gridStyle}>
                  <Card title="Produits" value={dashboard.total_products} bgColor="#4CAF50" icon="📦" />
                  <Card title="Stock Total" value={dashboard.total_stock} bgColor="#2196F3" icon="📊" />
                  <Card title="Alertes Stock" value={dashboard.alerts} bgColor="#f44336" icon="⚠️" />
                  <Card title="Critique" value={dashboard.critical} bgColor="#FF5722" icon="🔥" />
                  <Card title="Valeur Stock" value={`${dashboard.total_value.toLocaleString()} $`} bgColor="#FF9800" icon="💰" />
                  <Card title="CA Total" value={`${dashboard.monthly_turnover.toLocaleString()} $`} bgColor="#9C27B0" icon="📈" />
                  <Card title="Ventes Aujourd'hui" value={`${dashboard.today_sales.toFixed(2)} $`} bgColor="#00BCD4" icon="🛒" />
                  <Card title="Nombre de ventes" value={salesHistory.length} bgColor="#795548" icon="📋" />
                  {isAdmin && <Card title="Boutiques" value={shops.length} bgColor="#3f51b5" icon="🏪" />}
                </div>

                {lowStockProducts.length > 0 && (
                  <div style={alertContainer}>
                    <h3 style={{ margin: 0, color: "#f44336" }}>⚠️ Alertes Stock Bas ({lowStockProducts.length})</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                      {lowStockProducts.slice(0, 8).map(p => (
                        <div key={p._id} style={alertBadge}>{p.name}: {p.quantity}/{p.seuilAlerte || 10} {p.unit}</div>
                      ))}
                      {lowStockProducts.length > 8 && <div style={alertBadge}>+{lowStockProducts.length - 8} autres</div>}
                    </div>
                    {alertSettings.autoReorder && <button style={reorderBtn} onClick={() => alert("Commande automatique générée!")}>🛒 Générer commandes</button>}
                  </div>
                )}

                {expiringSoonProducts.length > 0 && (
                  <div style={{ ...alertContainer, background: "rgba(255,152,0,0.2)", borderLeftColor: "#FF9800" }}>
                    <h3 style={{ margin: 0, color: "#FF9800" }}>⏰ Produits proches de la péremption ({expiringSoonProducts.length})</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                      {expiringSoonProducts.slice(0, 8).map(p => (
                        <div key={p._id} style={{ ...alertBadge, background: "#FF9800" }}>
                          {p.name} – expire le {new Date(p.expirationDate).toLocaleDateString()}
                        </div>
                      ))}
                      {expiringSoonProducts.length > 8 && <div style={{ ...alertBadge, background: "#FF9800" }}>+{expiringSoonProducts.length - 8} autres</div>}
                    </div>
                  </div>
                )}

                {expiredProducts.length > 0 && (
                  <div style={{ ...alertContainer, background: "rgba(244,67,54,0.2)", borderLeftColor: "#f44336" }}>
                    <h3 style={{ margin: 0, color: "#f44336" }}>❌ Produits expirés ({expiredProducts.length})</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                      {expiredProducts.slice(0, 8).map(p => (
                        <div key={p._id} style={{ ...alertBadge, background: "#f44336" }}>
                          {p.name} – expiré depuis le {new Date(p.expirationDate).toLocaleDateString()}
                        </div>
                      ))}
                      {expiredProducts.length > 8 && <div style={{ ...alertBadge, background: "#f44336" }}>+{expiredProducts.length - 8} autres</div>}
                    </div>
                  </div>
                )}

                {/* GRAPHIQUES (identique) */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))", gap: 25, marginBottom: 30 }}>
                  <div style={graphContainer}>
                    <h3 style={{ textAlign: "center" }}>📈 Aperçu Général</h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#fff" />
                        <YAxis stroke="#fff" />
                        <Tooltip contentStyle={{ backgroundColor: "#333", color: "#fff" }} />
                        <Bar dataKey="value" fill="#fff" radius={[8,8,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ ...graphContainer, minHeight: "500px", display: "flex", flexDirection: "column" }}>
                    <h3 style={{ textAlign: "center" }}>🥧 Répartition par Catégorie</h3>
                    <div style={{ flex: 1, minHeight: 420 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                          <Pie data={categoryData} cx="50%" cy="50%" labelLine outerRadius={140} innerRadius={70} fill="#8884d8" dataKey="value" label={({ cx, cy, midAngle, outerRadius, percent, name }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = outerRadius + 30;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            const shortName = name.length > 12 ? name.substring(0, 10) + "…" : name;
                            return <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" style={{ fontSize: 11, fontWeight: 'bold' }}>{`${shortName} ${(percent * 100).toFixed(0)}%`}</text>;
                          }}>
                            {categoryData.map((entry, idx) => <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} stroke="white" strokeWidth={2} />)}
                          </Pie>
                          <Tooltip formatter={(value, name) => {
                            const total = categoryData.reduce((sum, i) => sum + i.value, 0);
                            const percent = ((value / total) * 100).toFixed(1);
                            return [`${value} unités (${percent}%)`, name];
                          }} />
                          <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 11, backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 10, padding: 12 }} formatter={(value, entry, idx) => {
                            const data = categoryData[idx];
                            if (!data) return value;
                            const total = categoryData.reduce((sum, i) => sum + i.value, 0);
                            const percent = ((data.value / total) * 100).toFixed(1);
                            return `${value.length > 15 ? value.substring(0,12)+"…" : value}: ${data.value} (${percent}%)`;
                          }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                <div style={graphContainer}>
                  <h3 style={{ textAlign: "center" }}>📊 Évolution Mensuelle</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <XAxis dataKey="month" stroke="#fff" />
                      <YAxis stroke="#fff" />
                      <Tooltip contentStyle={{ backgroundColor: "#333", color: "#fff" }} />
                      <Legend wrapperStyle={{ color: "#fff" }} />
                      <Line type="monotone" dataKey="ventes" stroke="#4CAF50" strokeWidth={2} name="Ventes ($)" dot={{ fill: '#4CAF50', r: 4 }} />
                      <Line type="monotone" dataKey="achats" stroke="#FF9800" strokeWidth={2} name="Achats ($)" dot={{ fill: '#FF9800', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </>
        )}

        {/* VENTES TAB (identique) */}
        {activeTab === "ventes" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, marginBottom: 20, flexWrap: "wrap", gap: 15 }}>
              <h2>💰 Point de Vente</h2>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowQRScanner(true)} style={scanBtn}>📷 Scanner QR Code</button>
                <button onClick={() => setShowCart(true)} style={cartButtonLarge}>🛒 Voir le panier ({cartItemsCount} articles - {cartTotal.toFixed(2)} $)</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <input placeholder="🔍 Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} style={searchInputStyle} />
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ padding: "10px 15px", borderRadius: 8, background: "#2d3748", color: "white" }}>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div style={productsGrid}>
              {filteredProducts.map(p => {
                const expiryStatus = getExpiryStatus(p.expirationDate);
                return (
                  <div key={p._id} style={productCardVente}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ margin: "0 0 10px 0", fontSize: 16 }}>{p.name}</h3>
                      <span style={stockBadge(p.quantity)}>Stock: {p.quantity} {p.unit}</span>
                    </div>
                    <p><strong>📁 Catégorie:</strong> {p.category}</p>
                    <p><strong>💰 Prix:</strong> {p.price} USD / {p.unit}</p>
                    {expiryStatus === 'expired' && <span style={{ background: '#f44336', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>Expiré</span>}
                    {expiryStatus === 'expiring-soon' && <span style={{ background: '#FF9800', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>Expire bientôt</span>}
                    <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
                      <button onClick={() => addToCart(p)} style={sellBtn} disabled={p.quantity === 0}>{p.quantity === 0 ? "❌ Rupture" : "🛒 Ajouter"}</button>
                      <button onClick={() => generateQRCode(p)} style={qrBtn}>📱</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* STOCK TAB (identique) */}
        {activeTab === "stock" && isAdmin && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, flexWrap: "wrap", gap: 15 }}>
              <h2>📦 Catalogue Produits ({filteredProducts.length})</h2>
              <div>
                <button onClick={() => exportData('products')} style={{ ...exportBtn, marginRight: 10 }}>📥 Exporter CSV</button>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ padding: "10px 15px", borderRadius: 8, background: "#2d3748", color: "white" }}>
                  {categories.map(cat => <option key={cat} value={cat}>{cat} {cat !== "Tous" ? `(${products.filter(p => p.category === cat).length})` : ""}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <input placeholder="🔍 Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} style={searchInputStyle} />
              <span style={{ background: "rgba(255,255,255,0.2)", padding: "10px 15px", borderRadius: 8 }}>Valeur totale: {filteredProducts.reduce((s, p) => s + p.quantity * p.price, 0).toLocaleString()} $</span>
            </div>
            <div style={formContainer}>
              <h3>➕ Ajouter un produit</h3>
              <div style={formGrid}>
                <input placeholder="Nom *" value={productName} onChange={(e) => setProductName(e.target.value)} style={inputStyle} />
                <input placeholder="Quantité *" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={inputStyle} />
                <input placeholder="Prix USD *" type="number" value={price} onChange={(e) => setPrice(e.target.value)} style={inputStyle} />
                <input placeholder="Catégorie" value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle} list="categories" />
                <datalist id="categories">{categories.filter(c => c !== "Tous").map(c => <option key={c} value={c} />)}</datalist>
                <input placeholder="Unité" value={unit} onChange={(e) => setUnit(e.target.value)} style={inputStyle} />
                <input placeholder="Seuil alerte" type="number" value={seuilAlerte} onChange={(e) => setSeuilAlerte(e.target.value)} style={inputStyle} />
                <input type="date" placeholder="Date de péremption" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} style={inputStyle} />
                <button onClick={createProduct} style={addBtn}>➕ Ajouter</button>
              </div>
            </div>
            <div style={productsGrid}>
              {filteredProducts.length === 0 ? <div style={{ textAlign: "center", gridColumn: "1/-1", padding: 40 }}>Aucun produit</div> : filteredProducts.map(p => {
                const stockStatus = p.quantity <= (p.seuilAlerte || 10) ? (p.quantity <= (p.seuilAlerte || 10)/2 ? "critique" : "alerte") : "normal";
                const expiryStatus = getExpiryStatus(p.expirationDate);
                return (
                  <div key={p._id} style={{ ...productCard, borderLeft: `4px solid ${stockStatus === "critique" ? "#f44336" : stockStatus === "alerte" ? "#FF9800" : "#4CAF50"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <h3 style={{ margin: 0, fontSize: 16 }}>{p.name}</h3>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button onClick={() => generateQRCode(p)} style={qrSmallBtn}>📱</button>
                        <button onClick={() => printQRCode(p)} style={{ ...qrSmallBtn, background: "#4CAF50" }}>🖨️</button>
                        <button onClick={() => deleteProduct(p._id)} style={deleteBtn}>✖</button>
                      </div>
                    </div>
                    <p><strong>📁 Catégorie:</strong> {p.category}</p>
                    <p><strong>📦 Quantité:</strong> <span style={{ color: stockStatus === "critique" ? "#f44336" : stockStatus === "alerte" ? "#FF9800" : "#4CAF50", fontWeight: "bold" }}>{p.quantity}</span> {p.unit} {p.quantity <= (p.seuilAlerte || 10) && <span style={{ marginLeft: 10, fontSize: 11, background: "#f44336", color: "white", padding: "2px 6px", borderRadius: 10 }}>Stock bas</span>}</p>
                    <p><strong>💰 Prix:</strong> {p.price} USD</p>
                    <p><strong>💵 Valeur:</strong> {(p.quantity * p.price).toLocaleString()} USD</p>
                    <p><strong>⚠️ Seuil alerte:</strong> {p.seuilAlerte || 10} {p.unit}</p>
                    <p><strong>📅 Péremption:</strong> {p.expirationDate ? new Date(p.expirationDate).toLocaleDateString() : "—"}</p>
                    {expiryStatus === 'expired' && <span style={{ background: '#f44336', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>Expiré</span>}
                    {expiryStatus === 'expiring-soon' && <span style={{ background: '#FF9800', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>Expire bientôt</span>}
                    <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
                      <button onClick={() => adjustStock(p._id, -1, "Consommation")} style={adjustBtn}>-1</button>
                      <button onClick={() => adjustStock(p._id, -10, "Consommation")} style={adjustBtn}>-10</button>
                      <button onClick={() => { const qty = prompt("Quantité à ajouter:", "1"); if (qty) adjustStock(p._id, parseInt(qty), "Réapprovisionnement"); }} style={{ ...adjustBtn, background: "#4CAF50" }}>+ Ajouter</button>
                      <button onClick={() => { setEditingId(p._id); setEditName(p.name); setEditQuantity(p.quantity); setEditPrice(p.price); setEditCategory(p.category); setEditUnit(p.unit); setEditSeuilAlerte(p.seuilAlerte); setEditExpirationDate(p.expirationDate ? p.expirationDate.slice(0,10) : ""); }} style={editBtn}>✏️ Modifier</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* HISTORIQUE DES VENTES TAB (ajout colonne vendeur) */}
        {activeTab === "historique" && (
          <div style={tableStyle}>
            <h2>📜 Historique des ventes</h2>
            <div style={{ display: 'flex', gap: 10, marginBottom: 15, alignItems: 'center', flexWrap: 'wrap' }}>
              <label>Filtrer par vendeur :</label>
              <select value={filterSeller} onChange={e => setFilterSeller(e.target.value)} style={{ padding: '8px', borderRadius: 5, border: '1px solid #ccc' }}>
                <option value="">Tous</option>
                {sellers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              <button onClick={() => exportData('sales')} style={exportBtn}>📥 Exporter CSV</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f0f0f0" }}>
                    <th>Date</th><th>Vendeur</th><th>Acheteur</th><th>Articles</th><th>Total</th><th>Commentaire</th><th>Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {salesHistory.filter(sale => !filterSeller || sale.sellerId === filterSeller).length === 0 ? 
                    <tr><td colSpan="7" style={{ textAlign: "center", padding: 40 }}>Aucune vente</td></tr> : 
                  salesHistory.filter(sale => !filterSeller || sale.sellerId === filterSeller).map(sale => (
                      <tr key={sale._id} style={{ borderBottom: "1px solid #ddd" }}>
                        <td style={tdStyle}>{new Date(sale.date).toLocaleString()}</td>
                        <td style={tdStyle}>{sale.sellerName || "—"}</td>
                        <td style={tdStyle}>{sale.buyerName || "—"}</td>
                        <td style={tdStyle}>{sale.itemsCount}</td>
                        <td style={tdStyle}><strong>{sale.total.toFixed(2)} $</strong></td>
                        <td style={tdStyle}>{sale.comment || "—"}</td>
                        <td style={tdStyle}>
                          <details>
                            <summary>{getPaymentMethodLabel(sale.paymentMethod)}</summary>
                            <div style={{ marginTop: 10, fontSize: 12 }}>
                              {sale.items.map((item, i) => <div key={i}>{item.name}: {item.cartQuantity} x {item.price}$ = {(item.cartQuantity * item.price).toFixed(2)}$</div>)}
                              {sale.paymentDetails && <div>Opérateur: {sale.paymentDetails.operator}<br />Téléphone: {sale.paymentDetails.phone}</div>}
                              <button onClick={() => printInvoice(sale)} style={{ marginTop: 10, padding: "4px 8px", background: "#4CAF50", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>🖨️ Imprimer</button>
                            </div>
                          </details>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
            <h2>📜 Historique des mouvements de stock</h2>
            <div style={{ overflowX: "auto", marginTop: 15 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ background: "#f0f0f0" }}><th>Date</th><th>Produit</th><th>Type</th><th>Qté</th><th>Raison</th><th>Utilisateur</th></tr></thead>
                <tbody>
                  {movementHistory.length === 0 ? <tr><td colSpan="6" style={{ textAlign: "center", padding: 40 }}>Aucun mouvement</td></tr> : movementHistory.map(m => (
                    <tr key={m._id} style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={tdStyle}>{new Date(m.date).toLocaleString()}</td>
                      <td style={tdStyle}>{m.productName}</td>
                      <td style={{ ...tdStyle, color: m.type === 'entrée' ? 'green' : 'red', fontWeight: "bold" }}>{m.type === 'entrée' ? '📥 Entrée' : '📤 Sortie'}</td>
                      <td style={tdStyle}>{m.quantity}</td>
                      <td style={tdStyle}>{m.reason}</td>
                      <td style={tdStyle}>{m.user?.name || m.user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ALERTES TAB (identique) */}
        {activeTab === "alertes" && isAdmin && (
          <div style={settingsContainer}>
            <h2>⚙️ Configuration des Alertes</h2>
            <div style={settingsCard}>
              <h3>🔔 Alertes Stock</h3>
              <div style={toggleRow}><label>Activer les alertes</label><input type="checkbox" checked={alertSettings.enabled} onChange={(e) => setAlertSettings({ ...alertSettings, enabled: e.target.checked })} style={checkboxStyle} /></div>
              <div style={toggleRow}><label>Notifications email</label><input type="checkbox" checked={alertSettings.emailNotifications} onChange={(e) => setAlertSettings({ ...alertSettings, emailNotifications: e.target.checked })} style={checkboxStyle} /></div>
              <div style={toggleRow}><label>SMS notifications</label><input type="checkbox" checked={alertSettings.smsNotifications} onChange={(e) => setAlertSettings({ ...alertSettings, smsNotifications: e.target.checked })} style={checkboxStyle} /></div>
              <div style={toggleRow}><label>Réapprovisionnement automatique</label><input type="checkbox" checked={alertSettings.autoReorder} onChange={(e) => setAlertSettings({ ...alertSettings, autoReorder: e.target.checked })} style={checkboxStyle} /></div>
            </div>
            <div style={settingsCard}>
              <h3>📊 Résumé des alertes</h3>
              <p><strong>⚠️ Produits en alerte:</strong> {lowStockProducts.length}</p>
              <p><strong>🔥 Produits critiques:</strong> {criticalStock.length}</p>
              <p><strong>📦 Valeur totale du stock:</strong> {totalValue.toLocaleString()} $</p>
              <p><strong>💰 CA total:</strong> {salesHistory.reduce((s, v) => s + v.total, 0).toLocaleString()} $</p>
              <button style={exportBtn} onClick={() => {
                const dataStr = JSON.stringify(products.filter(p => p.quantity <= (p.seuilAlerte || 10)), null, 2);
                const blob = new Blob([dataStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'alertes_stock.json';
                a.click();
              }}>📥 Exporter les alertes</button>
            </div>
          </div>
        )}

        {/* UTILISATEURS TAB (identique) */}
        {activeTab === "users" && isAdmin && (
          <div style={settingsContainer}>
            <h2>👥 Gestion des utilisateurs</h2>
            <div style={formContainer}>
              <h3>➕ Ajouter un utilisateur</h3>
              <div style={formGrid}>
                <input placeholder="Nom" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} style={inputStyle} />
                <input placeholder="Email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} style={inputStyle} />
                <input placeholder="Mot de passe" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} style={inputStyle} />
                <input placeholder="Téléphone (ex: +243...)" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} style={inputStyle} />
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} style={inputStyle}><option value="user">Utilisateur</option><option value="admin">Admin</option><option value="demo">Démo</option></select>
                <button onClick={async () => {
                  if (!newUser.email || !newUser.password || !newUser.name) { alert("Tous les champs obligatoires"); return; }
                  if (users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) { alert("Email existe déjà"); return; }
                  try { const res = await api.post('/users', newUser); setUsers([...users, res.data]); setNewUser({ email: "", password: "", name: "", role: "user", phone: "" }); } catch (err) { alert("Erreur"); }
                }} style={addBtn}>➕ Ajouter</button>
              </div>
            </div>
            <div style={tableStyle}>
              <h3>📋 Liste des utilisateurs</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ background: "#f0f0f0" }}><th>Nom</th><th>Email</th><th>Téléphone</th><th>Rôle</th><th>Actions</th></tr></thead>
                <tbody>{users.map(user => (
                  <tr key={user._id} style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={tdStyle}>{user.name}</td>
                    <td style={tdStyle}>{user.email}</td>
                    <td style={tdStyle}>{user.phone || "—"}</td>
                    <td style={tdStyle}>{user.role}</td>
                    <td style={tdStyle}><button onClick={async () => { if (window.confirm(`Supprimer ${user.name} ?`)) { try { await api.delete(`/users/${user._id}`); setUsers(users.filter(u => u._id !== user._id)); } catch (err) { alert("Erreur"); } } }} style={deleteBtn}>🗑️</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* GESTION DES VENDEURS (NOUVEAU) */}
        {activeTab === "sellers" && isAdmin && (
          <div style={settingsContainer}>
            <h2>👤 Gestion des vendeurs (caissiers)</h2>
            <div style={formContainer}>
              <h3>➕ Ajouter un vendeur</h3>
              <div style={formGrid}>
                <input placeholder="Nom du vendeur" value={newSellerName} onChange={(e) => setNewSellerName(e.target.value)} style={inputStyle} />
                <button onClick={createSeller} style={addBtn}>➕ Ajouter</button>
              </div>
            </div>
            <div style={tableStyle}>
              <h3>📋 Liste des vendeurs</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ background: "#f0f0f0" }}><th>Nom</th><th>Actions</th></tr></thead>
                <tbody>
                  {sellers.map(seller => (
                    <tr key={seller._id}>
                      <td style={tdStyle}>
                        {editingSellerId === seller._id ? (
                          <input value={editSellerName} onChange={(e) => setEditSellerName(e.target.value)} style={inputStyle} autoFocus />
                        ) : seller.name}
                      </td>
                      <td style={tdStyle}>
                        {editingSellerId === seller._id ? (
                          <>
                            <button onClick={updateSeller} style={saveBtn}>💾</button>
                            <button onClick={() => { setEditingSellerId(null); setEditSellerName(""); }} style={cancelBtn}>❌</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditingSellerId(seller._id); setEditSellerName(seller.name); }} style={editBtn}>✏️</button>
                            <button onClick={() => deleteSeller(seller._id)} style={deleteBtn}>🗑️</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {sellers.length === 0 && <tr><td colSpan="2" style={{ textAlign: "center", padding: 40 }}>Aucun vendeur enregistré</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BOUTIQUES TAB (identique) */}
        {activeTab === "shops" && isAdmin && (
          <div style={settingsContainer}>
            <h2>🏪 Gestion des boutiques (max 3)</h2>
            <div style={formContainer}>
              <h3>➕ Ajouter / Modifier une boutique</h3>
              <div style={formGrid}>
                <input placeholder="Nom" value={shopForm.name} onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })} style={inputStyle} />
                <input placeholder="Adresse" value={shopForm.address} onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })} style={inputStyle} />
                <input placeholder="Téléphone" value={shopForm.phone} onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })} style={inputStyle} />
                <button onClick={async () => {
                  if (!shopForm.name) { alert("Nom obligatoire"); return; }
                  if (editingShopId !== null) {
                    try { const res = await api.patch(`/shops/${editingShopId}`, shopForm); setShops(shops.map(s => s._id === editingShopId ? res.data : s)); setEditingShopId(null); } catch (err) { alert("Erreur"); }
                  } else {
                    if (shops.length >= 3) { alert("Maximum 3 boutiques"); return; }
                    try { const res = await api.post('/shops', shopForm); setShops([...shops, res.data]); } catch (err) { alert("Erreur"); }
                  }
                  setShopForm({ name: "", address: "", phone: "" });
                }} style={addBtn}>{editingShopId ? "💾 Modifier" : "➕ Ajouter"}</button>
                {editingShopId && <button onClick={() => { setEditingShopId(null); setShopForm({ name: "", address: "", phone: "" }); }} style={cancelBtn}>Annuler</button>}
              </div>
            </div>
            <div style={tableStyle}>
              <h3>📋 Liste des boutiques</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ background: "#f0f0f0" }}><th>Nom</th><th>Adresse</th><th>Téléphone</th><th>Actions</th></tr></thead>
                <tbody>
                  {shops.map(shop => (
                    <tr key={shop._id}>
                      <td>{shop.name}</td>
                      <td>{shop.address}</td>
                      <td>{shop.phone}</td>
                      <td><button onClick={() => { setEditingShopId(shop._id); setShopForm({ name: shop.name, address: shop.address, phone: shop.phone }); }} style={editBtn}>✏️</button>
                      <button onClick={async () => { if (window.confirm(`Supprimer ${shop.name} ?`)) { try { await api.delete(`/shops/${shop._id}`); setShops(shops.filter(s => s._id !== shop._id)); } catch (err) { alert("Erreur"); } } }} style={deleteBtn}>🗑️</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PAIEMENT TAB (identique) */}
        {activeTab === "payment" && isAdmin && (
          <div style={settingsContainer}>
            <h2>💳 Paramètres de paiement mobile money</h2>
            <div style={settingsCard}>
              <h3>Numéros marchands</h3>
              <div style={formGrid}>
                <label>Airtel Money :</label><input type="text" value={paymentSettings.airtel} onChange={(e) => setPaymentSettings({ ...paymentSettings, airtel: e.target.value })} style={inputStyle} />
                <label>M-Pesa :</label><input type="text" value={paymentSettings.mpesa} onChange={(e) => setPaymentSettings({ ...paymentSettings, mpesa: e.target.value })} style={inputStyle} />
                <label>Orange Money :</label><input type="text" value={paymentSettings.orange} onChange={(e) => setPaymentSettings({ ...paymentSettings, orange: e.target.value })} style={inputStyle} />
              </div>
              <button onClick={async () => { try { await api.put('/payments/settings', paymentSettings); alert("Paramètres sauvegardés"); } catch (err) { alert("Erreur"); } }} style={saveBtn}>💾 Sauvegarder</button>
            </div>
            <div style={settingsCard}>
              <h3>🏦 Coordonnées bancaires (virement)</h3>
              <input placeholder="IBAN" value={paymentSettings.bankDetails.iban} onChange={e => setPaymentSettings({...paymentSettings, bankDetails: {...paymentSettings.bankDetails, iban: e.target.value}})} style={inputStyle} />
              <input placeholder="SWIFT/BIC" value={paymentSettings.bankDetails.swift} onChange={e => setPaymentSettings({...paymentSettings, bankDetails: {...paymentSettings.bankDetails, swift: e.target.value}})} style={inputStyle} />
              <input placeholder="Titulaire du compte" value={paymentSettings.bankDetails.accountHolder} onChange={e => setPaymentSettings({...paymentSettings, bankDetails: {...paymentSettings.bankDetails, accountHolder: e.target.value}})} style={inputStyle} />
              <button onClick={async () => { try { await api.put('/payments/settings', paymentSettings); alert("Paramètres sauvegardés"); } catch (err) { alert("Erreur"); } }} style={saveBtn}>💾 Sauvegarder</button>
            </div>
            <div style={settingsCard}>
              <h3>🖼️ Logo de l'application</h3>
              <input type="text" placeholder="URL du logo (png, jpg, svg)" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} style={inputStyle} />
              <button onClick={saveLogo} style={saveBtn}>💾 Sauvegarder le logo</button>
              {logoUrl && <img src={logoUrl} alt="Logo" style={{ marginTop: 10, height: 50 }} />}
            </div>
            <div style={settingsCard}>
              <h3>📱 Vérification par SMS (facultatif)</h3>
              <div style={toggleRow}>
                <label>Activer l'envoi de code avant validation</label>
                <input type="checkbox" checked={paymentSettings.smsVerification.enabled} onChange={(e) => setPaymentSettings({ ...paymentSettings, smsVerification: { ...paymentSettings.smsVerification, enabled: e.target.checked } })} style={checkboxStyle} />
              </div>
              <p style={{ fontSize: 12, marginTop: 5 }}>Lorsqu'activé, le vendeur devra entrer un code reçu par SMS pour confirmer la vente. Assurez-vous que chaque vendeur a un numéro de téléphone enregistré.</p>
            </div>
          </div>
        )}

        {/* INVENTAIRES TAB (identique) */}
        {activeTab === "inventories" && (
          <div style={settingsContainer}>
            <h2>📊 Inventaire mensuel par produit</h2>
            <InventoryByProduct products={products} users={users} onSave={() => { loadInventories(); loadProducts(); }} />
            <div style={tableStyle}>
              <h3>Historique des inventaires</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ background: "#f0f0f0" }}><th>Mois/Année</th><th>Produit</th><th>Stock réel</th><th>Expirés</th><th>Pertes</th><th>Vendues</th><th>Utilisateur</th></tr></thead>
                <tbody>
                  {inventories.map(inv => (
                    <tr key={inv._id} style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={tdStyle}>{inv.month} {inv.year}</td>
                      <td style={tdStyle}>{inv.productId?.name}</td>
                      <td style={tdStyle}>{inv.qtyReal}</td>
                      <td style={tdStyle}>{inv.qtyExpired}</td>
                      <td style={tdStyle}>{inv.losses}</td>
                      <td style={tdStyle}>{inv.qtySold}</td>
                      <td style={tdStyle}>{inv.createdBy?.name || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* NOUVEAU : INVENTAIRE DÉTAILLÉ */}
        {activeTab === "inventoryDetail" && (
          <InventoryDetail products={products} users={users} />
        )}

        {/* MODAL D'ÉDITION PRODUIT (identique) */}
        {editingId && (
          <div style={modalOverlay} onClick={() => setEditingId(null)}>
            <div style={modalContent} onClick={(e) => e.stopPropagation()}>
              <h3>✏️ Modifier le produit</h3>
              <input placeholder="Nom" value={editName} onChange={(e) => setEditName(e.target.value)} style={inputStyle} />
              <input placeholder="Quantité" type="number" value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)} style={inputStyle} />
              <input placeholder="Prix" type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={inputStyle} />
              <input placeholder="Catégorie" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={inputStyle} />
              <input placeholder="Unité" value={editUnit} onChange={(e) => setEditUnit(e.target.value)} style={inputStyle} />
              <input placeholder="Seuil alerte" type="number" value={editSeuilAlerte} onChange={(e) => setEditSeuilAlerte(e.target.value)} style={inputStyle} />
              <input type="date" placeholder="Date de péremption" value={editExpirationDate} onChange={(e) => setEditExpirationDate(e.target.value)} style={inputStyle} />
              <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
                <button onClick={updateProduct} style={saveBtn}>💾 Sauvegarder</button>
                <button onClick={() => setEditingId(null)} style={cancelBtn}>❌ Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // LOGIN (identique)
  return (
    <div style={loginContainer}>
      <div style={loginBox}>
        <div style={{ textAlign: "center", marginBottom: 25 }}>
          <div style={logoContainer}>
            {logoUrl ? <img src={logoUrl} alt="Logo" style={{ width: 80, height: 80, objectFit: "contain" }} /> : <span style={logoIcon}>🏥</span>}
          </div>
          <h2>Andremed Prosperity</h2>
          <p>Gestion de Stock Médical</p>
        </div>
        <h3 style={{ textAlign: "center" }}>🔐 Connexion</h3>
        {loginError && <div style={errorStyle}>{loginError}</div>}
        <input type="email" placeholder="📧 Email" value={email} onChange={(e) => setEmail(e.target.value)} style={loginInput} onKeyPress={(e) => e.key === 'Enter' && login()} autoFocus />
        <input type="password" placeholder="🔐 Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} style={loginInput} onKeyPress={(e) => e.key === 'Enter' && login()} />
        <button onClick={login} style={isLoading ? { ...loginBtn, opacity: 0.7, cursor: "wait" } : loginBtn} disabled={isLoading}>{isLoading ? "⏳ Connexion..." : "🚀 Se connecter"}</button>
        <div style={demoInfoStyle}>
          <p><strong>📋 Comptes disponibles :</strong></p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px", fontSize: "11px" }}>
            {users.map(user => <div key={user._id}>📧 {user.email}<br />🔑 {user.password}<br />📱 {user.phone || "—"}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ================= COMPOSANTS =================
const Card = ({ title, value, bgColor, icon }) => (
  <div style={{ background: bgColor, padding: 20, borderRadius: 15, color: "white", minWidth: "160px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h3 style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>{title}</h3>
      <span style={{ fontSize: 24 }}>{icon}</span>
    </div>
    <p style={{ margin: "10px 0 0 0", fontSize: "26px", fontWeight: "bold" }}>{value}</p>
  </div>
);

// ================= STYLES (identique) =================
const dashboardContainer = { padding: 30, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", minHeight: "100vh", color: "white" };
const gridStyle = { display: "flex", gap: 15, flexWrap: "wrap", marginBottom: 30 };
const btnStyle = { padding: "10px 20px", background: "white", color: "#764ba2", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", marginBottom: 20 };
const tabBtn = { padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: "bold", transition: "all 0.3s" };
const productCard = { background: "white", color: "#333", padding: 15, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", transition: "transform 0.2s" };
const productCardVente = { background: "white", color: "#333", padding: 15, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" };
const deleteBtn = { background: "#f44336", color: "white", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" };
const editBtn = { background: "#2196F3", color: "white", border: "none", borderRadius: 5, padding: "6px 12px", cursor: "pointer", fontSize: 12 };
const adjustBtn = { background: "#FF9800", color: "white", border: "none", borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontSize: 12 };
const sellBtn = { flex: 1, padding: "10px", background: "#4CAF50", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" };
const qrBtn = { padding: "10px", background: "#9C27B0", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px" };
const qrSmallBtn = { background: "#9C27B0", color: "white", border: "none", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" };
const scanBtn = { padding: "12px 24px", background: "#9C27B0", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" };
const cartButton = { background: "#FF9800", color: "white", border: "none", borderRadius: "20px", padding: "8px 16px", cursor: "pointer", fontWeight: "bold", position: "relative", display: "flex", alignItems: "center", gap: "5px" };
const cartButtonLarge = { background: "#FF9800", color: "white", border: "none", borderRadius: "10px", padding: "12px 24px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" };
const cartBadge = { background: "#f44336", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: "12px", marginLeft: "5px" };
const cartItemStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", borderBottom: "1px solid #eee", gap: "10px" };
const cartTotalStyle = { marginTop: "15px", padding: "15px", background: "#f5f5f5", borderRadius: "8px", textAlign: "right", fontSize: "18px" };
const qtyBtn = { background: "#ddd", border: "none", width: "30px", height: "30px", borderRadius: "5px", cursor: "pointer", fontSize: "16px" };
const validateBtn = { flex: 1, padding: "12px", background: "#4CAF50", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" };
const closeBtn = { background: "#f44336", color: "white", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", fontSize: "16px" };
const stockBadge = (qty) => ({ background: qty > 50 ? "#4CAF50" : qty > 10 ? "#FF9800" : "#f44336", color: "white", padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" });
const loginContainer = { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" };
const loginBox = { background: "white", padding: "40px 35px", borderRadius: "20px", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", minWidth: "380px", maxWidth: "90%" };
const logoContainer = { width: "80px", height: "80px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" };
const logoIcon = { fontSize: "40px" };
const errorStyle = { background: "#ffebee", color: "#c62828", padding: "12px", borderRadius: "10px", marginBottom: "20px", fontSize: "13px", textAlign: "center", borderLeft: "4px solid #c62828" };
const demoInfoStyle = { marginTop: "25px", padding: "15px", background: "#f8f9fa", borderRadius: "10px", fontSize: "12px", color: "#666", border: "1px solid #e9ecef" };
const inputStyle = { padding: "10px", margin: "5px", borderRadius: 5, border: "1px solid #ddd", flex: 1 };
const loginInput = { padding: "14px 16px", margin: "10px 0", borderRadius: "12px", border: "2px solid #e9ecef", width: "100%", fontSize: "14px", boxSizing: "border-box", outline: "none" };
const loginBtn = { padding: "14px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", border: "none", borderRadius: "12px", width: "100%", cursor: "pointer", fontSize: "16px", fontWeight: "bold", marginTop: "15px" };
const searchInputStyle = { padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.2)", color: "white", width: "300px", fontSize: "14px" };
const logoutBtn = { background: "white", color: "#764ba2", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: "bold" };
const topBar = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30, flexWrap: "wrap", gap: 15 };
const graphContainer = { background: "rgba(255,255,255,0.1)", borderRadius: 15, padding: 20, backdropFilter: "blur(10px)" };
const tableStyle = { background: "white", color: "#333", padding: 20, borderRadius: 15, overflowX: "auto", marginBottom: 30 };
const thStyle = { padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd", fontWeight: "bold" };
const tdStyle = { padding: "12px", textAlign: "left" };
const productsGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginTop: 20 };
const productInfo = { margin: "8px 0", fontSize: "13px", lineHeight: "1.4" };
const formContainer = { background: "rgba(255,255,255,0.15)", borderRadius: 15, padding: 20, marginBottom: 30, backdropFilter: "blur(10px)" };
const formGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10, alignItems: "center" };
const addBtn = { padding: "10px", background: "#4CAF50", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" };
const modalOverlay = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContent = { background: "white", color: "#333", padding: 30, borderRadius: 15, minWidth: 400, maxWidth: "90%" };
const saveBtn = { padding: "10px 20px", background: "#4CAF50", color: "white", border: "none", borderRadius: 8, cursor: "pointer" };
const cancelBtn = { padding: "10px 20px", background: "#f44336", color: "white", border: "none", borderRadius: 8, cursor: "pointer" };
const alertContainer = { background: "rgba(244,67,54,0.2)", borderRadius: 15, padding: 15, marginBottom: 30, borderLeft: "4px solid #f44336" };
const alertBadge = { background: "rgba(244,67,54,0.9)", color: "white", padding: "5px 12px", borderRadius: 20, fontSize: "12px", fontWeight: "bold" };
const reorderBtn = { marginTop: 10, padding: "8px 16px", background: "#FF9800", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: "12px" };
const settingsContainer = { background: "rgba(255,255,255,0.1)", borderRadius: 15, padding: 20, marginTop: 20 };
const settingsCard = { background: "white", color: "#333", padding: 20, borderRadius: 12, marginBottom: 20 };
const toggleRow = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #eee" };
const checkboxStyle = { width: 20, height: 20, cursor: "pointer" };
const exportBtn = { marginTop: 15, padding: "10px 20px", background: "#4CAF50", color: "white", border: "none", borderRadius: 8, cursor: "pointer" };
const paymentOptionBtn = { padding: "12px", background: "#4CAF50", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "16px" };

export default App;