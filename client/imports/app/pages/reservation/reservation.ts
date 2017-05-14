import { Component, OnInit } from "@angular/core";
import { Observable } from "rxjs";
import template from "./reservation.html";
import style from "./reservation.scss";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import * as _ from "lodash";
import {UserService} from "../../services/user";
import {Reservation} from "../../../../../both/models/reservation.model";
import {ReservationsDataService} from "../../services/reservations-data";
import {Loading, LoadingController, ModalController, NavController, NavParams} from "ionic-angular";
import * as moment from 'moment';
import {Item} from "../../../../../both/models/item.model";
import {ItemsDataService} from "../../services/items-data";
import {ItemStateModal} from "../item-state-modal/item-state-modal";
import {ReservationCollection} from "../../../../../both/collections/reservation.collection";
import {Subscription} from "rxjs/Subscription";

interface SelectableItem extends Item {
    selected?: boolean;
    update(): void;
    readonly available: boolean;
}

@Component({
    selector: "reservation-page",
    template,
    styles: [ style ]
})
export class ReservationPage implements OnInit {
    reservation: Reservation;

    siblingReservationsHandle: Subscription;
    unavailableItems: {[_id: string]: boolean} = {};

    reservationForm: FormGroup;
    startOutput: string;
    endOutput: string;
    isLoaded: boolean = false;

    editId: string;
    readonly: boolean = false;
    private loading: Loading;
    private loadingCount: number = 0;

    selectedItemIds: string[] = [];
    items: SelectableItem[] = [];

    filter: string = "";

    get startDate(): Date {
        let val = moment(this.reservationForm.controls['start'].value);
        if (val.isValid()) {
            return val.toDate();
        }
        return null;
    }

    get endDate(): Date {
        let val = moment(this.reservationForm.controls['end'].value);
        if (val.isValid()) {
            return val.toDate();
        }
        return null;
    }

    get text(): string {
        return this.reservationForm.controls['name'].value;
    }

    constructor(private reservationsDataService: ReservationsDataService, private itemsDataService: ItemsDataService,
                private fb: FormBuilder, private users: UserService, private navCtrl: NavController,
                private params: NavParams, private loadingCtrl: LoadingController,
                private modalCtrl: ModalController) {
        this.reservationForm = fb.group({
            type: ["", Validators.required],
            name: ["", Validators.required],
            start: ["", Validators.required],
            end: ["", Validators.required],
            contact: ["", Validators.required],
        });
        this.reservationForm.controls['start'].valueChanges.subscribe(() => this.updateItemStates());
        this.reservationForm.controls['end'].valueChanges.subscribe(() => this.updateItemStates());
        this.editId = this.params.get('id');
    }

    startLoading() {
        if (this.loadingCount > 0) {
            this.loadingCount++;
        } else {
            this.loading = this.loadingCtrl.create();
            this.loading.present();
            this.loadingCount = 1;
        }
    }

    endLoading() {
        this.loadingCount--;
        if (this.loadingCount == 0) {
            this.loading.dismiss();
            this.loading = null;
        }
    }

    updateItemStates() {
        console.log("updateItemStates");
        if (this.siblingReservationsHandle) {
            this.siblingReservationsHandle.unsubscribe();
            this.siblingReservationsHandle = null;
        }
        let start = this.startDate;
        let end = this.endDate;
        if (start && end) {
            console.log("Fetching items in:", start, end);
            let siblingReservations = this.reservationsDataService.getReservationsIn(start, end).zone();
            this.siblingReservationsHandle = siblingReservations.subscribe((reservations) => {
                this.unavailableItems = {};
                _.forEach(reservations, (reservation) => {
                    if (reservation._id !== this.editId) {
                        _.forEach(reservation.itemIds, (itemId) => this.unavailableItems[itemId] = true);
                    }
                });
                console.log("Unavailable items:", _.map(_.keys(this.unavailableItems), (_id) => _.find(this.items, (item) => item._id === _id) || _id));
                // TODO: Remove unreservable items?
            });
        }
    }

