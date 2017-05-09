import {ErrorHandler, NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {AppComponent} from "./app.component";
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {LoginComponent} from "./login/login.component";
import {RouterModule, Routes} from '@angular/router';
import {SignupComponent} from "./signup/signup.component";
import {UserService} from "./user.service";
import {ItemsComponent} from "./items/items.component";
import {ItemsDataService} from "./items/items-data.service";
import {IonicApp, IonicModule, IonicErrorHandler} from 'ionic-angular';
import {METEOR_PROVIDERS} from "angular2-meteor";

/*const appRoutes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
];*/

@NgModule({
    // Components, Pipes, Directive
    declarations: [
        AppComponent,
        ItemsComponent,
        LoginComponent,
        SignupComponent
    ],
    // Entry Components
    entryComponents: [
        ItemsComponent,
        LoginComponent,
        SignupComponent
    ],
    // Providers
    providers: [
        METEOR_PROVIDERS,
        { provide: ErrorHandler, useClass: IonicErrorHandler },
        UserService,
        ItemsDataService
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
