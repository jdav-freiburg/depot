import {Component, NgZone, OnDestroy, ViewChild, AfterViewInit, OnInit, ElementRef, DoCheck} from "@angular/core";
import {ItemsDataService} from "../../services/items-data";
import {Item} from "../../../../../both/models/item.model";
import template from "./calendar-items.html";
import style from "./calendar-items.scss";
import * as _ from "lodash";
import * as moment from 'moment';
import {AlertController, NavController, ScrollEvent, ToastController} from "ionic-angular";
import {TranslateService} from "../../services/translate";
import {ChangeableDataTransform, QueryObserver, QueryObserverTransform} from "../../util/query-observer";
import {Subscription} from "rxjs/Subscription";
import {ExtendedItem, FilterItem, ItemGroup, SelectableItemGroup} from "../../util/item";
import {PictureService} from "../../services/picture";
import {Reservation} from "../../../../../both/models/reservation.model";
import {ReservationsDataService} from "../../services/reservations-data";
import {ReservationPage} from "../reservation/reservation";

class Day {
    public start: moment.Moment;
    public end: moment.Moment;
    public index: number;

    public constructor(start: moment.Moment, index: number) {
        this.start = moment(start).startOf("day");
        this.end = moment(start).endOf("day");
        this.index = index;
    }

    public get monthName(): string {
        if (this.start.date() === 1) {
            return this.start.format("MMMM");
        }
        return "";
    }

    public get monthDay(): string {
        return this.start.format("D");
    }

    public get isLast(): boolean {
        return this.start.date() === this.start.daysInMonth();
    }
}

interface CalendarItem extends FilterItem {
    readonly pictureUrl: string;

    index: number;
    viewIndex: number;

    reservations: Reservation[];

    isReserved(day: Day): boolean;
    hasService(day: Day): boolean;

    reservation(day: Day): Reservation;
    reservationName(day: Day): string;
}

class CalendarExtendedItem extends ExtendedItem implements CalendarItem {
    itemGroupRef: CalendarItemGroup;

    index: number;
    viewIndex: number;

    reservations: Reservation[] = [];

    pictureUrl: string;

    constructor(item: Item, translate: TranslateService) {
        super(item, translate);
    }

    isReserved(day: Day): boolean {
        return day && _.some(this.reservations, (reservation) => {
            return reservation.end.getTime() >= day.start.valueOf() && reservation.start.getTime() <= day.end.valueOf();
        });
    }

    reservation(day: Day): Reservation {
        if (!day) {
            return null;
        }
        return _.find(this.reservations, (reservation) => reservation.end.getTime() >= day.start.valueOf() && reservation.start.getTime() <= day.end.valueOf());
    }

    reservationName(day: Day): string {
        if (!day) {
            return null;
        }
        let res = _.find(this.reservations, (reservation) => reservation.start.getTime() >= day.start.valueOf() && reservation.start.getTime() <= day.end.valueOf());
        if (!res) {
            return null;
        }
        return res.name;
    }

    hasService(day: Day): boolean {
        return false;
    }
}

class CalendarItemGroup extends ItemGroup<CalendarExtendedItem> implements CalendarItem {
    get pictureUrl(): string {
        return this.subItems[this.activeIndex].pictureUrl;
    }

    index: number;
    viewIndex: number;

    reservations: Reservation[] = [];

    public constructor() {
        super();
    }

    isReserved(day: Day): boolean {
        return day && _.some(this.subItems, (subItem) => subItem.isReserved(day));
    }

    hasService(day: Day): boolean {
        return false;
    }

    reservation(day: Day): Reservation {
        return day && this.subItems[0].reservation(day);
    }

    reservationName(day: Day): string {
        return day && this.subItems[0].reservationName(day);
    }
}

class ItemCache {
    public index: number;
    public srcIndex: number;
    public item: CalendarItem = null;
    public y: number;
    public visible: boolean = false;

    constructor(index: number) {
        this.index = index;
    }
}

class DayCache {
    public index: number = 0;
    public srcIndex: number = 0;
    public day: Day = null;
    public x: number = 0;
    public visible: boolean = false;
    
    constructor(index: number) {
        this.index = index;
    }
}

@Component({
    selector: "calendar-items-page",
    template,
    styles: [ style ]
})
export class CalendarItemsPage implements OnInit, OnDestroy, AfterViewInit, DoCheck {
    private items: QueryObserverTransform<Item, CalendarExtendedItem>;
    private itemsChangedSubscription: Subscription;

    private itemGroups: CalendarItem[] = [];
    private itemGroupsIndex: {[id:string]: CalendarItemGroup} = {};
    private itemGroupsItemIndex: {[id:string]: CalendarItem} = {};

