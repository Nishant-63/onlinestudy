#!/bin/bash

echo "🔓 Approving all student accounts..."

# Approve Alice Williams
echo "📝 Approving Alice Williams..."
curl -X PATCH https://onlinestudy-backend-4u8y.onrender.com/api/users/04b7dc88-b66b-44b6-ad25-0782853852ed/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVmM2RlMmQ3LWFlOGItNDFhMi05OTVlLWY4OTdlMWE3YjAzYyIsImlhdCI6MTc1ODYyNzc5OCwiZXhwIjoxNzU5MjMyNTk4fQ.cbhWGQNMcQ-cd31yPqMqPkkU_7g8HKzga3Z-n69Pkss" \
  -d '{"status": "approved"}'

echo -e "\n📝 Approving Bob Brown..."
curl -X PATCH https://onlinestudy-backend-4u8y.onrender.com/api/users/422bf165-31df-401d-b6c6-004c624f5286/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVmM2RlMmQ3LWFlOGItNDFhMi05OTVlLWY4OTdlMWE3YjAzYyIsImlhdCI6MTc1ODYyNzc5OCwiZXhwIjoxNzU5MjMyNTk4fQ.cbhWGQNMcQ-cd31yPqMqPkkU_7g8HKzga3Z-n69Pkss" \
  -d '{"status": "approved"}'

echo -e "\n📝 Approving Carol Davis..."
curl -X PATCH https://onlinestudy-backend-4u8y.onrender.com/api/users/13b04d1f-a279-4e03-8d37-a50b098ea4e6/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVmM2RlMmQ3LWFlOGItNDFhMi05OTVlLWY4OTdlMWE3YjAzYyIsImlhdCI6MTc1ODYyNzc5OCwiZXhwIjoxNzU5MjMyNTk4fQ.cbhWGQNMcQ-cd31yPqMqPkkU_7g8HKzga3Z-n69Pkss" \
  -d '{"status": "approved"}'

echo -e "\n📝 Approving David Miller..."
curl -X PATCH https://onlinestudy-backend-4u8y.onrender.com/api/users/8304781a-af58-4481-a535-da54e17dbc57/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVmM2RlMmQ3LWFlOGItNDFhMi05OTVlLWY4OTdlMWE3YjAzYyIsImlhdCI6MTc1ODYyNzc5OCwiZXhwIjoxNzU5MjMyNTk4fQ.cbhWGQNMcQ-cd31yPqMqPkkU_7g8HKzga3Z-n69Pkss" \
  -d '{"status": "approved"}'

echo -e "\n📝 Approving Emma Wilson..."
curl -X PATCH https://onlinestudy-backend-4u8y.onrender.com/api/users/ad209abc-0232-4353-a203-be3965555f93/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVmM2RlMmQ3LWFlOGItNDFhMi05OTVlLWY4OTdlMWE3YjAzYyIsImlhdCI6MTc1ODYyNzc5OCwiZXhwIjoxNzU5MjMyNTk4fQ.cbhWGQNMcQ-cd31yPqMqPkkU_7g8HKzga3Z-n69Pkss" \
  -d '{"status": "approved"}'

echo -e "\n📝 Approving Frank Moore..."
curl -X PATCH https://onlinestudy-backend-4u8y.onrender.com/api/users/7ecbd03e-53d1-4bb6-a322-d88a57c0fcb3/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVmM2RlMmQ3LWFlOGItNDFhMi05OTVlLWY4OTdlMWE3YjAzYyIsImlhdCI6MTc1ODYyNzc5OCwiZXhwIjoxNzU5MjMyNTk4fQ.cbhWGQNMcQ-cd31yPqMqPkkU_7g8HKzga3Z-n69Pkss" \
  -d '{"status": "approved"}'

echo -e "\n📝 Approving Grace Taylor..."
curl -X PATCH https://onlinestudy-backend-4u8y.onrender.com/api/users/339927e8-3ab5-4b85-a14c-e120dc1ad2ee/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVmM2RlMmQ3LWFlOGItNDFhMi05OTVlLWY4OTdlMWE3YjAzYyIsImlhdCI6MTc1ODYyNzc5OCwiZXhwIjoxNzU5MjMyNTk4fQ.cbhWGQNMcQ-cd31yPqMqPkkU_7g8HKzga3Z-n69Pkss" \
  -d '{"status": "approved"}'

echo -e "\n🎉 All student accounts approved!"
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
