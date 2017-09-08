import {
    Component, ContentChild, DoCheck, ElementRef, EmbeddedViewRef, Input, IterableChanges, NgZone,
    OnDestroy, ViewChild, TemplateRef, AfterViewInit, ViewChildren, Query, ViewContainerRef, QueryList
} from "@angular/core";
import template from "./dynamic-virtual-scroll.html";
import style from "./dynamic-virtual-scroll.scss";
import * as _ from "lodash";
import {Content} from "ionic-angular";
import {DynamicItem, VirtualContext} from "./dynamic-virtual-scroll-item";
import {Subscription} from "rxjs/Subscription";

class VirtualItemCache {
    public index: number;
    private _srcIndex: number;
    private _itemData: any;
    private _itemCount: number;
    private _item: EmbeddedViewRef<VirtualContext> = null;
    public y: number;
    public visible: boolean = false;

    get item(): EmbeddedViewRef<VirtualContext> {
        return this._item;
    }

    set item(value: EmbeddedViewRef<VirtualContext>) {
        this._item = value;
        if (value) {
            value.context.index = this._srcIndex;
            value.context.$implicit = this._itemData;
            value.context.count = this._itemCount;
        }
    }

    get srcIndex(): number {
        return this._srcIndex;
    }

    set srcIndex(value: number) {
        this._srcIndex = value;
        if (this._item) {
            this._item.context.index = value;
        }
    }
    get itemData(): any {
        return this._itemData;
    }

    set itemData(value: any) {
        this._itemData = value;
        if (this._item) {
            this._item.context.$implicit = value;
        }
    }
    get itemCount(): number {
        return this._itemCount;
    }

    set itemCount(value: number) {
        this._itemCount = value;
        if (this._item) {
            this._item.context.count = value;
        }
    }

    constructor(index: number, item: EmbeddedViewRef<VirtualContext>) {
        this.index = index;
        this._item = item;
    }
}
@Component({
    selector: "dynamic-virtual-scroll",
    template,
    styles: [ style ]
})
export class DynamicVirtualScrollComponent implements DoCheck, OnDestroy {
    private _scrollSubscription: Subscription;
    private _scrollEndSubscription: Subscription;

    private _minItemHeight: number;

    private itemCache: VirtualItemCache[] = [];
    private itemCacheStart: number = 0;
    private itemCacheEnd: number = 0;

    private _items: any[] = [];

    private _dynamicItem: DynamicItem = null;
    private listSubscription: Subscription;

    @Input()
    public scrollLive: boolean = false;

    @Input()
    public fixedItemHeight: boolean = true;

    @ViewChildren('virtualItemContainer', {read: ViewContainerRef})
    set virtualItemTemplate(containers: QueryList<ViewContainerRef>) {
        containers.forEach((container: ViewContainerRef, i: number) => {
            if (i < this.itemCache.length && !this.itemCache[i].item) {
                this.itemCache[i].item = container.createEmbeddedView(this._dynamicItem.templateRef, new VirtualContext(null, null, null, null));
            }
        });
    }

    @ContentChild(DynamicItem) set dynamicItem(dynamicItem: DynamicItem) {
        if (this.listSubscription) {
            this.listSubscription.unsubscribe();
            this.listSubscription = null;
        }
        this._dynamicItem = dynamicItem;
        this.listSubscription = dynamicItem.listChange.subscribe((list: Iterable<any>) => {
            this._items = _.toArray(list);
            this.scrollCache(true);
            console.log("Items:", this._items.length);
        });
        this.ngDoCheck();
    }

    @Input()
    public set minItemHeight(value: number) {
        this._minItemHeight = value;
        this.ngDoCheck();
    }

    public get minItemHeight(): number {
        return this._minItemHeight;
    }

    private get height(): number {
        return Math.ceil((this._items?this._items.length:0) * this._minItemHeight);
    }

    private get viewHeight(): number {
        return this.content.getScrollElement().clientHeight;
    }

    constructor(private content: Content, private zone: NgZone, private element: ElementRef) {
        this._scrollSubscription = content.ionScroll.subscribe(() => this.onScroll());
        this._scrollEndSubscription = content.ionScrollEnd.subscribe(() => this.onScrollEnd());
    }

    private get relativeScrollPosition(): number {
        let contentRect = this.content.getScrollElement().getBoundingClientRect();
        let selfRect = this.element.nativeElement.getBoundingClientRect();
        return Math.max(contentRect.top - selfRect.top, 0);
    }

