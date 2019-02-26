import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  public componentArray: number[] = [1, 2, 3, 4, 5, 6];

  constructor() {}

  addRow(): void {
    this.componentArray.push(1);
  }

  deleteRow(): void {
    this.componentArray.pop();
  }
}
