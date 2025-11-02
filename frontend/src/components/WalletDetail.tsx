import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  ArrowLeft, 
  Copy, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Activity,
  Coins,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface WalletDetailProps {
  address: string | null;
  onBack: () => void;
  onViewTransaction?: (hash: string) => void;
}

interface WalletInfo {
  address: string;
  balance: string;
  balanceRaw: string;
  transactionCount: number;
  isContract: boolean;
  type: string;
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  direction: 'sent' | 'received';
  type: string;
  block: number;
  timeAgo: string;
  timestamp: string;
  status: string;
  fee: string;
  fullHash: string;
  fullFrom: string;
  fullTo: string;
}

interface Token {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  displayBalance: string;
  decimals: number;
}

export function WalletDetail({ address, onBack, onViewTransaction }: WalletDetailProps) {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (address) {
      fetchWalletDetails();
      fetchTokens();
    }
  }, [address, page]);

  const fetchWalletDetails = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/wallet/${address}?page=${page}&limit=20`);
      const data = await response.json();
      
      if (data.success) {
        setWallet(data.wallet);
        setTransactions(data.transactions || []);
        setHasMore(data.pagination?.hasMore || false);
      } else {
        setError(data.error || 'Failed to fetch wallet details');
      }
    } catch (err) {
      setError('Failed to fetch wallet details');
      console.error('Wallet fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTokens = async () => {
    if (!address) return;
    
    try {
      setLoadingTokens(true);
      const response = await fetch(`/api/wallet/${address}/tokens`);
      const data = await response.json();
      
      if (data.success) {
        setTokens(data.tokens || []);
      }
    } catch (err) {
      console.error('Token fetch error:', err);
    } finally {
      setLoadingTokens(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchWalletDetails();
    fetchTokens();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatValue = (value: string) => {
    if (value === '—' || !value) return '—';
    return value;
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'sent' ? (
      <TrendingUp className="h-4 w-4 text-red-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-green-500" />
    );
  };

  const getDirectionBadge = (direction: string) => {
    return direction === 'sent' ? (
      <Badge variant="outline" className="text-red-500 border-red-500">
        <ArrowUpRight className="h-3 w-3 mr-1" />
        Sent
      </Badge>
    ) : (
      <Badge variant="outline" className="text-green-500 border-green-500">
        <ArrowDownLeft className="h-3 w-3 mr-1" />
        Received
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    return status === 'Success' ? (
      <CheckCircle className="h-4 w-4 text-chart-4" />
    ) : status === 'Failed' ? (
      <XCircle className="h-4 w-4 text-destructive" />
    ) : (
      <Clock className="h-4 w-4 text-yellow-500" />
    );
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.direction === filter;
  });

  const stats = {
    sent: transactions.filter(tx => tx.direction === 'sent').length,
    received: transactions.filter(tx => tx.direction === 'received').length,
    total: transactions.length
  };

  if (loading && page === 1) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading wallet details...</div>
        </div>
      </div>
    );
  }

  if (error || !wallet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <p className="text-destructive mb-4">{error || 'Wallet not found'}</p>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Transactions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl gradient-text mb-2">Wallet Details</h1>
          <p className="text-muted-foreground">Complete overview of wallet activity and holdings</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Wallet Overview */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Wallet className="h-5 w-5" />
            <span>Wallet Overview</span>
            <Badge variant={wallet.isContract ? 'secondary' : 'default'}>
              {wallet.type}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Address</p>
            <div className="flex items-center gap-2">
              <code className="text-sm break-all">{wallet.address}</code>
              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(wallet.address)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Balance</p>
              <p className="text-2xl font-bold text-primary">{wallet.balance}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Transactions</p>
              <p className="text-2xl font-bold">{wallet.transactionCount}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-1">Account Type</p>
              <p className="text-2xl font-bold">{wallet.type}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-xl mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ArrowUpRight className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Sent</span>
            </div>
            <p className="text-xl mt-1">{stats.sent}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ArrowDownLeft className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Received</span>
            </div>
            <p className="text-xl mt-1">{stats.received}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Tokens</span>
            </div>
            <p className="text-xl mt-1">{tokens.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Token Holdings */}
      {tokens.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Token Holdings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Contract</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.map((token) => (
                    <TableRow key={token.address}>
                      <TableCell className="font-medium">{token.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{token.symbol}</Badge>
                      </TableCell>
                      <TableCell className="text-primary font-semibold">
                        {token.displayBalance}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">
                          {token.address.slice(0, 10)}...{token.address.slice(-8)}
                        </code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Transaction History</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
              >
                All ({stats.total})
              </Button>
              <Button
                size="sm"
                variant={filter === 'sent' ? 'default' : 'outline'}
                onClick={() => setFilter('sent')}
              >
                Sent ({stats.sent})
              </Button>
              <Button
                size="sm"
                variant={filter === 'received' ? 'default' : 'outline'}
                onClick={() => setFilter('received')}
              >
                Received ({stats.received})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Direction</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hash</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>From/To</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Block</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow key={tx.hash} className="hover:bg-muted/50">
                    <TableCell>{getDirectionBadge(tx.direction)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(tx.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{tx.hash}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{tx.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {tx.direction === 'sent' ? (
                        <span className="text-sm">
                          To: <code className="text-xs">{tx.to}</code>
                        </span>
                      ) : (
                        <span className="text-sm">
                          From: <code className="text-xs">{tx.from}</code>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className={tx.value === '—' ? 'text-muted-foreground' : tx.direction === 'sent' ? 'text-red-500' : 'text-green-500'}>
                      {tx.direction === 'sent' && tx.value !== '—' && '-'}
                      {tx.value}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">#{tx.block}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{tx.timeAgo}</span>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onViewTransaction?.(tx.fullHash)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {(hasMore || page > 1) && (
            <div className="flex justify-center items-center gap-4 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore || loading}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
