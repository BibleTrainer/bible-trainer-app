import { Component, NgZone } from '@angular/core';
import { NavController, NavParams, Events, ActionSheetController, ToastController, AlertController } from 'ionic-angular';
import { Storage } from "@ionic/storage";
import { AddPassagePage } from "../add-passage/add-passage";
import { RecitePassagePage } from "../recite-passage/recite-passage";
import { SuggestionsPage } from "../suggestions/suggestions";
import moment from 'moment';

@Component({
  selector: 'page-bible',
  templateUrl: 'bible.html'
})

export class BiblePage {
  screenTitle = "BibleTrainer";
  deadline;
  warning;
  passages = [];
  folders = [];
  folder;
  passagesInFolder = [];
  bookOrder = new Map([
    [ "Genesis", 1 ],
    [ "Exodus", 2 ],
    [ "Leviticus", 3 ],
    [ "Numbers", 4 ],
    [ "Deuteronomy", 5 ],
    [ "Joshua", 6 ],
    [ "Judges", 7 ],
    [ "Ruth", 8 ],
    [ "1 Samuel", 9 ],
    [ "2 Samuel", 10 ],
    [ "1 Kings", 11 ],
    [ "2 Kings", 12 ],
    [ "1 Chronicles", 13 ],
    [ "2 Chronicles", 14 ],
    [ "Ezra", 15 ],
    [ "Nehemiah", 16 ],
    [ "Esther", 17 ],
    [ "Job", 18 ],
    [ "Psalm", 19 ],
    [ "Proverbs", 20 ],
    [ "Ecclesiastes", 21 ],
    [ "Song of Songs", 22 ],
    [ "Isaiah", 23 ],
    [ "Jeremiah", 24 ],
    [ "Lamentations", 25 ],
    [ "Ezekiel", 26 ],
    [ "Daniel", 27 ],
    [ "Hosea", 28 ],
    [ "Joel", 29 ],
    [ "Amos", 30 ],
    [ "Obadiah", 31 ],
    [ "Jonah", 32 ],
    [ "Micah", 33 ],
    [ "Nahum", 34 ],
    [ "Habakkuk", 35 ],
    [ "Zephaniah", 36 ],
    [ "Haggai", 37 ],
    [ "Zechariah", 38 ],
    [ "Malachi", 39 ],
    [ "Matthew", 40 ],
    [ "Mark", 41 ],
    [ "Luke", 42 ],
    [ "John", 43 ],
    [ "Acts", 44 ],
    [ "Romans", 45 ],
    [ "1 Corinthians", 46 ],
    [ "2 Corinthians", 47 ],
    [ "Galatians", 48 ],
    [ "Ephesians", 49 ],
    [ "Philippians", 50 ],
    [ "Colossians", 51 ],
    [ "1 Thessalonians", 52 ],
    [ "2 Thessalonians", 53 ],
    [ "1 Timothy", 54 ],
    [ "2 Timothy", 55 ],
    [ "Titus", 56 ],
    [ "Philemon", 57 ],
    [ "Hebrews", 58 ],
    [ "James", 59 ],
    [ "1 Peter", 60 ],
    [ "2 Peter", 61 ],
    [ "1 John", 62 ],
    [ "2 John", 63 ],
    [ "3 John", 64 ],
    [ "Jude", 65 ],
    [ "Revelation", 66 ]
  ]);

  constructor(public navCtrl: NavController,
              private storage: Storage,
              public events: Events,
              private zone: NgZone,
              private actionSheetCtrl: ActionSheetController,
              public navParams: NavParams,
              private toastCtrl: ToastController,
              public alertCtrl: AlertController) {
    const self = this;
    this.folder = this.navParams.data.folder;
    if (!this.folder) {
      this.folder = "Top Level Folder";

      // Only subscribe on the top level, which stops the event being processed by multiple screens
      this.events.subscribe('passageRead', (args) => {
        this.zone.run(() => {
          self.markPassageAsRead(args);
        });
      });
    }
    else {
      this.screenTitle = this.folder;
    }

    this.events.subscribe('passagesChanged', () => {
      this.zone.run(() => {
        self.load();
      });
    });

    this.load();
  }

