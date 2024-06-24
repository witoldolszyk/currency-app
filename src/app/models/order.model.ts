export interface Order {
    symbol: string;
    id: number;
    side: string;
    size: number;
    openTime: string;
    openPrice: number;
    swap: number;
    closePrice: number;
    profit: number; 
  }
  