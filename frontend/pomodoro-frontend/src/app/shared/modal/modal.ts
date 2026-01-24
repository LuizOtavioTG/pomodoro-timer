import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() closeOnBackdrop = true;
  @Input() closeOnEscape = true;

  @Output() closed = new EventEmitter<void>();

  @ViewChild('closeButton')
  private closeButton?: ElementRef<HTMLButtonElement>;

  private hasFocusedCloseButton = false;

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (!this.isOpen || !this.closeOnEscape) {
      return;
    }

    this.closed.emit();
  }

  ngAfterViewChecked(): void {
    if (!this.isOpen) {
      this.hasFocusedCloseButton = false;
      return;
    }

    if (this.hasFocusedCloseButton) {
      return;
    }

    this.closeButton?.nativeElement.focus();
    this.hasFocusedCloseButton = true;
  }

  onBackdropClick(): void {
    if (!this.closeOnBackdrop) {
      return;
    }

    this.closed.emit();
  }

  onCloseClick(): void {
    this.closed.emit();
  }
}
