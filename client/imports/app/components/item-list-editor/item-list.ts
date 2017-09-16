import {Component, DoCheck, Input, IterableDiffer, IterableDiffers, SimpleChange} from "@angular/core";
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
import {ItemEditorModal} from "../../pages/item-editor-modal/item-editor-modal";
import {FormBuilder} from "@angular/forms";

@Component({
    selector: "item-list",
    template,
    styles: [ style ]
})
export class ItemListComponent implements DoCheck {
    private _filter: string = "";

    @Input()
    public onSaveAll: (updateComment: string, updateItems: Item[], callback?: Function) => void;
    @Input()
    public onDelete: (item: Item, callback?: Function) => void;

    @Input()
    public saveCompact: boolean = true;

    private lockableColumns = [
        'name',
        'description',
        'externalId',
        'purchaseDate',
        'lastService',
        'condition',
        'conditionComment',
        'itemGroup',
        'state',
        'tags',
        'picture'
    ];

    private columns = {
        editor: {visible: true},
        name: {visible: true, lock: true},
        description: {visible: true, lock: true},
        externalId: {visible: true, lock: false},
        purchaseDate: {visible: false, lock: false},
        lastService: {visible: true, lock: false},
        condition: {visible: true, lock: false},
        conditionComment: {visible: true, lock: false},
        itemGroup: {visible: false, lock: true},
        state: {visible: true, lock: false},
        tags: {visible: true, lock: true},
        picture: {visible: true, lock: true},
    };

    private _items: ExtendedFormItem[];
    private _itemsDiffer: IterableDiffer<ExtendedFormItem>;

    private _newItems: ExtendedFormItem[] = null;

    @Input()
    public set canCopy(value: boolean) {
        if (!value) {
            this._newItems = null;
        } else if (!this._newItems) {
            this._newItems = [];
        }
    }

    public get canCopy(): boolean {
        return !!this._newItems;
    }

    @Input()
    public set items(value: ExtendedFormItem[]) {
        this._items = value;
        if (value) {
            this._itemsDiffer = this.differs.find(value).create();
        } else {
            this._itemsDiffer = null;
        }
        this.updateFilter();
    }
    public get items(): ExtendedFormItem[] {
        return this._items;
    }

    private filteredItems: ExtendedFormItem[];

    @Input()
    public get filter(): string {
        return this._filter;
    }

    public set filter(value: string) {
        this._filter = value;
        this.updateFilter();
    }

    public updateFilter() {
        if (!this.items) {
            if (this._newItems) {
                this.filteredItems = this._newItems;
            } else {
                this.filteredItems = [];
            }
        } else if (!this._filter || this._filter.length < 3) {
            this.filteredItems = this._newItems?_.concat(this._newItems, this.items):this.items;
            _.forEach(this.items, (item) => {
                item.visible = true;
            });
        } else {
            let filterQuery = this._filter.toLowerCase().split(/\s+/);
            let items = this._newItems?_.concat(this._newItems, this.items):this.items;
            _.forEach(items, (item) => {
                item.visible = item.checkFilters(filterQuery);
            });
            this.filteredItems = _.filter(items, item => item.visible);
        }
        console.log("Update filter " + this._filter + " --> " + this.filteredItems.length + "/" + (this._newItems?this._newItems.length:0) + "+" + (this.items?this.items.length:0) + " items");
    }

    private headerFn(rec, idx) {
        return idx === 0 ? true : null;
    }

