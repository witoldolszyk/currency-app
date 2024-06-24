import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Order } from '../models/order.model';
import { WebSocketService } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private url = 'https://geeksoft.pl/assets/order-data.json';
  private orders: Order[] = [];

  constructor(private http: HttpClient, private webSocketService: WebSocketService) {
    this.webSocketService.getMessages().subscribe(this.updatePrices.bind(this));
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<{ data: Order[] }>(this.url).pipe(
      map(response => {
        this.orders = response.data;
        return this.orders;
      })
    );
  }

  subscribeToSymbols(symbols: string[]): void {
    this.webSocketService.sendMessage({
      p: '/subscribe/addlist',
      d: symbols
    });
  }

  unsubscribeFromSymbols(symbols: string[]): void {
    this.webSocketService.sendMessage({
      p: '/subscribe/removelist',
      d: symbols
    });
  }

  private updatePrices(quotes: any[]): void {
    quotes.forEach(quote => {
      const symbol = quote.s;
      this.orders.forEach(order => {
        if (order.symbol === symbol) {
          order.profit = this.calculateProfit(order, quote.b);
        }
      });
    });
  }

  calculateProfit(order: Order, currentPrice: number): number {
    const multiplier = this.getMultiplier(order.symbol);
    const sideMultiplier = order.side === 'BUY' ? 1 : -1;
    return (currentPrice - order.openPrice) * multiplier * sideMultiplier / 100;
  }

  getMultiplier(symbol: string): number {
    if (symbol === 'BTCUSD') return 2;
    if (symbol === 'ETHUSD') return 3;
    if (symbol === 'TTWO.US') return 1;
    return 1;
  }
}
