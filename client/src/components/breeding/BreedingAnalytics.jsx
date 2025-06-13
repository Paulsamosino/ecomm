import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { breedingService } from "@/services/breedingService";
import { toast } from "react-hot-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  LineChart as LineChartIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Calendar,
  TrendingUp,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Bird,
  Egg,
  Award,
  Zap,
  ChevronRight,
  Download,
  Leaf,
  Sun,
  CloudRain,
  Thermometer,
  Heart,
  Feather,
  Users,
  ClipboardList,
} from "lucide-react";

// Farm-themed color palette
const COLORS = ["#fcba6d", "#cd8539", "#8fbc8f", "#e8f4ea", "#ffecd4"];
const CHART_COLORS = {
  primary: "#fcba6d",
  secondary: "#cd8539",
  tertiary: "#8fbc8f",
  light: "#ffecd4",
  success: "#4BC0C0",
  warning: "#FF9F40",
  error: "#FF6384",
  neutral: "#9966FF",
};

// Custom tooltip styles
const CustomTooltipStyle = {
  backgroundColor: "#fff",
  border: "1px solid #ffecd4",
  borderRadius: "8px",
  padding: "10px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={CustomTooltipStyle}>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p
            key={index}
            className="text-sm font-medium"
            style={{ color: entry.color }}
          >
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const BreedingAnalytics = () => {
  const [timeRange, setTimeRange] = useState("6");
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [chartType, setChartType] = useState("bar"); // bar, line, area

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const data = await breedingService.getBreedingAnalytics(timeRange);
      setAnalyticsData(data);
    } catch (error) {
      console.error("Failed to load analytics data:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setIsLoading(false);
    }
  };

  const getChangeIndicator = (change) => {
    if (change > 0) {
      return (
        <Badge
          variant="outline"
          className="ml-2 bg-green-50 text-green-600 border-green-100 flex items-center gap-1"
        >
          <ArrowUpRight className="h-3 w-3" />+{change}%
        </Badge>
      );
    } else if (change < 0) {
      return (
        <Badge
          variant="outline"
          className="ml-2 bg-red-50 text-red-600 border-red-100 flex items-center gap-1"
        >
          <ArrowDownRight className="h-3 w-3" />
          {change}%
        </Badge>
      );
    }
    return null;
  };

  const getMetricIcon = (metricName) => {
    switch (metricName.toLowerCase()) {
      case "total breeding pairs":
        return <Users className="h-4 w-4 text-[#fcba6d]" />;
      case "success rate":
        return <Award className="h-4 w-4 text-[#fcba6d]" />;
      case "average hatch rate":
        return <Egg className="h-4 w-4 text-[#fcba6d]" />;
      case "active projects":
        return <Activity className="h-4 w-4 text-[#fcba6d]" />;
      default:
        return <Info className="h-4 w-4 text-[#fcba6d]" />;
    }
  };

  if (isLoading || !analyticsData) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-lg border border-[#ffecd4] p-6">
        <div className="flex flex-col items-center">
          <Egg className="h-8 w-8 text-[#fcba6d] animate-pulse mb-2" />
          <p className="text-[#cd8539]">Loading breeding analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with animated background */}
      <div className="relative bg-white rounded-xl border border-[#ffecd4] p-6 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#fcba6d]/5 rounded-full blur-[80px] animate-pulse-slow" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#e8f4ea]/10 rounded-full blur-[100px] animate-pulse-slow" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#fff0dd] text-[#cd8539] text-xs font-medium mb-3 shadow-sm">
              <BarChartIcon className="h-3 w-3 mr-1" />
              <span>Breeding Performance</span>
            </div>
            <h2 className="text-2xl font-bold text-[#cd8539]">
              Breeding Analytics
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Track your breeding performance and success metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px] border-[#ffecd4]">
                <Calendar className="h-4 w-4 text-[#fcba6d] mr-2" />
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Last 3 months</SelectItem>
                <SelectItem value="6">Last 6 months</SelectItem>
                <SelectItem value="12">Last 12 months</SelectItem>
                <SelectItem value="24">Last 24 months</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              className="border-[#ffecd4] text-[#cd8539] hover:bg-[#fff0dd]"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="bg-[#fff8ef]/70 border border-[#ffecd4] p-1 rounded-lg">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-white data-[state=active]:text-[#cd8539] data-[state=active]:shadow-sm flex items-center gap-2 rounded-md"
          >
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="trends"
            className="data-[state=active]:bg-white data-[state=active]:text-[#cd8539] data-[state=active]:shadow-sm flex items-center gap-2 rounded-md"
          >
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger
            value="breeds"
            className="data-[state=active]:bg-white data-[state=active]:text-[#cd8539] data-[state=active]:shadow-sm flex items-center gap-2 rounded-md"
          >
            <PieChartIcon className="h-4 w-4" />
            Breeds
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-[#ffecd4] bg-white hover:bg-[#fff8ef]/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  {getMetricIcon("Total Breeding Pairs")}
                  Total Breeding Pairs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="text-3xl font-bold text-[#cd8539]">
                    {analyticsData.totalPairs}
                  </div>
                  {getChangeIndicator(analyticsData.pairsChange)}
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Users className="h-3 w-3 text-[#fcba6d]" />
                  {analyticsData.activePairs} currently active
                </p>
              </CardContent>
            </Card>

            <Card className="border-[#ffecd4] bg-white hover:bg-[#fff8ef]/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  {getMetricIcon("Success Rate")}
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="text-3xl font-bold text-[#cd8539]">
                    {analyticsData.successRate}%
                  </div>
                  {getChangeIndicator(analyticsData.successRateChange)}
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Award className="h-3 w-3 text-[#fcba6d]" />
                  Overall breeding success
                </p>
              </CardContent>
            </Card>

            <Card className="border-[#ffecd4] bg-white hover:bg-[#fff8ef]/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  {getMetricIcon("Average Hatch Rate")}
                  Average Hatch Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="text-3xl font-bold text-[#cd8539]">
                    {analyticsData.avgHatchRate}%
                  </div>
                  {getChangeIndicator(analyticsData.hatchRateChange)}
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Egg className="h-3 w-3 text-[#fcba6d]" />
                  Eggs that successfully hatched
                </p>
              </CardContent>
            </Card>

            <Card className="border-[#ffecd4] bg-white hover:bg-[#fff8ef]/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  {getMetricIcon("Active Projects")}
                  Active Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="text-3xl font-bold text-[#cd8539]">
                    {analyticsData.activeProjects}
                  </div>
                  {getChangeIndicator(analyticsData.projectsChange)}
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <ClipboardList className="h-3 w-3 text-[#fcba6d]" />
                  Ongoing breeding projects
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Chart Controls */}
          <div className="flex justify-end gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              className={`border-[#ffecd4] ${
                chartType === "bar"
                  ? "bg-[#fff0dd] text-[#cd8539]"
                  : "text-gray-500"
              }`}
              onClick={() => setChartType("bar")}
            >
              <BarChartIcon className="h-4 w-4 mr-2" />
              Bar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`border-[#ffecd4] ${
                chartType === "line"
                  ? "bg-[#fff0dd] text-[#cd8539]"
                  : "text-gray-500"
              }`}
              onClick={() => setChartType("line")}
            >
              <LineChartIcon className="h-4 w-4 mr-2" />
              Line
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`border-[#ffecd4] ${
                chartType === "area"
                  ? "bg-[#fff0dd] text-[#cd8539]"
                  : "text-gray-500"
              }`}
              onClick={() => setChartType("area")}
            >
              <Activity className="h-4 w-4 mr-2" />
              Area
            </Button>
          </div>

          {/* Monthly Performance Chart */}
          <Card className="border-[#ffecd4] overflow-hidden">
            <CardHeader className="bg-[#fff8ef]/50 border-b border-[#ffecd4]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[#cd8539] flex items-center gap-2">
                    <LineChartIcon className="h-5 w-5 text-[#fcba6d]" />
                    Monthly Performance
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    Track breeding success and hatch rates over time
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="bg-[#fff0dd] text-[#cd8539] border-[#ffecd4]"
                >
                  {timeRange} months
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "bar" ? (
                    <BarChart
                      data={analyticsData.monthlyPerformance}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 25,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "#666" }}
                        axisLine={{ stroke: "#eee" }}
                        tickLine={{ stroke: "#eee" }}
                      />
                      <YAxis
                        tick={{ fill: "#666" }}
                        axisLine={{ stroke: "#eee" }}
                        tickLine={{ stroke: "#eee" }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar
                        dataKey="successRate"
                        name="Success Rate"
                        fill={CHART_COLORS.primary}
                        radius={[4, 4, 0, 0]}
                        barSize={15}
                      />
                      <Bar
                        dataKey="hatchRate"
                        name="Hatch Rate"
                        fill={CHART_COLORS.tertiary}
                        radius={[4, 4, 0, 0]}
                        barSize={15}
                      />
                    </BarChart>
                  ) : chartType === "line" ? (
                    <LineChart
                      data={analyticsData.monthlyPerformance}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 25,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "#666" }}
                        axisLine={{ stroke: "#eee" }}
                        tickLine={{ stroke: "#eee" }}
                      />
                      <YAxis
                        tick={{ fill: "#666" }}
                        axisLine={{ stroke: "#eee" }}
                        tickLine={{ stroke: "#eee" }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="successRate"
                        name="Success Rate"
                        stroke={CHART_COLORS.primary}
                        strokeWidth={3}
                        dot={{ fill: CHART_COLORS.primary, r: 6 }}
                        activeDot={{ r: 8, fill: CHART_COLORS.secondary }}
                      />
                      <Line
                        type="monotone"
                        dataKey="hatchRate"
                        name="Hatch Rate"
                        stroke={CHART_COLORS.tertiary}
                        strokeWidth={3}
                        dot={{ fill: CHART_COLORS.tertiary, r: 6 }}
                        activeDot={{ r: 8, fill: CHART_COLORS.tertiary }}
                      />
                    </LineChart>
                  ) : (
                    <AreaChart
                      data={analyticsData.monthlyPerformance}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 25,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "#666" }}
                        axisLine={{ stroke: "#eee" }}
                        tickLine={{ stroke: "#eee" }}
                      />
                      <YAxis
                        tick={{ fill: "#666" }}
                        axisLine={{ stroke: "#eee" }}
                        tickLine={{ stroke: "#eee" }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <defs>
                        <linearGradient
                          id="colorSuccess"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={CHART_COLORS.primary}
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor={CHART_COLORS.primary}
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorHatch"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={CHART_COLORS.tertiary}
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor={CHART_COLORS.tertiary}
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="successRate"
                        name="Success Rate"
                        stroke={CHART_COLORS.primary}
                        fillOpacity={1}
                        fill="url(#colorSuccess)"
                      />
                      <Area
                        type="monotone"
                        dataKey="hatchRate"
                        name="Hatch Rate"
                        stroke={CHART_COLORS.tertiary}
                        fillOpacity={1}
                        fill="url(#colorHatch)"
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest breeding events and milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <Info className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No Recent Activity
                  </h3>
                  <p className="text-center text-muted-foreground">
                    Start creating breeding pairs to track activity
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {analyticsData.recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div className="bg-primary/10 p-2 rounded-full">
                        {activity.type === "pair" ? (
                          <Heart className="h-4 w-4 text-primary" />
                        ) : activity.type === "hatch" ? (
                          <Egg className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Calendar className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">
                          {activity.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {activity.description}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {activity.date}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Success Rate by Month */}
          <Card>
            <CardHeader>
              <CardTitle>Success Rate by Month</CardTitle>
              <CardDescription>
                Monthly breeding success rate trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.monthlyPerformance}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="successRate"
                      name="Success Rate"
                      fill="#FF9F40"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Hatch Rate by Month */}
          <Card>
            <CardHeader>
              <CardTitle>Hatch Rate by Month</CardTitle>
              <CardDescription>
                Monthly hatching success rate trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.monthlyPerformance}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="hatchRate" name="Hatch Rate" fill="#36A2EB" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Breeding Outcomes */}
          <Card>
            <CardHeader>
              <CardTitle>Breeding Outcomes</CardTitle>
              <CardDescription>
                Distribution of breeding results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.breedingOutcomes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(analyticsData.breedingOutcomes || []).map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breeds" className="space-y-6">
          {/* Breed Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Breed Distribution</CardTitle>
              <CardDescription>Active breeding pairs by breed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.breedDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(analyticsData.breedDistribution || []).map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Success Rate by Breed */}
          <Card>
            <CardHeader>
              <CardTitle>Success Rate by Breed</CardTitle>
              <CardDescription>
                Compare breeding success across breeds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.successRateByBreed || []}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="successRate"
                      name="Success Rate (%)"
                      fill="#4BC0C0"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Breed Combinations */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Combinations</CardTitle>
              <CardDescription>
                Most successful breeding combinations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(analyticsData.topCombinations || []).map((combo, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">
                          {combo.breed1} × {combo.breed2}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {combo.pairsCount} pairs
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {combo.successRate}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Success rate
                        </p>
                      </div>
                      <div
                        className="w-2 h-10 rounded-full"
                        style={{
                          background: `linear-gradient(to top, #4BC0C0 ${combo.successRate}%, transparent ${combo.successRate}%)`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BreedingAnalytics;
