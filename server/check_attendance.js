const mongoose = require('mongoose');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const dotenv = require('dotenv');

dotenv.config();

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ems');
    console.log('MongoDB Connected');

    const records = await Attendance.find({}).populate('employee', 'name email');
    console.log('Total attendance records:', records.length);
    records.forEach((rec, idx) => {
      console.log(`\nRecord #${idx + 1}:`);
      console.log('ID:', rec._id);
      console.log('Employee:', rec.employee ? `${rec.employee.name} (${rec.employee.email})` : 'NULL');
      console.log('Date:', rec.date);
      console.log('Check-In:', rec.checkIn, typeof rec.checkIn);
      console.log('Check-Out:', rec.checkOut, typeof rec.checkOut);
      console.log('Status:', rec.status);
      console.log('Late Minutes:', rec.lateMinutes);
      console.log('Overtime Hours:', rec.overtimeHours);
    });

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
};

check();