    private checkCacheSize(): boolean {
        let itemCacheSize = Math.ceil((Math.ceil(this.viewHeight / this._minItemHeight) + 1) * 1.5);
        let hadChange = false;
        while (this.itemCache.length < itemCacheSize) {
            this.itemCache.push(new VirtualItemCache(this.itemCache.length, null));
            hadChange = true;
        }
        while (this.itemCache.length > itemCacheSize) {
            let removeIdx = _.findIndex(this.itemCache, (cache) => !cache.visible);
            if (removeIdx === -1) {
                removeIdx = this.itemCache.length - 1;
            }
            let removed = this.itemCache[removeIdx];
            this.itemCache.splice(removeIdx, 1);
            if (removed.item) {
                removed.item.destroy();
                removed.item = null;
            }
            hadChange = true;
        }
        if (hadChange) {
            console.log("New cache size:", this.itemCache.length, "for viewHeight", this.viewHeight);
        }
        return hadChange;
    }

    private scrollCacheUpdate(startIndex: number, endIndex: number) {
        let startIdx = _.findIndex(this.itemCache, (cache) => cache.visible && cache.srcIndex === startIndex);
        let endIdx = _.findIndex(this.itemCache, (cache) => cache.visible && cache.srcIndex === endIndex - 1);
        _.forEach(this.itemCache, (cache) => {
            cache.visible = false
        });
        if (startIdx !== -1 || endIdx === -1) {
            let cacheIdx = 0;
            if (startIdx !== -1) {
                cacheIdx = startIdx;
            }
            for (let i = startIndex; i < endIndex; i++) {
                this.itemCache[cacheIdx].srcIndex = i;
                this.itemCache[cacheIdx].itemData = this._items[i];
                this.itemCache[cacheIdx].itemCount = this._items.length;
                this.itemCache[cacheIdx].y = i * this._minItemHeight;
                this.itemCache[cacheIdx].index = cacheIdx;
                this.itemCache[cacheIdx].visible = true;
                cacheIdx = ((cacheIdx + 1) % this.itemCache.length);
            }
        } else {
            let cacheIdx = endIdx;
            for (let i = endIndex - 1; i >= startIndex; i--) {
                this.itemCache[cacheIdx].srcIndex = i;
                this.itemCache[cacheIdx].itemData = this._items[i];
                this.itemCache[cacheIdx].itemCount = this._items.length;
                this.itemCache[cacheIdx].y = i * this._minItemHeight;
                this.itemCache[cacheIdx].index = cacheIdx;
                this.itemCache[cacheIdx].visible = true;
                cacheIdx = ((cacheIdx - 1 + this.itemCache.length) % this.itemCache.length);
            }
        }
        this.itemCacheStart = startIndex;
        this.itemCacheEnd = endIndex;
    }

    private scrollCache(forceItemUpdate?: boolean, synchronizeUpdate?: boolean) {
        let scrollPosition = this.relativeScrollPosition;
        let startIndex = Math.max(Math.floor(scrollPosition / this._minItemHeight), 0);
        let endIndex = Math.min(Math.ceil((scrollPosition + this.viewHeight) / this._minItemHeight) + 1, this._items.length);
        if (this.itemCacheStart !== startIndex || this.itemCacheEnd !== endIndex || forceItemUpdate) {
            if (synchronizeUpdate) {
                this.zone.run(() => {
                    this.scrollCacheUpdate(startIndex, endIndex);
                });
            } else {
                this.scrollCacheUpdate(startIndex, endIndex);
            }
            return true;
        }
        return false;
    }

    private scrollUpdateRequired: boolean = false;

    private onScroll() {
        if (this._dynamicItem && this._items) {
            if (this.scrollCache(false, this.scrollLive)) {
                this.scrollUpdateRequired = true;
            }
        }
    }

    private onScrollEnd() {
        if (this._dynamicItem && this._items) {
            if (this.scrollUpdateRequired) {
                this.scrollUpdateRequired = false;
                this.zone.run(() => {});
            }
        }
    }

    ngDoCheck() {
        if (this._dynamicItem && this._items) {
            if (this.checkCacheSize()) {
                this.scrollCache(true);
            } else {
                this.scrollCache();
            }
        }
    }

    ngOnDestroy() {
        if (this._scrollSubscription) {
            this._scrollSubscription.unsubscribe();
            this._scrollSubscription = null;
        }
        if (this._scrollEndSubscription) {
            this._scrollEndSubscription.unsubscribe();
            this._scrollEndSubscription = null;
        }
        if (this.listSubscription) {
            this.listSubscription.unsubscribe();
            this.listSubscription = null;
        }
    }
}
