import {Component, NgZone, OnDestroy, OnInit} from "@angular/core";
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
import {Item} from "../../../../../both/models/item.model";
import {ItemStateCollection} from "../../../../../both/collections/item-state.collection";
import {Subscription} from "rxjs/Subscription";
import {colors} from "../../colors";
import {TranslateService} from "../../services/translate";
import {QueryObserverTransform} from "../../util/query-observer";
import {UserService} from "../../services/user";


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

    refresh: Subject<any> = new Subject();

    get days_label(): string[] {
        return moment.weekdaysShort();
    }

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
    private itemStateSubscription: QueryObserverTransform<ItemState, CalendarEvent>;
    private reservationsSubscription: QueryObserverTransform<Reservation, CalendarEvent>;
    private itemSubscription: Subscription;

    get _titleText(): string {
        return (this.itemId?(this.item?this.item.name:this.itemId) + " - ":"") + moment(this.viewDate).format("Y - MMM");
    }

    constructor(private viewCtrl: ViewController, private params: NavParams, private itemDataService: ItemsDataService,
                private reservationsDataService: ReservationsDataService, private translate: TranslateService,
                private ngZone: NgZone, private users: UserService) {
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
                this.reservationsSubscription = new QueryObserverTransform<Reservation, CalendarEvent>({
                    query: this.reservationsDataService.getReservationsForItem(this.itemId),
                    zone: this.ngZone,
                    transformer: (reservation) => {
                        if (reservation._id === skipReservationId) {
                            return null;
                        }
                        return {
                            start: reservation.start,
                            end: reservation.end,
                            title: this.translate.get('ITEM_STATE.RESERVATION_NAME', {
                                user: this.users.tryGetUser(reservation.userId),
                                type: _.find(this.reservationsDataService.reservationTypeOptions, option => option.value === reservation.type),
                                reservation: reservation
                            }),
                            color: {
                                primary: '#ff3333',
                                secondary: '#cc6666'
                            },
                            allDay: true,
                        };
                    },
                    suppressNull: true
                });
                this.reservationsSubscription.dataChanged.subscribe((data) => {
                    this.events = _.concat((this.itemStateSubscription?this.itemStateSubscription.data:[]), data);
                });
            }
        }
        this.beforeViewRender = (days: CalendarMonthViewDay[]) => {
            days.forEach(day => {
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
            });
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
        this.itemStateSubscription = new QueryObserverTransform<ItemState, CalendarEvent>({
            query: ItemStateCollection.find({itemId: this.itemId}, {sort: {timestamp: -1}}),
            zone: this.ngZone,
            transformer: (state) => {
                let primaryColor = '#000000';

                let textParts = [];

                if (_.has(state.fields, 'lastService')) {
                    primaryColor = colors.good;
                    textParts.push(this.translate.get('ITEM_STATE.LAST_SERVICE', {lastService: state.fields.lastService}));
                }

                if (_.has(state.fields, 'condition')) {
                    let option = _.find(this.itemDataService.itemConditionOptions, option => option.value == state.fields.condition)
                      || this.itemDataService.itemConditionOptions[0];
                    primaryColor = option.colorCss;
                    if (_.has(state.fields, 'conditionComment')) {
                        textParts.push(this.translate.get('ITEM_STATE.CONDITION_CONDITION_COMMENT', {conditionOption: option, conditionComment: state.fields.conditionComment}));
                    } else {
                        textParts.push(this.translate.get('ITEM_STATE.CONDITION', {conditionOption: option}));
                    }
                } else {
                    textParts.push(this.translate.get('ITEM_STATE.CONDITION_COMMENT', {conditionComment: state.fields.conditionComment}));
                }

                if (_.has(state.fields, 'name')) {
                    textParts.push(this.translate.get('ITEM_STATE.NAME', {name: state.fields.name}));
                }

                if (_.has(state.fields, 'description')) {
                    textParts.push(this.translate.get('ITEM_STATE.DESCRIPTION', {description: state.fields.description}));
                }

                if (_.has(state.fields, 'externalId')) {
                    textParts.push(this.translate.get('ITEM_STATE.EXTERNAL_ID', {externalId: state.fields.externalId}));
                }

                if (_.has(state.fields, 'tags')) {
                    textParts.push(this.translate.get('ITEM_STATE.TAGS', {tags: state.fields.tags}));
                }

                if (_.has(state.fields, 'picture')) {
                    textParts.push(this.translate.get('ITEM_STATE.PICTURE', {tags: state.fields.picture}));
                }

                if (_.has(state.fields, 'status')) {
                    let option = _.find(this.itemDataService.itemStatusOptions, option => option.value == state.fields.status)
                      || this.itemDataService.itemStatusOptions[0];
                    textParts.push(this.translate.get('ITEM_STATE.STATUS', {statusOption: option}));
                }

                let secondaryColor = Color(primaryColor).lighten(0.15).hex();
                console.log(state);
                return {
                    start: state.timestamp,
                    title: this.translate.get('ITEM_STATE.TEXT', {texts: textParts, comment: state.comment, timestamp: state.timestamp}),
                    color: {
                        primary: primaryColor,
                        secondary: secondaryColor
                    },
                    allDay: false,
                };
            }
        });
        this.itemStateSubscription.dataChanged.subscribe((newData: CalendarEvent[]) => {
            this.events = _.concat(newData, (this.reservationsSubscription?this.reservationsSubscription.data:[]));
        });
    }

    beforeViewRender: (day: CalendarMonthViewDay[]) => void;

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
