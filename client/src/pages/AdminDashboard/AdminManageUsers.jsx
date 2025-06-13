import React, { useState, useEffect } from "react";
import { apiGetAllUsers, apiUpdateUserRole, apiDeleteUser } from "@/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Mail,
  Phone,
  Users,
  UserCog,
  Shield,
  Egg,
  Wheat,
  UserX,
  Edit,
  AlertTriangle,
} from "lucide-react";

const AdminManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiGetAllUsers();
      setUsers(data);
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await apiUpdateUserRole(userId, newRole);
      toast.success("User role updated successfully");
      fetchUsers(); // Refresh user list
    } catch (error) {
      toast.error("Failed to update user role");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await apiDeleteUser(userId);
      toast.success("User deleted successfully");
      fetchUsers(); // Refresh user list
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4 text-red-500" />;
      case "seller":
        return <Egg className="w-4 h-4 text-orange-500" />;
      default:
        return <Users className="w-4 h-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center bg-white rounded-xl shadow-md p-8 border border-orange-200">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Loading Users
          </h2>
          <div className="flex items-center justify-center space-x-2">
            <div
              className="w-4 h-4 rounded-full bg-orange-500 animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-4 h-4 rounded-full bg-orange-500 animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
            <div
              className="w-4 h-4 rounded-full bg-orange-500 animate-bounce"
              style={{ animationDelay: "600ms" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center">
          <UserCog className="h-6 w-6 text-orange-500 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Manage Users</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-auto">
            <Input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-orange-200 focus:border-orange-400 focus:ring-orange-400/20 w-full"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-orange-400" />
          </div>
          <select
            className="border border-orange-200 bg-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/20 text-gray-700 flex-1 md:flex-auto"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="seller">Sellers</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center p-8 bg-orange-50 rounded-xl border border-orange-100">
          <Users className="h-12 w-12 text-orange-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            No users found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm
              ? "Try adjusting your search criteria"
              : roleFilter !== "all"
              ? `No users with role "${roleFilter}" found`
              : "There are no users in the system"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-orange-50/80">
                <TableRow className="border-b border-orange-100 hover:bg-transparent">
                  <TableHead className="text-orange-800">Name</TableHead>
                  <TableHead className="text-orange-800">Contact</TableHead>
                  <TableHead className="text-orange-800">Role</TableHead>
                  <TableHead className="text-orange-800">Status</TableHead>
                  <TableHead className="text-right text-orange-800">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow
                    key={user._id}
                    className="border-b border-orange-100 hover:bg-orange-50/60"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-800">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4 text-orange-400" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4 text-orange-400" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleUpdateRole(user._id, e.target.value)
                          }
                          className="border border-orange-200 bg-white px-2 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                        >
                          <option value="user">User</option>
                          <option value="seller">Seller</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-orange-200 text-orange-600 hover:bg-orange-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {filteredUsers.length > 0 && (
        <div className="mt-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 shadow-sm border border-orange-200">
          <div className="flex items-start gap-3">
            <div className="bg-white rounded-full p-2 shadow-sm border border-orange-200">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-orange-800 mb-1">
                User Management Guidelines
              </h3>
              <p className="text-xs text-orange-700">
                Remember to review user applications thoroughly before granting
                seller privileges. Only assign admin roles to trusted team
                members.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManageUsers;