    load() {
        this.startLoading();
        let reservation = this.reservationsDataService.getReservation(this.editId).zone()
            .map(reservations => reservations[0]);
        reservation.subscribe((reservation) => {
            if (!this.isLoaded) {
                console.log("Loaded:", reservation);
                this.reservationForm.controls['type'].setValue(reservation.type);
                this.reservationForm.controls['name'].setValue(reservation.name);
                this.reservationForm.controls['start'].setValue(reservation.start?moment(reservation.start).toDate():null);
                this.reservationForm.controls['end'].setValue(reservation.end?moment(reservation.end).toDate():null);
                this.reservationForm.controls['contact'].setValue(reservation.contact);
                this.startOutput = moment(reservation.start).format('DD.MM.YYYY');
                this.endOutput = moment(reservation.end).format('DD.MM.YYYY');
                this.selectedItemIds = reservation.itemIds;
                console.log("Set selectedItemIds:", this.selectedItemIds);
                this.items.forEach((item) => {
                    item.update();
                });
                this.reservation = reservation;
                this.updateItemStates();
                this.isLoaded = true;
                this.endLoading();
            }
        });
    }

    ngOnInit() {
        this.startLoading();
        let initialLoaded = false;
        let items = this.itemsDataService.getItems().zone();
        items.subscribe((items) => {
            if (!initialLoaded) {
                this.endLoading();
                initialLoaded = true;
            }
            let self = this;
            this.items = _.map(items, (item) => {
                let ext = {
                    _id: item._id,
                    _selected: this.selectedItemIds.indexOf(item._id) !== -1,
                    update(): void {
                        this._selected = self.selectedItemIds.indexOf(item._id) !== -1;
                    },
                    get selected(): boolean {
                        return this._selected;
                    },
                    set selected(value: boolean) {
                        this._selected = value;
                        console.log(this._id, "->", value);
                        if (value) {
                            if (!_.includes(self.selectedItemIds, this._id)) {
                                self.selectedItemIds.push(this._id);
                            }
                        } else {
                            _.pull(self.selectedItemIds, this._id);
                        }
                        console.log("result selectedItemIds:", self.selectedItemIds);
                    },
                    get available(): boolean {
                        return !self.unavailableItems.hasOwnProperty(this._id);
                    }
                };
                return _.assignIn(ext, item);
            });
            console.log("Items:", this.items);
        });
        if (this.editId) {
            this.load();
        }
    }

    cancelEdit() {
        this.navCtrl.pop();
    }

    remove() {
        this.reservationsDataService.remove(this.params.get('id'));
    }

    save() {
        console.log("Save");
        this.startLoading();
        if (!this.reservation) {
            let reservationData: Reservation = {
                type: this.reservationForm.controls['type'].value,
                name: this.reservationForm.controls['name'].value,
                start: this.startDate,
                end: this.endDate,
                contact: this.reservationForm.controls['contact'].value,
                userId: Meteor.userId(),
                groupId: "",
                itemIds: this.selectedItemIds
            };
            console.log("Add: ", reservationData);
            this.reservationsDataService.add(reservationData, () => {
                this.editId = reservationData._id;
                console.log("Added", reservationData, "reloading");
                this.load();
                this.endLoading();
            });
        } else {
            this.reservation.type = this.reservationForm.controls['type'].value;
            this.reservation.name = this.reservationForm.controls['name'].value;
            this.reservation.start = this.startDate;
            this.reservation.end = this.endDate;
            this.reservation.contact = this.reservationForm.controls['contact'].value;
            this.reservation.itemIds = this.selectedItemIds;
            console.log("Update: ", this.reservation);
            this.reservationsDataService.update(this.reservation, () => {
                console.log("Updated", this.reservation);
                this.endLoading();
            });
        }
    }

    ignoreReturn($event) {
        if($event.keyCode == 13) {
            $event.preventDefault();
            $event.stopPropagation();
        }
    }

    openItem(item: Item) {
        this.navCtrl.push(ItemStateModal, {
            showReservations: true,
            itemId: item._id,
            skipReservationId: this.editId,
            rangeStart: this.startDate,
            rangeEnd: this.endDate,
        });
    }
}
