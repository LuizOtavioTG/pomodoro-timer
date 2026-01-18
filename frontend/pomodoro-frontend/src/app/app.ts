import { Component } from '@angular/core';
import { PomodoroContainer } from "./pomodoro-container/pomodoro-container";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PomodoroContainer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'pomodoro-frontend';
}
