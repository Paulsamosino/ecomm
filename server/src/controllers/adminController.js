const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Report = require("../models/Report");

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Error updating user role" });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
};

// Get admin dashboard stats
exports.getAdminStats = async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );
    const lastYear = new Date(
      now.getFullYear() - 1,
      now.getMonth(),
      now.getDate()
    );

    // Get current period stats
    const [currentUsers, currentProducts, currentOrders] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ status: "active" }),
      Order.find({ status: "completed" }),
    ]);

    // Get previous period stats for growth calculation
    const [lastMonthUsers, lastMonthProducts, lastMonthOrders] =
      await Promise.all([
        User.countDocuments({ createdAt: { $lt: lastMonth } }),
        Product.countDocuments({
          status: "active",
          createdAt: { $lt: lastMonth },
        }),
        Order.find({ status: "completed", createdAt: { $lt: lastMonth } }),
      ]);

    // Calculate total revenue and average order value
    const totalRevenue = currentOrders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );
    const averageOrderValue =
      currentOrders.length > 0 ? totalRevenue / currentOrders.length : 0;

    // Calculate growth rates
    const userGrowth = calculateGrowthRate(currentUsers, lastMonthUsers);
    const productGrowth = calculateGrowthRate(
      currentProducts,
      lastMonthProducts
    );
    const revenueGrowth = calculateGrowthRate(
      currentOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      lastMonthOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    );

    const stats = {
      totalRevenue,
      totalUsers: currentUsers,
      totalProducts: currentProducts,
      totalOrders: currentOrders.length,
      averageOrderValue,
      userGrowth,
      productGrowth,
      revenueGrowth,
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ message: "Error fetching admin stats" });
  }
};

// Get all products/listings
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("seller", "name email");
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products" });
  }
};

// Update product status
exports.updateProductStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("seller", "name email");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error updating product status:", error);
    res.status(500).json({ message: "Error updating product status" });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Error deleting product" });
  }
};

// Get analytics data
exports.getAnalytics = async (req, res) => {
  try {
    const { period = "week" } = req.query;
    const startDate = new Date();
    let interval;

    // Set the start date and interval based on period
    switch (period) {
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        interval = { unit: "day", value: 1 };
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        interval = { unit: "day", value: 1 };
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        interval = { unit: "month", value: 1 };
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
        interval = { unit: "day", value: 1 };
    }

    // Aggregate data for the period
    const [users, orders, products] = await Promise.all([
      User.find({ createdAt: { $gte: startDate } }),
      Order.find({
        createdAt: { $gte: startDate },
      }).populate("items.product"),
      Product.find({ createdAt: { $gte: startDate } }),
    ]);

    // Calculate revenue stats
    const revenueStats = {
      dailyStats: generateTimeSeriesData(
        startDate,
        orders,
        interval,
        (order) => ({
          value: order.totalAmount || 0,
        })
      ),
      orderStatus: generateOrderStatusDistribution(orders),
    };

    // Calculate user stats
    const userStats = {
      dailyStats: generateTimeSeriesData(startDate, users, interval, () => ({
        value: 1,
      })),
      totalActive: users.filter((user) => user.lastLoginDate >= startDate)
        .length,
    };

    // Calculate product stats
    const productStats = {
      dailyStats: generateTimeSeriesData(startDate, products, interval, () => ({
        value: 1,
      })),
      categories: generateCategoryDistribution(products),
    };

    const analytics = {
      revenue: revenueStats,
      users: userStats,
      products: productStats,
    };

    res.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Error fetching analytics" });
  }
};

// Get platform settings
exports.getSettings = async (req, res) => {
  try {
    // In a real app, you'd fetch this from a Settings model
    // For now, we'll return default settings
    res.json({
      platformName: "PoultryMart",
      supportEmail: "support@poultrymart.com",
      platformFee: 5,
      minWithdrawalAmount: 50,
      maintenanceMode: false,
      allowNewRegistrations: true,
      automaticApprovals: false,
      notificationSettings: {
        emailNotifications: true,
        pushNotifications: true,
      },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: "Error fetching settings" });
  }
};

// Update platform settings
exports.updateSettings = async (req, res) => {
  try {
    // In a real app, you'd update a Settings model
    // For now, we'll just return success
    res.json({
      message: "Settings updated successfully",
      settings: req.body,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ message: "Error updating settings" });
  }
};

