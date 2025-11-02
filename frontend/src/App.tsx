import { useState, useEffect } from 'react';
import { Providers } from './providers';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Validators } from './components/Validators';
import { Uptime } from './components/Uptime';
import { Blocks } from './components/Blocks';
import { BlockDetail } from './components/BlockDetail';
import { Transactions } from './components/Transactions';
import { TransactionDetail } from './components/TransactionDetail';
import { WalletDetail } from './components/WalletDetail';
import { Staking } from './components/Staking';
import { Governance } from './components/Governance';
import { RPCMonitoring } from './components/RPCMonitoring';
import ContractChecker from './components/ContractChecker';
import { ContractDeployment } from './components/ContractDeployment';
import { AlignmentRewards } from './components/AlignmentRewards';
import { Storage } from './components/Storage'; // ⭐ YENİ IMPORT
import { Toaster } from 'sonner';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [blockHash, setBlockHash] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [tokenAddress, setTokenAddress] = useState<string | null>(null);
  const [previousPage, setPreviousPage] = useState('');

  const handleTransactionDetail = (hash: string) => {
    setPreviousPage(currentPage);
    setTransactionHash(hash);
    setCurrentPage('transactionDetail');
  };

  const handleWalletDetail = (address: string) => {
    setPreviousPage(currentPage);
    setWalletAddress(address);
    setCurrentPage('walletDetail');
  };

  const handleBackToTransactions = () => {
    setCurrentPage('transactions');
    setTransactionHash(null);
  };
  
  const handleBackToContractChecker = () => {
    setCurrentPage('contract-checker');
    setTransactionHash(null);
  };

  const handleTokenDetail = (address: string) => {
    setTokenAddress(address);
    setCurrentPage('tokenDetail');
  };

  const handleBackToContractDeployment = () => {
    setCurrentPage('contract-deployment');
    setTokenAddress(null);
  };

  useEffect(() => {
    const handleNavigateToTransaction = (event: CustomEvent) => {
      if (event.detail.fromBlock) {
        setPreviousPage('blockDetail');
        setTransactionHash(event.detail.hash);
        setCurrentPage('transactionDetail');
      } else {
        setBlockHash(event.detail.hash);
        setCurrentPage('blockDetail');
        setPreviousPage('blocks');
      }
    };
    
    window.addEventListener('navigateToTransaction' as any, handleNavigateToTransaction);
    return () => {
      window.removeEventListener('navigateToTransaction' as any, handleNavigateToTransaction);
    };
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'validators':
        return <Validators />;
      case 'uptime':
        return <Uptime />;
      case 'blocks':
        return <Blocks />;
      case 'blockDetail':
        return <BlockDetail 
          hash={blockHash} 
          onBack={() => {
            setCurrentPage('blocks');
            setBlockHash(null);
          }} 
        />;
      case 'transactions':
        return <Transactions 
          onViewDetails={handleTransactionDetail}
          onViewWallet={handleWalletDetail}
        />;
      case 'transactionDetail':
        return <TransactionDetail 
          hash={transactionHash} 
          onBack={() => {
            if (previousPage === 'contract-checker') {
              setCurrentPage('contract-checker');
            } else if (previousPage === 'blockDetail') {
              setCurrentPage('blockDetail');
            } else if (previousPage === 'blocks') {
              setCurrentPage('blocks');
            } else if (previousPage === 'walletDetail') {
              setCurrentPage('walletDetail');
            } else {
              setCurrentPage('transactions');
            }
            setTransactionHash(null);
            setPreviousPage('');
          }} 
        />;
      case 'walletDetail':
        return <WalletDetail 
          address={walletAddress}
          onBack={() => {
            if (previousPage === 'transactionDetail') {
              setCurrentPage('transactionDetail');
            } else {
              setCurrentPage('transactions');
            }
            setWalletAddress(null);
            setPreviousPage('');
          }}
          onViewTransaction={(hash: string) => {
            setPreviousPage('walletDetail');
            setTransactionHash(hash);
            setCurrentPage('transactionDetail');
          }}
        />;
      case 'storage': // ⭐ YENİ CASE
        return <Storage />;
      case 'staking':
        return <Staking />;
      case 'governance':
        return <Governance />;
      case 'rpc-monitoring':
        return <RPCMonitoring />;
      case 'contract-checker':
        return <ContractChecker onViewDetails={handleTransactionDetail} />;
      case 'contract-deployment':
        return <ContractDeployment />;
      case 'alignment-rewards':
        return <AlignmentRewards />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Providers>
      <div className="min-h-screen bg-background">
        <Header currentPage={currentPage} onPageChange={setCurrentPage} />
        <main className="min-h-screen">
          {renderPage()}
        </main>
        <Toaster 
          position="top-right" 
          richColors 
          closeButton
          duration={5000}
        />
      </div>
    </Providers>
  );
}