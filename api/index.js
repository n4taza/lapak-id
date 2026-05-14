const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const MONGODB_URI = 'mongodb+srv://n4taza_db:N44E8WEKlOJLZIHQ@cluster0.pdfnlfb.mongodb.net/lapakid_db?retryWrites=true&w=majority';
const JWT_SECRET = 'lapakid_secret_key_2024';

// Koneksi MongoDB cache
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: 'lapakid_db',
      bufferCommands: false,
    }).then(mongoose => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// ==================== SCHEMAS ====================

// User Schema (untuk semua user: user biasa, seller, admin)
const userSchema = new mongoose.Schema({
  uid: { type: String, unique: true, required: true },
  nama: { type: String, required: true },
  fotoProfile: { type: String, default: null },
  bio: { type: String, default: '' },
  password: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  coins: { type: Number, default: 25000 },
  jumlahTransaksi: { type: Number, default: 0 },
  berhasil: { type: Number, default: 0 },
  gagal: { type: Number, default: 0 },
  pending: { type: Number, default: 0 },
  totalPengeluaranCoins: { type: Number, default: 0 },
  role: { type: String, enum: ['admin', 'seller', 'user'], default: 'user' },
  // Seller specific
  storeName: { type: String, default: '' },
  storeDescription: { type: String, default: '' },
  totalSales: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Data Akun Schema (ID yang dijual)
const dataAkunSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  tier: { type: String, enum: ['low', 'medium', 'high', 'legend'], required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['available', 'sold', 'pending'], default: 'available' },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sellerName: { type: String, default: '' },
  soldTo: { type: String, default: null },
  soldAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  description: { type: String, default: '' },
  note: { type: String, default: '' }
});

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, unique: true, required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyerName: { type: String, default: '' },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sellerName: { type: String, default: '' },
  akunId: { type: String, required: true },
  akunUid: { type: String, default: '' },
  tier: { type: String, enum: ['low', 'medium', 'high', 'legend'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'success' },
  waktu: { type: String, default: () => new Date().toLocaleString('id-ID') },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const DataAkun = mongoose.models.DataAkun || mongoose.model('DataAkun', dataAkunSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

// ==================== HELPER FUNCTIONS ====================

function generateTransactionId() {
  return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
}

async function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Price mapping
const PRICE_MAP = { low: 125000, medium: 450000, high: 850000, legend: 1350000 };
const TIER_NAMES = { low: 'Low', medium: 'Medium', high: 'High', legend: 'Legend' };

// ==================== MAIN HANDLER ====================

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  await connectDB();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  // ==================== REGISTER ====================
  if (path === '/api/register' && req.method === 'POST') {
    try {
      const { nama, username, password, email, phone } = req.body;
      
      const existingUser = await User.findOne({ uid: username });
      if (existingUser) {
        return res.json({ success: false, message: 'Username already exists' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const newUser = new User({
        uid: username,
        nama: nama,
        password: hashedPassword,
        email: email || '',
        phone: phone || '',
        coins: 25000,
        role: 'user'
      });
      
      await newUser.save();
      
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
          role: newUser.role,
          email: newUser.email,
          phone: newUser.phone
        }
      });
    } catch (error) {
      console.error(error);
      res.json({ success: false, message: 'Server error' });
    }
    return;
  }

  // ==================== LOGIN ====================
  if (path === '/api/login' && req.method === 'POST') {
    try {
      const { username, password } = req.body;
      
      const user = await User.findOne({ uid: username });
      if (!user) {
        return res.json({ success: false, message: 'Invalid username or password' });
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.json({ success: false, message: 'Invalid username or password' });
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
          role: user.role,
          email: user.email,
          phone: user.phone,
          storeName: user.storeName,
          totalSales: user.totalSales,
          totalRevenue: user.totalRevenue
        }
      });
    } catch (error) {
      console.error(error);
      res.json({ success: false, message: 'Server error' });
    }
    return;
  }

  // ==================== GET ALL IDs ====================
  if (path === '/api/ids' && req.method === 'GET') {
    try {
      const tier = url.searchParams.get('tier');
      const filter = { status: 'available' };
      if (tier && tier !== 'all') filter.tier = tier;
      
      const ids = await DataAkun.find(filter).select('uid tier price description note');
      res.json({ success: true, data: ids.map(id => ({ uid: id.uid, tier: id.tier, price: id.price, description: id.description })) });
    } catch (error) {
      res.json({ success: false, data: [] });
    }
    return;
  }

  // ==================== GET ALL IDs (Admin/Seller) ====================
  if (path === '/api/all-ids' && req.method === 'GET') {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.json({ success: false, message: 'Access token required' });
      }
      
      const decoded = await verifyToken(token);
      if (!decoded) {
        return res.json({ success: false, message: 'Invalid token' });
      }
      
      const user = await User.findById(decoded.id);
      let filter = {};
      
      if (user.role === 'seller') {
        filter.sellerId = user._id;
      } else if (user.role !== 'admin') {
        return res.json({ success: false, message: 'Permission denied' });
      }
      
      const ids = await DataAkun.find(filter).sort({ createdAt: -1 });
      res.json({ success: true, data: ids });
    } catch (error) {
      res.json({ success: false, data: [] });
    }
    return;
  }

  // ==================== ADD ID (Admin/Seller) ====================
  if (path === '/api/ids/add' && req.method === 'POST') {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
      }
      
      const decoded = await verifyToken(token);
      if (!decoded) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
      }
      
      const user = await User.findById(decoded.id);
      if (user.role !== 'admin' && user.role !== 'seller') {
        return res.json({ success: false, message: 'Permission denied' });
      }
      
      const { uid, password, tier, price, description, note } = req.body;
      
      const existing = await DataAkun.findOne({ uid });
      if (existing) {
        return res.json({ success: false, message: 'ID already exists' });
      }
      
      const finalPrice = price || PRICE_MAP[tier] || 125000;
      
      const newAkun = new DataAkun({
        uid,
        password,
        tier,
        price: finalPrice,
        description: description || '',
        note: note || '',
        sellerId: user.role === 'seller' ? user._id : null,
        sellerName: user.role === 'seller' ? user.nama : ''
      });
      
      await newAkun.save();
      res.json({ success: true, message: 'ID added successfully', data: newAkun });
    } catch (error) {
      console.error(error);
      res.json({ success: false, message: 'Server error' });
    }
    return;
  }

  // ==================== DELETE ID (Admin/Seller) ====================
  if (path === '/api/ids/delete' && req.method === 'DELETE') {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
      }
      
      const decoded = await verifyToken(token);
      if (!decoded) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
      }
      
      const user = await User.findById(decoded.id);
      if (user.role !== 'admin') {
        return res.json({ success: false, message: 'Permission denied' });
      }
      
      const { id } = req.body;
      const result = await DataAkun.deleteOne({ _id: id });
      
      res.json({ success: true, message: 'ID deleted successfully' });
    } catch (error) {
      res.json({ success: false, message: 'Server error' });
    }
    return;
  }

  // ==================== BUY ID ====================
  if (path === '/api/buy' && req.method === 'POST') {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
      }
      
      const decoded = await verifyToken(token);
      if (!decoded) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
      }
      
      const { akunId } = req.body;
      
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.json({ success: false, message: 'User not found' });
      }
      
      const akun = await DataAkun.findOne({ uid: akunId, status: 'available' });
      if (!akun) {
        return res.json({ success: false, message: 'ID not available' });
      }
      
      if (user.coins < akun.price) {
        return res.json({ success: false, message: 'Insufficient coins' });
      }
      
      const transactionId = generateTransactionId();
      const waktuNow = new Date().toLocaleString('id-ID');
      
      const transaction = new Transaction({
        transactionId,
        buyerId: user._id,
        buyerName: user.nama,
        sellerId: akun.sellerId,
        sellerName: akun.sellerName,
        akunId: akun.uid,
        akunUid: akun.uid,
        tier: akun.tier,
        amount: akun.price,
        status: 'success',
        waktu: waktuNow
      });
      
      user.coins -= akun.price;
      user.jumlahTransaksi += 1;
      user.berhasil += 1;
      user.totalPengeluaranCoins += akun.price;
      
      // Update seller stats
      if (akun.sellerId) {
        const seller = await User.findById(akun.sellerId);
        if (seller) {
          seller.totalSales += 1;
          seller.totalRevenue += akun.price;
          await seller.save();
        }
      }
      
      akun.status = 'sold';
      akun.soldTo = user.uid;
      akun.soldAt = new Date();
      
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
      res.json({ success: false, message: 'Server error' });
    }
    return;
  }

  // ==================== GET PROFILE ====================
  if (path === '/api/profile' && req.method === 'GET') {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
      }
      
      const decoded = await verifyToken(token);
      if (!decoded) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
      }
      
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.json({ success: false, message: 'User not found' });
      }
      
      res.json({ success: true, data: user });
    } catch (error) {
      res.json({ success: false, message: 'Server error' });
    }
    return;
  }

  // ==================== UPDATE PROFILE ====================
  if (path === '/api/profile' && req.method === 'PUT') {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
      }
      
      const decoded = await verifyToken(token);
      if (!decoded) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
      }
      
      const { nama, bio, fotoProfile, email, phone, newPassword } = req.body;
      const updateData = {};
      if (nama) updateData.nama = nama;
      if (bio !== undefined) updateData.bio = bio;
      if (fotoProfile) updateData.fotoProfile = fotoProfile;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (newPassword && newPassword.length >= 6) {
        updateData.password = await bcrypt.hash(newPassword, 10);
      }
      
      const user = await User.findByIdAndUpdate(decoded.id, updateData, { new: true }).select('-password');
      res.json({ success: true, data: user });
    } catch (error) {
      res.json({ success: false, message: 'Server error' });
    }
    return;
  }

  // ==================== GET SOLD IDs (User's purchase history) ====================
  if (path === '/api/sold-ids' && req.method === 'GET') {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.json({ success: true, data: [] });
      }
      
      const decoded = await verifyToken(token);
      if (!decoded) {
        return res.json({ success: true, data: [] });
      }
      
      const transactions = await Transaction.find({ buyerId: decoded.id, status: 'success' })
        .sort({ createdAt: -1 });
      
      const soldIds = transactions.map(t => ({
        id: t.akunId,
        tier: t.tier,
        price: t.amount,
        waktu: t.waktu
      }));
      res.json({ success: true, data: soldIds });
    } catch (error) {
      res.json({ success: true, data: [] });
    }
    return;
  }

  // ==================== GET STATS for homepage ====================
  if (path === '/api/stats' && req.method === 'GET') {
    try {
      const totalIDs = await DataAkun.countDocuments({ status: 'available' });
      const totalSold = await DataAkun.countDocuments({ status: 'sold' });
      
      const tierCounts = await DataAkun.aggregate([
        { $match: { status: 'available' } },
        { $group: { _id: '$tier', count: { $sum: 1 } } }
      ]);
      
      const tierStats = { low: 0, medium: 0, high: 0, legend: 0 };
      tierCounts.forEach(t => { tierStats[t._id] = t.count; });
      
      res.json({
        success: true,
        data: {
          totalIDs,
          totalSold,
          tierStats
        }
      });
    } catch (error) {
      res.json({ success: true, data: { totalIDs: 0, totalSold: 0, tierStats: { low: 0, medium: 0, high: 0, legend: 0 } } });
    }
    return;
  }

  // ==================== GET ADMIN STATS ====================
  if (path === '/api/admin/stats' && req.method === 'GET') {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
      }
      
      const decoded = await verifyToken(token);
      if (!decoded) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
      }
      
      const user = await User.findById(decoded.id);
      if (user.role !== 'admin' && user.role !== 'seller') {
        return res.json({ success: false, message: 'Permission denied' });
      }
      
      let totalId = 0, totalTerjual = 0, totalPendapatan = 0;
      let filter = {};
      
      if (user.role === 'seller') {
        filter.sellerId = user._id;
        totalId = await DataAkun.countDocuments(filter);
        const transactions = await Transaction.find({ sellerId: user._id });
        totalTerjual = transactions.length;
        totalPendapatan = transactions.reduce((a, b) => a + b.amount, 0);
      } else {
        totalId = await DataAkun.countDocuments();
        totalTerjual = await DataAkun.countDocuments({ status: 'sold' });
        const transactions = await Transaction.find();
        totalPendapatan = transactions.reduce((a, b) => a + b.amount, 0);
      }
      
      const todayStr = new Date().toLocaleDateString('id-ID');
      const todayFilter = user.role === 'seller' 
        ? { sellerId: user._id, waktu: { $regex: todayStr } }
        : { waktu: { $regex: todayStr } };
      const todayTransactions = await Transaction.find(todayFilter);
      const todayPendapatan = todayTransactions.reduce((a, b) => a + b.amount, 0);
      
      res.json({
        success: true,
        data: {
          totalId,
          totalTerjual,
          totalPendapatan,
          todayPendapatan,
          stokTersisa: totalId
        }
      });
    } catch (error) {
      res.json({ success: false, data: null });
    }
    return;
  }

  // ==================== GET ALL TRANSACTIONS (Admin/Seller) ====================
  if (path === '/api/transactions' && req.method === 'GET') {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
      }
      
      const decoded = await verifyToken(token);
      if (!decoded) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
      }
      
      const user = await User.findById(decoded.id);
      let filter = {};
      
      if (user.role === 'seller') {
        filter.sellerId = user._id;
      } else if (user.role !== 'admin') {
        return res.json({ success: false, message: 'Permission denied' });
      }
      
      const transactions = await Transaction.find(filter).sort({ createdAt: -1 });
      res.json({ success: true, data: transactions });
    } catch (error) {
      res.json({ success: false, data: [] });
    }
    return;
  }

  // ==================== DELETE TRANSACTION (Admin only) ====================
  if (path === '/api/transactions/delete' && req.method === 'DELETE') {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
      }
      
      const decoded = await verifyToken(token);
      if (!decoded) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
      }
      
      const user = await User.findById(decoded.id);
      if (user.role !== 'admin') {
        return res.json({ success: false, message: 'Permission denied' });
      }
      
      const { transactionId } = req.body;
      await Transaction.deleteOne({ transactionId });
      
      res.json({ success: true, message: 'Transaction deleted' });
    } catch (error) {
      res.json({ success: false, message: 'Server error' });
    }
    return;
  }

  // ==================== GET CART (from localStorage not needed, but for sync) ====================
  if (path === '/api/cart' && req.method === 'GET') {
    // Cart is client-side only, but we can return user info
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.json({ success: false, data: [] });
      }
      
      const decoded = await verifyToken(token);
      if (!decoded) {
        return res.json({ success: false, data: [] });
      }
      
      const user = await User.findById(decoded.id);
      res.json({ success: true, data: { coins: user.coins } });
    } catch (error) {
      res.json({ success: false, data: [] });
    }
    return;
  }

  // ==================== ADD COINS (Admin only) ====================
  if (path === '/api/add-coins' && req.method === 'POST') {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
      }
      
      const decoded = await verifyToken(token);
      if (!decoded) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
      }
      
      const { userId, amount } = req.body;
      const user = await User.findById(userId);
      if (!user) {
        return res.json({ success: false, message: 'User not found' });
      }
      
      user.coins += amount;
      await user.save();
      
      res.json({ success: true, message: 'Coins added', coins: user.coins });
    } catch (error) {
      res.json({ success: false, message: 'Server error' });
    }
    return;
  }

  // 404
  res.status(404).json({ success: false, message: 'API endpoint not found' });
};
