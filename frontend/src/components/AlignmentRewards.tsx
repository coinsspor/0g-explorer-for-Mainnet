import { useState } from 'react';
import { AlignmentWalletSearch } from './AlignmentWalletSearch';
import { AlignmentNFTList } from './AlignmentNFTList';

export function AlignmentRewards() {
  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#000000',
      position: 'relative',
      isolation: 'isolate'
    }}>
      {/* Animated gradient background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(to bottom right, rgba(88, 28, 135, 0.2), #000000, rgba(29, 78, 216, 0.2))',
        zIndex: 0
      }}></div>
      
      {/* Glow effects */}
      <div style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 1
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '800px',
          background: 'rgba(147, 51, 234, 0.3)',
          borderRadius: '50%',
          filter: 'blur(100px)'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '600px',
          height: '600px',
          background: 'rgba(37, 99, 235, 0.2)',
          borderRadius: '50%',
          filter: 'blur(100px)'
        }}></div>
      </div>
      
      <div style={{ position: 'relative', zIndex: 10 }} className="container mx-auto px-4 py-12">
        <header className="text-center mb-16">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div style={{
                position: 'absolute',
                inset: '-4px',
                background: 'linear-gradient(to right, rgb(147, 51, 234), rgb(37, 99, 235))',
                borderRadius: '50%',
                filter: 'blur(8px)',
                opacity: 0.75,
                transition: 'opacity 1s'
              }} className="group-hover:opacity-100"></div>
              <img 
                src="/logo.png" 
                alt="0G Logo" 
                style={{
                  position: 'relative',
                  width: '128px',
                  height: '128px',
                  borderRadius: '50%',
                  border: '2px solid rgba(255, 255, 255, 0.1)'
                }}
              />
            </div>
          </div>
          
          {/* Title */}
          <h1 className="mb-6">
            <div style={{
              fontSize: '4.5rem',
              fontWeight: 900,
              marginBottom: '0.5rem',
              background: 'linear-gradient(to right, rgb(192, 132, 252), rgb(249, 168, 212), rgb(147, 197, 253))',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent'
            }}>
              0G AI Alignment
            </div>
            <div style={{
              fontSize: '3rem',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              Node Dashboard
            </div>
          </h1>
          
          <p style={{
            color: 'rgb(156, 163, 175)',
            fontSize: '1.25rem',
            maxWidth: '672px',
            margin: '0 auto 2rem'
          }}>
            Monitor your 0G Lunarian delegations and rewards in real-time
          </p>
          
          {/* Status badges */}
          <div className="flex justify-center gap-4">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '9999px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                background: 'rgb(34, 197, 94)',
                borderRadius: '50%',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}></div>
              <span style={{ color: 'rgb(74, 222, 128)', fontWeight: 600 }}>Live on 0G Network</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '9999px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                background: 'rgb(59, 130, 246)',
                borderRadius: '50%'
              }}></div>
              <span style={{ color: 'rgb(96, 165, 250)', fontWeight: 600 }}>Mainnet Active</span>
            </div>
          </div>
        </header>
        
        <AlignmentWalletSearch 
          onSearch={setWalletData} 
          setLoading={setLoading}
        />
        
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div style={{
                width: '80px',
                height: '80px',
                border: '4px solid rgba(168, 85, 247, 0.2)',
                borderRadius: '50%'
              }}></div>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '80px',
                height: '80px',
                border: '4px solid rgb(168, 85, 247)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            </div>
            <p style={{ marginTop: '1.5rem', color: 'rgb(156, 163, 175)', fontSize: '1.125rem' }}>
              Fetching NFT data from 0G Network...
            </p>
          </div>
        )}
        
        {walletData && !loading && (
          <AlignmentNFTList data={walletData} />
        )}
        
        {/* Footer */}
        <footer style={{ 
          textAlign: 'center', 
          marginTop: '5rem', 
          paddingBottom: '2rem', 
          color: 'rgb(107, 114, 128)', 
          fontSize: '0.875rem' 
        }}>
          <p>Powered by 0G Foundation • Built for the community</p>
        </footer>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}