    private filteredItems: CalendarItem[] = [];

    private reservations: QueryObserver<Reservation>;

    private _filter: string = "";
    private _filterQuery: string[] = [];

    private get filter(): string {
        return this._filter;
    }

    private set filter(value: string) {
        this._filter = value;
        this._filterQuery = value.toLowerCase().split(/\s+/);
        this.updateFilter();
    }

    private firstDay: Day = new Day(moment(), -1);
    private centerDay: Day = new Day(moment(), -1);
    private centerDayOffset: number = 0.0;
    private days: Day[] = [];

    @ViewChild('timetableContainer') private timetableContainer: ElementRef;
    @ViewChild('timetable') private timetable: ElementRef;
    @ViewChild('timetableContainerHeader') private timetableContainerHeader: ElementRef;
    @ViewChild('description') private description: ElementRef;

    private elementWidth: number = 30;
    private elementHeight: number = 30;
    private offsetLeft: number = 0;
    private offsetTop: number = 0;

    private itemCache: ItemCache[] = [];
    private itemCacheStart: number = 0;
    private itemCacheEnd: number = 0;
    private dayCache: DayCache[] = [];
    private dayCacheStart: number = 0;
    private dayCacheEnd: number = 0;

    constructor(private itemsService: ItemsDataService,
                private translate: TranslateService, private ngZone: NgZone,
                private pictureService: PictureService, private reservationsService: ReservationsDataService,
                private navCtrl: NavController) {
    }

    ngOnInit() {
        let self = this;
        this.items = new QueryObserverTransform<Item, CalendarExtendedItem>({
            query: this.itemsService.getPublicItems(),
            zone: this.ngZone,
            transformer: (item) => {
                let transformed: CalendarExtendedItem = (<ChangeableDataTransform<Item, CalendarExtendedItem>>item)._transformed;
                if (transformed) {
                    if (item.itemGroup !== transformed.itemGroup) {
                        if (transformed.itemGroup) {
                            let itemGroup = transformed.itemGroupRef;
                            if (!itemGroup) {
                                console.log("ERROR: Data inconsistent");
                            } else {
                                let removed = _.remove(itemGroup.subItems, item);
                                if (removed.length !== 1) {
                                    console.log("ERROR: Data inconsistent");
                                }
                                if (itemGroup.subItems.length === 0) {
                                    let removed = _.remove(this.itemGroups, (itemGroupRef) => itemGroupRef === itemGroup);
                                    delete this.itemGroupsIndex[transformed.itemGroup];
                                    if (removed.length !== 1) {
                                        console.log("ERROR: Data inconsistent");
                                    }
                                } else {
                                    itemGroup.update();
                                }
                            }
                            transformed.itemGroupRef = null;
                        } else {
                            let removed = _.remove(this.itemGroups, (itemGroupRef) => itemGroupRef === transformed);
                            if (removed.length !== 1) {
                                console.log("ERROR: Data inconsistent");
                            }
                        }
                    }
                    transformed.updateFrom(item, this.translate);
                } else {
                    transformed = new CalendarExtendedItem(item, this.translate);
                }
                if (transformed.picture) {
                    transformed.pictureUrl = this.pictureService.getPictureThumbnailUrl(transformed.picture);
                }
                if (!transformed.itemGroupRef) {
                    if (transformed.itemGroup) {
                        let itemGroup: CalendarItemGroup;
                        if (this.itemGroupsIndex.hasOwnProperty(transformed.itemGroup)) {
                            itemGroup = this.itemGroupsIndex[transformed.itemGroup];
                        } else {
                            itemGroup = new CalendarItemGroup();
                            this.itemGroupsIndex[transformed.itemGroup] = itemGroup;
                            this.itemGroups.push(itemGroup);
                        }
                        transformed.itemGroupRef = itemGroup;
                        itemGroup.subItems.push(transformed);
                        itemGroup.update();
                    } else {
                        transformed.itemGroupRef = null;
                        this.itemGroups.push(transformed);
                    }
                }
                this.itemGroupsItemIndex[transformed._id] = transformed;
                return transformed;
            },
            removed: (item, index) => {
                let transformed: CalendarExtendedItem = (<any>item)._transformed;
                if (transformed) {
                    if (transformed.itemGroup) {
                        let itemGroup = this.itemGroupsIndex[transformed.itemGroup];
                        if (!itemGroup) {
                            console.log("ERROR: Data inconsistent");
                        } else {
                            let removed = _.remove(itemGroup.subItems, item);
                            if (removed.length !== 1) {
                                console.log("ERROR: Data inconsistent");
                            }
                            if (itemGroup.subItems.length === 0) {
                                let removed = _.remove(this.itemGroups, (itemGroupDel) => itemGroupDel === itemGroup);
                                delete this.itemGroupsIndex[transformed.itemGroup];
                                if (removed.length !== 1) {
                                    console.log("ERROR: Data inconsistent");
                                }
                            } else {
                                itemGroup.update();
                            }
                        }
                        transformed.itemGroupRef = null;
                    }
                    delete this.itemGroupsItemIndex[transformed._id];
                }
            }
        });

        this.itemsChangedSubscription = this.items.dataChanged.subscribe(() => {
            this.updateFilter();
        });

        this.reservations = new QueryObserver<Reservation>(this.reservationsService.getReservations(), this.ngZone, true);
        this.reservations.dataChanged.subscribe((reservations) => {
            this.itemGroups.forEach((itemGroup) => {
                itemGroup.reservations = [];
            });
            reservations.forEach((reservation) => {
                reservation.itemIds.forEach((itemId) => {
                    if (this.itemGroupsItemIndex.hasOwnProperty(itemId)) {
                        this.itemGroupsItemIndex[itemId].reservations.push(reservation);
                    }
                });
            });
        });
    }

