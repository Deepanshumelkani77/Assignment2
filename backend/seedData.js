const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const MONGODB_URI = "mongodb+srv://deepumelkani123_db_user:IXTsOS2IZeLGDVzE@cluster0.azmpnf4.mongodb.net/?appName=Cluster0" ;

const seedUsers = [
  {
    name: 'Admin User',
    email: 'hire-me@anshumat.org ',
    password: 'HireMe@2025!',
    role: 'admin'
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      // Remove deprecated options
      // useNewUrlParser and useUnifiedTopology are no longer needed in the latest version
    });
    console.log('Connected to MongoDB');

    // Delete existing users (optional)
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Hash passwords and create users
    const createdUsers = await Promise.all(
      seedUsers.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 12);
        const newUser = new User({
          ...user,
          password: hashedPassword
        });
        return newUser.save();
      })
    );

    console.log('Seeded users:', createdUsers.map(u => ({ email: u.email, role: u.role })));
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeder
seedDatabase();
