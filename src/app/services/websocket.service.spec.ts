import { TestBed } from '@angular/core/testing';
import { WebSocketService } from './websocket.service';
import { WebSocketSubject } from 'rxjs/webSocket';
import { of } from 'rxjs';

describe('WebSocketService', () => {
  let service: WebSocketService;
  let mockWebSocket: jasmine.SpyObj<WebSocketSubject<any>>;

  beforeEach(() => {
    mockWebSocket = jasmine.createSpyObj('WebSocketSubject', ['next', 'pipe']);
    mockWebSocket.pipe.and.returnValue(of({ d: 'test message' }));

    TestBed.configureTestingModule({
      providers: [
        { provide: WebSocketSubject, useValue: mockWebSocket },
        WebSocketService
      ]
    });

    service = TestBed.inject(WebSocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
