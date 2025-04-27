import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Calendar,
  ChevronRight,
  Heart,
  Info,
  Loader2,
  Star,
  TrendingUp,
  Check,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { format, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import breedingService from "@/services/breedingService";

const COLORS = ["#ffb464", "#ffa040", "#ff9428", "#ff8814", "#ff7c00"];

const BreedingAnalytics = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("6m");
  const [stats, setStats] = useState({
    totalPairs: 0,
    successRate: 0,
    averageHatchRate: 0,
    activeProjects: 0,
  });
  const [breedingData, setBreedingData] = useState({
    monthlyStats: [],
    breedDistribution: [],
    successByBreed: [],
    recentActivity: [],
  });

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [statsData, analyticsData] = await Promise.all([
        breedingService.getBreedingStats(),
        breedingService.getBreedingAnalytics(timeRange),
      ]);
      setStats(statsData);
      setBreedingData(analyticsData);
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load breeding analytics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, trend, icon: Icon, description }) => (
    <Card className="breeding-stats-card shadow-md border border-[#ffb464]/30 hover:border-[#ffb464] transition-all">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-[#fff5e8] to-[#ffeed7] rounded-t-lg">
        <CardTitle className="text-sm font-medium text-[#a05e2b]">
          {title}
        </CardTitle>
        <div className="p-2 rounded-full bg-gradient-to-r from-[#ffb464] to-[#ffa040]">
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="text-2xl font-bold text-[#a05e2b]">{value}</div>
        {trend && (
          <div
            className={cn(
              "mt-2 flex items-center text-xs",
              trend.positive ? "text-green-600" : "text-red-600"
            )}
          >
            {trend.positive ? (
              <ArrowUp className="mr-1 h-4 w-4" />
            ) : (
              <ArrowDown className="mr-1 h-4 w-4" />
            )}
            {trend.value}
          </div>
        )}
        <p className="text-xs text-[#b06a30]">{description}</p>
      </CardContent>
    </Card>
  );

  const renderMonthlyStats = () => (
    <Card className="breeding-card shadow-md border-[#ffb464]/30">
      <CardHeader className="bg-gradient-to-r from-[#fff5e8] to-[#ffeed7]">
        <CardTitle className="text-[#a05e2b]">Monthly Performance</CardTitle>
        <CardDescription className="text-[#b06a30]">
          Track breeding success and hatch rates over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={breedingData.monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" stroke="#a05e2b" />
              <YAxis stroke="#a05e2b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff5e8",
                  border: "1px solid #ffb464",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="successRate"
                stroke="#ffb464"
                name="Success Rate"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="hatchRate"
                stroke="#d37b33"
                name="Hatch Rate"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const renderBreedDistribution = () => (
    <Card className="breeding-card shadow-md border-[#ffb464]/30">
      <CardHeader className="bg-gradient-to-r from-[#fff5e8] to-[#ffeed7]">
        <CardTitle className="text-[#a05e2b]">Breed Distribution</CardTitle>
        <CardDescription className="text-[#b06a30]">
          Active breeding pairs by breed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={breedingData.breedDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={80}
                fill="#ffb464"
                dataKey="value"
              >
                {breedingData.breedDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff5e8",
                  border: "1px solid #ffb464",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const renderSuccessByBreed = () => (
    <Card className="breeding-card shadow-md border-[#ffb464]/30">
      <CardHeader className="bg-gradient-to-r from-[#fff5e8] to-[#ffeed7]">
        <CardTitle className="text-[#a05e2b]">Success Rate by Breed</CardTitle>
        <CardDescription className="text-[#b06a30]">
          Compare breeding success across breeds
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={breedingData.successByBreed}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="breed" stroke="#a05e2b" />
              <YAxis stroke="#a05e2b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff5e8",
                  border: "1px solid #ffb464",
                }}
              />
              <Bar dataKey="successRate" fill="#ffb464" name="Success Rate">
                {breedingData.successByBreed.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const renderRecentActivity = () => (
    <Card className="breeding-card shadow-md border-[#ffb464]/30">
      <CardHeader className="bg-gradient-to-r from-[#fff5e8] to-[#ffeed7]">
        <CardTitle className="text-[#a05e2b]">Recent Activity</CardTitle>
        <CardDescription className="text-[#b06a30]">
          Latest breeding events and milestones
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {breedingData.recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-4 p-3 rounded-lg hover:bg-[#fff5e8] transition-colors"
              >
                <div
                  className={cn(
                    "p-2 rounded-full",
                    activity.type === "success"
                      ? "bg-green-100 text-green-600"
                      : activity.type === "warning"
                      ? "bg-[#fff5e8] text-[#ffb464]"
                      : "bg-[#fff5e8] text-[#ffb464]"
                  )}
                >
                  {activity.type === "success" ? (
                    <Check className="h-4 w-4" />
                  ) : activity.type === "warning" ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <Info className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#a05e2b]">
                    {activity.title}
                  </p>
                  <p className="text-xs text-[#b06a30]">
                    {activity.description}
                  </p>
                  <p className="text-xs text-[#b06a30] mt-1">
                    {format(new Date(activity.date), "PPp")}
                  </p>
                </div>
                {activity.status && (
                  <Badge
                    variant={
                      activity.status === "completed"
                        ? "success"
                        : activity.status === "in_progress"
                        ? "warning"
                        : "default"
                    }
                    className="bg-[#fff5e8] text-[#a05e2b] border-[#ffb464]/30"
                  >
                    {activity.status}
                  </Badge>
                )}
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-[#d37b33] to-[#ffb464] text-transparent bg-clip-text">
            Breeding Analytics
          </h2>
          <p className="text-[#b06a30]">
            Monitor and analyze your breeding program performance
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px] border-[#ffb464]/30 focus:ring-[#ffb464]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">Last Month</SelectItem>
            <SelectItem value="3m">Last 3 Months</SelectItem>
            <SelectItem value="6m">Last 6 Months</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-[#ffb464]" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Breeding Pairs"
              value={stats.totalPairs}
              trend={{ positive: true, value: "+12% from last month" }}
              icon={Heart}
              description="Active breeding pairs in your program"
            />
            <StatCard
              title="Success Rate"
              value={`${stats.successRate}%`}
              trend={{ positive: true, value: "+5% from last month" }}
              icon={Star}
              description="Overall breeding success rate"
            />
            <StatCard
              title="Average Hatch Rate"
              value={`${stats.averageHatchRate}%`}
              trend={{ positive: false, value: "-2% from last month" }}
              icon={TrendingUp}
              description="Average successful hatches"
            />
            <StatCard
              title="Active Projects"
              value={stats.activeProjects}
              trend={{ positive: true, value: "+3 from last month" }}
              icon={Calendar}
              description="Ongoing breeding projects"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {renderMonthlyStats()}
            {renderBreedDistribution()}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {renderSuccessByBreed()}
            {renderRecentActivity()}
          </div>
        </>
      )}
    </div>
  );
};

export default BreedingAnalytics;
