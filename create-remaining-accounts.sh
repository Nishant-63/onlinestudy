#!/bin/bash

echo "🚀 Creating remaining demo accounts..."

# Create remaining student accounts
echo "📝 Creating Bob Brown..."
curl -X POST https://onlinestudy-backend-4u8y.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "bob.student@onlinestudy.com", "password": "student123", "firstName": "Bob", "lastName": "Brown", "role": "student"}'

echo -e "\n📝 Creating Carol Davis..."
curl -X POST https://onlinestudy-backend-4u8y.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "carol.student@onlinestudy.com", "password": "student123", "firstName": "Carol", "lastName": "Davis", "role": "student"}'

echo -e "\n📝 Creating David Miller..."
curl -X POST https://onlinestudy-backend-4u8y.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "david.student@onlinestudy.com", "password": "student123", "firstName": "David", "lastName": "Miller", "role": "student"}'

echo -e "\n📝 Creating Emma Wilson..."
curl -X POST https://onlinestudy-backend-4u8y.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "emma.student@onlinestudy.com", "password": "student123", "firstName": "Emma", "lastName": "Wilson", "role": "student"}'

echo -e "\n📝 Creating Frank Moore..."
curl -X POST https://onlinestudy-backend-4u8y.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "frank.student@onlinestudy.com", "password": "student123", "firstName": "Frank", "lastName": "Moore", "role": "student"}'

echo -e "\n📝 Creating Grace Taylor..."
curl -X POST https://onlinestudy-backend-4u8y.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "grace.student@onlinestudy.com", "password": "student123", "firstName": "Grace", "lastName": "Taylor", "role": "student"}'

echo -e "\n🎉 All demo accounts created!"
echo -e "\n📋 You can now login with these accounts:"
echo -e "\n👨‍🏫 TEACHERS:"
echo -e "  • john.doe@onlinestudy.com / teacher123"
echo -e "  • sarah.smith@onlinestudy.com / teacher123"
echo -e "  • mike.johnson@onlinestudy.com / teacher123"
echo -e "\n👨‍🎓 STUDENTS:"
echo -e "  • alice.student@onlinestudy.com / student123"
echo -e "  • bob.student@onlinestudy.com / student123"
echo -e "  • carol.student@onlinestudy.com / student123"
echo -e "  • david.student@onlinestudy.com / student123"
echo -e "  • emma.student@onlinestudy.com / student123"
echo -e "  • frank.student@onlinestudy.com / student123"
echo -e "  • grace.student@onlinestudy.com / student123"
