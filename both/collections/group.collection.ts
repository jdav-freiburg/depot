import { MongoObservable } from "meteor-rxjs";
import {Group} from "../models/group.model";

export const GroupCollection = new MongoObservable.Collection<Group>("groups");
