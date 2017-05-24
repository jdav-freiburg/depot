import {Component, OnDestroy, OnInit} from "@angular/core";
import { Observable } from "rxjs";
import template from "./items-importer.html";
import style from "./items-importer.scss";
import * as _ from "lodash";
import {UserService} from "../../services/user";
import {AlertController, NavController, ToastController} from "ionic-angular";
import * as moment from 'moment';
import {TranslateService} from "../../services/translate";
import {TranslateHelperService} from "../../services/translate-helper";
import {Item} from "../../../../../both/models/item.model";
import {ItemsDataService} from "../../services/items-data";
import {FormGroup, FormBuilder, Validators} from "@angular/forms";

import * as Baby from 'babyparse';

@Component({
    selector: "items-importer-page",
    template,
    styles: [ style ]
})
export class ItemsImporterPage implements OnInit, OnDestroy {
    items: Item[] = null;

    filter: string = "";

    editItemId: string = null;

    uploadForm: FormGroup;

    isWorking: boolean = false;

    constructor(private fb: FormBuilder,
                private itemsDataService: ItemsDataService, private userService: UserService,
                private navCtrl: NavController, private translate: TranslateService, private toast: ToastController,
                private translateHelper: TranslateHelperService, private alert: AlertController) {
        this.uploadForm = fb.group({
            file: ["", Validators.required],
        });
    }

    ngOnInit() {
    }

    ngOnDestroy() {
    }

    momentFormat(date: Date) {
        let m = moment(date);
        if (m.isValid()) {
            return m.format('L');
        }
        return "";
    }

    headerFn(rec, idx) {
        return idx === 0 ? true : null;
    }

    exportItems() {
        let itemsData = this.itemsDataService.getItems().fetch();
        let header = ['_id', 'externalId', 'name', 'description', 'condition', 'conditionComment', 'purchaseDate',
            'lastService', 'tags', 'status', 'itemGroup'];
        let data = _.map(itemsData, (item) => [item._id, item.externalId, item.name, item.description, item.condition,
            item.conditionComment, this.momentFormat(item.purchaseDate), this.momentFormat(item.lastService),
            _.join(item.tags, ','), item.status, item.itemGroup]);
        let exportData = Baby.unparse({fields: header, data: data}, {delimiter: ';'});
        let blob = new Blob([exportData], { type: 'text/csv' });
        let url= URL.createObjectURL(blob);
        let temporaryDownloadLink = document.createElement("a");
        if (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1) {
            temporaryDownloadLink.setAttribute("target", "_blank");
        }
        temporaryDownloadLink.setAttribute("href", url);
        temporaryDownloadLink.setAttribute("download", "items.csv");
        temporaryDownloadLink.style.visibility = "hidden";
        document.body.appendChild(temporaryDownloadLink);
        temporaryDownloadLink.click();
        document.body.removeChild(temporaryDownloadLink);
    }

    fileDrop(data) {
        console.log("Drop:", data);
        let result = Baby.parse(data).data;
        let isFirst = true;
        let first = result.splice(0, 1)[0];
        while (_.every(result[result.length - 1], (field) => !field)) {
            let removed = result.pop();
            console.log("Remove last entry: ", removed);
        }
        console.log("First entry:", first);
        console.log("Second entry:", result[1]);
        console.log("Last entry:", result[result.length - 1]);
        this.items = _.map(result, entry => {
            let purchaseDate;
            if (entry[6] && (<string>entry[6]).length == 4) {
                purchaseDate = moment(entry[6], "YYYY")
            } else {
                purchaseDate = moment(entry[6], "DD.MM.YYYY");
            }
            let lastService = moment(entry[7], "DD.MM.YYYY");
            return {
                _id: <string>entry[0],
                externalId: <string>entry[1],
                name: <string>entry[2],

                description: <string>entry[3],

                condition: <string>entry[4],
                conditionComment: <string>entry[5],

                purchaseDate: purchaseDate.isValid()?purchaseDate.toDate():null,
                lastService: lastService.isValid()?lastService.toDate():null,

                picture: null,

                tags: (!(<string>entry[8]).trim()?[]:_.map(_.split(<string>entry[8], ","), str => str.trim())),

                status: <string>entry[9],

                itemGroup: <string>entry[10] || null
            };
        });
        console.log("Imported entries", this.items);
    }

    getTags(tags: string): string[] {
        if (_.trim(tags) === "") {
            return [];
        }
        return _.map(_.split(tags, ','), (tag) => _.trim(tag));
    }

    get isManager(): boolean {
        return this.userService.isManager;
    }

    saveActually(updateComment: string) {
        this.isWorking = true;
        this.itemsDataService.addAll(this.items, updateComment, (err, res) => {
            this.isWorking = false;
            if (err) {
                console.log("Error:", err);
                this.toast.create({
                    message: this.translateHelper.getError(err),
                    duration: 2500
                }).present();
            }
        });
    }

    save() {
        this.alert.create({
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
                    role: 'cancel'
                },
                {
                    text: this.translate.get('ITEM_CARD.SAVE.SAVE'),
                    handler: (data) => {
                        this.saveActually(data.updateComment);
                    }
                },
            ]
        }).present();
    }
}
