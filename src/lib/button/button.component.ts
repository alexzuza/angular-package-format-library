import { Component, Input } from '@angular/core';

@Component({
  selector: 'zuz-button',
  templateUrl: './button.component.html'
})
export class ZuzButtonComponent {
  @Input() text: string;
}