  private load() {
    this.storage.get("deadline").then((days) => {
      var milliseconds = parseInt(days) * 24 * 60 * 60 * 1000;
      this.deadline = parseInt(moment().format("x")) - milliseconds;
      this.warning = this.deadline + 86400000; // 1-day warning

      this.storage.get(this.folder).then((passageList) => {
        if (passageList == null) {
          passageList = [];
        }

        this.storage.get("sortByDate").then((sortByDate) => {
          if (sortByDate) {
            passageList.sort(this.compareDates.bind(this));
          }
          else {
            passageList.sort(this.compareReferences.bind(this));
          }
          this.passagesInFolder = passageList;

          if (this.folder === "Top Level Folder") {
            this.storage.get("folders").then((folders) => {
              if (folders == null) {
                folders = [];
              }

              if (sortByDate) {
                folders.sort(this.compareDates.bind(this));
              }
              else {
                folders.sort(this.compareNames.bind(this));
              }

              this.folders = folders;
              this.passages = this.folders.concat(this.passagesInFolder);

              if (this.passages.length == 0) {
                this.navCtrl.push(SuggestionsPage).then(() => {
                  let alert = this.alertCtrl.create();
                  alert.setTitle('Hello!');
                  alert.setMessage(
                    'Welcome to the BibleTrainer app! This screen has some suggestions of passages you may want to memorise - sorted by topic. If you have specific passages in mind, press the back button, and then the "+" at the bottom left to choose a new passage.' +
                    '<br/><br/>My prayer is that God would use this app to plant his word in your heart.');
                  alert.addButton('Ok');
                  alert.present();
                });
              }
            });
          }
          else {
            this.folders = [];
            this.passages = this.passagesInFolder;
          }
        });
      });
    });
  }

  formatDate(datestamp, format = 'DD/MM/YYYY') {
    return moment(datestamp, "MM/DD/YYYY").format(format);
  }

  overdue(timestamp) {
    if (timestamp < this.deadline) return 'verse verse--danger';
    if (timestamp < this.warning) return 'verse verse--warning';
    return 'verse verse--normal';
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad BiblePage');
  }

  addPassage() {
    this.navCtrl.push('AddPassagePage', { folder : this.folder });
  }

  selectPassage = (passage) => {
    var index = this.passagesInFolder.indexOf(passage);
    if (index > -1) {
      this.navCtrl.push(RecitePassagePage, { folder : this.folder, passagesInFolder : this.passagesInFolder, index : index });
      return;
    }

    // Open folder
    this.navCtrl.push(BiblePage, { folder: passage.reference });
  }

  deleteFolder = (passage) => {
    var index = this.folders.indexOf(passage);
    if (index > -1) {
      this.storage.get(passage.reference).then((passagesInSelectedFolder) => {
        if (passagesInSelectedFolder != null) {
          passagesInSelectedFolder.forEach((item) => {
            this.storage.remove(item.reference).then(() => {
              console.log("removed " + item.reference);
            })
          });
        }
      });
      this.storage.remove(passage.reference);
      this.folders.splice(index, 1);
      this.storage.set("folders", this.folders);
      this.passages = this.folders.concat(this.passagesInFolder); //update view
    }
  };

