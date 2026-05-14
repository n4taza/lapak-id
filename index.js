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

const userSchema = new mongoose.Schema({
  uid: { type: String, unique: true, required: true },
  nama: { type: String, required: true },
  fotoProfile: { type: String, default: null },
  bio: { type: String, default: '' },
  password: { type: String, required: true },
  coins: { type: Number, default: 25000 },
  jumlahTransaksi: { type: Number, default: 0 },
  berhasil: { type: Number, default: 0 },
  gagal: { type: Number, default: 0 },
  pending: { type: Number, default: 0 },
  totalPengeluaranCoins: { type: Number, default: 0 },
  role: { type: String, enum: ['admin', 'seller', 'user'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

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

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, unique: true, required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  akunId: { type: mongoose.Schema.Types.ObjectId, ref: 'DataAkun', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const DataAkun = mongoose.models.DataAkun || mongoose.model('DataAkun', dataAkunSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

// ==================== HELPER FUNCTIONS ====================

function generateTransactionId() {
  return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

async function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

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
      const { nama, username, password, emailPhone } = req.body;
      
      const existingUser = await User.findOne({ uid: username });
      if (existingUser) {
        return res.json({ success: false, message: 'Username already exists' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const newUser = new User({
        uid: username,
        nama: nama,
        password: hashedPassword,
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
          role: newUser.role
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
          role: user.role
        }
      });
    } catch (error) {
      console.error(error);
      res.json({ success: false, message: 'Server error' });
    }
    return;
  }

  // ==================== GET IDs ====================
  if (path === '/api/ids' && req.method === 'GET') {
    try {
      const tier = url.searchParams.get('tier');
      const filter = { status: 'available' };
      if (tier) filter.tier = tier;
      
      const ids = await DataAkun.find(filter).select('uid tier price description');
      res.json({ success: true, data: ids.map(id => id.uid) });
    } catch (error) {
      res.json({ success: false, data: [] });
    }
    return;
  }

  // ==================== GET DETAIL ID ====================
  if (path.startsWith('/api/ids/') && req.method === 'GET') {
    try {
      const uid = path.split('/').pop();
      const akun = await DataAkun.findOne({ uid, status: 'available' });
      if (!akun) {
        return res.json({ success: false, message: 'ID not found' });
      }
      res.json({ success: true, data: akun });
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
      
      const transaction = new Transaction({
        transactionId,
        buyerId: user._id,
        sellerId: akun.sellerId,
        akunId: akun._id,
        amount: akun.price,
        status: 'success',
        completedAt: new Date()
      });
      
      user.coins -= akun.price;
      user.jumlahTransaksi += 1;
      user.berhasil += 1;
      user.totalPengeluaranCoins += akun.price;
      
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

  // ==================== GET SOLD IDs ====================
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
        .populate('akunId')
        .sort({ completedAt: -1 });
      
      const soldIds = transactions.map(t => t.akunId?.uid).filter(Boolean);
      res.json({ success: true, data: soldIds });
    } catch (error) {
      res.json({ success: true, data: [] });
    }
    return;
  }

  // ==================== GET STATS ====================
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
      
      const { uid, password, tier, price, description } = req.body;
      
      const existing = await DataAkun.findOne({ uid });
      if (existing) {
        return res.json({ success: false, message: 'ID already exists' });
      }
      
      const newAkun = new DataAkun({
        uid,
        password,
        tier,
        price: parseInt(price),
        description: description || '',
        sellerId: user.role === 'seller' ? user._id : null
      });
      
      await newAkun.save();
      res.json({ success: true, message: 'ID added successfully', data: newAkun });
    } catch (error) {
      console.error(error);
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
      
      const { nama, bio, fotoProfile } = req.body;
      const updateData = {};
      if (nama) updateData.nama = nama;
      if (bio !== undefined) updateData.bio = bio;
      if (fotoProfile) updateData.fotoProfile = fotoProfile;
      
      const user = await User.findByIdAndUpdate(decoded.id, updateData, { new: true }).select('-password');
      res.json({ success: true, data: user });
    } catch (error) {
      res.json({ success: false, message: 'Server error' });
    }
    return;
  }

  // 404
  res.status(404).json({ success: false, message: 'API endpoint not found' });
};
