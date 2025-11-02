import { useState } from 'react';
import { HardDrive, Users, Files } from 'lucide-react';
import { Button } from './ui/button';
import { StorageOverview } from './StorageOverview';
import { StorageAccounts } from './StorageAccounts';
import { StorageFiles } from './StorageFiles';

export function Storage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'files'>('overview');

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: HardDrive },
    { id: 'accounts' as const, label: 'Accounts', icon: Users },
    { id: 'files' as const, label: 'Files', icon: Files },
  ];

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            0G Storage Network
          </span>
        </h1>
        <p className="text-muted-foreground">
          Decentralized storage infrastructure - Upload, store, and retrieve data on the 0G Network
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-b-none ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white glow-effect'
                  : 'hover:bg-primary/10'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'overview' && <StorageOverview />}
        {activeTab === 'accounts' && <StorageAccounts />}
        {activeTab === 'files' && <StorageFiles />}
      </div>
    </div>
  );
}
