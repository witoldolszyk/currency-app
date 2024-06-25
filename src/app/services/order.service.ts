import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Order } from '../models/order.model';
import { WebSocketService } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private url = 'https://geeksoft.pl/assets/order-data.json';
  private orders: Order[] = [];
  private pricesSubject = new Subject<{ symbol: string, price: number }>();
  prices$ = this.pricesSubject.asObservable();

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

  private updatePrices(data: any): void {
    if (data && Array.isArray(data)) {
      data.forEach((quote: any) => {
        if (quote.s && quote.b) {
          const symbol = quote.s;
          const currentPrice = quote.b;
          this.orders.forEach(order => {
            if (order.symbol === symbol) {
              order.profit = this.calculateProfit(order, currentPrice);
              this.pricesSubject.next({ symbol, price: currentPrice });
            }
          });
        }
      });
    } else {
      console.error('Invalid data format received:', data);
    }
  }

  calculateProfit(order: Order, currentPrice: number): number {
    const multiplier = this.getMultiplier(order.symbol);
    const sideMultiplier = order.side === 'BUY' ? 1 : -1;
    return (currentPrice - order.openPrice) * multiplier * sideMultiplier / 100;
  }

  private getMultiplier(symbol: string): number {
    if (symbol === 'BTCUSD') return 2;
    if (symbol === 'ETHUSD') return 3;
    if (symbol === 'TTWO.US') return 1;
    return 1;
  }
}
