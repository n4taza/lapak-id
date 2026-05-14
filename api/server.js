const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://n4taza_db:N44E8WEKlOJLZIHQ@cluster0.pdfnlfb.mongodb.net/?appName=Cluster0';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'lapakid_db'
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// ==================== SCHEMAS ====================

// User Schema (Akun Utama)
const userSchema = new mongoose.Schema({
  uid: { type: String, unique: true, required: true },
  nama: { type: String, required: true },
  fotoProfile: { type: String, default: null },
  bio: { type: String, default: '' },
  password: { type: String, required: true },
  coins: { type: Number, default: 0 },
  jumlahTransaksi: { type: Number, default: 0 },
  berhasil: { type: Number, default: 0 },
  gagal: { type: Number, default: 0 },
  pending: { type: Number, default: 0 },
  totalPengeluaranCoins: { type: Number, default: 0 },
  role: { type: String, enum: ['admin', 'seller', 'user'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Seller Schema (Khusus Akun Seller)
const sellerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  storeName: { type: String, required: true },
  storeDescription: { type: String, default: '' },
  storeLogo: { type: String, default: null },
  verified: { type: Boolean, default: false },
  totalSales: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  joinDate: { type: Date, default: Date.now }
});

// Data Akun Schema (UID dan Password untuk akun game)
const dataAkunSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  tier: { type: String, enum: ['low', 'medium', 'high', 'legend'], required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['available', 'sold', 'pending'], default: 'available' },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  soldTo: { type: String, default: null },
  soldAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  description: { type: String, default: '' }
});

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, unique: true, required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  akunId: { type: mongoose.Schema.Types.ObjectId, ref: 'DataAkun', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  paymentMethod: { type: String, default: 'coins' },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null }
});

