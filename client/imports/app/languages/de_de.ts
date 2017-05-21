import * as _ from 'lodash';
import * as moment from 'moment';
import 'moment/locale/de';

export const de_de = {
  "TITLE_LONG": "Deutsch",
  "TITLE_SHORT": "de-de",
  "HOME_PAGE": {
    "TITLE": "Home",
    "NEW_USER": {
      "HEADER": "Neuer Benutzer registriert",
      "HELP": "Ein neuer Benutzer hat sich angemeldet. Wenn du den Benutzer authentisieren kannst, schalte ihn frei damit er sich anmelden kann. Hinweis: Du wirst als Authentisierer gespeichert.",
      "USERNAME": "Benutzername",
      "EMAIL": "E-Mail",
      "PHONE": "Telefon",
      "UNLOCK": "Freischalten"
    },
    "MESSAGE": {
      "NEW_USER": {
        "AUTHENTICATOR": "Authentisierer",
        "USER": "Neuer Benutzer",
        "TITLE": "Neuer Benutzer"
      },
      "MESSAGE": {
        "NEW_TITLE": "Neue Globale Nachricht",
        "TITLE": "Globale Nachricht"
      }
    }
  },
  "LOGIN_PAGE": {
    "TITLE": "Login",
    "EMAIL_OR_USERNAME": "E-Mail oder Benutzername",
    "PASSWORD": "Passwort",
    "LOG_IN": "Log In"
  },
  "ITEMS_PAGE": {
    "EXTERNAL_ID": "Externe ID",
    "NAME": "Name",
    "DESCRIPTION": "Beschreibung",
    "PURCHASE_DATE": "Kaufdatum",
    "LAST_SERVICE": "Letzte Wartung",
    "CONDITION": "Zustand",
    "CONDITION_COMMENT": "Zustandskommentar",
    "STATUS": "Status",
    "TAGS": "Tags",
    "FILTER": "Filtern"
  },
  "ITEMS_IMPORTER_PAGE": {
    "TITLE": "Material importieren",
    "FILE": "Datei auswählen..."
  },
  "RESERVATION_PAGE": {
    "TITLE": (data) => `Reservierung - ${data.name}`,
    "TYPE": "Typ",
    "NAME": "Name",
    "START": "Start",
    "END": "Ende",
    "CONTACT": "Kontakt",
    "ITEMS": "Material",
    "NOT_AVAILABLE": "Nicht verfügbar",
    "REMOVED": "Entfernt",
    "ITEMS_REMOVED": (data) => `${_.join(data.items, ', ')} aus der Reservierung entfernt (bereits reserviert).`,
    "LEAVE": {
      "TITLE": "Ungespeicherte Änderungen",
      "SUB_TITLE": "Sollen ungespeicherte Änderungen gespeichert werden?",
      "CANCEL": "Zurück",
      "LEAVE": "Verlassen",
      "SAVE": "Speichern"
    },
    "FILTER": "Filtern",
    "SAVED": (reservation) => `Reservierung ${reservation.name} gespeichert`
  },
  "RESERVATIONS_PAGE": {
    "TITLE": "Reservierungen",
    "TYPE": "Typ",
    "NAME": "Name",
    "START": "Start",
    "END": "Ende",
    "USER": "Benutzer",
    "GROUP": "Gruppe",
    "CONTACT": "Kontakt",
    "DELETE": {
      "TITLE": (data) => `Lösche ${data.name}?`,
      "SUB_TITLE": (data) => `Reservierung ${data.name} wirklich löschen?`,
      "YES": "Ja",
      "NO": "Nein"
    },
    "FILTER": "Filtern"
  },
  "SIGNUP_PAGE": {
    "TITLE": "Anmelden",
    "USERNAME": "Benutzername",
    "EMAIL": "E-Mail",
    "PASSWORD": "Passwort",
    "PASSWORD_REPEAT": "Passwort Wiederholen",
    "FULL_NAME": "Vollständiger Name",
    "PHONE": "Telefon",
    "SIGN_UP": "Anmelden"
  },
  "USERS_PAGE": {
    "TITLE": "Benutzer",
    "USERNAME": "Benutzername",
    "EMAIL": "E-Mail",
    "FULL_NAME": "Vollständiger Name",
    "PHONE": "Telefon",
    "STATUS": "Status",
    "ROLES": "Rollen",
    "FILTER": "Filtern"
  },
  "USER_MODAL": {
    "TITLE": (data) => `${data.name}`,
    "ID": "Id",
    "USERNAME": "Benutzername",
    "PERSONAL": "Persönlich",
    "FULL_NAME": "Vollständiger Name",
    "PHONE": "Telefon",
    "PICTURE": "Bild",
    "EMAIL": "E-Mail",
    "EMAIL_ADD": "E-Mail Hinzufügen",
    "PASSWORD": "Passwort",
    "PASSWORD_OLD": "Aktuelles Passwort",
    "PASSWORD_NEW": "Neues Passwort",
    "PASSWORD_NEW_REPEAT": "Neues Passwort Wiederholen",
    "PASSWORD_RANDOM": "Zufälliges Passwort",
    "ROLES": "Rollen",
    "STATUS": "Status"
  },
  "RESERVATION_CARD": {
    "HEADER": "Reservierung",
    "ITEMS": "Material",
    "DESCRIPTION": (reservation) => `${reservation.type.text}. Vom ${moment(reservation.start).format('L')} bis ${moment(reservation.end).format('L')}.`
  },
  "LANGUAGE_SELECT": {
    "TITLE": "Sprache",
    "OK": "Ok",
    "CANCEL": "Abbruch"
  },
  "SIDEMENU": {
    "USERS": "Benutzer",
    "LOGOUT": "Abmelden",
    "LANGUAGE": "Sprache",
    "IMPORT_ITEMS": "Material Importieren"
  },
  "TABS": {
    "HOME": "Home",
    "ITEMS": "Material",
    "RESERVATIONS": "Reservierungen",
    "LOGIN": "Login",
    "SIGNUP": "Anmelden"
  },
  "RESERVATION": {
    "TYPE": {
      "GROUP": "Gruppe",
      "PRIVATE": "Privat"
    }
  },
  "ITEM": {
    "STATUS": {
      "PUBLIC": "Öffentlich",
      "HIDDEN": "Versteckt"
    },
    "CONDITION": {
      "100": "Ok",
      "50": "Beschädigt",
      "0": "Kaputt"
    }
  },
  "ITEM_STATE": {
    "TEXT": (data) => (data.comment?data.comment + "<br>\n":"") + _.join(data.texts, ", <br>\n"),
    "LAST_SERVICE": (data) => `Wartung am ${moment(data.lastService).format('L')}`,
    "CONDITION_CONDITION_COMMENT": (data) => `Zustand: ${data.conditionOption.text} (${data.conditionComment})`,
    "CONDITION": (data) => `Zustand: ${data.conditionOption.text}`,
    "CONDITION_COMMENT": (data) => `Zustandskommentar: ${data.conditionComment}`,
    "NAME": (data) => `Neuer Name: ${data.name}`,
    "DESCRIPTION": (data) => `Neue Beschreibung: ${data.description}`,
    "EXTERNAL_ID": (data) => `Neue Externe Id: ${data.externalId}`,
    "TAGS": (data) => `Neue Tags: ${_.join(data.tags, ', ')}`,
    "STATUS": (data) => `Neuer Status: ${data.statusOption.text}`
  },
  "USER": {
    "STATUS": {
      "NORMAL": "Normal",
      "LOCKED": "Gesperrt",
      "DISABLED": "Deaktiviert",
      "DELETED": "Gelöscht"
    },
    "ROLES": {
      "ADMIN": "Administrator",
      "MANAGER": "Materialwart"
    }
  },
  "ERROR": {
    "GENERAL": "{{message}}",
    "Incorrect password": "Ungültiges Passwort",
    "User not found": "Benutzer nicht gefunden",
    "Username already exists.": "Benutzername bereits vergeben",
    "Email already exists.": "Email bereits registriert",
    "user-locked": "Du musst erst von einem anderen Benutzer aktiviert werden",
    "user-disabled": "Du wurdest deaktiviert",
    "user-email-not-verified": "E-Mail Adresse muss erst verifiziert werden",
  }
};