import { useState, useEffect } from 'react';
import { HardDrive, Upload, Users, Award, TrendingUp, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StorageStats {
  totalStorageSize: string;
  totalFiles: number;
  activeUploaders: number;
  activeMiners: number;
  totalFees: string;
  currentGasFee: string;
  avgRewards24h: string;
}

interface TopMiner {
  rank: number;
  address: string;
  totalRewards: string;
  totalRewardsUSD: string;
}

interface RecentFile {
  sequence: number;
  sizeKB: number;
  baseFee: string;
  age: string;
}

export function StorageOverview() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [topMiners, setTopMiners] = useState<TopMiner[]>([]);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [miningChart, setMiningChart] = useState<any[]>([]);
  const [storageChart, setStorageChart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, minersRes, filesRes, miningChartRes, storageChartRes] = await Promise.all([
        fetch('/api/storage/stats'),
        fetch('/api/storage/top-miners?limit=5'),
        fetch('/api/storage/recent-files?limit=5'),
        fetch('/api/storage/charts/mining-rewards?period=7d'),
        fetch('/api/storage/charts/storage-size?period=30d')
      ]);

      const statsData = await statsRes.json();
      const minersData = await minersRes.json();
      const filesData = await filesRes.json();
      const miningData = await miningChartRes.json();
      const storageData = await storageChartRes.json();

      setStats(statsData.data);
      setTopMiners(minersData.data.miners);
      setRecentFiles(filesData.data.files);
      setMiningChart(miningData.data.data);
      setStorageChart(storageData.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching storage data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-cyan-500/20 hover:border-cyan-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Miners</CardTitle>
            <Award className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-400">{stats?.activeMiners || 0}</div>
            <p className="text-xs text-muted-foreground">Mining nodes</p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 hover:border-purple-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
            <Database className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{stats?.totalStorageSize || '0'} GB</div>
            <p className="text-xs text-muted-foreground">{stats?.totalFiles.toLocaleString() || 0} files</p>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/20 hover:border-cyan-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gas Fee (Base)</CardTitle>
            <TrendingUp className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-400">{stats?.currentGasFee || '0'}</div>
            <p className="text-xs text-muted-foreground">0G per transaction</p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 hover:border-purple-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Avg Rewards</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{stats?.avgRewards24h || '0'}</div>
            <p className="text-xs text-muted-foreground">0G per block</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mining Rewards Chart */}
        <Card className="border-cyan-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-cyan-500" />
              Mining Rewards (7 Days)
            </CardTitle>
            <CardDescription>Total mining rewards over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={miningChart}>
                <defs>
                  <linearGradient id="colorRewards" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="label" 
                  stroke="#888"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#888"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #06b6d4',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRewards)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Storage Size Chart */}
        <Card className="border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-500" />
              Storage Growth (30 Days)
            </CardTitle>
            <CardDescription>Total data uploaded over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={storageChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="label" 
                  stroke="#888"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#888"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #a855f7',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#a855f7" 
                  strokeWidth={3}
                  dot={{ fill: '#a855f7', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Miners */}
        <Card className="border-cyan-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-cyan-500" />
              Top Miners
            </CardTitle>
            <CardDescription>Highest earning storage miners</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topMiners.map((miner) => (
                <div 
                  key={miner.rank}
                  className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border hover:border-cyan-500/40 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold text-sm">
                      #{miner.rank}
                    </div>
                    <div>
                      <div className="font-mono text-sm text-cyan-400">
                        {miner.address.slice(0, 6)}...{miner.address.slice(-4)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-white">{miner.totalRewards} 0G</div>
                    <div className="text-xs text-muted-foreground">${miner.totalRewardsUSD}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Files */}
        <Card className="border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-purple-500" />
              Recent Files
            </CardTitle>
            <CardDescription>Latest uploaded files</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentFiles.map((file) => (
                <div 
                  key={file.sequence}
                  className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border hover:border-purple-500/40 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold text-xs">
                      #{file.sequence}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{file.sizeKB.toFixed(2)} KB</div>
                      <div className="text-xs text-muted-foreground">{file.age}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-purple-400">{file.baseFee} 0G</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
