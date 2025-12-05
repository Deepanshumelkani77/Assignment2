# Shift Management System

A full-stack web application for managing employee shifts, built with React.js, Node.js, Express, and MongoDB.

## Features

- User authentication (Login/Register)
- Role-based access control (Admin/Employee)
- Create, read, update, and delete shifts
- View shift schedules and employee details
- Responsive design for all devices
- Real-time updates

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, React Router, Axios
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Deployment**: Render (Backend), Vercel/Netlify (Frontend)

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- MongoDB Atlas account or local MongoDB installation

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```env
   PORT=7000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=30d
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory:
   ```env
   REACT_APP_API_URL=http://localhost:7000
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## API Documentation

### Authentication

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user profile

### Users

- `GET /api/v1/users` - Get all users (Admin only)
- `GET /api/v1/users/employees` - Get all employees
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user (Admin only)

### Shifts

- `GET /api/v1/shifts` - Get all shifts
- `GET /api/v1/shifts/:id` - Get shift by ID
- `POST /api/v1/shifts` - Create new shift
- `PUT /api/v1/shifts/:id` - Update shift
- `DELETE /api/v1/shifts/:id` - Delete shift

## Environment Variables

### Backend

- `PORT` - Port to run the server on (default: 7000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token generation
- `JWT_EXPIRES_IN` - JWT token expiration time

### Frontend

- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:7000)

## Deployment

### Backend Deployment

1. Push your code to a GitHub repository
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Set environment variables in Render dashboard
5. Deploy

### Frontend Deployment

1. Push your code to a GitHub repository
2. Deploy to Vercel or Netlify
3. Set environment variables in the deployment settings

## Known Issues

1. **Time Zone Handling**
   - The application currently uses the system timezone. For production, consider implementing timezone support.

2. **Offline Access**
   - The app requires an internet connection to function as it doesn't support offline mode.

3. **Browser Compatibility**
   - Some features might not work as expected on older browsers. Recommended to use the latest version of Chrome, Firefox, or Edge.

4. **Performance**
   - Large datasets might cause performance issues. Consider implementing pagination or infinite scrolling.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For any queries, please contact [Your Email]
