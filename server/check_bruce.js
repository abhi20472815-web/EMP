const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ems');
    console.log('MongoDB Connected');

    const users = await User.find({ name: /Bruce/i });
    console.log('Bruce users found:', users.length);
    users.forEach(user => {
      console.log(JSON.stringify(user, null, 2));
    });

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
};

check();
