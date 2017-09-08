import {
    ChangeDetectorRef, Directive, DoCheck, EventEmitter, Input, IterableChangeRecord, IterableChanges, IterableDiffer,
    IterableDiffers,
    NgIterable,
    TemplateRef, TrackByFunction,
    ViewContainerRef
} from "@angular/core";
import {Subject} from "rxjs/Subject";
import {BehaviorSubject} from "rxjs/BehaviorSubject";

export class VirtualContext {
    constructor(public $implicit: any, public dynamicItemOf: NgIterable<any>, public index: number, public count: number) {}

    get first(): boolean { return this.index === 0; }

    get last(): boolean { return this.index === this.count - 1; }

    get even(): boolean { return this.index % 2 === 0; }

    get odd(): boolean { return !this.even; }
}

@Directive({
    selector: "[dynamicItem]"
})
export class DynamicItem implements DoCheck {
    constructor(public templateRef: TemplateRef<VirtualContext>, private differs: IterableDiffers) {
    }

    private _itemOf: NgIterable<any> = null;
    private _differ: IterableDiffer<any> = null;

    @Input()
    public dynamicItemTrackBy: TrackByFunction<any>;

    @Input()
    public set dynamicItemOf(dynamicItemOf: NgIterable<any>) {
        this._itemOf = dynamicItemOf;
        this._differ = this.differs.find(dynamicItemOf).create(this.dynamicItemTrackBy);
        this.listChange.next(this._itemOf);
    }

    public get dynamicItemOf(): NgIterable<any> {
        return this._itemOf;
    }

    public readonly listChange: Subject<Iterable<any>> = new BehaviorSubject<Iterable<any>>(null);

    ngDoCheck(): void {
        if (this._differ) {
            let diff = this._differ.diff(this._itemOf);
            if (diff) {
                this.listChange.next(this._itemOf);
            }
        }
    }
}
