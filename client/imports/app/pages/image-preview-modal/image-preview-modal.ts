import {Component} from "@angular/core";
import {NavParams, ViewController} from "ionic-angular";
import template from "./image-preview-modal.html";
import style from "./image-preview-modal.scss";
import * as _ from "lodash";

import {PictureService} from "../../services/picture";

@Component({
    selector: "image-preview-page",
    template,
    styles: [ style ]
})
export class ImagePreviewModal {
    private title: string;

    private imageUrl: string;

    constructor(private viewCtrl: ViewController, params: NavParams, pictureService: PictureService) {
        this.title = params.get('title');
        console.log("Getting Picture for", params.get('picture'));
        this.imageUrl = pictureService.getPictureUrl(params.get('picture'));
        console.log("Picture url:", params.get('picture'), this.imageUrl);
    }
}
