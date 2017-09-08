import {Component, NgZone, OnDestroy, ViewChild, AfterViewInit, OnInit, ElementRef, DoCheck} from "@angular/core";
import {ItemsDataService} from "../../services/items-data";
import {Item} from "../../../../../both/models/item.model";
import template from "./calendar-items.html";
import style from "./calendar-items.scss";
import * as _ from "lodash";
import * as moment from 'moment';
import {AlertController, NavController, ScrollEvent, ToastController} from "ionic-angular";
import {TranslateService} from "../../services/translate";
import {QueryObserverTransform} from "../../util/query-observer";
import {Subscription} from "rxjs/Subscription";
import {ExtendedItem, FilterItem, ItemGroup} from "../../util/item";
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
            return this.start.format("MMMM - YYYY");
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

    reservations: CalendarReservation[];
}

class CalendarExtendedItem extends ExtendedItem implements CalendarItem {
    itemGroupRef: CalendarItemGroup;

    reservations: CalendarReservation[] = [];

    pictureUrl: string;

    constructor(item: Item, translate: TranslateService) {
        super(item, translate);
    }
}

class CalendarItemGroup extends ItemGroup<CalendarExtendedItem> implements CalendarItem {
    get pictureUrl(): string {
        return this.subItems[this.activeIndex].pictureUrl;
    }

    reservations: CalendarReservation[] = [];

    public constructor() {
        super();
    }
}

class CalendarReservation {
    _id: string;

    type: string;
    name: string;
    start: moment.Moment;
    end: moment.Moment;

    userId: string;

    groupId: string;

    contact: string;

    itemIds: string[];

    durationDays: number;

    public updateFrom(reservation: Reservation) {
        this._id = reservation._id;
        this.type = reservation.type;
        this.name = reservation.name;
        this.start = moment(reservation.start);
        this.end = moment(reservation.end);
        this.userId = reservation.userId;
        this.groupId = reservation.groupId;
        this.contact = reservation.contact;
        this.itemIds = _.clone(reservation.itemIds);

        this.durationDays = this.end.diff(this.start, 'days');
    }

