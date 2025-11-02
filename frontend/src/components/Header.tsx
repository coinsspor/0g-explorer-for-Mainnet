import { useState } from 'react';
import { Menu, X, Server, Shield, BarChart, Award, HardDrive } from 'lucide-react';
import { Button } from './ui/button';
import { ConnectWalletButton } from './ConnectWalletButton';

interface HeaderProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Header({ currentPage, onPageChange }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: null },
    { id: 'validators', label: 'Validators', icon: null },
    { id: 'uptime', label: 'Uptime', icon: null },
    { id: 'blocks', label: 'Blocks', icon: null },
    { id: 'transactions', label: 'Transactions', icon: null },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'staking', label: 'Staking', icon: null },
    { id: 'governance', label: 'Governance', icon: null },
    { id: 'rpc-monitoring', label: 'RPC Scanner', icon: Server },
    { id: 'contract-checker', label: 'Token Explorer', icon: Shield },
    { id: 'contract-deployment', label: 'Contract Deploy', icon: BarChart },
    { id: 'alignment-rewards', label: 'AI Node Rewards', icon: Award },
  ];

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      {/* ⭐ Container max-width artırıldı */}
      <div className="mx-auto px-4 max-w-[1800px] h-20 flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center space-x-3 shrink-0">
          <img 
            src="/logo.png" 
            alt="0G Network" 
            className="h-10 w-12 object-contain flex-shrink-0"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div 
            className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 rounded-full items-center justify-center hidden"
            style={{ display: 'none' }}
          >
            <span className="text-white font-bold text-lg">0G</span>
          </div>
          <span className="text-lg font-semibold whitespace-nowrap hidden sm:block">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Explorer
            </span>
          </span>
        </div>

        {/* Desktop Navigation - ⭐ DAHA GENİŞ SPACING! */}
        <nav className="hidden lg:flex items-center space-x-2.5 flex-1 justify-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={currentPage === item.id ? 'default' : 'ghost'}
                onClick={() => onPageChange(item.id)}
                className={`text-xs px-3 ${currentPage === item.id ? 'bg-primary text-primary-foreground glow-effect' : 'hover:bg-primary/10'}`}
                size="sm"
              >
                {Icon && <Icon className="w-3 h-3 mr-1.5" />}
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* Right Section - Wallet */}
        <div className="flex items-center space-x-2 shrink-0">
          <ConnectWalletButton />
          
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden bg-card border-t border-border p-4">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? 'default' : 'ghost'}
                  onClick={() => {
                    onPageChange(item.id);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full justify-start ${
                    currentPage === item.id ? 'bg-primary text-primary-foreground' : ''
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4 mr-2" />}
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}