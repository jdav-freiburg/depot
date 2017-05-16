import {Component, OnDestroy, OnInit} from "@angular/core";
import template from "./item-state-modal.html";
import style from "./item-state-modal.scss";
import * as _ from "lodash";
import {NavParams, ViewController} from "ionic-angular";
import * as moment from 'moment';
import * as Color from 'color';
import {CalendarEvent, CalendarMonthViewDay } from "angular-calendar";
import {ReservationsDataService} from "../../services/reservations-data";
import {Reservation} from "../../../../../both/models/reservation.model";
import {Subject} from "rxjs/Subject";
import {ItemsDataService} from "../../services/items-data";
import {ItemState} from "../../../../../both/models/item-state.model";
import {Item, itemColor} from "../../../../../both/models/item.model";
import {ItemStateCollection} from "../../../../../both/collections/item-state.collection";
import {Subscription} from "rxjs/Subscription";


@Component({
    selector: "item-state-modal",
    template,
    styles: [ style ]
})
export class ItemStateModal implements OnInit, OnDestroy {
    itemId: string;
    item: Item;
    
    canSelect: boolean = false;
    selectedDate: moment.Moment;
    selectedDay: CalendarMonthViewDay;

    viewDate: moment.Moment;

    events: CalendarEvent[] = [];
    itemEvents: CalendarEvent[] = [];
    reservationEvents: CalendarEvent[] = [];

    refresh: Subject<any> = new Subject();

    days_label: Array<string> = moment.weekdaysShort();

    range: {
        start: moment.Moment,
        end: moment.Moment,
        disableOutside: boolean,
    } = {
        start: null,
        end: null,
        disableOutside: false,
    };

    subscriptionHandle: Meteor.SubscriptionHandle;
    private itemStateSubscription: Subscription;
    private reservationsSubscription: Subscription;
    private itemSubscription: Subscription;

    get _titleText(): string {
        return (this.itemId?(this.item?this.item.name:this.itemId) + " - ":"") + moment(this.viewDate).format("Y - MMM");
    }

    constructor(private viewCtrl: ViewController, private params: NavParams, private itemDataService: ItemsDataService,
                private reservationsDataService: ReservationsDataService) {
        this.viewDate = moment().startOf('day');
        this.itemId = this.params.get('itemId');
        if (this.params.get('rangeEnd')) {
            this.range.end = moment(this.params.get('rangeEnd')).endOf('day');
            if (!this.range.end.isValid()) {
                this.range.end = null;
            }
            this.viewDate = this.range.end;
        }
        if (this.params.get('rangeStart')) {
            this.range.start = moment(this.params.get('rangeStart')).startOf('day');
            if (!this.range.start.isValid()) {
                this.range.start = null;
            }
            this.viewDate = this.range.start;
        }
        if (this.params.get('selectDate')) {
            this.canSelect = true;
            if (!_.isUndefined(this.params.get('canSelect'))) {
                this.canSelect = this.params.get('canSelect');
            }

            if (this.params.get('date')) {
                this.selectedDate = moment(this.params.get('date')).startOf('day');
            } else {
                if (this.range.start) {
                    this.selectedDate = this.range.start;
                } else if (this.range.end) {
                    this.selectedDate = this.range.end;
                } else {
                    this.selectedDate = moment().startOf('day');
                }
            }
            if (this.selectedDate.isValid()) {
                this.viewDate = this.selectedDate;
            } else {
                this.viewDate = moment().startOf('day');
            }
        }
        if (!_.isUndefined(this.params.get('rangeDisableOutside'))) {
            this.range.disableOutside = this.params.get('rangeDisableOutside');
        }
        let skipReservationId = this.params.get('skipReservationId');
        if (this.itemId) {
            this.itemSubscription = this.itemDataService.getItem(this.itemId).zone().subscribe((items) => {
                if (items.length === 1) {
                    this.item = items[0];
                }
            });
            if (this.params.get('showReservations')) {
                this.reservationsSubscription = this.reservationsDataService.getReservationsForItem(this.itemId).zone().subscribe((reservations) => {
                    this.reservationEvents = reservations
                        .filter((reservation: Reservation) => reservation._id !== skipReservationId)
                        .map((reservation: Reservation) => {
                            return {
                                start: reservation.start,
                                end: reservation.end,
                                title: reservation.name,
                                color: {
                                    primary: '#ff3333',
                                    secondary: '#cc6666'
                                },
                                allDay: true,
                            };
                        });
                    this.events = _.concat(this.itemEvents, this.reservationEvents);
                    console.log("events:", this.events);
                });
            }
        }
        this.dayModifier = (day: CalendarMonthViewDay) => {
            let dayDate = moment(day.date).startOf('day');
            if (this.canSelect && this.selectedDate && this.selectedDate.isValid() && dayDate.isSame(this.selectedDate)) {
                day.cssClass = 'cal-day-selected';
                this.selectedDay = day;
            } else if (this.range.disableOutside && this.range.start && dayDate.isBefore(this.range.start)) {
                day.cssClass = 'cal-day-disabled';
            } else if (this.range.disableOutside && this.range.end && dayDate.isAfter(this.range.end)) {
                day.cssClass = 'cal-day-disabled';
            } else if (this.range.start && (!this.range.start || dayDate.isSameOrAfter(this.range.start)) && (!this.range.end || dayDate.isSameOrBefore(this.range.end))) {
                day.cssClass = 'cal-day-range';
            } else {
                day.cssClass = '';
            }
        }
    }

