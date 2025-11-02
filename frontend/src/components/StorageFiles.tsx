import { useState, useEffect } from 'react';
import { Files, Download, ChevronLeft, ChevronRight, HardDrive, Upload, Users, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface StorageFile {
  sequence: number;
  txHash: string;
  age: string;
  uploader: string;
  sizeKB: number;
  baseFee: string;
  baseFeeUSD: string;
  downloadAvailable: boolean;
  status: string;
}

interface StorageStats {
  totalStorageSize: string;
  totalFiles: number;
  activeUploaders: number;
  totalFees: string;
}

export function StorageFiles() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 25;

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [filesRes, statsRes] = await Promise.all([
        fetch(`/api/storage/files?page=${currentPage}&limit=${limit}`),
        fetch('/api/storage/stats')
      ]);

      const filesData = await filesRes.json();
      const statsData = await statsRes.json();

      setFiles(filesData.data.files);
      setTotalPages(filesData.data.totalPages);
      setStats(statsData.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching files:', error);
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-cyan-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-400">{stats?.totalStorageSize || '0'} GB</div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upload Count</CardTitle>
            <Upload className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{stats?.totalFiles.toLocaleString() || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Uploaders</CardTitle>
            <Users className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-400">{stats?.activeUploaders || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{stats?.totalFees || '0'} 0G</div>
          </CardContent>
        </Card>
      </div>

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Files className="h-5 w-5 text-cyan-500" />
            Storage Submissions
          </CardTitle>
          <CardDescription>
            All files uploaded to the 0G Storage Network - Page {currentPage} of {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {files.map((file) => (
              <Card 
                key={file.sequence}
                className="border-border hover:border-cyan-500/40 transition-all bg-card/50"
              >
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    {/* Sequence */}
                    <div className="lg:col-span-1">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold text-xs">
                        #{file.sequence}
                      </div>
                    </div>

                    {/* TX Hash */}
                    <div className="lg:col-span-3">
                      <div className="text-xs text-muted-foreground mb-1">TX Hash</div>
                      <div className="font-mono text-sm text-cyan-400">
                        {file.txHash.slice(0, 8)}...{file.txHash.slice(-6)}
                      </div>
                    </div>

                    {/* Uploader */}
                    <div className="lg:col-span-2">
                      <div className="text-xs text-muted-foreground mb-1">Uploader</div>
                      <div className="font-mono text-sm text-purple-400">
                        {file.uploader.slice(0, 6)}...{file.uploader.slice(-4)}
                      </div>
                    </div>

                    {/* Size */}
                    <div className="lg:col-span-2 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Size</div>
                      <div className="text-sm font-semibold text-white">
                        {file.sizeKB.toFixed(2)} KB
                      </div>
                    </div>

                    {/* Fee */}
                    <div className="lg:col-span-2 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Base Fee</div>
                      <div className="text-sm font-semibold text-cyan-400">
                        {file.baseFee} 0G
                      </div>
                      <div className="text-xs text-muted-foreground">${file.baseFeeUSD}</div>
                    </div>

                    {/* Age & Download */}
                    <div className="lg:col-span-2 flex items-center justify-end gap-2">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-1">Age</div>
                        <div className="text-sm text-white">{file.age}</div>
                      </div>
                      {file.downloadAvailable && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-purple-400 hover:text-purple-300"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-cyan-500/20 hover:border-cyan-500/40"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="border-purple-500/20 hover:border-purple-500/40"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