    constructor(private userService: UserService, private itemsService: ItemsDataService,
                private translate: TranslateService, private alertCtrl: AlertController,
                private modalCtrl: ModalController, private popoverCtrl: PopoverController,
                private toast: ToastController, private translateHelper: TranslateHelperService,
                private differs: IterableDiffers, private fb: FormBuilder) {
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

    ngDoCheck() {
        if (this._itemsDiffer) {
            if (this._itemsDiffer.diff(this._items)) {
                this.updateFilter();
            }
        }
    }

    private changingPropertyGroup: string = null;

    private onItemChanged(item: ExtendedFormItem, property: string, $event: string) {
        let itemGroup = item.form.controls['itemGroup'].value;
        if (itemGroup && this.columns[property].lock && itemGroup !== this.changingPropertyGroup) {
            this.changingPropertyGroup = itemGroup;
            let newValue = (($event!==null)?$event:item.form.controls[property].value);
            console.log("Item Changed:", item._id + "." + property, "=>", newValue);
            _.forEach(this._items, checkItem => {
                if (checkItem.form.controls['itemGroup'].value === itemGroup && checkItem !== item &&
                        !_.isEqual(checkItem.form.controls[property].value, newValue)) {
                    console.log("Updating:", checkItem._id + "." + property, "=>", newValue);
                    checkItem.form.controls[property].setValue(newValue, {emitViewToModelChange: false});
                    checkItem.form.controls[property].markAsTouched();
                    checkItem.form.controls[property].markAsDirty();
                }
            });
        } else {
            console.log("Ignore Item Changed:", item._id + "." + property);
        }
        this.changingPropertyGroup = null;
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
                    this.onItemChanged(item, 'picture', null);
                }
            }
        });
        modalView.present();
    }

    private openItemEditor(item: ExtendedFormItem) {
        let inputItem = ExtendedFormItem.getFormItem(item.form);
        let modalView = this.modalCtrl.create(ItemEditorModal, {
            item: inputItem,
            canCopy: this.canCopy,
            create: false
        });
        modalView.onDidDismiss((data) => {
            if (data) {
                console.log("Update Result:", data);
                let editItem = item;
                if (data.create) {
                    editItem = new ExtendedFormItem({
                        _id: null,
                        externalId: "",
                        name: "",

                        description: "",

                        condition: "good",
                        conditionComment: "",

                        purchaseDate: null,
                        lastService: null,

                        picture: null,

                        tags: [],

                        itemGroup: "",

                        state: "public"
                    }, this.translate, this.fb);
                    this._newItems.push(editItem);
                }
                ExtendedFormItem.setFormValues(editItem.form, data.item);
                editItem.form.updateValueAndValidity();
                if (data.create) {
                    this.filteredItems.splice(0, 0, editItem);
                } else {
                    _.forEach(this.lockableColumns, column => {
                        if (!_.isEqual(data.item[column], inputItem[column])) {
                            this.onItemChanged(item, column, null);
                        }
                    });
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
                        let newItemIndex;
                        if (this._newItems && (newItemIndex = _.indexOf(this._newItems, item)) !== -1) {
                            this._newItems.splice(newItemIndex, 1);
                            this.updateFilter();
                        } else {
                            this.onDelete(item, (err) => {
                                if (err) {
                                    this.toast.create({
                                        message: this.translateHelper.getError(err),
                                        duration: 2500,
                                    }).present();
                                } else {
                                    this.updateFilter();
                                    this.translate.get('ITEM_CARD.DELETE.SUCCESS')
                                }
                                if (callback) {
                                    callback(err);
                                }
                            });
                        }
                    }
                }
            ]
        }).present();
    }

    public save(callback?: Function) {
        if (this.saveCompact && !_.some(this.items, item => item && item.form.dirty) && !(this._newItems && this._newItems.length)) {
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
                        if (this._newItems) {
                            srcItems = _.concat(srcItems, this._newItems);
                        }
                        let updateItems: Item[] = _.map(srcItems, (item) => {
                            return _.extend(ExtendedFormItem.getFormItem(item.form), { _id: item._id });
                        });
                        this.onSaveAll(data.updateComment, updateItems, (err) => {
                            if (err) {
                                this.toast.create({
                                    message: this.translateHelper.getError(err),
                                    duration: 2500,
                                }).present();
                            } else {
                                console.log("Cleaning items");
                                //_.forEach(srcItems, (item) => item.markClean());
                                _.forEach(srcItems, (item) => item.reset(this.fb));
                                if (this._newItems) {
                                    this._newItems = [];
                                }
                                this.updateFilter();
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
