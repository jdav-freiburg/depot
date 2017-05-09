import {ErrorHandler, NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {AppComponent} from "./app.component";
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {LoginPage} from "./pages/login/login";
import {RouterModule, Routes} from '@angular/router';
import {SignupPage} from "./pages/signup/signup";
import {UserService} from "./user.service";
import {ItemsPage} from "./pages/items/items";
import {ItemsDataService} from "./services/items-data";
import {IonicApp, IonicModule, IonicErrorHandler} from 'ionic-angular';
import {METEOR_PROVIDERS} from "angular2-meteor";
import {TabsPage} from "./pages/tabs/tabs";
import {HomePage} from "./pages/home/home";
import {TabsNouserPage} from "./pages/tabs-nouser/tabs-nouser";
import {ItemsFilterPipe} from "./pages/items/items-filter.pipe";
import {ReservationsFilterPipe} from "./pages/reservations/reservations-filter.pipe";
import {ReservationsPage} from "./pages/reservations/reservations";
import {ReservationsDataService} from "./services/reservations-data";
import {ReservationPage} from "./pages/reservation/reservation";

/*const appRoutes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
];*/

@NgModule({
    // Components, Pipes, Directive
    declarations: [
        AppComponent,
        TabsPage,
        TabsNouserPage,
        HomePage,
        ItemsPage,
        LoginPage,
        SignupPage,
        ReservationsPage,
        ReservationPage,
        ItemsFilterPipe,
        ReservationsFilterPipe
    ],
    // Entry Components
    entryComponents: [
        AppComponent,
        TabsPage,
        TabsNouserPage,
        HomePage,
        ItemsPage,
        LoginPage,
        SignupPage,
        ReservationsPage,
        ReservationPage,
    ],
    // Providers
    providers: [
        METEOR_PROVIDERS,
        { provide: ErrorHandler, useClass: IonicErrorHandler },
        UserService,
        ItemsDataService,
        ReservationsDataService
    ],
    // Modules
    imports: [
        IonicModule.forRoot(AppComponent),
        BrowserModule,
        //RouterModule.forRoot(appRoutes),
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule
    ],
    // Main Component
    bootstrap: [ IonicApp ]
})
export class AppModule {
    constructor() {
    }
}
