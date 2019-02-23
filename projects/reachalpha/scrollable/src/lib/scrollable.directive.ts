import {Directive, ElementRef, HostListener, Input, OnInit, Renderer2} from '@angular/core';
import * as Hammer from 'hammerjs';

@Directive({
  selector: '[reachScrollable]'
})
export class ScrollableDirective implements OnInit {

  @Input() barWidth = 6;
  @Input() barColor = '#4d4d4d';
  @Input() barOpacity = 0.6;
  @Input() barPosition: 'left' | 'right' = 'right';
  @Input() barSeparation = 0;
  @Input() barRadius: 'default' | 'none' | number = 'default';

  private visibleHeight: number;
  private innerHeight: number;

  private vDown: number = null;
  private hDown: number = null;

  private box: ClientRect;

  private vScroll: HTMLElement;

  private scrollerHeight: number;

  static disableSelect(event) {
    event.preventDefault();
  }

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) { }

  ngOnInit(): void {

    this.init();

    if (this.visibleHeight < this.innerHeight) {
      this.createVerticalScroll();
    }

  }

  init(): void {

    this.renderer.setStyle(this.el.nativeElement, 'overflow', 'hidden');

    this.visibleHeight = this.el.nativeElement.clientHeight;
    this.innerHeight = this.el.nativeElement.scrollHeight;

    this.scrollerHeight = Math.ceil(this.visibleHeight * (this.visibleHeight / this.innerHeight));

    this.box = this.el.nativeElement.getBoundingClientRect();

    const rawPosition = getComputedStyle(this.el.nativeElement).position;

    if (rawPosition !== 'absolute' && rawPosition !== 'relative') {
      this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
    }

    this.el.nativeElement.addEventListener('mousewheel', (event: WheelEvent) => {

      const scrollTopRaw = this.el.nativeElement.scrollTop + event.deltaY;
      const scrollTopBounds = Math.ceil(Math.max(0, Math.min(this.innerHeight - this.visibleHeight, scrollTopRaw)));

      const barTopRaw = Math.ceil(scrollTopBounds + this.vToBar(scrollTopBounds));

      this.renderer.setStyle(this.vScroll, 'top', barTopRaw + 'px');

      this.renderer.setProperty(this.el.nativeElement, 'scrollTop', scrollTopBounds);

    });

    this.el.nativeElement.addEventListener('DOMMouseScroll', (event: WheelEvent) => {

      const scrollTopRaw = this.el.nativeElement.scrollTop + event.deltaY;
      const scrollTopBounds = Math.ceil(Math.max(0, Math.min(this.innerHeight - this.visibleHeight, scrollTopRaw)));

      const barTopRaw = Math.ceil(scrollTopBounds + this.vToBar(scrollTopBounds));

      this.renderer.setStyle(this.vScroll, 'top', barTopRaw + 'px');

      this.renderer.setProperty(this.el.nativeElement, 'scrollTop', scrollTopBounds);

    });

    const hammer = new Hammer.Manager(this.el.nativeElement, {
      touchAction: 'auto',
      recognizers: [
        [Hammer.Pan, { direction: Hammer.DIRECTION_VERTICAL }],
      ]
    });
    hammer.on('pan', (event) => {

      event.preventDefault();

      const scrollTopRaw = this.el.nativeElement.scrollTop + (Math.abs(event.deltaY) * event.velocityY);
      const scrollTopBounds = Math.ceil(Math.max(0, Math.min(this.innerHeight - this.visibleHeight, scrollTopRaw)));

      const barTopRaw = Math.ceil(scrollTopBounds + this.vToBar(scrollTopBounds));

      this.renderer.setStyle(this.vScroll, 'top', barTopRaw + 'px');

      // this.renderer.setProperty(this.el.nativeElement, 'scrollTo', scrollTopBounds);

      this.el.nativeElement.scrollTo(this.el.nativeElement.scrollTop, scrollTopBounds);

    });



  }

  createVerticalScroll(): void {

    // bar

    this.vScroll = this.renderer.createElement('div');
    this.renderer.setStyle(this.vScroll, 'width', this.barWidth + 'px');
    this.renderer.setStyle(this.vScroll, 'height',  this.scrollerHeight + 'px');

    if (this.barRadius === 'default') {
      this.renderer.setStyle(this.vScroll, 'border-radius', (this.barWidth / 2) + 'px');
    } else if (this.barRadius !== 'none') {
      this.renderer.setStyle(this.vScroll, 'border-radius', this.barRadius + 'px');
    }

    this.renderer.setStyle(this.vScroll, 'position', 'absolute');
    this.renderer.setStyle(this.vScroll, 'top', '0px');
    this.renderer.setStyle(this.vScroll, this.barPosition, this.barSeparation + 'px');

    this.renderer.setStyle(this.vScroll, 'background-color', this.barColor);
    this.renderer.setStyle(this.vScroll, 'opacity', this.barOpacity);

    // wrapper

    const scrollerWrapper: HTMLElement = this.renderer.createElement('div');
    this.renderer.setStyle(scrollerWrapper, 'position', 'absolute');
    this.renderer.setStyle(scrollerWrapper, 'top', '0px');
    this.renderer.setStyle(scrollerWrapper, this.barPosition, this.barSeparation + 'px');
    this.renderer.setStyle(scrollerWrapper, 'width', this.barWidth + 'px');
    this.renderer.setStyle(scrollerWrapper, 'height', this.innerHeight + 'px');

    this.renderer.appendChild(scrollerWrapper, this.vScroll);
    this.renderer.appendChild(this.el.nativeElement, scrollerWrapper);

    scrollerWrapper.addEventListener('click', (event: MouseEvent) => {

      const positionRaw = event.clientY - this.box.top;

      const positionInBar = Math.max(0, Math.min(this.visibleHeight - this.scrollerHeight, positionRaw));

      const positionInside = this.vToInner(positionInBar);

      this.renderer.setStyle(this.vScroll, 'top', (positionInside + positionInBar) + 'px');

      this.renderer.setProperty(this.el.nativeElement, 'scrollTop', positionInside);

    });

    this.vScroll.addEventListener('mousedown', (event: MouseEvent) => {

      this.vDown = event.layerY;

      window.addEventListener('selectstart', ScrollableDirective.disableSelect);

    });

    this.vScroll.addEventListener('click', (event: MouseEvent) => event.stopPropagation());

  }

  vToInner(value: number): number {
    const a: number = this.visibleHeight - this.scrollerHeight;
    const b: number = this.innerHeight - this.visibleHeight;
    return value * (b / a);
  }

  vToBar(value: number): number {
    return (value * this.visibleHeight) / this.innerHeight;
  }

  @HostListener('window:mousemove', ['$event'])
  onGlobalMouseMove(event: MouseEvent) {

    if (this.vDown !== null) {

      const diff = (event.pageY - this.box.top) - this.vDown;

      const positionWithBounds = Math.max(0, Math.min(this.visibleHeight - this.scrollerHeight, diff));

      const positionWithScroll = positionWithBounds + this.el.nativeElement.scrollTop;

      this.renderer.setStyle(this.vScroll, 'top', positionWithScroll + 'px');

      this.renderer.setProperty(this.el.nativeElement, 'scrollTop', this.vToInner(positionWithBounds));

    }

  }

  @HostListener('window:mouseup', ['$event'])
  onGlobalKeyUp() {
    this.vDown = null;
    this.hDown = null;
    window.removeEventListener('selectstart', ScrollableDirective.disableSelect);
  }

}
