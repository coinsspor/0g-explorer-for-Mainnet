import { useState, useEffect } from 'react';
import { Upload, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface Uploader {
  rank: number;
  address: string;
  uploadCount: number;
  totalSizeGB: string;
  sizePercentage: string;
  baseFee: string;
  baseFeeUSD: string;
  lastUploadAge: string;
}

interface Miner {
  rank: number;
  address: string;
  totalRewards: string;
  totalRewardsUSD: string;
  rewards24h: string;
  rewards7d: string;
  rewards30d: string;
}

export function StorageAccounts() {
  const [activeTab, setActiveTab] = useState<'uploaders' | 'miners'>('uploaders');
  const [uploaders, setUploaders] = useState<Uploader[]>([]);
  const [miners, setMiners] = useState<Miner[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 25;

  useEffect(() => {
    fetchData();
  }, [activeTab, currentPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'uploaders' ? '/api/storage/uploaders' : '/api/storage/miners';
      const response = await fetch(`${endpoint}?page=${currentPage}&limit=${limit}`);
      const data = await response.json();

      if (activeTab === 'uploaders') {
        setUploaders(data.data.uploaders);
      } else {
        setMiners(data.data.miners);
      }
      setTotalPages(data.data.totalPages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setLoading(false);
    }
  };

  const renderUploaders = () => (
    <div className="space-y-4">
      {uploaders.map((uploader) => (
        <Card 
          key={uploader.address} 
          className="border-cyan-500/20 hover:border-cyan-500/40 transition-all"
        >
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              {/* Rank */}
              <div className="lg:col-span-1">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold">
                  #{uploader.rank}
                </div>
              </div>

              {/* Address */}
              <div className="lg:col-span-3">
                <div className="font-mono text-sm text-cyan-400 mb-1">
                  {uploader.address.slice(0, 10)}...{uploader.address.slice(-8)}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {uploader.uploadCount} uploads
                </Badge>
              </div>

              {/* Size with Progress Bar */}
              <div className="lg:col-span-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-400 font-semibold">{uploader.totalSizeGB} GB</span>
                    <span className="text-cyan-400">{uploader.sizePercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${uploader.sizePercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Fees */}
              <div className="lg:col-span-2 text-center">
                <div className="text-lg font-bold text-white">{uploader.baseFee} 0G</div>
                <div className="text-xs text-muted-foreground">${uploader.baseFeeUSD}</div>
              </div>

              {/* Last Upload */}
              <div className="lg:col-span-2 text-right">
                <div className="text-sm text-muted-foreground">{uploader.lastUploadAge}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderMiners = () => (
    <div className="space-y-4">
      {miners.map((miner) => (
        <Card 
          key={miner.address}
          className="border-purple-500/20 hover:border-purple-500/40 transition-all"
        >
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              {/* Rank */}
              <div className="lg:col-span-1">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold">
                  #{miner.rank}
                </div>
              </div>

              {/* Address */}
              <div className="lg:col-span-3">
                <div className="font-mono text-sm text-purple-400 mb-1">
                  {miner.address.slice(0, 10)}...{miner.address.slice(-8)}
                </div>
                <Badge variant="secondary" className="text-xs">
                  Mining Node
                </Badge>
              </div>

              {/* Total Rewards */}
              <div className="lg:col-span-2 text-center">
                <div className="text-sm text-muted-foreground mb-1">Total Rewards</div>
                <div className="text-lg font-bold text-purple-400">{miner.totalRewards} 0G</div>
                <div className="text-xs text-muted-foreground">${miner.totalRewardsUSD}</div>
              </div>

              {/* 24H Rewards */}
              <div className="lg:col-span-2 text-center">
                <div className="text-sm text-muted-foreground mb-1">24H</div>
                <div className="text-sm font-semibold text-cyan-400">{miner.rewards24h} 0G</div>
              </div>

              {/* 7D Rewards */}
              <div className="lg:col-span-2 text-center">
                <div className="text-sm text-muted-foreground mb-1">7D</div>
                <div className="text-sm font-semibold text-cyan-400">{miner.rewards7d} 0G</div>
              </div>

              {/* 30D Rewards */}
              <div className="lg:col-span-2 text-center">
                <div className="text-sm text-muted-foreground mb-1">30D</div>
                <div className="text-sm font-semibold text-purple-400">{miner.rewards30d} 0G</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-2">
        <Button
          variant={activeTab === 'uploaders' ? 'default' : 'outline'}
          onClick={() => {
            setActiveTab('uploaders');
            setCurrentPage(1);
          }}
          className={activeTab === 'uploaders' ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : ''}
        >
          <Upload className="w-4 h-4 mr-2" />
          Uploaders
        </Button>
        <Button
          variant={activeTab === 'miners' ? 'default' : 'outline'}
          onClick={() => {
            setActiveTab('miners');
            setCurrentPage(1);
          }}
          className={activeTab === 'miners' ? 'bg-gradient-to-r from-purple-500 to-cyan-500' : ''}
        >
          <Award className="w-4 h-4 mr-2" />
          Miners
        </Button>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {activeTab === 'uploaders' ? (
              <>
                <Upload className="h-5 w-5 text-cyan-500" />
                Storage Uploaders
              </>
            ) : (
              <>
                <Award className="h-5 w-5 text-purple-500" />
                Storage Miners
              </>
            )}
          </CardTitle>
          <CardDescription>
            {activeTab === 'uploaders' 
              ? 'Accounts that have uploaded data to the storage network'
              : 'Mining nodes providing storage services and earning rewards'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeTab === 'uploaders' ? renderUploaders() : renderMiners()}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
