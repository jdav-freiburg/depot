import {Injectable} from "@angular/core";
import {UploadFS} from "meteor/jalik:ufs";

import * as _ from 'lodash';
import {FileCollection} from "../../../../both/collections/file.collection";
import {User} from "../../../../both/models/user.model";
import {ObservableCursor} from "meteor-rxjs";
import {Picture} from "../../../../both/models/picture.model";

/*export const ItemPictureStore = new UploadFS.store.GridFS({
    collection: FileCollection.collection,
    name: 'pictures-items',
    permissions: new UploadFS.StorePermissions({
        insert(userId, doc: UploadFS.File) {
            let user: User = Meteor.users.findOne(userId);
            return user.roles.indexOf('manager') !== null;
        },
        update(userId, doc: UploadFS.File) {
            let user: User = Meteor.users.findOne(userId);
            return user.roles.indexOf('manager') !== null;
        },
        remove(userId, doc: UploadFS.File) {
            let user: User = Meteor.users.findOne(userId);
            return user.roles.indexOf('manager') !== null;
        }
    })
});

export const ProfilePictureStore = new UploadFS.store.GridFS({
    collection: FileCollection.collection,
    name: 'pictures-profiles',
    permissions: new UploadFS.StorePermissions({
        insert(userId, doc: UploadFS.File) {
            return !!userId;
        },
        update(userId, doc: UploadFS.File) {
            if (userId == doc.userId) {
                return true;
            }
            let user: User = Meteor.users.findOne(userId);
            return user.roles.indexOf('admin') !== null;
        },
        remove(userId, doc: UploadFS.File) {
            if (userId == doc.userId) {
                return true;
            }
            let user: User = Meteor.users.findOne(userId);
            return user.roles.indexOf('admin') !== null;
        }
    })
});*/

const UPLOAD_FS_STORE_PATH = 'images';

@Injectable()
export class PictureService {

    constructor() {
        Tracker.autorun(() => {
            Meteor.subscribe('pictures');
        });
    }

    select(): Promise<Blob> {
        return new Promise((resolve, reject) => {
            try {
                UploadFS.selectFile((file: File) => {
                    resolve(file);
                });
            }
            catch (e) {
                reject(e);
            }
        });
    }

    resizeThumbnail(image: HTMLImageElement, size: number, mimeType: string, circleShape?: boolean): Promise<Blob> {
        return new Promise<Blob>((resolve, reject) => {
            if (image.width == 0 || image.height == 0) {
                throw new Meteor.Error("image-empty", "Image is empty");
            }
            let canvas: HTMLCanvasElement = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            let srcX = 0, srcY = 0, srcW = image.width, srcH = image.height;
            let imageRatio = image.width / image.height;
            if (imageRatio > 1) {
                srcW = Math.ceil((image.width - image.height) / 2);
                srcX = Math.floor(srcW / 2);
            } else {
                srcH = Math.ceil((image.height - image.width) / 2);
                srcY = Math.floor(srcH / 2);
            }
            document.body.appendChild(canvas);
            let context: CanvasRenderingContext2D = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);
            if (circleShape) {
                context.beginPath();
                context.fillStyle = "white";
                context.arc(size, size, size / 2, 0, 2 * Math.PI);
                context.rect(size, 0, -size, size);
                context.fill();
            }
            if (canvas.toBlob) {
                canvas.toBlob((result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(new Meteor.Error('internal-error', "Can't save image as blob"));
                    }
                }, mimeType);
            } else {
                let dataUrl = canvas.toDataURL(mimeType);
                resolve(this.dataURItoBlob(dataUrl));
            }
        });
    }

    resize(image: HTMLImageElement, maxSize: number, mimeType: string): Promise<Blob> {
        return new Promise<Blob>((resolve, reject) => {
            if (image.naturalWidth == 0 || image.naturalHeight == 0) {
                throw new Meteor.Error("image-empty", "Image is empty");
            }
            let canvas: HTMLCanvasElement = document.createElement('canvas');
            let imageRatio = image.naturalWidth / image.naturalHeight;
            if (imageRatio > 1) {
                canvas.width = Math.min(maxSize, image.naturalWidth);
                canvas.height = canvas.width / imageRatio;
            } else {
                canvas.height = Math.min(maxSize, image.naturalHeight);
                canvas.width = canvas.height * imageRatio;
            }
            document.body.appendChild(canvas);
            let context: CanvasRenderingContext2D = canvas.getContext('2d');
            (<any>context).imageSmoothingEnabled = true;
            (<any>context).mozImageSmoothingEnabled = true;
            (<any>context).oImageSmoothingEnabled = true;
            (<any>context).webkitImageSmoothingEnabled = true;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, canvas.width, canvas.height);
            if (canvas.toBlob) {
                canvas.toBlob((result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(new Meteor.Error('internal-error', "Can't save image as blob"));
                    }
                }, mimeType);
            } else {
                let dataUrl = canvas.toDataURL(mimeType);
                resolve(this.dataURItoBlob(dataUrl));
            }
        });
    }

    dataURItoBlob(dataURI: string): Blob {
        let match = dataURI.match(/^data:(image\/([a-zA-Z*-]+));base64,/);
        if (!match) {
            console.log("Invalid image uri:", dataURI.substring(0, Math.min(dataURI.length, 100)), match);
            throw new Meteor.Error("unrecognized-image-uri", "Unrecognized image uri");
        }
        let mime = match[1];
        let byteString = atob(dataURI.substring(match[0].length));
        let data = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) {
            data[i] = byteString.charCodeAt(i);
        }
        return new Blob([data], {type: mime});
    }

    getPictures(store: string): ObservableCursor<Picture> {
        return FileCollection.find({store: store, complete: true}, {sort: {uploadedAt: -1}});
    }

    upload(blob: Blob|File, store: string, filename: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const metadata: UploadFS.File = {
                name: filename,
                type: blob.type,
                size: blob.size,
            };

            const upload = new UploadFS.Uploader({
                data: blob,
                file: metadata,
                store: store,
                onComplete: (file: Picture) => {
                    resolve(`${file.store}/${file._id}/${file.name};${file.thumbnailStore}/${file.thumbnailId}/${file.name}`);
                },
                onError: reject
            });

            upload.start();
        });
    }

    getPictureId(picture: string): string {
        let idx = picture.indexOf(';');
        if (idx === -1) {
            return null;
        }
        let re = /\/([^\/\?]+)\/([^\/\?]+)\/([^\/\?]+)$/;
        let match = re.exec(picture.substring(0, idx));
        if (match === null) {
            return null;
        }
        return match[2];
    }

    getFilePicture(file: Picture): string {
        return `${this.getFilePictureUrl(file)};${this.getFilePictureThumbnailUrl(file)}`;
    }

    getFilePictureUrl(file: Picture): string {
        return `/${UPLOAD_FS_STORE_PATH}/${file.store}/${file._id}/${file.name}`;
    }

    getFilePictureThumbnailUrl(file: Picture): string {
        return `/${UPLOAD_FS_STORE_PATH}/${file.thumbnailStore}/${file.thumbnailId}/${file.name}`;
    }

    getPictureUrl(picture: string): string {
        let idx = picture.indexOf(';');
        if (idx === -1) {
            return null;
        }
        return `/${UPLOAD_FS_STORE_PATH}/${picture.substring(0, idx)}`;
    }

    getPictureThumbnailUrl(picture: string): string {
        let idx = picture.indexOf(';');
        if (idx === -1) {
            return null;
        }
        return `/${UPLOAD_FS_STORE_PATH}/${picture.substring(idx + 1)}`;
    }
}