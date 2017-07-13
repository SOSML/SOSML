/*

Defines APIs used by the frontend.
Interfaces with both the client side interpreter and the server side fallback.

*/

export enum FileType {
    LOCAL = 1,
    SERVER
}

export interface File {
    name: string;
    type: FileType;
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
    private dbRequest: any;

    static getInstance(): Promise<Database> {
        if (Database.instance == null) {
            Database.instance = new Database();
        }
        return Database.instance.getReady();
    }

    getReady(): Promise<Database> {
        return new Promise((resolve: (val: any) => void, reject: (err: any) => void) => {
            if (this.database != null) {
                resolve(this);
            } else if (this.dbRequest == null) {
                this.init();
            }
            this.dbRequest.onsuccess = (event: any) => {
                this.database = event.target.result;
                resolve(this);
            };
            this.dbRequest.onerror = (error: any) => {
                reject('Database could not be loaded');
            };
        });
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
                        type: FileType.LOCAL
                    });
                    cursor.continue();
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

    private init(): void {
        this.dbRequest = window.indexedDB.open('FilesDB', 1);
        this.dbRequest.onupgradeneeded = (event: any) => {
            let db = event.target.result;
            db.createObjectStore('files', { keyPath: 'name'});
        };
        this.dbRequest.onsuccess = (event: any) => {
            this.database = event.target.result;
        };
    }
}
