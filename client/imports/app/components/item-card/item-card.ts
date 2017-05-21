import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from "@angular/core";
import template from "./item-card.html";
import style from "./item-card.scss";
import * as _ from "lodash";
import {AlertController, NavController, ToastController} from "ionic-angular";
import {Subscription} from "rxjs/Subscription";
import {Item} from "../../../../../both/models/item.model";
import {ItemsDataService} from "../../services/items-data";
import {ItemStateModal} from "../../pages/item-state-modal/item-state-modal";
import {TranslateService} from "../../services/translate";
import {TranslateHelperService} from "../../services/translate-helper";
import * as moment from 'moment';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ChangeableData} from "../../util/query-observer";

@Component({
    selector: "item-card",
    template,
    styles: [ style ]
})
export class ItemCardComponent implements OnInit, OnChanges, OnDestroy {
    @Input() itemId: string = "";
    @Input() item: Item = null;
    private lastItemId: string = null;
    private itemSubscription: Subscription;
    private itemForm: FormGroup;

    private isSaving: boolean = false;

    constructor(private navCtrl: NavController, private itemsService: ItemsDataService,
                private translate: TranslateService, private fb: FormBuilder,
                private alertCtrl: AlertController, private toast: ToastController,
                private translateHelper: TranslateHelperService) {
        this.itemForm = fb.group({
            name: ["", Validators.required],
            description: ["", Validators.required],
            externalId: [""],
            purchaseDate: [null],
            lastService: [null],
            condition: ["100"],
            conditionComment: [""],
            itemGroup: [""],
            status: ["public", Validators.required],
            tags: [""]
        });
    }

    ngOnInit() {
        this.register();
    }

    askSave() {
        this.alertCtrl.create({
            title: this.translate.get('ITEM_CARD.SAVE.TITLE'),
            message: this.translate.get('ITEM_CARD.SAVE.MESSAGE'),
            buttons: [
                {
                    text: this.translate.get('ITEM_CARD.SAVE.SAVE'),
                    handler: () => {
                        this.saveItem(() => {
                            this.setFormValues();
                        });
                    }
                },
                {
                    text: this.translate.get('ITEM_CARD.SAVE.DISCARD'),
                    role: 'cancel',
                    handler: () => {
                        this.setFormValues();
                    }
                },
            ]
        }).present();
    }

