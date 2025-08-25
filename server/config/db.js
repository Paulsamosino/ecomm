const mongoose = require("mongoose");
const dns = require("dns");

// Workaround: some networks (ISPs / routers) have unreliable DNS and cause
// `queryTxt ETIMEOUT` when resolving Atlas SRV/TXT records. Set a reliable
// public DNS resolver list early so node's resolver uses them for lookups.
// You can override via the env var `DNS_SERVERS` (comma-separated) if needed.
try {
  const fromEnv = process.env.DNS_SERVERS;
  if (fromEnv) {
    const servers = fromEnv.split(",").map(s => s.trim()).filter(Boolean);
    dns.setServers(servers);
  } else {
    // Google + Cloudflare as safe defaults
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  }
  console.log("DNS servers in use:", dns.getServers());
} catch (err) {
  console.warn("Failed to set DNS servers for Node resolver:", err && err.message);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/poultrymart",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
