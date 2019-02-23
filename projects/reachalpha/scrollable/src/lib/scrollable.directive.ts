import {Directive, ElementRef, HostListener, Input, OnInit, Renderer2} from '@angular/core';

import * as eq from 'css-element-queries';
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

  @Input() detectSizeChanges: HTMLElement = null;

  private visibleHeight: number;
  private innerHeight: number;

  private vDown: number = null;
  private hDown: number = null;

  private box: ClientRect;

  private vScroll: HTMLElement;
  private vScrollWrapper: HTMLElement;

  private scrollerHeight: number;

  static disableSelect(event) {
    event.preventDefault();
  }

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) { }

  ngOnInit(): void {

    this.init();

    this.createVerticalScroll();

    // this.watcher = window.requestAnimationFrame(this.watch.bind(this));

    if (this.detectSizeChanges) {

      const ignore = new eq.ResizeSensor(this.detectSizeChanges, (x) => {

        this.watchChanges();

      });

    }

  }

  watchChanges(): void {

    if (this.innerHeight !== (this.detectSizeChanges ? this.detectSizeChanges.offsetHeight : this.el.nativeElement.scrollHeight)) {

      // height changed

      // recalculate basic stats
      this.visibleHeight = this.el.nativeElement.clientHeight;
      this.innerHeight = this.detectSizeChanges ? this.detectSizeChanges.offsetHeight : this.el.nativeElement.scrollHeight;
      this.scrollerHeight = Math.ceil(this.visibleHeight * (this.visibleHeight / this.innerHeight));
      this.box = this.el.nativeElement.getBoundingClientRect();

      if (this.visibleHeight >= this.innerHeight) {

        // remove scroller

        this.removeVerticalScroll();

      } else {

        // reset its values

        this.resetVerticalScroll(this.vToBar(this.el.nativeElement.scrollTop));

      }

    }

  }

  init(): void {

    this.renderer.setStyle(this.el.nativeElement, 'overflow', 'hidden');

    this.visibleHeight = this.el.nativeElement.clientHeight;
    this.innerHeight = this.detectSizeChanges ? this.detectSizeChanges.offsetHeight : this.el.nativeElement.scrollHeight;

    this.scrollerHeight = Math.ceil(this.visibleHeight * (this.visibleHeight / this.innerHeight));

    this.box = this.el.nativeElement.getBoundingClientRect();

    const rawPosition = getComputedStyle(this.el.nativeElement).position;

    if (rawPosition !== 'absolute' && rawPosition !== 'relative') {
      this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
    }

    this.el.nativeElement.addEventListener('mousewheel', (event: WheelEvent) => {

      if (this.visibleHeight <= this.innerHeight) {

        const scrollTopRaw = this.el.nativeElement.scrollTop + event.deltaY;
        const scrollTopBounds = Math.ceil(Math.max(0, Math.min(this.innerHeight - this.visibleHeight, scrollTopRaw)));

        const barTopRaw = Math.ceil(scrollTopBounds + this.vToBar(scrollTopBounds));

        this.renderer.setStyle(this.vScroll, 'top', barTopRaw + 'px');

        this.renderer.setProperty(this.el.nativeElement, 'scrollTop', scrollTopBounds);

      }

    });

    this.el.nativeElement.addEventListener('DOMMouseScroll', (event: WheelEvent) => {

      if (this.visibleHeight <= this.innerHeight) {

        const scrollTopRaw = this.el.nativeElement.scrollTop + event.deltaY;
        const scrollTopBounds = Math.ceil(Math.max(0, Math.min(this.innerHeight - this.visibleHeight, scrollTopRaw)));

        const barTopRaw = Math.ceil(scrollTopBounds + this.vToBar(scrollTopBounds));

        this.renderer.setStyle(this.vScroll, 'top', barTopRaw + 'px');

        this.renderer.setProperty(this.el.nativeElement, 'scrollTop', scrollTopBounds);

      }

    });

    const hammer = new Hammer.Manager(this.el.nativeElement, {
      touchAction: 'auto',
      recognizers: [
        [Hammer.Pan, { direction: Hammer.DIRECTION_VERTICAL }],
      ]
    });
    hammer.on('pan', (event) => {

      if (this.visibleHeight <= this.innerHeight) {

        event.preventDefault();

        const scrollTopRaw = this.el.nativeElement.scrollTop + (Math.abs(event.deltaY) * event.velocityY);
        const scrollTopBounds = Math.ceil(Math.max(0, Math.min(this.innerHeight - this.visibleHeight, scrollTopRaw)));

        const barTopRaw = Math.ceil(scrollTopBounds + this.vToBar(scrollTopBounds));

        this.renderer.setStyle(this.vScroll, 'top', barTopRaw + 'px');

        // this.renderer.setProperty(this.el.nativeElement, 'scrollTo', scrollTopBounds);

        this.el.nativeElement.scrollTo(this.el.nativeElement.scrollTop, scrollTopBounds);

      }

    });



  }

  removeVerticalScroll(): void {
    this.renderer.removeChild(this.el.nativeElement, this.vScrollWrapper);
  }

  resetVerticalScroll(initialTop: number = 0): void {

    this.renderer.setStyle(this.vScroll, 'height',  this.scrollerHeight + 'px');
    this.renderer.setStyle(this.vScrollWrapper, 'height', this.innerHeight + 'px');

    this.renderer.setStyle(this.vScroll, 'top', initialTop + 'px');

    this.renderer.appendChild(this.el.nativeElement, this.vScrollWrapper);

  }

  createVerticalScroll(initialTop: number = 0): void {

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
    this.renderer.setStyle(this.vScroll, 'top', initialTop + 'px');
    this.renderer.setStyle(this.vScroll, this.barPosition, this.barSeparation + 'px');

    this.renderer.setStyle(this.vScroll, 'background-color', this.barColor);
    this.renderer.setStyle(this.vScroll, 'opacity', this.barOpacity);

    // wrapper

    this.vScrollWrapper = this.renderer.createElement('div');
    this.renderer.setStyle(this.vScrollWrapper, 'position', 'absolute');
    this.renderer.setStyle(this.vScrollWrapper, 'top', '0px');
    this.renderer.setStyle(this.vScrollWrapper, this.barPosition, this.barSeparation + 'px');
    this.renderer.setStyle(this.vScrollWrapper, 'width', this.barWidth + 'px');
    this.renderer.setStyle(this.vScrollWrapper, 'height', this.innerHeight + 'px');

    this.renderer.appendChild(this.vScrollWrapper, this.vScroll);

    if (this.innerHeight > this.visibleHeight) {
      this.renderer.appendChild(this.el.nativeElement, this.vScrollWrapper);
    }

    this.vScrollWrapper.addEventListener('click', (event: MouseEvent) => {

      if (this.visibleHeight <= this.innerHeight) {

        const positionRaw = event.clientY - this.box.top;

        const positionInBar = Math.max(0, Math.min(this.visibleHeight - this.scrollerHeight, positionRaw));

        const positionInside = this.vToInner(positionInBar);

        this.renderer.setStyle(this.vScroll, 'top', (positionInside + positionInBar) + 'px');

        this.renderer.setProperty(this.el.nativeElement, 'scrollTop', positionInside);

      }

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
