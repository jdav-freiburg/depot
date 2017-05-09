import {ApplicationRef, NgModule} from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { AccountsModule } from "angular2-meteor-accounts-ui";
import { AppComponent } from "./app.component";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MdInputModule, MdButtonModule, MdCheckboxModule, MdCardModule, MdSidenavModule } from '@angular/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {LoginComponent} from "./login/login.component";
import { RouterModule, Routes } from '@angular/router';
import {SignupComponent} from "./signup/signup.component";
import {UserService} from "./user.service";
import {MaterialChipsModule} from 'angular2-material-chips';
import {ItemsComponent} from "./items/items.component";
import {ItemsDataService} from "./items/items-data.service";

const appRoutes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
];

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
        AppComponent
    ],
    // Providers
    providers: [
        UserService,
        ItemsDataService
    ],
    // Modules
    imports: [
        BrowserModule,
        RouterModule.forRoot(appRoutes),
        AccountsModule,
        BrowserAnimationsModule,
        MdInputModule,
        MdButtonModule,
        MdCheckboxModule,
        MdCardModule,
        MdSidenavModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialChipsModule
    ],
    // Main Component
    bootstrap: [ AppComponent ]
})
export class AppModule {
    constructor() {
    }
}
