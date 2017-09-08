import {
    DoCheck, ElementRef, NgZone,  OnDestroy, Directive, Output, EventEmitter
} from "@angular/core";
import * as _ from "lodash";
import {Content} from "ionic-angular";
import {Subscription} from "rxjs/Subscription";

@Directive({
    selector: "[scroll-switch]"
})
export class ScrollSwitchDirective implements DoCheck, OnDestroy {
    private _scrollSubscription: Subscription;

    private _fullInView: boolean;
    private _inView: boolean;

    @Output()
    public fullInViewChange: EventEmitter<boolean> = new EventEmitter();

    @Output()
    public inViewChange: EventEmitter<boolean> = new EventEmitter();

    get fullInView(): boolean {
        return this._fullInView;
    }

    get inView(): boolean {
        return this._inView;
    }

    constructor(private content: Content, private zone: NgZone, private element: ElementRef) {
        this._scrollSubscription = content.ionScroll.subscribe(() => this.onScroll());
    }

    private get relativeScrollPosition(): number {
        let contentRect = this.content.getScrollElement().getBoundingClientRect();
        let selfRect = this.element.nativeElement.getBoundingClientRect();
        return contentRect.top - selfRect.top;
    }

    private onScroll() {
        let fullInView = (this.relativeScrollPosition < 0);
        let inView = (this.relativeScrollPosition < this.element.nativeElement.clientHeight);
        if (fullInView != this._fullInView) {
            this.zone.run(() => {
                this._fullInView = fullInView;
                this.fullInViewChange.emit(this._fullInView);
            });
        }
        if (inView != this._inView) {
            this.zone.run(() => {
                this._inView = inView;
                this.inViewChange.emit(this._inView);
            });
        }
    }

    ngDoCheck() {
        let fullInView = (this.relativeScrollPosition < 0);
        let inView = (this.relativeScrollPosition < this.element.nativeElement.clientHeight);
        if (fullInView != this._fullInView) {
            this._fullInView = fullInView;
            this.fullInViewChange.emit(this._fullInView);
        }
        if (inView != this._inView) {
            this._inView = inView;
            this.inViewChange.emit(this._inView);
        }
    }

    ngOnDestroy() {
        if (this._scrollSubscription) {
            this._scrollSubscription.unsubscribe();
            this._scrollSubscription = null;
        }
    }
}