    ngOnDestroy() {
        if (this.itemsChangedSubscription) {
            this.itemsChangedSubscription.unsubscribe();
            this.itemsChangedSubscription = null;
        }
        if (this.items) {
            this.items.unsubscribe();
            this.items = null;
        }
        if (this.reservations) {
            this.reservations.unsubscribe();
            this.reservations = null;
        }
    }

    public updateFilter() {
        if (!this.items) {
            this.filteredItems = [];
        } else if (!this._filter || this._filter.length < 3) {
            this.filteredItems = this.itemGroups;
            _.forEach(this.itemGroups, (item, i) => {
                item.visible = true;
                item.index = i;
                item.viewIndex = i;
            });
        } else {
            _.forEach(this.itemGroups, (item) => {
                item.visible = item.checkFilters(this._filterQuery);
            });
            this.filteredItems = _.filter(this.itemGroups, item => item.visible);
            let idx = 0;
            for (let i = 0; i < this.filteredItems.length; i++) {
                this.filteredItems[i].index = idx;
                this.filteredItems[i].viewIndex = idx;
                idx++;
            }
        }
        console.log("Update filter " + this._filter + " --> " + this.filteredItems.length + "/" + (this.itemGroups?this.itemGroups.length:0) + " items");
    }

    ngAfterViewInit() {
        this.updateDays();
        this.timetableContainer.nativeElement.scrollLeft = this.timetableContainer.nativeElement.scrollWidth / 2 - this.timetableContainer.nativeElement.clientWidth / 2;
        this.scrollCache();
    }

    ngDoCheck() {
        let dayCacheSize = Math.ceil((Math.ceil(this.timetableContainer.nativeElement.clientWidth / this.elementWidth) + 1) * 1.5);
        let itemCacheSize = Math.ceil((Math.ceil(this.timetableContainer.nativeElement.clientHeight / this.elementHeight) + 1) * 1.5);
        let hadChange = false;
        while (this.dayCache.length < dayCacheSize) {
            this.dayCache.push(new DayCache(this.dayCache.length));
            hadChange = true;
        }
        while (this.dayCache.length > dayCacheSize) {
            let removeIdx = _.findIndex(this.dayCache, (cache) => !cache.visible);
            this.dayCache.splice(removeIdx, 1);
            hadChange = true;
        }
        while (this.itemCache.length < itemCacheSize) {
            this.itemCache.push(new ItemCache(this.itemCache.length));
            hadChange = true;
        }
        if (this.itemCache.length > itemCacheSize) {
            let removeIdx = _.findIndex(this.itemCache, (cache) => !cache.visible);
            this.itemCache.splice(removeIdx, 1);
            hadChange = true;
        }
        if (hadChange) {
            this.scrollCache();
        }
    }

