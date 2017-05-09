import { MongoObservable } from "meteor-rxjs";
import {Reservation} from "../models/reservation.model";

export const ReservationCollection = new MongoObservable.Collection<Reservation>("reservations");
