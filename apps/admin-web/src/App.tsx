import React, { useState, useEffect, useRef } from 'react';
import { 
  auth, 
  shopService, 
  adminService, 
  orderService,
  geoService,
  DEFAULT_PLATFORM_SETTINGS,
  ADMIN_EMAILS
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
  ShieldAlert, 
  User as UserIcon, 
  MapPin, 
  Users, 
  Percent, 
  ClipboardList, 
  Map, 
  Check, 
  X as CloseIcon, 
  Plus, 
  Sliders, 
  TrendingUp, 
  Compass, 
  FileText,
  DollarSign,
  Image,
  Store,
  Edit
} from 'lucide-react';
import { Shop, Order, LatLng, City, Area, Zone, PlatformSettings } from '@buyqk/types';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", 
  "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export default function App() {
  return (
    <ToastProvider>
      <AdminApp />
    </ToastProvider>
  );
}

function AdminApp() {
  const [currentUser, setCurrentUser] = useState<any>(auth.getCurrentUser());
  const [statesList, setStatesList] = useState<string[]>(INDIAN_STATES);
  const [ghostClicks, setGhostClicks] = useState(0);

  const handleGhostClick = () => {
    const nextClicks = ghostClicks + 1;
    if (nextClicks >= 3) {
      setGhostClicks(0);
      const targetUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3004'
        : 'https://hr.buyqk.com';
      window.location.href = targetUrl;
    } else {
      setGhostClicks(nextClicks);
      setTimeout(() => {
        setGhostClicks(c => c > 0 ? c - 1 : 0);
      }, 5000);
    }
  };

  useEffect(() => {
    fetch("https://countriesnow.space/api/v0.1/countries/states", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: "India" })
    })
      .then(res => res.json())
      .then(data => {
        if (data?.data?.states) {
          const names = data.data.states.map((s: any) => s.name);
          if (names.length > 0) setStatesList(names);
        }
      })
      .catch(err => console.log("Failed to fetch states from API:", err));
  }, []);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'approvals' | 'maps' | 'settings' | 'users'>('dashboard');

  const handleGoogleLogin = async () => {
    try {
      const user = await auth.signInWithGoogle('admin');
      if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
        await auth.signOut();
        throw new Error("Access Denied. You are not authorized to access the Admin Panel.");
      }
      setCurrentUser({ ...user, role: 'admin' });
      showToast(`Welcome Superuser, ${user.name}!`, "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };
  
  // Database States
  const [shops, setShops] = useState<Shop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);

  // Admin Add-Seller Modal State
  const [isAddSellerOpen, setIsAddSellerOpen] = useState(false);
  const [asSellerName, setAsSellerName] = useState('');
  const [asSellerEmail, setAsSellerEmail] = useState('');
  const [asSellerPhone, setAsSellerPhone] = useState('');
  const [asShopName, setAsShopName] = useState('');
  const [asShopDesc, setAsShopDesc] = useState('');
  const [asStreet, setAsStreet] = useState('');
  const [asCity, setAsCity] = useState('Mumbai');
  const [asState, setAsState] = useState('Maharashtra');
  const [asPostal, setAsPostal] = useState('400053');
  const [asLat, setAsLat] = useState(19.1136);
  const [asLng, setAsLng] = useState(72.8258);
  const [asRadius, setAsRadius] = useState(5);
  const [asOpenTime, setAsOpenTime] = useState('08:00');
  const [asCloseTime, setAsCloseTime] = useState('22:00');
  const [asPan, setAsPan] = useState('');
  const [asGst, setAsGst] = useState('');
  const [asLogoB64, setAsLogoB64] = useState('');
  const [asBannerB64, setAsBannerB64] = useState('');

  // Image Edit Modal State
  const [editImgShop, setEditImgShop] = useState<Shop | null>(null);
  const [editLogoB64, setEditLogoB64] = useState('');
  const [editBannerB64, setEditBannerB64] = useState('');

  // Details Edit Modal State
  const [editDetailShop, setEditDetailShop] = useState<Shop | null>(null);
  const [editShopName, setEditShopName] = useState('');
  const [editShopDesc, setEditShopDesc] = useState('');
  const [editStreet, setEditStreet] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPostal, setEditPostal] = useState('');
  const [editLat, setEditLat] = useState(19.1136);
  const [editLng, setEditLng] = useState(72.8258);
  const [editRadius, setEditRadius] = useState(5);
  const [editOpenTime, setEditOpenTime] = useState('08:00');
  const [editCloseTime, setEditCloseTime] = useState('22:00');

  // Location hierarchy Forms
  const [newCityName, setNewCityName] = useState('');
  const [newCityState, setNewCityState] = useState('');
  const [newCityCountry, setNewCityCountry] = useState('India');
  const [selectedCityIdForArea, setSelectedCityIdForArea] = useState('');
  const [newAreaName, setNewAreaName] = useState('');

  // Zone geofencing map draw state
  const [selectedCityForZone, setSelectedCityForZone] = useState('');
  const [selectedAreaForZone, setSelectedAreaForZone] = useState('');
  const [newZoneName, setNewZoneName] = useState('');
  const [zonePoints, setZonePoints] = useState<LatLng[]>([]);

  // Settings Forms
  const [commPercent, setCommPercent] = useState(String(settings.commissionPercent));
  const [baseDel, setBaseDel] = useState(String(settings.baseDeliveryCharge));
  const [delPerKm, setDelPerKm] = useState(String(settings.deliveryChargePerKm));
  const [platFee, setPlatFee] = useState(String(settings.platformFee));
  const [freeDelThreshold, setFreeDelThreshold] = useState(String(settings.freeDeliveryThreshold));
  const [mapProvider, setMapProvider] = useState<'openstreetmap' | 'google'>('openstreetmap');
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');

  // Auth Forms
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Image file-to-base64 converter
  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  useEffect(() => {
    const unsubUser = auth.onAuthStateChanged((user) => {
      if (user && user.email && ADMIN_EMAILS.includes(user.email)) {
        user.role = 'admin';
      }
      setCurrentUser(user);
    });

    const unsubShops = shopService.subscribeToShops((allShops) => {
      setShops(allShops);
    });

    const unsubOrders = orderService.subscribeToAllOrders((allOrders) => {
      setOrders(allOrders);
    });

    const unsubUsers = adminService.subscribeToUsers((allUsers: any[]) => {
      setUsers(allUsers);
    });

    const unsubCities = geoService.subscribeToCities(setCities);
    const unsubAreas = geoService.subscribeToAreas(setAreas);
    const unsubZones = geoService.subscribeToZones(setZones);

    // Load settings from Firestore
    adminService.getPlatformSettings().then((s) => {
      setSettings(s);
      setCommPercent(String(s.commissionPercent));
      setBaseDel(String(s.baseDeliveryCharge));
      setDelPerKm(String(s.deliveryChargePerKm));
      setPlatFee(String(s.platformFee));
      setFreeDelThreshold(String(s.freeDeliveryThreshold));
      setMapProvider(s.mapProvider || 'openstreetmap');
      setGoogleMapsApiKey(s.googleMapsApiKey || '');
    });

    return () => {
      unsubUser();
      unsubShops();
      unsubOrders();
      unsubUsers();
      unsubCities();
      unsubAreas();
      unsubZones();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const email = authEmail?.trim().toLowerCase();
      if (!email || !ADMIN_EMAILS.includes(email)) {
        throw new Error("Access Denied. You are not authorized to access the Admin Panel.");
      }
      const u = await auth.signIn({ email: authEmail, password: authPassword });
      setCurrentUser({ ...u, role: 'admin' });
      showToast("Access Granted: Super Admin Node loaded.", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleCreateCity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createCity(newCityName, newCityState, newCityCountry);
      showToast(`City ${newCityName} registered.`, "success");
      setNewCityName(''); setNewCityState('');
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCityIdForArea) { showToast("Select target City.", "error"); return; }
    try {
      await adminService.createArea(newAreaName, selectedCityIdForArea);
      showToast(`Area ${newAreaName} registered under City.`, "success");
      setNewAreaName('');
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Map drawing coordinates pinner for Zones
  const handleMapClick = (latlng: LatLng) => {
    if (activeTab !== 'maps') return;
    setZonePoints([...zonePoints, latlng]);
    showToast(`Coordinate added: [${latlng.latitude.toFixed(4)}, ${latlng.longitude.toFixed(4)}]`, "info");
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (zonePoints.length < 3) {
      showToast("A delivery zone polygon must contain at least 3 pins.", "error");
      return;
    }
    if (!selectedCityForZone || !selectedAreaForZone || !newZoneName) {
      showToast("Fill in Zone metadata fields.", "error");
      return;
    }
    try {
      await adminService.createZone(newZoneName, selectedAreaForZone, selectedCityForZone, zonePoints);
      showToast(`Geofenced Zone ${newZoneName} active!`, "success");
      setNewZoneName(''); setZonePoints([]);
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const newSets: PlatformSettings = {
      commissionPercent: Number(commPercent),
      baseDeliveryCharge: Number(baseDel),
      deliveryChargePerKm: Number(delPerKm),
      platformFee: Number(platFee),
      freeDeliveryThreshold: Number(freeDelThreshold),
      mapProvider,
      googleMapsApiKey
    };
    try {
      await adminService.updatePlatformSettings(newSets);
      setSettings(newSets);
      showToast("Platform logistics rules updated.", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleApproveShop = async (shopId: string) => {
    try {
      await shopService.approveShop(shopId);
      showToast("Shop approved — live on Customer panel now!", "success");
    } catch (err: any) { showToast(err.message, "error"); }
  };

  const handleRejectShop = async (shopId: string) => {
    try {
      await shopService.rejectShop(shopId);
      showToast("Shop suspended.", "info");
    } catch (err: any) { showToast(err.message, "error"); }
  };

  const handleAdminAddSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.adminCreateShop({
        sellerName: asSellerName, sellerEmail: asSellerEmail, sellerPhone: asSellerPhone,
        shopName: asShopName, description: asShopDesc,
        street: asStreet, city: asCity, state: asState, postalCode: asPostal,
        latitude: asLat, longitude: asLng,
        deliveryRadiusKm: asRadius, openingTime: asOpenTime, closingTime: asCloseTime,
        categories: ['cat_groceries'], logoBase64: asLogoB64, bannerBase64: asBannerB64,
        pan: asPan, gst: asGst
      });
      showToast('Seller & shop created and approved — live immediately!', 'success');
      setIsAddSellerOpen(false);
      setAsSellerName(''); setAsSellerEmail(''); setAsSellerPhone('');
      setAsShopName(''); setAsShopDesc(''); setAsStreet(''); setAsPan(''); setAsGst('');
      setAsLogoB64(''); setAsBannerB64('');
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const handleSaveShopImages = async () => {
    if (!editImgShop) return;
    try {
      await adminService.updateShopImages(editImgShop.id, editLogoB64 || undefined, editBannerB64 || undefined);
      showToast('Shop images updated!', 'success');
      setEditImgShop(null);
      setEditLogoB64(''); setEditBannerB64('');
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const handleSaveShopDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDetailShop) return;
    try {
      await adminService.updateShopDetails(editDetailShop.id, {
        name: editShopName,
        description: editShopDesc,
        street: editStreet,
        city: editCity,
        state: editState,
        postalCode: editPostal,
        latitude: editLat,
        longitude: editLng,
        deliveryRadiusKm: editRadius,
        openingTime: editOpenTime,
        closingTime: editCloseTime,
        categories: editDetailShop.categories || ['cat_groceries']
      });
      showToast('Shop details updated!', 'success');
      setEditDetailShop(null);
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  // Calculations for KPI Cards
  const totalPlatformVolume = orders
    .filter((o: any) => o.status !== 'cancelled')
    .reduce((acc: number, curr: any) => acc + (curr.total || 0), 0);

  const platformEarnings = orders
    .filter((o: any) => o.status !== 'cancelled' && o.paymentStatus === 'paid')
    .reduce((acc: number, curr: any) => acc + ((curr.subtotal || 0) * (settings.commissionPercent / 100)) + (curr.platformFee || 0), 0);

  const pendingApprovals = shops.filter(s => s.status === 'pending');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-navy-900/80 backdrop-blur-xl border-b border-blue-900/30 px-4 py-3 lg:px-8 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <BuyQkLogo className="w-10 h-10" />
          <div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              buyQk <span className="text-xs text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 font-bold">Admin Console</span>
            </span>
            <p className="text-[10px] text-slate-400">Enterprise control panel</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentUser && currentUser.role === 'admin' && (
            <>
              <Badge variant="error">SUPERUSER SESSION</Badge>
              <button 
                onClick={() => auth.signOut()}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-blue-900/20 transition-all"
                title="Logout"
              >
                <LogOutIcon />
              </button>
            </>
          )}

          {/* Secret Ghost HR Trigger (3 clicks path to HR Portal) */}
          <button 
            onClick={handleGhostClick}
            className="w-10 h-10 rounded-xl hover:bg-slate-900/60 flex items-center justify-center border border-blue-900/20 transition-all select-none active:scale-95 z-50 cursor-pointer"
            title="buyQk System Terminal"
          >
            <img 
              src="/assets/logopng.png" 
              alt="buyqk" 
              className="w-7 h-7 object-contain opacity-80 hover:opacity-100 transition-opacity"
            />
          </button>
        </div>
      </header>

      {/* Main Body Grid */}
      {currentUser && currentUser.role === 'admin' ? (
        <main className="flex-1 max-w-[1400px] w-full mx-auto p-4 lg:p-8 flex flex-col gap-6">
          
          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 font-bold text-sm border-b-2 transition-all ${activeTab === 'dashboard' ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              📊 Executive KPI
            </button>
            <button 
              onClick={() => setActiveTab('approvals')}
              className={`px-4 py-2 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${activeTab === 'approvals' ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              🏢 Merchant Queue
              {pendingApprovals.length > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {pendingApprovals.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('maps')}
              className={`px-4 py-2 font-bold text-sm border-b-2 transition-all ${activeTab === 'maps' ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              🗺️ Zone & Spatial Settings
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 font-bold text-sm border-b-2 transition-all ${activeTab === 'settings' ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              ⚙️ Platform Parameters
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-bold text-sm border-b-2 transition-all ${activeTab === 'users' ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              👥 Registered Users
            </button>
          </div>

          {/* TAB VIEW CONTROLLERS */}
          {activeTab === 'dashboard' && (
            <AdminDashboard 
              volume={totalPlatformVolume}
              earnings={platformEarnings}
              shopsCount={shops.length}
              orders={orders}
            />
          )}

          {activeTab === 'approvals' && (
            <AdminApprovalsView
              pendingApprovals={pendingApprovals}
              allShops={shops}
              onApprove={handleApproveShop}
              onReject={handleRejectShop}
              onAddSeller={() => setIsAddSellerOpen(true)}
              onEditImages={(shop) => { setEditImgShop(shop); setEditLogoB64(shop.logoBase64); setEditBannerB64(shop.bannerBase64); }}
              onEditDetails={(shop) => {
                setEditDetailShop(shop);
                setEditShopName(shop.name);
                setEditShopDesc(shop.description);
                setEditStreet(shop.address?.street || '');
                setEditCity(shop.address?.city || '');
                setEditState(shop.address?.state || '');
                setEditPostal(shop.address?.postalCode || '');
                setEditLat(shop.location?.latitude || 19.1136);
                setEditLng(shop.location?.longitude || 72.8258);
                setEditRadius(shop.deliveryRadiusKm || 5);
                setEditOpenTime(shop.openingTime || '08:00');
                setEditCloseTime(shop.closingTime || '22:00');
              }}
            />
          )}

          {/* Add Seller Modal */}
          <Modal isOpen={isAddSellerOpen} onClose={() => setIsAddSellerOpen(false)} title="➕ Manually Add Seller & Shop">
            <form onSubmit={handleAdminAddSeller} className="flex flex-col gap-4">
              <p className="text-xs text-slate-400">This will create a fully approved seller and shop immediately — bypassing the self-service onboarding queue.</p>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Seller Name" value={asSellerName} onChange={e => setAsSellerName(e.target.value)} required />
                <Input label="Seller Phone" value={asSellerPhone} onChange={e => setAsSellerPhone(e.target.value)} required />
              </div>
              <Input label="Seller Email" type="email" value={asSellerEmail} onChange={e => setAsSellerEmail(e.target.value)} required />
              <Input label="Shop Name" value={asShopName} onChange={e => setAsShopName(e.target.value)} required />
              <Input label="Shop Description" value={asShopDesc} onChange={e => setAsShopDesc(e.target.value)} required />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Street" value={asStreet} onChange={e => setAsStreet(e.target.value)} required />
                <Input label="City" value={asCity} onChange={e => setAsCity(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="w-full flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">State</label>
                  <select
                    value={asState}
                    onChange={e => setAsState(e.target.value)}
                    required
                    className="bg-slate-900/60 border border-blue-900/30 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/60 transition-all duration-200 text-sm font-sans"
                  >
                    <option value="" className="bg-[#081C3A]">Select State</option>
                    {statesList.map(st => (
                      <option key={st} value={st} className="bg-[#081C3A]">{st}</option>
                    ))}
                  </select>
                </div>
                <Input label="Postal Code" value={asPostal} onChange={e => setAsPostal(e.target.value)} required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Latitude" type="number" value={String(asLat)} onChange={e => setAsLat(Number(e.target.value))} step="0.0001" required />
                <Input label="Longitude" type="number" value={String(asLng)} onChange={e => setAsLng(Number(e.target.value))} step="0.0001" required />
                <Input label="Radius (km)" type="number" value={String(asRadius)} onChange={e => setAsRadius(Number(e.target.value))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Opening Time" type="time" value={asOpenTime} onChange={e => setAsOpenTime(e.target.value)} required />
                <Input label="Closing Time" type="time" value={asCloseTime} onChange={e => setAsCloseTime(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="PAN" value={asPan} onChange={e => setAsPan(e.target.value)} />
                <Input label="GST" value={asGst} onChange={e => setAsGst(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Logo Image</label>
                  <input type="file" accept="image/*" className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-yellow-500/10 file:text-yellow-500 hover:file:bg-yellow-500/20" onChange={async e => { if (e.target.files?.[0]) setAsLogoB64(await toBase64(e.target.files[0])); }} />
                  {asLogoB64 && <img src={asLogoB64} className="w-16 h-16 rounded-xl object-cover mt-1 border border-slate-700" />}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Banner Image</label>
                  <input type="file" accept="image/*" className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-yellow-500/10 file:text-yellow-500 hover:file:bg-yellow-500/20" onChange={async e => { if (e.target.files?.[0]) setAsBannerB64(await toBase64(e.target.files[0])); }} />
                  {asBannerB64 && <img src={asBannerB64} className="w-full h-16 rounded-xl object-cover mt-1 border border-slate-700" />}
                </div>
              </div>
              <Button variant="primary" type="submit" className="mt-2">
                <Plus className="w-4 h-4" /> Create Approved Seller
              </Button>
            </form>
          </Modal>

          {/* Edit Shop Images Modal */}
          <Modal isOpen={!!editImgShop} onClose={() => setEditImgShop(null)} title={`🖼️ Update Images: ${editImgShop?.name}`}>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Current Logo</label>
                <img src={editLogoB64 || editImgShop?.logoBase64} className="w-24 h-24 rounded-xl object-cover border border-slate-700" />
                <input type="file" accept="image/*" className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-yellow-500/10 file:text-yellow-500 hover:file:bg-yellow-500/20" onChange={async e => { if (e.target.files?.[0]) setEditLogoB64(await toBase64(e.target.files[0])); }} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Current Banner</label>
                <img src={editBannerB64 || editImgShop?.bannerBase64} className="w-full h-32 rounded-xl object-cover border border-slate-700" />
                <input type="file" accept="image/*" className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-yellow-500/10 file:text-yellow-500 hover:file:bg-yellow-500/20" onChange={async e => { if (e.target.files?.[0]) setEditBannerB64(await toBase64(e.target.files[0])); }} />
              </div>
              <Button variant="primary" onClick={handleSaveShopImages}>
                <Image className="w-4 h-4" /> Save Images
              </Button>
            </div>
          </Modal>

          {/* Edit Shop Details Modal */}
          <Modal isOpen={!!editDetailShop} onClose={() => setEditDetailShop(null)} title={`✏️ Edit Shop Details: ${editDetailShop?.name}`}>
            <form onSubmit={handleSaveShopDetails} className="flex flex-col gap-4">
              <Input label="Shop Name" value={editShopName} onChange={e => setEditShopName(e.target.value)} required />
              <Input label="Shop Description" value={editShopDesc} onChange={e => setEditShopDesc(e.target.value)} required />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Street" value={editStreet} onChange={e => setEditStreet(e.target.value)} required />
                <Input label="City" value={editCity} onChange={e => setEditCity(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="w-full flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">State</label>
                  <select
                    value={editState}
                    onChange={e => setEditState(e.target.value)}
                    required
                    className="bg-slate-900/60 border border-blue-900/30 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/60 transition-all duration-200 text-sm font-sans"
                  >
                    <option value="" className="bg-[#081C3A]">Select State</option>
                    {statesList.map(st => (
                      <option key={st} value={st} className="bg-[#081C3A]">{st}</option>
                    ))}
                  </select>
                </div>
                <Input label="Postal Code" value={editPostal} onChange={e => setEditPostal(e.target.value)} required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Latitude" type="number" value={String(editLat)} onChange={e => setEditLat(Number(e.target.value))} step="0.0001" required />
                <Input label="Longitude" type="number" value={String(editLng)} onChange={e => setEditLng(Number(e.target.value))} step="0.0001" required />
                <Input label="Radius (km)" type="number" value={String(editRadius)} onChange={e => setEditRadius(Number(e.target.value))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Opening Time" type="time" value={editOpenTime} onChange={e => setEditOpenTime(e.target.value)} required />
                <Input label="Closing Time" type="time" value={editCloseTime} onChange={e => setEditCloseTime(e.target.value)} required />
              </div>
              <Button variant="primary" type="submit" className="mt-2">
                Save Changes
              </Button>
            </form>
          </Modal>

          {activeTab === 'maps' && (
            <AdminMapsView 
              cities={cities}
              areas={areas}
              zones={zones}
              shops={shops}
              onCitySubmit={handleCreateCity}
              onAreaSubmit={handleCreateArea}
              onZoneSubmit={handleCreateZone}
              cityName={newCityName}
              setCityName={setNewCityName}
              cityState={newCityState}
              setCityState={setNewCityState}
              cityCountry={newCityCountry}
              setCityCountry={setNewCityCountry}
              selectedCityIdForArea={selectedCityIdForArea}
              setSelectedCityIdForArea={setSelectedCityIdForArea}
              areaName={newAreaName}
              setAreaName={setNewAreaName}
              selectedCityForZone={selectedCityForZone}
              setSelectedCityForZone={setSelectedCityForZone}
              selectedAreaForZone={selectedAreaForZone}
              setSelectedAreaForZone={setSelectedAreaForZone}
              zoneName={newZoneName}
              setZoneName={setNewZoneName}
              points={zonePoints}
              clearPoints={() => setZonePoints([])}
              onMapClick={handleMapClick}
              statesList={statesList}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettingsView 
              commPercent={commPercent}
              setComm={setCommPercent}
              baseDel={baseDel}
              setBaseDel={setBaseDel}
              delPerKm={delPerKm}
              setDelPerKm={setDelPerKm}
              platFee={platFee}
              setPlatFee={setPlatFee}
              freeDel={freeDelThreshold}
              setFreeDel={setFreeDelThreshold}
              mapProvider={mapProvider}
              setMapProvider={setMapProvider}
              googleMapsApiKey={googleMapsApiKey}
              setGoogleMapsApiKey={setGoogleMapsApiKey}
              onSave={handleSaveSettings}
            />
          )}

          {activeTab === 'users' && (
            <AdminUsersView users={users} />
          )}

        </main>
      ) : (
        /* ADMIN AUTH PORTAL */
        <main className="flex-1 flex items-center justify-center p-6 bg-slate-950/40">
          <Card className="w-full max-w-md p-8" hoverEffect={false}>
            <div className="text-center mb-8 flex flex-col items-center gap-3">
              <img src="/assets/logopng.png" className="w-24 h-24 object-contain hover:scale-105 transition-all duration-300" alt="buyQk Logo" />
              <h2 className="text-xl font-bold tracking-tight text-white uppercase font-sans">
                Admin Console
              </h2>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <Input 
                label="Administrator Email" 
                placeholder="admin@buyqk.com" 
                value={authEmail} 
                onChange={e => setAuthEmail(e.target.value)} 
                type="email"
                required 
              />

              <Input 
                label="Console Password" 
                placeholder="••••••••" 
                value={authPassword} 
                onChange={e => setAuthPassword(e.target.value)} 
                type="password"
                required 
              />

              <Button variant="primary" type="submit" className="w-full mt-4 bg-gradient-to-r from-red-600 to-amber-600 text-white hover:from-red-500 hover:to-amber-500 shadow-red-500/10">
                Acknowledge Console Credentials
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
          </Card>
        </main>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-950/80 border-t border-blue-900/20 py-6 text-center text-xs text-slate-500 mt-auto">
        <p>© 2026 buyQk Admin Terminal. Interactive Geofences and polygons mapped.</p>
      </footer>
    </div>
  );
}

function LogOutIcon() {
  return <CloseIcon className="w-4 h-4" />;
}

// ==========================================
// VIEWS: ADMIN DASHBOARD
// ==========================================
interface AdminDashboardProps {
  volume: number;
  earnings: number;
  shopsCount: number;
  orders: Order[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  volume,
  earnings,
  shopsCount,
  orders
}) => {
  return (
    <div className="flex flex-col gap-6">
      
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Card hoverEffect={false} className="flex items-center gap-4 border-l-4 border-l-amber-500 bg-slate-900/40">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">Gross Merchandise Volume</span>
            <h3 className="text-2xl font-extrabold text-white mt-1">₹{volume.toFixed(2)}</h3>
          </div>
        </Card>

        <Card hoverEffect={false} className="flex items-center gap-4 border-l-4 border-l-emerald-500 bg-slate-900/40">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">Platform Net Commission Fee</span>
            <h3 className="text-2xl font-extrabold text-white mt-1">₹{earnings.toFixed(2)}</h3>
          </div>
        </Card>

        <Card hoverEffect={false} className="flex items-center gap-4 border-l-4 border-l-blue-500 bg-slate-900/40">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">Registered Supplier Nodes</span>
            <h3 className="text-2xl font-extrabold text-white mt-1">{shopsCount} stores</h3>
          </div>
        </Card>

      </div>

      {/* Platform Activity Ledger logs */}
      <Card hoverEffect={false} className="p-6">
        <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Universal Transactions activity Ledger</span>
        
        {orders.length === 0 ? (
          <div className="py-20 text-center text-slate-600 text-xs">
            No system checkouts logged.
          </div>
        ) : (
          <div className="flex flex-col gap-3 mt-4">
            {orders.slice(0, 10).map(ord => (
              <div key={ord.id} className="flex items-center justify-between border-b border-slate-800 pb-3 last:border-0 last:pb-0">
                <div>
                  <h4 className="font-bold text-sm text-slate-200">Ref: {ord.id}</h4>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Shop: {ord.shopName} | Customer: {ord.customerName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-white">₹{ord.total}</span>
                  <Badge variant={ord.orderStatus === 'delivered' ? 'success' : 'warning'}>
                    {ord.orderStatus}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  );
};

// ==========================================
// VIEWS: MERCHANT MANAGEMENT (QUEUE + ALL SHOPS)
// ==========================================
interface AdminApprovalsProps {
  pendingApprovals: Shop[];
  allShops: Shop[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onAddSeller: () => void;
  onEditImages: (shop: Shop) => void;
  onEditDetails: (shop: Shop) => void;
}

const AdminApprovalsView: React.FC<AdminApprovalsProps> = ({
  pendingApprovals,
  allShops,
  onApprove,
  onReject,
  onAddSeller,
  onEditImages,
  onEditDetails
}) => {
  const [viewMode, setViewMode] = useState<'pending' | 'all'>('pending');
  const approvedShops = allShops.filter(s => s.status === 'approved');
  const suspendedShops = allShops.filter(s => s.status === 'suspended');

  const ShopCard = ({ shop, isPending }: { shop: Shop; isPending?: boolean }) => (
    <Card key={shop.id} hoverEffect={false} className="p-5 border border-blue-900/30 flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <img src={shop.logoBase64} className="w-16 h-16 object-cover rounded-xl border border-slate-700 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-100 text-sm">{shop.name}</h3>
            <Badge variant={shop.status === 'approved' ? 'success' : shop.status === 'pending' ? 'warning' : 'error'}>
              {shop.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{shop.description}</p>
          <p className="text-[10px] text-slate-500 mt-1 font-mono">{shop.address.formattedAddress}</p>
        </div>
      </div>

      <div className="h-28 w-full bg-slate-950 rounded-xl overflow-hidden">
        <img src={shop.bannerBase64} className="w-full h-full object-cover" />
      </div>

      <div className="bg-slate-950 p-3 border border-blue-900/10 rounded-xl text-xs text-slate-300 grid grid-cols-2 gap-1.5 font-mono">
        <p><strong>Coords:</strong> {typeof shop.location?.latitude === 'number' ? shop.location.latitude.toFixed(4) : '19.1136'}, {typeof shop.location?.longitude === 'number' ? shop.location.longitude.toFixed(4) : '72.8258'}</p>
        <p><strong>Radius:</strong> {shop.deliveryRadiusKm || 5} km</p>
        <p><strong>Hours:</strong> {shop.openingTime || '08:00'} — {shop.closingTime || '22:00'}</p>
        <p><strong>ID:</strong> {shop.id.slice(0, 12)}…</p>
      </div>

      <div className="flex gap-2 justify-end flex-wrap">
        <Button variant="glass" size="sm" onClick={() => onEditDetails(shop)}>
          <Edit className="w-3.5 h-3.5" /> Edit Details
        </Button>
        <Button variant="glass" size="sm" onClick={() => onEditImages(shop)}>
          <Image className="w-3.5 h-3.5" /> Edit Images
        </Button>
        {isPending && (
          <>
            <Button variant="danger" size="sm" onClick={() => onReject(shop.id)}>
              <CloseIcon className="w-3.5 h-3.5" /> Reject
            </Button>
            <Button variant="primary" size="sm" onClick={() => onApprove(shop.id)}>
              <Check className="w-3.5 h-3.5" /> Approve
            </Button>
          </>
        )}
        {!isPending && shop.status === 'approved' && (
          <Button variant="danger" size="sm" onClick={() => onReject(shop.id)}>
            <CloseIcon className="w-3.5 h-3.5" /> Suspend
          </Button>
        )}
        {!isPending && shop.status === 'suspended' && (
          <Button variant="primary" size="sm" onClick={() => onApprove(shop.id)}>
            <Check className="w-3.5 h-3.5" /> Reactivate
          </Button>
        )}
      </div>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900 rounded-xl border border-slate-800 p-1 gap-1">
            <button
              onClick={() => setViewMode('pending')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'pending' ? 'bg-yellow-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pending ({pendingApprovals.length})
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'all' ? 'bg-yellow-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Shops ({allShops.length})
            </button>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={onAddSeller}>
          <Plus className="w-4 h-4" /> Add Seller Manually
        </Button>
      </div>

      {/* Content */}
      {viewMode === 'pending' && (
        pendingApprovals.length === 0 ? (
          <Card hoverEffect={false} className="py-20 text-center">
            <Store className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-slate-300 font-bold">No pending applications.</h3>
            <p className="text-xs text-slate-500 mt-1">Seller registrations from the Seller Hub will appear here automatically.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pendingApprovals.map(shop => <ShopCard key={shop.id} shop={shop} isPending />)}
          </div>
        )
      )}

      {viewMode === 'all' && (
        <div className="flex flex-col gap-6">
          {approvedShops.length > 0 && (
            <div>
              <p className="text-xs uppercase font-bold text-emerald-500 tracking-wider mb-3">✅ Active Stores ({approvedShops.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {approvedShops.map(shop => <ShopCard key={shop.id} shop={shop} />)}
              </div>
            </div>
          )}
          {suspendedShops.length > 0 && (
            <div>
              <p className="text-xs uppercase font-bold text-red-500 tracking-wider mb-3">🚫 Suspended Stores ({suspendedShops.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {suspendedShops.map(shop => <ShopCard key={shop.id} shop={shop} />)}
              </div>
            </div>
          )}
          {allShops.length === 0 && (
            <Card hoverEffect={false} className="py-20 text-center">
              <h3 className="text-slate-300 font-bold">No shops registered yet.</h3>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

// ==========================================
// VIEWS: ZONE GEOFENCING MAPS
// ==========================================
interface AdminMapsProps {
  cities: City[];
  areas: Area[];
  zones: Zone[];
  shops: Shop[];
  onCitySubmit: (e: React.FormEvent) => void;
  onAreaSubmit: (e: React.FormEvent) => void;
  onZoneSubmit: (e: React.FormEvent) => void;
  cityName: string;
  setCityName: (n: string) => void;
  cityState: string;
  setCityState: (s: string) => void;
  cityCountry: string;
  setCityCountry: (c: string) => void;
  selectedCityIdForArea: string;
  setSelectedCityIdForArea: (id: string) => void;
  areaName: string;
  setAreaName: (n: string) => void;
  selectedCityForZone: string;
  setSelectedCityForZone: (id: string) => void;
  selectedAreaForZone: string;
  setSelectedAreaForZone: (id: string) => void;
  zoneName: string;
  setZoneName: (n: string) => void;
  points: LatLng[];
  clearPoints: () => void;
  onMapClick: (latlng: LatLng) => void;
  statesList: string[];
}

const AdminMapsView: React.FC<AdminMapsProps> = ({
  cities,
  areas,
  zones,
  shops,
  onCitySubmit,
  onAreaSubmit,
  onZoneSubmit,
  cityName,
  setCityName,
  cityState,
  setCityState,
  cityCountry,
  setCityCountry,
  selectedCityIdForArea,
  setSelectedCityIdForArea,
  areaName,
  setAreaName,
  selectedCityForZone,
  setSelectedCityForZone,
  selectedAreaForZone,
  setSelectedAreaForZone,
  zoneName,
  setZoneName,
  points,
  clearPoints,
  onMapClick,
  statesList
}) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
      
      {/* Forms column (Hierarchical setups) */}
      <div className="flex flex-col gap-6">
        
        {/* City Form */}
        <Card hoverEffect={false} className="p-5 flex flex-col gap-4">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">1. Register City</span>
          <form onSubmit={onCitySubmit} className="flex flex-col gap-3">
            <Input label="City Name" placeholder="e.g. Mumbai" value={cityName} onChange={e=>setCityName(e.target.value)} required />
            <div className="w-full flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300 uppercase">State</label>
              <select
                value={cityState}
                onChange={e => setCityState(e.target.value)}
                required
                className="bg-slate-900/60 border border-blue-900/30 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/60 transition-all duration-200 text-sm font-sans"
              >
                <option value="" className="bg-[#081C3A]">Select State</option>
                {statesList.map(st => (
                  <option key={st} value={st} className="bg-[#081C3A]">{st}</option>
                ))}
              </select>
            </div>
            <Button variant="primary" type="submit" className="w-full py-2.5">Add City</Button>
          </form>
        </Card>

        {/* Area Form */}
        <Card hoverEffect={false} className="p-5 flex flex-col gap-4">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">2. Register Area under City</span>
          <form onSubmit={onAreaSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300 uppercase">Target City</label>
              <select 
                value={selectedCityIdForArea} 
                onChange={e => setSelectedCityIdForArea(e.target.value)}
                required
                className="bg-slate-900/60 border border-blue-900/30 rounded-xl px-4 py-3 text-white"
              >
                <option value="">Select City</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Input label="Area Name" placeholder="e.g. Andheri West" value={areaName} onChange={e=>setAreaName(e.target.value)} required />
            <Button variant="primary" type="submit" className="w-full py-2.5">Add Area</Button>
          </form>
        </Card>

        {/* Zone Geofence Form */}
        <Card hoverEffect={false} className="p-5 flex flex-col gap-4">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">3. Geofence Zone boundary</span>
          <form onSubmit={onZoneSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <select 
                value={selectedCityForZone} 
                onChange={e => setSelectedCityForZone(e.target.value)}
                required
                className="bg-slate-900/60 border border-blue-900/30 rounded-xl px-4 py-3 text-xs text-white"
              >
                <option value="">City</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select 
                value={selectedAreaForZone} 
                onChange={e => setSelectedAreaForZone(e.target.value)}
                required
                className="bg-slate-900/60 border border-blue-900/30 rounded-xl px-4 py-3 text-xs text-white"
              >
                <option value="">Area</option>
                {areas.filter(a => a.cityId === selectedCityForZone).map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            
            <Input label="Zone ID Name" placeholder="e.g. Andheri West Delivery Zone" value={zoneName} onChange={e=>setZoneName(e.target.value)} required />
            
            <div className="bg-slate-950 p-3 rounded-xl border border-blue-900/10 text-[10px] text-slate-400 font-mono">
              <p className="font-bold text-slate-300">Geofence Coordinates ({points.length} nodes):</p>
              {points.map((p, idx) => (
                <p key={idx} className="truncate">Node {idx+1}: {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}</p>
              ))}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={clearPoints} className="flex-1 py-2 text-xs">Clear Canvas</Button>
              <Button variant="primary" type="submit" className="flex-1 py-2 text-xs">Create Zone</Button>
            </div>
          </form>
        </Card>

      </div>

      {/* Spatial Map canvas Column */}
      <div className="col-span-2 flex flex-col gap-4">
        <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Spatial Geofence canvas map</span>
        <div className="bg-slate-950 p-4 border border-blue-900/20 rounded-3xl flex flex-col gap-4">
          <p className="text-xs text-slate-400">
            <strong>Zone Design Mode:</strong> Click on the map canvas sequentially to draw a polygon representing your delivery coverage zone. Draw at least 3 nodes, then name the zone in the form panel to commit the polygon.
          </p>

          <LeafletMap 
            center={{ latitude: 19.1136, longitude: 72.8258 }}
            zoom={13}
            onMapClick={onMapClick}
            polygonCoordinates={points} // Show currently drawing polygon
            shops={shops.map(s => ({
              id: s.id,
              name: s.name,
              location: s.location,
              address: s.address.formattedAddress
            }))}
            className="h-[500px] rounded-2xl overflow-hidden border border-blue-900/30 shadow-2xl"
          />

          {/* Listed Active Zones Shaded polygon tracker */}
          <div className="flex flex-col gap-2 mt-2">
            <span className="text-xs font-bold text-slate-300 uppercase">Active geofenced zones ({zones.length})</span>
            <div className="flex flex-wrap gap-2">
              {zones.map(z => (
                <Badge key={z.id} variant="info">
                  📍 {z.name} ({z.coordinates.length} vertices)
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

// ==========================================
// VIEWS: PLATFORM RULES
// ==========================================
interface AdminSettingsProps {
  commPercent: string;
  setComm: (v: string) => void;
  baseDel: string;
  setBaseDel: (v: string) => void;
  delPerKm: string;
  setDelPerKm: (v: string) => void;
  platFee: string;
  setPlatFee: (v: string) => void;
  freeDel: string;
  setFreeDel: (v: string) => void;
  mapProvider: 'openstreetmap' | 'google';
  setMapProvider: (v: 'openstreetmap' | 'google') => void;
  googleMapsApiKey: string;
  setGoogleMapsApiKey: (v: string) => void;
  onSave: (e: React.FormEvent) => void;
}

const AdminSettingsView: React.FC<AdminSettingsProps> = ({
  commPercent,
  setComm,
  baseDel,
  setBaseDel,
  delPerKm,
  setDelPerKm,
  platFee,
  setPlatFee,
  freeDel,
  setFreeDel,
  mapProvider,
  setMapProvider,
  googleMapsApiKey,
  setGoogleMapsApiKey,
  onSave
}) => {
  return (
    <Card hoverEffect={false} className="max-w-xl mx-auto p-8 border border-blue-900/30">
      <div className="mb-6">
        <h3 className="font-bold text-slate-200 text-lg">Global Platform Parameter Logistics</h3>
        <p className="text-xs text-slate-400 mt-1">Configure baseline transaction cuts and delivery charges</p>
      </div>

      <form onSubmit={onSave} className="flex flex-col gap-4">
        <Input 
          label="Platform Commission (Percent per Sale)" 
          type="number" 
          value={commPercent} 
          onChange={e=>setComm(e.target.value)} 
          required 
        />
        <Input 
          label="Base Delivery Charge (INR)" 
          type="number" 
          value={baseDel} 
          onChange={e=>setBaseDel(e.target.value)} 
          required 
        />
        <Input 
          label="Delivery Charge Per KM (Beyond 2km)" 
          type="number" 
          value={delPerKm} 
          onChange={e=>setDelPerKm(e.target.value)} 
          required 
        />
        <Input 
          label="Platform Fee (Flat INR per checkout)" 
          type="number" 
          value={platFee} 
          onChange={e=>setPlatFee(e.target.value)} 
          required 
        />
        <Input 
          label="Free Delivery Threshold (INR)" 
          type="number" 
          value={freeDel} 
          onChange={e=>setFreeDel(e.target.value)} 
          required 
        />

        <div className="border-t border-slate-700/60 my-2 pt-4 flex flex-col gap-4">
          <h4 className="text-sm font-bold text-slate-200">Map & Geocoding Configurations</h4>
          
          <div className="w-full flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Map Tile & Geocoding Provider</label>
            <select
              value={mapProvider}
              onChange={e => setMapProvider(e.target.value as any)}
              required
              className="bg-slate-900/60 border border-blue-900/30 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/60 transition-all duration-200 text-sm font-sans"
            >
              <option value="openstreetmap" className="bg-[#081C3A]">OpenStreetMap (100% Free, Default)</option>
              <option value="google" className="bg-[#081C3A]">Google Maps API (Includes Free Tier / key-based)</option>
            </select>
          </div>

          {mapProvider === 'google' && (
            <Input 
              label="Google Maps API Credentials Key" 
              type="text" 
              placeholder="AIzaSy..." 
              value={googleMapsApiKey} 
              onChange={e=>setGoogleMapsApiKey(e.target.value)} 
              required={mapProvider === 'google'}
            />
          )}
        </div>

        <Button variant="primary" type="submit" className="w-full py-3 mt-4">
          Save Configuration Params
        </Button>
      </form>
    </Card>
  );
};

interface AdminUsersViewProps {
  users: any[];
}

const AdminUsersView: React.FC<AdminUsersViewProps> = ({ users }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hrName, setHrName] = useState('');
  const [hrEmail, setHrEmail] = useState('');
  const [hrPhone, setHrPhone] = useState('');
  const [hrPassword, setHrPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateHR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hrEmail || !hrPassword || !hrName) {
      showToast("Please fill in Name, Email and Password fields.", "error");
      return;
    }
    setLoading(true);
    try {
      await adminService.adminCreateHRUser({
        name: hrName,
        email: hrEmail,
        phoneNumber: hrPhone,
        password: hrPassword
      });
      showToast("HR Account successfully created!", "success");
      setShowCreateModal(false);
      setHrName('');
      setHrEmail('');
      setHrPhone('');
      setHrPassword('');
    } catch (err: any) {
      showToast(err.message || "Failed to create HR account.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Registered System Users ({users.length})</span>
        <Button 
          variant="primary" 
          onClick={() => setShowCreateModal(true)}
          className="text-xs py-2 px-4 flex items-center justify-center gap-1.5 font-sans"
        >
          👤 Create HR Account Credentials
        </Button>
      </div>

      <Card hoverEffect={false} className="p-6 overflow-hidden bg-slate-900/40">
        {users.length === 0 ? (
          <div className="py-20 text-center text-slate-600 text-sm">
            No registered users found.
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm text-slate-300 font-sans border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-widest text-[10px] font-bold">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u, i) => (
                  <tr key={u.uid || i} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                       <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 text-xs font-bold font-mono">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span>{u.name}</span>
                        {u.tempPasswordCreated && (
                          <span className="text-[10px] text-yellow-500 font-mono">PWD: {u.tempPasswordCreated}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">{u.email}</td>
                    <td className="py-3.5 px-4 font-mono text-xs">{u.phoneNumber || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      <select 
                        value={u.role || 'customer'} 
                        onChange={async (e) => {
                          try {
                            await adminService.updateUserRole(u.uid, e.target.value);
                            showToast(`Updated ${u.name}'s role to ${e.target.value.toUpperCase()}`, "success");
                          } catch (err: any) {
                            showToast("Failed to edit user role: " + err.message, "error");
                          }
                        }}
                        className="bg-slate-950/80 text-xs text-white border border-blue-900/40 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-yellow-500/60 transition-all font-sans"
                      >
                        <option value="customer">CUSTOMER</option>
                        <option value="seller">SELLER</option>
                        <option value="hr">HR MANAGER</option>
                        <option value="admin">ADMIN</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === 'active' || u.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        ● {u.status || 'active'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="👤 Create System HR Credentials">
        <form onSubmit={handleCreateHR} className="flex flex-col gap-4 p-1 font-sans">
          <p className="text-xs text-slate-400 leading-relaxed mb-1">
            Standard user credential initialization. The system will register this email in Firebase Auth and assign the "hr" role immediately.
          </p>
          <Input 
            label="Name" 
            type="text" 
            placeholder="HR Officer Name" 
            value={hrName} 
            onChange={e=>setHrName(e.target.value)} 
            required 
          />
          <Input 
            label="Email Address / User ID" 
            type="email" 
            placeholder="hr@buyqk.com" 
            value={hrEmail} 
            onChange={e=>setHrEmail(e.target.value)} 
            required 
          />
          <Input 
            label="Phone Number" 
            type="text" 
            placeholder="+91 98765 43210" 
            value={hrPhone} 
            onChange={e=>setHrPhone(e.target.value)} 
          />
          <Input 
            label="Password string" 
            type="password" 
            placeholder="••••••••" 
            value={hrPassword} 
            onChange={e=>setHrPassword(e.target.value)} 
            required 
          />

          <Button variant="primary" type="submit" disabled={loading} className="w-full py-3 mt-4">
            {loading ? 'Creating Auth Record...' : 'Generate and Save Credentials'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
