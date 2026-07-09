import React, { useState, useEffect } from 'react';
import { 
  auth, 
  shopService, 
  productService, 
  inventoryService, 
  orderService, 
  walletService, 
  geminiService,
  calculateDistance 
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
  ShoppingBag, 
  User as UserIcon, 
  Sparkles, 
  Wallet, 
  MapPin, 
  Navigation, 
  Search, 
  Menu, 
  LogOut, 
  Trash2, 
  Compass, 
  Clock, 
  DollarSign, 
  Layers,
  ArrowRight,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { Shop, Product, InventoryItem, CartItem, Order, LatLng, Address, Category } from '@buyqk/types';

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}

function MainApp() {
  // Navigation & Session State
  const [currentUser, setCurrentUser] = useState<any>(auth.getCurrentUser());
  const [activeTab, setActiveTab] = useState<'shops' | 'ai-assistant' | 'orders' | 'wallet'>('shops');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [view, setView] = useState<'landing' | 'app'>('landing');

  const handleGoogleLogin = async () => {
    try {
      const user = await auth.signInWithGoogle();
      showToast(`Welcome back, ${user.name}!`, "success");
      setView('app');
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Customer Location (Default: Andheri, Mumbai)
  const [customerLocation, setCustomerLocation] = useState<LatLng>({ latitude: 19.1136, longitude: 72.8258 });
  const [formattedAddress, setFormattedAddress] = useState<string>("Andheri West, Mumbai, MH - 400053");
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Database States
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [shopInventory, setShopInventory] = useState<(InventoryItem & { product?: Product })[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [walletBalance, setWalletBalance] = useState(0);
  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'wallet'>('wallet');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);

  // Auth Forms
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Subscribe to reactive database logs
  useEffect(() => {
    const unsubUser = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    const unsubShops = shopService.subscribeToShops(() => {
      // Refresh nearby stores
      refreshShops();
    });

    const unsubOrders = orderService.subscribeToOrders((allOrders) => {
      if (currentUser?.uid) {
        setOrders(allOrders.filter(o => o.customerId === currentUser.uid));
      }
    });

    let unsubWallet = () => {};
    if (currentUser?.uid) {
      unsubWallet = walletService.subscribeToWallet(currentUser.uid, (bal) => {
        setWalletBalance(bal);
      });
    }

    // Populate category metadata
    setCategories(productService.getCategories());

    return () => {
      unsubUser();
      unsubShops();
      unsubOrders();
      unsubWallet();
    };
  }, [currentUser?.uid, customerLocation]);

  const refreshShops = () => {
    const nearby = shopService.getNearbyShops(customerLocation.latitude, customerLocation.longitude);
    // Cast to original type
    setShops(nearby);
  };

  // Trigger geolocation updates
  const handleGPSPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setCustomerLocation(coords);
          // Simple reverse-geocode mock
          setFormattedAddress(`Custom GPS Location (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`);
          showToast("Location updated via GPS!", "success");
        },
        (err) => {
          showToast("Failed to fetch GPS coordinates. Please pin on the map manually.", "error");
        }
      );
    } else {
      showToast("GPS Geolocation is not supported by your browser.", "error");
    }
  };

  // Auth action handlers
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (authMode === 'login') {
        const u = await auth.signIn({ email: authEmail, password: authPassword });
        showToast(`Welcome back, ${u.name}!`, "success");
      } else {
        const u = await auth.signUp({
          name: authName,
          email: authEmail,
          phoneNumber: authPhone,
          role: 'customer',
          password: authPassword
        });
        showToast(`Account created! Welcoming bonus of ₹200 added.`, "success");
      }
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
      setAuthPhone('');
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Cart operations
  const addToCart = (product: Product, shop: Shop, price: number) => {
    if (!currentUser) {
      showToast("Please log in to add items to your cart.", "info");
      return;
    }
    const existing = cart.find(item => item.productId === product.id && item.shopId === shop.id);
    if (existing) {
      setCart(cart.map(item => 
        (item.productId === product.id && item.shopId === shop.id)
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newItem: CartItem = {
        productId: product.id,
        product,
        shopId: shop.id,
        shopName: shop.name,
        quantity: 1,
        price
      };
      setCart([...cart, newItem]);
    }
    showToast(`Added ${product.name} to Cart.`, "success");
  };

  const removeFromCart = (productId: string, shopId: string) => {
    setCart(cart.filter(item => !(item.productId === productId && item.shopId === shopId)));
    showToast("Item removed from cart.", "info");
  };

  const updateQuantity = (productId: string, shopId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId && item.shopId === shopId) {
        const qty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: qty };
      }
      return item;
    }));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      const parentId = await orderService.checkoutCart(
        currentUser.uid,
        currentUser.name,
        currentUser.phoneNumber,
        cart,
        {
          street: formattedAddress,
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400053",
          formattedAddress: formattedAddress,
          location: customerLocation
        },
        paymentMethod
      );
      showToast(`Order Placed Successfully! (Ref: ${parentId})`, "success");
      setCart([]);
      setIsCartModalOpen(false);
      setActiveTab('orders');
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const totalCartCost = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  // View specific shop products
  const handleOpenShop = (shop: Shop) => {
    setSelectedShop(shop);
    const inv = inventoryService.getInventoryByShop(shop.id);
    setShopInventory(inv);
  };

  // Filtered Shops List
  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          shop.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || shop.categories.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  if (view === 'landing') {
    return (
      <LandingPageView 
        onLaunchApp={() => setView('app')} 
        onLoginGoogle={handleGoogleLogin} 
        currentUser={currentUser}
        onLogout={() => auth.signOut()}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header NAVBAR */}
      <header className="sticky top-0 z-40 bg-navy-900/80 backdrop-blur-xl border-b border-blue-900/30 px-4 py-3 lg:px-8 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setSelectedShop(null); setActiveTab('shops'); }}>
            <BuyQkLogo className="w-10 h-10 shadow-lg shadow-yellow-500/10 active:scale-95 transition-all" />
            <div className="hidden sm:block">
              <span className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-1.5">
                buyQk <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">Client</span>
              </span>
              <p className="text-[10px] text-slate-400">Find Anything. Deliver Anything.</p>
            </div>
          </div>

          {/* Active Geolocation Bar */}
          <button 
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-2 bg-slate-950/60 hover:bg-slate-900 border border-blue-900/30 rounded-xl px-3 py-1.5 transition-all text-left max-w-xs"
          >
            <MapPin className="w-4 h-4 text-yellow-500 shrink-0" />
            <div className="overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-yellow-500 block leading-tight">Deliver To</span>
              <span className="text-xs text-slate-200 block truncate leading-tight">{formattedAddress}</span>
            </div>
          </button>
        </div>

        {/* Right Nav Options */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <>
              {/* Wallet Badge */}
              <button 
                onClick={() => setActiveTab('wallet')}
                className="hidden md:flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-blue-900/30 rounded-xl px-3.5 py-2 text-sm text-slate-200 transition-all"
              >
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-emerald-400">₹{walletBalance}</span>
              </button>

              <Button 
                variant="glass" 
                size="sm"
                onClick={() => setIsCartModalOpen(true)}
                className="relative"
              >
                <ShoppingBag className="w-4 h-4" />
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-500 text-slate-950 text-[10px] font-bold rounded-full flex items-center justify-center border border-navy-950 animate-pulse">
                    {cart.reduce((a,c) => a + c.quantity, 0)}
                  </span>
                )}
                <span className="hidden sm:inline">Cart</span>
              </Button>

              <button 
                onClick={() => auth.signOut()}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-blue-900/20 transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Button variant="primary" size="sm" onClick={() => setAuthMode('login')}>
              <UserIcon className="w-4 h-4" /> Login / Register
            </Button>
          )}
        </div>
      </header>

      {/* Main Grid Body */}
      {currentUser ? (
        <main className="flex-1 max-w-[1400px] w-full mx-auto p-4 lg:p-8 flex flex-col gap-6">
          
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
            <button 
              onClick={() => { setSelectedShop(null); setActiveTab('shops'); }}
              className={`px-4 py-2 font-bold text-sm border-b-2 transition-all ${activeTab === 'shops' && !selectedShop ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              🏪 Dark Stores
            </button>
            <button 
              onClick={() => setActiveTab('ai-assistant')}
              className={`px-4 py-2 font-bold text-sm border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'ai-assistant' ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              <Sparkles className="w-4 h-4 text-yellow-500" /> AI Assistant
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 font-bold text-sm border-b-2 transition-all ${activeTab === 'orders' ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              📦 My Orders
            </button>
            <button 
              onClick={() => setActiveTab('wallet')}
              className={`px-4 py-2 font-bold text-sm border-b-2 transition-all ${activeTab === 'wallet' ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              💳 Wallet Details
            </button>
          </div>

          {/* VIEW RENDERERS */}
          {activeTab === 'shops' && (
            selectedShop ? (
              <ShopDetailsView 
                shop={selectedShop} 
                inventory={shopInventory} 
                onBack={() => setSelectedShop(null)} 
                onAddToCart={addToCart} 
              />
            ) : (
              <ShopsListView 
                shops={filteredShops} 
                categories={categories} 
                selectedCategory={selectedCategory} 
                onSelectCategory={setSelectedCategory} 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onOpenShop={handleOpenShop}
                onLocClick={() => setIsLocationModalOpen(true)}
                gpsTrigger={handleGPSPermission}
                lat={customerLocation.latitude}
                lng={customerLocation.longitude}
              />
            )
          )}

          {activeTab === 'ai-assistant' && (
            <AIAssistantView customerLocation={customerLocation} onAddToCart={addToCart} />
          )}

          {activeTab === 'orders' && (
            <OrdersView orders={orders} />
          )}

          {activeTab === 'wallet' && (
            <WalletView uid={currentUser.uid} />
          )}

        </main>
      ) : (
        /* AUTH PORTAL */
        <main className="flex-1 flex items-center justify-center p-6 bg-slate-950/40">
          <Card className="w-full max-w-md p-8" hoverEffect={false}>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">
                {authMode === 'login' ? 'Welcome to buyQk' : 'Join the dark store network'}
              </h2>
              <p className="text-slate-400 text-sm mt-1">Universal Local Supply Network</p>
            </div>

            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              {authMode === 'signup' && (
                <>
                  <Input 
                    label="Full Name" 
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
                placeholder="you@example.com" 
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
                {authMode === 'login' ? 'Login Account' : 'Register Account'}
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
                {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
              </button>
            </div>
          </Card>
        </main>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-950/80 border-t border-blue-900/20 py-6 text-center text-xs text-slate-500 mt-auto">
        <p>© 2026 buyQk Inc. All local stores acting as dark fulfillment nodes.</p>
      </footer>

      {/* LOCATION PICKER MODAL */}
      <Modal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} title="Select Delivery Address">
        <div className="flex flex-col gap-4">
          <p className="text-xs text-slate-400">
            Drag the yellow pin to set your exact delivery coordinates. Only dark stores within radius of this coordinate will serve your checkout.
          </p>

          <LeafletMap 
            center={customerLocation}
            zoom={14}
            marker={customerLocation}
            markerDraggable={true}
            onMarkerDragEnd={(latlng) => {
              setCustomerLocation(latlng);
              setFormattedAddress(`Custom Map Location (${latlng.latitude.toFixed(4)}, ${latlng.longitude.toFixed(4)})`);
            }}
          />

          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleGPSPermission} className="flex-1">
              <Navigation className="w-4 h-4 text-yellow-500" /> Use Current GPS
            </Button>
            <Button variant="primary" onClick={() => { setIsLocationModalOpen(false); refreshShops(); }} className="flex-1">
              Save Location
            </Button>
          </div>
        </div>
      </Modal>

      {/* CART SUMMARY MODAL */}
      <Modal isOpen={isCartModalOpen} onClose={() => setIsCartModalOpen(false)} title="Multi-Store Cart Checkout">
        {cart.length === 0 ? (
          <div className="text-center py-10 flex flex-col items-center justify-center gap-3">
            <ShoppingBag className="w-12 h-12 text-slate-600 animate-bounce" />
            <p className="text-slate-400 font-bold">Your cart is empty.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Cart Items Grouped by Shop */}
            <div className="flex flex-col gap-4">
              {Array.from(new Set(cart.map(i => i.shopId))).map(shopId => {
                const shopItems = cart.filter(i => i.shopId === shopId);
                const shopName = shopItems[0]?.shopName;
                return (
                  <div key={shopId} className="bg-slate-900/60 border border-blue-900/30 rounded-xl p-4">
                    <span className="text-xs font-bold uppercase text-yellow-500 tracking-wider">🏪 {shopName}</span>
                    <div className="flex flex-col gap-3 mt-3">
                      {shopItems.map(item => (
                        <div key={item.productId} className="flex items-center justify-between border-b border-slate-800/40 pb-2">
                          <div className="flex items-center gap-3">
                            <img src={item.product.imageBase64} className="w-10 h-10 object-cover rounded-lg border border-slate-800" />
                            <div>
                              <h4 className="text-sm font-semibold text-slate-100">{item.product.name}</h4>
                              <p className="text-xs text-slate-400">₹{item.price} each</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 px-2 py-1">
                              <button onClick={() => updateQuantity(item.productId, item.shopId, -1)} className="text-slate-400 hover:text-white px-1.5 font-bold">-</button>
                              <span className="text-xs font-bold px-2">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.productId, item.shopId, 1)} className="text-slate-400 hover:text-white px-1.5 font-bold">+</button>
                            </div>
                            <button onClick={() => removeFromCart(item.productId, item.shopId)} className="text-red-400 hover:text-red-300">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Platform calculations & fees */}
            <div className="bg-slate-950 border border-blue-900/20 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Items Subtotal</span>
                <span>₹{totalCartCost}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-400">
                <span>Delivery Charge (Split)</span>
                <span>₹{cart.length * 30}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-400">
                <span>Platform Commission Fee</span>
                <span>₹5</span>
              </div>
              <div className="flex justify-between text-sm text-slate-400 border-t border-slate-800/60 pt-2 font-bold">
                <span className="text-white">Total Order Value</span>
                <span className="text-yellow-500">₹{totalCartCost + (cart.length * 30) + 5}</span>
              </div>
            </div>

            {/* Select Payment Option */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase text-slate-400">Payment Option</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('wallet')}
                  className={`border rounded-xl p-3 flex flex-col items-center gap-1.5 transition-all ${paymentMethod === 'wallet' ? 'border-yellow-500 bg-yellow-500/5' : 'border-blue-900/30 bg-slate-900/40 hover:bg-slate-900'}`}
                >
                  <Wallet className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold">Wallet Pay</span>
                  <span className="text-[10px] text-slate-400">Balance: ₹{walletBalance}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`border rounded-xl p-3 flex flex-col items-center gap-1.5 transition-all ${paymentMethod === 'cod' ? 'border-yellow-500 bg-yellow-500/5' : 'border-blue-900/30 bg-slate-900/40 hover:bg-slate-900'}`}
                >
                  <DollarSign className="w-5 h-5 text-yellow-500" />
                  <span className="text-xs font-bold">Cash on Delivery</span>
                  <span className="text-[10px] text-slate-400">Pay at your doorstep</span>
                </button>
              </div>
            </div>

            <Button variant="primary" onClick={handleCheckout} className="w-full py-3">
              Checkout & Split Orders
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ==========================================
// VIEWS: SHOPS LIST (STOREFINDER)
// ==========================================
interface ShopsListProps {
  shops: Shop[];
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenShop: (shop: Shop) => void;
  onLocClick: () => void;
  gpsTrigger: () => void;
  lat: number;
  lng: number;
}

const ShopsListView: React.FC<ShopsListProps> = ({
  shops,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onOpenShop,
  onLocClick,
  gpsTrigger,
  lat,
  lng
}) => {
  return (
    <div className="flex flex-col gap-6">
      
      {/* Search and Maps Actions Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center bg-slate-900/40 border border-blue-900/30 rounded-3xl p-6 backdrop-blur-md">
        
        {/* Search */}
        <div className="relative col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search matching products or nearby dark stores..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-950/80 border border-blue-900/30 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/50 transition-all font-sans"
          />
        </div>

        {/* Location triggers */}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onLocClick} className="flex-1">
            <Compass className="w-4 h-4 text-yellow-500" /> Set Pin
          </Button>
          <Button variant="glass" onClick={gpsTrigger} className="flex-1">
            <Navigation className="w-4 h-4" /> GPS
          </Button>
        </div>

      </div>

      {/* Category Horizontal scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => onSelectCategory('all')}
          className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap ${selectedCategory === 'all' ? 'bg-yellow-500 border-yellow-400 text-slate-950 shadow-md shadow-yellow-500/10' : 'bg-slate-900/60 border-blue-900/20 text-slate-300 hover:text-white'}`}
        >
          All Stores
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${selectedCategory === cat.id ? 'bg-yellow-500 border-yellow-400 text-slate-950 shadow-md' : 'bg-slate-900/60 border-blue-900/20 text-slate-300 hover:text-white'}`}
          >
            <span>{cat.icon}</span> {cat.name}
          </button>
        ))}
      </div>

      {/* Split layout: Left Grid Stores, Right Leaflet Map */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        
        {/* Stores Grid */}
        <div className="flex flex-col gap-4">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Nearby Dark Stores ({filteredShopsLength(shops)})</span>
          
          {shops.length === 0 ? (
            <Card hoverEffect={false} className="py-16 text-center">
              <div className="w-12 h-12 bg-slate-900/80 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-slate-500" />
              </div>
              <h3 className="font-bold text-lg text-slate-200">No active shops found within your delivery radius</h3>
              <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                Adjust your address pin or search radius to connect with regional suppliers.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {shops.map(shop => {
                // Approximate travel time (mocking 5 mins per km + 10 mins loading)
                const dist = (shop as any).distanceKm || 0;
                const time = Math.round(dist * 5 + 10);
                return (
                  <Card key={shop.id} onClick={() => onOpenShop(shop)} className="flex flex-col gap-4 hover:border-yellow-500/40 group relative overflow-hidden">
                    {/* Banner Image */}
                    <div className="h-28 w-full bg-slate-950 rounded-xl overflow-hidden relative">
                      <img src={shop.bannerBase64} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                      <div className="absolute top-2 right-2">
                        <Badge variant="success">OPEN</Badge>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {/* Logo image */}
                      <img src={shop.logoBase64} className="w-12 h-12 object-cover rounded-xl border border-slate-800 shrink-0" />
                      <div>
                        <h4 className="font-bold text-white group-hover:text-yellow-500 transition-all">{shop.name}</h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{shop.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-yellow-500" /> {dist} km</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-yellow-500" /> {time} mins</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Map Panel */}
        <div className="sticky top-28 hidden xl:flex flex-col gap-4">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Spatial Network Map</span>
          <LeafletMap 
            center={{ latitude: lat, longitude: lng }}
            zoom={13}
            shops={shops.map(s => ({
              id: s.id,
              name: s.name,
              location: s.location,
              address: s.address.formattedAddress
            }))}
            onShopClick={(id) => {
              const s = shops.find(shop => shop.id === id);
              if (s) onOpenShop(s);
            }}
            className="h-[500px] rounded-3xl border border-blue-900/30 overflow-hidden shadow-2xl"
          />
        </div>

      </div>
    </div>
  );
};

function filteredShopsLength(shops: Shop[]) {
  return shops.length;
}

// ==========================================
// VIEWS: SHOP DETAILS (STOREFRONT CATALOG)
// ==========================================
interface ShopDetailsProps {
  shop: Shop;
  inventory: (InventoryItem & { product?: Product })[];
  onBack: () => void;
  onAddToCart: (p: Product, s: Shop, price: number) => void;
}

const ShopDetailsView: React.FC<ShopDetailsProps> = ({
  shop,
  inventory,
  onBack,
  onAddToCart
}) => {
  return (
    <div className="flex flex-col gap-6">
      
      {/* Breadcrumb Back */}
      <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-1.5 text-sm font-semibold transition-all">
        ← Back to Stores List
      </button>

      {/* Store Banner header Card */}
      <div className="relative h-48 lg:h-64 rounded-3xl overflow-hidden border border-blue-900/30 shadow-2xl">
        <img src={shop.bannerBase64} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        
        {/* Info panel */}
        <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={shop.logoBase64} className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-2xl border-2 border-yellow-500 shadow-xl" />
            <div>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-white font-sans">{shop.name}</h2>
              <p className="text-sm text-slate-300 mt-1 max-w-lg">{shop.description}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="info">🏪 Dark Store</Badge>
            <Badge variant="warning">{shop.openingTime} - {shop.closingTime}</Badge>
          </div>
        </div>
      </div>

      {/* Catalog items */}
      <div className="flex flex-col gap-4">
        <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Product Catalog ({inventory.length})</span>
        
        {inventory.length === 0 ? (
          <Card hoverEffect={false} className="py-20 text-center">
            <h3 className="text-slate-300 font-bold">This store has not listed any stock items yet.</h3>
            <p className="text-xs text-slate-500 mt-1">Check back later or explore other nearby dark stores.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {inventory.map(item => {
              const p = item.product;
              if (!p) return null;
              return (
                <Card key={item.id} hoverEffect={false} className="flex flex-col gap-3 group relative">
                  {/* Image container */}
                  <div className="h-40 bg-slate-950/80 rounded-xl overflow-hidden relative border border-slate-900">
                    <img src={p.imageBase64} className="w-full h-full object-cover" />
                    {item.stock === 0 && (
                      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
                        <Badge variant="error">OUT OF STOCK</Badge>
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-200 leading-snug line-clamp-1">{p.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Price</span>
                        <span className="text-lg font-extrabold text-yellow-500">₹{item.price}</span>
                      </div>

                      {item.stock > 0 && (
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => onAddToCart(p, shop, item.price)}
                        >
                          Add to Cart
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

// ==========================================
// VIEWS: GEMINI AI SHOPPING ASSISTANT
// ==========================================
interface AIAssistantProps {
  customerLocation: LatLng;
  onAddToCart: (p: Product, s: Shop, price: number) => void;
}

const AIAssistantView: React.FC<AIAssistantProps> = ({
  customerLocation,
  onAddToCart
}) => {
  const [messages, setMessages] = useState<{ sender: 'user' | 'assistant'; text: string; products?: any[] }[]>([
    { 
      sender: 'assistant', 
      text: "Hello! I am your buyQk AI Shopping Assistant. Tell me what you need! I can recommend products in real-time based on actual stock at nearby dark stores. For example, type 'I need school supplies' or 'gaming mouse under 1500'." 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await geminiService.askGeminiAssistant(userText, customerLocation);
      setMessages(prev => [...prev, { 
        sender: 'assistant', 
        text: response.answer, 
        products: response.products 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        sender: 'assistant', 
        text: "I am sorry, I hit a snag checking nearby stock tables. Could you ask again in a moment?" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch h-[calc(100vh-220px)]">
      
      {/* Left Chat Window */}
      <div className="col-span-2 flex flex-col bg-[#0b2545]/20 border border-blue-900/30 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Chat message logs */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex flex-col max-w-[85%] ${m.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">
                {m.sender === 'user' ? 'You' : 'buyQk AI'}
              </span>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed border ${
                m.sender === 'user' 
                  ? 'bg-slate-900 border-blue-900/30 text-white rounded-tr-none' 
                  : 'bg-navy-900/80 border-slate-800 text-slate-200 rounded-tl-none shadow-lg'
              }`}>
                {m.text.split('\n').map((para, i) => (
                  <p key={i} className="mb-2 last:mb-0 whitespace-pre-wrap">{para}</p>
                ))}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="self-start flex flex-col max-w-[80%]">
              <span className="text-[10px] text-slate-500 uppercase font-bold mb-1">Gemini AI Engine</span>
              <div className="bg-slate-900/50 border border-blue-900/20 px-5 py-4 rounded-2xl flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-xs text-slate-400">Searching nearby dark store inventory tables...</span>
              </div>
            </div>
          )}
        </div>

        {/* User query inputs */}
        <form onSubmit={handleSend} className="p-4 bg-slate-950 border-t border-blue-900/20 flex gap-2">
          <Input 
            placeholder="Type naturally e.g., 'need groceries for cooking pasta' or 'medical items'"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button variant="primary" type="submit" disabled={isLoading}>
            Send
          </Button>
        </form>
      </div>

      {/* Right AI recommendations cards panel */}
      <div className="flex flex-col gap-4 bg-slate-950/40 border border-blue-900/20 rounded-3xl p-6 overflow-y-auto">
        <span className="text-xs uppercase font-bold text-yellow-500 tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" /> AI Recommendations Shelf
        </span>
        <p className="text-[11px] text-slate-400">
          Products mentioned in the conversation that are currently sitting in stock nearby will show here as actionable items.
        </p>

        {/* Display recommending products */}
        <div className="flex flex-col gap-4 mt-2">
          {(() => {
            const assistantMsgsWithProducts = messages.filter(m => m.sender === 'assistant' && m.products && m.products.length > 0);
            if (assistantMsgsWithProducts.length === 0) {
              return (
                <div className="text-center py-20 text-slate-600 text-xs">
                  No active recommendations shelf.
                </div>
              );
            }
            // Get last response items
            const lastMsg = assistantMsgsWithProducts[assistantMsgsWithProducts.length - 1];
            return lastMsg.products?.map((item: any) => (
              <Card key={item.id} hoverEffect={false} className="p-4 border border-blue-900/20 bg-slate-900/40 flex gap-3">
                <img src={item.product.imageBase64} className="w-12 h-12 object-cover rounded-xl border border-slate-800 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-slate-100 truncate">{item.product.name}</h4>
                  <span className="text-[10px] text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded-full inline-block mt-1 font-semibold">{item.shop.name}</span>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-extrabold text-white">₹{item.price}</span>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => {
                        onAddToCart(item.product, item.shop, item.price);
                      }}
                      className="px-3 py-1 text-xs"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </Card>
            ));
          })()}
        </div>
      </div>

    </div>
  );
};

