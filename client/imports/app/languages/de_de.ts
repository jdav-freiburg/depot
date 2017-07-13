import * as _ from 'lodash';
import * as moment from 'moment';
import 'moment/locale/de';

export const de_de = {
  "TITLE_LONG": "Deutsch",
  "TITLE_SHORT": "de-de",
  "HOME_PAGE": {
    "TITLE": "Meine Übersicht",
    "NEW_USER": {
      "HEADER": "Neuer Benutzer registriert",
      "HELP": "Ein neuer Benutzer hat sich angemeldet. Wenn du den Benutzer authentisieren kannst, schalte ihn frei damit er sich anmelden kann. Hinweis: Du wirst als Authentisierer gespeichert.",
      "USER": "Benutzer",
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
    },
    "DELETE": {
      "TITLE": "Löschen?",
      "SUB_TITLE": "Globale Nachricht wirklich löschen?",
      "YES": "Ja",
      "NO": "Nein"
    }
  },
  "LOGIN_PAGE": {
    "TITLE": "Login",
    "EMAIL_OR_USERNAME": "E-Mail oder Benutzername",
    "PASSWORD": "Passwort",
    "LOG_IN": "Log In",
    "FORGOT_PASSWORD": "Passwort Vergessen",
    "RESEND_EMAIL": "Verifizierungs E-Mail Erneut Senden",
    "PASSWORD_RESET_REQUEST": {
      "TITLE": "Passwort Reset Anfordern",
      "MESSAGE": "Soll ein Passwort Reset Link per E-Mail versendet werden?",
      "EMAIL_OR_USERNAME": "E-Mail oder Benutzername",
      "OK": "Ok",
      "CANCEL": "Abbruch"
    },
    "PASSWORD_RESET_SUCCESS": {
      "TITLE": "Passwort Reset Angefordert",
      "MESSAGE": "Passwort Reset Link wurde per E-Mail versendet",
      "OK": "Ok",
    },
    "RESEND_EMAIL_REQUEST": {
      "TITLE": "Keine verifizierte E-Mail Adresse",
      "MESSAGE": "Es existiert keine verifizierte E-Mail Adresse. Soll die Bestätigungs E-Mail erneut angefordert werden?",
      "EMAIL_OR_USERNAME": "E-Mail oder Benutzername",
      "EMAIL": "E-Mail",
      "OK": "Ok",
      "CANCEL": "Abbruch"
    },
    "RESEND_EMAIL_SUCCESS": {
      "TITLE": "E-Mail Versendet",
      "MESSAGE": "E-Mail versendet",
      "OK": "Ok"
    },
  },
  "ITEM_CARDS_PAGE": {
    "TITLE": "Material",
    "FILTER": "Filtern"
  },
  "ITEM_LIST_PAGE": {
    "TITLE": "Material",
    "FILTER": "Filtern"
  },
  "ITEMS_IMPORTER_PAGE": {
    "TITLE": "Material importieren",
    "FILE": "Datei auswählen...",
    "FILTER": "Filtern",
    "EXTERNAL_ID": "Externe ID",
    "NAME": "Name",
    "DESCRIPTION": "Beschreibung",
    "PURCHASE_DATE": "Kaufdatum",
    "LAST_SERVICE": "Letzte Wartung",
    "CONDITION": "Zustand",
    "CONDITION_COMMENT": "Zustandskommentar",
    "STATUS": "Status",
    "ITEM_GROUP": "Gruppe",
    "TAGS": "Tags"
  },
  "ITEM_CARD": {
    "EXTERNAL_ID": "Externe ID",
    "NAME": "Name",
    "DESCRIPTION": "Beschreibung",
    "PURCHASE_DATE": "Kaufdatum",
    "LAST_SERVICE": "Letzte Wartung",
    "CONDITION": "Zustand",
    "CONDITION_COMMENT": "Zustandskommentar",
    "STATUS": "Status",
    "ITEM_GROUP": "Gruppe",
    "TAGS": "Tags",
    "PICTURE": "Bild",
    "SAVE": {
      "TITLE": "Speichern",
      "SUBTITLE": "Eintrag Speichern",
      "COMMENT_LABEL": "Änderungskommentar",
      "SAVE": "Speichern",
      "CANCEL": "Abbrechen",
      "SUCCESS": "Alles gespeichert"
    },
    "DELETE": {
      "TITLE": (item) => `${item.name} Löschen?`,
      "SUBTITLE": (item) => `${item.name} Löschen?`,
      "YES": "Löschen",
      "NO": "Abbrechen",
      "SUCCESS": "Material gelöscht"
    },
    "CHANGE": {
      "TITLE": "Fremde Änderungen",
      "MESSAGE": (otherItem) => `Es liegen Änderungen aus anderer Quelle vor. Sollen diese Änderungen übernommen werden?`,
      "ACCEPT": "Überschreiben",
      "CANCEL": "Behalten"
    }
  },
  "RESERVATION_PAGE": {
    "TITLE": (data) => `Reservierung - ${data.name}`,
    "TYPE": "Art der Ausfahrt",
    "NAME": "Name",
    "START": "Start",
    "END": "Ende",
    "CONTACT": "Kontakt",
    "ITEMS": "Material",
    "NOT_AVAILABLE": "Nicht verfügbar",
    "ITEM_CONDITION_BAD": "Schlecht",
    "ITEM_CONDITION_BROKEN": "Kaputt",
    "SOME_NOT_AVAILABLE": (data) => `${data.total - data.available}/${data.total} nicht verfügbar`,
    "SOME_REMOVED": (data) => `${data.total}/${data.selected + data.total} entfernt`,
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
    "SIGN_UP": "Anmelden",
    "SUCCESS": {
      "TITLE": "Erfolgreich registriert",
      "MESSAGE": "Du hast dich erfolgreich registriert. In den nächsten Minuten wirst du eine Verifizierungs E-Mail erhalten. Du kannst dich anmelden sobald du von einem anderen Benutzer bestätigt wurdest."
    },
    "ERROR": {
      "PASSWORD_MINLENGTH": "Passwort muss mindestens 6 Zeichen lang sein",
      "PASSWORD_MATCH": "Passwörter stimmen nicht überein",
    }
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
    "STATUS": "Status",
    "ERROR": {
      "PASSWORD_MINLENGTH": "Passwort muss mindestens 6 Zeichen lang sein",
      "PASSWORD_MATCH": "Passwörter stimmen nicht überein",
    }
  },
  "RESERVATION_CARD": {
    "HEADER": "Reservierung",
    "ITEMS": "Material",
    "DESCRIPTION": (reservation) => `${reservation.type.text}. Vom ${moment(reservation.start).format('L')} bis ${moment(reservation.end).format('L')}.`,
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
    }
  },
  "CALENDAR_ITEMS_PAGE": {
    "FILTER": "Filter",
    "TITLE": "Kalenderansicht"
  },
  "VERIFY_EMAIL_PAGE": {
    "TITLE": "E-Mail Verifizieren",
    "VERIFY": "E-Mail Verifizieren",
    "SUCCESS": {
      "TITLE": "E-Mail verifiziert",
      "MESSAGE": "E-Mail erfolgreich verifiziert",
      "OK": "Ok"
    }
  },
  "RESET_PASSWORD_PAGE": {
    "TITLE": "Passwort ändern",
    "PASSWORD": "Neues Passwort",
    "PASSWORD_REPEAT": "Neues Passwort wiederholen",
    "SAVE": "Passwort speichern",
    "SUCCESS": {
      "TITLE": "Passwort geändert",
      "MESSAGE": "Passwort erfolgreich geändert",
      "OK": "Ok"
    },
    "ERROR": {
      "PASSWORD_MINLENGTH": "Passwort muss mindestens 6 Zeichen lang sein",
      "PASSWORD_MATCH": "Passwörter stimmen nicht überein",
    }
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
    "IMPORT_ITEMS": "Material Importieren",
    "ITEMS_LIST": "Materialien",
    "ITEMS_CALENDAR": "Kalenderansicht"
  },
  "TABS": {
    "HOME": "Meine Übersicht",
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
      "GOOD": "Gut",
      "BAD": "Schlecht",
      "BROKEN": "Kaputt"
    },
    "FILTER_TAG": {
      "NAME": "name",
      "DESCRIPTION": "beschreibung\0description",
      "TAG": "tag",
      "EXTERNAL_ID": "id",
      "SELECTED": "wahl\0gewählt\0selektiert\0selected\0reserviert"
    }
  },
  "ITEM_STATE": {
    "TEXT": (data) => (data.comment?data.comment + "<br>\n":"") + (_.join(data.texts, ", <br>\n") || ""),
    "LAST_SERVICE": (data) => `Wartung am ${moment(data.lastService).format('L')}`,
    "CONDITION_CONDITION_COMMENT": (data) => `Zustand: ${data.conditionOption.text} (${data.conditionComment})`,
    "CONDITION": (data) => `Zustand: ${data.conditionOption.text}`,
    "CONDITION_COMMENT": (data) => `Zustandskommentar: ${data.conditionComment}`,
    "NAME": (data) => `Neuer Name: ${data.name}`,
    "DESCRIPTION": (data) => `Neue Beschreibung: ${data.description}`,
    "EXTERNAL_ID": (data) => `Neue Externe Id: ${data.externalId}`,
    "TAGS": (data) => `Neue Tags: ${_.join(data.tags, ', ')}`,
    "PICTURE": (data) => `Neues Bild`,
    "STATUS": (data) => `Neuer Status: ${data.statusOption.text}`,
    "RESERVATION_NAME": (data) => `Reservierung ${data.user?data.user.fullName:""} - ${data.type.text} - ${data.reservation.name}`
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
    "GENERAL": (message) => `${message.reason}`,
    "Incorrect password": "Ungültiges Passwort",
    "User not found": "Benutzer nicht gefunden",
    "Username already exists.": "Benutzername bereits vergeben",
    "Email already exists.": "Email bereits registriert",
    "user-locked": "Du musst erst von einem anderen Benutzer aktiviert werden",
    "user-disabled": "Du wurdest deaktiviert",
    "user-email-not-verified": "E-Mail Adresse muss erst verifiziert werden",
    "invalid-token": "Ungültiges Token oder Token abgelaufen",
    "no-valid-email": "Keine verifiziert E-Mail Adress gefunden"
  }
};