import { useState } from 'react';
import { Search, Wallet, AlertCircle } from 'lucide-react';

interface AlignmentWalletSearchProps {
  onSearch: (data: any) => void;
  setLoading: (loading: boolean) => void;
}

export function AlignmentWalletSearch({ onSearch, setLoading }: AlignmentWalletSearchProps) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!address) {
      setError('Please enter a wallet address');
      return;
    }
    
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Invalid wallet address format');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('https://alignment-node-subgraph.0g.ai/subgraphs/name/alignment-node', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query getOperator($account: String!) {
              delegator(id: $account) {
                nfts(orderBy: tokenId, first: 1000) {
                  id
                  tokenId
                  delegatedTime
                  approvedTime
                  undelegatedTime
                  totalReward
                  operator {
                    id
                    naas {
                      id
                      name
                      avatar
                    }
                  }
                }
              }
            }
          `,
          variables: { account: address.toLowerCase() }
        })
      });

      const result = await response.json();
      console.log('API Response:', result);

      if (result.data && result.data.delegator && result.data.delegator.nfts && result.data.delegator.nfts.length > 0) {
        onSearch(result.data);
      } else {
        setError(`No NFT delegations found for address: ${address}`);
        onSearch(null);
      }
    } catch (err) {
      setError('Failed to fetch data from 0G Network');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '768px', margin: '0 auto' }}>
      <form onSubmit={handleSearch}>
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '4px',
            backdropFilter: 'blur(12px)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              flex: 1, 
              paddingLeft: '16px', 
              paddingRight: '16px' 
            }}>
              <Wallet style={{ 
                width: '20px', 
                height: '20px', 
                color: 'rgb(107, 114, 128)', 
                marginRight: '12px' 
              }} />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter wallet address (0x...)"
                style={{
                  width: '100%',
                  background: 'transparent',
                  paddingTop: '16px',
                  paddingBottom: '16px',
                  color: '#ffffff',
                  fontSize: '1.125rem',
                  border: 'none',
                  outline: 'none'
                }}
              />
              <style>{`
                input::placeholder {
                  color: rgb(107, 114, 128);
                }
              `}</style>
            </div>
            
            <button
              type="submit"
              style={{
                background: 'linear-gradient(to right, rgb(147, 51, 234), rgb(37, 99, 235))',
                color: '#ffffff',
                fontWeight: 700,
                paddingLeft: '32px',
                paddingRight: '32px',
                paddingTop: '16px',
                paddingBottom: '16px',
                borderRadius: '12px',
                transition: 'all 0.2s',
                transform: 'scale(1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, rgb(126, 34, 206), rgb(29, 78, 216))';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, rgb(147, 51, 234), rgb(37, 99, 235))';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Search style={{ width: '20px', height: '20px' }} />
              <span>Search</span>
            </button>
          </div>
        </div>
      </form>
      
      {error && (
        <div style={{
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px'
        }}>
          <AlertCircle style={{ width: '20px', height: '20px', color: 'rgb(248, 113, 113)' }} />
          <span style={{ color: 'rgb(248, 113, 113)' }}>{error}</span>
        </div>
      )}
      
      <div style={{ 
        textAlign: 'center', 
        marginTop: '24px', 
        color: 'rgb(107, 114, 128)', 
        fontSize: '0.875rem' 
      }}>
        Enter any wallet address to check 0G Lunarian delegations
      </div>
    </div>
  );
}