  pressPassage = (passage) => {
    var index = this.passagesInFolder.indexOf(passage);
    if (index > -1) {
      const actionSheet = this.actionSheetCtrl.create({
        title: 'Passage Options: ' + passage.reference,
        buttons: [
          {
            text: 'Delete',
            role: 'destructive',
            icon: 'trash',
            handler: () => {
              this.storage.remove(passage.reference);
              this.passagesInFolder.splice(index, 1);
              this.storage.set(this.folder, this.passagesInFolder);
              this.passages = this.folders.concat(this.passagesInFolder); //update view
              this.checkFolderLastRead({ folder : this.folder, passagesInFolder : this.passagesInFolder, indexInFolder : 0 });
            }
          },
          {
            text: 'Move to folder',
            icon: 'folder',
            handler: () => {
              // get dest folder
              this.storage.get("folders").then((folders) => {
                if (folders == null || folders.length == 0) {
                  let toast = this.toastCtrl.create({
                    message: 'First, create a folder through the menu (top left of screen)',
                    duration: 2000,
                    position: 'bottom'
                  });
                  toast.present();
                  return;
                }

                let alert = this.alertCtrl.create();
                alert.setTitle('Which folder should this passage be moved to?');
                if (this.folder !== "Top Level Folder") {
                  alert.addInput({
                    type: 'radio',
                    label: 'Top Level Folder',
                    value: 'Top Level Folder',
                    checked: true
                  });
                }
                folders.forEach((item) => {
                  if (this.folder !== item.reference) {
                    alert.addInput({
                      type: 'radio',
                      label: item.reference,
                      value: item.reference,
                      checked: false
                    });
                  }
                });
                alert.addButton('Cancel');
                alert.addButton({
                  text: 'Ok',
                  handler: (destinationFolder: any) => {
                    if (!destinationFolder) return;

                    // add to dest folder
                    this.storage.get(destinationFolder).then((folder) => {
                      if (folder == null) {
                        folder = [];
                      }

                      folder.push(passage);
                      this.storage.set(destinationFolder, folder).then( () => {
                        if (destinationFolder === "Top Level Folder") {
                          this.events.publish('passagesChanged'); //update view for Top Level Folder
                        }
                        else {
                          this.checkFolderLastRead({ folder : destinationFolder, passagesInFolder : folder, indexInFolder : 0 });
                        }
                      });
                    });

                    // remove from src (current) folder
                    this.passagesInFolder.splice(index, 1);
                    this.storage.set(this.folder, this.passagesInFolder);
                    this.passages = this.folders.concat(this.passagesInFolder); //update view
                    this.checkFolderLastRead({ folder : this.folder, passagesInFolder : this.passagesInFolder, indexInFolder : 0 });
                  }
                });
                alert.present();
              });
            }
          },
          {
            text: 'Mark as read',
            icon: 'checkmark',
            handler: () => {
              this.markPassageAsRead({ folder : this.folder, passagesInFolder : this.passagesInFolder, indexInFolder : index });
            }
          },{
            text: 'Cancel',
            role: 'cancel',
            icon: 'close'
          }
        ]
      });
      actionSheet.present();
      return;
    }

    const actionSheet = this.actionSheetCtrl.create({
      title: 'Folder Options: ' + passage.reference,
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            let alert = this.alertCtrl.create({
              title: `Delete folder: ${passage.reference}`,
              message: `Are you sure you want to delete the folder ${passage.reference}? All the passages contained will be deleted as well`,
              buttons: [
                {
                  text: 'Cancel',
                  role: 'cancel'
                },
                {
                  text: 'Delete',
                  role: 'destructive',
                  handler: () => {
                    this.deleteFolder(passage);
                  }
                }
              ]
            });
            alert.present();
          }
        },
        {
          text: 'Mark all as read',
          icon: 'checkmark',
          handler: () => {
            this.markFolderAsRead(passage);
          }
        },{
          text: 'Rename folder',
          icon: 'create',
          handler: () => {
            this.renameFolder(passage);
          }
        },{
          text: 'Cancel',
          role: 'cancel',
          icon: 'close'
        }
      ]
    });
    actionSheet.present();
  }

  renameFolder(folderToRename) {
    let alert = this.alertCtrl.create({
      title: 'Enter new folder name',
      inputs: [
        {
          name: 'folderName',
          placeholder: ''
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Rename',
          handler: data => {
            if (data.folderName === "" || !data.folderName) {
              let toast = this.toastCtrl.create({
                message: 'Cannot accept blank folder name',
                duration: 2000,
                position: 'bottom'
              });
              toast.present();
              return;
            }

            if (data.folderName === "folders" ||
              data.folderName === "Top Level Folder" ||
              data.folderName === "replaceTheLORDwithYHWH" ||
              data.folderName === "useSansForgetica" ||
              data.folderName === "sortByDate" ||
              data.folderName === "dayStreak" ||
              data.folderName === "dateFormat" ||
              data.folderName === "notification") {
              let toast = this.toastCtrl.create({
                message: '\'' + data.folderName + '\' is reserved; please choose another name.',
                duration: 2000,
                position: 'bottom'
              });
              toast.present();
              return;
            }

            this.storage.get(data.folderName).then((doesFolderExist) => {
              if (doesFolderExist != null) {
                let toast = this.toastCtrl.create({
                  message: 'Item already exists as a folder or passage.',
                  duration: 2000,
                  position: 'bottom'
                });
                toast.present();
                return;
              }

              var index = this.folders.indexOf(folderToRename);
              if (index > -1) {
                this.folders.splice(index, 1);
                this.folders.push({ reference: data.folderName, date: folderToRename.date, timestamp: folderToRename.timestamp });
                this.storage.set("folders", this.folders);

                this.storage.get(folderToRename.reference).then((oldFolderList) => {
                  this.storage.set(data.folderName, oldFolderList);
                  this.storage.remove(folderToRename.reference);
                  this.passages = this.folders.concat(this.passagesInFolder); //update view
                });
              }
            });
          }
        }
      ]
    });
    alert.present();
  }

  markFolderAsRead(folder) {
    var date = moment().format("MM[/]DD[/]YY");
    var timestamp = moment.now();
    // only for testing        date += " " + timestamp;
    var index = this.folders.indexOf(folder);
    if (index > -1) {
      // First update all passages in the folder
      this.storage.get(folder.reference).then((passagesInSelectedFolder) => {
        if (passagesInSelectedFolder != null) {
          passagesInSelectedFolder.forEach((item) => {
            item.date = date;
            item.timestamp = timestamp;
          });
          this.storage.set(folder.reference, passagesInSelectedFolder);
        }
      });

      // Then update the folder
      this.folders[index].date = date;
      this.folders[index].timestamp = timestamp;
      this.storage.get("sortByDate").then((sortByDate) => {
        if (sortByDate) {
          this.folders.sort(this.compareDates.bind(this));
        }
        this.storage.set("folders", this.folders);
        this.passages = this.folders.concat(this.passagesInFolder); //update view
      });
    }
  }

  markPassageAsRead(args) {
    var date = moment().format("MM[/]DD[/]YY");
    args.passagesInFolder[args.indexInFolder].date = date;
    args.passagesInFolder[args.indexInFolder].timestamp = moment.now();
    // only for testing     args.passagesInFolder[args.indexInFolder].date += " " + args.passagesInFolder[args.indexInFolder].timestamp;
    this.storage.set(args.folder, args.passagesInFolder).then(() => {
      this.events.publish('passagesChanged');
    });

    this.checkFolderLastRead(args);
  }

  checkFolderLastRead(args) {
    if (args.folder === "Top Level Folder" || args.passagesInFolder.length - 1 < args.indexInFolder) return;
    var oldestTimestamp = args.passagesInFolder[args.indexInFolder].timestamp;
    var oldestDate = args.passagesInFolder[args.indexInFolder].date;
    args.passagesInFolder.forEach((passage) => {
      if (passage.timestamp < oldestTimestamp) {
        oldestTimestamp = passage.timestamp;
        oldestDate = passage.date;
      }
    });

    this.storage.get("folders").then((folders) => {
      var folderObject;
      folders.forEach((folder) => {
        if (folder.reference === args.folder) {
          folderObject = folder;
        }
      });

      if (folderObject == null) {
        let toast = this.toastCtrl.create({
          message: 'Failed to find folder: ' + args.folder,
          duration: 2000,
          position: 'bottom'
        });
        toast.present();
        return;
      }
      if (folderObject.timestamp == oldestTimestamp) return;

      var indexOfFolder = folders.indexOf(folderObject);
      if (indexOfFolder > -1) {
        folders[indexOfFolder].timestamp = oldestTimestamp;
        folders[indexOfFolder].date = oldestDate;
        this.storage.get("sortByDate").then((sortByDate) => {
          if (sortByDate) {
            folders.sort(this.compareDates.bind(this));
          }

          this.storage.set("folders", folders).then( () => {
            this.events.publish('passagesChanged');
          });
        });
      }
      else {
        let toast = this.toastCtrl.create({
          message: 'Failed to update folder: ' + args.folder,
          duration: 2000,
          position: 'bottom'
        });
        toast.present();
      }
    });
  }

  compareDates(a, b) {
    return a.timestamp - b.timestamp;
  }

  compareNames(a, b) {
    if (a.reference < b.reference) return -1;
    return 1;
  }

  compareReferences(a, b){
    var bookA = a.reference.replace(/ [0-9].*/g, '');
    var bookB = b.reference.replace(/ [0-9].*/g, '');
    var bookAOrder = this.bookOrder.get(bookA);
    var bookBOrder = this.bookOrder.get(bookB);
    if (bookAOrder != bookBOrder) {
      return bookAOrder - bookBOrder;
    }

    var chapterAndVersesA = a.reference.replace(/^[1-3]?[a-zA-Z ]+ /, '');
    var chapterAndVersesB = b.reference.replace(/^[1-3]?[a-zA-Z ]+ /, '');
    var chapterA = chapterAndVersesA.replace(/:.*/, '');
    var chapterB = chapterAndVersesB.replace(/:.*/, '');
    if (chapterA != chapterB) {
      return chapterA - chapterB;
    }

    if (!chapterAndVersesA.includes(":")) {
      return -1;
    }
    if (!chapterAndVersesB.includes(":")) {
      return 1;
    }

    var versesA = chapterAndVersesA.replace(/[0-9]+:/, '');
    var versesB = chapterAndVersesB.replace(/[0-9]+:/, '');
    var startVerseA = versesA.replace(/-[0-9]+/, '');
    var startVerseB = versesB.replace(/-[0-9]+/, '');
    if (startVerseA != startVerseB) {
      return startVerseA - startVerseB;
    }

    if (!versesA.includes("-")) {
      return -1;
    }
    if (!versesB.includes("-")) {
      return 1;
    }

    var endVerseA = versesA.replace(/[0-9]+-/, '');
    var endVerseB = versesB.replace(/[0-9]+-/, '');
    if (!endVerseA) {
      return -1;
    }
    if (!endVerseB) {
      return 1;
    }
    return endVerseA - endVerseB;
  }
}
