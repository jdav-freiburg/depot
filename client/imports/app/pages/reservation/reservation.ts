import {Component, NgZone, OnDestroy, OnInit} from "@angular/core";
import template from "./reservation.html";
import style from "./reservation.scss";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import * as _ from "lodash";
import {UserService} from "../../services/user";
import {Reservation} from "../../../../../both/models/reservation.model";
import {ReservationsDataService} from "../../services/reservations-data";
import {
    AlertController, Checkbox, ItemGroup, Loading, LoadingController, ModalController, NavController, NavParams,
    Platform,
    ToastController, VirtualScroll
} from "ionic-angular";
import * as moment from 'moment';
import {Item} from "../../../../../both/models/item.model";
import {ItemsDataService} from "../../services/items-data";
import {ItemStateModal} from "../item-state-modal/item-state-modal";
import {Subscription} from "rxjs/Subscription";
import {TranslateService} from "../../services/translate";
import {TranslateHelperService} from "../../services/translate-helper";
import {ChangeableDataTransform, QueryObserverTransform} from "../../util/query-observer";
import {SelectableItemSingle, SelectableItemGroup, SelectedProvider, SelectableItem} from "../../util/item";
import {PictureService} from "../../services/picture";
import {ImagePreviewModal} from "../image-preview-modal/image-preview-modal";

class SelectableItemSingleImage extends SelectableItemSingle {
    public pictureUrl: string;

    public constructor(item: Item, translate: TranslateService, selectedProvider: SelectedProvider) {
        super(item, translate, selectedProvider);
    }
}


class SelectableItemGroupImage extends SelectableItemGroup {
    public get pictureUrl(): string {
        return (<SelectableItemSingleImage>this.subItems[Math.max(this._selected - 1, 0)]).pictureUrl;
    }
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
    private dataChangeSubscription: Subscription;

    unavailableItems: {[_id: string]: boolean} = {};

    reservationForm: FormGroup;
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

    filter: string = "";
    filterQuery: string[] = [];

    forceClose: boolean = false;

    private _selectedProvider: SelectedProvider;

    private items: QueryObserverTransform<Item, SelectableItemSingle>;
    private itemGroups: SelectableItem[] = [];
    private itemGroupsIndex: {[id:string]: SelectableItemGroupImage} = {};

    private displayItems: SelectableItem[] = [];

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

    get reservationTypeOptions(): any[] {
        return this.translate.getAll([
            {
                translate: 'RESERVATION.TYPE.GROUP',
                value: "group",
                color: 'good',
                text: ""
            },
            {
                translate: 'RESERVATION.TYPE.PRIVATE',
                value: "private",
                color: 'warning',
                text: ""
            }
        ]);
    }

