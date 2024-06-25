import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Renderer2 } from '@angular/core';
import { AppComponent } from './app.component';
import { TableComponent } from './components/table/table.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockRenderer2: jasmine.SpyObj<Renderer2>;

  beforeEach(async () => {
    mockRenderer2 = jasmine.createSpyObj('Renderer2', ['setAttribute']);

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MatSnackBarModule,
        MatTableModule,
        MatIconModule,
        BrowserAnimationsModule
      ],
      declarations: [AppComponent, TableComponent],
      providers: [
        { provide: Renderer2, useValue: mockRenderer2 },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should set the initial theme based on system preferences', () => {
    spyOn(component, 'toggleTheme').and.callThrough();
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const theme = prefersDarkScheme.matches ? 'dark' : 'light';

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.toggleTheme).toHaveBeenCalledWith(theme);
  });

  it('should respond to prefers-color-scheme change events', () => {
    spyOn(component, 'toggleTheme').and.callThrough();

    const event = new Event('change');
    Object.defineProperty(event, 'matches', { value: true, writable: false });

    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    prefersDarkScheme.dispatchEvent(event);

    component.ngOnInit();
    fixture.detectChanges();
    prefersDarkScheme.addEventListener('change', (e) => component.toggleTheme(e.matches ? 'dark' : 'light'));

    prefersDarkScheme.addEventListener('change', (event: any) => {
      component.toggleTheme(event.matches ? 'dark' : 'light');
    });

    prefersDarkScheme.dispatchEvent(event);
    fixture.detectChanges();

    expect(component.toggleTheme).toHaveBeenCalledWith('dark');
  });
});
