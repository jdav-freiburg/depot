import {Component, NgZone, OnDestroy, OnInit} from "@angular/core";
import {ItemsDataService} from "../../services/items-data";
import {Item} from "../../../../../both/models/item.model";
import template from "./item-list.html";
import style from "./item-list.scss";
import * as _ from "lodash";
import {UserService} from "../../services/user";
import * as moment from 'moment';
import {AlertController, ModalController, NavController, PopoverController, ToastController} from "ionic-angular";
import {TranslateService} from "../../services/translate";
import {ChangeableDataTransform, QueryObserverTransform} from "../../util/query-observer";
import {ItemCardsPage} from "../item-cards/item-cards";
import {FilterItem} from "../../util/item";
import {Subscription} from "rxjs/Subscription";
import {FormBuilder} from "@angular/forms";
import {TranslateHelperService} from "../../services/translate-helper";
import {ExtendedFormItem} from "../../util/item-form";
import {ImageGalleryModal} from "../image-gallery-modal/image-gallery-modal";
import {ItemListColumnsPage} from "./item-list-columns";

@Component({
    selector: "item-list-page",
    template,
    styles: [ style ]
})
export class ItemListPage implements OnInit, OnDestroy {
    private _filter: string = "";
    private itemsChangedSubscription: Subscription;
    private isSaving: boolean = false;

    private columns = {
        name: {visible: true},
        description: {visible: true},
        externalId: {visible: true},
        purchaseDate: {visible: false},
        lastService: {visible: true},
        condition: {visible: true},
        conditionComment: {visible: true},
        itemGroup: {visible: false},
        status: {visible: true},
        tags: {visible: true},
        picture: {visible: true},
    };

    private get filter(): string {
        return this._filter;
    }

    private set filter(value: string) {
        this._filter = value;
        this.updateFilter();
    }

    private updateFilter() {
        if (!this.items || !this.items.data) {
            this.filteredItems = [];
        } else if (!this._filter || this._filter.length < 3) {
            this.filteredItems = this.items.data;
            _.forEach(this.items.data, (item) => {
                item.visible = true;
            });
        } else {
            let filter = this._filter.toLowerCase();
            _.forEach(this.items.data, (item) => {
                item.visible = item.filter.indexOf(filter) !== -1;
            });
            this.filteredItems = _.filter(this.items.data, item => item.visible);
        }
        console.log("Update filter " + this._filter + " --> " + this.filteredItems.length + " items");
    }

    private items: QueryObserverTransform<Item, ExtendedFormItem>;

    private filteredItems: FilterItem[];

    headerFn(rec, idx) {
        return idx === 0 ? true : null;
    }

    constructor(private itemsService: ItemsDataService, private userService: UserService,
                private navCtrl: NavController, private translate: TranslateService, private ngZone: NgZone,
                private formBuilder: FormBuilder, private alertCtrl: AlertController, private toast: ToastController,
                private translateHelper: TranslateHelperService, private modalCtrl: ModalController,
                private popoverCtrl: PopoverController) {
    }

    ngOnInit() {
        this.items = new QueryObserverTransform<Item, ExtendedFormItem>({
            query: this.itemsService.getItems(),
            zone: this.ngZone,
            transformer: (item) => {
                if (!item) {
                    return null;
                }
                let transformed: ExtendedFormItem = (<ChangeableDataTransform<Item, ExtendedFormItem>>item)._transformed;
                if (transformed) {
                    transformed.updateFrom(item, this.translate);
                    if (transformed.form.dirty && !this.isSaving) {
                        this.alertCtrl.create({
                            title: this.translate.get('ITEM_CARD.CHANGE.TITLE'),
                            message: this.translate.get('ITEM_CARD.CHANGE.MESSAGE'),
                            buttons: [
                                {
                                    text: this.translate.get('ITEM_CARD.CHANGE.CANCEL'),
                                    role: 'cancel'
                                },
                                {
                                    text: this.translate.get('ITEM_CARD.CHANGE.ACCEPT'),
                                    handler: () => {
                                        transformed.setFormValues();
                                    }
                                },
                            ]
                        }).present();
                    }
                } else {
                    transformed = new ExtendedFormItem(item, this.translate, this.formBuilder);
                }
                return transformed;
            }
        });
        this.itemsChangedSubscription = this.items.dataChanged.subscribe(() => {
            this.updateFilter();
        });
    }

