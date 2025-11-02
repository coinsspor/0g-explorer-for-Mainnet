import { Wallet, Clock, Award, ExternalLink, CheckCircle, Image } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AlignmentNFTListProps {
  data: any;
}

export function AlignmentNFTList({ data }: AlignmentNFTListProps) {
  const [nftImages, setNftImages] = useState<{[key: string]: string}>({});
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const formatDate = (timestamp: string) => {
    if (!timestamp || timestamp === '0') return 'N/A';
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  const formatReward = (reward: string) => {
    const value = parseFloat(reward) / Math.pow(10, 18);
    return value.toFixed(4);
  };

  const nfts = data?.delegator?.nfts || [];

  const totalReward = nfts.reduce((sum: number, nft: any) => {
    return sum + parseFloat(nft.totalReward) / Math.pow(10, 18);
  }, 0);

  useEffect(() => {
    const fetchNFTImages = async () => {
      const images: {[key: string]: string} = {};
      for (const nft of nfts) {
        try {
          const response = await fetch(`https://node-sale-nft.0g.ai/uri/${nft.tokenId}`);
          const metadata = await response.json();
          if (metadata.image) {
            images[nft.tokenId] = metadata.image;
          }
        } catch (error) {
          console.log(`Failed to fetch image for NFT #${nft.tokenId}`);
        }
      }
      setNftImages(images);
    };
    
    if (nfts.length > 0) {
      fetchNFTImages();
    }
  }, [nfts]);

  if (!nfts || nfts.length === 0) {
    return null;
  }

  return (
    <div style={{ 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: '32px' 
    }}>
      {/* Stats Overview */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '16px', 
        maxWidth: '896px', 
        width: '100%' 
      }}>
        <div style={{
          background: 'linear-gradient(to bottom right, rgba(147, 51, 234, 0.2), rgba(126, 34, 206, 0.2))',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <div style={{ color: 'rgb(192, 132, 252)', fontSize: '0.875rem', marginBottom: '8px' }}>Total NFTs</div>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#ffffff' }}>{nfts.length}</div>
        </div>
        <div style={{
          background: 'linear-gradient(to bottom right, rgba(37, 99, 235, 0.2), rgba(29, 78, 216, 0.2))',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <div style={{ color: 'rgb(96, 165, 250)', fontSize: '0.875rem', marginBottom: '8px' }}>Total Rewards</div>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#ffffff' }}>{totalReward.toFixed(4)} 0G</div>
        </div>
        <div style={{
          background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <div style={{ color: 'rgb(74, 222, 128)', fontSize: '0.875rem', marginBottom: '8px' }}>Status</div>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle style={{ width: '24px', height: '24px', color: 'rgb(74, 222, 128)' }} />
            Active
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(to bottom right, rgba(236, 72, 153, 0.2), rgba(219, 39, 119, 0.2))',
          border: '1px solid rgba(236, 72, 153, 0.3)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <div style={{ color: 'rgb(244, 114, 182)', fontSize: '0.875rem', marginBottom: '8px' }}>Avg Reward</div>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#ffffff' }}>{(totalReward / nfts.length).toFixed(4)} 0G</div>
        </div>
      </div>

      {/* NFT List Header */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
          Your 0G Lunarians
        </h2>
        <p style={{ color: 'rgb(156, 163, 175)' }}>
          Showing {nfts.length} delegated NFT{nfts.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* NFT Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '24px', 
        maxWidth: '1280px', 
        width: '100%',
        placeItems: 'center'
      }}>
        {nfts.map((nft: any) => (
          <div 
            key={nft.id} 
            style={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: '384px' 
            }}
            onMouseEnter={() => setHoveredCard(nft.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {hoveredCard === nft.id && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to right, rgb(147, 51, 234), rgb(37, 99, 235))',
                borderRadius: '16px',
                filter: 'blur(16px)',
                opacity: 0.75,
                transition: 'opacity 0.3s'
              }}></div>
            )}
            
            <div style={{
              position: 'relative',
              background: 'rgba(31, 41, 55, 0.8)',
              backdropFilter: 'blur(8px)',
              borderRadius: '16px',
              overflow: 'hidden',
              border: hoveredCard === nft.id ? '1px solid rgb(168, 85, 247)' : '1px solid rgb(55, 65, 81)',
              transition: 'all 0.3s'
            }}>
              {/* NFT Image */}
              <div style={{
                position: 'relative',
                height: '256px',
                background: 'linear-gradient(to bottom right, rgba(147, 51, 234, 0.2), rgba(37, 99, 235, 0.2))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {nftImages[nft.tokenId] ? (
                  <img 
                    src={nftImages[nft.tokenId]}
                    alt={`0G Lunarian #${nft.tokenId}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'rgb(156, 163, 175)' 
                  }}>
                    <Image style={{ width: '48px', height: '48px', marginBottom: '8px' }} />
                    <span>Loading NFT...</span>
                  </div>
                )}
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  padding: '4px 12px',
                  background: 'rgba(0, 0, 0, 0.7)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '9999px',
                  color: '#ffffff',
                  fontWeight: 700
                }}>
                  #{nft.tokenId}
                </div>
              </div>

              <div style={{ padding: '24px' }}>
                {/* NFT Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                      Lunarian #{nft.tokenId}
                    </h3>
                    <p style={{ color: 'rgb(156, 163, 175)', fontSize: '0.875rem' }}>AI Alignment Node</p>
                  </div>
                  <a 
                    href={`https://opensea.io/assets/arbitrum/0xd0f4e1265edd221b5bb0e8667a59f31b587b2197/${nft.tokenId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '8px',
                      background: 'rgba(168, 85, 247, 0.2)',
                      borderRadius: '8px',
                      transition: 'background 0.2s',
                      display: 'inline-block'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.3)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)'}
                  >
                    <ExternalLink style={{ width: '16px', height: '16px', color: 'rgb(192, 132, 252)' }} />
                  </a>
                </div>

                {/* NFT Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                    <Clock style={{ width: '16px', height: '16px', color: 'rgb(96, 165, 250)' }} />
                    <span style={{ color: 'rgb(156, 163, 175)' }}>Delegated:</span>
                    <span style={{ fontWeight: 500, color: '#ffffff' }}>{formatDate(nft.delegatedTime)}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                    <CheckCircle style={{ width: '16px', height: '16px', color: 'rgb(74, 222, 128)' }} />
                    <span style={{ color: 'rgb(156, 163, 175)' }}>Approved:</span>
                    <span style={{ fontWeight: 500, color: '#ffffff' }}>{formatDate(nft.approvedTime)}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                    <Wallet style={{ width: '16px', height: '16px', color: 'rgb(192, 132, 252)' }} />
                    <span style={{ color: 'rgb(156, 163, 175)' }}>Operator:</span>
                    <span style={{ fontWeight: 500, color: '#ffffff', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {nft.operator?.naas?.name || nft.operator?.id?.slice(0, 8) + '...' || 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* Reward Section */}
                <div style={{ paddingTop: '16px', borderTop: '1px solid rgb(55, 65, 81)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgb(156, 163, 175)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award style={{ width: '16px', height: '16px' }} />
                      Total Reward
                    </span>
                    <span style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      background: 'linear-gradient(to right, rgb(192, 132, 252), rgb(147, 197, 253))',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      {formatReward(nft.totalReward)} 0G
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media (min-width: 768px) {
          div[style*="gridTemplateColumns: repeat(2"] {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}