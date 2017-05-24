import {AfterViewInit, Component, NgZone, OnDestroy, OnInit, ViewChild} from "@angular/core";
import template from "./reservation.html";
import style from "./reservation.scss";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import * as _ from "lodash";
import {UserService} from "../../services/user";
import {Reservation} from "../../../../../both/models/reservation.model";
import {ReservationsDataService} from "../../services/reservations-data";
import {
    AlertController, Loading, LoadingController, ModalController, NavController, NavParams, Platform,
    ToastController, VirtualScroll
} from "ionic-angular";
import * as moment from 'moment';
import {Item} from "../../../../../both/models/item.model";
import {ItemsDataService} from "../../services/items-data";
import {ItemStateModal} from "../item-state-modal/item-state-modal";
import {Subscription} from "rxjs/Subscription";
import {TranslateService} from "../../services/translate";
import {TranslateHelperService} from "../../services/translate-helper";
import {QueryObserverTransform} from "../../util/query-observer";

interface SelectedProvider {
    isAvailable(itemId: string): boolean;
    isSelected(itemId: string): boolean;
    select(itemId: string): void;
    deselect(itemId: string): void;
}

interface SelectableItem extends Item {
    selected: boolean;
    deselected: boolean;
    update(): boolean;
    readonly available: boolean;
    itemGroupRef: SelectableItem;
    readonly filter: string;

    readonly isSingle: boolean;
    readonly count: number;
    selectedCount: number;
    readonly subItems: SelectableItem[];
    readonly deselectedCount: number;
    readonly availableCount: number;
}

class SelectableItemSingle implements SelectableItem {
    _id: string;
    externalId: string;
    name: string;
    description: string;
    condition: string;
    conditionComment: string;
    purchaseDate: Date;
    lastService: Date;
    picture: string;
    tags: string[];
    itemGroup: string;
    status: string;

    itemGroupRef: SelectableItem = null;

    private _selectedProvider: SelectedProvider;

    private _selected: boolean;
    private _available: boolean;
    private _deselected: boolean;

    private _filter: string;
    private _filterSelected: string;

    get filter(): string {
        if (this.selected) {
            return this._filter + "\0" + this._filterSelected;
        }
        return this._filter;
    }

    public update(): boolean {
        let newAvailable = this._selectedProvider.isAvailable(this._id);
        let newSelected = this._selectedProvider.isSelected(this._id);
        this._selected = this._selectedProvider.isSelected(this._id);
        this._available = this._selectedProvider.isAvailable(this._id);
        if (!newAvailable && this._selected) {
            this.selected = false;
            this._deselected = true;
            return false;
        }
        return true;
    }

    get deselected(): boolean {
        return this._deselected;
    }

    get selected(): boolean {
        return this._selected;
    }

    set selected(value: boolean) {
        if (this._selected !== value) {
            this._selected = value;
            console.log(this._id, "->", value);
            if (value) {
                this._selectedProvider.select(this._id);
            } else {
                this._selectedProvider.deselect(this._id);
            }
        }
        this._deselected = false;
    }

    get available(): boolean {
        return this._available;
    }
    get isSingle(): boolean {
        return this.count === 1;
    }
    get count(): number {
        return 1;
    }
    get subItems(): SelectableItem[] {
        return [this];
    }
    get selectedCount(): number {
        return this.selected?1:0;
    }
    set selectedCount(value: number) {
        this.selected = value > 0;
    }
    get deselectedCount(): number {
        return this.deselected?1:0;
    }
    get availableCount(): number {
        return this.available?1:0;
    }

    public updateText(translate: TranslateService) {
        this._filter = (translate.get('RESERVATION_PAGE.FILTER_TAG.NAME') + ":" + this.name + "\0" +
        translate.get('RESERVATION_PAGE.FILTER_TAG.DESCRIPTION') + ":" + this.description + "\0" +
        translate.get('RESERVATION_PAGE.FILTER_TAG.TAG') + ":" + _.join(this.tags, "\0" + translate.get('RESERVATION_PAGE.FILTER_TAG.TAG') + ":") + "\0" +
        translate.get('RESERVATION_PAGE.FILTER_TAG.EXTERNAL_ID') + ":" + this.externalId).toLowerCase();
        this._filterSelected = translate.get('RESERVATION_PAGE.FILTER_TAG.SELECTED');
    }

    public updateFrom(item: Item, translate: TranslateService) {
        this._id = item._id;
        this.externalId = item.externalId;
        this.name = item.name;
        this.description = item.description;
        this.condition = item.condition;
        this.conditionComment = item.conditionComment;
        this.purchaseDate = item.purchaseDate;
        this.lastService = item.lastService;
        this.picture = item.picture;
        this.tags = item.tags;
        this.itemGroup = item.itemGroup;
        this.status = item.status;
        this.updateText(translate);
    }

    public constructor(item: Item, translate: TranslateService, selectedProvider: SelectedProvider) {
        this._selectedProvider = selectedProvider;
        this.updateFrom(item, translate);
    }
}

