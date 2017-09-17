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
import {ExtendedItem} from "../../util/item";
import {Reservation} from "../../../../../both/models/reservation.model";
import {ReservationsDataService} from "../../services/reservations-data";
import {ReservationPage} from "../reservation/reservation";
import {ItemStateCollection} from "../../../../../both/collections/item-state.collection";
import {ItemState} from "../../../../../both/models/item-state.model";

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

class CalendarItem extends ExtendedItem implements CalendarItem {
    reservations: CalendarReservation[] = [];
    states: CalendarItemState[] = [];

    constructor(item: Item, translate: TranslateService) {
        super(item, translate);
    }
}

class CalendarItemState {
    public start: moment.Moment;
    public end: moment.Moment;

    public set nextState(nextState: CalendarItemState) {
        this.end = moment(nextState.timestamp).startOf('day').subtract(1, 'days');
    }

    public update(itemId: string, timestamp: moment.Moment, condition: string) {
        this.itemId = itemId;
        this.timestamp = timestamp;
        this.condition = condition;
        this.start = moment(this.timestamp).startOf('day');
    }

    constructor(public _id: string, public itemId: string, public timestamp: moment.Moment, public condition: string) {
        this.start = moment(this.timestamp).startOf('day');
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
    public firstOfGroup: boolean = false;
    public lastOfGroup: boolean = false;

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
    private items: QueryObserverTransform<Item, CalendarItem>;
    private itemsChangedSubscription: Subscription;

    private itemStateSubscriptionHandle: Meteor.SubscriptionHandle = null;
    private itemStateSubscription: QueryObserverTransform<ItemState, CalendarItemState> = null;

    private itemIndex: {[id:string]: CalendarItem} = {};
    private itemStateIndex: {[id:string]: CalendarItemState[]} = {};

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
                private reservationsService: ReservationsDataService,
                private navCtrl: NavController) {
    }

