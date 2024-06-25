import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrderService } from './order.service';
import { WebSocketService } from './websocket.service';
import { Order } from '../models/order.model';
import { Subject } from 'rxjs';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;
  let webSocketServiceSpy: jasmine.SpyObj<WebSocketService>;

  const mockOrders: Order[] = [
    { id: 1, symbol: 'BTCUSD', openPrice: 10000, side: 'BUY', profit: 0, size: 1, openTime: '2022-01-01T00:00:00Z', swap: 0, closePrice: 0 },
    { id: 2, symbol: 'ETHUSD', openPrice: 2000, side: 'SELL', profit: 0, size: 1, openTime: '2022-01-01T00:00:00Z', swap: 0, closePrice: 0 },
  ];

  const mockWebSocketSubject = new Subject<any>();

  beforeEach(() => {
    const spy = jasmine.createSpyObj('WebSocketService', ['getMessages', 'sendMessage']);
    spy.getMessages.and.returnValue(mockWebSocketSubject.asObservable());

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OrderService,
        { provide: WebSocketService, useValue: spy },
      ],
    });

    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
    webSocketServiceSpy = TestBed.inject(WebSocketService) as jasmine.SpyObj<WebSocketService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch orders', () => {
    service.getOrders().subscribe(orders => {
      expect(orders).toEqual(mockOrders);
    });

    const req = httpMock.expectOne('https://geeksoft.pl/assets/order-data.json');
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockOrders });
  });

  it('should subscribe to symbols', () => {
    const symbols = ['BTCUSD', 'ETHUSD'];
    service.subscribeToSymbols(symbols);
    expect(webSocketServiceSpy.sendMessage).toHaveBeenCalledWith({
      p: '/subscribe/addlist',
      d: symbols,
    });
  });

  it('should unsubscribe from symbols', () => {
    const symbols = ['BTCUSD', 'ETHUSD'];
    service.unsubscribeFromSymbols(symbols);
    expect(webSocketServiceSpy.sendMessage).toHaveBeenCalledWith({
      p: '/subscribe/removelist',
      d: symbols,
    });
  });

  it('should update prices correctly', () => {
    service['orders'] = mockOrders;

    const mockData = [
      { s: 'BTCUSD', b: 10500 },
      { s: 'ETHUSD', b: 1950 },
    ];

    service['updatePrices'](mockData);

    expect(service['orders'][0].profit).toBe(10);
    expect(service['orders'][1].profit).toBe(1.5);

    service.prices$.subscribe(priceUpdate => {
      expect(priceUpdate).toEqual({ symbol: 'BTCUSD', price: 10500 });
    });
  });

  it('should handle invalid data format in updatePrices', () => {
    spyOn(console, 'error');
    service['updatePrices']('invalid data');
    expect(console.error).toHaveBeenCalledWith('Invalid data format received:', 'invalid data');
  });

  it('should calculate profit correctly', () => {
    const order: Order = { id: 1, symbol: 'BTCUSD', openPrice: 10000, side: 'BUY', profit: 0, size: 1, openTime: '2022-01-01T00:00:00Z', swap: 0, closePrice: 0 };
    const profit = service.calculateProfit(order, 10500);
    expect(profit).toBe(10);
  });

  it('should return correct multiplier', () => {
    expect(service['getMultiplier']('BTCUSD')).toBe(2);
    expect(service['getMultiplier']('ETHUSD')).toBe(3);
    expect(service['getMultiplier']('TTWO.US')).toBe(1);
    expect(service['getMultiplier']('UNKNOWN')).toBe(1);
  });
});