// ==========================================
// VIEWS: MY ORDERS (HISTORY & TRACKING)
// ==========================================
const OrdersView: React.FC<{ orders: Order[] }> = ({ orders }) => {
  return (
    <div className="flex flex-col gap-6">
      <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Order History & Live Fulfillment Log</span>

      {orders.length === 0 ? (
        <Card hoverEffect={false} className="py-20 text-center">
          <h3 className="font-bold text-slate-300">You haven't placed any orders yet.</h3>
          <p className="text-xs text-slate-500 mt-1">Explore stores and checkout items to populate this log.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map(order => {
            const steps: ('placed' | 'accepted' | 'preparing' | 'dispatched' | 'delivered')[] = [
              'placed', 'accepted', 'preparing', 'dispatched', 'delivered'
            ];
            const activeIndex = steps.indexOf(order.orderStatus as any);

            // Simulation step helper (allows quick testing)
            const handleSimulateNextStep = async () => {
              if (order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') return;
              const nextIdx = activeIndex + 1;
              if (nextIdx < steps.length) {
                await orderService.updateOrderStatus(order.id, steps[nextIdx]);
                showToast(`Order ${order.id} status updated to: ${steps[nextIdx].toUpperCase()}`, "info");
              }
            };

            return (
              <Card key={order.id} hoverEffect={false} className="p-6 border border-blue-900/30">
                
                {/* Header Meta */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-4 mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Order ID</span>
                    <h3 className="font-bold text-slate-200">{order.id}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Placed on: {new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block text-right">Merchant Node</span>
                      <span className="font-semibold text-yellow-500 text-sm">🏪 {order.shopName}</span>
                    </div>
                    <Badge variant={order.orderStatus === 'delivered' ? 'success' : order.orderStatus === 'cancelled' ? 'error' : 'warning'}>
                      {order.orderStatus}
                    </Badge>
                  </div>
                </div>

                {/* Items */}
                <div className="flex flex-col gap-2 mb-6">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-slate-300">{item.name} <span className="text-slate-500">x{item.quantity}</span></span>
                      <span className="font-bold text-slate-100">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs text-slate-400 border-t border-slate-800/40 pt-2">
                    <span>Subtotal + Delivery (₹{order.deliveryCharge}) + Fees (₹5)</span>
                    <span className="font-extrabold text-yellow-500 text-sm">Total: ₹{order.total}</span>
                  </div>
                </div>

                {/* Tracking Progress Bar */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-blue-900/10 flex flex-col gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Delivery Step Status</span>
                  
                  {order.orderStatus === 'cancelled' ? (
                    <div className="text-xs text-red-400 font-semibold uppercase tracking-wider py-2">
                      ⚠️ Order was Cancelled
                    </div>
                  ) : (
                    <div className="flex items-center justify-between relative mt-2">
                      <div className="absolute left-0 right-0 h-1 bg-slate-900 top-1/2 -translate-y-1/2 z-0" />
                      {steps.map((st, i) => {
                        const isDone = i <= activeIndex;
                        const isCurrent = i === activeIndex;
                        return (
                          <div key={st} className="flex flex-col items-center gap-1.5 z-10 relative">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-xs transition-all ${
                              isCurrent 
                                ? 'bg-yellow-500 border-yellow-400 text-slate-950 scale-110 shadow-lg shadow-yellow-500/20' 
                                : isDone 
                                  ? 'bg-blue-950 border-blue-800 text-blue-400' 
                                  : 'bg-slate-950 border-slate-800 text-slate-600'
                            }`}>
                              {i + 1}
                            </div>
                            <span className={`text-[10px] font-semibold uppercase tracking-wider ${isCurrent ? 'text-yellow-500' : 'text-slate-500'}`}>
                              {st}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Simulation Trigger (For Prototyping checkout loops) */}
                {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
                  <div className="mt-4 flex justify-end">
                    <Button variant="secondary" size="sm" onClick={handleSimulateNextStep}>
                      Simulate Delivery Step →
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ==========================================
// VIEWS: WALLET LEDGER
// ==========================================
const WalletView: React.FC<{ uid: string }> = ({ uid }) => {
  const [balance, setBalance] = useState(0);
  const [txs, setTxs] = useState<any[]>([]);
  const [rechargeAmt, setRechargeAmt] = useState('');

  useEffect(() => {
    const unsub = walletService.subscribeToWallet(uid, (bal) => {
      setBalance(bal);
      setTxs(walletService.getWalletTransactions(uid));
    });
    return () => unsub();
  }, [uid]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(rechargeAmt);
    if (isNaN(amt) || amt <= 0) return;
    
    try {
      await walletService.addFunds(uid, amt);
      setRechargeAmt('');
      showToast(`Deposited ₹${amt} into wallet!`, "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      
      {/* Wallet balance panel */}
      <Card hoverEffect={false} className="p-6 bg-gradient-to-br from-slate-900 to-blue-950/40 border border-blue-900/30 flex flex-col gap-6">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">buyQk Wallet</span>
          <h2 className="text-4xl font-extrabold text-white mt-2">₹{balance}</h2>
          <p className="text-xs text-slate-400 mt-1">Preload digital currency for zero-latency checkouts</p>
        </div>

        <form onSubmit={handleDeposit} className="flex flex-col gap-3">
          <Input 
            label="Deposit Credits (INR)" 
            placeholder="e.g. 500" 
            value={rechargeAmt}
            onChange={e => setRechargeAmt(e.target.value)}
            type="number"
            required
          />
          <Button variant="primary" type="submit" className="w-full">
            Fund Wallet Credits
          </Button>
        </form>
      </Card>

      {/* Ledger transaction logs */}
      <div className="col-span-2 flex flex-col gap-4 bg-slate-950/40 border border-blue-900/10 rounded-3xl p-6">
        <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Transaction Ledger Ledger</span>
        
        {txs.length === 0 ? (
          <div className="py-20 text-center text-slate-600 text-xs">
            No transactions found on your account ledger.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {txs.map(tx => (
              <div key={tx.id} className="flex items-center justify-between border-b border-slate-800/40 pb-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-100">{tx.description}</h4>
                  <span className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleString()}</span>
                </div>
                <span className={`font-extrabold text-sm ${tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

// ==========================================
// VIEWS: SLICE-GRADE BRAND LANDING PAGE
// ==========================================
interface LandingPageViewProps {
  onLaunchApp: () => void;
  onLoginGoogle: () => void;
  currentUser: any;
  onLogout: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onLaunchApp,
  onLoginGoogle,
  currentUser,
  onLogout
}) => {
  return (
    <div className="min-h-screen text-white relative overflow-hidden font-sans bg-[#081C3A]">
      {/* Dynamic CSS Injector for Keyframes */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) scale(1) rotate(0deg); }
          50% { transform: translateY(-30px) scale(1.05) rotate(5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) scale(1.05) rotate(0deg); }
          50% { transform: translateY(30px) scale(0.95) rotate(-5deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.3; }
        }
        @keyframes dash {
          to {
            stroke-dashoffset: -100;
          }
        }
        .animate-float-slow {
          animation: float-slow 15s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 20s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 10s ease-in-out infinite;
        }
        .bg-grid-pattern {
          background-size: 50px 50px;
          background-image: 
            linear-gradient(to right, rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.015) 1px, transparent 1px);
        }
        .dash-line {
          animation: dash 50s linear infinite;
        }
      `}</style>

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-80 pointer-events-none" />

      {/* Glowing Mesh Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-900/10 blur-[130px] pointer-events-none animate-float-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-yellow-500/5 blur-[130px] pointer-events-none animate-float-delayed" />
      <div className="absolute top-[30%] right-[20%] w-[450px] h-[450px] rounded-full bg-indigo-600/5 blur-[110px] pointer-events-none animate-pulse-glow" />

      {/* Interactive Delivery Network Grid SVG (Slice/Linear style) */}
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="yellow-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFC107" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFC107" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="indigo-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Connection Paths representing routes */}
        <path d="M-100,300 L400,200 L800,500 L1400,300 L1900,700" fill="none" stroke="url(#yellow-glow)" strokeWidth="1.5" className="dash-line" style={{ strokeDasharray: '12, 12' }} />
        <path d="M100,900 L600,700 L1000,1000 L1600,600" fill="none" stroke="url(#indigo-glow)" strokeWidth="1" className="dash-line" style={{ strokeDasharray: '8, 16' }} />
        <path d="M300,-100 L900,400 L1200,200 L1700,550" fill="none" stroke="url(#yellow-glow)" strokeWidth="1.5" className="dash-line" style={{ strokeDasharray: '15, 10' }} />
        
        {/* Glow Nodes representing dark store hubs */}
        <circle cx="400" cy="200" r="5" fill="#FFC107" className="animate-pulse" />
        <circle cx="800" cy="500" r="6" fill="#FFC107" className="animate-pulse" />
        <circle cx="1400" cy="300" r="4" fill="#3B82F6" className="animate-pulse" />
        <circle cx="600" cy="700" r="5" fill="#3B82F6" className="animate-pulse" />
        <circle cx="1000" cy="1000" r="7" fill="#FFC107" className="animate-pulse" />
        <circle cx="900" cy="400" r="6" fill="#FFC107" className="animate-pulse" />
        <circle cx="1200" cy="200" r="4" fill="#3B82F6" className="animate-pulse" />
      </svg>

      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-[#081C3A]/60 backdrop-blur-xl border-b border-blue-900/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BuyQkLogo className="w-10 h-10 shadow-lg shadow-yellow-500/10" />
          <span className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-1.5">
            buyQk
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <a 
            href="http://localhost:3001" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-[#102A4C]/60 hover:bg-[#102A4C]/90 border border-blue-900/40 backdrop-blur-md rounded-xl shadow-lg transition-all duration-300"
          >
            🏪 Go to Seller Hub
          </a>
          <a 
            href="http://localhost:3002" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-[#102A4C]/60 hover:bg-[#102A4C]/90 border border-blue-900/40 backdrop-blur-md rounded-xl shadow-lg transition-all duration-300"
          >
            🛡️ Go to Admin Console
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24 flex flex-col items-center text-center gap-8 relative z-10">
        
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-xs font-semibold tracking-wider text-yellow-500 uppercase">
          <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" /> The Universal Local Supply Network
        </div>

        {/* Grand Headline (Slice.bank style typography & colors) */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-sans leading-none max-w-4xl text-white">
          Find Anything. <br />
          <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 bg-clip-text text-transparent">
            Deliver Anything. Instantly.
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed">
          The world doesn't need another generic delivery app. It needs a connected grid. Every local neighborhood store transformed into a dark store node, delivered at lightspeed.
        </p>

        {/* Central Focus Card (Glassmorphism card) */}
        <div className="w-full max-w-xl bg-gradient-to-br from-[#102A4C]/60 to-[#102A4C]/20 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col gap-6 mt-6">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider font-sans">
            Ready to explore?
          </h2>

          <div className="flex flex-col gap-3">
            <Button 
              variant="primary" 
              onClick={onLaunchApp}
              className="w-full py-4 text-base font-bold shadow-[0_8px_32px_rgba(255,193,7,0.25)] flex items-center justify-center gap-2 group"
            >
              Launch Customer Storefinder
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-all" />
            </Button>

            {!currentUser ? (
              <Button 
                variant="glass" 
                onClick={onLoginGoogle}
                className="w-full border border-blue-900/30 hover:border-yellow-500/30 flex items-center justify-center gap-2 py-3.5"
              >
                <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.41 0-6.19-2.78-6.19-6.19 0-3.41 2.78-6.19 6.19-6.19 1.494 0 2.87.525 3.96 1.413l3.056-3.056C19.108 2.062 15.924 1 12.24 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.894 0 10.94-4.225 10.94-11.24 0-.768-.088-1.5-.24-2.17H12.24z"/>
                </svg>
                Continue with Google
              </Button>
            ) : (
              <div className="flex flex-col gap-2 bg-[#081C3A]/60 border border-blue-900/20 p-4 rounded-2xl text-xs">
                <span className="text-slate-400">
                  Logged in as <strong className="text-white">{currentUser.name}</strong> ({currentUser.email})
                </span>
                <button 
                  onClick={onLogout}
                  className="text-red-400 hover:text-red-300 font-bold transition-all text-[11px] uppercase tracking-wider mt-1"
                >
                  Logout Session
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-12">
          
          <div className="bg-[#102A4C]/30 border border-blue-900/20 backdrop-blur-md rounded-2xl p-6 text-left flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 font-bold">
              🏪
            </div>
            <h3 className="font-bold text-white text-base">Local Vendors Digitized</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-sans">
              Empowers neighborhood grocery stores, electronics shops, bakeries, and chemists to instantly sell online.
            </p>
          </div>

          <div className="bg-[#102A4C]/30 border border-blue-900/20 backdrop-blur-md rounded-2xl p-6 text-left flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 font-bold">
              🗺️
            </div>
            <h3 className="font-bold text-white text-base">Dynamic Geofences</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-sans">
              Fulfillment areas mapped via interactive polygon zones, ensuring logistics accuracy and speed.
            </p>
          </div>

          <div className="bg-[#102A4C]/30 border border-blue-900/20 backdrop-blur-md rounded-2xl p-6 text-left flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 font-bold">
              🧠
            </div>
            <h3 className="font-bold text-white text-base">Gemini AI Assistant</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-sans">
              Context-aware shopping bot queries nearby vendor stocks and responds with direct checkout recommendations.
            </p>
          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-blue-900/20 py-8 text-center text-xs text-slate-500 bg-[#081C3A]/80">
        <p>© 2026 buyQk Inc. Universal local logistics platform.</p>
      </footer>
    </div>
  );
};