// Models
const User = mongoose.model('User', userSchema);
const Seller = mongoose.model('Seller', sellerSchema);
const DataAkun = mongoose.model('DataAkun', dataAkunSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

// ==================== MIDDLEWARE ====================

const JWT_SECRET = 'lapakid_secret_key_2024';
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ==================== API ROUTES ====================

// Generate UID unik
function generateUID() {
  return 'UID_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

// REGISTER
app.post('/api/register', async (req, res) => {
  try {
    const { nama, username, password, emailPhone } = req.body;
    
    // Cek apakah username sudah ada
    const existingUser = await User.findOne({ uid: username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Buat user baru
    const newUser = new User({
      uid: username,
      nama: nama,
      password: hashedPassword,
      coins: 25000,
      role: 'user'
    });
    
    await newUser.save();
    
    // Generate JWT
    const token = jwt.sign(
      { id: newUser._id, uid: newUser.uid, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUser._id,
        uid: newUser.uid,
        nama: newUser.nama,
        coins: newUser.coins,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ uid: username });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
    
    const token = jwt.sign(
      { id: user._id, uid: user.uid, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        uid: user.uid,
        nama: user.nama,
        fotoProfile: user.fotoProfile,
        bio: user.bio,
        coins: user.coins,
        jumlahTransaksi: user.jumlahTransaksi,
        berhasil: user.berhasil,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET semua ID berdasarkan tier
app.get('/api/ids', async (req, res) => {
  try {
    const { tier } = req.query;
    const filter = { status: 'available' };
    if (tier) filter.tier = tier;
    
    const ids = await DataAkun.find(filter).select('uid tier price description');
    res.json({ success: true, data: ids.map(id => id.uid) });
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
});

// GET detail ID
app.get('/api/ids/:uid', async (req, res) => {
  try {
    const akun = await DataAkun.findOne({ uid: req.params.uid, status: 'available' });
    if (!akun) {
      return res.status(404).json({ success: false, message: 'ID not found' });
    }
    res.json({ success: true, data: akun });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// BUY ID (menggunakan coins)
app.post('/api/buy', authenticateToken, async (req, res) => {
  try {
    const { akunId } = req.body;
    
    // Cari user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Cari akun
    const akun = await DataAkun.findOne({ uid: akunId, status: 'available' });
    if (!akun) {
      return res.status(404).json({ success: false, message: 'ID not available' });
    }
    
    // Cek coins cukup
    if (user.coins < akun.price) {
      return res.status(400).json({ success: false, message: 'Insufficient coins' });
    }
    
    // Generate transaction ID
    const transactionId = 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    
    // Buat transaksi
    const transaction = new Transaction({
      transactionId,
      buyerId: user._id,
      sellerId: akun.sellerId,
      akunId: akun._id,
      amount: akun.price,
      status: 'success',
      completedAt: new Date()
    });
    
    // Update user coins dan statistik
    user.coins -= akun.price;
    user.jumlahTransaksi += 1;
    user.berhasil += 1;
    user.totalPengeluaranCoins += akun.price;
    
    // Update status akun
    akun.status = 'sold';
    akun.soldTo = user.uid;
    akun.soldAt = new Date();
    
    // Jika ada seller, update statistik seller
    if (akun.sellerId) {
      const seller = await Seller.findOne({ userId: akun.sellerId });
      if (seller) {
        seller.totalSales += 1;
        seller.totalRevenue += akun.price;
        await seller.save();
      }
    }
    
    await Promise.all([user.save(), akun.save(), transaction.save()]);
    
    res.json({
      success: true,
      message: 'Purchase successful',
      data: {
        uid: akun.uid,
        password: akun.password,
        price: akun.price,
        remainingCoins: user.coins
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Cek apakah user adalah seller
    const seller = await Seller.findOne({ userId: user._id });
    
    res.json({
      success: true,
      data: {
        ...user.toObject(),
        isSeller: !!seller,
        sellerData: seller || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET sold IDs (history)
app.get('/api/sold-ids', authenticateToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ buyerId: req.user.id, status: 'success' })
      .populate('akunId')
      .sort({ completedAt: -1 });
    
    const soldIds = transactions.map(t => t.akunId?.uid).filter(Boolean);
    res.json({ success: true, data: soldIds });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
});

// ADD new ID (untuk admin/seller)
app.post('/api/ids/add', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin' && user.role !== 'seller') {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }
    
    const { uid, password, tier, price, description } = req.body;
    
    // Cek apakah ID sudah ada
    const existing = await DataAkun.findOne({ uid });
    if (existing) {
      return res.status(400).json({ success: false, message: 'ID already exists' });
    }
    
    const newAkun = new DataAkun({
      uid,
      password,
      tier,
      price,
      description: description || '',
      sellerId: user.role === 'seller' ? user._id : null
    });
    
    await newAkun.save();
    res.json({ success: true, message: 'ID added successfully', data: newAkun });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET dashboard stats
app.get('/api/stats', async (req, res) => {
  try {
    const totalIDs = await DataAkun.countDocuments({ status: 'available' });
    const totalSold = await DataAkun.countDocuments({ status: 'sold' });
    const totalTransactions = await Transaction.countDocuments({ status: 'success' });
    const totalRevenue = await Transaction.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const tierCounts = await DataAkun.aggregate([
      { $match: { status: 'available' } },
      { $group: { _id: '$tier', count: { $sum: 1 } } }
    ]);
    
    const tierStats = {
      low: 0, medium: 0, high: 0, legend: 0
    };
    tierCounts.forEach(t => { tierStats[t._id] = t.count; });
    
    res.json({
      success: true,
      data: {
        totalIDs,
        totalSold,
        totalTransactions,
        totalRevenue: totalRevenue[0]?.total || 0,
        tierStats
      }
    });
  } catch (error) {
    res.json({ success: true, data: { totalIDs: 0, totalSold: 0, tierStats: { low: 0, medium: 0, high: 0, legend: 0 } } });
  }
});

// UPDATE profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { nama, bio, fotoProfile } = req.body;
    const updateData = {};
    if (nama) updateData.nama = nama;
    if (bio !== undefined) updateData.bio = bio;
    if (fotoProfile) updateData.fotoProfile = fotoProfile;
    updateData.updatedAt = new Date();
    
    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Serve HTML files
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
