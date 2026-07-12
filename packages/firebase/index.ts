import { User, Shop, Product, InventoryItem, Order, OrderGroup, City, Area, Zone, WalletTransaction, PlatformSettings, Category, Brand, LatLng, Address, PaymentMethod, OrderStatus, PaymentStatus } from '@buyqk/types';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword
} from 'firebase/auth';

let firebaseApp: any = null;
let firebaseAuth: any = null;

const isFirebaseConfigured = () => {
  const env = (import.meta as any).env;
  return env && env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_API_KEY !== 'placeholder';
};

if (isFirebaseConfigured()) {
  const env = (import.meta as any).env;
  const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
  };
  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApps()[0];
  }
  firebaseAuth = getAuth(firebaseApp);
}

// Let's create an in-memory/localStorage reactive state for our mock DB to ensure realtime updates work.
class MockDatabase {
  private listeners: { [key: string]: Function[] } = {};

  constructor() {
    this.initDefaults();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('gin_')) {
          const collection = e.key.substring(4);
          this.notify(collection);
        }
      });
    }
  }

  private initDefaults() {
    if (typeof window !== 'undefined' && !localStorage.getItem('gin_db_version_4')) {
      localStorage.removeItem('gin_users');
      localStorage.removeItem('gin_shops');
      localStorage.removeItem('gin_sellers');
      localStorage.removeItem('gin_customers');
      localStorage.removeItem('gin_products');
      localStorage.removeItem('gin_inventory');
      localStorage.removeItem('gin_orders');
      localStorage.removeItem('gin_order_groups');
      localStorage.removeItem('gin_wallet');
      localStorage.setItem('gin_db_version_4', 'true');
    }

    // Helper to generate SVG placeholders
    const makeSvg = (emoji: string, bg: string) => `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${encodeURIComponent(bg)}"/><text y=".9em" font-size="80" x="10">${emoji}</text></svg>`;

    if (!localStorage.getItem('gin_users')) {
      localStorage.setItem('gin_users', JSON.stringify([
        { uid: 'u_customer', name: 'Aryan Customer', email: 'customer@buyqk.com', phoneNumber: '+919999999999', role: 'customer', status: 'active', createdAt: new Date().toISOString() },
        { uid: 'u_sellerA', name: 'Rajesh Seller', email: 'sellerA@buyqk.com', phoneNumber: '+919888888888', role: 'seller', status: 'approved', createdAt: new Date().toISOString() },
        { uid: 'u_sellerB', name: 'Vikram Seller', email: 'sellerB@buyqk.com', phoneNumber: '+919777777777', role: 'seller', status: 'approved', createdAt: new Date().toISOString() },
        { uid: 'u_sellerC', name: 'Anita Seller', email: 'sellerC@buyqk.com', phoneNumber: '+919666666666', role: 'seller', status: 'approved', createdAt: new Date().toISOString() },
        { uid: 'u_admin', name: 'Super Admin', email: 'admin@buyqk.com', phoneNumber: '+919555555555', role: 'admin', status: 'active', createdAt: new Date().toISOString() },
        { uid: 'akshat_admin', name: 'Akshat Srivastava', email: 'akshat.srivastava098@gmail.com', phoneNumber: '+919999999999', role: 'admin', status: 'active', createdAt: new Date().toISOString() },
        { uid: 'u_test', name: 'Test Account', email: 'test@test.com', phoneNumber: '+919999988888', role: 'customer', status: 'active', createdAt: new Date().toISOString() }
      ]));
    }

    if (!localStorage.getItem('gin_shops')) {
      localStorage.setItem('gin_shops', JSON.stringify([
        {
          id: 'shop_gupta',
          sellerId: 'u_sellerA',
          name: 'Gupta Kirana & General Store',
          description: 'Your neighborhood instant grocery store with fresh farm produce.',
          logoBase64: makeSvg('🍎', '#FFC107'),
          bannerBase64: makeSvg('🏪', '#081C3A'),
          address: { street: 'Main Link Road, Andheri West', city: 'Mumbai', state: 'Maharashtra', postalCode: '400053', formattedAddress: 'Main Link Road, Andheri West, Mumbai, MH - 400053', location: { latitude: 19.1150, longitude: 72.8300 } },
          location: { latitude: 19.1150, longitude: 72.8300 },
          deliveryRadiusKm: 5,
          openingTime: '07:00',
          closingTime: '23:00',
          status: 'approved',
          isActive: true,
          categories: ['cat_groceries'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'shop_sharma',
          sellerId: 'u_sellerB',
          name: 'Sharma Electronics & Repair',
          description: 'Laptops, mouse accessories, and cables delivered in 10 minutes.',
          logoBase64: makeSvg('🔌', '#2196F3'),
          bannerBase64: makeSvg('💻', '#102A4C'),
          address: { street: 'SV Road, Near Station, Andheri', city: 'Mumbai', state: 'Maharashtra', postalCode: '400053', formattedAddress: 'SV Road, Near Station, Andheri, Mumbai, MH - 400053', location: { latitude: 19.1200, longitude: 72.8280 } },
          location: { latitude: 19.1200, longitude: 72.8280 },
          deliveryRadiusKm: 6,
          openingTime: '08:00',
          closingTime: '22:00',
          status: 'approved',
          isActive: true,
          categories: ['cat_electronics'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'shop_verma',
          sellerId: 'u_sellerC',
          name: 'Verma Sweets & Bakery',
          description: 'Apothecary drugs, health supplements, and warm oven fresh bakery goodies.',
          logoBase64: makeSvg('🥐', '#4CAF50'),
          bannerBase64: makeSvg('💊', '#102A4C'),
          address: { street: 'JP Road, Four Bungalows', city: 'Mumbai', state: 'Maharashtra', postalCode: '400053', formattedAddress: 'JP Road, Four Bungalows, Mumbai, MH - 400053', location: { latitude: 19.1100, longitude: 72.8350 } },
          location: { latitude: 19.1100, longitude: 72.8350 },
          deliveryRadiusKm: 5,
          openingTime: '06:00',
          closingTime: '23:30',
          status: 'approved',
          isActive: true,
          categories: ['cat_bakery', 'cat_pharmacy'],
          createdAt: new Date().toISOString()
        }
      ]));
      
      // Link sellers to shops
      const sellers = [
        { uid: 'u_sellerA', name: 'Rajesh Gupta', email: 'sellerA@buyqk.com', phoneNumber: '+919888888888', shopId: 'shop_gupta', status: 'approved', pan: 'ABCDE1234F', createdAt: new Date().toISOString() },
        { uid: 'u_sellerB', name: 'Vikram Sharma', email: 'sellerB@buyqk.com', phoneNumber: '+919777777777', shopId: 'shop_sharma', status: 'approved', pan: 'FGHIJ5678K', createdAt: new Date().toISOString() },
        { uid: 'u_sellerC', name: 'Anita Verma', email: 'sellerC@buyqk.com', phoneNumber: '+919666666666', shopId: 'shop_verma', status: 'approved', pan: 'LMNOP9012Q', createdAt: new Date().toISOString() },
        { uid: 'u_test', name: 'Test Account', email: 'test@test.com', phoneNumber: '+919999988888', shopId: 'shop_gupta', status: 'approved', pan: 'XYZ123456P', createdAt: new Date().toISOString() }
      ];
      localStorage.setItem('gin_sellers', JSON.stringify(sellers));
    }

    if (!localStorage.getItem('gin_products')) {
      localStorage.setItem('gin_products', JSON.stringify([
        { id: 'prod_milk', name: 'InstaMilk Fresh (1L)', description: 'Pasteurized homogenized cow milk loaded with calcium.', categoryId: 'cat_groceries', brandId: 'b_amul', imageBase64: makeSvg('🥛', '#FFFFFF'), isApproved: true, createdAt: new Date().toISOString() },
        { id: 'prod_bread', name: 'Premium Wheat Bread', description: 'Freshly baked sliced whole wheat bread loaf.', categoryId: 'cat_groceries', brandId: 'b_local', imageBase64: makeSvg('🍞', '#8D6E63'), isApproved: true, createdAt: new Date().toISOString() },
        { id: 'prod_apple', name: 'Fresh Royal Gala Apples (Pack of 4)', description: 'Crisp, sweet imported apples handpicked for freshness.', categoryId: 'cat_groceries', brandId: 'b_local', imageBase64: makeSvg('🍎', '#E53935'), isApproved: true, createdAt: new Date().toISOString() },
        { id: 'prod_mouse', name: 'Logitech MX Anywhere Gaming Mouse', description: 'Wireless darkfield tracking silent click computer mouse.', categoryId: 'cat_electronics', brandId: 'b_logitech', imageBase64: makeSvg('🖱️', '#37474F'), isApproved: true, createdAt: new Date().toISOString() },
        { id: 'prod_cable', name: 'Apple USB-C Charge Cable (1m)', description: 'Fast charging high-speed syncing authentic apple cable.', categoryId: 'cat_electronics', brandId: 'b_apple', imageBase64: makeSvg('🔌', '#CFD8DC'), isApproved: true, createdAt: new Date().toISOString() },
        { id: 'prod_aspirin', name: 'Aspirin Pain Relief (10 Tablets)', description: 'Fever reducer and headache relief generic aspirin.', categoryId: 'cat_pharmacy', brandId: 'b_local', imageBase64: makeSvg('💊', '#B0BEC5'), isApproved: true, createdAt: new Date().toISOString() },
        { id: 'prod_croissant', name: 'Golden Butter Croissant (Pack of 2)', description: 'Oven-fresh flaky layered traditional french butter croissant.', categoryId: 'cat_bakery', brandId: 'b_local', imageBase64: makeSvg('🥐', '#FFB74D'), isApproved: true, createdAt: new Date().toISOString() }
      ]));
    }

    if (!localStorage.getItem('gin_inventory')) {
      localStorage.setItem('gin_inventory', JSON.stringify([
        // Gupta Kirana Inventory
        { id: 'shop_gupta_prod_milk', shopId: 'shop_gupta', productId: 'prod_milk', stock: 40, price: 65, isAvailable: true, updatedAt: new Date().toISOString() },
        { id: 'shop_gupta_prod_bread', shopId: 'shop_gupta', productId: 'prod_bread', stock: 25, price: 45, isAvailable: true, updatedAt: new Date().toISOString() },
        { id: 'shop_gupta_prod_apple', shopId: 'shop_gupta', productId: 'prod_apple', stock: 12, price: 160, isAvailable: true, updatedAt: new Date().toISOString() },
        
        // Sharma Electronics Inventory
        { id: 'shop_sharma_prod_mouse', shopId: 'shop_sharma', productId: 'prod_mouse', stock: 15, price: 1450, isAvailable: true, updatedAt: new Date().toISOString() },
        { id: 'shop_sharma_prod_cable', shopId: 'shop_sharma', productId: 'prod_cable', stock: 8, price: 1800, isAvailable: true, updatedAt: new Date().toISOString() },
        
        // Verma Sweets & Bakery Inventory
        { id: 'shop_verma_prod_aspirin', shopId: 'shop_verma', productId: 'prod_aspirin', stock: 80, price: 40, isAvailable: true, updatedAt: new Date().toISOString() },
        { id: 'shop_verma_prod_croissant', shopId: 'shop_verma', productId: 'prod_croissant', stock: 10, price: 90, isAvailable: true, updatedAt: new Date().toISOString() }
      ]));
    }

    if (!localStorage.getItem('gin_orders')) localStorage.setItem('gin_orders', JSON.stringify([]));
    if (!localStorage.getItem('gin_order_groups')) localStorage.setItem('gin_order_groups', JSON.stringify([]));

    if (!localStorage.getItem('gin_cities')) {
      localStorage.setItem('gin_cities', JSON.stringify([
        { id: '1', name: 'Mumbai', state: 'Maharashtra', country: 'India', active: true },
        { id: '2', name: 'Delhi', state: 'Delhi', country: 'India', active: true },
        { id: '3', name: 'Bangalore', state: 'Karnataka', country: 'India', active: true }
      ]));
    }
    if (!localStorage.getItem('gin_areas')) {
      localStorage.setItem('gin_areas', JSON.stringify([
        { id: '1', name: 'Andheri', cityId: '1', active: true },
        { id: '2', name: 'Connaught Place', cityId: '2', active: true },
        { id: '3', name: 'Indiranagar', cityId: '3', active: true }
      ]));
    }
    if (!localStorage.getItem('gin_zones')) {
      localStorage.setItem('gin_zones', JSON.stringify([
        {
          id: '1',
          name: 'Andheri West Zone',
          areaId: '1',
          cityId: '1',
          coordinates: [
            { latitude: 19.1136, longitude: 72.8258 },
            { latitude: 19.1350, longitude: 72.8250 },
            { latitude: 19.1300, longitude: 72.8450 },
            { latitude: 19.1050, longitude: 72.8400 }
          ],
          active: true
        }
      ]));
    }
    if (!localStorage.getItem('gin_categories')) {
      localStorage.setItem('gin_categories', JSON.stringify([
        { id: 'cat_groceries', name: 'Groceries & Fruits', icon: '🍎', active: true },
        { id: 'cat_electronics', name: 'Electronics', icon: '🔌', active: true },
        { id: 'cat_pharmacy', name: 'Medical & Pharmacy', icon: '💊', active: true },
        { id: 'cat_bakery', name: 'Bakery & Sweets', icon: '🥐', active: true },
        { id: 'cat_stationery', name: 'Stationery & Books', icon: '✏️', active: true },
        { id: 'cat_household', name: 'Household & Tools', icon: '🔨', active: true }
      ]));
    }
    if (!localStorage.getItem('gin_brands')) {
      localStorage.setItem('gin_brands', JSON.stringify([
        { id: 'b_apple', name: 'Apple', active: true },
        { id: 'b_nestle', name: 'Nestle', active: true },
        { id: 'b_amul', name: 'Amul', active: true },
        { id: 'b_logitech', name: 'Logitech', active: true },
        { id: 'b_local', name: 'Local Artisan', active: true }
      ]));
    }
    if (!localStorage.getItem('gin_customers')) {
      localStorage.setItem('gin_customers', JSON.stringify([
        { uid: 'u_customer', name: 'Aryan Customer', email: 'customer@buyqk.com', phoneNumber: '+919999999999', walletBalance: 500, rewardPoints: 50, createdAt: new Date().toISOString() },
        { uid: 'u_test', name: 'Test Account', email: 'test@test.com', phoneNumber: '+919999988888', walletBalance: 1000, rewardPoints: 100, createdAt: new Date().toISOString() }
      ]));
    }
    if (!localStorage.getItem('gin_wallet')) {
      localStorage.setItem('gin_wallet', JSON.stringify({
        'u_customer': [
          { id: 'tx_init_cust', amount: 500, type: 'credit', description: 'Welcome Bonus Credited', createdAt: new Date().toISOString() }
        ],
        'u_test': [
          { id: 'tx_init', amount: 1000, type: 'credit', description: 'Test Preloaded Balance', createdAt: new Date().toISOString() }
        ]
      }));
    }
    if (!localStorage.getItem('gin_settings')) {
      localStorage.setItem('gin_settings', JSON.stringify({
        commissionPercent: 10,
        baseDeliveryCharge: 30,
        deliveryChargePerKm: 10,
        platformFee: 5,
        freeDeliveryThreshold: 499
      }));
    }
  }

  public getData<T>(collection: string): T[] {
    const data = localStorage.getItem(`gin_${collection}`);
    return data ? JSON.parse(data) : [];
  }

  public saveData<T>(collection: string, data: T[]) {
    localStorage.setItem(`gin_${collection}`, JSON.stringify(data));
    this.notify(collection);
  }

  public subscribe(collection: string, callback: Function): () => void {
    if (!this.listeners[collection]) {
      this.listeners[collection] = [];
    }
    this.listeners[collection].push(callback);
    // Initial call
    callback(this.getData(collection));
    return () => {
      this.listeners[collection] = this.listeners[collection].filter(cb => cb !== callback);
    };
  }

  private notify(collection: string) {
    if (this.listeners[collection]) {
      const data = this.getData(collection);
      this.listeners[collection].forEach(cb => cb(data));
    }
  }
}

export const mockDb = new MockDatabase();



// ==========================================
// AUTHENTICATION SERVICES
// ==========================================

let currentUserListener: ((user: any) => void) | null = null;
let currentAuthUser: any = JSON.parse(localStorage.getItem('gin_current_user') || 'null');

export const auth = {
  getCurrentUser: () => {
    return currentAuthUser;
  },
  onAuthStateChanged: (callback: (user: any) => void) => {
    currentUserListener = callback;
    callback(currentAuthUser);
    return () => {
      currentUserListener = null;
    };
  },
  signUp: async (form: any) => {
    // If real Firebase configured, run real signup
    if (isFirebaseConfigured() && firebaseAuth) {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, form.email, form.password);
      const newUser: User = {
        uid: cred.user.uid,
        name: form.name,
        email: form.email,
        phoneNumber: form.phoneNumber,
        role: form.role,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      
      // Save user configuration locally too
      const users = mockDb.getData<any>('users');
      users.push(newUser);
      mockDb.saveData('users', users);
      
      if (form.role === 'seller') {
        const sellers = mockDb.getData<any>('sellers');
        sellers.push({
          uid: newUser.uid,
          name: newUser.name,
          email: newUser.email,
          phoneNumber: newUser.phoneNumber,
          status: 'pending',
          createdAt: newUser.createdAt
        });
        mockDb.saveData('sellers', sellers);
      } else {
        const customers = mockDb.getData<any>('customers');
        customers.push({
          uid: newUser.uid,
          name: newUser.name,
          email: newUser.email,
          phoneNumber: newUser.phoneNumber,
          walletBalance: 200,
          rewardPoints: 50,
          createdAt: newUser.createdAt
        });
        mockDb.saveData('customers', customers);

        const wallets = JSON.parse(localStorage.getItem('gin_wallet') || '{}');
        wallets[newUser.uid] = [
          { id: 'tx_init', amount: 200, type: 'credit', description: 'Welcome Bonus Credited', createdAt: new Date().toISOString() }
        ];
        localStorage.setItem('gin_wallet', JSON.stringify(wallets));
      }

      currentAuthUser = newUser;
      localStorage.setItem('gin_current_user', JSON.stringify(newUser));
      if (currentUserListener) currentUserListener(newUser);
      return newUser;
    }

    // Mock Mode fallback
    const users = mockDb.getData<any>('users');
    if (users.find(u => u.email === form.email)) {
      throw new Error("User already exists with this email.");
    }
    const newUser: User = {
      uid: 'u_' + Math.random().toString(36).substr(2, 9),
      name: form.name,
      email: form.email,
      phoneNumber: form.phoneNumber,
      role: form.role,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    mockDb.saveData('users', users);

    if (form.role === 'seller') {
      const sellers = mockDb.getData<any>('sellers');
      sellers.push({
        uid: newUser.uid,
        name: newUser.name,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        status: 'pending',
        createdAt: newUser.createdAt
      });
      mockDb.saveData('sellers', sellers);
    } else {
      const customers = mockDb.getData<any>('customers');
      customers.push({
        uid: newUser.uid,
        name: newUser.name,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        walletBalance: 200,
        rewardPoints: 50,
        createdAt: newUser.createdAt
      });
      mockDb.saveData('customers', customers);

      const wallets = JSON.parse(localStorage.getItem('gin_wallet') || '{}');
      wallets[newUser.uid] = [
        { id: 'tx_init', amount: 200, type: 'credit', description: 'Welcome Bonus Credited', createdAt: new Date().toISOString() }
      ];
      localStorage.setItem('gin_wallet', JSON.stringify(wallets));
    }

    currentAuthUser = newUser;
    localStorage.setItem('gin_current_user', JSON.stringify(newUser));
    if (currentUserListener) currentUserListener(newUser);
    return newUser;
  },
  signIn: async (form: any) => {
    // If real Firebase configured, run real login
    if (isFirebaseConfigured() && firebaseAuth && form.email !== 'test@test.com') {
      const cred = await signInWithEmailAndPassword(firebaseAuth, form.email, form.password);
      const users = mockDb.getData<any>('users');
      let user = users.find(u => u.uid === cred.user.uid || u.email === form.email);
      if (!user) {
        user = {
          uid: cred.user.uid,
          name: cred.user.displayName || 'Firebase User',
          email: form.email,
          phoneNumber: '',
          role: 'customer',
          status: 'active',
          createdAt: new Date().toISOString()
        };
        users.push(user);
        mockDb.saveData('users', users);

        const customers = mockDb.getData<any>('customers');
        if (!customers.find((c: any) => c.uid === user.uid)) {
          customers.push({
            uid: user.uid,
            name: user.name,
            email: user.email,
            phoneNumber: '',
            walletBalance: 200,
            rewardPoints: 50,
            createdAt: user.createdAt
          });
          mockDb.saveData('customers', customers);
        }
      }
      currentAuthUser = user;
      localStorage.setItem('gin_current_user', JSON.stringify(user));
      if (currentUserListener) currentUserListener(user);
      return user;
    }

    // Mock Mode login / test@test.com bypass login
    const users = mockDb.getData<any>('users');
    const user = users.find(u => u.email === form.email);
    if (!user) {
      throw new Error("No user found with this email. Please sign up.");
    }
    if (form.password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    if (form.email === 'test@test.com') {
      if (typeof window !== 'undefined') {
        const port = window.location.port;
        const host = window.location.hostname;
        if (port === '3001' || host.includes('seller')) {
          user.role = 'seller';
          user.shopId = 'shop_gupta';
        } else if (port === '3002' || host.includes('admin')) {
          user.role = 'admin';
        } else {
          user.role = 'customer';
        }
      }
    }

    currentAuthUser = user;
    localStorage.setItem('gin_current_user', JSON.stringify(user));
    if (currentUserListener) currentUserListener(user);
    return user;
  },
  signInWithGoogle: async (defaultRole: 'customer' | 'seller' | 'admin' = 'customer') => {
    if (isFirebaseConfigured() && firebaseAuth) {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      const fbUser = result.user;
      
      const users = mockDb.getData<any>('users');
      let localUser = users.find(u => u.email === fbUser.email);
      
      const finalRole = fbUser.email === 'akshat.srivastava098@gmail.com' ? 'admin' : defaultRole;
      
      if (!localUser) {
        localUser = {
          uid: fbUser.uid,
          name: fbUser.displayName || 'Google User',
          email: fbUser.email || '',
          phoneNumber: fbUser.phoneNumber || '',
          role: finalRole,
          status: 'active',
          createdAt: new Date().toISOString()
        };
        users.push(localUser);
        mockDb.saveData('users', users);

        if (finalRole === 'seller') {
          const sellers = mockDb.getData<any>('sellers');
          if (!sellers.find((s: any) => s.uid === fbUser.uid)) {
            sellers.push({
              uid: fbUser.uid,
              name: localUser.name,
              email: localUser.email,
              phoneNumber: localUser.phoneNumber || '+919999911111',
              status: 'pending',
              createdAt: localUser.createdAt
            });
            mockDb.saveData('sellers', sellers);
          }
        } else {
          const wallets = JSON.parse(localStorage.getItem('gin_wallet') || '{}');
          if (!wallets[fbUser.uid]) {
            wallets[fbUser.uid] = [
              { id: 'tx_init', amount: 500, type: 'credit', description: 'Google Signup Bonus', createdAt: new Date().toISOString() }
            ];
            localStorage.setItem('gin_wallet', JSON.stringify(wallets));
          }

          const customers = mockDb.getData<any>('customers');
          if (!customers.find((c: any) => c.uid === fbUser.uid)) {
            customers.push({
              uid: fbUser.uid,
              name: localUser.name,
              email: localUser.email,
              phoneNumber: localUser.phoneNumber || '+919999911111',
              walletBalance: 500,
              rewardPoints: 50,
              createdAt: localUser.createdAt
            });
            mockDb.saveData('customers', customers);
          }
        }
      } else {
        if (fbUser.email === 'akshat.srivastava098@gmail.com' && localUser.role !== 'admin') {
          localUser.role = 'admin';
          mockDb.saveData('users', users);
        }
      }
      currentAuthUser = localUser;
      localStorage.setItem('gin_current_user', JSON.stringify(localUser));
      if (currentUserListener) currentUserListener(localUser);
      return localUser;
    } else {
      // Mock Google Popup Simulator
      let mockEmail = '';
      let mockName = '';
      let finalRole: 'customer' | 'seller' | 'admin' = defaultRole;

      if (defaultRole === 'admin') {
        mockEmail = 'akshat.srivastava098@gmail.com';
        mockName = 'Akshat Srivastava';
        finalRole = 'admin';
      } else if (defaultRole === 'seller') {
        mockEmail = 'seller_test@buyqk.com';
        mockName = 'Test Seller';
      } else {
        mockEmail = 'customer_test@buyqk.com';
        mockName = 'Test Customer';
      }
      
      const users = mockDb.getData<any>('users');
      let localUser = users.find(u => u.email === mockEmail);
      if (!localUser) {
        localUser = {
          uid: 'u_google_' + finalRole + '_' + Math.random().toString(36).substr(2, 5),
          name: mockName,
          email: mockEmail,
          phoneNumber: '+919999911111',
          role: finalRole,
          status: 'active',
          createdAt: new Date().toISOString()
        };
        users.push(localUser);
        mockDb.saveData('users', users);

        if (finalRole === 'seller') {
          const sellers = mockDb.getData<any>('sellers');
          sellers.push({
            uid: localUser.uid,
            name: localUser.name,
            email: localUser.email,
            phoneNumber: localUser.phoneNumber,
            status: 'pending',
            createdAt: localUser.createdAt
          });
          mockDb.saveData('sellers', sellers);
        } else if (finalRole === 'customer') {
          const wallets = JSON.parse(localStorage.getItem('gin_wallet') || '{}');
          wallets[localUser.uid] = [
            { id: 'tx_init', amount: 500, type: 'credit', description: 'Google Signin Bonus', createdAt: new Date().toISOString() }
          ];
          localStorage.setItem('gin_wallet', JSON.stringify(wallets));

          const customers = mockDb.getData<any>('customers');
          customers.push({
            uid: localUser.uid,
            name: localUser.name,
            email: localUser.email,
            phoneNumber: localUser.phoneNumber,
            walletBalance: 500,
            rewardPoints: 50,
            createdAt: localUser.createdAt
          });
          mockDb.saveData('customers', customers);
        }
      } else {
        if (finalRole === 'admin') {
          localUser.role = 'admin';
          mockDb.saveData('users', users);
        }
      }

      const wallets = JSON.parse(localStorage.getItem('gin_wallet') || '{}');
      if (!wallets[localUser.uid]) {
        wallets[localUser.uid] = [
          { id: 'tx_init', amount: 500, type: 'credit', description: 'Google Simulator Signin', createdAt: new Date().toISOString() }
        ];
        localStorage.setItem('gin_wallet', JSON.stringify(wallets));
      }

      currentAuthUser = localUser;
      localStorage.setItem('gin_current_user', JSON.stringify(localUser));
      if (currentUserListener) currentUserListener(localUser);
      return localUser;
    }
  },
  signOut: async () => {
    if (isFirebaseConfigured() && firebaseAuth) {
      await firebaseSignOut(firebaseAuth);
    }
    currentAuthUser = null;
    localStorage.removeItem('gin_current_user');
    if (currentUserListener) currentUserListener(null);
  }
};

// ==========================================
// GEOLOCATION HELPERS
// ==========================================

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Number(d.toFixed(2));
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// ==========================================
// SHOP OPERATIONS
// ==========================================

export const shopService = {
  createShop: async (sellerId: string, data: any) => {
    const shops = mockDb.getData<Shop>('shops');
    const newShop: Shop = {
      id: 'shop_' + Math.random().toString(36).substr(2, 9),
      sellerId,
      name: data.shopName,
      description: data.description,
      logoBase64: data.logoBase64,
      bannerBase64: data.bannerBase64,
      address: {
        street: data.street,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        formattedAddress: `${data.street}, ${data.city}, ${data.state} - ${data.postalCode}`,
        location: { latitude: data.latitude, longitude: data.longitude }
      },
      location: { latitude: data.latitude, longitude: data.longitude },
      deliveryRadiusKm: data.deliveryRadiusKm,
      openingTime: data.openingTime,
      closingTime: data.closingTime,
      status: 'pending', // Awaiting Admin Approval
      isActive: true,
      categories: data.categories,
      createdAt: new Date().toISOString()
    };
    shops.push(newShop);
    mockDb.saveData('shops', shops);

    // Update seller status and link shopId
    const sellers = mockDb.getData<any>('sellers');
    const sellerIdx = sellers.findIndex(s => s.uid === sellerId);
    if (sellerIdx !== -1) {
      sellers[sellerIdx].shopId = newShop.id;
      sellers[sellerIdx].status = 'pending';
      sellers[sellerIdx].pan = data.pan;
      sellers[sellerIdx].gst = data.gst;
      mockDb.saveData('sellers', sellers);
    } else {
      sellers.push({
        uid: sellerId,
        name: currentAuthUser?.name || 'Onboarded Seller',
        email: currentAuthUser?.email || '',
        phoneNumber: currentAuthUser?.phoneNumber || '',
        shopId: newShop.id,
        status: 'pending',
        pan: data.pan,
        gst: data.gst,
        createdAt: new Date().toISOString()
      });
      mockDb.saveData('sellers', sellers);
    }

    // Update session current user with linked shop info
    const sessionUser = { ...currentAuthUser, shopId: newShop.id };
    currentAuthUser = sessionUser;
    localStorage.setItem('gin_current_user', JSON.stringify(sessionUser));
    if (currentUserListener) currentUserListener(sessionUser);

    return newShop;
  },

  getShops: (): Shop[] => {
    return mockDb.getData<Shop>('shops');
  },

  subscribeToShops: (callback: (shops: Shop[]) => void) => {
    return mockDb.subscribe('shops', callback);
  },

  getShopById: (id: string): Shop | undefined => {
    return mockDb.getData<Shop>('shops').find(s => s.id === id);
  },

  getNearbyShops: (lat: number, lng: number): (Shop & { distanceKm: number })[] => {
    const shops = mockDb.getData<Shop>('shops').filter(s => s.status === 'approved' && s.isActive);
    const listed = shops.map(s => {
      const dist = calculateDistance(lat, lng, s.location.latitude, s.location.longitude);
      return { ...s, distanceKm: dist };
    });
    
    const withinRadius = listed.filter(s => s.distanceKm <= s.deliveryRadiusKm);
    if (withinRadius.length > 0) {
      return withinRadius.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    // Teleportation/bypass fallback: If testing from another city, display the shops but simulate their distance
    return listed
      .map(s => ({ 
        ...s, 
        distanceKm: Number(Math.min(s.distanceKm, s.deliveryRadiusKm - 0.5).toFixed(2)) 
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  },

  approveShop: async (shopId: string) => {
    const shops = mockDb.getData<Shop>('shops');
    const shopIdx = shops.findIndex(s => s.id === shopId);
    if (shopIdx !== -1) {
      shops[shopIdx].status = 'approved';
      mockDb.saveData('shops', shops);

      // Approve associated seller
      const sellers = mockDb.getData<any>('sellers');
      const sellerIdx = sellers.findIndex(s => s.uid === shops[shopIdx].sellerId);
      if (sellerIdx !== -1) {
        sellers[sellerIdx].status = 'approved';
        mockDb.saveData('sellers', sellers);
      }
    }
  },

  rejectShop: async (shopId: string) => {
    const shops = mockDb.getData<Shop>('shops');
    const shopIdx = shops.findIndex(s => s.id === shopId);
    if (shopIdx !== -1) {
      shops[shopIdx].status = 'suspended';
      mockDb.saveData('shops', shops);

      // Reject associated seller
      const sellers = mockDb.getData<any>('sellers');
      const sellerIdx = sellers.findIndex(s => s.uid === shops[shopIdx].sellerId);
      if (sellerIdx !== -1) {
        sellers[sellerIdx].status = 'rejected';
        mockDb.saveData('sellers', sellers);
      }
    }
  }
};

// ==========================================
// PRODUCT & CATALOG SERVICES
// ==========================================

export const productService = {
  createProduct: async (data: any): Promise<Product> => {
    const products = mockDb.getData<Product>('products');
    const newProduct: Product = {
      id: 'prod_' + Math.random().toString(36).substr(2, 9),
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      brandId: data.brandId,
      imageBase64: data.imageBase64,
      imageTextDescription: `Descriptive tag of ${data.name}`,
      isApproved: true, // Auto-approve for swift prototyping
      createdAt: new Date().toISOString()
    };
    products.push(newProduct);
    mockDb.saveData('products', products);
    return newProduct;
  },

  getProducts: (): Product[] => {
    return mockDb.getData<Product>('products');
  },

  subscribeToProducts: (callback: (prods: Product[]) => void) => {
    return mockDb.subscribe('products', callback);
  },

  getCategories: (): Category[] => {
    return mockDb.getData<Category>('categories');
  },

  getBrands: (): Brand[] => {
    return mockDb.getData<Brand>('brands');
  }
};

// ==========================================
// INVENTORY SERVICES
// ==========================================

export const inventoryService = {
  updateInventory: async (shopId: string, productId: string, stock: number, price: number) => {
    const inventory = mockDb.getData<InventoryItem>('inventory');
    const id = `${shopId}_${productId}`;
    const idx = inventory.findIndex(item => item.id === id);

    if (idx !== -1) {
      inventory[idx].stock = stock;
      inventory[idx].price = price;
      inventory[idx].isAvailable = stock > 0;
      inventory[idx].updatedAt = new Date().toISOString();
    } else {
      inventory.push({
        id,
        shopId,
        productId,
        stock,
        price,
        isAvailable: stock > 0,
        updatedAt: new Date().toISOString()
      });
    }
    mockDb.saveData('inventory', inventory);
  },

  getInventoryByShop: (shopId: string): (InventoryItem & { product?: Product })[] => {
    const inventory = mockDb.getData<InventoryItem>('inventory').filter(item => item.shopId === shopId);
    const products = mockDb.getData<Product>('products');
    return inventory.map(item => ({
      ...item,
      product: products.find(p => p.id === item.productId)
    }));
  },

  subscribeToInventory: (callback: (inv: InventoryItem[]) => void) => {
    return mockDb.subscribe('inventory', callback);
  },

  getNearbyInventory: (lat: number, lng: number): (InventoryItem & { product: Product; shop: Shop; distanceKm: number })[] => {
    const nearbyShops = shopService.getNearbyShops(lat, lng);
    const inventory = mockDb.getData<InventoryItem>('inventory').filter(i => i.stock > 0 && i.isAvailable);
    const products = mockDb.getData<Product>('products').filter(p => p.isApproved);

    const results: any[] = [];
    nearbyShops.forEach(shop => {
      const shopInv = inventory.filter(i => i.shopId === shop.id);
      shopInv.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          results.push({
            ...item,
            product: prod,
            shop: shop,
            distanceKm: shop.distanceKm
          });
        }
      });
    });

    return results;
  }
};

// ==========================================
// ORDER SYSTEM & SPLIT CHECKOUT
// ==========================================

export const orderService = {
  checkoutCart: async (
    customerId: string,
    customerName: string,
    customerPhone: string,
    items: any[], // Array of CartItem containing quantity, product details, shopId, etc.
    deliveryAddress: Address,
    paymentMethod: PaymentMethod
  ): Promise<string> => {
    const settings = mockDb.getData<PlatformSettings>('settings')[0] || DEFAULT_PLATFORM_SETTINGS;
    
    // Group products by shopId
    const itemsByShop: { [shopId: string]: any[] } = {};
    items.forEach(item => {
      if (!itemsByShop[item.shopId]) itemsByShop[item.shopId] = [];
      itemsByShop[item.shopId].push(item);
    });

    const parentOrderId = 'group_' + Math.random().toString(36).substr(2, 9);
    const subOrderIds: string[] = [];

    const orders = mockDb.getData<Order>('orders');
    const shops = mockDb.getData<Shop>('shops');

    // Deduct Wallet funds if payment method is wallet
    let walletDeducted = false;
    const totalOrderCost = items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const finalBill = totalOrderCost + settings.platformFee + (items.length * settings.baseDeliveryCharge); // Estimate total

    if (paymentMethod === 'wallet') {
      const customers = mockDb.getData<any>('customers');
      const custIdx = customers.findIndex(c => c.uid === customerId);
      if (custIdx !== -1) {
        const profile = customers[custIdx];
        if (profile.walletBalance < finalBill) {
          throw new Error("Insufficient wallet balance. Recharge your wallet or choose cash on delivery.");
        }
        profile.walletBalance = Number((profile.walletBalance - finalBill).toFixed(2));
        mockDb.saveData('customers', customers);

        // Record Transaction
        const wallets = JSON.parse(localStorage.getItem('gin_wallet') || '{}');
        if (!wallets[customerId]) wallets[customerId] = [];
        wallets[customerId].push({
          id: 'tx_' + Math.random().toString(36).substr(2, 9),
          amount: finalBill,
          type: 'debit',
          description: `Order Checkout (Ref: ${parentOrderId})`,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('gin_wallet', JSON.stringify(wallets));
        walletDeducted = true;
      }
    }

    // Split orders and write to database
    Object.keys(itemsByShop).forEach(shopId => {
      const shopItems = itemsByShop[shopId];
      const shopInfo = shops.find(s => s.id === shopId);
      const shopName = shopInfo ? shopInfo.name : 'Local Shop';

      const subtotal = shopItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
      const deliveryCharge = subtotal >= settings.freeDeliveryThreshold ? 0 : settings.baseDeliveryCharge;
      const tax = Number((subtotal * 0.05).toFixed(2)); // 5% flat VAT
      const orderTotal = subtotal + deliveryCharge + settings.platformFee + tax;

      const subOrderId = 'ord_' + Math.random().toString(36).substr(2, 9);
      subOrderIds.push(subOrderId);

      const newOrder: Order = {
        id: subOrderId,
        parentOrderId,
        customerId,
        customerName,
        customerPhone,
        shopId,
        shopName,
        items: shopItems.map(item => ({
          productId: item.productId,
          name: item.product.name,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal,
        deliveryCharge,
        platformFee: settings.platformFee,
        tax,
        total: Number(orderTotal.toFixed(2)),
        paymentMethod,
        paymentStatus: walletDeducted ? 'paid' : 'pending',
        orderStatus: 'placed',
        deliveryAddress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      orders.push(newOrder);

      // Decrement inventory stock
      const inventory = mockDb.getData<InventoryItem>('inventory');
      shopItems.forEach(item => {
        const invId = `${shopId}_${item.productId}`;
        const invIdx = inventory.findIndex(i => i.id === invId);
        if (invIdx !== -1) {
          inventory[invIdx].stock = Math.max(0, inventory[invIdx].stock - item.quantity);
          inventory[invIdx].isAvailable = inventory[invIdx].stock > 0;
        }
      });
      mockDb.saveData('inventory', inventory);
    });

    mockDb.saveData('orders', orders);

    // Save Order Group parent record
    const orderGroups = mockDb.getData<OrderGroup>('order_groups');
    orderGroups.push({
      id: parentOrderId,
      customerId,
      customerName,
      subOrders: subOrderIds,
      totalAmount: finalBill,
      paymentMethod,
      paymentStatus: walletDeducted ? 'paid' : 'pending',
      createdAt: new Date().toISOString()
    });
    mockDb.saveData('order_groups', orderGroups);

    return parentOrderId;
  },

  getOrdersForCustomer: (customerId: string): Order[] => {
    return mockDb.getData<Order>('orders')
      .filter(o => o.customerId === customerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getOrdersForSeller: (shopId: string): Order[] => {
    return mockDb.getData<Order>('orders')
      .filter(o => o.shopId === shopId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  subscribeToOrders: (callback: (orders: Order[]) => void) => {
    return mockDb.subscribe('orders', callback);
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus) => {
    const orders = mockDb.getData<Order>('orders');
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      orders[idx].orderStatus = status;
      orders[idx].updatedAt = new Date().toISOString();
      mockDb.saveData('orders', orders);
    }
  },

  updateOrderPaymentStatus: async (orderId: string, status: PaymentStatus) => {
    const orders = mockDb.getData<Order>('orders');
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      orders[idx].paymentStatus = status;
      orders[idx].updatedAt = new Date().toISOString();
      mockDb.saveData('orders', orders);
    }
  }
};

// ==========================================
// WALLET SERVICES
// ==========================================

export const walletService = {
  getWalletBalance: (customerId: string): number => {
    const customers = mockDb.getData<any>('customers');
    const cust = customers.find(c => c.uid === customerId);
    return cust ? cust.walletBalance : 0;
  },

  getWalletTransactions: (customerId: string): WalletTransaction[] => {
    const wallets = JSON.parse(localStorage.getItem('gin_wallet') || '{}');
    return wallets[customerId] || [];
  },

  addFunds: async (customerId: string, amount: number) => {
    const customers = mockDb.getData<any>('customers');
    const idx = customers.findIndex(c => c.uid === customerId);
    if (idx === -1) {
      throw new Error(`Customer profile not found for ID: ${customerId}`);
    }
    customers[idx].walletBalance = Number((customers[idx].walletBalance + amount).toFixed(2));
    mockDb.saveData('customers', customers);

    const wallets = JSON.parse(localStorage.getItem('gin_wallet') || '{}');
    if (!wallets[customerId]) wallets[customerId] = [];
    wallets[customerId].push({
      id: 'tx_fund_' + Math.random().toString(36).substr(2, 9),
      amount,
      type: 'credit',
      description: 'Wallet Refill (Online Deposit)',
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('gin_wallet', JSON.stringify(wallets));
  },

  subscribeToWallet: (customerId: string, callback: (balance: number) => void) => {
    return mockDb.subscribe('customers', (customers: any[]) => {
      const cust = customers.find(c => c.uid === customerId);
      callback(cust ? cust.walletBalance : 0);
    });
  }
};

// ==========================================
// ADMIN METADATA SETTINGS
// ==========================================

export const adminService = {
  getPlatformSettings: (): PlatformSettings => {
    const settings = mockDb.getData<PlatformSettings>('settings');
    return settings[0] || DEFAULT_PLATFORM_SETTINGS;
  },

  updatePlatformSettings: async (settings: PlatformSettings) => {
    mockDb.saveData('settings', [settings]);
  },

  createCity: async (name: string, state: string, country: string) => {
    const cities = mockDb.getData<City>('cities');
    const newCity: City = {
      id: 'city_' + Math.random().toString(36).substr(2, 9),
      name,
      state,
      country,
      active: true
    };
    cities.push(newCity);
    mockDb.saveData('cities', cities);
  },

  createArea: async (name: string, cityId: string) => {
    const areas = mockDb.getData<Area>('areas');
    const newArea: Area = {
      id: 'area_' + Math.random().toString(36).substr(2, 9),
      name,
      cityId,
      active: true
    };
    areas.push(newArea);
    mockDb.saveData('areas', areas);
  },

  createZone: async (name: string, areaId: string, cityId: string, coordinates: LatLng[]) => {
    const zones = mockDb.getData<Zone>('zones');
    const newZone: Zone = {
      id: 'zone_' + Math.random().toString(36).substr(2, 9),
      name,
      areaId,
      cityId,
      coordinates,
      active: true
    };
    zones.push(newZone);
    mockDb.saveData('zones', zones);
  },

  getUsers: (): any[] => {
    return mockDb.getData<any>('users');
  },

  subscribeToUsers: (callback: (users: any[]) => void) => {
    return mockDb.subscribe('users', callback);
  }
};

const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  commissionPercent: 10,
  baseDeliveryCharge: 30,
  deliveryChargePerKm: 10,
  platformFee: 5,
  freeDeliveryThreshold: 499
};

// ==========================================
// GEMINI AI RAG SHOPPING ASSISTANT
// ==========================================

export const geminiService = {
  askGeminiAssistant: async (query: string, customerLocation: LatLng): Promise<{ answer: string; products: any[] }> => {
    // 1. Fetch available products nearby
    const nearbyInventory = inventoryService.getNearbyInventory(customerLocation.latitude, customerLocation.longitude);

    // Prepare catalog context for AI prompt
    const productsContext = nearbyInventory.map(item => {
      return `Product ID: ${item.product.id}, Name: ${item.product.name}, Shop: ${item.shop.name}, Price: INR ${item.price}, Stock: ${item.stock}, Distance: ${item.distanceKm} km, Delivery Time: ${Math.round(item.distanceKm * 5 + 10)} mins`;
    }).join('\n');

    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;

    if (apiKey && apiKey !== 'placeholder') {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `You are the buyQk AI Shopping Assistant. A local commerce expert.
You must help the customer find products matching their natural query based ONLY on the following nearby inventory list. Do not recommend products that are not on this list.

Nearby Inventory:
${productsContext || 'No items available nearby.'}

Customer Query: "${query}"

Instructions:
1. Suggest matching items.
2. Group suggestions if needed, highlighting Shop Name, Price, and Delivery speed.
3. Compare options (e.g. cheapest vs fastest delivery).
4. Be concise, polite, and helpful in professional formatting.
5. In your answer, refer to product IDs inside double brackets like [[prod_xxx]] so the frontend can parse and show add-to-cart buttons for those products! For example: "You can buy [[prod_123]] from Shop A for ₹150."
`
                }]
              }]
            })
          }
        );

        if (!response.ok) throw new Error("Gemini request failed");
        
        const resData = await response.json();
        const text = resData?.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, but I encountered an error searching for products.";

        // Match product IDs to render interactive cards
        const matchedProducts: any[] = [];
        const regex = /\[\[(prod_\w+)\]\]/g;
        let match;
        const seenIds = new Set<string>();
        while ((match = regex.exec(text)) !== null) {
          const pid = match[1];
          if (!seenIds.has(pid)) {
            seenIds.add(pid);
            const found = nearbyInventory.find(i => i.product.id === pid);
            if (found) matchedProducts.push(found);
          }
        }

        return {
          answer: text.replace(/\[\[(prod_\w+)\]\]/g, '$1'),
          products: matchedProducts
        };

      } catch (err) {
        console.error("Gemini API Error, falling back to local engine:", err);
      }
    }

    // LOCAL EMBEDDED AI ENGINE (Smart backup rule-based engine)
    const normalizedQuery = query.toLowerCase();
    let reply = "";
    const matchedProducts: any[] = [];

    // Simple keyword extraction for matching
    const matchingInventory = nearbyInventory.filter(item => {
      const name = item.product.name.toLowerCase();
      const desc = item.product.description.toLowerCase();
      const cat = item.product.categoryId.toLowerCase();
      return normalizedQuery.split(' ').some(word => 
        word.length > 2 && (name.includes(word) || desc.includes(word) || cat.includes(word))
      );
    });

    if (matchingInventory.length > 0) {
      reply = `Hi! I found ${matchingInventory.length} item(s) nearby that match your request for "${query}":\n\n`;
      matchingInventory.forEach((item, index) => {
        reply += `${index + 1}. **${item.product.name}** at *${item.shop.name}*\n`;
        reply += `   • Price: ₹${item.price} | Stock: ${item.stock} units\n`;
        reply += `   • Delivery: ~${Math.round(item.distanceKm * 5 + 10)} mins (${item.distanceKm} km away)\n\n`;
        matchedProducts.push(item);
      });
      reply += "You can add these items to your cart directly from the recommendations below!";
    } else {
      reply = `I searched your surrounding dark stores but couldn't find any exact stock matching "${query}". Here are the currently available products in your area: \n\n`;
      const slice = nearbyInventory.slice(0, 3);
      if (slice.length > 0) {
        slice.forEach((item, idx) => {
          reply += `• **${item.product.name}** from *${item.shop.name}* (₹${item.price})\n`;
          matchedProducts.push(item);
        });
        reply += "\nTry asking for one of these, or adjust your shopping preferences!";
      } else {
        reply += "Currently, there are no active shops open or stocked within your delivery coordinates. Check back soon!";
      }
    }

    return {
      answer: reply,
      products: matchedProducts
    };
  }
};
