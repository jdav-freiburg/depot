import {Component, OnDestroy, OnInit} from "@angular/core";
import template from "./reservation.html";
import style from "./reservation.scss";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import * as _ from "lodash";
import {UserService} from "../../services/user";
import {Reservation} from "../../../../../both/models/reservation.model";
import {ReservationsDataService} from "../../services/reservations-data";
import {
    AlertController, Loading, LoadingController, ModalController, NavController, NavParams, Platform,
    ToastController
} from "ionic-angular";
import * as moment from 'moment';
import {Item} from "../../../../../both/models/item.model";
import {ItemsDataService} from "../../services/items-data";
import {ItemStateModal} from "../item-state-modal/item-state-modal";
import {Subscription} from "rxjs/Subscription";
import {TranslateService} from "@ngx-translate/core";
import {TranslateHelperService} from "../../services/translate-helper";


interface SelectableItem extends Item {
    selected: boolean;
    deselected: boolean;
    update(): void;
    readonly available: boolean;
}

@Component({
    selector: "reservation-page",
    template,
    styles: [ style ]
})
export class ReservationPage implements OnInit, OnDestroy {
    reservation: Reservation;

    private siblingReservationsHandle: Subscription;
    private selfSubscription: Subscription;
    private itemsSubscription: Subscription;

    unavailableItems: {[_id: string]: boolean} = {};

    reservationForm: FormGroup;
    startOutput: string;
    endOutput: string;
    isLoaded: boolean = false;

    editId: string;
    get readonly(): boolean {
        return this.editId && (!this.reservation || !this.users.user || (this.reservation.userId !== this.users.user._id && !this.users.isAdmin));
    }
    private loading: Loading;
    private loadingCount: number = 0;

    private isCreating: boolean = false;

    originalSelectedItemIds: string[] = [];
    selectedItemIds: string[] = [];
    items: SelectableItem[] = [];

    filter: string = "";

    forceClose: boolean = false;

    get translateTitleParams(): any {
        return {name: this.text};
    }

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

