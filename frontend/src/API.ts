/*

Defines APIs used by the frontend.
Interfaces with both the client side interpreter and the server side fallback.

*/

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
}