    updateForm() {
        if (this.itemForm.dirty && !this.isSaving && this.item && this.lastItemId === this.item._id) {
            if (this.lastItemId !== this.item._id) {
                this.askSave();
            } else {
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
                                this.setFormValues();
                            }
                        },
                    ]
                }).present();
            }
        } else {
            this.setFormValues();
        }
    }

    setFormValues() {
        this.lastItemId = this.item._id;
        this.itemForm.setValue({
            name: this.item.name,
            description: this.item.description || "",
            externalId: this.item.externalId || "",
            purchaseDate: this.item.purchaseDate || null,
            lastService: this.item.lastService || null,
            condition: this.item.condition,
            conditionComment: this.item.conditionComment,
            itemGroup: this.item.itemGroup || "",
            status: this.item.status || null,
            tags: _.join(this.item.tags, ','),
        });
        this.itemForm.markAsPristine();
        this.itemForm.markAsUntouched();
        this.itemForm.updateValueAndValidity();
    }

    register() {
        if (this.itemSubscription) {
            this.itemSubscription.unsubscribe();
            this.itemSubscription = null;
        }
        if (this.itemId) {
            this.itemSubscription = this.itemsService.getItem(this.itemId).zone().subscribe((items) => {
                this.item = null;
                if (items.length > 0) {
                    this.item = items[0];
                    this.updateForm();
                    console.log("Item for", this.itemId, this.item);
                }
            });
        } else if (this.item) {
            if ((<any>this.item)._changed) {
                this.itemSubscription = (<ChangeableData<Item>><any>this.item)._changed.subscribe((item) => {
                    console.log("Item changed:", item);
                    this.item = item;
                    this.updateForm();
                });
            } else {
                this.updateForm();
            }
        } else {
            console.log("Reset form");
            this.itemForm.reset();
            this.itemForm.markAsPristine();
            this.itemForm.markAsUntouched();
            this.itemForm.updateValueAndValidity();
            this.itemForm.disable();
        }
    }

    ngOnDestroy() {
        if (this.itemSubscription) {
            this.itemSubscription.unsubscribe();
            this.itemSubscription = null;
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        this.register();
    }

    openItem() {
        if (this.item && this.item._id) {
            this.navCtrl.push(ItemStateModal, {
                showReservations: true,
                itemId: this.item._id
            });
        }
    }

    getTags(tags: string): string[] {
        if (_.trim(tags) === "") {
            return [];
        }
        return _.map(_.split(tags, ','), (tag) => _.trim(tag));
    }

    getDate(input: any): Date {
        let date = moment(input);
        if (date.isValid()) {
            return date.toDate();
        }
        return null;
    }

    getItemValues(): Item {
        return {
            name: this.itemForm.controls['name'].value || null,
            description: this.itemForm.controls['description'].value || null,
            externalId: this.itemForm.controls['externalId'].value || null,
            condition: this.itemForm.controls['condition'].value || null,
            conditionComment: this.itemForm.controls['conditionComment'].value || null,
            purchaseDate: this.getDate(this.itemForm.controls['purchaseDate'].value),
            lastService: this.getDate(this.itemForm.controls['lastService'].value),
            itemGroup: this.itemForm.controls['itemGroup'].value || null,
            status: this.itemForm.controls['status'].value || null,
            tags: this.getTags(this.itemForm.controls['tags'].value),
            picture: null
        };
    }

    saveItemActually(updateComment: string, callback?: Function) {
        let itemData = this.getItemValues();
        if (this.itemId || (this.item && this.item._id)) {
            itemData._id = this.itemId || this.item._id;
            this.isSaving = true;
            this.itemsService.update(itemData, updateComment, (err) => {
                this.isSaving = false;
                if (err) {
                    console.log("Error:", err);
                    this.toast.create({
                        message: this.translateHelper.getError(err),
                        duration: 2500,
                    }).present();
                } else {
                    console.log("Saved:", itemData);
                }
                if (callback) {
                    callback();
                }
            });
        } else {
            this.isSaving = true;
            this.itemsService.add(itemData, updateComment, (err) => {
                this.isSaving = false;
                if (err) {
                    console.log("Error:", err);
                    this.toast.create({
                        message: this.translateHelper.getError(err),
                        duration: 2500,
                    }).present();
                } else {
                    console.log("Saved:", itemData);
                }
                if (callback) {
                    callback();
                }
            });
        }
    }

    saveItem(callback?: Function) {
        if (!this.itemForm.dirty) {
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
                        this.saveItemActually(data.updateComment, callback);
                    }
                },
            ]
        }).present();
    }

    deleteItemActually() {
        if (this.itemId || (this.item && this.item._id)) {
            this.itemsService.remove(this.itemId || this.item._id, (err) => {
                if (err) {
                    this.toast.create({
                        message: this.translateHelper.getError(err),
                        duration: 2500
                    }).present();
                } else {
                    console.log("Deleted", this.item);
                }
            });
        }
    }

    deleteItem() {
        this.alertCtrl.create({
            title: this.translate.get('ITEM_CARD.DELETE.TITLE', this.item),
            subTitle: this.translate.get('ITEM_CARD.DELETE.SUBTITLE', this.item),
            buttons: [
                {
                    text: this.translate.get('ITEM_CARD.DELETE.NO'),
                    role: 'cancel'
                },
                {
                    text: this.translate.get('ITEM_CARD.DELETE.YES'),
                    handler: () => {
                        this.deleteItemActually();
                    }
                }
            ]
        }).present();
    }
}
