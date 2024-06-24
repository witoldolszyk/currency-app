import { Order } from './order.model';

export interface OrderGroup {
  symbol: string;
  orders: Order[];
  openPrice: number;
  swap: number;
  profit: number;
  size: number;
  orderCount: number;
  showDetails?: boolean;
}
