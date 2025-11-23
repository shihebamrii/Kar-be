require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Service = require('../models/Service');

async function seed() {
  try {
    // Se connecter à MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Nettoyer la base de données (optionnel - décommentez si vous voulez nettoyer)
    // await User.deleteMany({});
    // await Vehicle.deleteMany({});
    // await Service.deleteMany({});
    // console.log('✅ Database cleaned');

    // Créer un utilisateur admin de test
    const existingAdmin = await User.findOne({ email: 'admin@karhabti.com' });
    
    let admin;
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists, using existing admin');
      admin = existingAdmin;
    } else {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      admin = new User({
        username: 'admin',
        email: 'admin@karhabti.com',
        password: hashedPassword,
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Admin user created');
    }

    // Créer un utilisateur de test
    const existingUser = await User.findOne({ email: 'test@karhabti.com' });
    
    let user;
    if (existingUser) {
      console.log('ℹ️  Test user already exists, using existing user');
      user = existingUser;
    } else {
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = new User({
        username: 'testuser',
        email: 'test@karhabti.com',
        password: hashedPassword
      });
      await user.save();
      console.log('✅ Test user created');
    }

    // Créer un véhicule de test
    let vehicle = await Vehicle.findOne({ 
      owner: user._id, 
      immatriculation: 'AB-123-CD' 
    });

    if (!vehicle) {
      vehicle = new Vehicle({
        owner: user._id,
        marque: 'Peugeot',
        modele: '208',
        annee: 2020,
        immatriculation: 'AB-123-CD'
      });
      await vehicle.save();
      console.log('✅ Test vehicle created');

      // Ajouter le véhicule à la liste des véhicules de l'utilisateur
      user.vehicles.push(vehicle._id);
      await user.save();
    } else {
      console.log('ℹ️  Test vehicle already exists, using existing vehicle');
    }

    // Créer des services de test
    const existingServices = await Service.find({ vehicle: vehicle._id });
    
    if (existingServices.length === 0) {
      const service1 = new Service({
        vehicle: vehicle._id,
        type: 'Vidange',
        date: new Date('2023-06-15'),
        kilometrage: 50000,
        notes: 'Vidange effectuée avec huile 5W-30'
      });
      await service1.save();

      const service2 = new Service({
        vehicle: vehicle._id,
        type: 'Freins',
        date: new Date('2023-09-20'),
        kilometrage: 60000,
        notes: 'Changement des plaquettes de frein avant'
      });
      await service2.save();

      // Ajouter les services au véhicule
      vehicle.services.push(service1._id);
      vehicle.services.push(service2._id);
      await vehicle.save();

      console.log('✅ Test services created');
    } else {
      console.log('ℹ️  Test services already exist');
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📝 Admin credentials:');
    console.log('   Email: admin@karhabti.com');
    console.log('   Password: admin123');
    console.log('   Role: admin');
    console.log('\n📝 Test user credentials:');
    console.log('   Email: test@karhabti.com');
    console.log('   Password: password123');
    console.log('   Role: user');
    console.log('\n🚗 Test vehicle:');
    console.log(`   Marque: ${vehicle.marque}`);
    console.log(`   Modèle: ${vehicle.modele}`);
    console.log(`   Immatriculation: ${vehicle.immatriculation}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();