// Get all reports
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reporter", "name email")
      .populate("reportedUser", "name email")
      .populate("resolvedBy", "name email")
      .sort({ createdAt: -1 });

    // Format the response data
    const formattedReports = reports.map((report) => {
      const formattedReport = {
        _id: report._id,
        status: report.status,
        reason: report.reason,
        description: report.description,
        category: report.category,
        createdAt: report.createdAt,
        resolution: report.resolution,
        resolvedAt: report.resolvedAt,
        reporterRole: report.reporterRole,
        reporterName: report.reporter ? report.reporter.name : "Unknown",
        reportedUserName: report.reportedUser
          ? report.reportedUser.name
          : "Unknown User",
        evidence: report.evidence || [],
      };

      // Add reporter details
      if (report.reporter) {
        formattedReport.reporterDetails = {
          id: report.reporter._id,
          name: report.reporter.name,
          email: report.reporter.email,
        };
      }

      // Add reported user details
      if (report.reportedUser) {
        formattedReport.reportedUserDetails = {
          id: report.reportedUser._id,
          name: report.reportedUser.name,
          email: report.reportedUser.email,
        };
      }

      // Add resolver info if resolved
      if (report.resolvedBy) {
        formattedReport.resolverName = report.resolvedBy.name;
        formattedReport.resolverDetails = {
          id: report.resolvedBy._id,
          name: report.resolvedBy.name,
          email: report.resolvedBy.email,
        };
      }

      return formattedReport;
    });

    res.json(formattedReports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    // Send more detailed error information in development
    const errorResponse = {
      message: "Error fetching reports",
      ...(process.env.NODE_ENV === "development" && {
        error: error.message,
        stack: error.stack,
      }),
    };
    res.status(500).json(errorResponse);
  }
};

// Get report statistics
exports.getReportStats = async (req, res) => {
  try {
    const [total, pending, investigating, resolved] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: "pending" }),
      Report.countDocuments({ status: "investigating" }),
      Report.countDocuments({ status: "resolved" }),
    ]);

    res.json({
      total,
      pending,
      investigating,
      resolved,
    });
  } catch (error) {
    console.error("Error fetching report stats:", error);
    res.status(500).json({ message: "Error fetching report stats" });
  }
};

// Update report status
exports.updateReportStatus = async (req, res) => {
  try {
    const { status, resolution } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status,
        resolution,
        resolvedBy: status === "resolved" ? req.user._id : null,
        resolvedAt: status === "resolved" ? new Date() : null,
      },
      { new: true }
    )
      .populate("reporter", "name email")
      .populate("reportedUser", "name email")
      .populate("resolvedBy", "name email");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json(report);
  } catch (error) {
    console.error("Error updating report status:", error);
    res.status(500).json({ message: "Error updating report status" });
  }
};

// Delete report
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ message: "Error deleting report" });
  }
};

// Helper function to generate time series data
const generateTimeSeriesData = (startDate, data, interval, valueExtractor) => {
  const timeSeriesData = [];
  const endDate = new Date();
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const periodStart = new Date(currentDate);
    let periodEnd;

    if (interval.unit === "day") {
      periodEnd = new Date(
        currentDate.setDate(currentDate.getDate() + interval.value)
      );
    } else if (interval.unit === "month") {
      periodEnd = new Date(
        currentDate.setMonth(currentDate.getMonth() + interval.value)
      );
    }

    const periodData = data.filter(
      (item) => item.createdAt >= periodStart && item.createdAt < periodEnd
    );

    const value = periodData.reduce(
      (sum, item) => sum + valueExtractor(item).value,
      0
    );

    timeSeriesData.push({
      date: periodStart.toLocaleDateString(),
      value,
    });

    currentDate = new Date(periodEnd);
  }

  return timeSeriesData;
};

// Helper function to generate order status distribution
const generateOrderStatusDistribution = (orders) => {
  const statusCount = {};
  orders.forEach((order) => {
    statusCount[order.status] = (statusCount[order.status] || 0) + 1;
  });

  return Object.entries(statusCount).map(([status, count]) => ({
    status,
    count,
  }));
};

// Helper function to generate category distribution
const generateCategoryDistribution = (products) => {
  const categoryCount = {};
  products.forEach((product) => {
    if (product.category) {
      categoryCount[product.category] =
        (categoryCount[product.category] || 0) + 1;
    }
  });

  return Object.entries(categoryCount).map(([name, value]) => ({
    name,
    value,
  }));
};

// Helper function to calculate growth rate
const calculateGrowthRate = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};
