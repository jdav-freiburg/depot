import { Component } from "@angular/core";
import template from "./date-picker-modal.html";
import style from "./date-picker-modal.scss";
import * as _ from "lodash";
import {NavParams, ViewController} from "ionic-angular";
import * as moment from 'moment';
import {CalendarEvent, CalendarMonthViewDay } from "angular-calendar";
import {ReservationsDataService} from "../../services/reservations-data";
import {Reservation} from "../../../../../both/models/reservation.model";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

@Component({
    selector: "date-picker-page",
    template,
    styles: [ style ]
})
export class DatePickerModal {
    itemId: string;

    get _titleText(): string {
        return moment(this.viewDate).format("Y - MMM");
    }

    viewDate: moment.Moment;
    
    rangeStartDate: moment.Moment;
    rangeEndDate: moment.Moment;

    selectedDate: moment.Moment;

    events: CalendarEvent[] = [];

    reservations: Observable<Reservation[]>;

    selectedDay: CalendarMonthViewDay;

    refresh: Subject<any> = new Subject();

    rangeDirection: string = "start";

    days_label: Array<string> = [
        'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat', 'Sun'
    ];

    constructor(private viewCtrl: ViewController, private params: NavParams, private reservationDataService: ReservationsDataService) {
        if (this.params.get('date')) {
            this.selectedDate = moment(this.params.get('date')).startOf('day');
        } else {
            this.selectedDate = moment().startOf('day');
        }
        if (this.params.get('rangeStart')) {
            this.rangeStartDate = moment(this.params.get('rangeStart')).startOf('day');
        }
        if (this.params.get('rangeEnd')) {
            this.rangeEndDate = moment(this.params.get('rangeEnd')).endOf('day');
        }
        this.viewDate = this.selectedDate;
        console.log("initial", this.viewDate);
        this.itemId = this.params.get('itemId');
        if (this.itemId) {
            //this.reservations = this.reservationDataService.getReservationsForItem(this.itemId);
        }
    }

    dayModifier(day: CalendarMonthViewDay) {
        let dayDate = moment(day.date).startOf('day');
        console.log("day:", day);
        if (this.rangeStartDate && dayDate.isBefore(this.rangeStartDate)) {
            day.cssClass = 'cal-day-disabled';
        } else if (this.rangeEndDate && dayDate.isAfter(this.rangeEndDate)) {
            day.cssClass = 'cal-day-disabled';
        } else if (this.selectedDate && dayDate.isSame(this.selectedDate)) {
            day.cssClass = 'cal-day-selected';
            this.selectedDay = day;
        } else if (this.rangeStartDate && this.rangeDirection === 'start' && dayDate.isSameOrAfter(this.rangeStartDate) && dayDate.isBefore(this.selectedDate)) {
            day.cssClass = 'cal-day-range';
        } else if (this.rangeEndDate && this.rangeDirection === 'end' && dayDate.isAfter(this.selectedDate) && dayDate.isSameOrBefore(this.rangeEndDate)) {
            day.cssClass = 'cal-day-range';
        }
    }

    select(day: CalendarMonthViewDay) {
        if (day.cssClass !== 'cal-day-disabled') {
            this.selectedDate = moment(day.date).startOf('day');
            console.log("selected", day);
            if (this.selectedDay) {
                delete this.selectedDay.cssClass;
            }
            this.selectedDay = day;
            this.selectedDay.cssClass = 'cal-day-selected';
            //this.viewCtrl.dismiss({date: this.selectedDate});
            this.refresh.next();
        }
    }

    save() {
        this.viewCtrl.dismiss({date: this.selectedDate});
    }
}
