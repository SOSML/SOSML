/*

Defines APIs used by the frontend.
Interfaces with both the client side interpreter and the server side fallback.

*/

export enum Location {
    LOCAL = 1
}

export interface File {
    name: string;
    location: Location;
}

export class API {
    static EMULATE: boolean = true;

    static fallbackInterpreter(code: string): Promise<string> {
        if (API.EMULATE) {
            return new Promise(
                (resolve: (val: any) => void, reject: (err: any) => void) => {
                    resolve('Hi this is just a test output!\n' +
                        'Real output might just be around the corner!\n' +
                        'Just some more filler text. And even more! WOW!\n' +
                        code
                    );
                }
            );
        }
        return fetch('/api/fallback/',
            {
                headers: {
                  'Accept': 'text/plain',
                  'Content-Type': 'application/json'
                },
                method: 'POST',
                body: JSON.stringify({'code': code})
            }
        ).then(function(response: any){
            return response.text();
        });
    }

    static shareCode(code: string): Promise<string> {
        if (API.EMULATE) {
            return new Promise(
                (resolve: (val: any) => void, reject: (err: any) => void) => {
                    resolve('0123456');
                }
            );
        }
        return fetch('/api/share/',
            {
                headers: {
                  'Accept': 'text/plain',
                  'Content-Type': 'application/json'
                },
                method: 'POST',
                body: JSON.stringify({'code': code})
            }
        ).then(function(response: any){
            return response.text();
        });
    }
}

export class Database {
    private static instance: Database;
    private database: IDBDatabase;

    static getInstance(): Database {
        if (Database.instance == null) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    init(): void {
        let request = window.indexedDB.open('FilesDB', 1);
        request.onupgradeneeded = (event: any) => {
            let db = event.target.result;
            db.createObjectStore('files', { keyPath: 'name'});
        };
        request.onsuccess = (event: any) => {
            this.database = event.target.result;
        };
    }

    getFiles(): Promise<File[]> {
        return new Promise( (resolve: (val: any) => void, reject: (err: any) => void) => {
            let cursorReq = this.database.transaction(['files']).objectStore('files').openCursor();
            cursorReq.onerror = (event: any) => {
                reject('Error during read');
            };
            let files: File[] = [];
            cursorReq.onsuccess = (event: any) => {
                let cursor = event.target.result;
                if (cursor) {
                    files.push({
                        name: cursor.key,
                        location: Location.LOCAL
                    });
                } else {
                    resolve(files);
                }
            };
        });
    }

    saveFile(name: string, content: string): Promise<boolean> {
        return new Promise( (resolve: (val: any) => void, reject: (err: any) => void) => {
            let request = this.database.transaction(['files'], 'readwrite').objectStore('files').put({
                name, value: content
            });
            request.onerror = (event) => {
                reject(false);
            };
            request.onsuccess = (event) => {
                resolve(true);
            };
        });
    }

    getFile(name: string): Promise<string> {
        return new Promise( (resolve: (val: any) => void, reject: (err: any) => void) => {
            let request = this.database.transaction(['files']).objectStore('files').get(name);
            request.onerror = (event) => {
                reject('Error during read');
            };
            request.onsuccess = (event: any) => {
                resolve(event.target.result.value);
            };
        });
    }
}