    private scrollCache() {
        {
            let startIndex = Math.max(Math.floor(this.timetableContainer.nativeElement.scrollLeft / this.elementWidth), 0);
            let endIndex = Math.min(Math.ceil((this.timetableContainer.nativeElement.scrollLeft + this.timetableContainer.nativeElement.clientWidth) / this.elementWidth) + 1, this.days.length);
            if (this.dayCacheStart !== startIndex || this.dayCacheEnd !== endIndex) {
                let startIdx = _.findIndex(this.dayCache, (cache) => cache.visible && cache.srcIndex === startIndex);
                let endIdx = _.findIndex(this.dayCache, (cache) => cache.visible && cache.srcIndex === endIndex-1);
                _.forEach(this.dayCache, (cache) => cache.visible = false);
                if (startIdx !== -1 || endIdx === -1) {
                    let cacheIdx = 0;
                    if (startIdx !== -1) {
                        cacheIdx = startIdx;
                    }
                    for (let i = startIndex; i < endIndex; i++) {
                        this.dayCache[cacheIdx].srcIndex = i;
                        this.dayCache[cacheIdx].day = this.days[i];
                        this.dayCache[cacheIdx].x = i * this.elementWidth;
                        this.dayCache[cacheIdx].index = cacheIdx;
                        this.dayCache[cacheIdx].visible = true;
                        cacheIdx = ((cacheIdx + 1) % this.dayCache.length);
                    }
                } else {
                    let cacheIdx = endIdx;
                    for (let i = endIndex - 1; i >= startIndex; i--) {
                        this.dayCache[cacheIdx].srcIndex = i;
                        this.dayCache[cacheIdx].day = this.days[i];
                        this.dayCache[cacheIdx].x = i * this.elementWidth;
                        this.dayCache[cacheIdx].index = cacheIdx;
                        this.dayCache[cacheIdx].visible = true;
                        cacheIdx = ((cacheIdx - 1 + this.dayCache.length) % this.dayCache.length);
                    }
                }
                this.dayCacheStart = startIndex;
                this.dayCacheEnd = endIndex;
            }
        }
        {
            let startIndex = Math.max(Math.floor(this.timetableContainer.nativeElement.scrollTop / this.elementHeight), 0);
            let endIndex = Math.min(Math.ceil((this.timetableContainer.nativeElement.scrollTop + this.timetableContainer.nativeElement.clientHeight) / this.elementHeight) + 1, this.filteredItems.length);
            if (this.itemCacheStart !== startIndex || this.itemCacheEnd !== endIndex) {
                let startIdx = _.findIndex(this.itemCache, (cache) => cache.visible && cache.srcIndex === startIndex);
                let endIdx = _.findIndex(this.itemCache, (cache) => cache.visible && cache.srcIndex === endIndex - 1);
                _.forEach(this.itemCache, (cache) => cache.visible = false);
                if (startIdx !== -1 || endIdx === -1) {
                    let cacheIdx = 0;
                    if (startIdx !== -1) {
                        cacheIdx = startIdx;
                    }
                    for (let i = startIndex; i < endIndex; i++) {
                        this.itemCache[cacheIdx].srcIndex = i;
                        this.itemCache[cacheIdx].item = this.filteredItems[i];
                        this.itemCache[cacheIdx].y = i * this.elementHeight;
                        this.itemCache[cacheIdx].index = cacheIdx;
                        this.itemCache[cacheIdx].visible = true;
                        cacheIdx = ((cacheIdx + 1) % this.itemCache.length);
                    }
                } else {
                    let cacheIdx = endIdx;
                    for (let i = endIndex - 1; i >= startIndex; i--) {
                        this.itemCache[cacheIdx].srcIndex = i;
                        this.itemCache[cacheIdx].item = this.filteredItems[i];
                        this.itemCache[cacheIdx].y = i * this.elementHeight;
                        this.itemCache[cacheIdx].index = cacheIdx;
                        this.itemCache[cacheIdx].visible = true;
                        cacheIdx = ((cacheIdx - 1 + this.itemCache.length) % this.itemCache.length);
                    }
                }
                this.itemCacheStart = startIndex;
                this.itemCacheEnd = endIndex;
            }
        }
    }

    private updateDays() {
        let parentWidth = this.timetableContainer.nativeElement.clientWidth;
        let visibleElements = Math.ceil(parentWidth / this.elementWidth) * 3;

        this.days = [];
        let day = moment(this.centerDay.start).subtract(Math.floor(visibleElements / 2), 'days');
        for (let i = 0; i < visibleElements; i++) {
            this.days.push(new Day(day, i));
            day.add(1, 'days');
        }
    }

    private onScroll($event: ScrollEvent) {
        this.offsetTop = -this.timetableContainer.nativeElement.scrollTop;
        this.offsetLeft = -this.timetableContainer.nativeElement.scrollLeft;
        let centerPos = (this.timetableContainer.nativeElement.scrollLeft + this.timetableContainer.nativeElement.clientWidth / 2);
        let centerIndex = Math.floor(centerPos / this.elementWidth);
        this.centerDay = this.days[centerIndex];
        this.centerDayOffset = centerPos - centerIndex * this.elementWidth;
        this.scrollCache();
    }

    private openReservation(reservation: Reservation) {
        if (reservation) {
            this.navCtrl.push(ReservationPage, {reservationId: reservation._id});
        }
    }
}
