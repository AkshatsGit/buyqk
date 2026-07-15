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
  orderService, 
  walletService, 
  geminiService,
  calculateDistance 
} from '@buyqk/firebase';
import { Shop, Product, InventoryItem, CartItem, Order, LatLng } from '@buyqk/types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(auth.getCurrentUser());
  const [activeScreen, setActiveScreen] = useState<'shops' | 'ai' | 'orders' | 'wallet'>('shops');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Address Location (Mumbai default coords)
  const [customerLocation, setCustomerLocation] = useState<LatLng>({ latitude: 19.1136, longitude: 72.8258 });
  const [addressString, setAddressString] = useState('Andheri West, Mumbai, MH');

  // DB Lists
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [shopInventory, setShopInventory] = useState<(InventoryItem & { product?: Product })[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // AI Assistant Chat State
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'assistant'; text: string }[]>([
    { sender: 'assistant', text: "Hello! I'm your mobile buyQk AI Shopping Assistant. Ask me anything about nearby store products!" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [walletBalance, setWalletBalance] = useState<number>(0);

  useEffect(() => {
    const unsubUser = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    const unsubShops = shopService.subscribeToShops((allShops) => {
      const nearby = shopService.getNearbyShops(customerLocation.latitude, customerLocation.longitude, allShops);
      setShops(nearby);
    });

    return () => {
      unsubUser();
      unsubShops();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      setWalletBalance(0);
      return;
    }

    const unsubOrders = orderService.subscribeToOrders(currentUser.uid, (allOrders) => {
      setOrders(allOrders);
    });

    const unsubWallet = walletService.subscribeToWallet(currentUser.uid, (balance) => {
      setWalletBalance(balance);
    });

    return () => {
      unsubOrders();
      unsubWallet();
    };
  }, [currentUser]);

  const handleAuth = async () => {
    try {
      if (authMode === 'login') {
        const u = await auth.signIn({ email, password });
        Alert.alert("Success", `Logged in as ${u.name}`);
      } else {
        const u = await auth.signUp({ name, email, phoneNumber: phone, role: 'customer', password });
        Alert.alert("Success", `Account created! ₹200 bonus loaded.`);
      }
      setEmail('');
      setPassword('');
      setName('');
      setPhone('');
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleSignOut = () => {
    auth.signOut();
    setCurrentUser(null);
    setCart([]);
  };

  const handleOpenShop = async (shop: Shop) => {
    setSelectedShop(shop);
    try {
      const inv = await inventoryService.getInventoryByShop(shop.id);
      setShopInventory(inv);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const addToCart = (product: Product, shop: Shop, price: number) => {
    if (!currentUser) {
      Alert.alert("Attention", "Please log in first.");
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
      setCart([...cart, {
        productId: product.id,
        product,
        shopId: shop.id,
        shopName: shop.name,
        quantity: 1,
        price
      }]);
    }
    Alert.alert("Cart", `${product.name} added to cart!`);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      await orderService.checkoutCart(
        currentUser.uid,
        currentUser.name,
        currentUser.phoneNumber,
        cart,
        {
          street: addressString,
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400053",
          formattedAddress: addressString,
          location: customerLocation
        },
        'wallet',
        shops
      );
      Alert.alert("Checkout Success", "Split orders placed via Wallet!");
      setCart([]);
      setActiveScreen('orders');
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleSendAiMessage = async () => {
    if (!chatInput.trim()) return;
    const q = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: q }]);
    setChatInput('');
    setIsAiLoading(true);

    try {
      const response = await geminiService.askGeminiAssistant(q, customerLocation);
      setChatMessages(prev => [...prev, { sender: 'assistant', text: response }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, { sender: 'assistant', text: "Failed to consult RAG indices." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* MOBILE HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>⚡ buyQk</Text>
          <Text style={styles.headerSubtitle}>📍 {addressString}</Text>
        </View>
        {currentUser && (
          <TouchableOpacity onPress={handleSignOut} style={styles.logoutBtn}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>

      {currentUser ? (
        <View style={styles.main}>
          {activeScreen === 'shops' && (
            selectedShop ? (
              /* SHOP CATALOG SCREEN */
              <View style={{ flex: 1 }}>
                <TouchableOpacity onPress={() => setSelectedShop(null)} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>← Back to Stores</Text>
                </TouchableOpacity>
                <ScrollView style={styles.scroll}>
                  <Image source={{ uri: selectedShop.bannerBase64 }} style={styles.shopBanner} />
                  <View style={styles.shopMetaContainer}>
                    <Text style={styles.shopNameText}>{selectedShop.name}</Text>
                    <Text style={styles.shopDescText}>{selectedShop.description}</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Product Shelf</Text>
                  {shopInventory.map(item => {
                    const p = item.product;
                    if (!p) return null;
                    return (
                      <View key={item.id} style={styles.itemRow}>
                        <Image source={{ uri: p.imageBase64 }} style={styles.itemImage} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.itemName}>{p.name}</Text>
                          <Text style={styles.itemPrice}>₹{item.price}</Text>
                        </View>
                        {item.stock > 0 ? (
                          <TouchableOpacity onPress={() => addToCart(p, selectedShop, item.price)} style={styles.addBtn}>
                            <Text style={styles.addBtnText}>Add</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={{ color: 'red', fontSize: 12 }}>Out of stock</Text>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            ) : (
              /* STORES LIST SCREEN */
              <ScrollView style={styles.scroll}>
                <Text style={styles.sectionTitle}>Nearby Dark Stores</Text>
                {shops.map(shop => {
                  const dist = (shop as any).distanceKm || 0;
                  return (
                    <TouchableOpacity key={shop.id} onPress={() => handleOpenShop(shop)} style={styles.shopCard}>
                      <Image source={{ uri: shop.logoBase64 }} style={styles.shopLogo} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.shopCardName}>{shop.name}</Text>
                        <Text style={styles.shopCardDesc}>{shop.description}</Text>
                        <Text style={styles.shopCardDist}>📍 {dist} km away • {Math.round(dist * 5 + 10)} mins</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )
          )}

          {activeScreen === 'ai' && (
            /* AI ASSISTANT CHAT SCREEN */
            <View style={{ flex: 1 }}>
              <ScrollView style={[styles.scroll, { padding: 12 }]}>
                {chatMessages.map((msg, idx) => (
                  <View key={idx} style={[styles.chatMsg, msg.sender === 'user' ? styles.chatMsgUser : styles.chatMsgAi]}>
                    <Text style={styles.chatMsgText}>{msg.text}</Text>
                  </View>
                ))}
                {isAiLoading && <ActivityIndicator color="#FFC107" style={{ marginVertical: 10 }} />}
              </ScrollView>
              <View style={styles.inputContainer}>
                <TextInput 
                  placeholder="Ask Gemini AI for ingredients..." 
                  placeholderTextColor="#666"
                  value={chatInput} 
                  onChangeText={setChatInput}
                  style={styles.textInput}
                />
                <TouchableOpacity onPress={handleSendAiMessage} style={styles.sendBtn}>
                  <Text style={styles.sendBtnText}>Ask</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {activeScreen === 'orders' && (
            /* ORDERS PROGRESS STEPPER */
            <ScrollView style={styles.scroll}>
              <Text style={styles.sectionTitle}>Order Tracking System</Text>
              {orders.map(order => (
                <View key={order.id} style={styles.orderCard}>
                  <Text style={styles.orderId}>ID: {order.id}</Text>
                  <Text style={styles.orderShop}>Shop: {order.shopName}</Text>
                  <Text style={styles.orderTotal}>Total: ₹{order.total}</Text>
                  <Text style={styles.orderStatus}>Status: {order.orderStatus.toUpperCase()}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {activeScreen === 'wallet' && (
            /* WALLET VIEW SCREEN */
            <View style={styles.walletContainer}>
              <Text style={styles.sectionTitle}>My Mobile Wallet</Text>
              <View style={styles.walletCard}>
                <Text style={styles.walletLabel}>Available Credits Balance</Text>
                <Text style={styles.walletBalance}>₹{walletBalance}</Text>
              </View>
              {cart.length > 0 && (
                <TouchableOpacity onPress={handleCheckout} style={styles.checkoutBtn}>
                  <Text style={styles.checkoutBtnText}>Checkout Cart (₹{cart.reduce((a,c) => a + (c.price*c.quantity), 0)})</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* TAB BAR NAVIGATION */}
          <View style={styles.tabbar}>
            <TouchableOpacity onPress={() => { setSelectedShop(null); setActiveScreen('shops'); }} style={styles.tabItem}>
              <Text style={[styles.tabText, activeScreen === 'shops' && styles.tabTextActive]}>Stores</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveScreen('ai')} style={styles.tabItem}>
              <Text style={[styles.tabText, activeScreen === 'ai' && styles.tabTextActive]}>AI Assistant</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveScreen('orders')} style={styles.tabItem}>
              <Text style={[styles.tabText, activeScreen === 'orders' && styles.tabTextActive]}>Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveScreen('wallet')} style={styles.tabItem}>
              <Text style={[styles.tabText, activeScreen === 'wallet' && styles.tabTextActive]}>Wallet {cart.length > 0 ? `(${cart.length})` : ''}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* MOBILE AUTH SCREEN */
        <View style={styles.authContainer}>
          <Text style={styles.authTitle}>buyQk Client Node</Text>
          {authMode === 'signup' && (
            <>
              <TextInput placeholder="Full Name" placeholderTextColor="#666" value={name} onChangeText={setName} style={styles.authInput} />
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
              {authMode === 'login' ? "Don't have an account? Sign Up" : "Have an account? Log In"}
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
    fontSize: 10,
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
  shopCard: {
    backgroundColor: '#0b254530',
    borderColor: '#102a43',
    borderWidth: 1,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  shopLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#000'
  },
  shopCardName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  shopCardDesc: {
    color: '#888',
    fontSize: 11,
    marginTop: 2
  },
  shopCardDist: {
    color: '#FFC107',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4
  },
  backBtn: {
    backgroundColor: '#102a43',
    padding: 12,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  backBtnText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  shopBanner: {
    height: 150,
    width: '100%'
  },
  shopMetaContainer: {
    padding: 16
  },
  shopNameText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold'
  },
  shopDescText: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4
  },
  itemRow: {
    backgroundColor: '#081C3A50',
    borderBottomWidth: 1,
    borderBottomColor: '#102a43',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#000'
  },
  itemName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  itemPrice: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2
  },
  addBtn: {
    backgroundColor: '#FFC107',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8
  },
  addBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12
  },
  chatMsg: {
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
    maxWidth: '85%'
  },
  chatMsgUser: {
    backgroundColor: '#102a43',
    alignSelf: 'flex-end',
    borderTopRightRadius: 0
  },
  chatMsgAi: {
    backgroundColor: '#081C3A',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0
  },
  chatMsgText: {
    color: '#fff',
    fontSize: 13
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#102a43',
    backgroundColor: '#030d1a'
  },
  textInput: {
    flex: 1,
    backgroundColor: '#081C3A',
    borderColor: '#102a43',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    color: '#fff',
    height: 44
  },
  sendBtn: {
    backgroundColor: '#FFC107',
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    borderRadius: 12,
    marginLeft: 8
  },
  sendBtnText: {
    color: '#000',
    fontWeight: 'bold'
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
  orderShop: {
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
    color: '#00FF66',
    fontWeight: 'bold',
    fontSize: 11,
    marginTop: 4
  },
  walletContainer: {
    flex: 1,
    padding: 16
  },
  walletCard: {
    backgroundColor: '#081C3A',
    borderColor: '#102a43',
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginVertical: 10
  },
  walletLabel: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: 'bold'
  },
  walletBalance: {
    color: '#00FF66',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8
  },
  checkoutBtn: {
    backgroundColor: '#FFC107',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20
  },
  checkoutBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14
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
  }
});
