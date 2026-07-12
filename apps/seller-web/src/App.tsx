import React, { useState, useEffect } from 'react';
import { 
  auth, 
  shopService, 
  productService, 
  inventoryService, 
  orderService 
} from '@buyqk/firebase';
import { 
  Button, 
  Card, 
  Input, 
  Badge, 
  Modal, 
  LeafletMap, 
  ToastProvider, 
  showToast,
  BuyQkLogo
} from '@buyqk/ui';
import { 
  Store, 
  User as UserIcon, 
  Plus, 
  Package, 
  ChevronRight, 
  LogOut, 
  DollarSign, 
  ShoppingBag, 
  Camera, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  Clock,
  Compass,
  Edit2
} from 'lucide-react';
import { Shop, Product, InventoryItem, Order, LatLng } from '@buyqk/types';

export default function App() {
  return (
    <ToastProvider>
      <SellerApp />
    </ToastProvider>
  );
}

function SellerApp() {
  const [currentUser, setCurrentUser] = useState<any>(auth.getCurrentUser());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'inventory' | 'settings'>('dashboard');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const handleGoogleLogin = async () => {
    try {
      const user = await auth.signInWithGoogle('seller');
      showToast(`Welcome back, ${user.name}!`, "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Seller specific states
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [myShop, setMyShop] = useState<Shop | null>(null);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [myInventory, setMyInventory] = useState<(InventoryItem & { product?: Product })[]>([]);
  const [allMasterProducts, setAllMasterProducts] = useState<Product[]>([]);

  // Modals
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);

  // Forms - Auth
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');

  // Forms - Onboarding Shop
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [shopCoords, setShopCoords] = useState<LatLng>({ latitude: 19.1136, longitude: 72.8258 });
  const [deliveryRadius, setDeliveryRadius] = useState(5);
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('22:00');
  const [pan, setPan] = useState('');
  const [gst, setGst] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [logoBase64, setLogoBase64] = useState('');
  const [bannerBase64, setBannerBase64] = useState('');

  // Forms - Add Product
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodBrand, setProdBrand] = useState('b_local');
  const [prodImageBase64, setProdImageBase64] = useState('');

  // Scan Code state
  const [scannedCode, setScannedCode] = useState('');

  // Categories
  const categoriesList = productService.getCategories();
  const brandsList = productService.getBrands();

  useEffect(() => {
    const unsubUser = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        loadSellerData(user.uid, user.shopId);
      }
    });

    const unsubShops = shopService.subscribeToShops(() => {
      const liveUser = auth.getCurrentUser();
      if (liveUser) {
        loadSellerData(liveUser.uid, liveUser.shopId);
      }
    });

    const unsubOrders = orderService.subscribeToOrders(() => {
      const liveUser = auth.getCurrentUser();
      if (liveUser) {
        const shops = shopService.getShops();
        const shop = shops.find(s => s.sellerId === liveUser.uid || s.id === liveUser.shopId);
        if (shop) {
          setMyOrders(orderService.getOrdersForSeller(shop.id));
        }
      }
    });

    const unsubProducts = productService.subscribeToProducts((prods) => {
      setAllMasterProducts(prods);
    });

    return () => {
      unsubUser();
      unsubShops();
      unsubOrders();
      unsubProducts();
    };
  }, []);

  const loadSellerData = (uid: string, shopId?: string) => {
    const sellers = JSON.parse(localStorage.getItem('gin_sellers') || '[]');
    const profile = sellers.find((s: any) => s.uid === uid);
    setSellerProfile(profile);

    const shops = shopService.getShops();
    // Get shop linked to this seller
    const shop = shops.find(s => s.sellerId === uid || s.id === shopId);
    if (shop) {
      setMyShop(shop);
      setMyOrders(orderService.getOrdersForSeller(shop.id));
      setMyInventory(inventoryService.getInventoryByShop(shop.id));
    }
  };

  // Helper to compress & convert file upload to base64 text
  const handleImageUpload = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        // Draw to canvas to compress down to low-res
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxW = 240;
        const scale = maxW / img.width;
        canvas.width = maxW;
        canvas.height = img.height * scale;

        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Standard WebP compression
        const dataUrl = canvas.toDataURL('image/webp', 0.6);
        callback(dataUrl);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (authMode === 'login') {
        const u = await auth.signIn({ email: authEmail, password: authPassword });
        showToast(`Welcome back Merchant, ${u.name}!`, "success");
      } else {
        const u = await auth.signUp({
          name: authName,
          email: authEmail,
          phoneNumber: authPhone,
          role: 'seller',
          password: authPassword
        });
        showToast(`Merchant registered. Place your Onboarding request!`, "success");
      }
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
      setAuthPhone('');
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await shopService.createShop(currentUser.uid, {
        shopName,
        description,
        street,
        city,
        state,
        postalCode,
        latitude: shopCoords.latitude,
        longitude: shopCoords.longitude,
        deliveryRadiusKm: Number(deliveryRadius),
        openingTime,
        closingTime,
        pan,
        gst,
        categories: selectedCats.length > 0 ? selectedCats : ['cat_groceries'],
        logoBase64: logoBase64 || '',
        bannerBase64: bannerBase64 || ''
      });
      showToast("Shop profile registered! Submitting to Admin Review log.", "success");
      setIsOnboardingOpen(false);
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodImageBase64) {
      showToast("Upload product illustration.", "error");
      return;
    }
    if (!myShop) return;

    try {
      // 1. Create product in global index
      const newProd = await productService.createProduct({
        name: prodName,
        description: prodDesc,
        categoryId: prodCat,
        brandId: prodBrand,
        imageBase64: prodImageBase64
      });

      // 2. Add to shop inventory
      await inventoryService.updateInventory(
        myShop.id,
        newProd.id,
        Number(prodStock),
        Number(prodPrice)
      );

      showToast("Product added & stocked locally!", "success");
      setMyInventory(inventoryService.getInventoryByShop(myShop.id));
      setIsAddProductOpen(false);

      // Clean form
      setProdName('');
      setProdDesc('');
      setProdPrice('');
      setProdStock('');
      setProdCat('');
      setProdImageBase64('');
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleInventoryQuickUpdate = async (productId: string, stock: number, price: number) => {
    if (!myShop) return;
    try {
      await inventoryService.updateInventory(myShop.id, productId, stock, price);
      showToast("Inventory stock details updated.", "success");
      setMyInventory(inventoryService.getInventoryByShop(myShop.id));
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, nextStatus: any) => {
    try {
      await orderService.updateOrderStatus(orderId, nextStatus);
      showToast(`Order status updated to: ${nextStatus.toUpperCase()}`, "success");
      setMyOrders(orderService.getOrdersForSeller(myShop!.id));
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Barcode scanner simulation
  const triggerMockScan = () => {
    if (!scannedCode.trim()) return;
    // Simulate finding a product by barcode (randomly select from index or add)
    const productPool = allMasterProducts;
    if (productPool.length > 0) {
      const match = productPool[Math.floor(Math.random() * productPool.length)];
      inventoryService.updateInventory(myShop!.id, match.id, 50, 199);
      showToast(`Scanned code: ${scannedCode}. Replenished 50 units of ${match.name}!`, "success");
    } else {
      showToast("Master catalog empty. Upload products manually first.", "info");
    }
    setScannedCode('');
    setIsBarcodeOpen(false);
  };

  // Calculations for dashboard
  const todayRevenue = myOrders
    .filter(o => o.orderStatus !== 'cancelled' && o.paymentStatus === 'paid')
    .reduce((acc, curr) => acc + curr.subtotal, 0);

  const outOfStockItems = myInventory.filter(i => i.stock === 0);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-navy-900/80 backdrop-blur-xl border-b border-blue-900/30 px-4 py-3 lg:px-8 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <BuyQkLogo className="w-10 h-10 shadow-lg shadow-yellow-500/10" />
          <div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              buyQk <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">Seller HUB</span>
            </span>
            <p className="text-[10px] text-slate-400">Dark store node fulfillment portal</p>
          </div>
        </div>

        {currentUser && (
          <div className="flex items-center gap-3">
            {myShop && (
              <span className="text-xs bg-slate-950/80 border border-blue-900/20 px-3 py-1.5 rounded-xl font-semibold text-yellow-500">
                🏪 {myShop.name} ({myShop.status})
              </span>
            )}
            <button 
              onClick={() => auth.signOut()}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-blue-900/20 transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* Body grids */}
      {currentUser ? (
        !myShop ? (
          /* ONBOARDING CALL TO ACTION */
          <main className="flex-1 flex flex-col items-center justify-center p-8 max-w-lg mx-auto text-center gap-6">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <Store className="w-8 h-8 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white uppercase font-sans">Shop Registration Required</h2>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Before your dark store node can capture customer traffic, you must register your shop boundaries, GST details, logo base64 compiler, and timings.
              </p>
            </div>
            <Button variant="primary" onClick={() => setIsOnboardingOpen(true)}>
              Register Store Profile
            </Button>
          </main>
        ) : myShop.status === 'pending' ? (
          /* ONBOARDING PENDING APPROVAL */
          <main className="flex-1 flex flex-col items-center justify-center p-8 max-w-lg mx-auto text-center gap-4">
            <Clock className="w-12 h-12 text-yellow-500 animate-spin" />
            <h2 className="text-xl font-bold text-slate-200">Onboarding Verification In Progress</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Your profile and address credentials are currently undergoing admin compliance checks. We will notify your node immediately upon activation.
            </p>
            <div className="bg-slate-900 border border-blue-900/20 rounded-xl p-4 w-full mt-4 text-left text-xs text-slate-300 flex flex-col gap-2">
              <p><strong>Shop:</strong> {myShop.name}</p>
              <p><strong>Coordinates:</strong> {myShop.location.latitude.toFixed(5)}, {myShop.location.longitude.toFixed(5)}</p>
              <p><strong>Timings:</strong> {myShop.openingTime} - {myShop.closingTime}</p>
            </div>
          </main>
        ) : (
          /* SELLER SYSTEM DASHBOARD */
          <main className="flex-1 max-w-[1400px] w-full mx-auto p-4 lg:p-8 flex flex-col gap-6">
            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 font-bold text-sm border-b-2 transition-all ${activeTab === 'dashboard' ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-slate-400 hover:text-white'}`}
              >
                📊 Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2 font-bold text-sm border-b-2 transition-all ${activeTab === 'orders' ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-slate-400 hover:text-white'}`}
              >
                📦 Split Orders ({myOrders.filter(o => o.orderStatus !== 'delivered').length})
              </button>
              <button 
                onClick={() => setActiveTab('inventory')}
                className={`px-4 py-2 font-bold text-sm border-b-2 transition-all ${activeTab === 'inventory' ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-slate-400 hover:text-white'}`}
              >
                🎒 Stock & Catalog
              </button>
            </div>

            {/* TAB VIEW CONTROLLERS */}
            {activeTab === 'dashboard' && (
              <SellerDashboard 
                revenue={todayRevenue} 
                ordersCount={myOrders.length}
                stockWarnings={outOfStockItems} 
                shop={myShop!}
                inventory={myInventory}
                onAddProduct={() => setIsAddProductOpen(true)}
                onBarcodeScan={() => setIsBarcodeOpen(true)}
              />
            )}

            {activeTab === 'orders' && (
              <SellerOrdersView orders={myOrders} onUpdateStatus={handleUpdateOrderStatus} />
            )}

            {activeTab === 'inventory' && (
              <SellerInventoryView 
                inventory={myInventory} 
                onUpdate={handleInventoryQuickUpdate} 
                onAddProduct={() => setIsAddProductOpen(true)}
                onBarcodeScan={() => setIsBarcodeOpen(true)}
              />
            )}

          </main>
        )
      ) : (
        /* MERCHANT AUTH */
        <main className="flex-1 flex items-center justify-center p-6 bg-slate-950/40">
          <Card className="w-full max-w-md p-8" hoverEffect={false}>
            <div className="text-center mb-8 flex flex-col items-center gap-3">
              <img src="/assets/logopng.png" className="w-24 h-24 object-contain shadow-xl shadow-yellow-500/5 hover:scale-105 transition-all duration-300" alt="buyQk Logo" />
              <h2 className="text-xl font-bold tracking-tight text-white uppercase font-sans">
                {authMode === 'login' ? 'Merchant Log In' : 'Register Seller Store'}
              </h2>
            </div>

            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              {authMode === 'signup' && (
                <>
                  <Input 
                    label="Merchant Name" 
                    placeholder="Enter your name" 
                    value={authName} 
                    onChange={e => setAuthName(e.target.value)} 
                    required 
                  />
                  <Input 
                    label="Phone Number" 
                    placeholder="+919876543210" 
                    value={authPhone} 
                    onChange={e => setAuthPhone(e.target.value)} 
                    required 
                  />
                </>
              )}

              <Input 
                label="Email Address" 
                placeholder="merchant@example.com" 
                value={authEmail} 
                onChange={e => setAuthEmail(e.target.value)} 
                type="email"
                required 
              />

              <Input 
                label="Password" 
                placeholder="••••••••" 
                value={authPassword} 
                onChange={e => setAuthPassword(e.target.value)} 
                type="password"
                required 
              />

              <Button variant="primary" type="submit" className="w-full mt-4">
                {authMode === 'login' ? 'Merchant Log In' : 'Onboard Merchant'}
              </Button>

              <div className="flex items-center my-2">
                <div className="flex-1 border-t border-slate-800/60" />
                <span className="px-3 text-[10px] text-slate-500 uppercase tracking-widest font-mono">or</span>
                <div className="flex-1 border-t border-slate-800/60" />
              </div>

              <Button 
                variant="glass" 
                type="button" 
                onClick={handleGoogleLogin} 
                className="w-full border border-blue-900/30 hover:border-yellow-500/30 flex items-center justify-center gap-2 py-2.5"
              >
                <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.41 0-6.19-2.78-6.19-6.19 0-3.41 2.78-6.19 6.19-6.19 1.494 0 2.87.525 3.96 1.413l3.056-3.056C19.108 2.062 15.924 1 12.24 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.894 0 10.94-4.225 10.94-11.24 0-.768-.088-1.5-.24-2.17H12.24z"/>
                </svg>
                Sign In with Google
              </Button>
            </form>

            <div className="text-center mt-6">
              <button 
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-yellow-500 hover:text-yellow-400 text-sm font-semibold transition-all"
              >
                {authMode === 'login' ? "New merchant? Onboard here" : "Return to Log In"}
              </button>
            </div>
          </Card>
        </main>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-950/80 border-t border-blue-900/20 py-6 text-center text-xs text-slate-500 mt-auto">
        <p>© 2026 buyQk Merchant Hub. Compressing assets to text records.</p>
      </footer>

      {/* ONBOARDING REGISTRATION MODAL */}
      <Modal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} title="Dark Store Onboarding Request">
        <form onSubmit={handleOnboarding} className="flex flex-col gap-4">
          <Input label="Shop Name" placeholder="e.g. Instamart Sweets & Bakery" value={shopName} onChange={e=>setShopName(e.target.value)} required />
          <Input label="Store Description" placeholder="Freshly baked artisan treats..." value={description} onChange={e=>setDescription(e.target.value)} required />
          
          <div className="grid grid-cols-2 gap-3">
            <Input label="Street Address" placeholder="102, Link Road" value={street} onChange={e=>setStreet(e.target.value)} required />
            <Input label="City" placeholder="Mumbai" value={city} onChange={e=>setCity(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="State" placeholder="Maharashtra" value={state} onChange={e=>setState(e.target.value)} required />
            <Input label="Postal Code" placeholder="400053" value={postalCode} onChange={e=>setPostalCode(e.target.value)} required />
          </div>

          {/* Interactive Leaflet coordinates pin */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300 uppercase">Pin Store Address on Map</label>
            <LeafletMap 
              center={shopCoords}
              zoom={14}
              marker={shopCoords}
              markerDraggable={true}
              onMarkerDragEnd={setShopCoords}
            />
            <span className="text-[10px] text-slate-400">Drag to calibrate exact store GPS coordinates.</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input label="Opening Time" type="time" value={openingTime} onChange={e=>setOpeningTime(e.target.value)} required />
            <Input label="Closing Time" type="time" value={closingTime} onChange={e=>setClosingTime(e.target.value)} required />
            <Input label="Fulfillment Radius (km)" type="number" value={deliveryRadius} onChange={e=>setDeliveryRadius(Number(e.target.value))} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="PAN Card" placeholder="ABCDE1234F" value={pan} onChange={e=>setPan(e.target.value)} required />
            <Input label="GST Number (Optional)" placeholder="27AAAAA1111A1Z1" value={gst} onChange={e=>setGst(e.target.value)} />
          </div>

          {/* Categories select */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-300 uppercase">Market Segments</span>
            <div className="grid grid-cols-2 gap-2">
              {categoriesList.map(cat => (
                <label key={cat.id} className="flex items-center gap-2 text-xs text-slate-300">
                  <input 
                    type="checkbox" 
                    checked={selectedCats.includes(cat.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedCats([...selectedCats, cat.id]);
                      else setSelectedCats(selectedCats.filter(c => c !== cat.id));
                    }}
                  />
                  <span>{cat.icon} {cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Image to text base64 compressors */}
          <div className="grid grid-cols-2 gap-3 mt-2 border-t border-slate-800/60 pt-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Store Logo</label>
              <div className="relative border border-dashed border-blue-900/30 rounded-xl p-3 flex flex-col items-center gap-2 hover:bg-slate-900 transition-all cursor-pointer">
                <Camera className="w-5 h-5 text-slate-500" />
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, setLogoBase64);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 font-bold truncate w-full text-center">
                  {logoBase64 ? "Image Compiled! ⚡" : "Compile Logo to Text"}
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Store Banner</label>
              <div className="relative border border-dashed border-blue-900/30 rounded-xl p-3 flex flex-col items-center gap-2 hover:bg-slate-900 transition-all cursor-pointer">
                <Camera className="w-5 h-5 text-slate-500" />
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, setBannerBase64);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 font-bold truncate w-full text-center">
                  {bannerBase64 ? "Image Compiled! ⚡" : "Compile Banner to Text"}
                </span>
              </div>
            </div>
          </div>

          <Button variant="primary" type="submit" className="w-full mt-4">
            Submit Registration
          </Button>
        </form>
      </Modal>

      {/* ADD CATALOG PRODUCT MODAL */}
      <Modal isOpen={isAddProductOpen} onClose={() => setIsAddProductOpen(false)} title="Upload Product to Store Shelf">
        <form onSubmit={handleCreateProduct} className="flex flex-col gap-4">
          <Input label="Product Name" placeholder="Organic Bananas (Pack of 6)" value={prodName} onChange={e=>setProdName(e.target.value)} required />
          <Input label="Description" placeholder="Freshly harvested farm-fresh organic bananas" value={prodDesc} onChange={e=>setProdDesc(e.target.value)} required />
          
          <div className="grid grid-cols-2 gap-3">
            <Input label="Listing Price (INR)" type="number" placeholder="40" value={prodPrice} onChange={e=>setProdPrice(e.target.value)} required />
            <Input label="Stock Count" type="number" placeholder="100" value={prodStock} onChange={e=>setProdStock(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300 uppercase">Category</label>
              <select 
                value={prodCat}
                onChange={e => setProdCat(e.target.value)}
                required
                className="bg-slate-900/60 border border-blue-900/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/60"
              >
                <option value="">Select Category</option>
                {categoriesList.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300 uppercase">Brand</label>
              <select 
                value={prodBrand}
                onChange={e => setProdBrand(e.target.value)}
                required
                className="bg-slate-900/60 border border-blue-900/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/60"
              >
                {brandsList.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Product illustration compressor */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Product Illustration</label>
            <div className="relative border border-dashed border-blue-900/30 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-slate-900 transition-all cursor-pointer">
              <Camera className="w-5 h-5 text-slate-500 animate-pulse" />
              <input 
                type="file" 
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, setProdImageBase64);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <span className="text-xs text-slate-400 font-bold">
                {prodImageBase64 ? "Asset compiled successfully! ⚡" : "Select Image File to Compile"}
              </span>
            </div>
          </div>

          <Button variant="primary" type="submit" className="w-full mt-4">
            Upload & Stock Product
          </Button>
        </form>
      </Modal>

      {/* MOCK BARCODE SCANNER MODAL */}
      <Modal isOpen={isBarcodeOpen} onClose={() => setIsBarcodeOpen(false)} title="Simulated Barcode Scan Terminal">
        <div className="flex flex-col gap-4">
          <div className="h-44 bg-slate-950 border border-blue-900/20 rounded-xl flex items-center justify-center relative overflow-hidden">
            {/* Visual scanline animation overlay */}
            <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-md shadow-red-500/80 top-1/2 -translate-y-1/2 animate-bounce" />
            <span className="text-xs text-slate-500 font-mono tracking-widest">CAMERA SCAN ACTIVE ...</span>
          </div>

          <Input 
            label="Input Barcode EAN-13" 
            placeholder="8901030753621" 
            value={scannedCode} 
            onChange={e => setScannedCode(e.target.value)} 
          />

          <Button variant="primary" onClick={triggerMockScan} className="w-full">
            Simulate EAN Capture
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ==========================================
// VIEWS: SELLER DASHBOARD
// ==========================================
interface SellerDashboardProps {
  revenue: number;
  ordersCount: number;
  stockWarnings: any[];
  shop: Shop;
  inventory: any[];
  onAddProduct: () => void;
  onBarcodeScan: () => void;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({
  revenue,
  ordersCount,
  stockWarnings,
  shop,
  inventory,
  onAddProduct,
  onBarcodeScan
}) => {
  return (
    <div className="flex flex-col gap-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Card hoverEffect={false} className="flex items-center gap-4 bg-gradient-to-r from-emerald-500/5 to-slate-900 border-l-4 border-l-emerald-500">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">Today's Revenue</span>
            <h3 className="text-2xl font-extrabold text-white mt-1">₹{revenue}</h3>
          </div>
        </Card>

        <Card hoverEffect={false} className="flex items-center gap-4 bg-gradient-to-r from-yellow-500/5 to-slate-900 border-l-4 border-l-yellow-500">
          <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-500">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">Total Orders</span>
            <h3 className="text-2xl font-extrabold text-white mt-1">{ordersCount} units</h3>
          </div>
        </Card>

        <Card hoverEffect={false} className="flex items-center gap-4 bg-gradient-to-r from-red-500/5 to-slate-900 border-l-4 border-l-red-500">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">Stock Depletions</span>
            <h3 className="text-2xl font-extrabold text-white mt-1">{stockWarnings.length} alerts</h3>
          </div>
        </Card>

      </div>

      {/* Control Actions Row */}
      <div className="flex gap-3">
        <Button variant="primary" onClick={onAddProduct}>
          <Plus className="w-4 h-4" /> Upload New Item
        </Button>
        <Button variant="secondary" onClick={onBarcodeScan}>
          ⚡ Barcode Scanner
        </Button>
      </div>

      {/* Warning Stock List */}
      {stockWarnings.length > 0 && (
        <Card hoverEffect={false} className="border border-red-500/20 bg-red-500/5 flex flex-col gap-4">
          <span className="text-xs uppercase font-bold text-red-400 tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Depleted Inventory Alerts
          </span>
          <div className="flex flex-col gap-2">
            {stockWarnings.map(item => (
              <div key={item.id} className="flex justify-between text-xs border-b border-red-500/10 pb-2 last:border-0 last:pb-0">
                <span className="text-slate-300 font-semibold">{item.product?.name}</span>
                <span className="text-red-400 font-bold">OUT OF STOCK (0 units)</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Visual store config layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Side: Shop Stats Card */}
        <Card hoverEffect={false} className="p-6">
          <h3 className="font-bold text-slate-200 text-lg">Dark Store Profile</h3>
          <p className="text-xs text-slate-400 mt-1">Review operational configurations</p>
          <div className="flex flex-col gap-3 mt-4 text-xs text-slate-300">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span>Fulfillment Radius:</span>
              <span className="font-bold text-yellow-500">{shop.deliveryRadiusKm} km</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span>Operational Window:</span>
              <span className="font-bold text-yellow-500">{shop.openingTime} - {shop.closingTime}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span>Merchant Location:</span>
              <span className="font-mono text-[10px]">{shop.location.latitude.toFixed(4)}, {shop.location.longitude.toFixed(4)}</span>
            </div>
            <div className="flex justify-between pb-1">
              <span>Platform Commission:</span>
              <span className="font-bold text-emerald-400">10% per transaction</span>
            </div>
          </div>
        </Card>

        {/* Right Side: Leaflet map representing store coordinates and service radius */}
        <Card hoverEffect={false} className="p-4 flex flex-col gap-4">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Fulfillment Coordinates</span>
          <LeafletMap 
            center={shop.location}
            zoom={13}
            marker={shop.location}
            className="h-[300px] rounded-2xl overflow-hidden border border-blue-900/20"
          />
        </Card>

      </div>

    </div>
  );
};

// ==========================================
// VIEWS: SELLER INCOMING ORDERS
// ==========================================
interface SellerOrdersProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: any) => void;
}

const SellerOrdersView: React.FC<SellerOrdersProps> = ({
  orders,
  onUpdateStatus
}) => {
  return (
    <div className="flex flex-col gap-6">
      <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Split Orders Logs ({orders.length})</span>
      
      {orders.length === 0 ? (
        <Card hoverEffect={false} className="py-20 text-center">
          <h3 className="text-slate-300 font-bold">No orders assigned to your dark store node yet.</h3>
          <p className="text-xs text-slate-500 mt-1">When customers order your items, they will split into this dashboard in real-time.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map(order => (
            <Card key={order.id} hoverEffect={false} className="p-6 border border-blue-900/30">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-4 mb-4">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Order ID Reference</span>
                  <h3 className="font-bold text-slate-200">{order.id}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Placed: {new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block text-right font-bold">Client Name</span>
                    <span className="text-sm font-semibold text-slate-200 block text-right">{order.customerName}</span>
                  </div>
                  <Badge variant={order.orderStatus === 'delivered' ? 'success' : 'warning'}>
                    {order.orderStatus}
                  </Badge>
                </div>
              </div>

              {/* Items */}
              <div className="flex flex-col gap-2 mb-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">{item.name} <span className="text-slate-500">x{item.quantity}</span></span>
                    <span className="font-bold text-slate-100">₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs text-slate-400 border-t border-slate-800/40 pt-2 font-bold">
                  <span>Net Checkout (Subtotal + Tax)</span>
                  <span className="text-yellow-500">₹{order.subtotal}</span>
                </div>
              </div>

              {/* Delivery coordinates metadata */}
              <div className="bg-slate-950 p-4 rounded-xl border border-blue-900/10 text-xs text-slate-300 mb-4 flex flex-col gap-1.5">
                <p><strong>Shipping Address:</strong> {order.deliveryAddress.formattedAddress}</p>
                <p><strong>Customer Contact:</strong> {order.customerPhone}</p>
                <p><strong>Payment mode:</strong> {order.paymentMethod.toUpperCase()} ({order.paymentStatus})</p>
              </div>

              {/* Status Action controls */}
              <div className="flex gap-2 justify-end">
                {order.orderStatus === 'placed' && (
                  <Button variant="primary" size="sm" onClick={() => onUpdateStatus(order.id, 'accepted')}>
                    Accept Order
                  </Button>
                )}
                {order.orderStatus === 'accepted' && (
                  <Button variant="primary" size="sm" onClick={() => onUpdateStatus(order.id, 'preparing')}>
                    Start Preparing
                  </Button>
                )}
                {order.orderStatus === 'preparing' && (
                  <Button variant="primary" size="sm" onClick={() => onUpdateStatus(order.id, 'dispatched')}>
                    Dispatch Package
                  </Button>
                )}
                {order.orderStatus === 'dispatched' && (
                  <Button variant="primary" size="sm" onClick={() => onUpdateStatus(order.id, 'delivered')}>
                    Mark Handed Over
                  </Button>
                )}
                {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
                  <Button variant="danger" size="sm" onClick={() => onUpdateStatus(order.id, 'cancelled')}>
                    Cancel Fulfillment
                  </Button>
                )}
              </div>

            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// VIEWS: SELLER STOCK MANAGEMENT
// ==========================================
interface SellerInventoryProps {
  inventory: (InventoryItem & { product?: Product })[];
  onUpdate: (id: string, stock: number, price: number) => void;
  onAddProduct: () => void;
  onBarcodeScan: () => void;
}

const SellerInventoryView: React.FC<SellerInventoryProps> = ({
  inventory,
  onUpdate,
  onAddProduct,
  onBarcodeScan
}) => {
  return (
    <div className="flex flex-col gap-6">
      
      <div className="flex justify-between items-center bg-slate-900/40 p-4 border border-blue-900/20 rounded-2xl">
        <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Local Inventory Records ({inventory.length})</span>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={onAddProduct}>
            <Plus className="w-4 h-4" /> Upload
          </Button>
          <Button variant="secondary" size="sm" onClick={onBarcodeScan}>
            Mock Barcode Scan
          </Button>
        </div>
      </div>

      {inventory.length === 0 ? (
        <Card hoverEffect={false} className="py-20 text-center">
          <h3 className="text-slate-300 font-bold">Your inventory catalog is currently empty.</h3>
          <p className="text-xs text-slate-500 mt-1">Upload products or scan barcode EANs to load items to shelves.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventory.map(item => {
            const p = item.product;
            if (!p) return null;
            return (
              <InventoryItemCard key={item.id} item={item} product={p} onUpdate={onUpdate} />
            );
          })}
        </div>
      )}
    </div>
  );
};

// Sub-card component for editing inventory fields
const InventoryItemCard: React.FC<{ item: any; product: Product; onUpdate: any }> = ({
  item,
  product,
  onUpdate
}) => {
  const [stockInput, setStockInput] = useState(String(item.stock));
  const [priceInput, setPriceInput] = useState(String(item.price));
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    const s = Number(stockInput);
    const p = Number(priceInput);
    if (isNaN(s) || isNaN(p) || s < 0 || p <= 0) {
      showToast("Invalid stock count or price value.", "error");
      return;
    }
    onUpdate(product.id, s, p);
    setIsEditing(false);
  };

  return (
    <Card hoverEffect={false} className="flex flex-col gap-4">
      <div className="flex gap-3">
        <img src={product.imageBase64} className="w-12 h-12 object-cover rounded-xl border border-slate-800" />
        <div className="overflow-hidden">
          <h4 className="font-bold text-sm text-slate-200 truncate">{product.name}</h4>
          <p className="text-xs text-slate-400 truncate">{product.description}</p>
        </div>
      </div>

      <div className="bg-slate-950/80 p-4 border border-blue-900/10 rounded-xl flex flex-col gap-3">
        {isEditing ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Stock Count" type="number" value={stockInput} onChange={e=>setStockInput(e.target.value)} className="py-2 px-3 text-xs" />
              <Input label="Price (₹)" type="number" value={priceInput} onChange={e=>setPriceInput(e.target.value)} className="py-2 px-3 text-xs" />
            </div>
            <div className="flex gap-2 mt-1">
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)} className="flex-1 text-xs py-1">Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleSave} className="flex-1 text-xs py-1">Save</Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Available Stock:</span>
              <span className={`font-bold ${item.stock === 0 ? 'text-red-400' : 'text-slate-200'}`}>
                {item.stock} units
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Shelf Price:</span>
              <span className="font-bold text-yellow-500">₹{item.price}</span>
            </div>
            <button 
              onClick={() => setIsEditing(true)}
              className="text-xs text-slate-400 hover:text-white mt-1 border border-slate-800 hover:border-slate-600 rounded-lg py-1.5 flex items-center justify-center gap-1.5 transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Inventory
            </button>
          </>
        )}
      </div>
    </Card>
  );
};
