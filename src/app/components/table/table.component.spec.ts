import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { of } from 'rxjs';
import { TableComponent } from './table.component';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';
import { OrderGroup } from '../../models/order-group.model';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('TableComponent', () => {
  let component: TableComponent;
  let fixture: ComponentFixture<TableComponent>;
  let orderService: jasmine.SpyObj<OrderService>;

  const mockOrders: Order[] = [
    { id: 1, symbol: 'AAPL', openPrice: 100, size: 10, profit: 10, swap: 0, closePrice: 110, openTime: '2021-01-01T00:00:00Z', side: 'buy' },
    { id: 2, symbol: 'AAPL', openPrice: 150, size: 5, profit: -5, swap: 0, closePrice: 145, openTime: '2021-01-01T00:00:00Z', side: 'buy' }
  ];

  beforeEach(async () => {
    const orderServiceSpy = jasmine.createSpyObj('OrderService', ['getOrders', 'subscribeToSymbols', 'unsubscribeFromSymbols', 'calculateProfit', 'prices$']);
    orderServiceSpy.getOrders.and.returnValue(of(mockOrders));
    orderServiceSpy.prices$ = of({ symbol: 'AAPL', price: 155 });
    orderServiceSpy.calculateProfit.and.callFake((order: Order, price: number) => order.size * (price - order.openPrice));

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MatSnackBarModule,
        MatTableModule,
        MatIconModule,
        BrowserAnimationsModule
      ],
      declarations: [TableComponent],
      providers: [
        { provide: OrderService, useValue: orderServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TableComponent);
    component = fixture.componentInstance;
    orderService = TestBed.inject(OrderService) as jasmine.SpyObj<OrderService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch and group orders on init', () => {
    expect(orderService.getOrders).toHaveBeenCalled();
    expect(component.dataSource.data.length).toBe(1);
    expect(component.dataSource.data[0].symbol).toBe('AAPL');
    expect(component.dataSource.data[0].orders.length).toBe(2);
  });

  it('should toggle group details', () => {
    const group = component.dataSource.data[0];
    expect(group.showDetails).toBeFalse();
    component.toggleDetails(group);
    expect(group.showDetails).toBeTrue();
    component.toggleDetails(group);
    expect(group.showDetails).toBeFalse();
  });

  it('should delete an order from a group', () => {
    const group = component.dataSource.data[0];
    expect(group.orders.length).toBe(2);
    component.deleteOrder(mockOrders[0], group);
    expect(group.orders.length).toBe(1);
    expect(orderService.unsubscribeFromSymbols).not.toHaveBeenCalled();
  });

  it('should delete a group if no orders remain', () => {
    const group = component.dataSource.data[0];
    component.deleteOrder(mockOrders[0], group);
    component.deleteOrder(mockOrders[1], group);
    expect(component.dataSource.data.length).toBe(0);
    expect(orderService.unsubscribeFromSymbols).toHaveBeenCalledWith(['AAPL']);
  });

});
