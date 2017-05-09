import { MongoObservable } from "meteor-rxjs";
import { User } from "../models/user.model";

export const UserCollection = MongoObservable.fromExisting<User>(Meteor.users);
