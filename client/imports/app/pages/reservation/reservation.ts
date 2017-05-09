import { Component, OnInit } from "@angular/core";
import { Observable } from "rxjs";
import template from "./reservation.html";
import style from "./reservation.scss";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import * as _ from "lodash";
import {UserService} from "../../user.service";
import {Reservation} from "../../../../../both/models/reservation.model";
import {ReservationsDataService} from "../../services/reservations-data";
import {Loading, LoadingController, NavController, NavParams} from "ionic-angular";
import * as moment from 'moment';
import {Item} from "../../../../../both/models/item.model";
import {ItemsDataService} from "../../services/items-data";

@Component({
    selector: "reservation-page",
    template,
    styles: [ style ]
})
export class ReservationPage implements OnInit {
    reservation: Observable<Reservation>;

    reservationData: Reservation;

    reservationForm: FormGroup;
    startOutput: string;
    endOutput: string;
    isLoaded: boolean = false;

    editId: string;
    readonly: boolean = false;
    private loading: Loading;

    selectedItemIds: string[] = [];
    items: Observable<Item[]>;
    itemsData: Item[] = [];
    selectedItems: boolean[] = [];
    filter: string = "";

    constructor(private reservationsDataService: ReservationsDataService, private itemsDataService: ItemsDataService,
                private fb: FormBuilder, private users: UserService, private navCtrl: NavController,
                private params: NavParams, private loadingCtrl: LoadingController) {
        this.reservationForm = fb.group({
            type: ["", Validators.required],
            name: ["", Validators.required],
            start: ["", Validators.required],
            end: ["", Validators.required],
            contact: ["", Validators.required],
        });
        this.editId = this.params.get('id');

        this.loading = this.loadingCtrl.create();
    }

    updateSelectedItems() {
        this.selectedItems = _.map(this.itemsData, (item) => this.selectedItemIds.indexOf(item._id) !== -1);
    }

    load() {
        this.loading.present();
        this.items = this.itemsDataService.getItems().zone();
        this.items.subscribe((items) => {
            this.itemsData = items;
            this.updateSelectedItems();
        });
        this.reservation = this.reservationsDataService.getReservation(this.editId).zone()
            .map(reservations => reservations[0]);
        this.reservation.subscribe((reservation) => {
            if (!this.isLoaded) {
                this.loading.dismiss();
                this.reservationForm.controls.type.setValue(reservation.type);
                this.reservationForm.controls.name.setValue(reservation.name);
                this.reservationForm.controls.start.setValue(reservation.start.toISOString());
                this.reservationForm.controls.end.setValue(reservation.end.toISOString());
                this.reservationForm.controls.contact.setValue(reservation.contact);
                this.startOutput = moment(reservation.start).format('DD.MM.YYYY');
                this.endOutput = moment(reservation.end).format('DD.MM.YYYY');
                this.reservationData = reservation;
                this.selectedItemIds = reservation.itemIds;
                this.updateSelectedItems();
            }
        });
    }

    ngOnInit() {
        if (this.editId) {
            this.load();
        } else {
            this.isLoaded = true;
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
        this.loading.present();
        if (!this.reservationData) {
            let reservationData: Reservation = {
                type: this.reservationForm.controls.type.value,
                name: this.reservationForm.controls.name.value,
                start: new Date(this.reservationForm.controls.start.value),
                end: new Date(this.reservationForm.controls.end.value),
                contact: this.reservationForm.controls.contact.value,
                userId: Meteor.userId(),
                groupId: "",
                itemIds: []
            };
            console.log("Add: ", reservationData);
            this.reservationsDataService.add(reservationData, () => {
                this.loading.dismiss();
                this.editId = reservationData._id;
                this.load();
            });
        } else {
            this.reservationData.type = this.reservationForm.controls.type.value;
            this.reservationData.name = this.reservationForm.controls.name.value;
            this.reservationData.start = new Date(this.reservationForm.controls.start.value);
            this.reservationData.end = new Date(this.reservationForm.controls.end.value);
            this.reservationData.contact = this.reservationForm.controls.contact.value;
            console.log("Update: ", this.reservationData);
            this.reservationsDataService.update(this.reservationData, () => {
                this.loading.dismiss();
            });
        }
    }

    ignoreReturn($event) {
        if($event.keyCode == 13) {
            $event.preventDefault();
            $event.stopPropagation();
        }
    }
}