    constructor(private reservationsDataService: ReservationsDataService, private itemsDataService: ItemsDataService,
                private fb: FormBuilder, private users: UserService, private navCtrl: NavController,
                private params: NavParams, private loadingCtrl: LoadingController,
                private modalCtrl: ModalController, private toast: ToastController,
                private alertCtrl: AlertController, private platform: Platform,
                private translate: TranslateService, private translateHelper: TranslateHelperService,
                private ngZone: NgZone, private pictureService: PictureService) {
        this.reservationForm = fb.group({
            type: ["", Validators.required],
            name: ["", Validators.required],
            start: ["", Validators.required],
            end: ["", Validators.required],
            contact: [users.user?users.user.phone + ", " + users.user.emails[0].address:"", Validators.required],
        });
        this.reservationForm.controls['start'].valueChanges.subscribe(() => {
            if (moment(this.reservationForm.controls['start'].value).isAfter(this.reservationForm.controls['end'].value)) {
                this.reservationForm.controls['end'].setValue(null);
            }
            this.updateItemStates();
        });
        this.reservationForm.controls['end'].valueChanges.subscribe(() => {
            if (moment(this.reservationForm.controls['end'].value).isBefore(this.reservationForm.controls['start'].value)) {
                this.reservationForm.controls['start'].setValue(null);
            }
            this.updateItemStates();
        });
        this.editId = this.params.get('reservationId');
        this._selectedProvider = {
            isAvailable: (itemId: string): boolean => {
                return !this.unavailableItems.hasOwnProperty(itemId);
            },

            isSelected: (itemId: string): boolean => {
                return this.selectedItemIds.indexOf(itemId) !== -1;
            },

            select: (itemId: string): void => {
                if (this.unavailableItems.hasOwnProperty(itemId)) {
                    console.log("Selecting unavailable item!");
                }
                if (!_.includes(this.selectedItemIds, itemId)) {
                    this.selectedItemIds.push(itemId);
                }
            },

            deselect: (itemId: string): void => {
                _.pull(this.selectedItemIds, itemId);
            }
        };

        translate.languageKeyChange.subscribe(() => {
            if (this.items && this.items.data) {
                _.forEach(this.items.data, (item) => item.updateText(translate));
            }
        });
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
        this.items.data.forEach((item) => {
            if (!item.update()) {
                removedItems.push(item);
            }
        });
        this.itemGroups.forEach((itemGroup) => {
            if (!itemGroup.update()) {
                console.log("ERROR: Item group contains non-updated item");
            }
        });
        this.filterChange();
        if (removedItems.length > 0) {
            console.log("Found items to remove:", this.reservation, removedItems);
            this.toast.create({
                message: this.translate.get("RESERVATION_PAGE.ITEMS_REMOVED", {'items': _.map(removedItems, item => item.name)}),
                duration: 2500
            }).present();
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
                console.log("Unavailable items:", this.unavailableItems);
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
                this.reservationForm.markAsUntouched();
                this.reservationForm.updateValueAndValidity();
                this.selectedItemIds = _.clone(reservation.itemIds);
                this.originalSelectedItemIds = _.clone(reservation.itemIds);
                console.log("Set selectedItemIds:", this.selectedItemIds);
                this.itemGroups.forEach((item) => {
                    item.update();
                });
                this.filterChange();
                this.reservation = reservation;
                this.updateItemStates();
                this.isLoaded = true;
                this.endLoading();
            }
        });
    }

    ngOnInit() {
        let self = this;
        this.items = new QueryObserverTransform<Item, SelectableItemSingleImage>({
            query: this.itemsDataService.getPublicItems(),
            zone: this.ngZone,
            transformer: (item) => {
                let transformed: SelectableItemSingleImage = (<ChangeableDataTransform<Item, SelectableItemSingleImage>>item)._transformed;
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
                        } else {
                            let removed = _.remove(this.itemGroups, (itemGroupRef) => itemGroupRef === transformed);
                            if (removed.length !== 1) {
                                console.log("ERROR: Data inconsistent");
                            }
                        }
                        transformed.itemGroupRef = null;
                    }
                    transformed.updateFrom(item, this.translate);
                } else {
                    transformed = new SelectableItemSingleImage(item, this.translate, this._selectedProvider);
                }
                if (transformed.picture) {
                    transformed.pictureUrl = this.pictureService.getPictureThumbnailUrl(transformed.picture);
                }
                if (!transformed.itemGroupRef) {
                    if (transformed.itemGroup) {
                        let itemGroup: SelectableItemGroupImage;
                        if (this.itemGroupsIndex.hasOwnProperty(transformed.itemGroup)) {
                            itemGroup = this.itemGroupsIndex[transformed.itemGroup];
                        } else {
                            itemGroup = new SelectableItemGroupImage();
                            this.itemGroupsIndex[transformed.itemGroup] = itemGroup;
                            this.itemGroups.push(itemGroup);
                        }
                        transformed.itemGroupRef = itemGroup;
                        itemGroup.subItems.push(transformed);
                        if (!itemGroup.update()) {
                            console.log("Removed item:", this.reservation, transformed);
                            this.toast.create({
                                message: this.translate.get("RESERVATION_PAGE.ITEMS_REMOVED", {'items': [transformed.name]}),
                                duration: 2500
                            }).present();
                        }
                    } else {
                        transformed.itemGroupRef = transformed;
                        this.itemGroups.push(transformed);
                        if (!transformed.update()) {
                            console.log("Removed item:", this.reservation, transformed);
                            this.toast.create({
                                message: this.translate.get("RESERVATION_PAGE.ITEMS_REMOVED", {'items': [transformed.name]}),
                                duration: 2500
                            }).present();
                        }
                    }
                }
                return transformed;
            },
            removed: (item, index) => {
                let transformed: SelectableItem = (<any>item)._transformed;
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
                    } else {
                        console.log("ERROR: Data inconsistent");
                    }
                    if (transformed.selected) {
                        console.log("Removed item:", this.reservation, transformed);
                        this.toast.create({
                            message: this.translate.get("RESERVATION_PAGE.ITEMS_REMOVED", {'items': [transformed.name]}),
                            duration: 2500
                        }).present();
                    }
                }
            }
        });
        this.dataChangeSubscription = this.items.dataChanged.subscribe(() => {
            this.filterChange();
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
        if (this.dataChangeSubscription) {
            this.dataChangeSubscription.unsubscribe();
            this.dataChangeSubscription = null;
        }
        if (this.items != null) {
            this.items.unsubscribe();
            this.items = null;
        }
    }

    remove() {
        this.reservationsDataService.remove(this.params.get('id'));
    }

    onSaved(err: any, callback?: Function) {
        this.endLoading();
        this.reservationForm.enable();
        if (err) {
            this.toast.create({
                message: this.translateHelper.getError(err),
                duration: 2500
            }).present();
        } else {
            this.originalSelectedItemIds = _.clone(this.reservation.itemIds);
            this.reservationForm.markAsPristine();
            this.reservationForm.markAsUntouched();
            this.reservationForm.updateValueAndValidity();
            this.toast.create({
                message: this.translate.get('RESERVATION_PAGE.SAVED', this.reservation),
                duration: 2500
            }).present();
        }
        if (callback) {
            callback(err);
        }
    }

    save(callback?: Function) {
        if (!this.reservationForm.valid) {
            return;
        }
        if (this.readonly) {
            return callback();
        }
        this.reservationForm.disable();
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
                if (!err && this.editId) {
                    this.load();
                }
                this.onSaved(err, callback);
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
                this.onSaved(err, callback);
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
            this.alertCtrl.create({
                title: this.translate.get('RESERVATION_PAGE.LEAVE.TITLE'),
                subTitle: this.translate.get('RESERVATION_PAGE.LEAVE.SUB_TITLE'),
                cssClass: 'three-button-alert',
                buttons: [
                    {
                        text: this.translate.get('RESERVATION_PAGE.LEAVE.CANCEL'),
                        role: 'cancel',
                    },
                    {
                        text: this.translate.get('RESERVATION_PAGE.LEAVE.LEAVE'),
                        role: null,
                        handler: () => {
                            this.forceClose = true;
                            this.navCtrl.pop();
                        }
                    },
                    {
                        text: this.translate.get('RESERVATION_PAGE.LEAVE.SAVE'),
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
            return false;
        }
        return true;
    }

    openItem(item: SelectableItem) {
        this.forceClose = true;
        this.navCtrl.push(ItemStateModal, {
            showReservations: true,
            itemId: item._id,
            reservationsItemIds: (item.isSingle?null:_.map(item.subItems, subItem => subItem._id)),
            skipReservationId: this.editId,
            rangeStart: this.startDate,
            rangeEnd: this.endDate,
        }).then(() => {
            this.forceClose = false;
        });
    }

    openItemPicture(item: Item) {
        this.forceClose = true;
        this.navCtrl.push(ImagePreviewModal, {
            picture: item.picture,
            title: item.name
        }).then(() => {
            this.forceClose = false;
        });
    }

    filterChange() {
        // some easter egg :)
        if (this.filter === "gimmeall") {
            _.forEach(this.itemGroups, (itemGroup) => itemGroup.selectedCount = itemGroup.availableCount);
            this.filter = "";
        }
        this.filterQuery = this.filter.toLowerCase().split(/\s+/);
        if (this.filter.length < 3) {
            this.displayItems = this.itemGroups;
        } else {
            this.displayItems = _.filter(this.itemGroups, itemGroup => itemGroup.checkFilters(this.filterQuery))
        }
    }

    toggleAddItem(evt: Event, item: SelectableItem) {
        if (item.selectedCount < item.availableCount) {
            item.selectedCount++;
        } else {
            item.selectedCount = 0;
        }
    }
}
