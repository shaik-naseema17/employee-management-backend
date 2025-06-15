import bcrypt from 'bcrypt';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import Department from '../models/Department.js';

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'employee-profile-images',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 400, height: 400, crop: "limit" }],
  },
});

const upload = multer({ storage });

// Add Employee
const addEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      employeeId,
      dob,
      gender,
      maritalStatus,
      designation,
      department,
      salary,
      password,
      role,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: "User already registered in employee system" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      profileImage: req.file?.path || "",
    });

    const savedUser = await newUser.save();

    const newEmployee = new Employee({
      userId: savedUser._id,
      employeeId,
      dob,
      gender,
      maritalStatus,
      designation,
      department,
      salary,
    });

    await newEmployee.save();

    return res.status(200).json({ success: true, message: "Employee created successfully" });
  } catch (error) {
    console.error("Add Employee Error:", error);
    return res.status(500).json({ success: false, error: "Server error adding employee" });
  }
};

// Clean orphan employees
const cleanOrphanEmployees = async () => {
  const employees = await Employee.find();
  for (const emp of employees) {
    const userExists = await User.exists({ _id: emp.userId });
    if (!userExists) {
      console.log(`Deleting employee ${emp._id} - orphan (user ${emp.userId} not found)`);
      await Employee.findByIdAndDelete(emp._id);
    }
  }
};

// Get all employees
const getEmployees = async (req, res) => {
  try {
    await cleanOrphanEmployees();

    const employees = await Employee.find()
      .populate('userId', { password: 0 })
      .populate('department');

    return res.status(200).json({ success: true, employees });
  } catch (error) {
    console.error("Get Employees Error:", error);
    return res.status(500).json({ success: false, error: "Get employee server error" });
  }
};

// Get single employee by ID or userId
const getEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    let employee = await Employee.findById(id)
      .populate('userId', { password: 0 })
      .populate('department');

    if (!employee) {
      employee = await Employee.findOne({ userId: id })
        .populate('userId', { password: 0 })
        .populate('department');
    }

    return res.status(200).json({ success: true, employee });
  } catch (error) {
    console.error("Get Employee Error:", error);
    return res.status(500).json({ success: false, error: "Get employee server error" });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      maritalStatus,
      designation,
      department,
      salary,
    } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ success: false, error: "Employee not found" });
    }

    const user = await User.findById(employee.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    await User.findByIdAndUpdate(user._id, { name });
    const updatedEmployee = await Employee.findByIdAndUpdate(id, {
      maritalStatus,
      designation,
      department,
      salary,
    });

    if (!updatedEmployee) {
      return res.status(404).json({ success: false, error: "Failed to update employee" });
    }

    return res.status(200).json({ success: true, message: "Employee updated successfully" });
  } catch (error) {
    console.error("Update Employee Error:", error);
    return res.status(500).json({ success: false, error: "Update employee server error" });
  }
};

// Get employees by department
const fetchEmployeesByDepId = async (req, res) => {
  const { id } = req.params;
  try {
    const employees = await Employee.find({ department: id })
      .populate('userId', { password: 0 })
      .populate('department');

    return res.status(200).json({ success: true, employees });
  } catch (error) {
    console.error("Fetch by Department Error:", error);
    return res.status(500).json({ success: false, error: "Get employees by department server error" });
  }
};

export {
  upload,
  addEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  fetchEmployeesByDepId
};