class SelectableItemGroup implements SelectableItem {
    get externalId(): string {
        return this.subItems[Math.max(this._selected - 1, 0)].externalId;
    }
    get name(): string {
        return this.subItems[Math.max(this._selected - 1, 0)].description;
    }
    get description(): string {
        return this.subItems[Math.max(this._selected - 1, 0)].description;
    }
    get condition(): string {
        return this.subItems[Math.max(this._selected - 1, 0)].condition;
    }
    get conditionComment(): string {
        return this.subItems[Math.max(this._selected - 1, 0)].conditionComment;
    }
    get purchaseDate(): Date {
        //return new Date(_.reduce(this.subItems, (min: number, subItem: SelectableItem) => Math.min(min, subItem.purchaseDate.getDate())));
        return this.subItems[Math.max(this._selected - 1, 0)].purchaseDate;
    }
    get lastService(): Date {
        //return new Date(_.reduce(this.subItems, (min: number, subItem: SelectableItem) => Math.min(min, subItem.purchaseDate.getDate())));
        return this.subItems[Math.max(this._selected - 1, 0)].lastService;
    }
    get picture(): string {
        return this.subItems[Math.max(this._selected - 1, 0)].picture;
    }
    get tags(): string[] {
        return this.subItems[Math.max(this._selected - 1, 0)].tags;
    }

    get itemGroup(): string {
        return this.subItems[Math.max(this._selected - 1, 0)].itemGroup;
    }
    get status(): string {
        return this.subItems[Math.max(this._selected - 1, 0)].status;
    }
    get filter(): string {
        return this.subItems[Math.max(this._selected - 1, 0)].filter;
    }

    subItems: SelectableItemSingle[] = [];
    _selected: number;
    _deselected: number;
    _available: number;

    update(): boolean {
        let result = true;
        _.forEach(this.subItems, subItem => result = subItem.update() && result);
        this.subItems = _.sortBy(this.subItems, (subItem) => (subItem.available?0:100) + (subItem.selected?0:1) + (subItem.condition==='good'?10:(subItem.condition==='bad'?20:30)));
        this._selected = _.reduce(this.subItems, (sum: number, subItem: SelectableItem) => (subItem.selected?sum+1:sum), 0);
        this._deselected = _.reduce(this.subItems, (sum: number, subItem: SelectableItem) => (subItem.deselected?sum+1:sum), 0);
        this._available = _.reduce(this.subItems, (sum: number, subItem: SelectableItem) => (subItem.available?sum+1:sum), 0);
        return result;
    }

    get isSingle(): boolean {
        return this.count === 1;
    }

    get count(): number {
        return this.subItems.length;
    }

    get selected(): boolean {
        return this.selectedCount > 0;
    }

    set selected(value: boolean) {
        this.selectedCount = (value?1:0);
    }

    get deselected(): boolean {
        return this.deselectedCount > 0;
    }

    get available(): boolean {
        return this.availableCount > 0;
    }

    get selectedCount(): number {
        return this._selected;
    }

    get itemGroupRef(): SelectableItem {
        return this;
    }

    set selectedCount(value: number) {
        if (value > this._selected) {
            while (this._selected < value) {
                this.subItems[this._selected].selected = true;
                this._selected++;
            }
        } else {
            while (this._selected > value) {
                this._selected--;
                this.subItems[this._selected].selected = false;
            }
        }
    }

    get deselectedCount(): number {
        return this._deselected
    }

    get availableCount(): number {
        return this._available
    }

    public constructor() {
    }
}

@Component({
    selector: "reservation-page",
    template,
    styles: [ style ]
})
export class ReservationPage implements OnInit, OnDestroy, AfterViewInit {
    reservation: Reservation;

    private siblingReservationsHandle: Subscription;
    private selfSubscription: Subscription;

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

    private items: QueryObserverTransform<Item, SelectableItemSingle>;

    filter: string = "";

    forceClose: boolean = false;

    private _selectedProvider: SelectedProvider;
    private itemGroups: SelectableItem[] = [];
    private itemGroupsIndex: {[id:string]: SelectableItemGroup} = {};

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
                private ngZone: NgZone) {
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
        this._selectedProvider = {
            isAvailable: (itemId: string): boolean => {
                return !this.unavailableItems.hasOwnProperty(itemId);
            },

            isSelected: (itemId: string): boolean => {
                return this.selectedItemIds.indexOf(itemId) !== -1;
            },

            select: (itemId: string): void => {
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
                this.reservation = reservation;
                this.updateItemStates();
                this.isLoaded = true;
                this.endLoading();
            }
        });
    }

    ngOnInit() {
        let self = this;
        this.items = new QueryObserverTransform<Item, SelectableItemSingle>(this.itemsDataService.getPublicItems(), this.ngZone, (item) => {
            let transformed: SelectableItemSingle = (<any>item)._transformed;
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
                transformed = new SelectableItemSingle(item, this.translate, this._selectedProvider);
            }
            if (!transformed.itemGroupRef) {
                if (transformed.itemGroup) {
                    let itemGroup: SelectableItemGroup;
                    if (this.itemGroupsIndex.hasOwnProperty(transformed.itemGroup)) {
                        itemGroup = this.itemGroupsIndex[transformed.itemGroup];
                    } else {
                        itemGroup = new SelectableItemGroup();
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
        }, false, (item, index) => {
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


    @ViewChild(VirtualScroll) _virtualScroll: VirtualScroll;

    ngAfterViewInit() {
        setTimeout(() => {
            this.ngZone.run(() => {
                if (this._virtualScroll) {
                    this._virtualScroll.resize();
                    console.log("Resize after 1 sec");
                }
            });
        }, 1000);
    }
}