    public constructor(reservation: Reservation) {
        this.updateFrom(reservation);
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

    private reservations: QueryObserverTransform<Reservation, CalendarReservation>;

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

    private lastScroll: number;
    private canScroll: boolean = true;

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
            transformer: (item, transformed: CalendarExtendedItem) => {
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
            removed: (item, transformed: CalendarExtendedItem, index) => {
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

        this.reservations = new QueryObserverTransform<Reservation, CalendarReservation>({
            query: this.reservationsService.getReservations(),
            zone: this.ngZone,
            transformer: (reservation, transformed: CalendarReservation) => {
                if (transformed) {
                    transformed.itemIds.forEach((itemId) => {
                        if (this.itemGroupsItemIndex.hasOwnProperty(itemId)) {
                            _.remove(this.itemGroupsItemIndex[itemId].reservations, (itemRes) => itemRes == transformed);
                        }
                    });
                    transformed.updateFrom(reservation);
                } else {
                    transformed = new CalendarReservation(reservation);
                }
                transformed.itemIds.forEach((itemId) => {
                    if (this.itemGroupsItemIndex.hasOwnProperty(itemId)) {
                        this.itemGroupsItemIndex[itemId].reservations.push(transformed);
                    }
                });
                return transformed;
            },
            removed: (reservation, transformed: CalendarReservation, index) => {
                if (transformed) {
                    transformed.itemIds.forEach((itemId) => {
                        if (this.itemGroupsItemIndex.hasOwnProperty(itemId)) {
                            _.remove(this.itemGroupsItemIndex[itemId].reservations, (itemRes) => itemRes == transformed);
                        }
                    });
                }
            }
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
            });
        } else {
            _.forEach(this.itemGroups, (item) => {
                item.visible = item.checkFilters(this._filterQuery);
            });
            this.filteredItems = _.filter(this.itemGroups, item => item.visible);
        }
        console.log("Update filter " + this._filter + " --> " + this.filteredItems.length + "/" + (this.itemGroups?this.itemGroups.length:0) + " items");
        this.checkCacheSize();
        this.scrollCache(true);
    }

    private checkCacheSize(): boolean {
        let natEl: HTMLDivElement = this.timetableContainer.nativeElement;
        let dayCacheSize = Math.ceil((Math.ceil(natEl.clientWidth / this.elementWidth) + 1) * 1.5);
        let itemCacheSize = Math.ceil((Math.ceil(natEl.clientHeight / this.elementHeight) + 1) * 1.5);
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
        return hadChange;
    }

    ngAfterViewInit() {
        this.updateDays();
        this.scrollCache();
    }

    ngDoCheck() {
        if (this.checkCacheSize()) {
            this.scrollCache();
        }
    }

    private scrollCache(forceItemUpdate?: boolean) {
        let natEl: HTMLDivElement = this.timetableContainer.nativeElement;
        {
            let startIndex = Math.max(Math.floor(natEl.scrollLeft / this.elementWidth), 0);
            let endIndex = Math.min(Math.ceil((natEl.scrollLeft + natEl.clientWidth) / this.elementWidth) + 1, this.days.length);
            if (this.dayCacheStart !== startIndex || this.dayCacheEnd !== endIndex) {
                let startIdx = _.findIndex(this.dayCache, (cache) => cache.visible && cache.srcIndex === startIndex);
                let endIdx = _.findIndex(this.dayCache, (cache) => cache.visible && cache.srcIndex === endIndex-1);
                _.forEach(this.dayCache, (cache) => { cache.visible = false });
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
            let startIndex = Math.max(Math.floor(natEl.scrollTop / this.elementHeight), 0);
            let endIndex = Math.min(Math.ceil((natEl.scrollTop + natEl.clientHeight) / this.elementHeight) + 1, this.filteredItems.length);
            if (this.itemCacheStart !== startIndex || this.itemCacheEnd !== endIndex || forceItemUpdate) {
                let startIdx = _.findIndex(this.itemCache, (cache) => cache.visible && cache.srcIndex === startIndex);
                let endIdx = _.findIndex(this.itemCache, (cache) => cache.visible && cache.srcIndex === endIndex - 1);
                _.forEach(this.itemCache, (cache) => { cache.visible = false });
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
        let natEl: HTMLDivElement = this.timetableContainer.nativeElement;
        let visibleElements = Math.max(Math.ceil(natEl.clientWidth / this.elementWidth) * 3, 30*3);

        this.days = [];
        let day = moment(this.centerDay.start).subtract(Math.floor(visibleElements / 2), 'days');
        for (let i = 0; i < visibleElements; i++) {
            this.days.push(new Day(day, i));
            day.add(1, 'days');
        }

        natEl.scrollLeft = visibleElements * this.elementWidth / 2 - natEl.clientWidth / 2;
    }

    private isEventVisible(start: moment.Moment, end: moment.Moment): boolean {
        return this.days.length && this.days[0].start.isBefore(end) && this.days[this.days.length - 1].end.isAfter(start);
    }

    private filterReservations(reservations: CalendarReservation[]) {
        return _.filter(reservations, (reservation) => this.isEventVisible(reservation.start, reservation.end))
    }

    private getEventStartPosition(start: moment.Moment): number {
        return Math.max(start.diff(this.days[0].start, 'days') * this.elementWidth, 0);
    }

    private getEventWidth(start: moment.Moment, end: moment.Moment): number {
        let dayStart = Math.max(start.diff(this.days[0].start, 'days'), 0);
        let dayEnd = Math.min(end.diff(this.days[0].start, 'days') + 1, this.days.length);
        return (dayEnd - dayStart) * this.elementWidth;
    }

    private onScroll() {
        let natEl: HTMLDivElement = this.timetableContainer.nativeElement;
        this.offsetTop = -natEl.scrollTop;
        this.offsetLeft = -natEl.scrollLeft;
        let centerPos = (natEl.scrollLeft + natEl.clientWidth / 2);
        let centerIndex = Math.floor(centerPos / this.elementWidth);
        this.centerDay = this.days[centerIndex];
        this.centerDayOffset = centerPos - centerIndex * this.elementWidth;
        let delta = natEl.scrollLeft - this.lastScroll;
        this.lastScroll = natEl.scrollLeft;
        console.log(delta, natEl.scrollLeft, natEl.scrollWidth - natEl.clientWidth - natEl.clientWidth / 2);
        let margin = Math.max(natEl.clientWidth / 2, this.elementWidth*10);
        if ((delta < 0 && natEl.scrollLeft <= margin) || (delta > 0 && natEl.scrollLeft >= (natEl.scrollWidth - natEl.clientWidth - margin)) && this.canScroll) {
            this.canScroll = false;
            this.updateDays();
            setTimeout(() => {
                this.canScroll = true;
            }, 100);
        }
        this.scrollCache();
    }

    private openReservation(reservation: Reservation) {
        if (reservation) {
            this.navCtrl.push(ReservationPage, {reservationId: reservation._id});
        }
    }
}
