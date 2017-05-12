import { Component } from "@angular/core";
import template from "./item-history-modal.html";
import style from "./item-history-modal.scss";
import * as _ from "lodash";
import {NavParams, ViewController} from "ionic-angular";
import * as moment from 'moment';
import {CalendarEvent, CalendarMonthViewDay } from "angular-calendar";
import {ReservationsDataService} from "../../services/reservations-data";
import {Reservation} from "../../../../../both/models/reservation.model";
import {Subject} from "rxjs/Subject";
import {ItemsDataService} from "../../services/items-data";
import {ItemState} from "../../../../../both/models/item-state.model";
import {Item} from "../../../../../both/models/item.model";

@Component({
    selector: "item-history-modal",
    template,
    styles: [ style ]
})
export class ItemHistoryModal {
    itemId: string;
    item: Item;

    get _titleText(): string {
        return (this.item?this.item.name:this.itemId) + " - " + moment(this.viewDate).format("Y - MMM");
    }

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

    constructor(private viewCtrl: ViewController, private params: NavParams, private itemDataService: ItemsDataService,
                private reservationsDataService: ReservationsDataService) {
        this.viewDate = moment().startOf('day');
        this.itemId = this.params.get('itemId');
        if (this.params.get('rangeStart')) {
            this.range.start = moment(this.params.get('rangeStart')).startOf('day');
        }
        if (this.params.get('rangeEnd')) {
            this.range.end = moment(this.params.get('rangeEnd')).endOf('day');
        }
        if (!_.isUndefined(this.params.get('rangeDisableOutside'))) {
            this.range.disableOutside = this.params.get('rangeDisableOutside');
        }
        let skipReservationId = this.params.get('skipReservationId');
        this.itemDataService.getItem(this.itemId).zone().subscribe((items) => {
            if (items.length === 1) {
                this.item = items[0];
            }
        });
        if (this.params.get('showReservations')) {
            this.reservationsDataService.getReservationsForItem(this.itemId).zone().subscribe((reservations) => {
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
            });
        }
        if (this.itemId) {
            this.itemDataService.getStates(this.itemId).zone().subscribe((states) => {
                this.itemEvents = states
                    .map((state: ItemState) => {
                    let condition = '#000000';
                    let conditionSec = '#444444';

                    let lastServiceIdx = state.fieldNames.indexOf('lastService');
                    if (lastServiceIdx !== -1) {
                        condition = '#00ff00';
                        conditionSec = '#00cc00';
                    }

                    let conditionIdx = state.fieldNames.indexOf('condition');
                    if (conditionIdx !== -1) {
                        if (state.fieldValues[conditionIdx] === 'good' ||
                            state.fieldValues[conditionIdx] === 'ok') {
                            condition = '#00ff00';
                            conditionSec = '#00cc00';
                        } else if (state.fieldValues[conditionIdx] === 'damaged') {
                            condition = '#ff8800';
                            conditionSec = '#cc5500';
                        } else if (state.fieldValues[conditionIdx] === 'broken') {
                            condition = '#ff0000';
                            conditionSec = '#cc0000';
                        } else if (state.fieldValues[conditionIdx] === 'deleted') {
                            condition = '#888888';
                            conditionSec = '#888888';
                        }
                    }
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
            });
        }
        this.dayModifier = (day: CalendarMonthViewDay) => {
            let dayDate = moment(day.date).startOf('day');
            if (this.range.disableOutside && this.range.start && dayDate.isBefore(this.range.start)) {
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

    dayModifier: (day: CalendarMonthViewDay) => void;

    close() {
        this.viewCtrl.dismiss();
    }
}
