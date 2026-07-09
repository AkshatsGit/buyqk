import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  SafeAreaView, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { 
  auth, 
  shopService, 
  productService, 
  inventoryService, 
  orderService 
} from '@buyqk/firebase';
import { Shop, Product, InventoryItem, Order, LatLng } from '@buyqk/types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(auth.getCurrentUser());
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'orders' | 'inventory'>('dashboard');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Seller states
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [myShop, setMyShop] = useState<Shop | null>(null);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [myInventory, setMyInventory] = useState<(InventoryItem & { product?: Product })[]>([]);
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Shop Onboarding form state
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [pan, setPan] = useState('');
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('22:00');

  useEffect(() => {
    const unsubUser = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        loadSellerData(user.uid, user.shopId);
      }
    });

    const unsubShops = shopService.subscribeToShops(() => {
      if (currentUser) {
        loadSellerData(currentUser.uid, currentUser.shopId);
      }
    });

    const unsubOrders = orderService.subscribeToOrders(() => {
      if (myShop) {
        setMyOrders(orderService.getOrdersForSeller(myShop.id));
      }
    });

    return () => {
      unsubUser();
      unsubShops();
      unsubOrders();
    };
  }, [currentUser?.uid, myShop?.id]);

  const loadSellerData = (uid: string, shopId?: string) => {
    const sellers = JSON.parse(localStorage.getItem('gin_sellers') || '[]');
    const profile = sellers.find((s: any) => s.uid === uid);
    setSellerProfile(profile);

    const shops = shopService.getShops();
    const shop = shops.find(s => s.sellerId === uid || s.id === shopId);
    if (shop) {
      setMyShop(shop);
      setMyOrders(orderService.getOrdersForSeller(shop.id));
      setMyInventory(inventoryService.getInventoryByShop(shop.id));
    }
  };

  const handleAuth = async () => {
    try {
      if (authMode === 'login') {
        const u = await auth.signIn({ email, password });
        Alert.alert("Success", `Logged in as Merchant ${u.name}`);
      } else {
        const u = await auth.signUp({ name, email, phoneNumber: phone, role: 'seller', password });
        Alert.alert("Success", `Merchant registered. Submit onboarding.`);
      }
      setEmail('');
      setPassword('');
      setName('');
      setPhone('');
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleOnboarding = async () => {
    if (!shopName || !description || !street || !city || !state || !postalCode || !pan) {
      Alert.alert("Error", "Please fill in all store metadata fields.");
      return;
    }
    try {
      // Mock images
      const mockLogo = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23FFC107%22/><text y=%22.9em%22 font-size=%2290%22>🏪</text></svg>";
      const mockBanner = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23081C3A%22/><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>";
      
      await shopService.createShop(currentUser.uid, {
        shopName,
        description,
        street,
        city,
        state,
        postalCode,
        latitude: 19.1136,
        longitude: 72.8258,
        deliveryRadiusKm: 5,
        openingTime,
        closingTime,
        pan,
        categories: ['cat_groceries'],
        logoBase64: mockLogo,
        bannerBase64: mockBanner
      });

      Alert.alert("Success", "Shop registered! Submitting to Admin Review.");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, nextStatus: any) => {
    try {
      await orderService.updateOrderStatus(orderId, nextStatus);
      Alert.alert("Success", `Fulfillment status: ${nextStatus.toUpperCase()}`);
      setMyOrders(orderService.getOrdersForSeller(myShop!.id));
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleReplenishStock = async (productId: string, newStock: number, price: number) => {
    try {
      await inventoryService.updateInventory(myShop!.id, productId, newStock, price);
      Alert.alert("Success", "Inventory quantities updated.");
      setMyInventory(inventoryService.getInventoryByShop(myShop!.id));
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleSignOut = () => {
    auth.signOut();
    setCurrentUser(null);
    setMyShop(null);
    setSellerProfile(null);
  };

  const todayRevenue = myOrders
    .filter(o => o.orderStatus !== 'cancelled' && o.paymentStatus === 'paid')
    .reduce((acc, curr) => acc + curr.subtotal, 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>⚡ buyQk Seller</Text>
          {myShop && <Text style={styles.headerSubtitle}>🏪 {myShop.name} ({myShop.status})</Text>}
        </View>
        {currentUser && (
          <TouchableOpacity onPress={handleSignOut} style={styles.logoutBtn}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>

      {currentUser ? (
        sellerProfile?.status === 'pending' && !myShop ? (
          /* ONBOARDING FORM SCREEN */
          <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 24 }}>
            <Text style={styles.formTitle}>Onboard Dark Store Node</Text>
            <TextInput placeholder="Shop Name" placeholderTextColor="#666" value={shopName} onChangeText={setShopName} style={styles.formInput} />
            <TextInput placeholder="Description" placeholderTextColor="#666" value={description} onChangeText={setDescription} style={styles.formInput} />
            <TextInput placeholder="Street Address" placeholderTextColor="#666" value={street} onChangeText={setStreet} style={styles.formInput} />
            <TextInput placeholder="City" placeholderTextColor="#666" value={city} onChangeText={setCity} style={styles.formInput} />
            <TextInput placeholder="State" placeholderTextColor="#666" value={state} onChangeText={setState} style={styles.formInput} />
            <TextInput placeholder="Postal Code" placeholderTextColor="#666" value={postalCode} onChangeText={setPostalCode} style={styles.formInput} />
            <TextInput placeholder="PAN Business ID" placeholderTextColor="#666" value={pan} onChangeText={setPan} style={styles.formInput} />
            
            <TouchableOpacity onPress={handleOnboarding} style={styles.submitBtn}>
              <Text style={styles.submitBtnText}>Submit Store Permit</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : sellerProfile?.status === 'pending' && myShop ? (
          /* WAITING APPROVAL SCREEN */
          <View style={styles.pendingContainer}>
            <ActivityIndicator size="large" color="#FFC107" />
            <Text style={styles.pendingText}>Store Permit Under Admin Review</Text>
            <Text style={styles.pendingSubtext}>Your geofence coordinates and credentials are undergoing audit controls.</Text>
          </View>
        ) : (
          /* MAIN HUB SCREEN */
          <View style={styles.main}>
            {activeScreen === 'dashboard' && (
              /* DASHBOARD SCREEN */
              <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16 }}>
                <Text style={styles.sectionTitle}>Dashboard KPIs</Text>
                
                <View style={styles.kpiRow}>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>Today's Earnings</Text>
                    <Text style={styles.kpiValue}>₹{todayRevenue}</Text>
                  </View>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>Order Count</Text>
                    <Text style={styles.kpiValue}>{myOrders.length}</Text>
                  </View>
                </View>

                {myShop && (
                  <View style={styles.detailsCard}>
                    <Text style={styles.detailsTitle}>Merchant Specifications</Text>
                    <Text style={styles.detailsText}>Radius: {myShop.deliveryRadiusKm} km</Text>
                    <Text style={styles.detailsText}>Timings: {myShop.openingTime} - {myShop.closingTime}</Text>
                    <Text style={styles.detailsText}>Status: {myShop.status.toUpperCase()}</Text>
                  </View>
                )}
              </ScrollView>
            )}

            {activeScreen === 'orders' && (
              /* DISPATCH ORDERS SCREEN */
              <ScrollView style={styles.scroll}>
                <Text style={styles.sectionTitle}>Fulfillment Inbox</Text>
                {myOrders.map(order => (
                  <View key={order.id} style={styles.orderCard}>
                    <Text style={styles.orderId}>ID: {order.id}</Text>
                    <Text style={styles.orderCust}>Client: {order.customerName}</Text>
                    <Text style={styles.orderTotal}>Subtotal: ₹{order.subtotal}</Text>
                    <Text style={styles.orderStatus}>Status: {order.orderStatus.toUpperCase()}</Text>
                    
                    <View style={styles.actionRow}>
                      {order.orderStatus === 'placed' && (
                        <TouchableOpacity onPress={() => handleUpdateOrderStatus(order.id, 'accepted')} style={styles.actionBtn}>
                          <Text style={styles.actionBtnText}>Accept</Text>
                        </TouchableOpacity>
                      )}
                      {order.orderStatus === 'accepted' && (
                        <TouchableOpacity onPress={() => handleUpdateOrderStatus(order.id, 'preparing')} style={styles.actionBtn}>
                          <Text style={styles.actionBtnText}>Prepare</Text>
                        </TouchableOpacity>
                      )}
                      {order.orderStatus === 'preparing' && (
                        <TouchableOpacity onPress={() => handleUpdateOrderStatus(order.id, 'dispatched')} style={styles.actionBtn}>
                          <Text style={styles.actionBtnText}>Dispatch</Text>
                        </TouchableOpacity>
                      )}
                      {order.orderStatus === 'dispatched' && (
                        <TouchableOpacity onPress={() => handleUpdateOrderStatus(order.id, 'delivered')} style={styles.actionBtn}>
                          <Text style={styles.actionBtnText}>Deliver</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            {activeScreen === 'inventory' && (
              /* INVENTORY EDIT SCREEN */
              <ScrollView style={styles.scroll}>
                <Text style={styles.sectionTitle}>Shelf Stock Management</Text>
                {myInventory.map(item => {
                  const p = item.product;
                  if (!p) return null;
                  return (
                    <View key={item.id} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{p.name}</Text>
                        <Text style={styles.itemStock}>Stock: {item.stock} units | Price: ₹{item.price}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleReplenishStock(p.id, item.stock + 10, item.price)} style={styles.addStockBtn}>
                        <Text style={styles.addStockText}>+10 Stock</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            {/* TABBAR NAVIGATION */}
            <View style={styles.tabbar}>
              <TouchableOpacity onPress={() => setActiveScreen('dashboard')} style={styles.tabItem}>
                <Text style={[styles.tabText, activeScreen === 'dashboard' && styles.tabTextActive]}>KPI Stats</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveScreen('orders')} style={styles.tabItem}>
                <Text style={[styles.tabText, activeScreen === 'orders' && styles.tabTextActive]}>Orders</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveScreen('inventory')} style={styles.tabItem}>
                <Text style={[styles.tabText, activeScreen === 'inventory' && styles.tabTextActive]}>Inventory</Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      ) : (
        /* MERCHANT AUTH SCREEN */
        <View style={styles.authContainer}>
          <Text style={styles.authTitle}>buyQk Merchant Node</Text>
          {authMode === 'signup' && (
            <>
              <TextInput placeholder="Merchant Full Name" placeholderTextColor="#666" value={name} onChangeText={setName} style={styles.authInput} />
              <TextInput placeholder="Phone Number" placeholderTextColor="#666" value={phone} onChangeText={setPhone} style={styles.authInput} />
            </>
          )}
          <TextInput placeholder="Email Address" placeholderTextColor="#666" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={styles.authInput} />
          <TextInput placeholder="Password" placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry style={styles.authInput} />
          
          <TouchableOpacity onPress={handleAuth} style={styles.authBtn}>
            <Text style={styles.authBtnText}>{authMode === 'login' ? 'Login' : 'Sign Up'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} style={{ marginTop: 20 }}>
            <Text style={styles.toggleText}>
              {authMode === 'login' ? "New merchant? Onboard here" : "Return to Log In"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030d1a'
  },
  header: {
    height: 70,
    backgroundColor: '#081C3A',
    borderBottomWidth: 1,
    borderBottomColor: '#102a43',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  headerSubtitle: {
    color: '#FFC107',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2
  },
  logoutBtn: {
    backgroundColor: '#102a43',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8
  },
  logoutBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  main: {
    flex: 1
  },
  scroll: {
    flex: 1
  },
  sectionTitle: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    padding: 16,
    paddingBottom: 8
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 10
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#081C3A50',
    borderColor: '#102a43',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center'
  },
  kpiLabel: {
    color: '#aaa',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  kpiValue: {
    color: '#FFC107',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 6
  },
  detailsCard: {
    backgroundColor: '#0b254520',
    borderColor: '#102a43',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginTop: 16
  },
  detailsTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 8
  },
  detailsText: {
    color: '#ccc',
    fontSize: 12,
    marginVertical: 2
  },
  orderCard: {
    backgroundColor: '#0b254530',
    borderColor: '#102a43',
    borderWidth: 1,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16
  },
  orderId: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  orderCust: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2
  },
  orderTotal: {
    color: '#FFC107',
    fontWeight: 'bold',
    marginTop: 4
  },
  orderStatus: {
    color: '#FFC107',
    fontWeight: 'bold',
    fontSize: 11,
    marginTop: 4
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10
  },
  actionBtn: {
    backgroundColor: '#FFC107',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8
  },
  actionBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12
  },
  itemRow: {
    backgroundColor: '#081C3A50',
    borderBottomWidth: 1,
    borderBottomColor: '#102a43',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'between'
  },
  itemName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  itemStock: {
    color: '#888',
    fontSize: 12,
    marginTop: 2
  },
  addStockBtn: {
    backgroundColor: '#102a43',
    borderColor: '#FFC107',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8
  },
  addStockText: {
    color: '#FFC107',
    fontWeight: 'bold',
    fontSize: 12
  },
  tabbar: {
    height: 60,
    backgroundColor: '#081C3A',
    borderTopWidth: 1,
    borderTopColor: '#102a43',
    flexDirection: 'row'
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  tabText: {
    color: '#666',
    fontSize: 11,
    fontWeight: 'bold'
  },
  tabTextActive: {
    color: '#FFC107'
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24
  },
  authTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    textTransform: 'uppercase',
    letterSpacing: 2
  },
  authInput: {
    backgroundColor: '#081C3A',
    borderColor: '#102a43',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    marginBottom: 12
  },
  authBtn: {
    backgroundColor: '#FFC107',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 10
  },
  authBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14
  },
  toggleText: {
    color: '#FFC107',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 'bold'
  },
  formTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textTransform: 'uppercase',
    textAlign: 'center'
  },
  formInput: {
    backgroundColor: '#081C3A',
    borderColor: '#102a43',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    marginBottom: 12
  },
  submitBtn: {
    backgroundColor: '#FFC107',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 10
  },
  submitBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14
  },
  pendingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  pendingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20
  },
  pendingSubtext: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6
  }
});
