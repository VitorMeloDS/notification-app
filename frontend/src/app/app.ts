import { Component, signal } from '@angular/core';
import { NotificationComponent } from './notification/notification.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  imports: [NotificationComponent],
})
export class App {
  protected readonly title = signal('frontend');
}