    ngOnInit() {
        if (this.itemId) {
            this.subscribeItemState();
        }
    }

    ngOnDestroy() {
        if (this.subscriptionHandle) {
            this.subscriptionHandle.stop();
            this.subscriptionHandle = null;
        }
        if (this.itemStateSubscription) {
            this.itemStateSubscription.unsubscribe();
            this.itemStateSubscription = null
        }
        if (this.reservationsSubscription) {
            this.reservationsSubscription.unsubscribe();
            this.reservationsSubscription = null;
        }
        if (this.itemSubscription) {
            this.itemSubscription.unsubscribe();
            this.itemSubscription = null;
        }
    }

    subscribeItemState() {
        this.subscriptionHandle = Meteor.subscribe('item.states', {itemId: this.itemId});
        this.itemStateSubscription = ItemStateCollection.find({itemId: this.itemId}).zone().subscribe((states) => {
            this.itemEvents = states
                .map((state: ItemState) => {
                    let condition = '#000000';

                    let lastServiceIdx = state.fieldNames.indexOf('lastService');
                    if (lastServiceIdx !== -1) {
                        condition = '#00ff00';
                    }

                    let conditionIdx = state.fieldNames.indexOf('condition');
                    if (conditionIdx !== -1) {
                        condition = itemColor(Number.parseFloat(state.fieldValues[conditionIdx]));
                    }
                    let conditionSec = Color(condition).lighten(0.15).hex();
                    return {
                        start: state.timestamp,
                        title: (state.comment?state.comment + "<br>":"") + _.zip(state.fieldNames, state.fieldValues).map((data) => data[0] + " = " + data[1]).join(", "),
                        color: {
                            primary: condition,
                            secondary: conditionSec
                        },
                        allDay: false,
                    };
                });
            this.events = _.concat(this.itemEvents, this.reservationEvents);
            console.log("events:", this.events);
        });
    }

    dayModifier: (day: CalendarMonthViewDay) => void;

    select(day: CalendarMonthViewDay) {
        if (this.canSelect && day.cssClass !== 'cal-day-disabled') {
            this.selectedDate = moment(day.date).startOf('day');
            console.log("selected", day);
            if (this.selectedDay) {
                this.selectedDay.cssClass = '';
            }
            this.selectedDay = day;
            this.selectedDay.cssClass = 'cal-day-selected';
            this.refresh.next();
        }
    }

    cancel() {
        this.viewCtrl.dismiss(null);
    }

    save() {
        this.viewCtrl.dismiss({date: this.selectedDate.isValid()?this.selectedDate.toDate():null});
    }
}
