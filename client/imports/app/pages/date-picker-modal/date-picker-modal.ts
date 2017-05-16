import {Component, OnDestroy} from "@angular/core";
import template from "./date-picker-modal.html";
import style from "./date-picker-modal.scss";
import * as _ from "lodash";
import {NavParams, ViewController} from "ionic-angular";
import * as moment from 'moment';
import {CalendarEvent, CalendarMonthViewDay } from "angular-calendar";
import {ReservationsDataService} from "../../services/reservations-data";
import {Reservation} from "../../../../../both/models/reservation.model";
import {Subject} from "rxjs/Subject";
import {Subscription} from "rxjs/Subscription";

@Component({
    selector: "date-picker-page",
    template,
    styles: [ style ]
})
export class DatePickerModal implements OnDestroy {
    itemId: string;

    viewDate: moment.Moment;

    range: {
        start: moment.Moment,
        end: moment.Moment,
        disableOutside: boolean,
    } = {
        start: null,
        end: null,
        disableOutside: true,
    };

    selectedDate: moment.Moment;

    events: CalendarEvent[] = [];

    selectedDay: CalendarMonthViewDay;

    refresh: Subject<any> = new Subject();

    days_label: Array<string> = [
        'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
    ];

    canSelect: boolean = true;

    private reservationsSubscription: Subscription;

    get _titleText(): string {
        return moment(this.viewDate).format("Y - MMM");
    }

    constructor(private viewCtrl: ViewController, private params: NavParams, private reservationDataService: ReservationsDataService) {
        if (this.params.get('rangeStart')) {
            this.range.start = moment(this.params.get('rangeStart')).startOf('day');
            if (!this.range.start.isValid()) {
                this.range.start = null;
            }
        }
        if (this.params.get('rangeEnd')) {
            this.range.end = moment(this.params.get('rangeEnd')).endOf('day');
            if (!this.range.end.isValid()) {
                this.range.end = null;
            }
        }
        if (!_.isUndefined(this.params.get('rangeDisableOutside'))) {
            this.range.disableOutside = this.params.get('rangeDisableOutside');
        }
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
        if (this.params.get('showReservations')) {
            let skipReservationId = this.params.get('skipReservationId');
            let reservations = this.reservationDataService.getReservations();
            this.reservationsSubscription = reservations.zone().subscribe((reservations) => {
                this.events = reservations
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
                        //actions? : EventAction[],
                        allDay: true,
                        //cssClass? : string,
                        //draggable? : boolean
                    };
                });
            });
        }
        console.log("initial:", this.viewDate);
        console.log("range:", this.range);
        this.dayModifier = (day: CalendarMonthViewDay) => {
            let dayDate = moment(day.date).startOf('day');
            day.cssClass = '';
            if (this.selectedDate.isValid() && dayDate.isSame(this.selectedDate)) {
                day.cssClass = 'cal-day-selected';
                this.selectedDay = day;
            } else if (this.range.disableOutside && this.range.start && dayDate.isBefore(this.range.start)) {
                day.cssClass = 'cal-day-disabled';
            } else if (this.range.disableOutside && this.range.end && dayDate.isAfter(this.range.end)) {
                day.cssClass = 'cal-day-disabled';
            } else if (this.range.start && this.range.end) {
                if (dayDate.isSameOrAfter(this.range.start) &&
                    dayDate.isSameOrBefore(this.range.end)) {
                    day.cssClass = 'cal-day-range';
                }
            } else if (this.range.start) {
                if (this.selectedDate.isValid() && dayDate.isBefore(this.selectedDate) && dayDate.isSameOrAfter(this.range.start)) {
                    day.cssClass = 'cal-day-range';
                }
            } else if (this.range.end) {
                if (this.selectedDate.isValid() && dayDate.isAfter(this.selectedDate) && dayDate.isSameOrBefore(this.range.end)) {
                    day.cssClass = 'cal-day-range';
                }
            }
        }
    }

    ngOnDestroy() {
        if (this.reservationsSubscription) {
            this.reservationsSubscription.unsubscribe();
            this.reservationsSubscription = null;
        }
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
