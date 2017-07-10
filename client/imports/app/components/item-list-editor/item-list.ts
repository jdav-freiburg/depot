import {Component, Input} from "@angular/core";
import {Item} from "../../../../../both/models/item.model";
import template from "./item-list.html";
import style from "./item-list.scss";
import * as _ from "lodash";
import {UserService} from "../../services/user";
import * as moment from 'moment';
import {AlertController, ModalController, PopoverController, ToastController} from "ionic-angular";
import {TranslateService} from "../../services/translate";
import {ExtendedFormItem} from "../../util/item-form";
import {ItemListColumnsPage} from "./item-list-columns";
import {ImageGalleryModal} from "../../pages/image-gallery-modal/image-gallery-modal";
import {ItemsDataService} from "../../services/items-data";
import {TranslateHelperService} from "../../services/translate-helper";

@Component({
    selector: "item-list",
    template,
    styles: [ style ]
})
export class ItemListComponent {
    private _filter: string = "";

    @Input()
    public onSaveAll: (updateComment: string, updateItems: Item[], callback?: Function) => void;
    @Input()
    public onDelete: (item: Item, callback?: Function) => void;

    @Input()
    public saveCompact: boolean = true;

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

    private _items: ExtendedFormItem[];

    @Input()
    public set items(value: ExtendedFormItem[]) {
        this._items = value;
        this.updateFilter();
    }
    public get items(): ExtendedFormItem[] {
        return this._items;
    }

    private filteredItems: ExtendedFormItem[];

    private get filter(): string {
        return this._filter;
    }

    private set filter(value: string) {
        this._filter = value;
        this.updateFilter();
    }

    public updateFilter() {
        if (!this.items) {
            this.filteredItems = [];
        } else if (!this._filter || this._filter.length < 3) {
            this.filteredItems = this.items;
            _.forEach(this.items, (item) => {
                item.visible = true;
            });
        } else {
            let filterQuery = this._filter.toLowerCase().split(/\s+/);
            _.forEach(this.items, (item) => {
                item.visible = item.checkFilters(filterQuery);
            });
            this.filteredItems = _.filter(this.items, item => item.visible);
        }
        console.log("Update filter " + this._filter + " --> " + this.filteredItems.length + "/" + (this.items?this.items.length:0) + " items");
    }


    private headerFn(rec, idx) {
        return idx === 0 ? true : null;
    }

    constructor(private userService: UserService, private itemsService: ItemsDataService,
                private translate: TranslateService, private alertCtrl: AlertController,
                private modalCtrl: ModalController, private popoverCtrl: PopoverController,
                private toast: ToastController, private translateHelper: TranslateHelperService) {
    }

    get isManager(): boolean {
        return this.userService.isManager;
    }

    public showColumnOptions(ev) {
        let popover = this.popoverCtrl.create(ItemListColumnsPage, {
            columns: this.columns
        });
        popover.present({
            ev: ev
        });
    }

    private selectPicture(item: ExtendedFormItem) {
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

    private deleteItem(item: ExtendedFormItem, callback?: Function) {
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
                        this.onDelete(item, (err) => {
                            if (err) {
                                this.toast.create({
                                    message: this.translateHelper.getError(err),
                                    duration: 2500,
                                }).present();
                            } else {
                                this.translate.get('ITEM_CARD.DELETE.SUCCESS')
                            }
                            if (callback) {
                                callback(err);
                            }
                        });
                    }
                }
            ]
        }).present();
    }

    public save(callback?: Function) {
        if (this.saveCompact && !_.some(this.items, item => item && item.form.dirty)) {
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
                        let srcItems = this.saveCompact?_.filter(this.items, item => item.form.dirty):this.items;
                        let updateItems: Item[] = _.map(srcItems, (item) => {
                            return _.extend(item.getItemValues(), { _id: item._id });
                        });
                        this.onSaveAll(data.updateComment, updateItems, (err) => {
                            if (err) {
                                this.toast.create({
                                    message: this.translateHelper.getError(err),
                                    duration: 2500,
                                }).present();
                            } else {
                                console.log("Cleaning items");
                                _.forEach(srcItems, (item) => item.markClean());
                                this.toast.create({
                                    message: this.translate.get('ITEM_CARD.SAVE.SUCCESS'),
                                    duration: 2500,
                                }).present();
                            }
                            if (callback) {
                                callback();
                            }
                        });
                    }
                },
            ]
        }).present();
    }
}
