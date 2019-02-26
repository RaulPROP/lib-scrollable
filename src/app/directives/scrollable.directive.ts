import {AfterViewInit, Directive, ElementRef, HostListener, Input, Renderer2} from '@angular/core';

import * as elementResizeDetectorMaker_ from 'element-resize-detector';

import * as Hammer from 'hammerjs';

const elementResizeDetectorMaker = elementResizeDetectorMaker_;

@Directive({
  selector: '[reachScrollable]'
})
export class ScrollableDirective implements AfterViewInit {

  private resizeDetector: any;

  @Input() barWidth = 6;
  @Input() barColor = '#4d4d4d';
  @Input() barOpacity = 0.6;
  @Input() barPosition: 'left' | 'right' = 'right';
  @Input() barSeparation = 0;
  @Input() barRadius: 'default' | 'none' | number = 'default';

  @Input() detector: HTMLElement = null;

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

  static mobileAndTabletCheck(): boolean {
    let check = false;
    (function(a) {
      if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) { check = true; }
    })(navigator.userAgent || navigator.vendor || window['opera']);
    return check;
  }

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) {
    this.resizeDetector = elementResizeDetectorMaker({ strategy: 'scroll' });
  }

  ngAfterViewInit(): void {

    if (this.detector) {

      this.init();

      this.createVerticalScroll();

      this.createWrapper();

    } else {
      throw new Error('detector needed');
    }

  }

  createWrapper(): void {

    this.renderer.setStyle(this.detector, 'position', 'relative');
    this.renderer.setStyle(this.detector, 'width', 'auto');
    this.renderer.setStyle(this.detector, 'height', 'auto');

    this.resizeDetector.listenTo(this.detector, this.sizeChanged.bind(this));

  }

  sizeChanged(): void {

    const beforeInside = this.innerHeight > this.visibleHeight;

    this.visibleHeight = this.el.nativeElement.clientHeight;
    this.innerHeight = this.detector.clientHeight;
    this.scrollerHeight = Math.ceil(this.visibleHeight * (this.visibleHeight / this.innerHeight));

    this.box = this.el.nativeElement.getBoundingClientRect();

    this.checkValues();

    if (this.innerHeight <= this.visibleHeight) {

      if (beforeInside) {

        this.removeVerticalScroll();

      }

    } else {

      this.resetVerticalScroll(this.el.nativeElement.scrollTop + this.vToBar(this.el.nativeElement.scrollTop));

    }

  }

  checkValues(): void {
    const top = this.vScroll.offsetTop;

    const barTopBounds = Math.max(0, Math.min(Math.ceil(this.innerHeight - this.scrollerHeight) , top));

    this.renderer.setStyle(this.vScroll, 'height', this.scrollerHeight + 'px');
    this.renderer.setStyle(this.vScroll, 'top', barTopBounds + 'px');
  }

  init(): void {

    this.renderer.setStyle(this.el.nativeElement, 'overflow', 'hidden');

    this.visibleHeight = this.el.nativeElement.clientHeight;
    this.innerHeight = this.detector.clientHeight;

    this.scrollerHeight = Math.ceil(this.visibleHeight * (this.visibleHeight / this.innerHeight));

    this.box = this.el.nativeElement.getBoundingClientRect();

    const rawPosition = getComputedStyle(this.el.nativeElement).position;

    if (rawPosition !== 'absolute' && rawPosition !== 'relative') {
      this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
    }

    this.el.nativeElement.addEventListener('mousewheel', (event: WheelEvent) => {

      if (this.visibleHeight <= this.innerHeight) {

        const scrollTopRaw = this.el.nativeElement.scrollTop + event.deltaY;
        const scrollTopBounds = Math.ceil(Math.max(0, Math.min(Math.ceil(this.innerHeight - this.visibleHeight), scrollTopRaw)));

        const barTopRaw = Math.ceil(scrollTopBounds + this.vToBar(scrollTopBounds));
        const barTopBounds = Math.max(0, Math.min(Math.ceil(this.innerHeight - this.scrollerHeight) , barTopRaw));

        this.renderer.setStyle(this.vScroll, 'top', barTopBounds + 'px');

        this.renderer.setProperty(this.el.nativeElement, 'scrollTop', scrollTopBounds);

      }

    });

    this.el.nativeElement.addEventListener('DOMMouseScroll', (event: WheelEvent) => {

      if (this.visibleHeight <= this.innerHeight) {

        const scrollTopRaw = this.el.nativeElement.scrollTop + event.deltaY;
        const scrollTopBounds = Math.ceil(Math.max(0, Math.min(Math.ceil(this.innerHeight - this.visibleHeight), scrollTopRaw)));

        const barTopRaw = Math.ceil(scrollTopBounds + this.vToBar(scrollTopBounds));
        const barTopBounds = Math.max(0, Math.min(Math.ceil(this.innerHeight - this.scrollerHeight) , barTopRaw));

        this.renderer.setStyle(this.vScroll, 'top', barTopBounds + 'px');

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

      if (ScrollableDirective.mobileAndTabletCheck()) {

        if (this.visibleHeight <= this.innerHeight) {

          event.preventDefault();

          const scrollTopRaw = this.el.nativeElement.scrollTop + (Math.abs(event.deltaY) * event.velocityY);
          const scrollTopBounds = Math.ceil(Math.max(0, Math.min(this.innerHeight - this.visibleHeight, scrollTopRaw)));

          const barTopRaw = Math.ceil(scrollTopBounds + this.vToBar(scrollTopBounds));

          this.renderer.setStyle(this.vScroll, 'top', barTopRaw + 'px');

          this.el.nativeElement.scrollTo(this.el.nativeElement.scrollTop, scrollTopBounds);

        }

      }

    });

  }

  removeVerticalScroll(): void {
    this.renderer.removeChild(this.detector, this.vScrollWrapper);
  }

  resetVerticalScroll(initialTop: number = 0): void {

    this.renderer.setStyle(this.vScroll, 'height',  this.scrollerHeight + 'px');

    this.renderer.setStyle(this.vScroll, 'top', initialTop + 'px');

    this.renderer.appendChild(this.detector, this.vScrollWrapper);

  }

  createVerticalScroll(initialTop: number = 0): void {

    // bar

    this.vScroll = this.renderer.createElement('div');
    this.renderer.setStyle(this.vScroll, 'width', this.barWidth + 'px');
    this.renderer.setStyle(this.vScroll, 'height',  this.scrollerHeight + 'px');
    this.renderer.setStyle(this.vScroll, 'max-height',  '100%');

    if (this.barRadius === 'default') {
      this.renderer.setStyle(this.vScroll, 'border-radius', (this.barWidth / 2) + 'px');
    } else if (this.barRadius !== 'none') {
      this.renderer.setStyle(this.vScroll, 'border-radius', this.barRadius + 'px');
    }

    this.renderer.setStyle(this.vScroll, 'position', 'absolute');
    this.renderer.setStyle(this.vScroll, 'top', initialTop + 'px');
    this.renderer.setStyle(this.vScroll, this.barPosition, '0px');

    this.renderer.setStyle(this.vScroll, 'background-color', this.barColor);
    this.renderer.setStyle(this.vScroll, 'opacity', this.barOpacity);

    // wrapper

    this.vScrollWrapper = this.renderer.createElement('div');
    this.renderer.setStyle(this.vScrollWrapper, 'position', 'absolute');
    this.renderer.setStyle(this.vScrollWrapper, 'top', '0px');
    this.renderer.setStyle(this.vScrollWrapper, this.barPosition, this.barSeparation + 'px');
    this.renderer.setStyle(this.vScrollWrapper, 'width', this.barWidth + 'px');
    this.renderer.setStyle(this.vScrollWrapper, 'height', '100%');

    this.renderer.appendChild(this.vScrollWrapper, this.vScroll);

    if (this.innerHeight > this.visibleHeight) {
      // console.log('adding vScroller on creation');
      this.renderer.appendChild(this.detector, this.vScrollWrapper);
    }

    this.vScrollWrapper.addEventListener('click', (event: MouseEvent) => {

      console.log('click in bar');

      if (this.visibleHeight <= this.innerHeight) {

        const positionRaw = event.clientY - this.box.top;

        const positionInBar = Math.max(0, Math.min(this.visibleHeight - this.scrollerHeight, positionRaw));

        const positionInside = this.vToInner(positionInBar);

        this.renderer.setStyle(this.vScroll, 'top', (positionInside + positionInBar) + 'px');

        this.renderer.setProperty(this.el.nativeElement, 'scrollTop', positionInside);

      }

    });

    this.vScroll.addEventListener('mousedown', (event: MouseEvent) => {

      this.vDown = event.clientY - this.box.top;

      window.addEventListener('selectstart', ScrollableDirective.disableSelect);

    });

    this.vScroll.addEventListener('click', (event: MouseEvent) => {
      console.log('click in gray');
      event.stopPropagation();
    });

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

      console.log(diff);

      const positionWithBounds = Math.max(0, Math.min(this.visibleHeight - this.scrollerHeight, diff));

      const positionWithScroll = positionWithBounds + this.vToInner(positionWithBounds);

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
