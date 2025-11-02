import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

// 0G Mainnet Configuration
const ogMainnet = {
  id: 16661,
  name: '0G Newton', // Mainnet ismi
  nativeCurrency: {
    decimals: 18,
    name: '0G',
    symbol: 'OG',
  },
  rpcUrls: {
    default: { 
      http: ['https://evmrpc.0g.ai']
    },
    public: { 
      http: ['https://evmrpc.0g.ai']
    },
  },
  blockExplorers: {
    default: { 
      name: '0G Explorer', 
      url: 'https://chainscan.0g.ai' // Doğru explorer URL
    },
  },
  testnet: false,
};

const config = getDefaultConfig({
  appName: 'Coinsspor Node Center',
  projectId: '3ee0b4b50a76fff68865e46d67f1bb00',
  chains: [ogMainnet], // ogTestnet yerine ogMainnet
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#00d4ff',
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}