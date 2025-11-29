# Take a Hike

This project is a full-stack platform built with Node.js, Express.js, and Oracle Database, connecting users with different hikes based on their preferences.

# Features

- User Management
- Hike Recommendations and Insights
- Review Uploads

# Technical Stack

- **Backend**: Node.js with Express.
- **Database**: Oracle Database.
- **API**: RESTful endpoints.
- **Connection Pooling**: Oracle connection pool for efficient database management.

# Project Structure

```
project/
├── appController.js    // API route handlers
├── appService.js       // Business logic and database operations
├── server.js           // Express server setup
└── utils/
    └── envUtil.js      // Environment configuration utilities
```

# Setup

1. **Clone the repository:**
```sh
git clone https://github.com/cheese-tart/Take-a-Hike.git
```

2. **Navigate to the project directory:**
```sh
cd project
```

3. **Install dependencies:**
```sh
npm install
```

4. **Set up environment variables:**
   - Create a `.env` file in the root directory.
   - Define the following variables:
     ```env
     DB_USER=<your_database_user>
     DB_PASSWORD=<your_database_password>
     DB_HOST=<your_database_host>
     DB_PORT=<your_database_port>
     DB_NAME=<your_database_name>
     ```

5. **Start the server:**
```sh
npm start
```

6. **Access the API:**
   - By default, the server runs on `http://localhost:3000`.
