import SimpleSchema from 'simpl-schema';
import {FileSchema} from "./file.model";
import {UploadFS} from "meteor/jalik:ufs";

export const PictureSchema = new SimpleSchema({
    thumbnailUrl: { type: String, optional: true },
    thumbnailId: { type: String, optional: true },
    thumbnailStore: { type: String, optional: true },
});
PictureSchema.extend(FileSchema);

export interface Picture extends UploadFS.File {
    thumbnailUrl?: string;
    thumbnailId?: string;
    thumbnailStore?: string;
}