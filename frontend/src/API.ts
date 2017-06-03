/*

Defines APIs used by the frontend.
Interfaces with both the client side interpreter and the server side fallback.

*/

export class API {
    static fallbackInterpreter(code: string) : Promise<string> {
        return fetch("/api/fallback/",
            {
                headers: {
                  'Accept': 'text/plain',
                  'Content-Type': 'application/json'
                },
                method: "POST",
                body: JSON.stringify({'code': code})
            }
        ).then(function(response){
            return response.text();
        });
    }
}
