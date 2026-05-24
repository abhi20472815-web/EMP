const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ems');
    console.log('MongoDB Connected');

    const subs = await User.find({ manager: '6a1086bcff6463f0fb116747' });
    console.log('Employees reporting to Bruce Wayne:', subs.length);
    subs.forEach(s => {
      console.log(`${s.name} (${s.email}), shift:`, JSON.stringify(s.shift));
    });

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
};

check();
