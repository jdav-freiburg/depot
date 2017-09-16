
import {FormGroup, FormBuilder, Validators} from "@angular/forms";
import {Item} from "../../../../both/models/item.model";
import * as moment from 'moment';
import * as _ from 'lodash';
import {ExtendedItem} from "./item";
import {TranslateService} from "../services/translate";

export class ExtendedFormItem extends ExtendedItem {
    form: FormGroup;

    public constructor(item: Item, translate: TranslateService, fb: FormBuilder) {
        super(item, translate);

        this.form = ExtendedFormItem.createFormGroup(fb, item);
    }

    public static createFormGroup(fb: FormBuilder, itemSrc: Item) {
        if (!itemSrc) {
            return fb.group({
                name: ["", Validators.required],
                description: ["", Validators.required],
                externalId: [""],
                purchaseDate: [null],
                lastService: [null],
                condition: ["good"],
                conditionComment: [""],
                itemGroup: [""],
                state: ["public", Validators.required],
                tags: [""],
                picture: [null],
            });
        }
        return fb.group({
            name: [itemSrc.name, Validators.required],
            description: [itemSrc.description, Validators.required],
            externalId: [itemSrc.externalId],
            purchaseDate: [itemSrc.purchaseDate],
            lastService: [itemSrc.lastService],
            condition: [itemSrc.condition || "good"],
            conditionComment: [itemSrc.conditionComment],
            itemGroup: [itemSrc.itemGroup],
            state: [itemSrc.state || "public", Validators.required],
            tags: [_.join(itemSrc.tags, ',')],
            picture: [itemSrc.picture],
        });
    }

    private static getTags(tags: string): string[] {
        if (_.trim(tags) === "") {
            return [];
        }
        return _.map(_.split(tags, ','), (tag) => _.trim(tag));
    }

    private static getDate(input: any): Date {
        let date = moment(input);
        if (date.isValid()) {
            return date.toDate();
        }
        return null;
    }

    public static setFormValues(form: FormGroup, itemSrc: Item) {
        form.setValue({
            name: itemSrc.name || "",
            description: itemSrc.description || "",
            externalId: itemSrc.externalId || "",
            purchaseDate: itemSrc.purchaseDate || null,
            lastService: itemSrc.lastService || null,
            condition: itemSrc.condition || "good",
            conditionComment: itemSrc.conditionComment || "",
            itemGroup: itemSrc.itemGroup || "",
            state: itemSrc.state || "public",
            tags: _.join(itemSrc.tags, ','),
            picture: itemSrc.picture
        });
    }

    reset(fb: FormBuilder) {
        this.form = ExtendedFormItem.createFormGroup(fb, this);
        this.markClean();
    }

    public static getFormItem(form: FormGroup): Item {
        return {
            name: form.controls['name'].value || "",
            description: form.controls['description'].value || "",
            externalId: form.controls['externalId'].value || "",
            condition: form.controls['condition'].value || "good",
            conditionComment: form.controls['conditionComment'].value || "",
            purchaseDate: ExtendedFormItem.getDate(form.controls['purchaseDate'].value),
            lastService: ExtendedFormItem.getDate(form.controls['lastService'].value),
            itemGroup: form.controls['itemGroup'].value || null,
            state: form.controls['state'].value || "public",
            tags: ExtendedFormItem.getTags(form.controls['tags'].value),
            picture: form.controls['picture'].value
        };
    }

    markClean() {
        this.form.markAsPristine();
        this.form.markAsUntouched();
        this.form.updateValueAndValidity();
    }
}