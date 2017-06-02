import {AfterViewInit, Component, ElementRef, ViewChild} from "@angular/core";
import {NavParams, ViewController} from "ionic-angular";
import template from "./image-uploader-modal.html";
import style from "./image-uploader-modal.scss";
import * as _ from "lodash";

import 'fileapi';
import {UploadFS} from "meteor/jalik:ufs";
import {PictureService} from "../../services/picture";

declare const FileAPI: any;

@Component({
    selector: "image-uploader-page",
    template,
    styles: [ style ]
})
export class ImageUploaderModal implements AfterViewInit {
    @ViewChild("preview")
    private previewElement: ElementRef;
    private previewName: string;

    private title: string;
    private store: string;

    constructor(private viewCtrl: ViewController, private params: NavParams, private pictureService: PictureService) {
        this.title = this.params.get('title');
        this.store = this.params.get('store');
    }

    ngAfterViewInit() {
        if (this.params.get('data')) {
            this.previewElement.nativeElement.src = this.params.get('data');
            this.previewName = this.params.get('name');
            this.hasImage = true;
        }
    }

    private fileIsOver: boolean = false;

    private hasImage: boolean = false;

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

    onFileLoad(data: any, name: string) {
        this.previewElement.nativeElement.src = data;
        this.previewName = name;
        this.hasImage = true;
    }

    public upload(): void {
        UploadFS.selectFiles((file) => {
            this.openFile(file);
        });
    }

    cancel() {
        this.viewCtrl.dismiss(null);
    }

    save() {
        this.pictureService.resize(this.previewElement.nativeElement, 1920, "image/jpeg").then((imageBlob: Blob) => {
            console.log("Saving", imageBlob.type, imageBlob.size, this.previewName);
            this.pictureService.upload(imageBlob, this.store, this.previewName).then(
                (picture: string) => {
                    this.viewCtrl.dismiss({image: picture});
                },
                (err) => {
                    console.log(err);
                }
            );
        }).catch((err) => {
            console.log(err);
        });
    }
}