    ngOnInit() {
        let self = this;
        this.items = new QueryObserverTransform<Item, CalendarItem>({
            query: this.itemsService.getPublicItems(),
            zone: this.ngZone,
            transformer: (item, transformed: CalendarItem) => {
                if (transformed) {
                    transformed.updateFrom(item, this.translate);
                } else {
                    transformed = new CalendarItem(item, this.translate);

                    if (this.itemStateIndex.hasOwnProperty(transformed._id)) {
                        transformed.states = this.itemStateIndex[transformed._id];
                    }
                }
                this.itemIndex[transformed._id] = transformed;

                return transformed;
            },
            removed: (item, transformed: CalendarItem, index) => {
                if (transformed) {
                    delete this.itemIndex[transformed._id];
                    if (this.itemStateIndex.hasOwnProperty(transformed._id)) {
                        delete this.itemStateIndex[transformed._id];
                    }
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
                        if (this.itemIndex.hasOwnProperty(itemId)) {
                            _.remove(this.itemIndex[itemId].reservations, (itemRes) => itemRes == transformed);
                        }
                    });
                    transformed.updateFrom(reservation);
                } else {
                    transformed = new CalendarReservation(reservation);
                }
                transformed.itemIds.forEach((itemId) => {
                    if (this.itemIndex.hasOwnProperty(itemId)) {
                        this.itemIndex[itemId].reservations.push(transformed);
                    }
                });
                return transformed;
            },
            removed: (reservation, transformed: CalendarReservation, index) => {
                if (transformed) {
                    transformed.itemIds.forEach((itemId) => {
                        if (this.itemIndex.hasOwnProperty(itemId)) {
                            _.remove(this.itemIndex[itemId].reservations, (itemRes) => itemRes == transformed);
                        }
                    });
                }
            }
        });
    }

    private loadItemStates() {
        if (this.itemStateSubscriptionHandle == null) {
            this.itemStateSubscriptionHandle = Meteor.subscribe('item.states.all.condition');
        }
        if (this.itemStateSubscription != null) {
            this.itemStateSubscription.unsubscribe();
            this.itemStateSubscription = null;
        }
        this.itemStateSubscription = new QueryObserverTransform<ItemState, CalendarItemState>({
            query: ItemStateCollection.find({'fields.condition': {$exists: true}}, {sort: {timestamp: 1}}),
            zone: this.ngZone,
            transformer: (state, transformed) => {
                if (transformed) {
                    transformed.update(state.itemId, moment(state.timestamp), state.fields.condition);
                } else {
                    transformed = new CalendarItemState(state._id, state.itemId, moment(state.timestamp), state.fields.condition);
                    let states: CalendarItemState[];
                    if (this.itemStateIndex.hasOwnProperty(state.itemId)) {
                        states = this.itemStateIndex[state.itemId];
                        if (states[states.length - 1].timestamp.isBefore(transformed.timestamp)) {
                            states[states.length - 1].nextState = transformed;
                            states.push(transformed);
                        } else {
                            for (let i = 0; i < states.length; i++) {
                                if (states[i].timestamp.isAfter(state.timestamp)) {
                                    if (i > 0) {
                                        states[i - 1].nextState = transformed;
                                    }
                                    transformed.nextState = states[i];
                                    states.splice(i, 0, transformed);
                                    break;
                                }
                            }
                        }
                    } else {
                        states = this.itemStateIndex[state.itemId] = [transformed];
                        if (this.itemIndex.hasOwnProperty(state.itemId)) {
                            this.itemIndex[state.itemId].states = states;
                        }
                    }
                }
                return transformed;
            },
        });
    }

    ngOnDestroy() {
        if (this.itemsChangedSubscription != null) {
            this.itemsChangedSubscription.unsubscribe();
            this.itemsChangedSubscription = null;
        }
        if (this.itemStateSubscription != null) {
            this.itemStateSubscription.unsubscribe();
            this.itemStateSubscription = null;
        }
        if (this.itemStateSubscriptionHandle != null) {
            this.itemStateSubscriptionHandle.stop();
            this.itemStateSubscriptionHandle = null;
        }
        if (this.items != null) {
            this.items.unsubscribe();
            this.items = null;
        }
        if (this.reservations != null) {
            this.reservations.unsubscribe();
            this.reservations = null;
        }
    }

    public updateFilter() {
        if (!this.items) {
            this.filteredItems = [];
        } else if (!this._filter || this._filter.length < 3) {
            this.filteredItems = this.items.data;
            _.forEach(this.items.data, (item, i) => {
                item.visible = true;
            });
        } else {
            _.forEach(this.items.data, (item) => {
                item.visible = item.checkFilters(this._filterQuery);
            });
            this.filteredItems = _.filter(this.items.data, item => item.visible);
        }
        console.log("Update filter " + this._filter + " --> " + this.filteredItems.length + "/" + (this.items && this.items.data?this.items.data.length:0) + " items");
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
                    let prevGroup = startIndex > 0 ? this.filteredItems[startIndex - 1].itemGroup : "";
                    for (let i = startIndex; i < endIndex; i++) {
                        let nextGroup = i < this.filteredItems.length - 1 ? this.filteredItems[i + 1].itemGroup : "";
                        this.itemCache[cacheIdx].srcIndex = i;
                        this.itemCache[cacheIdx].item = this.filteredItems[i];
                        this.itemCache[cacheIdx].firstOfGroup = (_.isEmpty(this.filteredItems[i].itemGroup) || prevGroup != this.filteredItems[i].itemGroup);
                        this.itemCache[cacheIdx].lastOfGroup = (_.isEmpty(this.filteredItems[i].itemGroup) || nextGroup != this.filteredItems[i].itemGroup);
                        this.itemCache[cacheIdx].y = i * this.elementHeight;
                        this.itemCache[cacheIdx].index = cacheIdx;
                        this.itemCache[cacheIdx].visible = true;
                        prevGroup = this.filteredItems[i].itemGroup;
                        cacheIdx = ((cacheIdx + 1) % this.itemCache.length);
                    }
                } else {
                    let cacheIdx = endIdx;
                    let nextGroup = endIndex < this.filteredItems.length - 1 ? this.filteredItems[endIndex + 1].itemGroup : "";
                    for (let i = endIndex - 1; i >= startIndex; i--) {
                        let prevGroup = i > 0 ? this.filteredItems[i - 1].itemGroup : "";
                        this.itemCache[cacheIdx].srcIndex = i;
                        this.itemCache[cacheIdx].item = this.filteredItems[i];
                        this.itemCache[cacheIdx].firstOfGroup = (_.isEmpty(this.filteredItems[i].itemGroup) || prevGroup != this.filteredItems[i].itemGroup);
                        this.itemCache[cacheIdx].lastOfGroup = (_.isEmpty(this.filteredItems[i].itemGroup) || nextGroup != this.filteredItems[i].itemGroup);
                        this.itemCache[cacheIdx].y = i * this.elementHeight;
                        this.itemCache[cacheIdx].index = cacheIdx;
                        this.itemCache[cacheIdx].visible = true;
                        nextGroup = this.filteredItems[i].itemGroup;
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

    private isStateVisible(start: moment.Moment, end: moment.Moment): boolean {
        return this.days.length && (!end || this.days[0].start.isBefore(end)) && (!start || this.days[this.days.length - 1].end.isAfter(start));
    }

    private filterReservations(reservations: CalendarReservation[]) {
        return _.filter(reservations, (reservation) => this.isEventVisible(reservation.start, reservation.end))
    }

    private filterStates(states: CalendarItemState[]) {
        return _.filter(states, (state) => this.isStateVisible(state.start, state.end))
    }

    private getEventStartPosition(start: moment.Moment): number {
        return start?Math.max(start.diff(this.days[0].start, 'days') * this.elementWidth, 0):0;
    }

    private getEventWidth(start: moment.Moment, end: moment.Moment): number {
        let dayStart = Math.max(start.diff(this.days[0].start, 'days'), 0);
        let dayEnd = Math.min(end.diff(this.days[0].start, 'days') + 1, this.days.length);
        return (dayEnd - dayStart) * this.elementWidth;
    }

    private getStateStartPosition(start: moment.Moment): number {
        return start?Math.max(start.diff(this.days[0].start, 'days') * this.elementWidth, 0):0;
    }

    private getStateWidth(start: moment.Moment, end: moment.Moment): number {
        let dayStart = start?Math.max(start.diff(this.days[0].start, 'days'), 0):0;
        let dayEnd = end?Math.min(end.diff(this.days[0].start, 'days') + 1, this.days.length):this.days.length;
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