    get endDateEnd(): Date {
        let val = moment(this.reservationForm.controls['end'].value).endOf('day');
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
                private modalCtrl: ModalController, private toastCtrl: ToastController,
                private alertCtrl: AlertController, private platform: Platform,
                private translate: TranslateService, private translateHelper: TranslateHelperService) {
        this.reservationForm = fb.group({
            type: ["", Validators.required],
            name: ["", Validators.required],
            start: ["", Validators.required],
            end: ["", Validators.required],
            contact: [users.user?users.user.phone + ", " + users.user.emails[0].address:"", Validators.required],
        });
        this.reservationForm.controls['start'].valueChanges.subscribe(() => this.updateItemStates());
        this.reservationForm.controls['end'].valueChanges.subscribe(() => this.updateItemStates());
        this.editId = this.params.get('reservationId');
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

    updateUnavailableItems() {
        let removedItems = [];
        this.items.forEach((item) => {
            item.deselected = false;
            if (!item.available && item.selected) {
                item.selected = false;
                item.deselected = true;
                removedItems.push(item);
            }
        });
        if (removedItems.length > 0) {
            console.log("Found items to remove:", this.reservation, removedItems);
            let removedSubscription = this.translate.get("RESERVATION_PAGE.ITEMS_REMOVED", {'items': _.map(removedItems, item => item.name)})
                .subscribe(message => {
                    this.toastCtrl.create({
                        message: message,
                        duration: 2500
                    }).present();
                    removedSubscription.unsubscribe();
                });
        }
    }

    updateItemStates() {
        console.log("updateItemStates");
        if (this.siblingReservationsHandle) {
            this.siblingReservationsHandle.unsubscribe();
            this.siblingReservationsHandle = null;
        }
        let start = this.startDate;
        let end = this.endDateEnd;
        if (start && end) {
            console.log("Fetching items in:", start, end);
            this.unavailableItems = {};
            this.siblingReservationsHandle = this.reservationsDataService.getReservationsIn(start, end).zone().subscribe((reservations) => {
                if (this.isCreating) {
                    console.log("Is creating, not updating");
                    return;
                }
                this.unavailableItems = {};
                _.forEach(reservations, (reservation) => {
                    if (reservation._id !== this.editId) {
                        _.forEach(reservation.itemIds, (itemId) => this.unavailableItems[itemId] = true);
                    }
                });
                console.log("Unavailable items:", _.map(_.keys(this.unavailableItems), (_id) => _.find(this.items, (item) => item._id === _id) || _id));
                this.updateUnavailableItems();
            });
        }
    }

    load() {
        this.startLoading();
        let reservation = this.reservationsDataService.getReservation(this.editId).zone()
            .map(reservations => reservations[0]);
        this.selfSubscription = reservation.subscribe((reservation) => {
            if (!this.isLoaded) {
                console.log("Loaded:", reservation);
                this.reservationForm.controls['type'].setValue(reservation.type);
                this.reservationForm.controls['name'].setValue(reservation.name);
                this.reservationForm.controls['start'].setValue(reservation.start?moment(reservation.start).toDate():null);
                this.reservationForm.controls['end'].setValue(reservation.end?moment(reservation.end).toDate():null);
                this.reservationForm.controls['contact'].setValue(reservation.contact);
                this.reservationForm.markAsPristine();
                this.startOutput = moment(reservation.start).format('DD.MM.YYYY');
                this.endOutput = moment(reservation.end).format('DD.MM.YYYY');
                this.selectedItemIds = _.clone(reservation.itemIds);
                this.originalSelectedItemIds = _.clone(reservation.itemIds);
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
        let items = this.itemsDataService.getItems().zone();
        this.itemsSubscription = items.subscribe((items) => {
            let self = this;
            this.items = _.map(items, (item) => {
                let ext = {
                    _id: item._id,
                    _selected: this.selectedItemIds.indexOf(item._id) !== -1,
                    deselected: false,
                    update(): void {
                        this._selected = self.selectedItemIds.indexOf(item._id) !== -1;
                    },
                    get selected(): boolean {
                        return this._selected;
                    },
                    set selected(value: boolean) {
                        if (this._selected !== value) {
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
                        }
                        this.deselected = false;
                    },
                    get available(): boolean {
                        return !self.unavailableItems.hasOwnProperty(this._id);
                    }
                };
                return _.assignIn(ext, item);
            });
            console.log("Items:", this.items);
            this.updateUnavailableItems();
        });
        if (this.editId) {
            this.load();
        }
    }

    ngOnDestroy() {
        if (this.siblingReservationsHandle) {
            this.siblingReservationsHandle.unsubscribe();
            this.siblingReservationsHandle = null;
        }
        if (this.selfSubscription) {
            this.selfSubscription.unsubscribe();
            this.selfSubscription = null;
        }
        if (this.itemsSubscription != null) {
            this.itemsSubscription.unsubscribe();
            this.itemsSubscription = null;
        }
    }

    remove() {
        this.reservationsDataService.remove(this.params.get('id'));
    }

    save(callback?: Function) {
        if (!this.reservationForm.valid) {
            return;
        }
        if (this.readonly) {
            return callback();
        }
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
            this.isCreating = true;
            this.reservationsDataService.add(reservationData, (err) => {
                this.editId = reservationData._id;
                console.log("Added", reservationData, "reloading");
                this.isCreating = false;
                this.load();
                this.endLoading();
                if (callback) {
                    callback(err);
                }
            });
        } else {
            this.reservation.type = this.reservationForm.controls['type'].value;
            this.reservation.name = this.reservationForm.controls['name'].value;
            this.reservation.start = this.startDate;
            this.reservation.end = this.endDate;
            this.reservation.contact = this.reservationForm.controls['contact'].value;
            this.reservation.itemIds = this.selectedItemIds;
            console.log("Update: ", this.reservation);
            this.reservationsDataService.update(this.reservation, (err) => {
                console.log("Updated", this.reservation);
                this.endLoading();
                if (callback) {
                    callback(err);
                }
                if (!err) {
                    this.reservationForm.markAsPristine();
                }
            });
        }
    }

    ignoreReturn($event) {
        if($event.keyCode == 13) {
            $event.preventDefault();
            $event.stopPropagation();
        }
    }

    ionViewCanLeave() {
        if (!this.forceClose && !this.readonly &&
            (this.reservationForm.dirty || _.xor(this.selectedItemIds, this.originalSelectedItemIds).length !== 0)) {
            console.log("Dirty Form");
            let messageTextSubscription = this.translate.get(['RESERVATION_PAGE.LEAVE.TITLE', 'RESERVATION_PAGE.LEAVE.MESSAGE',
                'RESERVATION_PAGE.LEAVE.CANCEL', 'RESERVATION_PAGE.LEAVE.LEAVE', 'RESERVATION_PAGE.LEAVE.SAVE']).subscribe((messages) => {
                this.alertCtrl.create({
                    title: messages['RESERVATION_PAGE.LEAVE.TITLE'],
                    message: messages['RESERVATION_PAGE.LEAVE.MESSAGE'],
                    cssClass: 'three-button-alert',
                    buttons: [
                        {
                            text: messages['RESERVATION_PAGE.LEAVE.CANCEL'],
                            role: 'cancel',
                        },
                        {
                            text: messages['RESERVATION_PAGE.LEAVE.LEAVE'],
                            role: null,
                            handler: () => {
                                this.forceClose = true;
                                this.navCtrl.pop();
                            }
                        },
                        {
                            text: messages['RESERVATION_PAGE.LEAVE.SAVE'],
                            role: null,
                            handler: () => {
                                this.save(() => {
                                    this.forceClose = true;
                                    this.navCtrl.pop();
                                });
                            }
                        }
                    ]
                }).present();
                messageTextSubscription.unsubscribe();
            });
            return false;
        }
        return true;
    }

    openItem(item: Item) {
        this.forceClose = true;
        this.navCtrl.push(ItemStateModal, {
            showReservations: true,
            itemId: item._id,
            skipReservationId: this.editId,
            rangeStart: this.startDate,
            rangeEnd: this.endDate,
        }).then(() => {
            this.forceClose = false;
        });
    }
}
