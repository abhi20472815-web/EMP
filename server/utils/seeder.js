const User = require('../models/User');
const Leave = require('../models/Leave');
const Performance = require('../models/Performance');
const Notice = require('../models/Notice');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    // Check if users already exist
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already has data. Skipping seeder...');
      return;
    }

    console.log('Starting Database Seeding...');

    // Clear existing data (just in case)
    await User.deleteMany();
    await Leave.deleteMany();
    await Performance.deleteMany();
    await Notice.deleteMany();

    // 1. Create Admins, Managers, and Employees
    console.log('Seeding Users...');
    
    // Admin
    const admin = await User.create({
      name: 'Tommy Shelby',
      email: 'tommy@ems.com',
      password: 'tommy123',
      role: 'admin',
      department: 'HR',
      designation: 'VP of People',
      salary: 120000,
      phone: '+91 98765 43210',
      address: 'Shelby Parlour, Birmingham',
      emergencyContact: {
        name: 'Arthur Shelby',
        relation: 'Brother',
        phone: '+91 99999 88888',
      },
    });

    // Manager (Engineering)
    const engManager = await User.create({
      name: 'Marcus Aurelius',
      email: 'manager@ems.com',
      password: 'manager123',
      role: 'manager',
      department: 'Engineering',
      designation: 'Engineering Director',
      salary: 110000,
      phone: '+91 98210 54321',
      address: 'Roman Forum, House 4, Rome',
      emergencyContact: {
        name: 'Faustina',
        relation: 'Spouse',
        phone: '+91 99999 77777',
      },
      manager: admin._id,
    });

    // Manager (Marketing)
    const mktManager = await User.create({
      name: 'Cleopatra Philopator',
      email: 'cleo@ems.com',
      password: 'manager123',
      role: 'manager',
      department: 'Marketing',
      designation: 'Marketing Director',
      salary: 95000,
      phone: '+91 91234 56789',
      address: 'Alexandria Palace, Alexandria',
      emergencyContact: {
        name: 'Mark Antony',
        relation: 'Partner',
        phone: '+91 99999 66666',
      },
      manager: admin._id,
    });

    // Employee 1 (reports to Marcus)
    const emp1 = await User.create({
      name: 'Jane Doe',
      email: 'jane@ems.com',
      password: 'employee123',
      role: 'employee',
      department: 'Engineering',
      designation: 'Senior Frontend Architect',
      salary: 85000,
      phone: '+91 94821 07711',
      address: '101 Baker Street, London',
      emergencyContact: {
        name: 'Robert Doe',
        relation: 'Father',
        phone: '+91 99999 55555',
      },
      manager: engManager._id,
    });

    // Employee 2 (reports to Marcus)
    const emp2 = await User.create({
      name: 'John Smith',
      email: 'john@ems.com',
      password: 'employee123',
      role: 'employee',
      department: 'Engineering',
      designation: 'Backend Developer',
      salary: 75000,
      phone: '+91 93456 12345',
      address: '221B Baker Street, London',
      emergencyContact: {
        name: 'Mary Smith',
        relation: 'Mother',
        phone: '+91 99999 44444',
      },
      manager: engManager._id,
    });

    // Employee 3 (reports to Cleopatra)
    const emp3 = await User.create({
      name: 'Ada Lovelace',
      email: 'ada@ems.com',
      password: 'employee123',
      role: 'employee',
      department: 'Marketing',
      designation: 'SEO Specialist',
      salary: 72000,
      phone: '+91 95882 23344',
      address: 'Analytical Engine Road, Cambridge',
      emergencyContact: {
        name: 'William King',
        relation: 'Spouse',
        phone: '+91 99999 33333',
      },
      manager: mktManager._id,
    });

    console.log('Seeding Notices...');
    // 2. Create Notices
    await Notice.create([
      {
        title: 'Welcome to the New EMS Portal!',
        content: 'We are thrilled to launch our new glassmorphism Employee Management System. Please update your profile information, phone numbers, and emergency contact configurations as soon as possible.',
        authorId: admin._id,
        targetRoles: 'All',
      },
      {
        title: 'Quarterly Team Building Event',
        content: 'Our Engineering and Product teams are holding a virtual social mixer next Thursday at 5:00 PM. Get ready for games, prizes, and custom refreshments delivered to your door!',
        authorId: engManager._id,
        targetRoles: 'All',
      },
      {
        title: 'Manager Performance Calibrations',
        content: 'Reminder to all Directors and Managers: Please complete the periodic reviews for your direct reports by the end of this month. We want to align before our salary budget assessments.',
        authorId: admin._id,
        targetRoles: 'Manager',
      },
    ]);

    console.log('Seeding Leave Requests...');
    // 3. Create Leave Requests
    // Approved leave
    await Leave.create({
      employeeId: emp1._id,
      type: 'Annual',
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      status: 'Approved',
      reason: 'Family summer vacation trip to the countryside.',
      approvedBy: engManager._id,
      comment: 'Approved. Enjoy your vacation!',
    });

    // Rejected leave
    await Leave.create({
      employeeId: emp2._id,
      type: 'Casual',
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'Rejected',
      reason: 'Going to watch a football match.',
      approvedBy: engManager._id,
      comment: 'Rejected due to close delivery deadline on the backend microservice.',
    });

    // Pending leaves
    await Leave.create({
      employeeId: emp1._id,
      type: 'Sick',
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      status: 'Pending',
      reason: 'Medical wisdom teeth extraction checkup and recovery.',
    });

    await Leave.create({
      employeeId: emp3._id,
      type: 'Casual',
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'Pending',
      reason: 'Attending a close cousin wedding ceremony out of state.',
    });

    console.log('Seeding Performance Reviews...');
    // 4. Create Performance Reviews
    await Performance.create([
      {
        employeeId: emp1._id,
        reviewerId: engManager._id,
        reviewPeriod: 'Q1 2026',
        ratings: {
          qualityOfWork: 5,
          communication: 4,
          teamwork: 5,
          dependability: 5,
        },
        feedback: {
          strengths: 'Exceptional architectural designs. Jane spearheaded our visual dashboard framework upgrade successfully with outstanding responsiveness.',
          growthAreas: 'Can increase communication channels across non-technical marketing managers to align expectations earlier.',
        },
      },
      {
        employeeId: emp2._id,
        reviewerId: engManager._id,
        reviewPeriod: 'Q1 2026',
        ratings: {
          qualityOfWork: 4,
          communication: 3,
          teamwork: 4,
          dependability: 4,
        },
        feedback: {
          strengths: 'Strong backend logic design. John optimized MongoDB aggregations which reduced payload loading times by 35%.',
          growthAreas: 'Should focus on documentation detailing API models and endpoint responses.',
        },
      },
    ]);

    console.log('Database Seeding Completed Successfully!');
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
  }
};

module.exports = seedData;
