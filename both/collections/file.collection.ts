import { MongoObservable } from "meteor-rxjs";
import { UploadFS } from "meteor/jalik:ufs";

export const FileCollection = new MongoObservable.Collection<UploadFS.File>("file");
