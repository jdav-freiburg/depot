import {ErrorHandler, NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {AppComponent} from "./app.component";
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {LoginPage} from "./pages/login/login";
import {RouterModule, Routes} from '@angular/router';
import {SignupPage} from "./pages/signup/signup";
import {UserService} from "./services/user";
import {ItemCardsPage} from "./pages/item-cards/item-cards";
import {ItemsDataService} from "./services/items-data";
import {IonicApp, IonicModule, IonicErrorHandler} from 'ionic-angular';
import {METEOR_PROVIDERS} from "angular2-meteor";
import {TabsPage} from "./pages/tabs/tabs";
import {HomePage} from "./pages/home/home";
import {TabsNouserPage} from "./pages/tabs-nouser/tabs-nouser";
import {ItemsFilterPipe} from "./pipes/items-filter";
import {ReservationsFilterPipe} from "./pipes/reservations-filter";
import {ReservationsPage} from "./pages/reservations/reservations";
import {ReservationsDataService} from "./services/reservations-data";
import {ReservationPage} from "./pages/reservation/reservation";
import {UserComponent} from "./components/user/user";
import { CalendarModule } from 'angular-calendar';
import {DatePickerModal} from "./pages/date-picker-modal/date-picker-modal";
import {ReservationDatePickerComponent} from "./components/reservation-date-picker/reservation-date-picker";
import {ItemStateModal} from "./pages/item-state-modal/item-state-modal";
import {UserModal} from "./pages/user-modal/user-modal";
import {UsersFilterPipe} from "./pipes/users-filter";
import {UsersPage} from "./pages/users/users";
import {ItemDatePickerComponent} from "./components/item-date-picker/item-date-picker";
import {DebugService} from "./services/debug";
import {JoinPipe} from "./pipes/join";
import {TranslateService} from "./services/translate";
import {TranslatePipe} from "./pipes/translate";
import {MomentPipe} from "./pipes/moment";
import {TranslateHelperService} from "./services/translate-helper";
import {AdvancedEmailValidatorDirective} from "./services/advanced-email-validator";
import {GlobalMessagesDataService} from "./services/global-messages-data";
import {MarkdownModule} from "angular2-markdown";
import {ReservationCardComponent} from "./components/reservation-card/reservation-card";
import {ItemsImporterPage} from "./pages/items-importer/items-importer";
import {FileDropModule} from "angular2-file-drop";
import {UploadButton} from "./components/upload-button/upload-button";
import {ItemCardComponent} from "./components/item-card/item-card";
import {ItemListPage} from "./pages/items-list/item-list";

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
        ItemCardsPage,
        LoginPage,
        SignupPage,
        ReservationsPage,
        ReservationPage,
        DatePickerModal,
        ItemsFilterPipe,
        ReservationsFilterPipe,
        UserComponent,
        ReservationDatePickerComponent,
        ItemStateModal,
        ItemDatePickerComponent,
        UserModal,
        UsersFilterPipe,
        UsersPage,
        JoinPipe,
        TranslatePipe,
        MomentPipe,
        AdvancedEmailValidatorDirective,
        ReservationCardComponent,
        ItemsImporterPage,
        UploadButton,
        ItemCardComponent,
        ItemListPage
    ],
    // Entry Components
    entryComponents: [
        AppComponent,
        TabsPage,
        TabsNouserPage,
        HomePage,
        ItemCardsPage,
        ItemListPage,
        LoginPage,
        SignupPage,
        ReservationsPage,
        ReservationPage,
        DatePickerModal,
        ReservationDatePickerComponent,
        ItemStateModal,
        UserModal,
        UsersPage,
        ItemsImporterPage
    ],
    // Providers
    providers: [
        METEOR_PROVIDERS,
        { provide: ErrorHandler, useClass: IonicErrorHandler },
        UserService,
        ItemsDataService,
        ReservationsDataService,
        DebugService,
        TranslateService,
        TranslateHelperService,
        GlobalMessagesDataService
    ],
    // Modules
    imports: [
        IonicModule.forRoot(AppComponent),
        BrowserModule,
        //RouterModule.forRoot(appRoutes),
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        CalendarModule.forRoot(),
        MarkdownModule.forRoot(),
        FileDropModule
    ],
    // Main Component
    bootstrap: [ IonicApp ]
})
export class AppModule {
    constructor() {
    }
}
