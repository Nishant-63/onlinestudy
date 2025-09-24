const axios = require('axios');

const BACKEND_URL = 'https://onlinestudy-backend-4u8y.onrender.com/api';

// Demo accounts to create
const demoAccounts = [
  // Teachers
  {
    email: 'john.doe@onlinestudy.com',
    password: 'teacher123',
    firstName: 'John',
    lastName: 'Doe',
    role: 'teacher'
  },
  {
    email: 'sarah.smith@onlinestudy.com',
    password: 'teacher123',
    firstName: 'Sarah',
    lastName: 'Smith',
    role: 'teacher'
  },
  {
    email: 'mike.johnson@onlinestudy.com',
    password: 'teacher123',
    firstName: 'Mike',
    lastName: 'Johnson',
    role: 'teacher'
  },
  // Students
  {
    email: 'alice.student@onlinestudy.com',
    password: 'student123',
    firstName: 'Alice',
    lastName: 'Williams',
    role: 'student'
  },
  {
    email: 'bob.student@onlinestudy.com',
    password: 'student123',
    firstName: 'Bob',
    lastName: 'Brown',
    role: 'student'
  },
  {
    email: 'carol.student@onlinestudy.com',
    password: 'student123',
    firstName: 'Carol',
    lastName: 'Davis',
    role: 'student'
  },
  {
    email: 'david.student@onlinestudy.com',
    password: 'student123',
    firstName: 'David',
    lastName: 'Miller',
    role: 'student'
  },
  {
    email: 'emma.student@onlinestudy.com',
    password: 'student123',
    firstName: 'Emma',
    lastName: 'Wilson',
    role: 'student'
  },
  {
    email: 'frank.student@onlinestudy.com',
    password: 'student123',
    firstName: 'Frank',
    lastName: 'Moore',
    role: 'student'
  },
  {
    email: 'grace.student@onlinestudy.com',
    password: 'student123',
    firstName: 'Grace',
    lastName: 'Taylor',
    role: 'student'
  }
];

async function createDemoAccounts() {
  console.log('🚀 Creating demo accounts on deployed backend...');
  
  for (const account of demoAccounts) {
    try {
      console.log(`📝 Creating account: ${account.email}`);
      
      const response = await axios.post(`${BACKEND_URL}/auth/register`, account);
      
      if (response.data.message) {
        console.log(`✅ Success: ${account.email} - ${response.data.message}`);
      } else {
        console.log(`✅ Success: ${account.email} - Account created`);
      }
      
    } catch (error) {
      if (error.response?.data?.error?.includes('already exists')) {
        console.log(`⚠️  Account already exists: ${account.email}`);
      } else {
        console.error(`❌ Error creating ${account.email}:`, error.response?.data?.error || error.message);
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n🎉 Demo account creation completed!');
  console.log('\n📋 You can now login with these accounts:');
  console.log('\n👨‍🏫 TEACHERS:');
  console.log('  • john.doe@onlinestudy.com / teacher123');
  console.log('  • sarah.smith@onlinestudy.com / teacher123');
  console.log('  • mike.johnson@onlinestudy.com / teacher123');
  console.log('\n👨‍🎓 STUDENTS:');
  console.log('  • alice.student@onlinestudy.com / student123');
  console.log('  • bob.student@onlinestudy.com / student123');
  console.log('  • carol.student@onlinestudy.com / student123');
  console.log('  • david.student@onlinestudy.com / student123');
  console.log('  • emma.student@onlinestudy.com / student123');
  console.log('  • frank.student@onlinestudy.com / student123');
  console.log('  • grace.student@onlinestudy.com / student123');
}

createDemoAccounts().catch(console.error);