    ngOnDestroy() {
        if (this.items) {
            this.items.unsubscribe();
            this.items = null;
        }
        if (this.itemsChangedSubscription) {
            this.itemsChangedSubscription.unsubscribe();
            this.itemsChangedSubscription = null;
        }
    }

    showCards() {
        this.navCtrl.pop();
        this.navCtrl.push(ItemCardsPage);
    }

    get isManager(): boolean {
        return this.userService.isManager;
    }

    showColumnOptions(ev) {
        let popover = this.popoverCtrl.create(ItemListColumnsPage, {
            columns: this.columns
        });
        popover.present({
            ev: ev
        });
    }

    selectPicture(item) {
        let modalView = this.modalCtrl.create(ImageGalleryModal, {
            picture: item.form.controls['picture'].value,
            store: 'pictures-items',
            title: item.form.controls['name'].value
        });
        modalView.onDidDismiss((data) => {
            if (data) {
                console.log("New Picture:", data);
                if (data.image !== item.form.controls['picture'].value) {
                    item.form.controls['picture'].setValue(data.image);
                    item.form.controls['picture'].markAsTouched();
                    item.form.controls['picture'].markAsDirty();
                    item.form.controls['picture'].updateValueAndValidity();
                }
            }
        });
        modalView.present();
    }

    deleteItemActually(item: Item) {
        this.itemsService.remove(item._id, (err) => {
            if (err) {
                this.toast.create({
                    message: this.translateHelper.getError(err),
                    duration: 2500
                }).present();
            } else {
                console.log("Deleted", item);
            }
        });
    }

    deleteItem(item: Item) {
        this.alertCtrl.create({
            title: this.translate.get('ITEM_CARD.DELETE.TITLE', item),
            subTitle: this.translate.get('ITEM_CARD.DELETE.SUBTITLE', item),
            buttons: [
                {
                    text: this.translate.get('ITEM_CARD.DELETE.NO'),
                    role: 'cancel'
                },
                {
                    text: this.translate.get('ITEM_CARD.DELETE.YES'),
                    handler: () => {
                        this.deleteItemActually(item);
                    }
                }
            ]
        }).present();
    }

    saveAll(updateComment: string, callback?: Function) {
        let updateItems: Item[] = _.map(_.filter(this.items.data, item => item.form.dirty), (item) => {
            return _.extend(item.getItemValues(), { _id: item._id });
        });
        this.isSaving = true;
        console.log("Updating", updateItems);
        this.itemsService.addAll(updateItems, updateComment, (err) => {
            this.isSaving = false;
            if (err) {
                this.toast.create({
                    message: this.translateHelper.getError(err),
                    duration: 2500,
                }).present();
            }
            if (callback) {
                callback();
            }
        });
    }

    save(callback?: Function) {
        if (!_.some(this.items.data, item => item && item.form.dirty)) {
            return;
        }
        this.alertCtrl.create({
            title: this.translate.get('ITEM_CARD.SAVE.TITLE'),
            subTitle: this.translate.get('ITEM_CARD.SAVE.SUBTITLE'),
            inputs: [
                {
                    placeholder: this.translate.get('ITEM_CARD.SAVE.COMMENT_LABEL'),
                    type: 'text',
                    name: 'updateComment'
                }
            ],
            buttons: [
                {
                    text: this.translate.get('ITEM_CARD.SAVE.CANCEL'),
                    role: 'cancel',
                    handler: () => {
                        if (callback) {
                            callback();
                        }
                    }
                },
                {
                    text: this.translate.get('ITEM_CARD.SAVE.SAVE'),
                    handler: (data) => {
                        this.saveAll(data.updateComment, callback);
                    }
                },
            ]
        }).present();
    }
}
