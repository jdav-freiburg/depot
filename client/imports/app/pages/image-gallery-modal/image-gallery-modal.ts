import {Component, NgZone, OnDestroy} from "@angular/core";
import {ModalController, NavParams, ViewController} from "ionic-angular";
import template from "./image-gallery-modal.html";
import style from "./image-gallery-modal.scss";
import * as _ from "lodash";

import {UploadFS} from "meteor/jalik:ufs";
import {PictureService} from "../../services/picture";
import {QueryObserver, QueryObserverTransform} from "../../util/query-observer";

import 'fileapi';
import {ImageUploaderModal} from "../image-uploader-modal/image-uploader-modal";
import {Picture} from "../../../../../both/models/picture.model";
declare const FileAPI: any;

interface ImageFile {
    picture: string;
    url: string;
    thumbnailUrl: string;
    name: string;
}

@Component({
    selector: "image-gallery-page",
    template,
    styles: [ style ]
})
export class ImageGalleryModal implements OnDestroy {
    private title: string;
    private store: string;

    private fileIsOver: boolean = false;

    private selectedPicture: string;
    private images: QueryObserverTransform<Picture, ImageFile>;

    constructor(private viewCtrl: ViewController, private params: NavParams, private pictureService: PictureService,
            private ngZone: NgZone, private modalCtrl: ModalController) {
        this.title = this.params.get('title');
        this.selectedPicture = this.params.get('picture');
        this.store = this.params.get('store');
        this.images = new QueryObserverTransform<Picture, ImageFile>({
            query: pictureService.getPictures(this.store),
            zone: ngZone,
            transformer: (file) => {
                console.log(file);
                return {
                    picture: pictureService.getFilePicture(file),
                    name: file.name,
                    url: pictureService.getFilePictureUrl(file),
                    thumbnailUrl: pictureService.getFilePictureThumbnailUrl(file),
                }
            }
        });
    }

    ngOnDestroy() {
        if (this.images) {
            this.images.unsubscribe();
            this.images = null;
        }
    }

    select(image: ImageFile) {
        this.selectedPicture = image.picture;
        console.log("Select", image);
    }

    cancel() {
        this.viewCtrl.dismiss(null);
    }

    save() {
        this.viewCtrl.dismiss({image: this.selectedPicture});
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
                this.selectedPicture = data.image;
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
