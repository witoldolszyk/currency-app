import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';
import { OrderGroup } from '../../models/order-group.model';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['symbol', 'orderId', 'side', 'size', 'openTime', 'openPrice', 'swap', 'profit'];
  private groupedOrdersSubject = new BehaviorSubject<OrderGroup[]>([]);
  groupedOrders$ = this.groupedOrdersSubject.asObservable();
  dataSource = new MatTableDataSource<OrderGroup>();
  private priceSubscription: Subscription | null = null;

  constructor(private orderService: OrderService, private snackBar: MatSnackBar, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.orderService.getOrders().pipe(
      map(orders => this.groupOrders(orders))
    ).subscribe(groupedOrders => {
      this.groupedOrdersSubject.next(groupedOrders);
      this.dataSource.data = groupedOrders;
      this.orderService.subscribeToSymbols(groupedOrders.map(group => group.symbol));
    });

    this.priceSubscription = this.orderService.prices$.subscribe(priceUpdate => {
      this.updateGroupProfit(priceUpdate.symbol, priceUpdate.price);
    });
  }

  ngOnDestroy(): void {
    if (this.priceSubscription) {
      this.priceSubscription.unsubscribe();
    }
  }

  groupOrders(orders: Order[]): OrderGroup[] {
    const groupedOrdersMap = orders.reduce((groups, order) => {
      const symbol = order.symbol;
      if (!groups[symbol]) {
        groups[symbol] = {
          symbol: symbol,
          orders: [],
          openPrice: 0,
          swap: 0,
          profit: 0,
          size: 0,
          orderCount: 0,
          showDetails: false
        };
      }
      order.profit = this.orderService.calculateProfit(order, order.closePrice);
      groups[symbol].orders.push(order);
      groups[symbol].openPrice += order.openPrice;
      groups[symbol].swap += order.swap;
      groups[symbol].profit += order.profit;
      groups[symbol].size += order.size;
      groups[symbol].orderCount += 1;
      return groups;
    }, {} as { [key: string]: OrderGroup });

    return Object.keys(groupedOrdersMap).map(symbol => {
      const group = groupedOrdersMap[symbol];
      group.openPrice = group.openPrice / group.orderCount;
      group.profit = group.profit / group.orderCount;
      return group;
    });
  }

  toggleDetails(group: OrderGroup): void {
    group.showDetails = !group.showDetails;
  }

  deleteOrder(order: Order, group: OrderGroup): void {
    group.orders = group.orders.filter(o => o.id !== order.id);
    if (group.orders.length === 0) {
      this.deleteGroup(group.symbol);
    } else {
      group.openPrice = group.orders.reduce((sum, o) => sum + o.openPrice, 0) / group.orders.length;
      group.profit = group.orders.reduce((sum, o) => sum + this.orderService.calculateProfit(o, o.closePrice), 0) / group.orders.length;
      group.swap = group.orders.reduce((sum, o) => sum + o.swap, 0);
      group.size = group.orders.reduce((sum, o) => sum + o.size, 0);
      group.orderCount = group.orders.length;
    }
    this.snackBar.open(`The order ${order.id} was closed`, 'Close', {
      duration: 3000,
    });
  }

  deleteGroup(symbol: string): void {
    const group = this.groupedOrdersSubject.value.find(g => g.symbol === symbol);
    if (group) {
        const orderIds = group.orders.map(order => order.id).join(', ');
        const currentData = this.groupedOrdersSubject.value.filter(g => g.symbol !== symbol);
        this.groupedOrdersSubject.next(currentData);
        this.dataSource.data = currentData;
        this.snackBar.open(`Group ${symbol} was removed. Orders removed: ${orderIds}`, 'Close', {
            duration: 3000,
        });
        this.orderService.unsubscribeFromSymbols([symbol]);
    }
}

  updateGroupProfit(symbol: string, currentPrice: number): void {
    const group = this.dataSource.data.find(g => g.symbol === symbol);
    if (group) {
      group.orders.forEach(order => {
        order.profit = this.orderService.calculateProfit(order, currentPrice);
      });
      group.profit = group.orders.reduce((sum, order) => sum + order.profit, 0) / group.orders.length;
      this.dataSource.data = [...this.dataSource.data];
      this.cdr.markForCheck();
    }
  }
}
