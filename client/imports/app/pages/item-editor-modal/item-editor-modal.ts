import {Component, OnDestroy, OnInit} from "@angular/core";
import {ItemsDataService} from "../../services/items-data";
import {Item} from "../../../../../both/models/item.model";
import template from "./item-editor-modal.html";
import style from "./item-editor-modal.scss";
import * as _ from "lodash";
import {UserService} from "../../services/user";
import * as moment from 'moment';
import {ModalController, NavParams, ViewController} from "ionic-angular";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ImageGalleryModal} from "../image-gallery-modal/image-gallery-modal";
import {ExtendedFormItem} from "../../util/item-form";

@Component({
    selector: "item-editor-modal",
    template,
    styles: [ style ]
})
export class ItemEditorModal implements OnInit, OnDestroy {
    private item: Item;

    private itemForm: FormGroup;
    private canCopy: boolean = false;
    private create: boolean = false;

    constructor(private itemsService: ItemsDataService, private userService: UserService,
                private params: NavParams, private fb: FormBuilder, private modalCtrl: ModalController,
                private viewCtrl: ViewController) {
        this.item = params.get('item');
        let value = params.get('value');
        this.canCopy = params.get('canCopy') || false;
        this.create = params.get('create') || false;
        this.itemForm = ExtendedFormItem.createFormGroup(fb, this.item);
        if (value) {
            ExtendedFormItem.setFormValues(this.itemForm, value);
        }
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

    ngOnInit() {
        let query = null;
    }

    saveItem() {
        this.viewCtrl.dismiss({item: ExtendedFormItem.getFormItem(this.itemForm), create: this.create});
    }

    saveItemCopy() {
        this.viewCtrl.dismiss({item: ExtendedFormItem.getFormItem(this.itemForm), create: true});
    }

    cancel() {
        this.viewCtrl.dismiss(null);
    }

    ngOnDestroy() {
    }

    get isManager(): boolean {
        return this.userService.isManager;
    }
}
