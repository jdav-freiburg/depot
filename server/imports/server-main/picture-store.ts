import {UploadFS} from 'meteor/jalik:ufs';
import {FileCollection} from "../../../both/collections/file.collection";
import {FileSchema} from "../../../both/models/file.model";
import {Roles, Future} from "./utils";
import {UserCollection} from "../../../both/collections/user.collection";
import * as Jimp from "jimp";
import {ReadStream, WriteStream} from "fs";

UploadFS.config.tmpDir = process.env.UPLOAD_TMP || (process.cwd() + "/upload-tmp");
UploadFS.config.tmpDirPermissions = "0777";
UploadFS.config.storesPath = "images";

const transformWrite = function(from: ReadStream, to: WriteStream, fileId, file: UploadFS.File) {
    let buffers = [];
    from.on('data', function(buffer) {
        buffers.push(buffer);
    });
    from.on('end', function() {
        let buffer = Buffer.concat(buffers);
        Jimp.read(buffer).then((img: Jimp) => {
            img.scaleToFit(1920, 1920)
                .quality(80)
                .getBuffer(file.type, (err: Error, buffer: Buffer) => {
                    if (err) {
                        console.log("Image Error:", err);
                        to.emit("error", new Meteor.Error("invalid-image", err.message));
                    } else {
                        to.write(buffer);
                        to.end();
                    }
                });
        }).catch((err: Error) => {
            console.log("Image Error:", err);
            to.emit("error", new Meteor.Error("invalid-image", err.message));
        });
    });
};


const transformWriteThumbnail = function(from: ReadStream, to: WriteStream, fileId, file: UploadFS.File) {
    let buffers = [];
    from.on('data', function(buffer) {
        buffers.push(buffer);
    });
    from.on('end', function() {
        let buffer = Buffer.concat(buffers);
        Jimp.read(buffer).then((img: Jimp) => {
            img.cover(128, 128, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE)
                .quality(85)
                .getBuffer(file.type, (err: Error, buffer: Buffer) => {
                    if (err) {
                        console.log("Image Error:", err);
                        to.emit("error", new Meteor.Error("invalid-image", err.message));
                    } else {
                        to.write(buffer);
                        to.end();
                    }
                });
        }).catch((err: Error) => {
            console.log("Image Error:", err);
            to.emit("error", new Meteor.Error("invalid-image", err.message));
        });
    });
};

Meteor.publish('pictures-profiles', function() {
    if (this.userId) {
        console.log("register pictures profiles");
        return FileCollection.find({store: 'pictures-profiles'}, {
            fields: {
                _id: 1,
                userId: 1,
                url: 1
            }
        });
    }
    this.ready();
});

Meteor.publish('pictures-items', function() {
    if (this.userId) {
        console.log("register pictures items");
        return FileCollection.find({store: 'pictures-items'}, {
            fields: {
                _id: 1,
                url: 1
            }
        });
    }
    this.ready();
});

Meteor.publish('pictures', function() {
    if (this.userId) {
        console.log("register pictures");
        return FileCollection.find({});
        /*return FileCollection.find({}, {
            fields: {
                _id: 1,
                name: 1,
                userId: 1,
                thumbnailUrl: 1,
                url: 1
            }
        });*/
    }
    this.ready();
});

const storeFilter = new UploadFS.Filter({
    minSize: 1,
    maxSize: 1024 * 1024 * 2, // 2MiB,
    contentTypes: ['image/*'],
    extensions: ['jpg', 'png'],
    onCheck: function(file: UploadFS.File) {
        FileSchema.validate(file);
        return true;
    }
});

const ItemPictureThumbnailStore = new UploadFS.store.GridFS({
    collection: FileCollection.collection,
    name: 'pictures-items-thumbnails',
    transformWrite: transformWriteThumbnail,
    filter: storeFilter,
    onFinishUpload: (file: UploadFS.File) => {
        FileCollection.update(file.originalId, {$set: {thumbnailUrl: file.url}});
    },
    permissions: new UploadFS.StorePermissions({
        insert(userId, doc: UploadFS.File) {
            return Roles.userHasRole(userId, 'manager');
        },
        update(userId, doc: UploadFS.File) {
            return Roles.userHasRole(userId, 'manager');
        },
        remove(userId, doc: UploadFS.File) {
            return Roles.userHasRole(userId, 'manager');
        }
    })
});

const ItemPictureStore = new UploadFS.store.GridFS({
    collection: FileCollection.collection,
    name: 'pictures-items',
    transformWrite: transformWrite,
    filter: storeFilter,
    copyTo: [ItemPictureThumbnailStore],
    permissions: new UploadFS.StorePermissions({
        insert(userId, doc: UploadFS.File) {
            return Roles.userHasRole(userId, 'manager');
        },
        update(userId, doc: UploadFS.File) {
            return Roles.userHasRole(userId, 'manager');
        },
        remove(userId, doc: UploadFS.File) {
            return Roles.userHasRole(userId, 'manager');
        }
    })
});


const ProfilePictureThumbnailStore = new UploadFS.store.GridFS({
    collection: FileCollection.collection,
    name: 'pictures-profiles-thumbnails',
    transformWrite: transformWriteThumbnail,
    filter: storeFilter,
    onFinishUpload: (file: UploadFS.File) => {
        FileCollection.update(file.originalId, {$set: {thumbnailUrl: file.url}});
    },
    permissions: new UploadFS.StorePermissions({
        insert(userId, doc: UploadFS.File) {
            return !!userId;
        },
        update(userId, doc: UploadFS.File) {
            return userId === doc.userId || Roles.userHasRole(userId, 'admin');
        },
        remove(userId, doc: UploadFS.File) {
            return userId === doc.userId || Roles.userHasRole(userId, 'admin');
        }
    })
});

const ProfilePictureStore = new UploadFS.store.GridFS({
    collection: FileCollection.collection,
    name: 'pictures-profiles',
    transformWrite: transformWrite,
    filter: storeFilter,
    copyTo: [ProfilePictureThumbnailStore],
    onFinishUpload: function(file: UploadFS.File) {
        let user = UserCollection.findOne(file.userId);
        if (!user) {
            throw new Meteor.Error("No user as uploader");
        }
        if (user.picture) {
            //ProfilePictureStore.delete(user.picture);
            FileCollection.remove(user.picture);
        }
        UserCollection.update(file.userId, {$set: {picture: file._id}});
    },
    permissions: new UploadFS.StorePermissions({
        insert(userId, doc: UploadFS.File) {
            return !!userId;
        },
        update(userId, doc: UploadFS.File) {
            return userId === doc.userId || Roles.userHasRole(userId, 'admin');
        },
        remove(userId, doc: UploadFS.File) {
            return userId === doc.userId || Roles.userHasRole(userId, 'admin');
        }
    })
});