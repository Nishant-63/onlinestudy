# 🚀 Render Deployment Guide

## Prerequisites
- GitHub repository with your code
- Render account (free tier available)
- PostgreSQL database (Render provides this)
- Redis instance (Render provides this)
- AWS S3 bucket for file storage

## Step 1: Prepare Your Repository

### 1.1 Environment Variables
Create these environment variables in your Render dashboard:

#### Backend Environment Variables:
```
NODE_ENV=production
PORT=3001
DATABASE_URL=your_postgres_database_url_here
JWT_SECRET=your_super_secure_jwt_secret_here
JWT_EXPIRES_IN=7d
REDIS_URL=your_redis_url_here
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=your_aws_region_here
S3_BUCKET_NAME=your_s3_bucket_name_here
CORS_ORIGIN=https://your-frontend-app-name.onrender.com
MAX_FILE_SIZE=10737418240
ALLOWED_VIDEO_TYPES=video/mp4,video/avi,video/mov,video/quicktime
ALLOWED_DOCUMENT_TYPES=application/pdf
VIDEO_PROCESSING_ENABLED=true
THUMBNAIL_GENERATION_ENABLED=true
```

## Step 2: Deploy Backend (Web Service)

### 2.1 Create Backend Service
1. Go to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `onlinestudy-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: Leave empty (or set to `backend`)

### 2.2 Environment Variables
Add all the backend environment variables listed above.

### 2.3 Advanced Settings
- **Auto-Deploy**: Yes
- **Branch**: `main`
- **Node Version**: `18` or `20`

## Step 3: Deploy Frontend (Static Site)

### 3.1 Create Frontend Service
1. Go to Render Dashboard
2. Click "New +" → "Static Site"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `onlinestudy-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`
   - **Root Directory**: Leave empty (or set to `frontend`)

### 3.2 Environment Variables
Add these frontend environment variables:
```
REACT_APP_API_URL=https://your-backend-app-name.onrender.com
REACT_APP_ENVIRONMENT=production
```

## Step 4: Set Up Database

### 4.1 Create PostgreSQL Database
1. Go to Render Dashboard
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: `onlinestudy-db`
   - **Database**: `onlinestudy`
   - **User**: `onlinestudy_user`
   - **Region**: Choose closest to your users

### 4.2 Get Database URL
Copy the "External Database URL" from your PostgreSQL service and use it as `DATABASE_URL` in your backend environment variables.

## Step 5: Set Up Redis

### 5.1 Create Redis Instance
1. Go to Render Dashboard
2. Click "New +" → "Redis"
3. Configure:
   - **Name**: `onlinestudy-redis`
   - **Region**: Choose closest to your users

### 5.2 Get Redis URL
Copy the "External Redis URL" and use it as `REDIS_URL` in your backend environment variables.

## Step 6: Set Up AWS S3

### 6.1 Create S3 Bucket
1. Go to AWS Console
2. Create S3 bucket with public read access
3. Configure CORS policy:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

### 6.2 Create IAM User
1. Create IAM user with S3 permissions
2. Attach policy for S3 full access
3. Generate access keys
4. Use these in your backend environment variables

## Step 7: Update Frontend API Configuration

### 7.1 Update API Base URL
In `frontend/src/services/api.js`, update the base URL:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-backend-app-name.onrender.com';
```

## Step 8: Deploy and Test

### 8.1 Deploy Services
1. Deploy backend first
2. Wait for backend to be healthy
3. Deploy frontend
4. Test the application

### 8.2 Database Migration
After backend is deployed, you may need to run database migrations:
1. Go to your backend service
2. Open the shell
3. Run: `npm run migrate`
4. Run: `npm run seed` (optional, for sample data)

## Step 9: Custom Domain (Optional)

### 9.1 Add Custom Domain
1. Go to your frontend service
2. Click "Settings" → "Custom Domains"
3. Add your domain
4. Update DNS records as instructed

## Troubleshooting

### Common Issues:
1. **CORS Errors**: Make sure `CORS_ORIGIN` matches your frontend URL
2. **Database Connection**: Verify `DATABASE_URL` is correct
3. **File Upload Issues**: Check AWS S3 credentials and bucket permissions
4. **Build Failures**: Check Node.js version compatibility

### Logs:
- Check Render service logs for errors
- Backend logs: Service → Logs
- Frontend logs: Service → Logs

## Cost Estimation (Free Tier)
- Backend: 750 hours/month free
- Frontend: Unlimited static hosting
- Database: 1GB free
- Redis: 25MB free

## Security Notes
- Use strong JWT secrets
- Enable HTTPS (automatic on Render)
- Regularly rotate AWS credentials
- Monitor usage and upgrade when needed

