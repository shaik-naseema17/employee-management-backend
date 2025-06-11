import express from 'express'
import connectToDatabase from './db/db.js';
import salaryRouter from './routes/salary.js'
import authRouter from './routes/auth.js'
import cors from 'cors'
import departmentRouter from './routes/department.js';
import employeeRouter from './routes/employee.js';
import settingRouter from './routes/setting.js'
import leaveRouter from './routes/leave.js'
import dashboardRouter from "./routes/dashboard.js";

// Connect to the database
connectToDatabase();

const app = express()

// CORS configuration
const allowedOrigins = [
  'https://employee-management-frontend-u0aw.onrender.com',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public/uploads'))

app.use('/api/auth', authRouter)
app.use('/api/department', departmentRouter)
app.use('/api/employee', employeeRouter)
app.use('/api/leave', leaveRouter)
app.use('/api/setting', settingRouter)
app.use('/api/salary', salaryRouter)
app.use('/api/dashboard', dashboardRouter)

app.listen(process.env.PORT, () => {
  console.log(`server is running on the port ${process.env.PORT}`)
})
