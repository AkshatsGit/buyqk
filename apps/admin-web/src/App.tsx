import React, { useState, useEffect } from 'react';
import { 
  auth, 
  shopService, 
  productService, 
  adminService, 
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
  DollarSign
} from 'lucide-react';
import { Shop, Order, LatLng, City, Area, Zone, PlatformSettings } from '@buyqk/types';

export default function App() {
  return (
    <ToastProvider>
      <AdminApp />
    </ToastProvider>
  );
}

function AdminApp() {
  const [currentUser, setCurrentUser] = useState<any>(auth.getCurrentUser());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'approvals' | 'maps' | 'settings' | 'users'>('dashboard');

  const handleGoogleLogin = async () => {
    try {
      const user = await auth.signInWithGoogle('admin');
      if (user.email !== 'akshat.srivastava098@gmail.com') {
        await auth.signOut();
        throw new Error("Access Denied. Only akshat.srivastava098@gmail.com is authorized to access the Admin Panel.");
      }
      user.role = 'admin';
      localStorage.setItem('gin_current_user', JSON.stringify(user));
      setCurrentUser(user);
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
  const [settings, setSettings] = useState<PlatformSettings>(adminService.getPlatformSettings());

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

  // Auth Forms
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  useEffect(() => {
    const unsubUser = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    const refreshAdminData = () => {
      setShops(shopService.getShops());
      setCities(JSON.parse(localStorage.getItem('gin_cities') || '[]'));
      setAreas(JSON.parse(localStorage.getItem('gin_areas') || '[]'));
      setZones(JSON.parse(localStorage.getItem('gin_zones') || '[]'));
    };

    const unsubShops = shopService.subscribeToShops(() => {
      refreshAdminData();
    });

    const unsubOrders = orderService.subscribeToOrders((allOrders) => {
      setOrders(allOrders);
    });

    const unsubUsers = (adminService as any).subscribeToUsers((allUsers: any[]) => {
      setUsers(allUsers);
    });

    refreshAdminData();

    return () => {
      unsubUser();
      unsubShops();
      unsubOrders();
      unsubUsers();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (authEmail !== 'akshat.srivastava098@gmail.com') {
        throw new Error("Access Denied. Only akshat.srivastava098@gmail.com is authorized to access the Admin Panel.");
      }
      const u = await auth.signIn({ email: authEmail, password: authPassword });
      // Elevate role to admin for session
      const adminUser = { ...u, role: 'admin' };
      localStorage.setItem('gin_current_user', JSON.stringify(adminUser));
      setCurrentUser(adminUser);
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
      setNewCityName('');
      setNewCityState('');
      setCities(JSON.parse(localStorage.getItem('gin_cities') || '[]'));
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCityIdForArea) {
      showToast("Select target City.", "error");
      return;
    }
    try {
      await adminService.createArea(newAreaName, selectedCityIdForArea);
      showToast(`Area ${newAreaName} registered under City.`, "success");
      setNewAreaName('');
      setAreas(JSON.parse(localStorage.getItem('gin_areas') || '[]'));
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
      setNewZoneName('');
      setZonePoints([]);
      setZones(JSON.parse(localStorage.getItem('gin_zones') || '[]'));
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
      freeDeliveryThreshold: Number(freeDelThreshold)
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
      showToast("Shop permit approved. Store linked to active dark store tables.", "success");
      setShops(shopService.getShops());
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleRejectShop = async (shopId: string) => {
    try {
      await shopService.rejectShop(shopId);
      showToast("Shop permit rejected and store suspended.", "info");
      setShops(shopService.getShops());
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Calculations for KPI Cards
  const totalPlatformVolume = orders
    .filter(o => o.orderStatus !== 'cancelled')
    .reduce((acc, curr) => acc + curr.total, 0);

  const platformEarnings = orders
    .filter(o => o.orderStatus !== 'cancelled' && o.paymentStatus === 'paid')
    .reduce((acc, curr) => acc + (curr.subtotal * (settings.commissionPercent / 100)) + curr.platformFee, 0);

  const pendingApprovals = shops.filter(s => s.status === 'pending');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-navy-900/80 backdrop-blur-xl border-b border-blue-900/30 px-4 py-3 lg:px-8 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <BuyQkLogo className="w-10 h-10 shadow-lg shadow-yellow-500/10" />
          <div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              buyQk <span className="text-xs text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 font-bold">Admin Console</span>
            </span>
            <p className="text-[10px] text-slate-400">Enterprise control panel</p>
          </div>
        </div>

        {currentUser && currentUser.role === 'admin' && (
          <div className="flex items-center gap-3">
            <Badge variant="error">SUPERUSER SESSION</Badge>
            <button 
              onClick={() => auth.signOut()}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-blue-900/20 transition-all"
              title="Logout"
            >
              <LogOutIcon />
            </button>
          </div>
        )}
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
            <AdminApprovalsView approvals={pendingApprovals} onApprove={handleApproveShop} onReject={handleRejectShop} />
          )}

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
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-white uppercase font-sans flex items-center justify-center gap-2">
                <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" /> Admin Gatekeeper
              </h2>
              <p className="text-slate-400 text-sm mt-1">Authorized access logs check only</p>
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
// VIEWS: SHOP ONBOARDING QUEUE
// ==========================================
interface AdminApprovalsProps {
  approvals: Shop[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const AdminApprovalsView: React.FC<AdminApprovalsProps> = ({
  approvals,
  onApprove,
  onReject
}) => {
  return (
    <div className="flex flex-col gap-6">
      <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Merchant Onboarding permit reviews</span>

      {approvals.length === 0 ? (
        <Card hoverEffect={false} className="py-20 text-center">
          <h3 className="text-slate-300 font-bold">Registration queue is currently empty.</h3>
          <p className="text-xs text-slate-500 mt-1">Pending dark store applications will automatically route here for evaluation.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {approvals.map(shop => (
            <Card key={shop.id} hoverEffect={false} className="p-6 border border-blue-900/30 flex flex-col gap-4">
              
              <div className="flex items-center gap-4">
                <img src={shop.logoBase64} className="w-16 h-16 object-cover rounded-xl border border-slate-800" />
                <div>
                  <h3 className="font-bold text-slate-100">{shop.name}</h3>
                  <p className="text-xs text-slate-400">{shop.description}</p>
                </div>
              </div>

              {/* Photos */}
              <div className="h-32 w-full bg-slate-950 rounded-xl overflow-hidden relative">
                <img src={shop.bannerBase64} className="w-full h-full object-cover" />
              </div>

              {/* Shop info specs */}
              <div className="bg-slate-950 p-4 border border-blue-900/10 rounded-xl text-xs text-slate-300 flex flex-col gap-2 font-mono">
                <p><strong>Physical Address:</strong> {shop.address.formattedAddress}</p>
                <p><strong>Coordinates:</strong> {shop.location.latitude.toFixed(5)}, {shop.location.longitude.toFixed(5)}</p>
                <p><strong>Fulfillment Radius:</strong> {shop.deliveryRadiusKm} km</p>
                <p><strong>Hours:</strong> {shop.openingTime} - {shop.closingTime}</p>
                <p><strong>PAN ID:</strong> {shop.id} (Verified)</p>
              </div>

              {/* Action row */}
              <div className="flex gap-2 justify-end">
                <Button variant="danger" size="sm" onClick={() => onReject(shop.id)}>
                  <CloseIcon className="w-4 h-4" /> Reject Permit
                </Button>
                <Button variant="primary" size="sm" onClick={() => onApprove(shop.id)}>
                  <Check className="w-4 h-4" /> Approve Permit
                </Button>
              </div>

            </Card>
          ))}
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
  onMapClick
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
            <Input label="State" placeholder="e.g. Maharashtra" value={cityState} onChange={e=>setCityState(e.target.value)} required />
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
  return (
    <div className="flex flex-col gap-6">
      <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Registered System Users ({users.length})</span>

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
                      {u.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">{u.email}</td>
                    <td className="py-3.5 px-4 font-mono text-xs">{u.phoneNumber || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        u.role === 'admin' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                        u.role === 'seller' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                        'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      }`}>
                        {u.role?.toUpperCase()}
                      </span>
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
    </div>
  );
};
