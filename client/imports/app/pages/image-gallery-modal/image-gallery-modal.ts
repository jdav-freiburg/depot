import {Component, NgZone, OnDestroy} from "@angular/core";
import {ModalController, NavParams, ViewController} from "ionic-angular";
import template from "./image-gallery-modal.html";
import style from "./image-gallery-modal.scss";
import * as _ from "lodash";

import {UploadFS} from "meteor/jalik:ufs";
import {PictureService} from "../../services/picture";
import {QueryObserver} from "../../util/query-observer";

import 'fileapi';
import {ImageUploaderModal} from "../image-uploader-modal/image-uploader-modal";
declare const FileAPI: any;

@Component({
    selector: "image-gallery-page",
    template,
    styles: [ style ]
})
export class ImageGalleryModal implements OnDestroy {
    private title: string;
    private store: string;

    private fileIsOver: boolean = false;

    private selectedImageId: string;

    private images: QueryObserver<UploadFS.File>;

    constructor(private viewCtrl: ViewController, private params: NavParams, private pictureService: PictureService,
            private ngZone: NgZone, private modalCtrl: ModalController) {
        this.title = this.params.get('title');
        this.selectedImageId = this.params.get('picture');
        this.store = this.params.get('store');
        this.images = new QueryObserver(pictureService.getPictures(this.store), ngZone);
    }

    ngOnDestroy() {
        if (this.images) {
            this.images.unsubscribe();
            this.images = null;
        }
    }

    select(image: UploadFS.File) {
        this.selectedImageId = image._id;
        console.log("Select", image);
    }

    cancel() {
        this.viewCtrl.dismiss(null);
    }

    save() {
        this.viewCtrl.dismiss({image: this.selectedImageId});
    }


    onFileLoad(data: string, name: string) {
        let modalView = this.modalCtrl.create(ImageUploaderModal, {
            data: data,
            name: name,
            store: this.store,
            title: this.title
        });
        modalView.onDidDismiss((data) => {
            if (data) {
                console.log("New Picture:", data);
                this.selectedImageId = data.image;
            }
        });
        modalView.present();
    }

    onFileOver(isOver: boolean) {
        this.fileIsOver = isOver;
    }

    onFileDrop(data: any) {
        this.openFile(data);
    }

    openFile(file: File) {
        FileAPI.readAsDataURL(file, (event) => {
            if (event.type === 'load') {
                this.onFileLoad(event.result, file.name);
            } else if (event.type === 'error') {
                throw new Error(`Couldn't read file '${file.name}'`);
            }
        });
    }

    public upload(): void {
        UploadFS.selectFiles((file) => {
            this.openFile(file);
        });
    }
}
