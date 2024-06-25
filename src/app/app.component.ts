import { Component, OnInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'cryptocurrency-app';

  constructor(private renderer: Renderer2) { }

  ngOnInit(): void {
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    this.toggleTheme(prefersDarkScheme.matches ? 'dark' : 'light');

    prefersDarkScheme.addEventListener('change', (event) => {
      this.toggleTheme(event.matches ? 'dark' : 'light');
    });
  }

  toggleTheme(theme: string): void {
    this.renderer.setAttribute(document.body, 'data-theme', theme);
  }
}
